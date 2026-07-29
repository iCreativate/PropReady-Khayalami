import { createServiceClient } from '@/lib/supabase-admin';
import type { DocumentGrant } from '@/lib/document-grants';

/** Server: find a non-cancelled viewing linking this buyer and agent. */
export async function findSharedViewing(buyerUserId: string, buyerEmail: string, agentId: string) {
    const supabase = createServiceClient();
    if (!supabase) return null;

    const email = buyerEmail.trim().toLowerCase();

    const { data, error } = await supabase
        .from('viewing_appointments')
        .select('id, agent_id, buyer_email, contact_email, contact_type, status, buyer_lead_id')
        .eq('agent_id', agentId)
        .neq('status', 'cancelled')
        .limit(25);

    if (error || !data?.length) return null;

    const match = data.find((row) => {
        const buyer = String(row.buyer_email || '').toLowerCase();
        const contact = String(row.contact_email || '').toLowerCase();
        const leadId = String(row.buyer_lead_id || '');
        const isBuyerContact =
            String(row.contact_type || '').toLowerCase() === 'buyer' || Boolean(row.buyer_email);
        if (!isBuyerContact && !buyer) return false;
        return leadId === buyerUserId || (email && (buyer === email || contact === email));
    });

    return match || null;
}

export async function getActiveGrantFromDb(buyerUserId: string, agentId: string) {
    const supabase = createServiceClient();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('agent_document_grants')
        .select('*')
        .eq('buyer_user_id', buyerUserId)
        .eq('agent_id', agentId)
        .eq('status', 'active')
        .maybeSingle();

    if (error || !data) return null;
    return {
        id: data.id as string,
        buyerUserId: data.buyer_user_id as string,
        agentId: data.agent_id as string,
        viewingId: (data.viewing_id as string) || null,
        status: data.status as 'active' | 'revoked',
        grantedAt: data.granted_at as string,
        revokedAt: (data.revoked_at as string) || null,
    } satisfies DocumentGrant;
}

export async function agentHasDocumentAccess(buyerUserId: string, agentId: string): Promise<boolean> {
    if (!buyerUserId || !agentId) return false;
    const grant = await getActiveGrantFromDb(buyerUserId, agentId);
    return Boolean(grant);
}
