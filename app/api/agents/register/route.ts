import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, formatPasswordErrors } from '@/lib/password';
import {
    normalizePpraNumber,
    normalizeFfcNumber,
    validatePpraNumber,
    validateFfcNumber,
    PPRA_NUMBER_ERROR,
    FFC_NUMBER_ERROR,
} from '@/lib/ppra';
import { createServiceClient } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config';
import { validateProfessionalWorkEmail } from '@/lib/professional-email';
import {
    duplicateEmailConflictResponse,
    findExistingAccountsByEmail,
} from '@/lib/email-availability';
import { normalizeBuyerPlan } from '@/lib/agent-plans';
import { ensureWelcomeAnnouncement } from '@/lib/welcome-announcement';

export async function POST(request: NextRequest) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    if (!supabaseUrl.startsWith('https://') || !supabaseAnonKey) {
        return NextResponse.json(
            { success: false, error: 'Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
            { status: 503 }
        );
    }

    try {
        const agentData = await request.json();

        if (!agentData?.id || !agentData?.email || !agentData?.fullName) {
            return NextResponse.json(
                { success: false, error: 'Invalid agent data' },
                { status: 400 }
            );
        }

        const emailError = validateProfessionalWorkEmail(String(agentData.email));
        if (emailError) {
            return NextResponse.json({ success: false, error: emailError }, { status: 400 });
        }
        const ppra = normalizePpraNumber(String(agentData.ppraNumber || agentData.eaabNumber || ''));
        if (!validatePpraNumber(ppra)) {
            return NextResponse.json({ success: false, error: PPRA_NUMBER_ERROR }, { status: 400 });
        }

        const ffcRaw = String(agentData.ffcNumber || '').trim();
        const ffc = ffcRaw ? normalizeFfcNumber(ffcRaw) : null;
        if (ffc && !validateFfcNumber(ffc)) {
            return NextResponse.json({ success: false, error: FFC_NUMBER_ERROR }, { status: 400 });
        }

        if (!agentData.ffcDocumentUrl) {
            return NextResponse.json(
                { success: false, error: 'Fidelity Fund Certificate document is required' },
                { status: 400 }
            );
        }

        const passwordCheck = validatePassword(agentData.password || '');
        if (!passwordCheck.valid) {
            return NextResponse.json(
                { success: false, error: formatPasswordErrors(passwordCheck) },
                { status: 400 }
            );
        }

        const registrationRole =
            String(agentData.registrationRole || agentData.role || 'agent').toLowerCase() ===
            'principal'
                ? 'principal'
                : 'agent';
        const selectedPlan = normalizeBuyerPlan(String(agentData.plan || 'free'));
        const trialStartedAt = new Date();
        const trialEndsAt = new Date(trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

        const supabase = createServiceClient() || createClient(supabaseUrl, supabaseAnonKey);

        const existingEmail = await findExistingAccountsByEmail(String(agentData.email));
        if (existingEmail.length > 0) {
            return NextResponse.json(duplicateEmailConflictResponse(existingEmail), { status: 409 });
        }

        const { data: duplicatePpra } = await supabase
            .from('agents')
            .select('id')
            .eq('ppra_number', ppra)
            .maybeSingle();

        if (duplicatePpra) {
            return NextResponse.json(
                { success: false, error: 'This PPRA Practitioner Number is already registered' },
                { status: 409 }
            );
        }

        const dbAgent: Record<string, unknown> = {
            id: agentData.id,
            full_name: agentData.fullName,
            email: String(agentData.email).toLowerCase().trim(),
            phone: agentData.phone,
            eaab_number: ppra,
            ppra_number: ppra,
            ffc_number: ffc,
            ffc_document_url: agentData.ffcDocumentUrl,
            company: agentData.company,
            city: agentData.city || null,
            registration_role: registrationRole,
            password: agentData.password,
            status: agentData.status || 'pending',
            plan: selectedPlan,
            seller_plan: 'none',
            plan_status: 'trialing',
            trial_started_at: trialStartedAt.toISOString(),
            trial_ends_at: trialEndsAt.toISOString(),
            plan_activated_at: null,
            plan_activated_by: null,
            email_verified: false,
            verification_status: 'pending',
            verification_date: null,
            verified_by: null,
            verification_notes: null,
            created_at: agentData.timestamp || new Date().toISOString(),
            updated_at: agentData.timestamp || new Date().toISOString(),
        };

        const { error } = await supabase.from('agents').insert([dbAgent]).select().single();

        if (error) {
            console.error('Supabase createAgent error:', error);
            const isDuplicate =
                error.code === '23505' || /unique|duplicate/i.test(error.message || '');
            const isMissingColumn = /column.*does not exist|Could not find.*column/i.test(
                error.message || ''
            );
            if (isMissingColumn) {
                const fallback = { ...dbAgent };
                delete fallback.ppra_number;
                delete fallback.ffc_number;
                delete fallback.ffc_document_url;
                delete fallback.verification_status;
                delete fallback.verification_date;
                delete fallback.verified_by;
                delete fallback.verification_notes;
                delete fallback.registration_role;
                delete fallback.plan_status;
                delete fallback.trial_started_at;
                delete fallback.trial_ends_at;
                delete fallback.plan_activated_at;
                delete fallback.plan_activated_by;
                const retry = await supabase.from('agents').insert([fallback]).select().single();
                if (retry.error) {
                    const retryDup =
                        retry.error.code === '23505' ||
                        /unique|duplicate/i.test(retry.error.message || '');
                    if (retryDup) {
                        const hits = await findExistingAccountsByEmail(String(agentData.email));
                        return NextResponse.json(
                            hits.length
                                ? duplicateEmailConflictResponse(hits)
                                : {
                                      success: false,
                                      error: 'An account with this email already exists. Please log in or reset your password.',
                                      code: 'EMAIL_EXISTS',
                                      loginPath: '/agents/login',
                                      resetPasswordPath: '/auth/forgot-password?type=agent',
                                  },
                            { status: 409 }
                        );
                    }
                    return NextResponse.json(
                        {
                            success: false,
                            error:
                                retry.error.message +
                                ' Run supabase/migrations/20260603_ppra_verification.sql in Supabase.',
                        },
                        { status: 500 }
                    );
                }
                return NextResponse.json({ success: true, warning: 'PPRA columns missing; run migration' });
            }
            if (isDuplicate) {
                const hits = await findExistingAccountsByEmail(String(agentData.email));
                return NextResponse.json(
                    hits.length
                        ? duplicateEmailConflictResponse(hits)
                        : {
                              success: false,
                              error: 'An account with this email or PPRA number already exists. Please log in or reset your password.',
                              code: 'EMAIL_EXISTS',
                              loginPath: '/agents/login',
                              resetPasswordPath: '/auth/forgot-password?type=agent',
                          },
                    { status: 409 }
                );
            }
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        void ensureWelcomeAnnouncement();

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API agents/register error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
