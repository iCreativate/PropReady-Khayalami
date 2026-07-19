import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromRequest, setAuthCookies } from '@/lib/auth-enterprise';
import { rotateRefreshToken, getRequestMeta } from '@/lib/auth-enterprise';
import { verifyAccessToken } from '@/lib/auth-enterprise/tokens';
import { touchSession } from '@/lib/auth-enterprise/sessions';

export async function POST(request: NextRequest) {
    const { access, refresh, trusted } = getTokensFromRequest(request);
    const meta = getRequestMeta(request);

    if (access) {
        const payload = await verifyAccessToken(access);
        if (payload) {
            await touchSession(payload.sessionId);
            return NextResponse.json({ success: true, expiresIn: 900 });
        }
    }

    if (!refresh) {
        return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 });
    }

    const rotated = await rotateRefreshToken(refresh, { ...meta, trustedDevice: trusted });
    if (!rotated) {
        return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, expiresIn: rotated.expiresIn });
    setAuthCookies(response, rotated.accessToken, rotated.refreshToken, trusted);
    return response;
}
