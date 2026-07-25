import { hydrateDemoUserSession } from '@/lib/demo-user-session';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export type BridgedSessionUser = {
    id: string;
    fullName?: string;
    email: string;
    company?: string;
    organizationId?: string;
    accountType?: 'user' | 'agent' | 'originator';
};

export function syncLegacySession(
    user: BridgedSessionUser,
    accountType: 'user' | 'agent' | 'originator' = user.accountType || 'user'
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
    } else if (accountType === 'originator') {
        localStorage.setItem(
            'propReady_currentOriginator',
            JSON.stringify({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                organizationId: user.organizationId || user.company,
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

        const accountType: 'user' | 'agent' | 'originator' =
            data.user.accountType === 'agent'
                ? 'agent'
                : data.user.accountType === 'originator'
                  ? 'originator'
                  : 'user';
        const bridged: BridgedSessionUser = {
            id: data.user.profileId || data.user.accountId,
            fullName: data.user.fullName,
            email: data.user.email,
            company: data.user.company,
            organizationId: data.user.organizationId,
            accountType,
        };
        syncLegacySession(bridged, accountType);
        return bridged;
    } catch {
        return null;
    }
}
