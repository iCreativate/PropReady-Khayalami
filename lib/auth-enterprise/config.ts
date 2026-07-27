export const AUTH_CONFIG = {
    accessTokenTtlSeconds: 15 * 60,
    refreshTokenTtlSeconds: 7 * 24 * 60 * 60,
    trustedRefreshTtlSeconds: 30 * 24 * 60 * 60,
    inactivityTimeoutSeconds: 30 * 60,
    maxConcurrentSessions: 5,
    magicLinkTtlSeconds: 15 * 60,
    passwordResetTtlSeconds: 60 * 60,
    oauthStateTtlSeconds: 10 * 60,
    cookieNames: {
        access: 'pr_access',
        refresh: 'pr_refresh',
        trustedDevice: 'pr_trusted',
        oauthState: 'pr_oauth_state',
    },
    argon2: {
        type: 2 as const, // argon2id
        // Keep under Netlify/serverless memory limits (64MiB default often OOMs)
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
    },
} as const;

export type AccountType = 'user' | 'agent' | 'originator';
export type OAuthProvider = 'google' | 'apple';

/** Production canonical URL — never fall back to localhost in deployed builds. */
export const PRODUCTION_APP_URL = 'https://propready.live';

export function getAuthSecret(): string {
    const secret = process.env.AUTH_JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('AUTH_JWT_SECRET or NEXTAUTH_SECRET (32+ chars) is required');
    }
    return secret;
}

function isLocalhostUrl(url: string): boolean {
    try {
        const host = new URL(url).hostname;
        return host === 'localhost' || host === '127.0.0.1' || host === '::1';
    } catch {
        return /localhost|127\.0\.0\.1/i.test(url);
    }
}

/**
 * Public site origin for OAuth redirects, magic links, etc.
 * In production, ignores localhost env misconfigs (common when .env.example is copied to Netlify).
 */
export function getAppUrl(requestOrigin?: string | null): string {
    if (process.env.NODE_ENV === 'development') {
        return (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
    }

    // Prefer the live request host when it's a real public origin (OAuth callbacks).
    if (requestOrigin) {
        const origin = requestOrigin.replace(/\/$/, '');
        if (!isLocalhostUrl(origin)) return origin;
    }

    const fromEnv = (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        ''
    ).replace(/\/$/, '');

    if (fromEnv && !isLocalhostUrl(fromEnv)) {
        return fromEnv;
    }

    return PRODUCTION_APP_URL;
}
