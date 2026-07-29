import { STORAGE_KEYS } from '@/lib/storage-keys';

export type DocumentGrant = {
    id: string;
    buyerUserId: string;
    agentId: string;
    viewingId?: string | null;
    status: 'active' | 'revoked';
    grantedAt: string;
    revokedAt?: string | null;
};

function readLocalGrants(): DocumentGrant[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.documentGrants);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function writeLocalGrants(list: DocumentGrant[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.documentGrants, JSON.stringify(list));
}

export function getLocalActiveGrant(buyerUserId: string, agentId: string): DocumentGrant | null {
    return (
        readLocalGrants().find(
            (g) =>
                g.buyerUserId === buyerUserId &&
                g.agentId === agentId &&
                g.status === 'active'
        ) || null
    );
}

export function upsertLocalGrant(grant: DocumentGrant) {
    const list = readLocalGrants().filter(
        (g) =>
            !(
                g.buyerUserId === grant.buyerUserId &&
                g.agentId === grant.agentId &&
                g.status === 'active'
            )
    );
    list.unshift(grant);
    writeLocalGrants(list);
}

export function revokeLocalGrant(buyerUserId: string, agentId: string) {
    const now = new Date().toISOString();
    const list = readLocalGrants().map((g) =>
        g.buyerUserId === buyerUserId && g.agentId === agentId && g.status === 'active'
            ? { ...g, status: 'revoked' as const, revokedAt: now }
            : g
    );
    writeLocalGrants(list);
}

/** Client: grant via API with local fallback. */
export async function grantDocumentAccess(input: {
    buyerUserId: string;
    buyerEmail: string;
    agentId: string;
    viewingId?: string | null;
}): Promise<{ ok: boolean; grant?: DocumentGrant; error?: string }> {
    try {
        const res = await fetch('/api/document-grants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.grant) {
            const grant = data.grant as DocumentGrant;
            upsertLocalGrant(grant);
            return { ok: true, grant };
        }
        // Viewing exists locally but not yet in DB (or DB offline) — still allow explicit consent.
        if (res.status === 403 && input.viewingId) {
            /* fall through to local grant */
        } else if (data.error && res.status !== 503) {
            return { ok: false, error: String(data.error) };
        }
    } catch {
        /* local fallback below */
    }

    const grant: DocumentGrant = {
        id: `local-grant-${Date.now()}`,
        buyerUserId: input.buyerUserId,
        agentId: input.agentId,
        viewingId: input.viewingId || null,
        status: 'active',
        grantedAt: new Date().toISOString(),
    };
    upsertLocalGrant(grant);
    return { ok: true, grant };
}

export async function revokeDocumentAccess(input: {
    buyerUserId: string;
    agentId: string;
}): Promise<{ ok: boolean; error?: string }> {
    try {
        const res = await fetch('/api/document-grants', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok && res.status !== 503) {
            return { ok: false, error: data.error || 'Could not revoke access' };
        }
    } catch {
        /* local revoke */
    }
    revokeLocalGrant(input.buyerUserId, input.agentId);
    return { ok: true };
}

export async function fetchDocumentGrantStatus(input: {
    buyerUserId: string;
    agentId: string;
}): Promise<DocumentGrant | null> {
    try {
        const params = new URLSearchParams({
            buyerId: input.buyerUserId,
            agentId: input.agentId,
        });
        const res = await fetch(`/api/document-grants?${params}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data.grant) {
                upsertLocalGrant(data.grant as DocumentGrant);
                return data.grant as DocumentGrant;
            }
            if (data.grant === null && !data.offline) {
                revokeLocalGrant(input.buyerUserId, input.agentId);
                return null;
            }
        }
    } catch {
        /* local */
    }
    return getLocalActiveGrant(input.buyerUserId, input.agentId);
}
