import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromRequest, clearAuthCookies, revokeSessionByRefreshToken } from '@/lib/auth-enterprise';
import { verifyAccessToken } from '@/lib/auth-enterprise/tokens';
import { revokeSession } from '@/lib/auth-enterprise/sessions';

export async function POST(request: NextRequest) {
    const { access, refresh } = getTokensFromRequest(request);

    if (refresh) {
        await revokeSessionByRefreshToken(refresh, { recordLogout: true });
    } else if (access) {
        const payload = await verifyAccessToken(access);
        if (payload?.sessionId) await revokeSession(payload.sessionId, { recordLogout: true });
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
}
