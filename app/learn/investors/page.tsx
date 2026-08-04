import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import LearnHubModuleCard from '@/components/LearnHubModuleCard';
import LearningLandingShell, {
    LearningHubCta,
    LearningHubHero,
} from '@/components/marketing/learn/LearningLandingShell';

const INVESTOR_MODULES: {
    href: string;
    title: string;
    description: string;
    icon: string;
    progressSlug: string;
}[] = [
    {
        href: '/learn/investors/strategies',
        progressSlug: 'investor-strategies',
        title: 'Investment Strategies',
        description:
            'What a property investment strategy is — capital allocation, risk limits, and acquisition criteria — then compare buy-to-let, value-add, commercial, and REIT exposure.',
        icon: 'Target',
    },
    {
        href: '/learn/investors/returns',
        progressSlug: 'investor-returns',
        title: 'Calculating Returns',
        description:
            'Master ROI, rental yield, capital growth, and cash flow analysis to make informed investment decisions.',
        icon: 'BarChart3',
    },
    {
        href: '/learn/investors/financing',
        progressSlug: 'investor-financing',
        title: 'Investment Financing',
        description:
            'Understand investment property loans, deposit requirements, interest rates, and leveraging strategies for portfolio growth.',
        icon: 'DollarSign',
    },
    {
        href: '/learn/investors/tax',
        progressSlug: 'investor-tax',
        title: 'Tax & Legal Considerations',
        description:
            'Learn about rental income tax, capital gains tax, deductions, and legal structures for property investment in South Africa.',
        icon: 'PiggyBank',
    },
    {
        href: '/learn/investors/portfolio',
        progressSlug: 'investor-portfolio',
        title: 'Portfolio Management',
        description:
            'Strategies for managing multiple properties, tenant relations, maintenance, and scaling your investment portfolio effectively.',
        icon: 'Building2',
    },
    {
        href: '/learn/investors/market-analysis',
        progressSlug: 'investor-market-analysis',
        title: 'Market Analysis',
        description:
            'Learn how to analyze property markets, identify growth areas, assess property values, and spot investment opportunities.',
        icon: 'TrendingUp',
    },
    {
        href: '/learn/investors/pre-purchase-mistakes',
        progressSlug: 'investor-pre-purchase-mistakes',
        title: 'Pre-Purchase Mistakes',
        description:
            'Avoid costly errors before you buy. Learn about insufficient research, emotional decisions, and poor location choices that can derail your investment.',
        icon: 'AlertTriangle',
    },
    {
        href: '/learn/investors/financial-mistakes',
        progressSlug: 'investor-financial-mistakes',
        title: 'Financial Mistakes',
        description:
            'Protect your finances. Understand how underestimating costs and over-leveraging can turn a promising investment into a financial burden.',
        icon: 'AlertTriangle',
    },
    {
        href: '/learn/investors/property-management-mistakes',
        progressSlug: 'investor-property-management-mistakes',
        title: 'Property Management Mistakes',
        description:
            'Manage your properties effectively. Learn how inadequate tenant screening and maintenance neglect can cost you thousands and damage your investment.',
        icon: 'AlertTriangle',
    },
    {
        href: '/learn/investors/portfolio-strategy-mistakes',
        progressSlug: 'investor-portfolio-strategy-mistakes',
        title: 'Portfolio Strategy Mistakes',
        description:
            'What portfolio strategy means — plus diversification, tax planning, realistic expectations, and scaling with systems.',
        icon: 'AlertTriangle',
    },
];

export default function InvestorsLearnPage() {
    return (
        <LearningLandingShell>
            <LearningHubHero
                eyebrow="Learning Center — Investors"
                title="Build your property portfolio"
                description="Master property investment in South Africa. Learn strategies, analyse returns, and build wealth through real estate — with clarity, not hype."
            />
            <section className="lc-section">
                <div className="hl-shell">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                        {INVESTOR_MODULES.map((module, index) => (
                            <LearnHubModuleCard
                                key={module.href}
                                href={module.href}
                                title={module.title}
                                description={module.description}
                                icon={module.icon}
                                index={index}
                                progressSlug={module.progressSlug}
                                badgeLabel="Immersive"
                            />
                        ))}
                    </div>

                    <LearningHubCta
                        title="Ready to start investing?"
                        description="Connect with verified professionals and keep learning before you underwrite a deal."
                    >
                        <Link href="/get-started" className="hl-btn hl-btn--primary">
                            <span>Get Started</span>
                            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                        </Link>
                        <Link href="/learn" className="hl-btn hl-btn--ghost">
                            Buyers hub
                        </Link>
                        <Link href="/sellers" className="hl-btn hl-btn--ghost">
                            Sellers hub
                        </Link>
                    </LearningHubCta>
                </div>
            </section>
        </LearningLandingShell>
    );
}
