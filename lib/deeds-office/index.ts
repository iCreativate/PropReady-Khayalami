/**
 * Deeds Office integration layer.
 * South Africa’s Deeds Registries do not expose a public consumer API.
 * PropReady uses a pluggable provider — default is a deterministic simulator
 * that advances lodgement → examination → registration for demo and staging.
 * Swap `DEEDS_OFFICE_PROVIDER=external` when a licensed gateway is configured.
 */

import { createServiceClient } from '@/lib/supabase-admin';

export type DeedsProviderStatus =
    | 'not_lodged'
    | 'preparing'
    | 'lodged'
    | 'examining'
    | 'queried'
    | 'ready_for_registration'
    | 'registered'
    | 'uplifted'
    | 'error';

export const DEEDS_STATUS_META: Record<
    DeedsProviderStatus,
    { label: string; progress: number }
> = {
    not_lodged: { label: 'Not lodged', progress: 0 },
    preparing: { label: 'Preparing lodgement pack', progress: 15 },
    lodged: { label: 'Lodged at Deeds Office', progress: 35 },
    examining: { label: 'Under examination', progress: 55 },
    queried: { label: 'Query raised', progress: 50 },
    ready_for_registration: { label: 'Ready for registration', progress: 80 },
    registered: { label: 'Registered', progress: 95 },
    uplifted: { label: 'Uplifted / complete', progress: 100 },
    error: { label: 'Provider error', progress: 0 },
};

const ADVANCE: DeedsProviderStatus[] = [
    'not_lodged',
    'preparing',
    'lodged',
    'examining',
    'ready_for_registration',
    'registered',
    'uplifted',
];

export function nextSimulatedStatus(current: DeedsProviderStatus): DeedsProviderStatus {
    const i = ADVANCE.indexOf(current);
    if (i < 0 || i >= ADVANCE.length - 1) return current;
    return ADVANCE[i + 1];
}

export async function ensureDeedsMatter(conveyancerMatterId: string, conveyancerId: string) {
    const supabase = createServiceClient();
    if (!supabase) throw new Error('Database not configured');

    const { data: existing } = await supabase
        .from('deeds_office_matters')
        .select('*')
        .eq('conveyancer_matter_id', conveyancerMatterId)
        .maybeSingle();
    if (existing) return existing;

    const { data, error } = await supabase
        .from('deeds_office_matters')
        .insert({
            conveyancer_matter_id: conveyancerMatterId,
            conveyancer_id: conveyancerId,
            provider: process.env.DEEDS_OFFICE_PROVIDER || 'propready_simulated',
            provider_status: 'not_lodged',
            progress_pct: 0,
        })
        .select('*')
        .single();
    if (error) throw error;
    return data;
}

export async function syncDeedsMatter(deedsMatterId: string, opts?: { advance?: boolean }) {
    const supabase = createServiceClient();
    if (!supabase) throw new Error('Database not configured');

    const { data: row, error } = await supabase
        .from('deeds_office_matters')
        .select('*')
        .eq('id', deedsMatterId)
        .maybeSingle();
    if (error || !row) throw error || new Error('Deeds matter not found');

    const provider = String(row.provider || 'propready_simulated');
    let status = row.provider_status as DeedsProviderStatus;
    let eventTitle = 'Status refreshed';
    let eventDetail = `Synced via ${provider}`;

    if (provider === 'propready_simulated' && opts?.advance) {
        const next = nextSimulatedStatus(status);
        if (next !== status) {
            status = next;
            eventTitle = DEEDS_STATUS_META[next].label;
            eventDetail = 'Simulated Deeds Office progression (replace with licensed gateway in production).';
        }
    }

    // External provider hook — env-configured HTTP gateway
    if (provider === 'external' && process.env.DEEDS_OFFICE_API_URL) {
        try {
            const res = await fetch(
                `${process.env.DEEDS_OFFICE_API_URL.replace(/\/$/, '')}/matters/${encodeURIComponent(
                    String(row.lodgement_ref || row.id)
                )}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.DEEDS_OFFICE_API_KEY || ''}`,
                        Accept: 'application/json',
                    },
                    cache: 'no-store',
                }
            );
            if (res.ok) {
                const payload = (await res.json()) as {
                    status?: DeedsProviderStatus;
                    deedNumber?: string;
                    lodgementRef?: string;
                };
                if (payload.status) status = payload.status;
                eventTitle = 'External Deeds Office sync';
                eventDetail = JSON.stringify(payload).slice(0, 500);
                await supabase
                    .from('deeds_office_matters')
                    .update({
                        provider_status: status,
                        progress_pct: DEEDS_STATUS_META[status]?.progress ?? row.progress_pct,
                        deed_number: payload.deedNumber || row.deed_number,
                        lodgement_ref: payload.lodgementRef || row.lodgement_ref,
                        raw_payload: payload,
                        last_synced_at: new Date().toISOString(),
                        registered_at:
                            status === 'registered' || status === 'uplifted'
                                ? row.registered_at || new Date().toISOString()
                                : row.registered_at,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', deedsMatterId);
            }
        } catch (err) {
            console.error('external deeds sync:', err);
            status = 'error';
            eventTitle = 'External sync failed';
            eventDetail = err instanceof Error ? err.message : 'Unknown error';
        }
    } else {
        await supabase
            .from('deeds_office_matters')
            .update({
                provider_status: status,
                progress_pct: DEEDS_STATUS_META[status]?.progress ?? row.progress_pct,
                last_synced_at: new Date().toISOString(),
                registered_at:
                    status === 'registered' || status === 'uplifted'
                        ? row.registered_at || new Date().toISOString()
                        : row.registered_at,
                updated_at: new Date().toISOString(),
            })
            .eq('id', deedsMatterId);
    }

    await supabase.from('deeds_office_events').insert({
        deeds_matter_id: deedsMatterId,
        event_code: status,
        title: eventTitle,
        detail: eventDetail,
    });

    // Mirror high-level status onto conveyancer matter
    const matterStatus =
        status === 'lodged' || status === 'examining' || status === 'queried'
            ? 'lodged'
            : status === 'registered' || status === 'uplifted'
              ? 'registered'
              : status === 'preparing'
                ? 'in_progress'
                : null;
    if (matterStatus) {
        await supabase
            .from('conveyancer_matters')
            .update({ status: matterStatus, updated_at: new Date().toISOString() })
            .eq('id', row.conveyancer_matter_id);
    }

    const { data: refreshed } = await supabase
        .from('deeds_office_matters')
        .select('*, deeds_office_events(*)')
        .eq('id', deedsMatterId)
        .maybeSingle();

    return refreshed || row;
}

export async function listDeedsForConveyancer(conveyancerId: string) {
    const supabase = createServiceClient();
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('deeds_office_matters')
        .select('*, conveyancer_matters(property_label, client_name, status)')
        .eq('conveyancer_id', conveyancerId)
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
}
