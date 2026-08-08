import type { ListedProperty } from '@/lib/listed-property';

const CACHE_TTL_MS = 60_000;

let cache: { value: ListedProperty[]; at: number } | null = null;
let inflight: Promise<ListedProperty[]> | null = null;

export async function fetchPublishedProperties(options?: { force?: boolean }): Promise<ListedProperty[]> {
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
            const res = await fetch('/api/properties', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !Array.isArray(data.properties)) {
                return cache?.value ?? [];
            }
            const properties = data.properties as ListedProperty[];
            cache = { value: properties, at: Date.now() };
            return properties;
        } catch {
            return cache?.value ?? [];
        } finally {
            inflight = null;
        }
    })();

    return inflight;
}
