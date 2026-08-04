import Link from 'next/link';
import type { ReactNode } from 'react';
import PublicSiteHeader from '@/components/PublicSiteHeader';

type LearningLandingShellProps = {
    children: ReactNode;
    backHref?: string;
    backLabel?: string;
    /** Full marketing nav (homepage style). Default: back + logo only. */
    fullNav?: boolean;
    className?: string;
};

export default function LearningLandingShell({
    children,
    backHref = '/learning-center',
    backLabel = 'Back to Learning Center',
    fullNav = false,
    className = '',
}: LearningLandingShellProps) {
    return (
        <>
            <PublicSiteHeader
                backHref={fullNav ? undefined : backHref}
                backLabel={backLabel}
                showDesktopNav={fullNav}
                mobileLinks={fullNav ? undefined : []}
            />
            <main className={`home-landing lc-page ${className}`}>{children}</main>
        </>
    );
}

type LearningHubHeroProps = {
    eyebrow: string;
    title: string;
    description: string;
    actions?: ReactNode;
    compact?: boolean;
    /** Show link back to the learning hubs index or a parent hub. */
    showHubsLink?: boolean;
    hubLinkHref?: string;
    hubLinkLabel?: string;
};

export function LearningHubHero({
    eyebrow,
    title,
    description,
    actions,
    compact = false,
    showHubsLink = true,
    hubLinkHref = '/learning-center',
    hubLinkLabel = '← All learning hubs',
}: LearningHubHeroProps) {
    return (
        <section className={`hl-surface-dark lc-hero relative ${compact ? '!rounded-[var(--hl-radius-lg)]' : ''}`}>
            <div className="hl-shell relative z-10">
                {showHubsLink && !compact ? (
                    <div className="mb-6 flex justify-end">
                        <Link
                            href={hubLinkHref}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FECACA] hover:text-white transition"
                        >
                            {hubLinkLabel}
                        </Link>
                    </div>
                ) : null}
                <div className="lc-hero-inner">
                    <p className="hl-eyebrow hl-eyebrow--light">{eyebrow}</p>
                    <h1 className="hl-display text-[clamp(2.1rem,4.8vw,3.5rem)] text-white tracking-tight leading-[1.08]">
                        {title}
                    </h1>
                    <p className="hl-lede hl-lede--light !mt-4">{description}</p>
                    {actions ? <div className="lc-hero-actions">{actions}</div> : null}
                </div>
            </div>
        </section>
    );
}

type LearningHubCtaProps = {
    title: string;
    description: string;
    children: ReactNode;
};

export function LearningHubCta({ title, description, children }: LearningHubCtaProps) {
    return (
        <div className="hl-shell lc-cta-band">
            <div className="hl-surface-dark relative">
                <div className="relative z-10 text-center max-w-2xl mx-auto">
                    <h2 className="hl-display text-[clamp(1.75rem,3.5vw,2.5rem)] text-white tracking-tight">
                        {title}
                    </h2>
                    <p className="hl-lede hl-lede--light !mx-auto !mt-3">{description}</p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">{children}</div>
                </div>
            </div>
        </div>
    );
}
