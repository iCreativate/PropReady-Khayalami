import Link from 'next/link';
import {
    ArrowLeft,
    ArrowUpRight,
    BookOpen,
    TrendingUp,
    DollarSign,
    Building2,
    BarChart3,
    Target,
    PiggyBank,
    AlertTriangle,
    type LucideIcon,
} from 'lucide-react';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import {
    PORTAL_MARKETING_CTA,
    PORTAL_MODULE_CARD,
    PORTAL_MODULE_CARD_ICON,
    PORTAL_PAGE_CONTAINER,
    PORTAL_SECONDARY_BTN,
} from '@/lib/portal-ui';

const INVESTOR_MODULES: {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        href: '/learn/investors/strategies',
        title: 'Investment Strategies',
        description:
            'Learn about buy-to-let, fix-and-flip, commercial property, and other proven investment strategies for the South African market.',
        icon: Target,
    },
    {
        href: '/learn/investors/returns',
        title: 'Calculating Returns',
        description:
            'Master ROI, rental yield, capital growth, and cash flow analysis to make informed investment decisions.',
        icon: BarChart3,
    },
    {
        href: '/learn/investors/financing',
        title: 'Investment Financing',
        description:
            'Understand investment property loans, deposit requirements, interest rates, and leveraging strategies for portfolio growth.',
        icon: DollarSign,
    },
    {
        href: '/learn/investors/tax',
        title: 'Tax & Legal Considerations',
        description:
            'Learn about rental income tax, capital gains tax, deductions, and legal structures for property investment in South Africa.',
        icon: PiggyBank,
    },
    {
        href: '/learn/investors/portfolio',
        title: 'Portfolio Management',
        description:
            'Strategies for managing multiple properties, tenant relations, maintenance, and scaling your investment portfolio effectively.',
        icon: Building2,
    },
    {
        href: '/learn/investors/market-analysis',
        title: 'Market Analysis',
        description:
            'Learn how to analyze property markets, identify growth areas, assess property values, and spot investment opportunities.',
        icon: TrendingUp,
    },
    {
        href: '/learn/investors/pre-purchase-mistakes',
        title: 'Pre-Purchase Mistakes',
        description:
            'Avoid costly errors before you buy. Learn about insufficient research, emotional decisions, and poor location choices that can derail your investment.',
        icon: AlertTriangle,
    },
    {
        href: '/learn/investors/financial-mistakes',
        title: 'Financial Mistakes',
        description:
            'Protect your finances. Understand how underestimating costs and over-leveraging can turn a promising investment into a financial burden.',
        icon: AlertTriangle,
    },
    {
        href: '/learn/investors/property-management-mistakes',
        title: 'Property Management Mistakes',
        description:
            'Manage your properties effectively. Learn how inadequate tenant screening and maintenance neglect can cost you thousands and damage your investment.',
        icon: AlertTriangle,
    },
    {
        href: '/learn/investors/portfolio-strategy-mistakes',
        title: 'Portfolio Strategy Mistakes',
        description:
            'Build a successful portfolio. Avoid mistakes in diversification, tax planning, and setting unrealistic expectations that undermine long-term success.',
        icon: AlertTriangle,
    },
];

function InvestorModuleCard({
    href,
    title,
    description,
    icon: Icon,
    index,
}: {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
    index: number;
}) {
    const displayIndex = String(index + 1).padStart(2, '0');

    return (
        <Link
            href={href}
            className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:ring-offset-2 rounded-3xl"
        >
            <article className={PORTAL_MODULE_CARD}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/80 via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <span
                    className="absolute top-4 right-5 text-[3.5rem] font-bold leading-none text-charcoal/[0.04] group-hover:text-gold/[0.08] transition-colors duration-300 select-none tabular-nums"
                    aria-hidden
                >
                    {displayIndex}
                </span>

                <div className="relative flex flex-col h-full min-h-[220px]">
                    <div className={`${PORTAL_MODULE_CARD_ICON} mb-5`}>
                        <Icon className="w-5 h-5 text-gold" strokeWidth={2} />
                    </div>

                    <h3 className="text-lg font-semibold text-charcoal mb-2 pr-12 group-hover:text-gold transition-colors duration-200 leading-snug tracking-tight">
                        {title}
                    </h3>

                    <p className="flex-1 text-charcoal/45 text-sm leading-[1.65] line-clamp-3 mb-5">
                        {description}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="text-sm font-semibold text-gold">Start learning</span>
                        <ArrowUpRight className="w-4 h-4 text-charcoal/25 group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                    </div>
                </div>
            </article>
        </Link>
    );
}

export default function InvestorsLearnPage() {
    return (
        <div className="min-h-screen bg-white">
            <PublicSiteHeader
                backHref="/"
                backLabel="Back to Home"
                showDesktopNav={false}
                mobileLinks={[]}
            />

            <main className="relative min-h-screen px-4 pt-28 pb-16">
                <div className={`${PORTAL_PAGE_CONTAINER} relative z-10`}>
                    <div className="text-center mb-12 sm:mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
                            <BookOpen className="w-5 h-5 text-gold" />
                            <span className="text-gold font-semibold">
                                Learning Center — Investors
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal mb-6 tracking-tight">
                            Build Your Property Portfolio
                        </h1>
                        <p className="text-lg sm:text-xl text-charcoal/70 max-w-3xl mx-auto leading-relaxed">
                            Master the art of property investment in South Africa. Learn strategies,
                            analyze returns, and build wealth through real estate.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                        {INVESTOR_MODULES.map((module, index) => (
                            <InvestorModuleCard key={module.href} {...module} index={index} />
                        ))}
                    </div>

                    <div className="mt-14 sm:mt-16 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-gold/10 p-8 sm:p-12 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-charcoal mb-3">
                            Ready to Start Investing?
                        </h2>
                        <p className="text-charcoal/60 mb-8 max-w-xl mx-auto">
                            Connect with verified agents and explore investment properties.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                            <Link href="/search" className={PORTAL_MARKETING_CTA}>
                                <span>Browse Investment Properties</span>
                                <ArrowLeft className="w-5 h-5 rotate-180" />
                            </Link>
                            <Link href="/learn" className={`${PORTAL_SECONDARY_BTN} !h-12 !px-8 !text-base`}>
                                Buyer Learning Center
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
