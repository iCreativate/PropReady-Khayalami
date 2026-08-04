import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, Home, TrendingUp, type LucideIcon } from 'lucide-react';
import LearningLandingShell, {
    LearningHubCta,
    LearningHubHero,
} from '@/components/marketing/learn/LearningLandingShell';
import { LEARNING_HUBS } from '@/lib/learning-hubs';

const HUB_ICONS: Record<string, LucideIcon> = {
    Home,
    Building2,
    TrendingUp,
};

export default function LearningCenterPage() {
    return (
        <LearningLandingShell fullNav backHref="/" backLabel="Back to Home">
            <LearningHubHero
                showHubsLink={false}
                eyebrow="Learning Center"
                title="Choose your learning path"
                description="Free immersive courses for buyers, sellers, and property investors in South Africa. Pick a hub and learn at your own pace."
            />

            <section className="lc-section">
                <div className="hl-shell">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
                        {LEARNING_HUBS.map((hub) => {
                            const Icon = HUB_ICONS[hub.icon] || BookOpen;
                            return (
                                <Link key={hub.href} href={hub.href} className="group block h-full">
                                    <article className="lc-hub-card">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="lc-module-icon !mb-0">
                                                <Icon className="w-5 h-5" strokeWidth={1.75} />
                                            </div>
                                            <span className="lc-module-badge">Hub</span>
                                        </div>
                                        <h2 className="hl-display text-[clamp(1.75rem,3vw,2.25rem)] tracking-tight mb-3 group-hover:text-[var(--hl-red)] transition-colors">
                                            {hub.title}
                                        </h2>
                                        <p className="text-sm text-charcoal/55 leading-[1.7] flex-1 mb-8">
                                            {hub.description}
                                        </p>
                                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--hl-red)]">
                                            {hub.cta}
                                            <ArrowRight
                                                className="w-4 h-4 transition group-hover:translate-x-0.5"
                                                strokeWidth={1.75}
                                            />
                                        </span>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>

                    <LearningHubCta
                        title="Ready to start your journey?"
                        description="Take our quick quiz to get pre-qualified, then learn and prepare with the right hub for you."
                    >
                        <Link href="/get-started" className="hl-btn hl-btn--primary">
                            <span>Get Started Free</span>
                            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                        </Link>
                        <Link href="/calculator" className="hl-btn hl-btn--ghost">
                            Bond Calculator
                        </Link>
                    </LearningHubCta>
                </div>
            </section>
        </LearningLandingShell>
    );
}
