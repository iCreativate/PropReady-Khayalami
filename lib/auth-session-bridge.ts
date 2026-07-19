import { hydrateDemoUserSession } from '@/lib/demo-user-session';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export type BridgedSessionUser = {
    id: string;
    fullName?: string;
    email: string;
    company?: string;
    accountType?: 'user' | 'agent';
};

export function syncLegacySession(
    user: BridgedSessionUser,
    accountType: 'user' | 'agent' = user.accountType || 'user'
) {
    if (typeof window === 'undefined') return;
    if (accountType === 'agent') {
        localStorage.setItem(
            STORAGE_KEYS.currentAgent,
            JSON.stringify({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                company: user.company,
            })
        );
    } else {
        localStorage.setItem(
            STORAGE_KEYS.currentUser,
            JSON.stringify({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
            })
        );
        hydrateDemoUserSession(user.email);
    }
}

/** Hydrate localStorage from cookie session API. Returns profile id or null. */
export async function hydrateSessionFromCookies(): Promise<BridgedSessionUser | null> {
    try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.authenticated || !data.user) return null;

        const accountType: 'user' | 'agent' =
            data.user.accountType === 'agent' ? 'agent' : 'user';
        const bridged: BridgedSessionUser = {
            id: data.user.profileId || data.user.accountId,
            fullName: data.user.fullName,
            email: data.user.email,
            company: data.user.company,
            accountType,
        };
        syncLegacySession(bridged, accountType);
        return bridged;
    } catch {
        return null;
    }
}
