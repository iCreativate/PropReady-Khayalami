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
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

type Matter = {
    id: string;
    property_label?: string;
    client_name?: string;
    client_email?: string;
    status?: string;
    source?: string;
};

export default function ConveyancerMattersPage() {
    const router = useRouter();
    const [user, setUser] = useState<{
        id: string;
        fullName: string;
        email: string;
        firmName?: string;
    } | null>(null);
    const [matters, setMatters] = useState<Matter[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);

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
            const res = await fetch('/api/conveyancers/matters', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) setMatters(data.matters || []);
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    async function setStatus(matterId: string, status: string) {
        setBusyId(matterId);
        try {
            const res = await fetch('/api/conveyancers/matters', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matterId, status }),
            });
            const data = await res.json();
            if (res.ok && data.matter) {
                setMatters((rows) => rows.map((m) => (m.id === matterId ? data.matter : m)));
            }
        } finally {
            setBusyId(null);
        }
    }

    async function startDeeds(matterId: string) {
        setBusyId(matterId);
        try {
            await fetch('/api/conveyancers/deeds', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matterId, advance: true }),
            });
            router.push('/conveyancers/portal/deeds');
        } finally {
            setBusyId(null);
        }
    }

    if (!user) {
        return <div className="min-h-screen bg-[#F8FAFC] p-8 text-sm text-charcoal/50">Loading…</div>;
    }

    return (
        <ConveyancerPortalLayout
            activePage="matters"
            user={user}
            title="Matters"
            pageHeader={
                <PortalPageHeader
                    size="compact"
                    eyebrow="Transfer pipeline"
                    title="Client matters"
                    description="Every quote, consultation and instruction becomes a matter — unlocking live messaging with the client (and their agent)."
                />
            }
        >
            <div className="space-y-3">
                {matters.length ? (
                    matters.map((m) => (
                        <article key={m.id} className={`${CC_CARD_FLAT} p-4`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-charcoal">
                                        {m.property_label || 'Matter'}
                                    </p>
                                    <p className={`${CC_MUTED} mt-1`}>
                                        {m.client_name || m.client_email || 'Client'} · {m.status} ·{' '}
                                        {m.source}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        className={`${PORTAL_SECONDARY_BTN} !h-9 !text-xs`}
                                        disabled={busyId === m.id}
                                        onClick={() => void setStatus(m.id, 'instructed')}
                                    >
                                        Mark instructed
                                    </button>
                                    <button
                                        type="button"
                                        className={`${PORTAL_PRIMARY_BTN} !h-9 !text-xs`}
                                        disabled={busyId === m.id}
                                        onClick={() => void startDeeds(m.id)}
                                    >
                                        Track at Deeds Office
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className={`${CC_CARD_FLAT} p-8 text-center`}>
                        <p className={CC_MUTED}>No matters yet.</p>
                    </div>
                )}
            </div>
        </ConveyancerPortalLayout>
    );
}
