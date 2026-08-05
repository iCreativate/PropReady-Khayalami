import { PRODUCTION_APP_URL } from '@/lib/auth-enterprise/config';

function isEphemeralHost(url: string): boolean {
    try {
        const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase();
        return (host.includes('--') && host.endsWith('.netlify.app')) || host.endsWith('.vercel.app');
    } catch {
        return true;
    }
}

/** Canonical absolute site origin for Open Graph / share previews. */
export function getSiteUrl(): string {
    const candidates = [
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.NEXTAUTH_URL,
        process.env.URL,
        process.env.DEPLOY_PRIME_URL,
    ];

    for (const raw of candidates) {
        const fromEnv = (raw || '').trim().replace(/\/$/, '');
        if (!fromEnv || /localhost|127\.0\.0\.1/i.test(fromEnv) || isEphemeralHost(fromEnv)) {
            continue;
        }
        return fromEnv.startsWith('http') ? fromEnv : `https://${fromEnv}`;
    }

    if (process.env.NODE_ENV === 'production') {
        return PRODUCTION_APP_URL;
    }

    return 'http://localhost:3000';
}
