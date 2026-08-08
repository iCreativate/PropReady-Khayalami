import type { ReactNode } from 'react';

/**
 * Portal page hero — identical to the Buyer Dashboard `biw-hero`.
 * Charcoal → deep-red gradient, glass side panel for stats/actions.
 */
export const PORTAL_HERO_SHELL = 'biw-hero';

/** @deprecated Heroes are inset in content padding; kept for callers. */
export const PORTAL_HERO_BLEED = '';

export const PORTAL_HERO_STAT = 'biw-hero-stat';

export const PORTAL_HERO_SECONDARY_BTN =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-white/18 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40';

export type PortalHeroStat = {
    label: string;
    value: ReactNode;
    tone?: 'default' | 'success';
};

export type PortalHeroMetric = {
    label: string;
    value: ReactNode;
};

export interface PortalHeroProps {
    eyebrow?: string;
    eyebrowIcon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    stats?: PortalHeroStat[];
    /** Left-column metric chips under the description (dashboard-style). */
    metrics?: PortalHeroMetric[];
    children?: ReactNode;
    /** @deprecated Always renders full dashboard size; prop ignored. */
    size?: 'default' | 'compact';
    className?: string;
    headingAs?: 'h1' | 'h2';
    /** Optional label above the glass panel (defaults to “Today’s pulse”) */
    glassLabel?: string;
}

export default function PortalHero({
    eyebrow,
    eyebrowIcon,
    title,
    description,
    actions,
    stats,
    metrics,
    children,
    className = '',
    headingAs = 'h1',
    glassLabel = "Today's pulse",
}: PortalHeroProps) {
    const Heading = headingAs;
    const hasStats = Boolean(stats && stats.length > 0);
    const hasMetrics = Boolean(metrics && metrics.length > 0);
    const showGlass = Boolean(actions) || hasStats;

    return (
        <section data-portal-hero className={`biw-hero ${className}`.trim()}>
            <div className={`biw-hero-grid${showGlass ? '' : ' biw-hero-grid--solo'}`}>
                <div className="min-w-0">
                    {eyebrow ? (
                        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                            {eyebrowIcon}
                            {eyebrow}
                        </p>
                    ) : null}
                    <Heading className="biw-hero-title">{title}</Heading>
                    {description ? <div className="biw-hero-sub">{description}</div> : null}

                    {hasMetrics ? (
                        <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:max-w-md">
                            {metrics!.map((metric) => (
                                <div key={metric.label}>
                                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                                        {metric.label}
                                    </p>
                                    <p className="mt-0.5 font-semibold tabular-nums text-white">
                                        {metric.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {children}
                </div>

                {showGlass ? (
                    <div className="biw-hero-glass">
                        {hasStats ? (
                            <>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                                    {glassLabel}
                                </p>
                                <div className="mt-3 space-y-3">
                                    {stats!.map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5 last:border-0 last:pb-0"
                                        >
                                            <span className="text-xs text-white/55">{stat.label}</span>
                                            <span
                                                className={`text-sm font-semibold tabular-nums ${
                                                    stat.tone === 'success'
                                                        ? 'text-emerald-300'
                                                        : 'text-white'
                                                }`}
                                            >
                                                {stat.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}
                        {actions ? (
                            <div
                                className={`flex flex-wrap gap-2 print:hidden ${
                                    hasStats ? 'mt-5' : ''
                                }`}
                            >
                                {actions}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
