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
import { PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';
import { formatZar } from '@/lib/conveyancer-connect';

type Quote = {
    id: string;
    requester_name?: string;
    requester_email?: string;
    property_type?: string;
    location?: string;
    purchase_price?: number;
    status?: string;
    timeline?: string;
};

export default function ConveyancerQuotesPage() {
    const router = useRouter();
    const [user, setUser] = useState<{
        id: string;
        fullName: string;
        email: string;
        firmName?: string;
    } | null>(null);
    const [quotes, setQuotes] = useState<Quote[]>([]);

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
            const res = await fetch('/api/conveyancers/quotes', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) setQuotes(data.quotes || []);
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    async function updateStatus(quoteId: string, status: string) {
        const res = await fetch('/api/conveyancers/quotes', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quoteId, status }),
        });
        const data = await res.json();
        if (res.ok && data.quote) {
            setQuotes((rows) => rows.map((q) => (q.id === quoteId ? data.quote : q)));
        }
    }

    if (!user) {
        return <div className="min-h-screen bg-[#F8FAFC] p-8 text-sm text-charcoal/50">Loading…</div>;
    }

    return (
        <ConveyancerPortalLayout
            activePage="quotes"
            user={user}
            title="Quotes"
            pageHeader={
                <PortalPageHeader
                    size="compact"
                    eyebrow="Lead inbox"
                    title="Quote requests"
                    description="Respond to marketplace quote requests. Accepting a quote keeps the client matter open for messaging."
                />
            }
        >
            <div className="space-y-3">
                {quotes.length ? (
                    quotes.map((q) => (
                        <article key={q.id} className={`${CC_CARD_FLAT} p-4`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-charcoal">
                                        {q.property_type || 'Property'} · {q.location || 'Location TBC'}
                                    </p>
                                    <p className={CC_MUTED}>
                                        {q.requester_name || q.requester_email} ·{' '}
                                        {q.purchase_price != null ? formatZar(Number(q.purchase_price)) : '—'} ·{' '}
                                        {q.timeline || 'Timeline TBC'} · {q.status}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className={`${PORTAL_SECONDARY_BTN} !h-9 !text-xs`}
                                        onClick={() => void updateStatus(q.id, 'quoted')}
                                    >
                                        Mark quoted
                                    </button>
                                    <button
                                        type="button"
                                        className={`${PORTAL_SECONDARY_BTN} !h-9 !text-xs`}
                                        onClick={() => void updateStatus(q.id, 'accepted')}
                                    >
                                        Accept
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className={`${CC_CARD_FLAT} p-8 text-center`}>
                        <p className={CC_MUTED}>No quote requests yet.</p>
                    </div>
                )}
            </div>
        </ConveyancerPortalLayout>
    );
}
