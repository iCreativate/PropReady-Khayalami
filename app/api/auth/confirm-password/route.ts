import { NextRequest, NextResponse } from 'next/server';
import {
    confirmSessionPassword,
    findAccountById,
    setAuthCookies,
} from '@/lib/auth-enterprise';
import { getRequestMeta } from '@/lib/auth-enterprise/request-meta';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';

export async function POST(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        const account = await findAccountById(session.user.accountId);
        if (!account) {
            return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
        }

        if (!account.password_hash) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No password on this account yet',
                    redirectTo:
                        account.account_type === 'agent'
                            ? '/auth/complete-profile?type=agent'
                            : '/auth/complete-profile',
                },
                { status: 400 }
            );
        }

        const body = await request.json();
        const password = String(body.password || '');
        if (!password) {
            return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
        }

        const meta = getRequestMeta(request);
        const result = await confirmSessionPassword(account, password, {
            ...meta,
            trustedDevice: true,
        });

        const needsProfile = result.user.profileComplete === false;
        const redirectTo = needsProfile
            ? result.user.accountType === 'agent'
                ? '/auth/complete-profile?type=agent'
                : '/auth/complete-profile'
            : result.user.accountType === 'agent'
              ? '/agents/dashboard'
              : '/dashboard';

        const response = NextResponse.json({
            success: true,
            profileComplete: !needsProfile,
            redirectTo,
        });
        setAuthCookies(response, result.accessToken, result.refreshToken, true);
        return response;
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not confirm password';
        const status = /incorrect password/i.test(message) ? 401 : 500;
        if (status === 500) console.error('auth/confirm-password:', err);
        return NextResponse.json({ success: false, error: message }, { status });
    }
}
