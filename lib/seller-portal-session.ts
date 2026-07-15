import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { UserPortalUser } from '@/components/UserPortalLayout';

export function readSellerPortalUser(): UserPortalUser | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
        if (!raw) return null;
        const user = JSON.parse(raw) as { id?: string; fullName?: string; email?: string };
        const sellerRaw = localStorage.getItem(STORAGE_KEYS.sellerInfo);
        if (sellerRaw) {
            const seller = JSON.parse(sellerRaw) as { id?: string; email?: string };
            const matches =
                (user.id && seller.id === user.id) ||
                (user.email && seller.email?.toLowerCase() === user.email.toLowerCase());
            if (!matches) return null;
        }
        if (!user.fullName && !user.email) return null;
        return {
            id: user.id,
            fullName: user.fullName || 'Seller',
            email: user.email,
        };
    } catch {
        return null;
    }
}
