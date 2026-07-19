import { NextRequest, NextResponse } from 'next/server';
import { validatePassword } from '@/lib/password';
import {
    createSession,
    ensureAuthAccountForProfile,
    markEmailVerified,
    setAuthCookies,
    verifyAccountPassword,
    getRequestMeta,
} from '@/lib/auth-enterprise';
import { createServiceClient } from '@/lib/supabase-admin';
import type { AccountType } from '@/lib/auth-enterprise';

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
        };
    }
    return { id: user.profileId, fullName: user.fullName, email: user.email };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        const accountType: AccountType = body.type === 'agent' ? 'agent' : 'user';
        const rememberDevice = Boolean(body.rememberDevice ?? body.rememberMe);
        const meta = getRequestMeta(request);

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const table = accountType === 'agent' ? 'agents' : 'users';
        const { data: profile, error } = await supabase
            .from(table)
            .select('id, email, password')
            .eq('email', email)
            .maybeSingle();

        if (error || !profile) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
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
