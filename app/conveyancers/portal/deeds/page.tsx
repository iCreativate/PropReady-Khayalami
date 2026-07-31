'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConveyancerPortalLayout from '@/components/conveyancer-connect/ConveyancerPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import { CC_CARD_FLAT, CC_MUTED } from '@/components/conveyancer-connect/cc-ui';
import {
    hydrateSessionFromCookies,
    readOptimisticSession,
} from '@/lib/auth-session-bridge';
import { DEEDS_STATUS_META } from '@/lib/deeds-office';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

type DeedsRow = {
    id: string;
    provider_status?: string;
    progress_pct?: number;
    lodgement_ref?: string;
    deed_number?: string;
    deeds_office?: string;
    last_synced_at?: string;
    conveyancer_matters?: {
        property_label?: string;
        client_name?: string;
        status?: string;
    } | null;
};

export default function ConveyancerDeedsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{
        id: string;
        fullName: string;
        email: string;
        firmName?: string;
    } | null>(null);
    const [deeds, setDeeds] = useState<DeedsRow[]>([]);
    const [busy, setBusy] = useState<string | null>(null);

    async function load() {
        const res = await fetch('/api/conveyancers/deeds', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (res.ok) setDeeds(data.deeds || []);
    }

    useEffect(() => {
        let cancelled = false;
        const optimistic = readOptimisticSession('conveyancer');
        if (optimistic) {
            setUser({
                id: optimistic.id,
                fullName: optimistic.fullName || 'Conveyancer',
                email: optimistic.email,
                firmName: optimistic.company,
            });
        }
        void (async () => {
            const bridged = await hydrateSessionFromCookies({ force: true });
            if (cancelled) return;
            if (!bridged || bridged.accountType !== 'conveyancer') {
                router.replace('/conveyancers/login');
                return;
            }
            setUser({
                id: bridged.id,
                fullName: bridged.fullName || 'Conveyancer',
                email: bridged.email,
                firmName: bridged.company,
            });
            await load();
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    async function advance(deedsId: string) {
        setBusy(deedsId);
        try {
            const res = await fetch('/api/conveyancers/deeds', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deedsId, advance: true }),
            });
            if (res.ok) await load();
        } finally {
            setBusy(null);
        }
    }

    if (!user) {
        return <div className="min-h-screen bg-[#F8FAFC] p-8 text-sm text-charcoal/50">Loading…</div>;
    }

    return (
        <ConveyancerPortalLayout
            activePage="deeds"
            user={user}
            title="Deeds Office"
            pageHeader={
                <PortalPageHeader
                    size="compact"
                    eyebrow="Integration layer"
                    title="Deeds Office tracking"
                    description="South Africa’s Deeds Registries have no public consumer API. PropReady syncs via a pluggable provider (simulated by default; set DEEDS_OFFICE_API_URL for a licensed gateway)."
                />
            }
        >
            <div className="space-y-3">
                {deeds.length ? (
                    deeds.map((d) => {
                        const status = String(d.provider_status || 'not_lodged') as keyof typeof DEEDS_STATUS_META;
                        const meta = DEEDS_STATUS_META[status] || DEEDS_STATUS_META.not_lodged;
                        return (
                            <article key={d.id} className={`${CC_CARD_FLAT} p-5`}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-charcoal">
                                            {d.conveyancer_matters?.property_label || 'Transfer matter'}
                                        </p>
                                        <p className={CC_MUTED}>
                                            {d.conveyancer_matters?.client_name || 'Client'} ·{' '}
                                            {d.deeds_office || 'Deeds Office'} · {meta.label}
                                        </p>
                                        <p className="mt-2 text-xs text-charcoal/45">
                                            Lodgement ref: {d.lodgement_ref || '—'} · Deed:{' '}
                                            {d.deed_number || '—'}
                                            {d.last_synced_at
                                                ? ` · Synced ${new Date(d.last_synced_at).toLocaleString('en-ZA')}`
                                                : ''}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className={`${PORTAL_PRIMARY_BTN} !h-9 !text-xs`}
                                        disabled={busy === d.id}
                                        onClick={() => void advance(d.id)}
                                    >
                                        Sync / advance
                                    </button>
                                </div>
                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-charcoal/[0.06]">
                                    <div
                                        className="h-full rounded-full bg-gold transition-all"
                                        style={{ width: `${d.progress_pct ?? meta.progress}%` }}
                                    />
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <div className={`${CC_CARD_FLAT} p-8 text-center`}>
                        <p className={CC_MUTED}>
                            No Deeds Office matters yet. Open a matter and choose “Track at Deeds Office”.
                        </p>
                        <button
                            type="button"
                            className={`${PORTAL_SECONDARY_BTN} mt-4`}
                            onClick={() => router.push('/conveyancers/portal/matters')}
                        >
                            Go to matters
                        </button>
                    </div>
                )}
            </div>
        </ConveyancerPortalLayout>
    );
}
