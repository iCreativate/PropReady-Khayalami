import type { BondOriginator } from '@/lib/bond-originators';

const CACHE_TTL_MS = 60_000;

let cache: { value: BondOriginator[]; at: number } | null = null;
let inflight: Promise<BondOriginator[]> | null = null;

export async function fetchLiveBondOriginators(options?: { force?: boolean }): Promise<BondOriginator[]> {
    const force = options?.force === true;
    const now = Date.now();
    if (!force && cache && now - cache.at < CACHE_TTL_MS) {
        return cache.value;
    }
    if (!force && inflight) {
        return inflight;
    }

    inflight = (async () => {
        try {
            const res = await fetch('/api/bond-originators', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return cache?.value ?? [];
            const originators = Array.isArray(data.originators) ? (data.originators as BondOriginator[]) : [];
            cache = { value: originators, at: Date.now() };
            return originators;
        } catch {
            return cache?.value ?? [];
        } finally {
            inflight = null;
        }
    })();

    return inflight;
}
