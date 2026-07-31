import { createServiceClient } from '@/lib/supabase-admin';

export type EnsureInquiryInput = {
    conveyancerId: string;
    clientUserId?: string;
    clientName?: string | null;
    clientEmail?: string | null;
    agentId?: string;
    agentName?: string | null;
    propertyLabel?: string;
    source?: 'marketplace' | 'quote' | 'agent_referral' | 'tracker' | 'admin';
};

export async function ensureConveyancerInquiryMatter(input: EnsureInquiryInput): Promise<string | null> {
    const supabase = createServiceClient();
    if (!supabase) return null;

    let query = supabase
        .from('conveyancer_matters')
        .select('id')
        .eq('conveyancer_id', input.conveyancerId)
        .neq('status', 'closed')
        .limit(1);

    if (input.clientUserId) {
        query = query.eq('client_user_id', input.clientUserId);
    } else if (input.agentId) {
        query = query.eq('agent_id', input.agentId).is('client_user_id', null);
    } else if (input.clientEmail) {
        query = query.ilike('client_email', input.clientEmail);
    }

    const { data: existing } = await query.maybeSingle();
    if (existing?.id) return String(existing.id);

    const { data, error } = await supabase
        .from('conveyancer_matters')
        .insert({
            conveyancer_id: input.conveyancerId,
            client_user_id: input.clientUserId || null,
            client_name: input.clientName || null,
            client_email: input.clientEmail || null,
            agent_id: input.agentId || null,
            agent_name: input.agentName || null,
            property_label: input.propertyLabel || 'Conveyancer Connect inquiry',
            status: 'inquiry',
            source: input.source || 'marketplace',
        })
        .select('id')
        .single();

    if (error) {
        console.error('ensureConveyancerInquiryMatter:', error);
        return null;
    }
    return data?.id ? String(data.id) : null;
}

export async function listMattersForConveyancer(conveyancerId: string) {
    const supabase = createServiceClient();
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('conveyancer_matters')
        .select('*')
        .eq('conveyancer_id', conveyancerId)
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
}
