import { STORAGE_KEYS } from '@/lib/storage-keys';
import { loginPathForAccountType } from '@/lib/auth-enterprise/account-profile';

/** Clear cookie session + legacy localStorage, then hard-navigate to login. */
export async function signOutClient(options?: {
    accountType?: 'user' | 'agent' | 'originator';
    redirectTo?: string;
}) {
    const accountType = options?.accountType || 'user';
    const redirectTo = options?.redirectTo || loginPathForAccountType(accountType);

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
        localStorage.removeItem('propReady_currentOriginator');
        window.location.href = redirectTo;
    }
}
