'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PortalHero from '@/components/PortalHero';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import { CC_CARD_FLAT, CC_MUTED } from '@/components/conveyancer-connect/cc-ui';
import {
    defaultCcState,
    getConveyancerById,
    loadCcState,
    type CcUserState,
} from '@/lib/conveyancer-connect';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

export default function UserDashboardPage() {
    const [state, setState] = useState<CcUserState>(defaultCcState());

    useEffect(() => {
        setState(loadCcState());
    }, []);

    const saved = state.savedIds.map((id) => getConveyancerById(id)).filter(Boolean);

    return (
        <CcPageShell title="My Conveyancer Dashboard">
            <div className="space-y-6">
                <PortalHero
                    size="compact"
                    eyebrow="Your workspace"
                    title="Conveyancer Connect dashboard"
                    description="Recent searches, saved firms, quotes, appointments, messages and transfer progress — in one place."
                    actions={
                        <>
                            <Link href="/conveyancers" className={PORTAL_PRIMARY_BTN}>
                                Browse
                            </Link>
                            <Link href="/conveyancers/match" className={PORTAL_SECONDARY_BTN}>
                                AI Match
                            </Link>
                        </>
                    }
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <Panel title="Recent searches">
                        {state.recentSearches.length ? (
                            <ul className="space-y-2">
                                {state.recentSearches.map((s) => (
                                    <li key={s}>
                                        <Link
                                            href={`/conveyancers?q=${encodeURIComponent(s)}`}
                                            className="text-sm font-medium text-gold hover:underline"
                                        >
                                            {s}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={CC_MUTED}>No recent searches yet.</p>
                        )}
                    </Panel>

                    <Panel title="Saved firms">
                        {saved.length ? (
                            <ul className="space-y-2">
                                {saved.map((f) =>
                                    f ? (
                                        <li key={f.id}>
                                            <Link
                                                href={`/conveyancers/firm/${f.slug}`}
                                                className="text-sm font-medium text-charcoal hover:text-gold"
                                            >
                                                {f.firmName}
                                            </Link>
                                        </li>
                                    ) : null
                                )}
                            </ul>
                        ) : (
                            <p className={CC_MUTED}>Save firms from browse or profile pages.</p>
                        )}
                    </Panel>

                    <Panel title="Quotes">
                        {state.quotes.length ? (
                            <ul className="space-y-3">
                                {state.quotes.map((q) => (
                                    <li key={q.id} className="rounded-xl bg-charcoal/[0.03] px-3 py-2 text-sm">
                                        <p className="font-semibold text-charcoal">
                                            {q.propertyType} · {q.location || 'Location TBC'}
                                        </p>
                                        <p className="text-charcoal/50">
                                            {q.status} · {new Date(q.createdAt).toLocaleDateString('en-ZA')}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={CC_MUTED}>Request a quote from any firm profile.</p>
                        )}
                    </Panel>

                    <Panel title="Appointments">
                        {state.bookings.length ? (
                            <ul className="space-y-3">
                                {state.bookings.map((b) => (
                                    <li key={b.id} className="rounded-xl bg-charcoal/[0.03] px-3 py-2 text-sm">
                                        <p className="font-semibold text-charcoal">
                                            {b.slot} · {b.type}
                                        </p>
                                        <p className="text-charcoal/50">{b.status}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={CC_MUTED}>Book a consultation to see it here.</p>
                        )}
                    </Panel>

                    <Panel title="Messages">
                        {state.threads.length ? (
                            <ul className="space-y-3">
                                {state.threads.map((t) => {
                                    const firm = getConveyancerById(t.firmId);
                                    return (
                                        <li key={t.id} className="text-sm">
                                            <p className="font-semibold text-charcoal">
                                                {firm?.firmName || t.firmId}
                                            </p>
                                            <p className="text-charcoal/55">
                                                {t.messages[t.messages.length - 1]?.body}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className={CC_MUTED}>Secure chat previews appear after you message a firm.</p>
                        )}
                    </Panel>

                    <Panel title="Active transfer">
                        {state.tracker ? (
                            <div>
                                <p className="text-sm font-semibold text-charcoal">{state.tracker.propertyLabel}</p>
                                <Link href="/conveyancers/tracker" className="mt-2 inline-flex text-sm font-semibold text-gold">
                                    Open tracker →
                                </Link>
                            </div>
                        ) : (
                            <div>
                                <p className={CC_MUTED}>No active transfer demo yet.</p>
                                <Link href="/conveyancers/tracker" className={`${PORTAL_SECONDARY_BTN} mt-3`}>
                                    Start tracker
                                </Link>
                            </div>
                        )}
                    </Panel>
                </div>

                <Panel title="Recommended next step">
                    <p className={CC_MUTED}>
                        Run AI Matching to get explained recommendations for your province and timeline.
                    </p>
                    <Link href="/conveyancers/match" className={`${PORTAL_PRIMARY_BTN} mt-3`}>
                        Get matched
                    </Link>
                </Panel>
            </div>
        </CcPageShell>
    );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className={`${CC_CARD_FLAT} p-5`}>
            <h2 className="text-lg font-semibold text-charcoal">{title}</h2>
            <div className="mt-3">{children}</div>
        </section>
    );
}
