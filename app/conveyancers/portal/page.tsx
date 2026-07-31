'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConveyancerPortalLayout from '@/components/conveyancer-connect/ConveyancerPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import { CC_CARD_FLAT, CC_MUTED } from '@/components/conveyancer-connect/cc-ui';
import {
    hydrateSessionFromCookies,
    readOptimisticSession,
} from '@/lib/auth-session-bridge';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

type Summary = {
    profile?: {
        firm_name?: string;
        full_name?: string;
        email?: string;
        status?: string;
    };
    kpis?: Record<string, number | string>;
    matters?: Array<Record<string, unknown>>;
    quotes?: Array<Record<string, unknown>>;
};

export default function ConveyancerPortalDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<{
        id: string;
        fullName: string;
        email: string;
        firmName?: string;
    } | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [error, setError] = useState('');

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

            const res = await fetch('/api/conveyancers/portal/summary', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(String(data.error || 'Could not load dashboard'));
                return;
            }
            setSummary(data);
            if (data.profile?.firm_name) {
                setUser((u) =>
                    u
                        ? {
                              ...u,
                              firmName: data.profile.firm_name,
                              fullName: data.profile.full_name || u.fullName,
                          }
                        : u
                );
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [router]);

    if (!user) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] px-4 py-10 text-sm text-charcoal/50">
                Loading conveyancer portal…
            </div>
        );
    }

    const kpis = summary?.kpis || {};

    return (
        <ConveyancerPortalLayout
            activePage="dashboard"
            user={user}
            title="Dashboard"
            pageHeader={
                <PortalPageHeader
                    size="compact"
                    eyebrow="Conveyancer Connect"
                    title={user.firmName || 'Your firm dashboard'}
                    description="Leads, live inbox, transfer matters and quotes. Deeds Office status uses a pluggable provider (manual/simulated until a licensed gateway is configured)."
                />
            }
        >
            {error ? (
                <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}

            <div className="mb-6 flex flex-wrap gap-2">
                <Link href="/conveyancers/portal/messages" className={PORTAL_PRIMARY_BTN}>
                    Open live inbox
                </Link>
                <Link href="/conveyancers/portal/matters" className={PORTAL_SECONDARY_BTN}>
                    Matters pipeline
                </Link>
                <Link href="/conveyancers/portal/deeds" className={PORTAL_SECONDARY_BTN}>
                    Deeds Office
                </Link>
                <Link href="/conveyancers" className={PORTAL_SECONDARY_BTN}>
                    Public marketplace
                </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Open matters', value: kpis.openMatters ?? '—' },
                    { label: 'Open quotes', value: kpis.openQuotes ?? '—' },
                    { label: 'Consultations', value: kpis.consultations ?? '—' },
                    { label: 'Deeds active', value: kpis.deedsActive ?? '—' },
                ].map((k) => (
                    <div key={k.label} className={`${CC_CARD_FLAT} p-4`}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">
                            {k.label}
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-charcoal">{k.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <section className={`${CC_CARD_FLAT} p-5`}>
                    <h2 className="text-lg font-semibold text-charcoal">Recent matters</h2>
                    <ul className="mt-3 space-y-2">
                        {(summary?.matters || []).length ? (
                            summary!.matters!.map((m) => (
                                <li
                                    key={String(m.id)}
                                    className="rounded-xl bg-charcoal/[0.03] px-3 py-2 text-sm"
                                >
                                    <p className="font-semibold text-charcoal">
                                        {String(m.property_label || 'Matter')}
                                    </p>
                                    <p className="text-charcoal/50">
                                        {String(m.client_name || m.client_email || 'Client')} ·{' '}
                                        {String(m.status)}
                                    </p>
                                </li>
                            ))
                        ) : (
                            <p className={CC_MUTED}>
                                No matters yet. When buyers request quotes or message you, they appear here.
                            </p>
                        )}
                    </ul>
                </section>
                <section className={`${CC_CARD_FLAT} p-5`}>
                    <h2 className="text-lg font-semibold text-charcoal">Verification</h2>
                    <p className={`${CC_MUTED} mt-2`}>
                        Status:{' '}
                        <span className="font-semibold text-charcoal">
                            {String(kpis.status || summary?.profile?.status || 'pending')}
                        </span>
                    </p>
                    <p className={`${CC_MUTED} mt-2`}>
                        Profile completion {String(kpis.profileCompletion ?? 40)}%. Complete your public
                        profile so buyers and agents can find you on Conveyancer Connect.
                    </p>
                    <Link href="/conveyancers/portal/settings" className={`${PORTAL_SECONDARY_BTN} mt-4`}>
                        Edit profile
                    </Link>
                </section>
            </div>
        </ConveyancerPortalLayout>
    );
}
