import type { ReactNode } from 'react';
import { BRAND_DARK_GLOW, BRAND_DARK_SURFACE } from '@/lib/brand-surface';

export const PORTAL_HERO_SHELL = `${BRAND_DARK_SURFACE} rounded-[1.5rem] border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.28)]`;

export const PORTAL_HERO_STAT =
    'rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur';

export const PORTAL_HERO_SECONDARY_BTN =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50';

export type PortalHeroStat = {
    label: string;
    value: ReactNode;
    tone?: 'default' | 'success';
};

export interface PortalHeroProps {
    eyebrow?: string;
    eyebrowIcon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    stats?: PortalHeroStat[];
    children?: ReactNode;
    size?: 'default' | 'compact';
    className?: string;
    headingAs?: 'h1' | 'h2';
}

export default function PortalHero({
    eyebrow,
    eyebrowIcon,
    title,
    description,
    actions,
    stats,
    children,
    size = 'default',
    className = '',
    headingAs = 'h1',
}: PortalHeroProps) {
    const compact = size === 'compact';
    const Heading = headingAs;

    return (
        <section
            data-portal-hero
            className={`${PORTAL_HERO_SHELL} ${compact ? 'p-5 sm:p-6' : 'p-6 sm:p-10'} ${className}`}
        >
            <div className={BRAND_DARK_GLOW} aria-hidden />
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />

            <div className={`relative z-10 flex flex-col ${compact ? 'gap-5' : 'gap-8'}`}>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl min-w-0">
                        {eyebrow ? (
                            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 ring-1 ring-white/10">
                                {eyebrowIcon}
                                {eyebrow}
                            </p>
                        ) : null}
                        <Heading
                            className={`${eyebrow ? (compact ? 'mt-3' : 'mt-4') : ''} font-semibold tracking-tight text-white ${
                                compact
                                    ? 'text-2xl sm:text-3xl'
                                    : 'text-3xl sm:text-4xl lg:text-5xl'
                            }`}
                        >
                            {title}
                        </Heading>
                        {description ? (
                            <div
                                className={`${compact ? 'mt-2' : 'mt-4'} text-sm leading-relaxed text-white/70 ${
                                    compact ? '' : 'sm:text-base'
                                }`}
                            >
                                {description}
                            </div>
                        ) : null}
                        {children}
                    </div>
                    {actions ? (
                        <div className="flex flex-wrap gap-2 print:hidden shrink-0">{actions}</div>
                    ) : null}
                </div>

                {stats && stats.length > 0 ? (
                    <div
                        className={`grid gap-3 ${
                            stats.length >= 3 ? 'sm:grid-cols-3' : stats.length === 2 ? 'sm:grid-cols-2' : ''
                        }`}
                    >
                        {stats.map((stat) => (
                            <div key={stat.label} className={PORTAL_HERO_STAT}>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                                    {stat.label}
                                </p>
                                <p
                                    className={`mt-1 text-xl font-semibold tabular-nums ${
                                        stat.tone === 'success' ? 'text-emerald-300' : 'text-white'
                                    }`}
                                >
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
