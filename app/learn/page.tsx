'use client';

import Link from 'next/link';
import {
    ArrowLeft,
    ArrowUpRight,
    BookOpen,
    Home,
    FileText,
    Calculator,
    Users,
    Coins,
    Wallet,
    Building2,
    Scale,
    AlertCircle,
    ShieldCheck,
    Briefcase,
    type LucideIcon,
} from 'lucide-react';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PortalPageHeader from '@/components/PortalPageHeader';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import {
    PORTAL_MARKETING_CTA,
    PORTAL_MODULE_CARD,
    PORTAL_MODULE_CARD_ICON,
    PORTAL_PAGE_CONTAINER,
} from '@/lib/portal-ui';

const LEARN_MODULES: {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        href: '/learn/home-loans',
        title: 'Understanding Home Loans',
        description:
            'Learn about bond applications, interest rates, deposit requirements, and why you should use a bond originator.',
        icon: Calculator,
    },
    {
        href: '/learn/prequalification',
        title: 'Getting Prequalified',
        description:
            'Why getting prequalified early matters, how it works, and how it helps you shop with confidence and stronger offers.',
        icon: ShieldCheck,
    },
    {
        href: '/learn/buying-process',
        title: 'The Buying Process',
        description:
            'Step-by-step guide through property search, making an offer, transfer costs, conveyancers, and registration.',
        icon: FileText,
    },
    {
        href: '/learn/agents',
        title: 'Working with Agents',
        description:
            'How to find and select the right estate agent, understanding commission, and how PropReady connects you with verified professionals.',
        icon: Users,
    },
    {
        href: '/learn/first-time-tips',
        title: 'First-Time Buyer Tips',
        description:
            'Essential advice for first-time buyers including budgeting, hidden costs, inspection tips, and making smart decisions.',
        icon: Home,
    },
    {
        href: '/learn/transfer-costs',
        title: 'Transfer & Hidden Costs',
        description:
            'A detailed breakdown of transfer duties, attorney fees, and bond registration costs based on property value.',
        icon: Wallet,
    },
    {
        href: '/learn/flisp-subsidy',
        title: 'Government Subsidies (FLISP)',
        description:
            'Learn about the Finance Linked Individual Subsidy Programme (FLISP) and how it can help you buy your first home if you earn between R3,501 and R22,000.',
        icon: Coins,
    },
    {
        href: '/learn/buying-deceased-estate',
        title: 'Buying a Deceased Estate',
        description:
            "What you need to know when buying a property from a deceased estate: executors, Master's Office, delays, and how to protect yourself.",
        icon: Building2,
    },
    {
        href: '/learn/understanding-trusts',
        title: 'Understanding Trusts',
        description:
            'Buying property held in a trust: trustees, consent, bond implications, and what to check before you sign.',
        icon: Scale,
    },
    {
        href: '/learn/first-time-buyer-mistakes',
        title: 'Mistakes First-Time Buyers Make',
        description:
            'Common pitfalls: skipping pre-qualification, ignoring hidden costs, emotional bidding, and how to avoid them.',
        icon: AlertCircle,
    },
    {
        href: '/learn/bond-application-avoid',
        title: 'What to Avoid When Applying for a Bond',
        description:
            "Don't make these mistakes: job-hopping, new credit, incomplete documents, and other factors that can delay or derail your bond approval.",
        icon: ShieldCheck,
    },
    {
        href: '/learn/buying-property-as-business',
        title: 'Buying a Property as a Business',
        description:
            'What is required when buying property in a company or close corporation name: documents, bond requirements, and tax considerations.',
        icon: Briefcase,
    },
];

function LearnModuleCard({
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

export default function LearnPage() {
    const { user } = useHydratedBuyerPortalUser();

    const pageHeader = (
        <PortalPageHeader
            variant="premium"
            eyebrow="Buyer education"
            title="Learning Center"
            description="Guides on bonds, costs, agents, and first-time buying — so you can move with confidence."
        />
    );

    const learnPublicHeader = (
        <PublicSiteHeader
            backHref="/"
            backLabel="Back to Home"
            showDesktopNav={false}
            mobileLinks={[]}
        />
    );

    const moduleGrid = (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {LEARN_MODULES.map((module, index) => (
                <LearnModuleCard key={module.href} {...module} index={index} />
            ))}
        </div>
    );

    return (
        <BuyerPortalShell
            activePage="learn"
            title="Learning Center"
            pageHeader={user ? pageHeader : undefined}
            publicChrome={learnPublicHeader}
        >
            {user ? (
                <div className={PORTAL_PAGE_CONTAINER}>{moduleGrid}</div>
            ) : (
                <div className="relative min-h-full">
                    <div className={`${PORTAL_PAGE_CONTAINER} relative z-10`}>
                        <div className="text-center mb-12 sm:mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
                                <BookOpen className="w-5 h-5 text-gold" />
                                <span className="text-gold font-semibold">Learning Center — Buyers</span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal mb-6 tracking-tight">
                                Master Your Home Journey
                            </h1>
                            <p className="text-lg sm:text-xl text-charcoal/70 max-w-3xl mx-auto leading-relaxed">
                                Everything you need to know about buying your first home in South Africa.
                                Learn at your own pace with our comprehensive guides.
                            </p>
                        </div>

                        {moduleGrid}

                        <div className="mt-14 sm:mt-16 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-gold/10 p-8 sm:p-12 text-center">
                            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal mb-3">
                                Ready to Start Your Journey?
                            </h2>
                            <p className="text-charcoal/60 mb-8 max-w-xl mx-auto">
                                Take our quick quiz to get pre-qualified and see your property matches.
                            </p>
                            <Link href="/get-started" className={PORTAL_MARKETING_CTA}>
                                <span>Get Started Now</span>
                                <ArrowLeft className="w-5 h-5 rotate-180" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </BuyerPortalShell>
    );
}
