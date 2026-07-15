'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentPageHeader from '@/components/AgentPageHeader';
import AgentLearnHubHero from '@/components/AgentLearnHubHero';
import AgentLearnFeaturedCard from '@/components/AgentLearnFeaturedCard';
import AgentLearnModuleCard from '@/components/AgentLearnModuleCard';
import {
    AGENT_PAGE_CONTAINER,
    AGENT_PRIMARY_BTN,
    AGENT_LEARN_CTA,
    AGENT_LEARN_SECTION,
    AGENT_LEARN_SECTION_TITLE,
    AGENT_SECTION_LABEL,
} from '@/lib/agent-portal-ui';
import { LEARN_MODULE_HIGHLIGHTS } from '@/lib/agent-learn-highlights';
import {
    ArrowLeft,
    UserPlus,
    ShieldCheck,
    Megaphone,
    Brain,
    Handshake,
    Smartphone,
    Scale,
    MessageSquare,
    Mic,
    Target,
    Magnet,
    TrendingUp,
    Trophy,
    Repeat,
    Presentation,
    Home,
    Landmark,
    FileText,
    BadgeCheck,
    Vault,
    BookMarked,
    ScrollText,
    Share2,
    Mail,
    LineChart,
    DoorOpen,
    AlertTriangle,
    Workflow,
    Sunrise,
} from 'lucide-react';

const MODULES = [
    {
        slug: 'winning-formula',
        icon: Trophy,
        title: 'The Winning Formula for Top-Producing Agents',
        category: 'Sales',
        readMinutes: 10,
        featured: true,
        description:
            'The proven model top agents use: leads, speed, trust, and listings — broken into a weekly scorecard you can run today.',
    },
    {
        slug: 'how-to-get-leads',
        icon: Magnet,
        title: 'How to Get More Quality Leads',
        category: 'Sales',
        readMinutes: 8,
        description:
            'Build a predictable lead engine: farm areas, referrals, portals, and PropReady prequalified buyers.',
    },
    {
        slug: 'leads-to-clients',
        icon: TrendingUp,
        title: 'Convert Leads to Clients: A Proven Pipeline',
        category: 'Sales',
        readMinutes: 9,
        description:
            'The 5-stage pipeline, first-call script, and objection handling that turns enquiries into signed mandates.',
    },
    {
        slug: 'follow-up-system',
        icon: Repeat,
        title: 'The 7-Touch Follow-Up System',
        category: 'Sales',
        readMinutes: 7,
        description:
            'A 14-day follow-up sequence used by high-conversion teams — structured touches that add value every time.',
    },
    {
        slug: 'lead-conversion',
        icon: UserPlus,
        title: 'Lead Conversion Best Practices',
        category: 'Sales',
        readMinutes: 6,
        description:
            'How to turn prequalified leads into closed deals. Follow-up timing, qualifying questions, and building trust.',
    },
    {
        slug: 'buyer-psychology',
        icon: Brain,
        title: 'Understanding Buyer Psychology',
        category: 'Sales',
        readMinutes: 6,
        description:
            'What motivates buyers, common objections, and how to align your approach with their decision-making process.',
    },
    {
        slug: 'negotiation-skills',
        icon: MessageSquare,
        title: 'Negotiation Skills',
        category: 'Sales',
        readMinutes: 6,
        description:
            'Essential negotiation techniques for offers, counter-offers, and closing deals that work for all parties.',
    },
    {
        slug: 'winning-pitch',
        icon: Mic,
        title: 'The Winning Pitch: Scripts & Objection Handling',
        category: 'Sales',
        readMinutes: 8,
        description:
            '4-part pitch structure, LAER objection framework, buyer and seller scripts, and closes that earn the mandate.',
    },
    {
        slug: 'understanding-homeloans',
        icon: Home,
        title: 'Understanding Home Loans for Agents',
        category: 'Finance',
        readMinutes: 9,
        description:
            'Bond basics, pre-approval vs grant, affordability, transfer costs, and EAAB boundaries for agents.',
    },
    {
        slug: 'bond-origination',
        icon: Landmark,
        title: 'Bond Origination: A Guide for Estate Agents',
        category: 'Finance',
        readMinutes: 8,
        description:
            'Work with originators ethically, reduce failed OTPs, and stay compliant on referrals and finance clauses.',
    },
    {
        slug: 'transfer-and-registration',
        icon: ScrollText,
        title: 'Transfer, Bond Registration & Timelines',
        category: 'Finance',
        readMinutes: 7,
        description:
            'Attorneys, deeds office, typical timelines, and your post-OTP checklist as an agent.',
    },
    {
        slug: 'eaab-compliance',
        icon: ShieldCheck,
        title: 'EAAB Compliance & Ethics',
        category: 'Compliance',
        readMinutes: 7,
        description:
            'Understand the Estate Agency Affairs Board requirements, ethical conduct, and staying compliant in South Africa.',
    },
    {
        slug: 'eaab-code-of-conduct',
        icon: BookMarked,
        title: 'EAAB Code of Conduct: Essentials',
        category: 'Compliance',
        readMinutes: 9,
        description:
            'Core duties, marketing rules, conflicts of interest, CPA, and POPIA for registered estate agents.',
    },
    {
        slug: 'eaab-mandates-and-commission',
        icon: FileText,
        title: 'EAAB: Mandates, Commission & Disclosure',
        category: 'Compliance',
        readMinutes: 8,
        description:
            'Sole vs exclusive mandates, written commission terms, and mandatory disclosure under EAAB rules.',
    },
    {
        slug: 'eaab-fidelity-fund-cpd',
        icon: BadgeCheck,
        title: 'EAAB: FFC, Fidelity Fund & CPD',
        category: 'Compliance',
        readMinutes: 7,
        description:
            'Fidelity Fund Certificate renewal, fidelity fund protection, and annual CPD requirements.',
    },
    {
        slug: 'eaab-trust-money',
        icon: Vault,
        title: 'EAAB: Trust Money & Record-Keeping',
        category: 'Compliance',
        readMinutes: 7,
        description:
            'Trust account golden rules, deposits, FICA at payment stage, and disciplinary risks.',
    },
    {
        slug: 'legal-basics',
        icon: Scale,
        title: 'Legal Compliance Basics',
        category: 'Compliance',
        readMinutes: 8,
        description:
            'OTPs, FICA, POPIA, and key legal requirements every agent should know when facilitating property transactions.',
    },
    {
        slug: 'listing-tips',
        icon: Megaphone,
        title: 'Property Marketing & Listing Tips',
        category: 'Marketing',
        readMinutes: 5,
        description:
            'Stand out with better listings: photography, descriptions, pricing, and showcasing properties effectively.',
    },
    {
        slug: 'digital-marketing',
        icon: Smartphone,
        title: 'Digital Marketing for Real Estate',
        category: 'Marketing',
        readMinutes: 5,
        description:
            'Social media, property portals, email marketing, and leveraging PropReady to grow your digital presence.',
    },
    {
        slug: 'social-media-for-agents',
        icon: Share2,
        title: 'Social Media That Wins Listings & Buyers',
        category: 'Marketing',
        readMinutes: 6,
        description:
            'Content pillars, platform focus, and turning comments and DMs into mandates and buyer conversations.',
    },
    {
        slug: 'email-and-nurture',
        icon: Mail,
        title: 'Email & WhatsApp Nurture Sequences',
        category: 'Marketing',
        readMinutes: 6,
        description:
            'POPIA-safe nurture flows for buyers and sellers — stay top-of-mind without sounding pushy.',
    },
    {
        slug: 'listing-presentations',
        icon: Presentation,
        title: 'Win Listing Presentations Every Time',
        category: 'Listings',
        readMinutes: 7,
        description:
            'CMA prep, presentation flow, and closing for the mandate — the framework top listing agents use.',
    },
    {
        slug: 'working-with-sellers',
        icon: Handshake,
        title: 'Working with Sellers Effectively',
        category: 'Listings',
        readMinutes: 5,
        description:
            'Getting listings, pricing conversations, managing expectations, and building long-term seller relationships.',
    },
    {
        slug: 'pricing-to-sell',
        icon: LineChart,
        title: 'Pricing to Sell: CMAs & Seller Conversations',
        category: 'Listings',
        readMinutes: 7,
        description:
            'Build defensible CMAs, handle pricing objections, and know when to recommend a strategic review.',
    },
    {
        slug: 'show-day-playbook',
        icon: DoorOpen,
        title: 'The Show Day Playbook',
        category: 'Listings',
        readMinutes: 6,
        description:
            'Prep, run, and follow up show days — turn foot traffic into offers with a repeatable playbook.',
    },
    {
        slug: 'time-management',
        icon: Target,
        title: 'Time Management for Agents',
        category: 'Productivity',
        readMinutes: 5,
        description:
            'Prioritising leads, balancing viewings and admin, and systems to work smarter without burning out.',
    },
    {
        slug: 'agent-mistakes',
        icon: AlertTriangle,
        title: 'Top Mistakes Agents Make (and How to Avoid Them)',
        category: 'Productivity',
        readMinutes: 8,
        description:
            'Slow follow-up, overpricing, compliance gaps, and weak systems — the fixes top producers use.',
    },
    {
        slug: 'crm-and-systems',
        icon: Workflow,
        title: 'CRM & Pipeline Systems That Scale',
        category: 'Productivity',
        readMinutes: 6,
        description:
            'Minimum viable pipeline stages, daily CRM hygiene, and keeping PropReady in sync with your workflow.',
    },
    {
        slug: 'daily-routine-top-producers',
        icon: Sunrise,
        title: 'Daily Routines of Top-Producing Agents',
        category: 'Productivity',
        readMinutes: 6,
        description:
            'Morning revenue blocks, batched admin, and weekly anchors that protect your pipeline.',
    },
] as const;

const CATEGORY_ORDER = ['Sales', 'Finance', 'Compliance', 'Marketing', 'Listings', 'Productivity'] as const;

export default function AgentLearnPage() {
    const router = useRouter();
    const [currentAgent, setCurrentAgent] = useState<AgentPortalAgent | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const agent = localStorage.getItem('propReady_currentAgent');
            if (!agent) {
                router.push('/agents/login');
                return;
            }
            setCurrentAgent(JSON.parse(agent));
        }
    }, [router]);

    const featured = MODULES.find((m) => 'featured' in m && m.featured) ?? MODULES[0];
    const gridModules = MODULES.filter((m) => m.slug !== featured.slug);

    const groupedModules = useMemo(() => {
        return CATEGORY_ORDER.map((category) => ({
            category,
            modules: gridModules.filter((m) => m.category === category),
        })).filter((g) => g.modules.length > 0);
    }, [gridModules]);

    const totalReadMinutes = MODULES.reduce((sum, m) => sum + m.readMinutes, 0);
    let cardIndex = 0;

    return (
        <AgentPortalLayout
            activePage="learn"
            agent={currentAgent}
            title="Learning Hub"
            pageHeader={
                <AgentPageHeader
                    variant="premium"
                    eyebrow="Learning Hub – Agents"
                    title="Grow Your Real Estate Career"
                    description="Practical guides and tips to help you convert more leads, stay compliant, and build a stronger reputation in the South African property market."
                />
            }
        >
            <div className={`${AGENT_PAGE_CONTAINER} relative z-10`}>
                <AgentLearnHubHero
                    articleCount={MODULES.length}
                    totalMinutes={totalReadMinutes}
                    topicCount={CATEGORY_ORDER.length}
                />

                <AgentLearnFeaturedCard {...featured} highlights={LEARN_MODULE_HIGHLIGHTS[featured.slug]} />

                {groupedModules.map(({ category, modules }) => (
                    <section key={category} className={AGENT_LEARN_SECTION}>
                        <div className={AGENT_LEARN_SECTION_TITLE}>
                            <span className="w-8 h-px bg-gold/50" />
                            <h2 className={AGENT_SECTION_LABEL}>{category}</h2>
                            <span className="flex-1 h-px bg-charcoal/[0.06]" />
                            <span className="text-xs text-charcoal/35 font-medium tabular-nums">
                                {modules.length} {modules.length === 1 ? 'guide' : 'guides'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                            {modules.map((module) => {
                                const idx = cardIndex++;
                                return (
                                    <AgentLearnModuleCard
                                        key={module.slug}
                                        {...module}
                                        highlights={LEARN_MODULE_HIGHLIGHTS[module.slug]}
                                        index={idx}
                                    />
                                );
                            })}
                        </div>
                    </section>
                ))}

                <div className={AGENT_LEARN_CTA}>
                    <div
                        className="absolute inset-0 bg-charcoal"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 100% 0%, rgba(220,38,38,0.35) 0%, transparent 50%)',
                        }}
                    />
                    <div className="relative grid md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-center p-8 sm:p-10 lg:p-12 text-white">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold mb-2">
                                Put it into practice
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-semibold mb-3 tracking-tight">
                                Apply What You Learn
                            </h2>
                            <p className="text-base text-white/55 max-w-xl leading-relaxed">
                                Your dashboard is where theory becomes commission — manage leads, list
                                properties, and book viewings in one place.
                            </p>
                        </div>
                        <Link
                            href="/agents/dashboard"
                            className={`${AGENT_PRIMARY_BTN} shrink-0 shadow-[0_4px_16px_rgba(220,38,38,0.35)]`}
                        >
                            <span>Go to Dashboard</span>
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </Link>
                    </div>
                </div>
            </div>
        </AgentPortalLayout>
    );
}
