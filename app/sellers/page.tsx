import Link from 'next/link';
import { Calendar } from 'lucide-react';
import LearnHubModuleCard from '@/components/LearnHubModuleCard';
import LearningLandingRoot from '@/components/marketing/learn/LearningLandingRoot';
import LearningLandingShell, {
    LearningHubCta,
    LearningHubHero,
} from '@/components/marketing/learn/LearningLandingShell';
import { createClient } from '@supabase/supabase-js';

async function getAgentCount(): Promise<number> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return 0;
    try {
        const supabase = createClient(url, key);
        const { count } = await supabase.from('agents').select('*', { count: 'exact', head: true });
        return count ?? 0;
    } catch {
        return 0;
    }
}

const SELLER_MODULES: {
    href: string;
    title: string;
    description: string;
    icon: string;
    progressSlug: string;
}[] = [
    {
        href: '/sellers/pricing-strategy',
        progressSlug: 'seller-pricing-strategy',
        title: 'Pricing Your Property',
        description:
            'Learn how to determine the right asking price, understand market valuations, and set competitive prices that attract buyers.',
        icon: 'DollarSign',
    },
    {
        href: '/sellers/agent-selection',
        progressSlug: 'seller-agent-selection',
        title: 'Choosing the Right Agent',
        description:
            'Understand agent commissions, sole mandates vs open mandates, and how to select an agent who will sell your property quickly.',
        icon: 'Users',
    },
    {
        href: '/sellers/marketing',
        progressSlug: 'seller-marketing',
        title: 'Marketing Your Property',
        description:
            'Learn about property photography, staging, online listings, and effective marketing strategies to reach qualified buyers.',
        icon: 'Target',
    },
    {
        href: '/sellers/sale-process',
        progressSlug: 'seller-sale-process',
        title: 'The Selling Process',
        description:
            'Step-by-step guide through accepting offers, negotiating terms, conveyancing, and what to expect during the transfer process.',
        icon: 'FileText',
    },
    {
        href: '/sellers/costs',
        progressSlug: 'seller-costs',
        title: 'Selling Costs & Fees',
        description:
            'Understand agent commissions, bond cancellation fees, rates and levies, and all costs associated with selling your property.',
        icon: 'BarChart3',
    },
    {
        href: '/sellers/tips',
        progressSlug: 'seller-tips',
        title: 'Seller Tips & Best Practices',
        description:
            "Essential tips for preparing your home for sale, handling viewings, negotiating offers, and maximizing your property's value.",
        icon: 'CheckCircle',
    },
    {
        href: '/sellers/selling-deceased-estate',
        progressSlug: 'seller-selling-deceased-estate',
        title: 'Selling a Deceased Estate',
        description:
            "What you need to know when selling property from a deceased estate: executors, Master's Office, timelines, and your role as seller.",
        icon: 'Building2',
    },
    {
        href: '/sellers/understanding-trusts',
        progressSlug: 'seller-understanding-trusts',
        title: 'Understanding Trusts',
        description:
            'Selling property held in a trust: trustee authority, resolutions, bond cancellation, and what buyers and conveyancers need from you.',
        icon: 'Scale',
    },
    {
        href: '/sellers/first-time-seller-mistakes',
        progressSlug: 'seller-first-time-seller-mistakes',
        title: 'Mistakes First-Time Sellers Make',
        description:
            'Common pitfalls: overpricing, skipping prep, poor photos, and how to avoid them to sell faster and at a better price.',
        icon: 'AlertCircle',
    },
    {
        href: '/sellers/selling-pitfalls',
        progressSlug: 'seller-selling-pitfalls',
        title: 'What to Avoid When Selling',
        description:
            "Don't make these mistakes: hiding defects, poor staging, ignoring bond clearance, and other pitfalls that delay or derail a sale.",
        icon: 'ShieldCheck',
    },
    {
        href: '/sellers/selling-property-under-business',
        progressSlug: 'seller-selling-property-under-business',
        title: 'Selling a Property Under a Business',
        description:
            'What is required when selling property held by a company or close corporation: resolutions, bond cancellation, and tax considerations.',
        icon: 'Briefcase',
    },
];

export default async function SellersHubPage() {
    const agentCount = await getAgentCount();
    const showFindAgent = agentCount > 10;

    return (
        <LearningLandingRoot>
            <LearningLandingShell>
                <LearningHubHero
                    eyebrow="Learning Center — Sellers"
                    title="Sell your property with confidence"
                    description="Everything you need to know about selling in South Africa — pricing, agents, marketing, costs, and the path to transfer."
                    actions={
                        <Link href="/sellers/property-quiz" className="hl-btn hl-btn--primary">
                            <Calendar className="w-5 h-5" strokeWidth={1.75} />
                            <span>Book a Free Valuation</span>
                        </Link>
                    }
                />
                <section className="lc-section">
                    <div className="hl-shell">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                            {SELLER_MODULES.map((module, index) => (
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
                            title="Ready to list your property?"
                            description="Connect with verified agents who can help you sell with clarity — and keep learning as you go."
                        >
                            <Link href="/sellers/property-quiz" className="hl-btn hl-btn--primary">
                                <Calendar className="w-5 h-5" strokeWidth={1.75} />
                                <span>Book a Free Valuation</span>
                            </Link>
                            {showFindAgent ? (
                                <Link href="/agents/login" className="hl-btn hl-btn--ghost">
                                    Find an Agent
                                </Link>
                            ) : null}
                            <Link href="/learn" className="hl-btn hl-btn--ghost">
                                Buyers hub
                            </Link>
                            <Link href="/learn/investors" className="hl-btn hl-btn--ghost">
                                Investors hub
                            </Link>
                        </LearningHubCta>
                    </div>
                </section>
            </LearningLandingShell>
        </LearningLandingRoot>
    );
}
