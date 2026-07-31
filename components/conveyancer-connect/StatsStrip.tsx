'use client';

import { useEffect, useState } from 'react';
import { CC_CARD_FLAT } from '@/components/conveyancer-connect/cc-ui';
import { PLATFORM_STATS } from '@/lib/conveyancer-connect';

const STATS: Array<{ key: keyof typeof PLATFORM_STATS; label: string; suffix?: string }> = [
    { key: 'verifiedConveyancers', label: 'Verified Conveyancers' },
    { key: 'completedTransfers', label: 'Completed Transfers' },
    { key: 'averageClientRating', label: 'Average Client Rating' },
    { key: 'averageTransferTime', label: 'Average Transfer Time', suffix: ' days' },
    { key: 'citiesCovered', label: 'Cities Covered' },
    { key: 'averageResponseHours', label: 'Response Time', suffix: 'h' },
    { key: 'repeatClientPct', label: 'Repeat Client %', suffix: '%' },
    { key: 'clientSatisfactionPct', label: 'Client Satisfaction', suffix: '%' },
];

function useCountUp(target: number, active: boolean) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!active) return;
        let frame = 0;
        const steps = 28;
        const id = window.setInterval(() => {
            frame += 1;
            setValue(Number(((target * frame) / steps).toFixed(target % 1 ? 1 : 0)));
            if (frame >= steps) window.clearInterval(id);
        }, 28);
        return () => window.clearInterval(id);
    }, [target, active]);
    return value;
}

function StatCell({
    label,
    target,
    suffix,
    active,
}: {
    label: string;
    target: number;
    suffix?: string;
    active: boolean;
}) {
    const value = useCountUp(target, active);
    return (
        <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-charcoal/[0.06] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal/45">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-charcoal">
                {value.toLocaleString('en-ZA')}
                {suffix || ''}
            </p>
        </div>
    );
}

export default function StatsStrip() {
    const [active, setActive] = useState(false);
    useEffect(() => {
        const t = window.setTimeout(() => setActive(true), 120);
        return () => window.clearTimeout(t);
    }, []);

    return (
        <section className={`${CC_CARD_FLAT} bg-gradient-to-br from-white to-slate-50 p-5 sm:p-6`}>
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-charcoal">Marketplace pulse</h2>
                <p className="text-sm text-charcoal/50">Live demo metrics across verified PropReady firms.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {STATS.map((s) => (
                    <StatCell
                        key={s.key}
                        label={s.label}
                        target={PLATFORM_STATS[s.key]}
                        suffix={s.suffix}
                        active={active}
                    />
                ))}
            </div>
        </section>
    );
}
