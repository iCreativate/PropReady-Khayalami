import { STORAGE_KEYS } from '@/lib/storage-keys';

export interface ViewingUserRef {
    fullName?: string;
    email?: string;
    id?: string;
}

function readStoredViewings(): Record<string, unknown>[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.viewingAppointments) || '[]') as Record<
            string,
            unknown
        >[];
    } catch {
        return [];
    }
}

function readQuizPhone(): string {
    if (typeof window === 'undefined') return '';
    try {
        const quizResult = JSON.parse(localStorage.getItem(STORAGE_KEYS.quizResult) || '{}') as {
            phone?: string;
        };
        return (quizResult.phone || '').replace(/\s/g, '');
    } catch {
        return '';
    }
}

function readSellerPhone(): string {
    if (typeof window === 'undefined') return '';
    try {
        const sellerInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.sellerInfo) || '{}') as {
            phone?: string;
        };
        return (sellerInfo.phone || '').replace(/\s/g, '');
    } catch {
        return '';
    }
}

export function matchViewingForUser(
    viewing: Record<string, unknown>,
    user: ViewingUserRef,
    options?: { quizPhone?: string; sellerPhone?: string; includeSeller?: boolean }
): boolean {
    const userEmail = user.email?.toLowerCase() || '';
    const quizPhone = options?.quizPhone ?? readQuizPhone();
    const sellerPhone = options?.sellerPhone ?? readSellerPhone();
    const includeSeller = options?.includeSeller ?? true;

    if (viewing.buyerEmail && String(viewing.buyerEmail).toLowerCase() === userEmail) {
        return true;
    }

    const matchesBuyer =
        viewing.contactType === 'buyer' &&
        ((viewing.contactName &&
            user.fullName &&
            String(viewing.contactName).toLowerCase() === user.fullName.toLowerCase()) ||
            (viewing.contactEmail &&
                userEmail &&
                String(viewing.contactEmail).toLowerCase() === userEmail) ||
            (quizPhone &&
                viewing.contactPhone &&
                String(viewing.contactPhone).replace(/\s/g, '') === quizPhone));

    if (matchesBuyer) return true;

    if (!includeSeller) return false;

    const matchesSeller =
        viewing.contactType === 'seller' &&
        ((viewing.contactName &&
            user.fullName &&
            String(viewing.contactName).toLowerCase() === user.fullName.toLowerCase()) ||
            (viewing.contactEmail &&
                userEmail &&
                String(viewing.contactEmail).toLowerCase() === userEmail) ||
            (sellerPhone &&
                viewing.contactPhone &&
                String(viewing.contactPhone).replace(/\s/g, '') === sellerPhone));

    return Boolean(matchesSeller);
}

export function mergeViewingsById(
    apiViewings: Record<string, unknown>[],
    localViewings: Record<string, unknown>[]
): Record<string, unknown>[] {
    const ids = new Set(apiViewings.map((v) => String(v.id)));
    const localOnly = localViewings.filter((v) => !ids.has(String(v.id)));
    return [...apiViewings, ...localOnly].sort(
        (a, b) =>
            new Date(String(b.timestamp || 0)).getTime() -
            new Date(String(a.timestamp || 0)).getTime()
    );
}

export function readLocalViewingsForUser(
    user: ViewingUserRef,
    options?: { includeSeller?: boolean }
): Record<string, unknown>[] {
    const stored = readStoredViewings();
    const matched = stored.filter((v) => matchViewingForUser(v, user, options));
    return matched.sort(
        (a, b) =>
            new Date(String(b.timestamp || 0)).getTime() -
            new Date(String(a.timestamp || 0)).getTime()
    );
}

export async function refreshViewingsFromApi(
    user: ViewingUserRef,
    options?: { includeSeller?: boolean }
): Promise<Record<string, unknown>[]> {
    const local = readLocalViewingsForUser(user, options);
    if (!user.email) return local;

    let apiViewings: Record<string, unknown>[] = [];
    try {
        const res = await fetch(
            `/api/viewings?contactEmail=${encodeURIComponent(user.email)}`,
            { cache: 'no-store' }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.viewings)) {
            apiViewings = (data.viewings as Record<string, unknown>[]).filter((v) =>
                matchViewingForUser(v, user, options)
            );
        }
    } catch {
        return local;
    }

    return mergeViewingsById(apiViewings, local);
}
