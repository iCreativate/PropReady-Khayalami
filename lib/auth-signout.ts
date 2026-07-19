import { STORAGE_KEYS } from '@/lib/storage-keys';

/** Clear cookie session + legacy localStorage, then hard-navigate to login. */
export async function signOutClient(options?: {
    accountType?: 'user' | 'agent';
    redirectTo?: string;
}) {
    const accountType = options?.accountType || 'user';
    const redirectTo =
        options?.redirectTo ||
        (accountType === 'agent' ? '/auth/login?type=agent' : '/auth/login');

    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
    } catch {
        /* still clear client state */
    }

    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        localStorage.removeItem(STORAGE_KEYS.currentAgent);
        window.location.href = redirectTo;
    }
}
