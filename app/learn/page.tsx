'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import LearnHubModuleCard from '@/components/LearnHubModuleCard';
import PortalPageHeader from '@/components/PortalPageHeader';
import PortalLoading from '@/components/PortalLoading';
import LearningLandingShell, {
    LearningHubCta,
    LearningHubHero,
} from '@/components/marketing/learn/LearningLandingShell';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';

const LEARN_MODULES: {
    href: string;
    title: string;
    description: string;
    icon: string;
    slug: string;
}[] = [
    {
        href: '/learn/home-loans',
        slug: 'home-loans',
        title: 'Understanding Home Loans',
        description:
            'Learn about bond applications, interest rates, deposit requirements, and why you should use a bond originator.',
        icon: 'Calculator',
    },
    {
        href: '/learn/prequalification',
        slug: 'prequalification',
        title: 'Getting Prequalified',
        description:
            'Understand soft vs full prequalification, what documents you need, and how PropReady helps you start.',
        icon: 'FileText',
    },
    {
        href: '/learn/buying-process',
        slug: 'buying-process',
        title: 'The Buying Process',
        description:
            'Step-by-step guide from searching to transfer — offers, finance, conveyancing, and registration.',
        icon: 'Home',
    },
    {
        href: '/learn/agents',
        slug: 'agents',
        title: 'Working with Estate Agents',
        description:
            'How agents are paid, what to expect, and how to choose a verified professional on PropReady.',
        icon: 'Users',
    },
    {
        href: '/learn/first-time-tips',
        slug: 'first-time-tips',
        title: 'First-Time Buyer Tips',
        description:
            'Practical advice for first-time buyers: budgeting, inspections, and avoiding common traps.',
        icon: 'BookOpen',
    },
    {
        href: '/learn/transfer-costs',
        slug: 'transfer-costs',
        title: 'Transfer Costs & Fees',
        description:
            'Transfer duty, attorney fees, bond registration, and how to budget for the full cost of purchase.',
        icon: 'Coins',
    },
    {
        href: '/learn/flisp-subsidy',
        slug: 'flisp-subsidy',
        title: 'FLISP Subsidy',
        description:
            'Who qualifies for the finance-linked individual subsidy, how it works, and what to verify before budgeting.',
        icon: 'Wallet',
    },
    {
        href: '/learn/buying-deceased-estate',
        slug: 'buying-deceased-estate',
        title: 'Buying a Deceased Estate',
        description:
            'Timelines, executors, and due diligence when purchasing from a deceased estate.',
        icon: 'Building2',
    },
    {
        href: '/learn/understanding-trusts',
        slug: 'understanding-trusts',
        title: 'Understanding Trusts',
        description:
            'Extra paperwork and checks when buying from — or into — a trust structure.',
        icon: 'Scale',
    },
    {
        href: '/learn/first-time-buyer-mistakes',
        slug: 'first-time-buyer-mistakes',
        title: 'First-Time Buyer Mistakes',
        description:
            'The predictable mistakes first-time buyers make — and how to avoid them.',
        icon: 'AlertCircle',
    },
    {
        href: '/learn/bond-application-avoid',
        slug: 'bond-application-avoid',
        title: 'What to Avoid During Bond Application',
        description:
            'Keep your application clean: no new credit, incomplete packs, or delayed replies.',
        icon: 'ShieldCheck',
    },
    {
        href: '/learn/buying-property-as-business',
        slug: 'buying-property-as-business',
        title: 'Buying a Property as a Business',
        description:
            'What is required when buying property in a company or close corporation name: documents, bond requirements, and tax considerations.',
        icon: 'Briefcase',
    },
    {
        href: '/learn/home-insurance',
        slug: 'home-insurance',
        title: 'Home Insurance Basics',
        description:
            'Building vs contents, bond requirements, and why rebuild cost — not purchase price — sets your sum insured.',
        icon: 'ShieldCheck',
    },
    {
        href: '/learn/insurance-types',
        slug: 'insurance-types',
        title: 'Types of Insurance',
        description:
            'Homeowners, contents, bond protection, and liability — different products for different ownership risks.',
        icon: 'FileText',
    },
    {
        href: '/learn/why-insurance-matters',
        slug: 'why-insurance-matters',
        title: 'Why Insurance Matters',
        description:
            'How cover protects equity and cash flow — and why banks treat building insurance as non-negotiable.',
        icon: 'AlertCircle',
    },
    {
        href: '/learn/choosing-an-insurer',
        slug: 'choosing-an-insurer',
        title: 'Finding the Right Insurer',
        description:
            'Compare more than premium: excesses, exclusions, disclosure, and licensed advice before you bind.',
        icon: 'CheckCircle',
    },
    {
        href: '/learn/uninsured-risks',
        slug: 'uninsured-risks',
        title: 'When You Have No Cover',
        description:
            'What happens if cover lapses, you are underinsured, or risk between occupation and transfer is unclear.',
        icon: 'AlertTriangle',
    },
];

export default function LearnPage() {
    const { user, isHydrated } = useHydratedBuyerPortalUser();

    const moduleGrid = (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {LEARN_MODULES.map((module, index) => (
                <LearnHubModuleCard
                    key={module.href}
                    href={module.href}
                    title={module.title}
                    description={module.description}
                    icon={module.icon}
                    index={index}
                    progressSlug={module.slug}
                    badgeLabel="Immersive"
                    variant={user ? 'portal' : 'landing'}
                />
            ))}
        </div>
    );

    const crossLinks = (
        <>
            <Link href="/get-started" className="hl-btn hl-btn--primary">
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
            <Link href="/sellers" className="hl-btn hl-btn--ghost">
                Sellers hub
            </Link>
            <Link href="/learn/investors" className="hl-btn hl-btn--ghost">
                Investors hub
            </Link>
        </>
    );

    if (!isHydrated) {
        return <PortalLoading message="Loading learning hub…" variant="dashboard" />;
    }

    if (user) {
        return (
            <BuyerPortalShell
                activePage="learn"
                title="Learning Center"
                pageHeader={
                    <PortalPageHeader
                        variant="premium"
                        eyebrow="Buyer education"
                        title="Learning Center"
                        description="Guides on bonds, costs, agents, and first-time buying — so you can move with confidence."
                    />
                }
            >
                <div className={`${PORTAL_PAGE_CONTAINER} space-y-10`}>
                    {moduleGrid}
                    <LearningHubCta
                        title="Ready to start your journey?"
                        description="Take our quick quiz to get pre-qualified, then keep learning as you move."
                    >
                        {crossLinks}
                    </LearningHubCta>
                </div>
            </BuyerPortalShell>
        );
    }

    return (
        <LearningLandingShell>
            <LearningHubHero
                eyebrow="Learning Center — Buyers"
                title="Master your home journey"
                description="Everything you need to know about buying a home in South Africa. Learn at your own pace with immersive guides."
            />
            <section className="lc-section">
                <div className="hl-shell">
                    {moduleGrid}
                    <LearningHubCta
                        title="Ready to start your journey?"
                        description="Take our quick quiz to get pre-qualified, then keep learning as you move."
                    >
                        {crossLinks}
                    </LearningHubCta>
                </div>
            </section>
        </LearningLandingShell>
    );
}
