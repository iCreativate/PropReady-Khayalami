import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { AUTH_CONFIG } from './config';

const isProd = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
};

export function setAuthCookies(
    response: NextResponse,
    accessToken: string,
    refreshToken: string,
    trustedDevice?: boolean
) {
    response.cookies.set(AUTH_CONFIG.cookieNames.access, accessToken, {
        ...baseCookieOptions,
        maxAge: AUTH_CONFIG.accessTokenTtlSeconds,
    });
    response.cookies.set(AUTH_CONFIG.cookieNames.refresh, refreshToken, {
        ...baseCookieOptions,
        maxAge: trustedDevice
            ? AUTH_CONFIG.trustedRefreshTtlSeconds
            : AUTH_CONFIG.refreshTokenTtlSeconds,
    });
    if (trustedDevice) {
        response.cookies.set(AUTH_CONFIG.cookieNames.trustedDevice, '1', {
            ...baseCookieOptions,
            maxAge: AUTH_CONFIG.trustedRefreshTtlSeconds,
        });
    }
}

export function clearAuthCookies(response: NextResponse) {
    for (const name of Object.values(AUTH_CONFIG.cookieNames)) {
        response.cookies.set(name, '', { ...baseCookieOptions, maxAge: 0 });
    }
}

export function getTokensFromRequest(request: NextRequest) {
    return {
        access: request.cookies.get(AUTH_CONFIG.cookieNames.access)?.value,
        refresh: request.cookies.get(AUTH_CONFIG.cookieNames.refresh)?.value,
        trusted: request.cookies.get(AUTH_CONFIG.cookieNames.trustedDevice)?.value === '1',
    };
}

export async function getTokensFromCookies() {
    const jar = await cookies();
    return {
        access: jar.get(AUTH_CONFIG.cookieNames.access)?.value,
        refresh: jar.get(AUTH_CONFIG.cookieNames.refresh)?.value,
        trusted: jar.get(AUTH_CONFIG.cookieNames.trustedDevice)?.value === '1',
    };
}
