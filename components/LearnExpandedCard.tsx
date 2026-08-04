import type { LucideIcon } from 'lucide-react';
import {
    PORTAL_LEARN_EXPANDED_BODY,
    PORTAL_LEARN_EXPANDED_CARD,
    PORTAL_LEARN_EXPANDED_HERO,
    PORTAL_LEARN_EXPANDED_HERO_GLOW,
} from '@/lib/portal-ui';

type LearnExpandedCardProps = {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    footer?: React.ReactNode;
};

/**
 * Shared expanded learning article shell (charcoal hero + white body).
 * Used by buyer LearnArticleShell, seller modules, and investor modules.
 */
export default function LearnExpandedCard({
    title,
    subtitle = 'A focused learning module to guide you step-by-step.',
    icon: Icon,
    children,
    footer,
}: LearnExpandedCardProps) {
    return (
        <div className={PORTAL_LEARN_EXPANDED_CARD}>
            <div className={PORTAL_LEARN_EXPANDED_HERO}>
                <div
                    className={PORTAL_LEARN_EXPANDED_HERO_GLOW}
                    style={{
                        background:
                            'radial-gradient(ellipse 80% 60% at 90% 10%, rgba(220,38,38,0.45), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(255,255,255,0.08), transparent)',
                    }}
                    aria-hidden
                />
                <div className="relative px-6 md:px-10 py-6 md:py-8">
                    <div className="flex items-start gap-4">
                        {Icon ? (
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                                <Icon className="w-6 h-6 md:w-7 md:h-7 text-[#FECACA]" strokeWidth={2} />
                            </div>
                        ) : null}
                        <div>
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight">
                                {title}
                            </h1>
                            {subtitle ? (
                                <p className="mt-2 text-white/65 text-sm md:text-base max-w-xl leading-relaxed">
                                    {subtitle}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className={PORTAL_LEARN_EXPANDED_BODY}>
                <div className="prose max-w-none text-charcoal/90">{children}</div>
                {footer}
            </div>
        </div>
    );
}
