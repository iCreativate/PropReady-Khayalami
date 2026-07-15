import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { UserPortalUser } from '@/components/UserPortalLayout';

export function readBuyerPortalUser(): UserPortalUser | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
        if (!raw) return null;
        const user = JSON.parse(raw) as { id?: string; fullName?: string; email?: string };
        if (!user.fullName && !user.email) return null;
        return {
            id: user.id,
            fullName: user.fullName || 'Buyer',
            email: user.email,
        };
    } catch {
        return null;
    }
}
