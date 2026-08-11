/** Account-backed JSON workspaces for dashboard tools (buyer/seller). */

export const USER_WORKSPACE_KEYS = [
    'smart-bond',
    'buyer-learn',
    'bond-calculator',
    'seller-properties',
    'conveyancer-connect',
    'property-value-optimizer',
] as const;

export type UserWorkspaceKey = (typeof USER_WORKSPACE_KEYS)[number];

export function isUserWorkspaceKey(value: string): value is UserWorkspaceKey {
    return (USER_WORKSPACE_KEYS as readonly string[]).includes(value);
}

export function workspaceLooksEmpty(key: UserWorkspaceKey, state: unknown): boolean {
    if (!state || typeof state !== 'object') return true;
    const s = state as Record<string, unknown>;
    switch (key) {
        case 'smart-bond':
            return !Array.isArray(s.portfolio) || s.portfolio.length === 0;
        case 'buyer-learn': {
            const lessons = s.lessons;
            if (!lessons || typeof lessons !== 'object') return true;
            return Object.keys(lessons as object).length === 0 && !(Number(s.totalXp) > 0);
        }
        case 'bond-calculator':
            return !Array.isArray(s.saves) || s.saves.length === 0;
        case 'seller-properties':
            return !Array.isArray(s.properties) || s.properties.length === 0;
        case 'conveyancer-connect': {
            const saved = Array.isArray(s.savedIds) ? s.savedIds.length : 0;
            const compare = Array.isArray(s.compareIds) ? s.compareIds.length : 0;
            const notes = s.notes && typeof s.notes === 'object' ? Object.keys(s.notes as object).length : 0;
            return saved === 0 && compare === 0 && notes === 0 && !s.matchAnswers;
        }
        case 'property-value-optimizer':
            return !(
                String(s.suburb || '').trim() ||
                String(s.streetAddress || '').trim() ||
                String(s.purchasePrice || '').trim() ||
                String(s.propertyType || '').trim()
            );
        default:
            return true;
    }
}

export type CloudWorkspacePayload<T> = {
    state: T;
    updatedAt: string | null;
};

export async function fetchUserWorkspace<T = unknown>(
    key: UserWorkspaceKey
): Promise<CloudWorkspacePayload<T> | null> {
    try {
        const res = await fetch(`/api/user-workspaces/${encodeURIComponent(key)}`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
        });
        if (res.status === 401 || res.status === 404) return null;
        if (!res.ok) return null;
        const data = (await res.json().catch(() => null)) as {
            success?: boolean;
            state?: T | null;
            updatedAt?: string | null;
        } | null;
        if (!data?.success || data.state == null) return null;
        return {
            state: data.state,
            updatedAt: data.updatedAt ?? null,
        };
    } catch {
        return null;
    }
}

export async function pushUserWorkspace(
    key: UserWorkspaceKey,
    state: unknown
): Promise<boolean> {
    try {
        if (workspaceLooksEmpty(key, state)) return false;
        const res = await fetch(`/api/user-workspaces/${encodeURIComponent(key)}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

type WithUpdatedAt = { updatedAt?: string };

/**
 * Prefer non-empty side; if both have data, prefer newer updatedAt.
 * Optional mergeArraysById unions list fields without dropping items.
 */
export function reconcileWorkspaceState<T extends WithUpdatedAt>(
    key: UserWorkspaceKey,
    local: T,
    remote: T | null,
    options?: {
        mergeArraysById?: Array<keyof T & string>;
    }
): T {
    if (!remote) return local;
    const localEmpty = workspaceLooksEmpty(key, local);
    const remoteEmpty = workspaceLooksEmpty(key, remote);
    if (localEmpty && !remoteEmpty) return remote;
    if (remoteEmpty && !localEmpty) return local;
    if (localEmpty && remoteEmpty) return local;

    const localTs = Date.parse(local.updatedAt || '') || 0;
    const remoteTs = Date.parse(remote.updatedAt || '') || 0;
    const preferRemote = remoteTs > localTs;
    const primary = preferRemote ? remote : local;
    const secondary = preferRemote ? local : remote;

    const merged: T = { ...secondary, ...primary };

    for (const field of options?.mergeArraysById || []) {
        const a = secondary[field];
        const b = primary[field];
        if (!Array.isArray(a) && !Array.isArray(b)) continue;
        const map = new Map<string, unknown>();
        for (const item of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
            if (!item || typeof item !== 'object') continue;
            const id = String((item as { id?: unknown }).id || '');
            if (!id) continue;
            const existing = map.get(id) as Record<string, unknown> | undefined;
            map.set(id, existing ? { ...existing, ...(item as object) } : item);
        }
        (merged as Record<string, unknown>)[field] = [...map.values()];
    }

    return {
        ...merged,
        updatedAt: new Date().toISOString(),
    };
}

/** Fire-and-forget cloud push after local save. */
export function scheduleWorkspacePush(key: UserWorkspaceKey, state: unknown): void {
    if (typeof window === 'undefined') return;
    void pushUserWorkspace(key, state);
}
