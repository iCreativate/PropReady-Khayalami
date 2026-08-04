'use client';

import type { KnowledgeBlock, KnowledgeVariant } from '@/lib/buyer-learn/types';

const VARIANT_STYLES: Record<
    KnowledgeVariant,
    { label: string; wrap: string; accent: string }
> = {
    takeaway: {
        label: 'Key takeaway',
        wrap: 'border-charcoal/10 bg-white',
        accent: 'text-charcoal',
    },
    'did-you-know': {
        label: 'Did you know',
        wrap: 'border-sky-200/80 bg-sky-50/70',
        accent: 'text-sky-800',
    },
    tip: {
        label: 'Pro tip',
        wrap: 'border-amber-200/80 bg-amber-50/70',
        accent: 'text-amber-900',
    },
    warning: {
        label: 'Warning',
        wrap: 'border-orange-200/80 bg-orange-50/70',
        accent: 'text-orange-900',
    },
    mistake: {
        label: 'Common mistake',
        wrap: 'border-rose-200/80 bg-rose-50/70',
        accent: 'text-rose-900',
    },
    'myth-fact': {
        label: 'Myth vs fact',
        wrap: 'border-charcoal/10 bg-white',
        accent: 'text-charcoal',
    },
    definition: {
        label: 'Quick definition',
        wrap: 'border-emerald-200/80 bg-emerald-50/60',
        accent: 'text-emerald-900',
    },
    insight: {
        label: 'Expert insight',
        wrap: 'border-slate-200 bg-slate-50/80',
        accent: 'text-slate-800',
    },
    law: {
        label: 'South African law',
        wrap: 'border-charcoal/15 bg-charcoal/[0.03]',
        accent: 'text-charcoal',
    },
    numbers: {
        label: 'Numbers that matter',
        wrap: 'border-gold/25 bg-gold/[0.06]',
        accent: 'text-gold',
    },
};

export default function KnowledgeCard({ block }: { block: KnowledgeBlock }) {
    const style = VARIANT_STYLES[block.variant];

    return (
        <article
            className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${style.wrap}`}
            aria-label={style.label}
        >
            <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${style.accent}`}>
                {style.label}
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-charcoal">
                {block.title}
            </h3>
            {block.variant === 'myth-fact' ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-rose-50/80 border border-rose-100 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                            Myth
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-charcoal/75">
                            {block.myth}
                        </p>
                    </div>
                    <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                            Fact
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-charcoal/75">
                            {block.fact}
                        </p>
                    </div>
                </div>
            ) : (
                <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-charcoal/70">
                    {block.body}
                </p>
            )}
        </article>
    );
}
