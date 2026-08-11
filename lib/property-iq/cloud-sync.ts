import type { CompanionState } from './types';
import {
    mergeCompanionStates,
    slimCompanionForCloud,
} from './storage';
import { createEmptyCompanionState } from './defaults';

export type CloudCompanionPayload = {
    state: CompanionState;
    updatedAt: string | null;
};

/** Fetch account-backed companion workspace (null if none / signed out / offline). */
export async function fetchCompanionFromCloud(): Promise<CloudCompanionPayload | null> {
    try {
        const res = await fetch('/api/property-companion', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
        });
        if (res.status === 401 || res.status === 404) return null;
        if (!res.ok) return null;
        const data = (await res.json().catch(() => null)) as {
            success?: boolean;
            state?: CompanionState | null;
            updatedAt?: string | null;
        } | null;
        if (!data?.success || !data.state) return null;
        return {
            state: data.state,
            updatedAt: data.updatedAt ?? data.state.updatedAt ?? null,
        };
    } catch {
        return null;
    }
}

/** Persist slim companion workspace to the signed-in account. */
export async function pushCompanionToCloud(state: CompanionState): Promise<boolean> {
    try {
        const body = slimCompanionForCloud(state);
        if ((body.properties?.length || 0) === 0 && (body.goals?.length || 0) === 0) {
            // Don't push empty over a possibly richer cloud copy from another device.
            return false;
        }
        const res = await fetch('/api/property-companion', {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: body }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Merge local browser workspace with the account copy on the server.
 * Never drops properties that exist on only one side.
 */
export function reconcileCompanionWithCloud(
    local: CompanionState,
    cloud: CompanionState | null
): CompanionState {
    if (!cloud) return local;
    const localEmpty =
        (local.properties?.length || 0) === 0 &&
        (local.goals?.length || 0) === 0;
    const cloudEmpty =
        (cloud.properties?.length || 0) === 0 &&
        (cloud.goals?.length || 0) === 0;
    if (localEmpty && !cloudEmpty) return cloud;
    if (cloudEmpty && !localEmpty) return local;
    if (localEmpty && cloudEmpty) return local.updatedAt ? local : createEmptyCompanionState();
    return mergeCompanionStates(local, cloud);
}
