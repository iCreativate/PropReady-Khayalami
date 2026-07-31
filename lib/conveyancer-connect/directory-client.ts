import type { ConveyancerProfile } from '@/lib/conveyancer-connect/types';
import {
    mapDbConveyancerToProfile,
    type DbConveyancerRow,
} from '@/lib/conveyancer-connect/from-db';
import { CONVEYANCERS } from '@/lib/conveyancer-connect/catalog';

/** Demo catalog only when explicitly enabled (local/preview). Production is live directory only. */
export function demoCatalogEnabled(): boolean {
    return process.env.NEXT_PUBLIC_CC_DEMO_CATALOG === '1';
}

export function isLiveFirmId(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function fetchDirectoryRows(): Promise<DbConveyancerRow[]> {
    const res = await fetch('/api/conveyancers/directory', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !Array.isArray(data.conveyancers)) return [];
    return data.conveyancers as DbConveyancerRow[];
}

export async function fetchDirectoryProfiles(): Promise<ConveyancerProfile[]> {
    const live = (await fetchDirectoryRows()).map(mapDbConveyancerToProfile);
    if (demoCatalogEnabled()) {
        const seen = new Set(live.map((c) => c.id));
        const demo = CONVEYANCERS.filter((c) => !seen.has(c.id) && !live.some((l) => l.slug === c.slug));
        return [...live, ...demo];
    }
    return live;
}

export async function fetchFirmBySlug(slug: string): Promise<ConveyancerProfile | null> {
    const res = await fetch(`/api/conveyancers/directory?slug=${encodeURIComponent(slug)}`, {
        credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.conveyancer) {
        return mapDbConveyancerToProfile(data.conveyancer as DbConveyancerRow);
    }
    if (demoCatalogEnabled()) {
        return CONVEYANCERS.find((c) => c.slug === slug) || null;
    }
    return null;
}

export function findInProfiles(
    profiles: ConveyancerProfile[],
    idOrSlug: string
): ConveyancerProfile | undefined {
    return profiles.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}
