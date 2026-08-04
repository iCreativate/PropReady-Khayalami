'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowUpRight,
    BarChart3,
    BookOpen,
    Briefcase,
    Building2,
    Calculator,
    CheckCircle,
    Coins,
    DollarSign,
    FileText,
    Home,
    PiggyBank,
    Scale,
    ShieldCheck,
    Target,
    TrendingUp,
    Users,
    Wallet,
    type LucideIcon,
} from 'lucide-react';
import { getLessonProgress } from '@/lib/buyer-learn';
import {
    PORTAL_MODULE_CARD,
    PORTAL_MODULE_CARD_BADGE,
    PORTAL_MODULE_CARD_BADGE_ACTIVE,
    PORTAL_MODULE_CARD_ICON,
    PORTAL_MODULE_CARD_INDEX,
    PORTAL_MODULE_CARD_LINK,
} from '@/lib/portal-ui';

const ICON_MAP: Record<string, LucideIcon> = {
    AlertCircle,
    AlertTriangle,
    BarChart3,
    BookOpen,
    Briefcase,
    Building2,
    Calculator,
    CheckCircle,
    Coins,
    DollarSign,
    FileText,
    Home,
    PiggyBank,
    Scale,
    ShieldCheck,
    Target,
    TrendingUp,
    Users,
    Wallet,
};

export type LearnHubModuleCardProps = {
    href: string;
    title: string;
    description: string;
    /** Icon name key — must be serializable for Server → Client boundaries. */
    icon: string;
    index: number;
    /** When set, loads immersive lesson progress for this slug. */
    progressSlug?: string;
    /** Static badge when progress is not used (default: Immersive). */
    badgeLabel?: string;
    /** Hide progress track when false (default true if progressSlug set). */
    showProgress?: boolean;
    ctaLabel?: string;
    continueLabel?: string;
    /** Landing-page visual language (default). Use `portal` inside dashboard shells if needed. */
    variant?: 'landing' | 'portal';
};

/**
 * Shared learning-hub module card — used by buyer, seller, and investor hubs.
 */
export default function LearnHubModuleCard({
    href,
    title,
    description,
    icon,
    index,
    progressSlug,
    badgeLabel = 'Immersive',
    showProgress,
    ctaLabel = 'Start learning',
    continueLabel = 'Continue learning',
    variant = 'landing',
}: LearnHubModuleCardProps) {
    const Icon = ICON_MAP[icon] || BookOpen;
    const displayIndex = String(index + 1).padStart(2, '0');
    const [progress, setProgress] = useState(0);
    const trackProgress = showProgress ?? Boolean(progressSlug);

    useEffect(() => {
        if (!progressSlug) return;
        setProgress(getLessonProgress(progressSlug).percent);
    }, [progressSlug]);

    if (variant === 'portal') {
        return (
            <Link href={href} className={PORTAL_MODULE_CARD_LINK}>
                <article className={PORTAL_MODULE_CARD}>
                    <span className={PORTAL_MODULE_CARD_INDEX} aria-hidden>
                        {displayIndex}
                    </span>

                    <div className="relative flex flex-col h-full min-h-[220px]">
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div className={PORTAL_MODULE_CARD_ICON}>
                                <Icon className="w-5 h-5 text-gold" strokeWidth={2} />
                            </div>
                            {trackProgress && progress > 0 ? (
                                <span className={PORTAL_MODULE_CARD_BADGE_ACTIVE}>
                                    {Math.round(progress)}%
                                </span>
                            ) : (
                                <span className={PORTAL_MODULE_CARD_BADGE}>{badgeLabel}</span>
                            )}
                        </div>

                        <h3 className="text-lg font-semibold text-charcoal mb-2 pr-12 group-hover:text-gold transition-colors duration-200 leading-snug tracking-tight">
                            {title}
                        </h3>

                        <p className="flex-1 text-charcoal/45 text-sm leading-[1.65] line-clamp-3 mb-5">
                            {description}
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-1">
                            <span className="text-sm font-semibold text-gold">
                                {progress > 5 ? continueLabel : ctaLabel}
                            </span>
                            <ArrowUpRight className="w-4 h-4 text-charcoal/25 group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                        </div>

                        {trackProgress ? (
                            <div className="mt-3 h-1 overflow-hidden rounded-full bg-charcoal/10">
                                <div
                                    className="h-full bg-gold transition-[width] duration-300"
                                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                                />
                            </div>
                        ) : null}
                    </div>
                </article>
            </Link>
        );
    }

    return (
        <Link href={href} className="lc-module-link group">
            <article className="lc-module-card">
                <span className="lc-module-index" aria-hidden>
                    {displayIndex}
                </span>

                <div className="relative z-[1] flex flex-col h-full">
                    <div className="mb-1 flex items-start justify-between gap-3">
                        <div className="lc-module-icon">
                            <Icon className="w-5 h-5" strokeWidth={1.75} />
                        </div>
                        {trackProgress && progress > 0 ? (
                            <span className="lc-module-badge lc-module-badge--active">
                                {Math.round(progress)}%
                            </span>
                        ) : (
                            <span className="lc-module-badge">{badgeLabel}</span>
                        )}
                    </div>

                    <h3 className="lc-module-title">{title}</h3>
                    <p className="lc-module-body">{description}</p>

                    <div className="lc-module-footer">
                        <span className="lc-module-cta">
                            {progress > 5 ? continueLabel : ctaLabel}
                        </span>
                        <ArrowUpRight
                            className="w-4 h-4 text-charcoal/25 group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
                            strokeWidth={1.75}
                        />
                    </div>

                    {trackProgress ? (
                        <div className="lc-module-progress">
                            <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                        </div>
                    ) : null}
                </div>
            </article>
        </Link>
    );
}
