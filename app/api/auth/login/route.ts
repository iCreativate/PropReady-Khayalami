import { NextRequest, NextResponse } from 'next/server';
import {
    createSession,
    ensureAuthAccountForProfile,
    markEmailVerified,
    setAuthCookies,
    verifyAccountPassword,
    getRequestMeta,
} from '@/lib/auth-enterprise';
import { parseAccountType, profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';
import { createServiceClient } from '@/lib/supabase-admin';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { normalizeFfcNumber, validateFfcNumber } from '@/lib/ppra';

type ProfileRow = {
    id: string;
    email: string;
    password?: string | null;
    ffc_number?: string | null;
    organization_id?: string | null;
    staff_number?: string | null;
};

function toLegacyUser(user: Awaited<ReturnType<typeof createSession>>['user']) {
    if (user.accountType === 'agent') {
        return {
            id: user.profileId,
            fullName: user.fullName,
            email: user.email,
            company: user.company,
            phone: user.phone,
            plan: user.plan || 'free',
            sellerPlan: user.sellerPlan || 'none',
            ppraNumber: user.ppraNumber,
            verificationStatus: user.verificationStatus,
            status: user.status,
            accountType: 'agent' as const,
        };
    }
    if (user.accountType === 'originator') {
        return {
            id: user.profileId,
            fullName: user.fullName,
            email: user.email,
            organizationId: user.organizationId,
            company: user.company,
            phone: user.phone,
            status: user.status,
            accountType: 'originator' as const,
        };
    }
    return { id: user.profileId, fullName: user.fullName, email: user.email, accountType: 'user' as const };
}

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
        const meta = getRequestMeta(request);

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

        if (!account.email_verified_at) {
            await markEmailVerified(account.id);
        }

        const session = await createSession(
            { ...account, email_verified_at: account.email_verified_at ?? new Date().toISOString() },
            { ...meta, trustedDevice: rememberDevice }
        );

        const response = NextResponse.json({
            success: true,
            user: toLegacyUser(session.user),
            expiresIn: session.expiresIn,
        });
        setAuthCookies(response, session.accessToken, session.refreshToken, rememberDevice);
        return response;
    } catch (err) {
        console.error('auth/login:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
