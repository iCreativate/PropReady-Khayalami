import PortalHero from '@/components/PortalHero';

interface AgentPageHeaderProps {
    eyebrow?: string;
    title: React.ReactNode;
    description?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
    /** `premium` / `default` = global dark portal hero. `section` = light in-card heading. */
    variant?: 'default' | 'premium' | 'section';
    size?: 'default' | 'compact';
    actions?: React.ReactNode;
}

export default function AgentPageHeader({
    eyebrow,
    title,
    description,
    className = '',
    children,
    variant = 'premium',
    size = 'default',
    actions,
}: AgentPageHeaderProps) {
    if (variant === 'section') {
        return (
            <div className={`mb-0 ${className}`}>
                {eyebrow ? (
                    <p className="text-gold font-semibold uppercase mb-3 text-[11px] sm:text-xs tracking-[0.14em]">
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="text-charcoal tracking-tight text-[2rem] sm:text-4xl lg:text-[2.75rem] font-semibold leading-[1.15] mb-3">
                    {title}
                </h2>
                {description ? (
                    <div className="max-w-2xl leading-relaxed text-charcoal/45 text-[15px] sm:text-base mt-0">
                        {description}
                    </div>
                ) : null}
                {children}
            </div>
        );
    }

    return (
        <PortalHero
            eyebrow={eyebrow}
            title={title}
            description={description}
            actions={actions}
            size={size}
            className={className}
            headingAs="h1"
        >
            {children}
        </PortalHero>
    );
}
