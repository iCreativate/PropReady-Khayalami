import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './tokens';
import { AUTH_CONFIG } from './config';
import type { AccessTokenPayload } from './types';

/**
 * Edge-safe session check for middleware.
 * Only verifies the JWT access token — no Node crypto / argon2 / DB.
 * Refresh-token rotation stays in Node API routes (`/api/auth/refresh`, `/api/auth/session`).
 */
export async function getEdgeAuthFromRequest(
    request: NextRequest
): Promise<{ payload: AccessTokenPayload; hasRefresh: boolean } | null> {
    const access = request.cookies.get(AUTH_CONFIG.cookieNames.access)?.value;
    const refresh = request.cookies.get(AUTH_CONFIG.cookieNames.refresh)?.value;

    if (access) {
        const payload = await verifyAccessToken(access);
        if (payload) {
            return { payload, hasRefresh: Boolean(refresh) };
        }
    }

    // Access expired but refresh present — allow through to app;
    // client/API will rotate via /api/auth/refresh or /api/auth/session.
    if (refresh) {
        return {
            payload: {
                sub: '',
                email: '',
                accountType: 'user',
                profileId: '',
                sessionId: '',
                profileComplete: false,
                passwordOk: true,
                hasPassword: true,
                typ: 'access',
            },
            hasRefresh: true,
        };
    }

    return null;
}

export function edgeLoginPath(pathname: string) {
    if (pathname.startsWith('/agents')) return '/agents/login';
    if (pathname.startsWith('/originators')) return '/originators/login';
    return '/auth/login';
}

export function edgeDashboardPath(accountType?: string) {
    if (accountType === 'agent') return '/agents/dashboard';
    if (accountType === 'originator') return '/originators/dashboard';
    return '/dashboard';
}

export function edgeProfileCompletePath(accountType?: string) {
    if (accountType === 'agent') return '/auth/complete-profile?type=agent';
    if (accountType === 'originator') return '/auth/complete-profile?type=originator';
    return '/auth/complete-profile';
}

export function edgeConfirmPasswordPath(accountType?: string) {
    if (accountType === 'agent') return '/auth/confirm-password?type=agent';
    if (accountType === 'originator') return '/auth/confirm-password?type=originator';
    return '/auth/confirm-password';
}

/** Where to send a magic-link session that still needs a password step. */
export function edgePasswordGatePath(payload: Pick<AccessTokenPayload, 'accountType' | 'hasPassword'>) {
    if (payload.hasPassword === false) {
        return edgeProfileCompletePath(payload.accountType);
    }
    return edgeConfirmPasswordPath(payload.accountType);
}
