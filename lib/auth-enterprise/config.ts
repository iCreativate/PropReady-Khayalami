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
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    },
} as const;

export type AccountType = 'user' | 'agent';
export type OAuthProvider = 'google' | 'apple' | 'microsoft';

export function getAuthSecret(): string {
    const secret = process.env.AUTH_JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('AUTH_JWT_SECRET or NEXTAUTH_SECRET (32+ chars) is required');
    }
    return secret;
}

export function getAppUrl(): string {
    return (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        'http://localhost:3000'
    ).replace(/\/$/, '');
}
