import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink, setAuthCookies } from '@/lib/auth-enterprise';
import { getRequestMeta } from '@/lib/auth-enterprise/request-meta';
import type { AccountType } from '@/lib/auth-enterprise';

export async function POST(request: NextRequest) {
    const { token, type = 'user', trustedDevice = true } = await request.json();
    if (!token) {
        return NextResponse.json({ success: false, error: 'Invalid link' }, { status: 400 });
    }

    const accountType: AccountType = type === 'agent' ? 'agent' : 'user';
    const meta = getRequestMeta(request);
    const session = await verifyMagicLink(String(token), accountType, {
        ...meta,
        trustedDevice: Boolean(trustedDevice),
    });

    if (!session) {
        return NextResponse.json({ success: false, error: 'Invalid or expired link' }, { status: 400 });
    }

    const hasPassword = Boolean(session.user.hasPassword);
    const typeQ = accountType === 'agent' ? '?type=agent' : '';

    // Always require a password step after magic link
    const redirectTo = hasPassword
        ? `/auth/confirm-password${typeQ}`
        : `/auth/complete-profile${typeQ}`;

    const response = NextResponse.json({
        success: true,
        accountType,
        hasPassword,
        profileComplete: session.user.profileComplete !== false,
        redirectTo,
    });
    setAuthCookies(response, session.accessToken, session.refreshToken, true);
    return response;
}
