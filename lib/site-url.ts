import { PRODUCTION_APP_URL } from '@/lib/auth-enterprise/config';

/** Canonical absolute site origin for Open Graph / share previews. */
export function getSiteUrl(): string {
    const fromEnv = (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        process.env.URL ||
        process.env.DEPLOY_PRIME_URL ||
        ''
    )
        .trim()
        .replace(/\/$/, '');

    if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
        return fromEnv.startsWith('http') ? fromEnv : `https://${fromEnv}`;
    }

    // Prefer production canonical URL in deployed builds even if env points at localhost.
    if (process.env.NODE_ENV === 'production') {
        return PRODUCTION_APP_URL;
    }

    return fromEnv || 'http://localhost:3000';
}
