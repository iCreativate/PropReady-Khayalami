interface AgentPageHeaderProps {
    eyebrow?: string;
    title: React.ReactNode;
    description?: string;
    className?: string;
    children?: React.ReactNode;
    variant?: 'default' | 'premium';
}

export default function AgentPageHeader({
    eyebrow,
    title,
    description,
    className = '',
    children,
    variant = 'default',
}: AgentPageHeaderProps) {
    const isPremium = variant === 'premium';

    return (
        <div className={`${isPremium ? 'mb-0' : 'mb-8 sm:mb-10'} ${className}`}
        >
            {eyebrow && (
                <p
                    className={`text-gold font-semibold uppercase mb-3 ${
                        isPremium
                            ? 'text-[11px] sm:text-xs tracking-[0.14em]'
                            : 'text-xs sm:text-sm tracking-wider mb-2'
                    }`}
                >
                    {eyebrow}
                </p>
            )}
            {isPremium ? (
                <h2
                    className="text-charcoal tracking-tight text-[2rem] sm:text-4xl lg:text-[2.75rem] font-semibold leading-[1.15] mb-3"
                >
                    {title}
                </h2>
            ) : (
                <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight mb-2">
                    {title}
                </h1>
            )}
            {description && (
                <p
                    className={`max-w-2xl leading-relaxed ${
                        isPremium
                            ? 'text-charcoal/45 text-[15px] sm:text-base mt-0'
                            : 'text-charcoal/55 text-base sm:text-lg'
                    }`}
                >
                    {description}
                </p>
            )}
            {children}
        </div>
    );
}
