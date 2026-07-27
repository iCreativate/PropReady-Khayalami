import type { AccountType } from '@/lib/auth-enterprise/config';
import type { SessionUser } from '@/lib/auth-enterprise/types';
import { messagesDb } from '@/lib/messages';

export type EligibleContact = {
    accountType: AccountType;
    profileId: string;
    displayName: string;
    email: string;
    reason: 'agent_contact' | 'prequal' | 'my_lead' | 'prequal_buyer';
    detail?: string;
};

function normEmail(email: string | null | undefined): string {
    return String(email || '')
        .trim()
        .toLowerCase();
}

function viewingMatchesConsumerEmail(
    row: {
        contact_email?: string | null;
        buyer_email?: string | null;
        seller_email?: string | null;
        status?: string | null;
    },
    email: string
): boolean {
    if (!email) return false;
    if (row.status === 'cancelled') return false;
    return (
        normEmail(row.contact_email) === email ||
        normEmail(row.buyer_email) === email ||
        normEmail(row.seller_email) === email
    );
}

/** Agents who have engaged this consumer via a viewing appointment. */
export async function listContactedAgentsForEmail(email: string): Promise<EligibleContact[]> {
    const normalized = normEmail(email);
    if (!normalized) return [];

    // Quote emails for PostgREST filter safety (e.g. + in addresses)
    const quoted = `"${normalized.replace(/"/g, '')}"`;
    const { data: viewings, error } = await messagesDb()
        .from('viewing_appointments')
        .select('agent_id, contact_email, buyer_email, seller_email, status, property_title')
        .not('agent_id', 'is', null)
        .or(`contact_email.eq.${quoted},buyer_email.eq.${quoted},seller_email.eq.${quoted}`);

    if (error) throw error;

    const agentIds = new Set<string>();
    const detailByAgent = new Map<string, string>();
    for (const row of viewings || []) {
        if (!row.agent_id) continue;
        if (!viewingMatchesConsumerEmail(row, normalized)) continue;
        const id = String(row.agent_id);
        agentIds.add(id);
        if (row.property_title && !detailByAgent.has(id)) {
            detailByAgent.set(id, String(row.property_title));
        }
    }

    if (agentIds.size === 0) return [];

    const { data: agents } = await messagesDb()
        .from('agents')
        .select('id, full_name, email, company')
        .in('id', [...agentIds]);

    return (agents || []).map((a) => ({
        accountType: 'agent' as const,
        profileId: String(a.id),
        displayName: String(a.full_name || a.email || 'Agent'),
        email: String(a.email || ''),
        reason: 'agent_contact' as const,
        detail: detailByAgent.get(String(a.id)) || (a.company ? String(a.company) : undefined),
    }));
}

/** Consumers (users) an agent may message — from their viewing appointments. */
export async function listConsumersForAgent(agentId: string): Promise<EligibleContact[]> {
    const { data: viewings, error } = await messagesDb()
        .from('viewing_appointments')
        .select(
            'contact_email, contact_name, contact_type, buyer_email, seller_email, status, property_title'
        )
        .eq('agent_id', agentId);

    if (error) throw error;

    const emails = new Map<string, { name?: string; detail?: string }>();
    for (const row of viewings || []) {
        if (row.status === 'cancelled') continue;
        const candidates = [
            normEmail(row.buyer_email),
            normEmail(row.seller_email),
            normEmail(row.contact_email),
        ].filter(Boolean);
        for (const email of candidates) {
            if (!emails.has(email)) {
                emails.set(email, {
                    name: row.contact_name ? String(row.contact_name) : undefined,
                    detail: row.property_title ? String(row.property_title) : undefined,
                });
            }
        }
    }

    if (emails.size === 0) return [];

    const { data: users } = await messagesDb()
        .from('users')
        .select('id, full_name, email')
        .in('email', [...emails.keys()]);

    return (users || []).map((u) => {
        const email = normEmail(u.email);
        const meta = emails.get(email);
        return {
            accountType: 'user' as const,
            profileId: String(u.id),
            displayName: String(u.full_name || meta?.name || email.split('@')[0] || 'Client'),
            email: String(u.email || email),
            reason: 'my_lead' as const,
            detail: meta?.detail,
        };
    });
}

/**
 * Originators a buyer may message — only after a prequal case exists.
 * Prefers assigned staff; if unassigned, lists active staff in that organisation.
 */
export async function listOriginatorsForBuyer(buyerUserId: string): Promise<EligibleContact[]> {
    const { data: cases, error } = await messagesDb()
        .from('prequal_cases')
        .select('id, organization_id, assigned_originator_id, status, buyer_email')
        .eq('buyer_user_id', buyerUserId)
        .neq('status', 'closed');

    if (error) throw error;
    if (!cases?.length) return [];

    const assignedIds = new Set<string>();
    const orgIds = new Set<string>();
    for (const c of cases) {
        if (c.assigned_originator_id) assignedIds.add(String(c.assigned_originator_id));
        if (c.organization_id) orgIds.add(String(c.organization_id));
    }

    const contacts: EligibleContact[] = [];
    const seen = new Set<string>();

    if (assignedIds.size > 0) {
        const { data: assigned } = await messagesDb()
            .from('originators')
            .select('id, full_name, email, organization_id, status')
            .in('id', [...assignedIds]);

        for (const o of assigned || []) {
            if (o.status && o.status !== 'active') continue;
            const id = String(o.id);
            if (seen.has(id)) continue;
            seen.add(id);
            contacts.push({
                accountType: 'originator',
                profileId: id,
                displayName: String(o.full_name || o.email || 'Originator'),
                email: String(o.email || ''),
                reason: 'prequal',
                detail: o.organization_id ? String(o.organization_id) : undefined,
            });
        }
    }

    // Unassigned cases: allow messaging active staff in that brand
    const orgsNeedingStaff = [...orgIds].filter((orgId) => {
        return !contacts.some((c) => c.detail === orgId);
    });

    if (orgsNeedingStaff.length > 0) {
        const { data: staff } = await messagesDb()
            .from('originators')
            .select('id, full_name, email, organization_id, status')
            .in('organization_id', orgsNeedingStaff);

        for (const o of staff || []) {
            if (o.status && o.status !== 'active') continue;
            const id = String(o.id);
            if (seen.has(id)) continue;
            seen.add(id);
            contacts.push({
                accountType: 'originator',
                profileId: id,
                displayName: String(o.full_name || o.email || 'Originator'),
                email: String(o.email || ''),
                reason: 'prequal',
                detail: o.organization_id ? String(o.organization_id) : undefined,
            });
        }
    }

    return contacts;
}

/** Buyers an originator may message — prequal cases for their organisation. */
export async function listBuyersForOriginator(
    originatorId: string,
    organizationId?: string | null
): Promise<EligibleContact[]> {
    let query = messagesDb()
        .from('prequal_cases')
        .select('buyer_user_id, buyer_name, buyer_email, organization_id, assigned_originator_id, status')
        .neq('status', 'closed');

    if (organizationId) {
        query = query.eq('organization_id', organizationId);
    } else {
        query = query.eq('assigned_originator_id', originatorId);
    }

    const { data: cases, error } = await query;
    if (error) throw error;
    if (!cases?.length) return [];

    const byBuyer = new Map<string, { name?: string; email?: string; org?: string }>();
    for (const c of cases) {
        if (!c.buyer_user_id) continue;
        const id = String(c.buyer_user_id);
        if (!byBuyer.has(id)) {
            byBuyer.set(id, {
                name: c.buyer_name ? String(c.buyer_name) : undefined,
                email: c.buyer_email ? String(c.buyer_email) : undefined,
                org: c.organization_id ? String(c.organization_id) : undefined,
            });
        }
    }

    const ids = [...byBuyer.keys()];
    const { data: users } = await messagesDb()
        .from('users')
        .select('id, full_name, email')
        .in('id', ids);

    const fromUsers = new Map((users || []).map((u) => [String(u.id), u]));

    return ids.map((id) => {
        const meta = byBuyer.get(id);
        const user = fromUsers.get(id);
        return {
            accountType: 'user' as const,
            profileId: id,
            displayName: String(user?.full_name || meta?.name || meta?.email?.split('@')[0] || 'Buyer'),
            email: String(user?.email || meta?.email || ''),
            reason: 'prequal_buyer' as const,
            detail: meta?.org,
        };
    });
}

export async function listEligibleContacts(user: SessionUser): Promise<EligibleContact[]> {
    if (user.accountType === 'user') {
        const [agents, originators] = await Promise.all([
            listContactedAgentsForEmail(user.email),
            listOriginatorsForBuyer(user.profileId),
        ]);
        return [...agents, ...originators];
    }

    if (user.accountType === 'agent') {
        return listConsumersForAgent(user.profileId);
    }

    if (user.accountType === 'originator') {
        return listBuyersForOriginator(user.profileId, user.organizationId);
    }

    return [];
}

export async function assertCanStartConversation(
    creator: SessionUser,
    counterpart: { accountType: AccountType; profileId: string }
): Promise<void> {
    // Consumers cannot message other consumers
    if (creator.accountType === 'user' && counterpart.accountType === 'user') {
        const err = new Error('Buyers and sellers can only message agents or bond originators');
        (err as Error & { status: number }).status = 403;
        throw err;
    }

    const eligible = await listEligibleContacts(creator);
    const ok = eligible.some(
        (c) => c.accountType === counterpart.accountType && c.profileId === counterpart.profileId
    );

    if (!ok) {
        let message =
            'You can only message people you already have a working relationship with';
        if (creator.accountType === 'user' && counterpart.accountType === 'agent') {
            message =
                'You can message an agent only after they have contacted you (e.g. scheduled a viewing)';
        } else if (creator.accountType === 'user' && counterpart.accountType === 'originator') {
            message =
                'You can message a bond originator only after you have started a pre-qualification with them';
        } else if (creator.accountType === 'agent') {
            message = 'You can only message buyers or sellers you have contacted via a viewing';
        } else if (creator.accountType === 'originator') {
            message = 'You can only message buyers who have a pre-qualification case with your organisation';
        }
        const err = new Error(message);
        (err as Error & { status: number }).status = 403;
        throw err;
    }
}
