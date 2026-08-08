import type { ConveyancerProfile } from '@/lib/conveyancer-connect/types';
import {
    mapDbConveyancerToProfile,
    type DbConveyancerRow,
} from '@/lib/conveyancer-connect/from-db';

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
    return null;
}

export function findInProfiles(
    profiles: ConveyancerProfile[],
    idOrSlug: string
): ConveyancerProfile | undefined {
    return profiles.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}
