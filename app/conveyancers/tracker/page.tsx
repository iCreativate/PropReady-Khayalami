'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PortalHero from '@/components/PortalHero';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import { CC_CARD_FLAT, CC_MUTED } from '@/components/conveyancer-connect/cc-ui';
import {
    findInProfiles,
    trackerFromMatter,
    trackerProgressPct,
    TRANSFER_STAGE_META,
    useConveyancerDirectory,
    type TransferTrackerState,
} from '@/lib/conveyancer-connect';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

function TrackerInner() {
    const search = useSearchParams();
    const matterId = search.get('matter');
    const { profiles } = useConveyancerDirectory();
    const [tracker, setTracker] = useState<TransferTrackerState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            setLoading(true);
            setError('');
            const session = await hydrateSessionFromCookies({ force: true });
            if (!session) {
                if (!cancelled) {
                    setLoading(false);
                    setError('sign-in');
                }
                return;
            }
            const res = await fetch('/api/conveyancers/my/activity', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (!cancelled) {
                    setError(String(data.error || 'Could not load matters'));
                    setLoading(false);
                }
                return;
            }
            const matters = (data.matters || []) as Array<Record<string, unknown>>;
            const selected =
                (matterId ? matters.find((m) => String(m.id) === matterId) : null) || matters[0];
            if (!selected) {
                if (!cancelled) {
                    setTracker(null);
                    setLoading(false);
                }
                return;
            }
            if (!cancelled) {
                setTracker(
                    trackerFromMatter({
                        conveyancer_id: String(selected.conveyancer_id),
                        property_label: selected.property_label as string | null,
                        status: selected.status as string | null,
                        updated_at: selected.updated_at as string | null,
                    })
                );
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [matterId]);

    if (loading) {
        return <div className={`${CC_CARD_FLAT} p-8 text-sm text-charcoal/50`}>Loading tracker…</div>;
    }

    if (error === 'sign-in') {
        return (
            <div className={`${CC_CARD_FLAT} space-y-4 p-8 text-center`}>
                <p className="text-sm text-charcoal/60">
                    Sign in to track live transfer matters linked to your quote requests and consultations.
                </p>
                <Link href="/auth/login" className={`${PORTAL_PRIMARY_BTN} inline-flex`}>
                    Sign in
                </Link>
            </div>
        );
    }

    if (error) {
        return <div className={`${CC_CARD_FLAT} p-8 text-sm text-red-600`}>{error}</div>;
    }

    if (!tracker) {
        return (
            <div className={`${CC_CARD_FLAT} space-y-4 p-8 text-center`}>
                <p className={CC_MUTED}>
                    No active transfer yet. Request a quote or book a consultation with a verified firm to
                    open a matter.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Link href="/conveyancers" className={PORTAL_PRIMARY_BTN}>
                        Browse conveyancers
                    </Link>
                    <Link href="/conveyancers/dashboard" className={PORTAL_SECONDARY_BTN}>
                        My dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const pct = trackerProgressPct(tracker);
    const firm = findInProfiles(profiles, tracker.firmId || '');

    return (
        <div className="space-y-6">
            <PortalHero
                size="compact"
                eyebrow="Transfer Tracker"
                title={tracker.propertyLabel}
                description="Milestones update from your live conveyancer matter status — from inquiry through registration."
                stats={[
                    { label: 'Progress', value: `${pct}%` },
                    {
                        label: 'Current stage',
                        value: TRANSFER_STAGE_META[tracker.currentStageIndex]?.label || '—',
                    },
                    { label: 'Firm', value: firm?.firmName || 'Assigned' },
                ]}
            />

            <div className={`${CC_CARD_FLAT} p-5`}>
                <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-charcoal">Overall progress</span>
                    <span className="tabular-nums text-charcoal/55">{pct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-charcoal/[0.06]">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-red-600 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            <ol className="space-y-3">
                {tracker.stages.map((stage, i) => {
                    const meta = TRANSFER_STAGE_META[i];
                    const current = i === tracker.currentStageIndex;
                    return (
                        <li
                            key={stage.id}
                            className={`${CC_CARD_FLAT} p-4 ${current ? 'ring-2 ring-gold/30' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-charcoal">{meta?.label}</p>
                                    <p className="text-xs text-charcoal/50">{meta?.responsible}</p>
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
                                    {stage.completed ? 'Done' : current ? 'Current' : 'Upcoming'}
                                </span>
                            </div>
                            {meta?.documents?.length ? (
                                <p className="mt-2 text-xs text-charcoal/45">
                                    Docs: {meta.documents.join(' · ')}
                                </p>
                            ) : null}
                        </li>
                    );
                })}
            </ol>

            {firm && firm.slug ? (
                <Link href={`/conveyancers/firm/${firm.slug}`} className={`${PORTAL_SECONDARY_BTN} inline-flex`}>
                    View firm profile
                </Link>
            ) : null}
        </div>
    );
}

export default function TrackerPage() {
    return (
        <CcPageShell title="Transfer Tracker">
            <Suspense fallback={<div className={`${CC_CARD_FLAT} p-8 text-sm text-charcoal/50`}>Loading…</div>}>
                <TrackerInner />
            </Suspense>
        </CcPageShell>
    );
}
