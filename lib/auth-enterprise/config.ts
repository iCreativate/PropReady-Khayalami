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

export type AccountType = 'user' | 'agent' | 'originator' | 'conveyancer';
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

/** Non-throwing check for routes that should return 503 instead of crashing. */
export function hasAuthSecret(): boolean {
    const secret = process.env.AUTH_JWT_SECRET || process.env.NEXTAUTH_SECRET;
    return Boolean(secret && secret.length >= 32);
}

function isLocalhostUrl(url: string): boolean {
    try {
        const host = new URL(url).hostname;
        return host === 'localhost' || host === '127.0.0.1' || host === '::1';
    } catch {
        return /localhost|127\.0\.0\.1/i.test(url);
    }
}

/** Stable public hosts only — never ephemeral Netlify deploy IDs (`abc123--site.netlify.app`). */
const CANONICAL_APP_HOSTS = new Set([
    'propready.live',
    'www.propready.live',
    'prop-ready.co.za',
    'www.prop-ready.co.za',
]);

function hostnameOf(url: string): string | null {
    try {
        return new URL(url).hostname.toLowerCase();
    } catch {
        return null;
    }
}

/** True for deploy-preview / per-deploy Netlify URLs that break Google OAuth allowlists. */
function isEphemeralDeployUrl(url: string): boolean {
    const host = hostnameOf(url);
    if (!host) return true;
    // e.g. 6a7348b5dcb8da000851386d--stunning-crepe-c51be4.netlify.app
    if (host.includes('--') && host.endsWith('.netlify.app')) return true;
    if (host.endsWith('.vercel.app')) return true;
    return false;
}

function isAllowedPublicAppUrl(url: string): boolean {
    if (isLocalhostUrl(url) || isEphemeralDeployUrl(url)) return false;
    const host = hostnameOf(url);
    if (!host) return false;
    if (CANONICAL_APP_HOSTS.has(host)) return true;
    // Primary Netlify site subdomain (no deploy-id prefix) is acceptable as a fallback.
    if (/^[a-z0-9-]+\.netlify\.app$/i.test(host) && !host.includes('--')) return true;
    return false;
}

/**
 * Public site origin for OAuth redirects, magic links, etc.
 * In production, never trust ephemeral Netlify deploy hosts — they cause Google
 * `redirect_uri_mismatch` even when Console lists https://propready.live/.../callback.
 * In development, never use a production NEXTAUTH_URL — that causes the same mismatch on localhost.
 */
export function getAppUrl(requestOrigin?: string | null): string {
    if (process.env.NODE_ENV === 'development') {
        if (requestOrigin) {
            const origin = requestOrigin.replace(/\/$/, '');
            if (isLocalhostUrl(origin)) return origin;
        }
        const fromEnv = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(
            /\/$/,
            ''
        );
        if (fromEnv && isLocalhostUrl(fromEnv)) return fromEnv;
        return 'http://localhost:3000';
    }

    const fromEnv = (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        ''
    ).replace(/\/$/, '');

    // Prefer the configured canonical URL (must match Google authorized redirect URIs).
    if (fromEnv && isAllowedPublicAppUrl(fromEnv)) {
        return fromEnv;
    }

    // Only accept the live request host when it is a known stable domain.
    if (requestOrigin) {
        const origin = requestOrigin.replace(/\/$/, '');
        if (isAllowedPublicAppUrl(origin)) return origin;
    }

    return PRODUCTION_APP_URL;
}
