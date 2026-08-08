import type { ReactNode } from 'react';
import PortalHero, { type PortalHeroMetric, type PortalHeroStat } from '@/components/PortalHero';

interface AgentPageHeaderProps {
    eyebrow?: string;
    eyebrowIcon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    className?: string;
    children?: ReactNode;
    /** `premium` / `default` = global dark portal hero. `section` = light in-card heading. */
    variant?: 'default' | 'premium' | 'section';
    /** @deprecated Always full dashboard size; prop ignored. */
    size?: 'default' | 'compact';
    actions?: ReactNode;
    stats?: PortalHeroStat[];
    metrics?: PortalHeroMetric[];
    glassLabel?: string;
}

export default function AgentPageHeader({
    eyebrow,
    eyebrowIcon,
    title,
    description,
    className = '',
    children,
    variant = 'premium',
    actions,
    stats,
    metrics,
    glassLabel,
}: AgentPageHeaderProps) {
    if (variant === 'section') {
        return (
            <div className={`mb-0 ${className}`}>
                {eyebrow ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/40 mb-3">
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="biw-sec-title text-[1.75rem] sm:text-[2rem] mb-2">{title}</h2>
                {description ? <div className="biw-sec-sub max-w-2xl text-[15px]">{description}</div> : null}
                {children}
            </div>
        );
    }

    return (
        <PortalHero
            eyebrow={eyebrow}
            eyebrowIcon={eyebrowIcon}
            title={title}
            description={description}
            actions={actions}
            stats={stats}
            metrics={metrics}
            glassLabel={glassLabel}
            className={className}
            headingAs="h1"
        >
            {children}
        </PortalHero>
    );
}
