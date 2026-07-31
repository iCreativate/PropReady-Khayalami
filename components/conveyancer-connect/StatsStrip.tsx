'use client';

import { CC_CARD_FLAT } from '@/components/conveyancer-connect/cc-ui';

export default function StatsStrip({ firmCount = 0 }: { firmCount?: number }) {
    const cells = [
        { label: 'Verified firms', value: String(firmCount) },
        { label: 'Live inbox', value: 'Quotes & chat' },
        { label: 'Matters', value: 'Track progress' },
        { label: 'Consultations', value: 'Book online' },
    ];

    return (
        <section className={`${CC_CARD_FLAT} bg-gradient-to-br from-white to-slate-50 p-5 sm:p-6`}>
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-charcoal">How Conveyancer Connect works</h2>
                <p className="text-sm text-charcoal/50">
                    Browse PropReady-approved firms, request quotes, and message attorneys in one place.
                </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {cells.map((c) => (
                    <div
                        key={c.label}
                        className="rounded-2xl bg-white/80 p-4 ring-1 ring-charcoal/[0.06] backdrop-blur"
                    >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal/45">
                            {c.label}
                        </p>
                        <p className="mt-2 text-xl font-semibold tracking-tight text-charcoal">{c.value}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
