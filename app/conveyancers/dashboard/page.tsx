'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import PortalHero from '@/components/PortalHero';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import { CC_CARD_FLAT, CC_MUTED } from '@/components/conveyancer-connect/cc-ui';
import {
    findInProfiles,
    loadCcState,
    useConveyancerDirectory,
} from '@/lib/conveyancer-connect';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

type Activity = {
    quotes: Array<Record<string, unknown>>;
    consultations: Array<Record<string, unknown>>;
    matters: Array<Record<string, unknown>>;
};

export default function UserDashboardPage() {
    const { profiles } = useConveyancerDirectory();
    const [savedIds, setSavedIds] = useState<string[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [activity, setActivity] = useState<Activity | null>(null);
    const [signedIn, setSignedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const s = loadCcState();
        setSavedIds(s.savedIds);
        setRecentSearches(s.recentSearches);

        void (async () => {
            const session = await hydrateSessionFromCookies({ force: true });
            setSignedIn(Boolean(session));
            if (!session) {
                setLoading(false);
                return;
            }
            const res = await fetch('/api/conveyancers/my/activity', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setActivity({
                    quotes: data.quotes || [],
                    consultations: data.consultations || [],
                    matters: data.matters || [],
                });
            }
            setLoading(false);
        })();
    }, []);

    const saved = useMemo(
        () => savedIds.map((id) => findInProfiles(profiles, id)).filter(Boolean),
        [savedIds, profiles]
    );

    const messagesHref =
        signedIn ? '/dashboard/messages' : '/auth/login?type=user&next=/dashboard/messages';

    return (
        <CcPageShell title="My Conveyancer Dashboard">
            <div className="space-y-6">
                <PortalHero
                    size="compact"
                    eyebrow="Your workspace"
                    title="Conveyancer Connect dashboard"
                    description="Quotes, consultations, saved firms and transfer matters linked to your PropReady account."
                    actions={
                        <>
                            <Link href="/conveyancers" className={PORTAL_PRIMARY_BTN}>
                                Browse
                            </Link>
                            <Link href="/conveyancers/match" className={PORTAL_SECONDARY_BTN}>
                                Smart match
                            </Link>
                        </>
                    }
                />

                {!signedIn ? (
                    <div className={`${CC_CARD_FLAT} p-6`}>
                        <p className="text-sm text-charcoal/60">
                            Sign in to see live quote requests, consultations and transfer matters. Saved firms
                            and recent searches still work on this device.
                        </p>
                        <Link href="/auth/login" className={`${PORTAL_PRIMARY_BTN} mt-4 inline-flex`}>
                            Sign in
                        </Link>
                    </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                    <Panel title="Recent searches">
                        {recentSearches.length ? (
                            <ul className="space-y-2">
                                {recentSearches.map((s) => (
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
                        {loading ? (
                            <p className={CC_MUTED}>Loading…</p>
                        ) : activity?.quotes?.length ? (
                            <ul className="space-y-3">
                                {activity.quotes.map((q) => {
                                    const firm = q.conveyancers as
                                        | { firm_name?: string; firm_slug?: string }
                                        | null
                                        | undefined;
                                    return (
                                        <li
                                            key={String(q.id)}
                                            className="rounded-xl bg-charcoal/[0.03] px-3 py-2 text-sm"
                                        >
                                            <p className="font-semibold text-charcoal">
                                                {String(q.property_type || 'Transfer')} ·{' '}
                                                {String(q.location || 'Location TBC')}
                                            </p>
                                            <p className="text-charcoal/50">
                                                {firm?.firm_name || 'Firm'} · {String(q.status)} ·{' '}
                                                {q.created_at
                                                    ? new Date(String(q.created_at)).toLocaleDateString('en-ZA')
                                                    : ''}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className={CC_MUTED}>Request a quote from any verified firm profile.</p>
                        )}
                    </Panel>

                    <Panel title="Consultations">
                        {loading ? (
                            <p className={CC_MUTED}>Loading…</p>
                        ) : activity?.consultations?.length ? (
                            <ul className="space-y-3">
                                {activity.consultations.map((b) => {
                                    const firm = b.conveyancers as
                                        | { firm_name?: string }
                                        | null
                                        | undefined;
                                    return (
                                        <li
                                            key={String(b.id)}
                                            className="rounded-xl bg-charcoal/[0.03] px-3 py-2 text-sm"
                                        >
                                            <p className="font-semibold text-charcoal">
                                                {String(b.slot_label)} · {String(b.consultation_type)}
                                            </p>
                                            <p className="text-charcoal/50">
                                                {firm?.firm_name || 'Firm'} · {String(b.status)}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className={CC_MUTED}>Book a consultation to see it here.</p>
                        )}
                    </Panel>

                    <Panel title="Messages">
                        <p className={CC_MUTED}>
                            Live firm chats live in your PropReady Messages inbox once you start a conversation.
                        </p>
                        <Link href={messagesHref} className={`${PORTAL_SECONDARY_BTN} mt-3`}>
                            Open messages
                        </Link>
                    </Panel>

                    <Panel title="Active transfers">
                        {loading ? (
                            <p className={CC_MUTED}>Loading…</p>
                        ) : activity?.matters?.length ? (
                            <ul className="space-y-3">
                                {activity.matters.map((m) => {
                                    const firm = m.conveyancers as
                                        | { firm_name?: string; firm_slug?: string }
                                        | null
                                        | undefined;
                                    return (
                                        <li key={String(m.id)} className="text-sm">
                                            <p className="font-semibold text-charcoal">
                                                {String(m.property_label || 'Transfer')}
                                            </p>
                                            <p className="text-charcoal/50">
                                                {firm?.firm_name || 'Firm'} · {String(m.status)}
                                            </p>
                                            <Link
                                                href={`/conveyancers/tracker?matter=${m.id}`}
                                                className="mt-1 inline-flex text-sm font-semibold text-gold"
                                            >
                                                Open tracker →
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div>
                                <p className={CC_MUTED}>
                                    Transfer trackers appear after you quote, book or message a firm.
                                </p>
                                <Link href="/conveyancers" className={`${PORTAL_SECONDARY_BTN} mt-3`}>
                                    Find a conveyancer
                                </Link>
                            </div>
                        )}
                    </Panel>
                </div>
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
