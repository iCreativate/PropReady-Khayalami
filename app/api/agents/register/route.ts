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

        const supabase = createServiceClient() || createClient(supabaseUrl, supabaseAnonKey);

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
            email: agentData.email,
            phone: agentData.phone,
            eaab_number: ppra,
            ppra_number: ppra,
            ffc_number: ffc,
            ffc_document_url: agentData.ffcDocumentUrl,
            company: agentData.company,
            city: agentData.city || null,
            password: agentData.password,
            status: agentData.status || 'pending',
            plan: 'free',
            seller_plan: 'none',
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
                const retry = await supabase.from('agents').insert([fallback]).select().single();
                if (retry.error) {
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
            return NextResponse.json(
                {
                    success: false,
                    error: isDuplicate
                        ? 'An account with this email or PPRA number already exists'
                        : error.message,
                },
                { status: isDuplicate ? 409 : 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API agents/register error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
