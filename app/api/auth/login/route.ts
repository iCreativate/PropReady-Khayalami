import { NextRequest, NextResponse } from 'next/server';
import {
    ensureAuthAccountForProfile,
    verifyAccountPassword,
    getRequestMeta,
} from '@/lib/auth-enterprise';
import { parseAccountType, profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';
import { createServiceClient } from '@/lib/supabase-admin';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { normalizeFfcNumber, validateFfcNumber } from '@/lib/ppra';
import {
    isProfessionalAccountApproved,
    isProfessionalAccountType,
    professionalApprovalError,
} from '@/lib/professional-approval';
import { issueLoginOtpChallenge } from '@/lib/auth-login-otp';

type ProfileRow = {
    id: string;
    email: string;
    password?: string | null;
    status?: string | null;
    ffc_number?: string | null;
    organization_id?: string | null;
    staff_number?: string | null;
    full_name?: string | null;
};

/**
 * Step 1 of login: validate credentials, then email a one-time code.
 * Session cookies are only set after OTP verification.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        const accountType = parseAccountType(body.type);
        const rememberDevice = Boolean(body.rememberDevice ?? body.rememberMe);
        const ffcNumber = normalizeFfcNumber(String(body.ffcNumber || ''));
        const organizationId = String(body.organizationId || '').trim();
        const staffNumber = String(body.staffNumber || '')
            .trim()
            .toUpperCase();
        getRequestMeta(request); // touch for future audit hooks

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
        }

        if (accountType === 'agent') {
            if (!ffcNumber || ffcNumber.length !== 15 || !validateFfcNumber(ffcNumber)) {
                return NextResponse.json(
                    { success: false, error: 'A valid 15-digit FFC number is required' },
                    { status: 400 }
                );
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
            if (staffNumber.length < 4) {
                return NextResponse.json(
                    { success: false, error: 'Originator staff number is required' },
                    { status: 400 }
                );
            }
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const table = profileTableForAccountType(accountType);
        const { data, error } = await supabase.from(table).select('*').eq('email', email).maybeSingle();

        if (error || !data) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        const profile = data as ProfileRow;

        if (accountType === 'agent') {
            const storedFfc = normalizeFfcNumber(String(profile.ffc_number || ''));
            if (storedFfc && storedFfc !== ffcNumber) {
                return NextResponse.json(
                    { success: false, error: 'FFC number does not match this agent account' },
                    { status: 401 }
                );
            }
            if (!storedFfc) {
                const { error: ffcUpdateError } = await supabase
                    .from('agents')
                    .update({ ffc_number: ffcNumber })
                    .eq('id', profile.id);
                if (ffcUpdateError) {
                    console.error('auth/login agent ffc save:', ffcUpdateError);
                }
            }
        }

        if (accountType === 'originator') {
            if (profile.organization_id && profile.organization_id !== organizationId) {
                return NextResponse.json(
                    { success: false, error: 'Organisation does not match this staff account' },
                    { status: 401 }
                );
            }
            const storedStaff = String(profile.staff_number || '')
                .trim()
                .toUpperCase();
            if (storedStaff && storedStaff !== staffNumber) {
                return NextResponse.json(
                    { success: false, error: 'Staff number does not match this originator account' },
                    { status: 401 }
                );
            }
            if (!storedStaff) {
                const { error: staffUpdateError } = await supabase
                    .from('originators')
                    .update({ staff_number: staffNumber, organization_id: organizationId })
                    .eq('id', profile.id);
                if (staffUpdateError) {
                    console.error('auth/login originator staff save:', staffUpdateError);
                    if (staffUpdateError.code === '23505') {
                        return NextResponse.json(
                            {
                                success: false,
                                error: 'That staff number is already registered for this organisation',
                            },
                            { status: 409 }
                        );
                    }
                }
            }
        }

        const account = await ensureAuthAccountForProfile(email, accountType, profile.id);

        const valid = await verifyAccountPassword(account, password);
        if (!valid) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        if (isProfessionalAccountType(accountType) && !isProfessionalAccountApproved(profile.status)) {
            return NextResponse.json(
                {
                    success: false,
                    error: professionalApprovalError(profile.status),
                    needsApproval: true,
                    status: profile.status || 'pending',
                },
                { status: 403 }
            );
        }

        const otp = await issueLoginOtpChallenge({
            account,
            email,
            accountType,
            profileId: profile.id,
            rememberDevice,
            fullName: profile.full_name,
        });

        if (!otp.ok) {
            return NextResponse.json({ success: false, error: otp.error }, { status: otp.status });
        }

        return NextResponse.json({
            success: true,
            needsOtp: true,
            challengeToken: otp.challengeToken,
            email: otp.email,
            message: 'We sent a one-time code to your email. Enter it to finish signing in.',
            ...(otp.devOtp ? { devOtp: otp.devOtp } : {}),
        });
    } catch (err) {
        console.error('auth/login:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
