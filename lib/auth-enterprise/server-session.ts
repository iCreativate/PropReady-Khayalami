import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './tokens';
import { getTokensFromRequest } from './cookies';
import { rotateRefreshToken, touchSession, findAccountById, loadSessionUser } from './sessions';
import { setAuthCookies } from './cookies';
import { getRequestMeta } from './request-meta';
import type { SessionUser } from './types';

export async function resolveSessionFromRequest(
    request: NextRequest
): Promise<{ user: SessionUser; accessToken: string; refreshToken?: string } | null> {
    const { access, refresh, trusted } = getTokensFromRequest(request);
    const meta = getRequestMeta(request);

    if (access) {
        const payload = await verifyAccessToken(access);
        if (payload) {
            const account = await findAccountById(payload.sub);
            if (account) {
                await touchSession(payload.sessionId);
                const user = await loadSessionUser(account);
                user.sessionId = payload.sessionId;
                user.passwordOk = payload.passwordOk !== false;
                return { user, accessToken: access };
            }
        }
    }

    if (refresh) {
        const rotated = await rotateRefreshToken(refresh, {
            ...meta,
            trustedDevice: trusted,
        });
        if (rotated) {
            return {
                user: rotated.user,
                accessToken: rotated.accessToken,
                refreshToken: rotated.refreshToken,
            };
        }
    }

    return null;
}

export function jsonWithSession(
    data: Record<string, unknown>,
    session: { accessToken: string; refreshToken?: string; trustedDevice?: boolean },
    init?: ResponseInit
) {
    const response = NextResponse.json(data, init);
    if (session.refreshToken) {
        setAuthCookies(response, session.accessToken, session.refreshToken, session.trustedDevice);
    }
    return response;
}
