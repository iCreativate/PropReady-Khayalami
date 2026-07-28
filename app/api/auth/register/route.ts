import { NextRequest, NextResponse } from 'next/server';
import { validatePassword } from '@/lib/password';
import { upsertAccountFromProfile } from '@/lib/auth-enterprise';
import { parseAccountType, profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';
import { createServiceClient } from '@/lib/supabase-admin';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { validateProfessionalWorkEmail } from '@/lib/professional-email';
import {
    duplicateEmailConflictResponse,
    findExistingAccountsByEmail,
} from '@/lib/email-availability';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        const fullName = String(body.fullName || '').trim();
        const accountType = parseAccountType(body.type);
        const organizationId = String(body.organizationId || '').trim();
        const staffNumberRaw = String(body.staffNumber || '')
            .trim()
            .toUpperCase();
        // Staff numbers are PropReady-assigned on approval; optional only if provided explicitly
        const staffNumber = staffNumberRaw.length >= 4 ? staffNumberRaw : '';

        if (!email || !password || !fullName) {
            return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Netlify, then redeploy.',
                },
                { status: 503 }
            );
        }

        if (accountType === 'agent' || accountType === 'originator') {
            const emailError = validateProfessionalWorkEmail(email);
            if (emailError) {
                return NextResponse.json({ success: false, error: emailError }, { status: 400 });
            }
        }
        if (accountType === 'originator') {
            const validOrg = BOND_ORIGINATORS.some((o) => o.id === organizationId);
            if (!validOrg) {
                return NextResponse.json(
                    { success: false, error: 'Select a valid bond originator organisation' },
                    { status: 400 }
                );
            }
        }

        const pw = validatePassword(password);
        if (!pw.valid) {
            return NextResponse.json({ success: false, error: pw.errors.join(', ') }, { status: 400 });
        }

        const existingHits = await findExistingAccountsByEmail(email);
        if (existingHits.length > 0) {
            return NextResponse.json(duplicateEmailConflictResponse(existingHits), { status: 409 });
        }

        const table = profileTableForAccountType(accountType);
        const id = crypto.randomUUID();
        const row =
            accountType === 'agent'
                ? { id, full_name: fullName, email, password: '', status: 'pending' }
                : accountType === 'originator'
                  ? {
                        id,
                        full_name: fullName,
                        email,
                        password: '',
                        organization_id: organizationId,
                        ...(staffNumber ? { staff_number: staffNumber } : {}),
                        status: 'pending',
                    }
                  : { id, full_name: fullName, email, password: '' };

        const { data: profile, error } = await supabase
            .from(table)
            .insert(row as Record<string, unknown>)
            .select('id')
            .single();
        if (error || !profile) {
            console.error('auth/register profile insert:', error);
            if (error?.code === '23505') {
                const hits = await findExistingAccountsByEmail(email);
                if (hits.length) {
                    return NextResponse.json(duplicateEmailConflictResponse(hits), { status: 409 });
                }
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            accountType === 'originator'
                                ? 'That staff number is already registered for this organisation, or the email is taken'
                                : 'An account with this email already exists. Please log in or reset your password.',
                        code: 'EMAIL_EXISTS',
                        loginPath: accountType === 'originator' ? '/originators/login' : '/auth/login',
                        resetPasswordPath: `/auth/forgot-password?type=${accountType}`,
                    },
                    { status: 409 }
                );
            }
            return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 });
        }

        await upsertAccountFromProfile(email, accountType, profile.id, password);

        return NextResponse.json({
            success: true,
            needsVerification: true,
            needsApproval: accountType === 'agent' || accountType === 'originator',
            email,
            accountType,
            message:
                    accountType === 'originator'
                        ? 'Verify your email, then wait for PropReady admin approval. Your staff number will be emailed when you are approved.'
                        : accountType === 'agent'
                          ? 'Verify your email, then wait for PropReady admin approval before signing in.'
                          : 'Check your email to verify your account before signing in.',
        });
    } catch (err) {
        console.error('auth/register:', err);
        const message = err instanceof Error ? err.message : 'Server error';
        const status =
            /Enterprise auth tables are missing|Database not configured/i.test(message)
                ? 503
                : 500;
        return NextResponse.json(
            {
                success: false,
                error:
                    status === 503
                        ? message
                        : /argon2|memory|hash/i.test(message)
                          ? 'Could not secure your password. Please try again in a moment.'
                          : message.startsWith('Enterprise') ||
                              message.includes('already') ||
                              message.length < 160
                            ? message
                            : 'Server error',
            },
            { status }
        );
    }
}
