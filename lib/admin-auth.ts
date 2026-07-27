import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest, NextResponse } from 'next/server';
import { getAuthSecret } from '@/lib/auth-enterprise/config';

const ADMIN_COOKIE = 'pr_admin';
const ADMIN_TTL = '12h';
const isProd = process.env.NODE_ENV === 'production';

/**
 * Admin access for PropReady staff dashboards (email allowlist from env).
 * Never link /admin from the public app — staff open it directly.
 */
export function getAdminEmails(): string[] {
    return (process.env.ADMIN_EMAILS || process.env.PROPREADY_ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    return getAdminEmails().includes(normalized);
}

export function assertAdmin(email: string | null | undefined): { ok: true } | { ok: false; error: string } {
    if (!getAdminEmails().length) {
        return { ok: false, error: 'Admin access not configured. Set ADMIN_EMAILS in environment.' };
    }
    if (!isAdminEmail(email)) {
        return { ok: false, error: 'Unauthorized admin access' };
    }
    return { ok: true };
}

type AdminTokenPayload = {
    typ: 'admin';
    email: string;
};

function secretKey() {
    return new TextEncoder().encode(getAuthSecret());
}

export async function signAdminSession(email: string): Promise<string> {
    return new SignJWT({ typ: 'admin' as const, email: email.toLowerCase().trim() })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ADMIN_TTL)
        .setIssuer('propready')
        .setAudience('propready-admin')
        .sign(secretKey());
}

export async function verifyAdminSessionToken(token: string): Promise<AdminTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey(), {
            issuer: 'propready',
            audience: 'propready-admin',
        });
        if (payload.typ !== 'admin' || typeof payload.email !== 'string') return null;
        if (!isAdminEmail(payload.email)) return null;
        return { typ: 'admin', email: payload.email };
    } catch {
        return null;
    }
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
    response.cookies.set(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 12 * 60 * 60,
    });
}

export function clearAdminSessionCookie(response: NextResponse) {
    response.cookies.set(ADMIN_COOKIE, '', {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
}

export async function getAdminEmailFromRequest(request: NextRequest): Promise<string | null> {
    const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!cookie) return null;
    const session = await verifyAdminSessionToken(cookie);
    return session?.email ?? null;
}

export async function assertAdminRequest(
    request: NextRequest,
    _bodyEmail?: string | null
): Promise<{ ok: true; email: string } | { ok: false; error: string; status: number }> {
    if (!getAdminEmails().length) {
        return {
            ok: false,
            error: 'Admin access not configured. Set ADMIN_EMAILS in environment.',
            status: 503,
        };
    }

    const email = await getAdminEmailFromRequest(request);
    if (email) return { ok: true, email };

    return { ok: false, error: 'Unauthorized admin access', status: 401 };
}

export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;

type AdminOtpChallenge = { typ: 'admin_otp'; email: string };

export async function signAdminOtpChallenge(email: string): Promise<string> {
    return new SignJWT({ typ: 'admin_otp' as const, email: email.toLowerCase().trim() })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('10m')
        .setIssuer('propready')
        .setAudience('propready-admin-otp')
        .sign(secretKey());
}

export async function verifyAdminOtpChallenge(token: string): Promise<AdminOtpChallenge | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey(), {
            issuer: 'propready',
            audience: 'propready-admin-otp',
        });
        if (payload.typ !== 'admin_otp' || typeof payload.email !== 'string') return null;
        return { typ: 'admin_otp', email: payload.email };
    } catch {
        return null;
    }
}
