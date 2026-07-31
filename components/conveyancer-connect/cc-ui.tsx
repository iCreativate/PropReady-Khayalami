import type { ReactNode } from 'react';

export const CC_CARD =
    'rounded-[1.25rem] border border-charcoal/[0.08] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04),0_12px_28px_rgba(17,24,39,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(17,24,39,0.1)]';

export const CC_CARD_FLAT =
    'rounded-[1.25rem] border border-charcoal/[0.08] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]';

export const CC_CHIP =
    'inline-flex items-center gap-1.5 rounded-full border border-charcoal/[0.1] bg-white px-3 py-1.5 text-xs font-semibold text-charcoal/70 transition hover:border-gold/30 hover:bg-gold/[0.04] hover:text-charcoal';

export const CC_CHIP_ACTIVE =
    'inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.08] px-3 py-1.5 text-xs font-semibold text-gold';

export const CC_INPUT =
    'w-full rounded-xl border border-charcoal/[0.12] bg-white px-3.5 py-2.5 text-sm text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-gold/40 focus:ring-2 focus:ring-gold/20';

export const CC_LABEL =
    'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal/45';

export const CC_SECTION_TITLE =
    'text-xl font-semibold tracking-tight text-charcoal sm:text-2xl';

export const CC_MUTED = 'text-sm leading-relaxed text-charcoal/55';

export function CcBadge({
    children,
    tone = 'neutral',
}: {
    children: ReactNode;
    tone?: 'neutral' | 'success' | 'gold' | 'danger';
}) {
    const tones = {
        neutral: 'bg-charcoal/[0.05] text-charcoal/70 ring-charcoal/10',
        success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
        gold: 'bg-gold/[0.1] text-gold ring-gold/20',
        danger: 'bg-red-50 text-red-700 ring-red-200',
    };
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${tones[tone]}`}
        >
            {children}
        </span>
    );
}

export function CcSkeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`animate-pulse rounded-2xl bg-gradient-to-r from-charcoal/[0.04] via-charcoal/[0.08] to-charcoal/[0.04] bg-[length:200%_100%] ${className}`}
        />
    );
}

export function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
    const full = Math.floor(rating);
    const cls = size === 'md' ? 'text-base' : 'text-xs';
    return (
        <span className={`inline-flex items-center gap-0.5 tabular-nums text-amber-500 ${cls}`} aria-label={`${rating} out of 5`}>
            {'★'.repeat(full)}
            {'☆'.repeat(Math.max(0, 5 - full))}
            <span className="ml-1 font-semibold text-charcoal">{rating.toFixed(1)}</span>
        </span>
    );
}

export function PricePips({ band }: { band: 1 | 2 | 3 | 4 }) {
    return (
        <span className="font-semibold tracking-tight text-charcoal/70" title={`Fee band ${band}/4`}>
            <span className="text-gold">{'R'.repeat(band)}</span>
            <span className="text-charcoal/25">{'R'.repeat(4 - band)}</span>
        </span>
    );
}
