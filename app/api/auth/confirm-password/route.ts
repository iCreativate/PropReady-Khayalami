import { NextRequest, NextResponse } from 'next/server';
import {
    confirmSessionPassword,
    findAccountById,
    setAuthCookies,
} from '@/lib/auth-enterprise';
import { dashboardPathForAccountType } from '@/lib/auth-enterprise/account-profile';
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
            const typeQ =
                account.account_type === 'agent'
                    ? '?type=agent'
                    : account.account_type === 'originator'
                      ? '?type=originator'
                      : '';
            return NextResponse.json(
                {
                    success: false,
                    error: 'No password on this account yet',
                    redirectTo: `/auth/complete-profile${typeQ}`,
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
        const typeQ =
            result.user.accountType === 'agent'
                ? '?type=agent'
                : result.user.accountType === 'originator'
                  ? '?type=originator'
                  : '';
        const redirectTo = needsProfile
            ? `/auth/complete-profile${typeQ}`
            : dashboardPathForAccountType(result.user.accountType);

        const response = NextResponse.json({
            success: true,
            profileComplete: !needsProfile,
            redirectTo,
        });
        setAuthCookies(response, result.accessToken, result.refreshToken, true);
        return response;
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not confirm password';
        const status = /Incorrect password/i.test(message) ? 401 : 500;
        if (status === 500) console.error('auth/confirm-password:', err);
        return NextResponse.json({ success: false, error: message }, { status });
    }
}
