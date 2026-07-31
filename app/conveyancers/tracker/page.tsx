'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PortalHero from '@/components/PortalHero';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import { CC_CARD_FLAT, CC_MUTED } from '@/components/conveyancer-connect/cc-ui';
import {
    CONVEYANCERS,
    ensureTracker,
    loadCcState,
    trackerProgressPct,
    TRANSFER_STAGE_META,
    type TransferTrackerState,
} from '@/lib/conveyancer-connect';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

export default function TrackerPage() {
    const [tracker, setTracker] = useState<TransferTrackerState | null>(null);

    useEffect(() => {
        const existing = loadCcState().tracker;
        if (existing) {
            setTracker(existing);
            return;
        }
        const firm = CONVEYANCERS[0];
        setTracker(ensureTracker(firm.id, 'Demo transfer — Sandton apartment'));
    }, []);

    if (!tracker) {
        return (
            <CcPageShell title="Transfer Tracker">
                <div className={`${CC_CARD_FLAT} p-8 text-sm text-charcoal/50`}>Loading tracker…</div>
            </CcPageShell>
        );
    }

    const pct = trackerProgressPct(tracker);
    const firm = CONVEYANCERS.find((c) => c.id === tracker.firmId);

    return (
        <CcPageShell title="Transfer Tracker">
            <div className="space-y-6">
                <PortalHero
                    size="compact"
                    eyebrow="Transfer Tracker"
                    title={tracker.propertyLabel}
                    description="Follow every milestone from offer accepted to funds released — with owners, documents and notifications."
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
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-charcoal">
                                            {i + 1}. {meta.label}
                                        </p>
                                        <p className={`${CC_MUTED} mt-1`}>
                                            Responsible: {stage.responsible}
                                            {stage.expectedAt
                                                ? ` · Expected ${new Date(stage.expectedAt).toLocaleDateString('en-ZA')}`
                                                : ''}
                                        </p>
                                        <p className="mt-2 text-xs text-charcoal/45">
                                            Documents: {stage.documents.join(', ')}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                            stage.completed
                                                ? 'bg-emerald-50 text-emerald-800'
                                                : current
                                                  ? 'bg-gold/10 text-gold'
                                                  : 'bg-charcoal/[0.04] text-charcoal/50'
                                        }`}
                                    >
                                        {stage.completed ? 'Complete' : current ? 'In progress' : 'Upcoming'}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ol>

                <section className={`${CC_CARD_FLAT} p-5`}>
                    <h2 className="text-lg font-semibold text-charcoal">Notifications</h2>
                    <ul className="mt-3 space-y-2">
                        {tracker.notifications.map((n) => (
                            <li key={n.id} className="rounded-xl bg-charcoal/[0.03] px-3 py-2 text-sm text-charcoal/70">
                                <span className="text-xs text-charcoal/40">
                                    {new Date(n.at).toLocaleString('en-ZA')}
                                </span>
                                <p>{n.text}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                <div className="flex flex-wrap gap-2">
                    {firm ? (
                        <Link href={`/conveyancers/firm/${firm.slug}`} className={PORTAL_PRIMARY_BTN}>
                            View firm
                        </Link>
                    ) : null}
                    <Link href="/conveyancers/dashboard" className={PORTAL_SECONDARY_BTN}>
                        Open dashboard
                    </Link>
                </div>
            </div>
        </CcPageShell>
    );
}
