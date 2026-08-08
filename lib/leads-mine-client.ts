export type LeadsMineSnapshot = {
    authenticated?: boolean;
    hasBuyerLead?: boolean;
    hasSellerLead?: boolean;
    hasAnyLead?: boolean;
    hasBuyerQuiz?: boolean;
    hasPrequalCase?: boolean;
    fullPrequalified?: boolean;
    buyerPrequalComplete?: boolean;
    originatorPrequalComplete?: boolean;
};

const LEADS_MINE_CACHE_TTL_MS = 30_000;
const LEADS_MINE_FETCH_TIMEOUT_MS = 10_000;

let leadsMineCache: { value: LeadsMineSnapshot | null; at: number } | null = null;
let leadsMineInflight: Promise<LeadsMineSnapshot | null> | null = null;

export function invalidateLeadsMineCache() {
    leadsMineCache = null;
    leadsMineInflight = null;
}

async function fetchLeadsMineRaw(): Promise<LeadsMineSnapshot | null> {
    try {
        const res = await Promise.race([
            fetch('/api/leads/mine', { credentials: 'include' }),
            new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Leads fetch timed out')), LEADS_MINE_FETCH_TIMEOUT_MS);
            }),
        ]);
        if (!res.ok) return null;
        return (await res.json()) as LeadsMineSnapshot;
    } catch {
        return null;
    }
}

/** Deduped /api/leads/mine fetch shared across portal hooks. */
export async function fetchLeadsMine(options?: { force?: boolean }): Promise<LeadsMineSnapshot | null> {
    const force = options?.force === true;
    const now = Date.now();
    if (!force && leadsMineCache && now - leadsMineCache.at < LEADS_MINE_CACHE_TTL_MS) {
        return leadsMineCache.value;
    }
    if (!force && leadsMineInflight) {
        return leadsMineInflight;
    }

    leadsMineInflight = fetchLeadsMineRaw()
        .then((value) => {
            leadsMineCache = { value, at: Date.now() };
            return value;
        })
        .finally(() => {
            leadsMineInflight = null;
        });

    return leadsMineInflight;
}
