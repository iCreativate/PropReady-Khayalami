'use client';

import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentPageHeader from '@/components/AgentPageHeader';
import AgentLearnArticleContent from '@/components/AgentLearnArticleContent';
import AgentLearnCallout from '@/components/AgentLearnCallout';
import AgentLearnSection, { AgentLearnBullets, AgentLearnInfo } from '@/components/AgentLearnSection';
import { LEARN_MODULE_META } from '@/lib/agent-learn-meta';
import { AGENT_PAGE_CONTAINER } from '@/lib/agent-portal-ui';

import { GROWTH_LEARN_ARTICLES } from '@/lib/agent-learn-growth-articles';
import { COMPLIANCE_LEARN_ARTICLES } from '@/lib/agent-learn-compliance-articles';
import { PRACTICE_LEARN_ARTICLES } from '@/lib/agent-learn-practice-articles';

const AGENT_MODULES_BASE: Record<string, { title: string; icon: string; content: React.ReactNode }> = {
    'lead-conversion': {
        title: 'Lead Conversion Best Practices',
        icon: 'UserPlus',
        content: (
            <div className="contents">
                <p>
                    Prequalified leads from PropReady have already shown intent and affordability. Your job is to
                    convert that potential into viewings and offers. Here&apos;s how to do it consistently.
                </p>

                <AgentLearnSection title="1. Speed matters">
                    <p>
                        Contact new leads within the first 2 hours. Studies show that leads contacted within 5 minutes
                        are 21× more likely to qualify than those contacted after 30 minutes.
                    </p>
                    <AgentLearnInfo variant="important">
                        <p>
                            Check your PropReady dashboard regularly and prioritise &quot;new&quot; leads first every
                            morning.
                        </p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="2. Use the pre-qualification data">
                    <p>
                        You have access to their budget, preferred areas, and property type. Reference this in your
                        first message — personalisation builds trust instantly.
                    </p>
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            'Open with their budget and area: "I saw you\'re looking for a 3-bed around R2.5m in Sandton…"',
                            'Offer 2 specific matches in the first message — not a generic catalogue.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. Qualify further before viewings">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Confirm their timeline (buying now vs. in 6 months)',
                            'Ask about finance: pre-approved or still with bond originator?',
                            'Clarify non-negotiables: schools, commute, security',
                        ]}
                    />
                    <p>This prevents wasted viewings and shows you respect their time.</p>
                </AgentLearnSection>

                <AgentLearnSection title="4. Book viewings quickly">
                    <p>
                        PropReady helps you manage viewings. Offer 2–3 specific time slots rather than &quot;when are
                        you free?&quot; This reduces back-and-forth and increases commitment.
                    </p>
                </AgentLearnSection>

                <AgentLearnCallout title="Quick Win">
                    <p>
                        Mark leads as &quot;contacted&quot; or &quot;qualified&quot; in your dashboard so you
                        can track your pipeline and follow up on warm leads who haven&apos;t viewed yet.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'eaab-compliance': {
        title: 'EAAB Compliance & Ethics',
        icon: 'ShieldCheck',
        content: (
            <div className="contents">
                <p>
                    The Estate Agency Affairs Board (EAAB) regulates estate agents in South Africa. Compliance
                    protects you, your clients, and your reputation.
                </p>

                <AgentLearnSection title="1. Registration">
                    <p>
                        You must be registered with the EAAB to practice as an estate agent. Ensure your Fidelity
                        Fund Certificate (FFC) is current and displayed where required.
                    </p>
                    <AgentLearnInfo variant="eaab">
                        <p>Operating without a valid FFC is illegal.</p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="2. Mandatory disclosure">
                    <AgentLearnBullets
                        variant="compliance"
                        items={[
                            'Disclose your status as an estate agent in all dealings.',
                            'Disclose any interest you have in a property (e.g. if you or a related party are the seller).',
                        ]}
                    />
                    <AgentLearnInfo variant="warning">
                        <p>Failure to disclose can lead to disciplinary action and civil claims.</p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="3. Commission">
                    <p>
                        Commission must be agreed in writing (typically in the mandate or OTP). Avoid verbal
                        agreements. The EAAB sets guidelines; ensure your agreements are clear and enforceable.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="4. Handling trust money">
                    <AgentLearnBullets
                        variant="warning"
                        items={[
                            'Deposit and other trust funds must be held in a designated trust account.',
                            'Never mix trust money with operating funds.',
                            'Keep meticulous records for audits.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="5. Ethical conduct">
                    <AgentLearnBullets
                        variant="compliance"
                        items={[
                            'Act in the best interest of your client',
                            'Do not misrepresent properties or withhold material facts',
                            'Treat all parties fairly and avoid conflicts of interest',
                            'Maintain confidentiality',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnCallout title="Stay updated">
                    <p>
                        Visit the EAAB website regularly for updates on regulations, CPD requirements, and
                        industry notices.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'listing-tips': {
        title: 'Property Marketing & Listing Tips',
        icon: 'Megaphone',
        content: (
            <div className="contents">
                <p>
                    Great listings attract more viewings and sell faster. Here&apos;s how to make your
                    properties stand out on PropReady and other portals.
                </p>

                <AgentLearnSection title="1. Photos matter most">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Use high-quality, well-lit photos — shoot during golden hour for warmth.',
                            'Include wide shots of each room, kitchen, bathrooms, and outdoor space.',
                            'Declutter and stage before shooting.',
                            'Consider a professional photographer for premium listings.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. Write compelling descriptions">
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            'Lead with the best feature (view, location, finishes).',
                            'Use bullet points for specs; mention schools, transport, and amenities.',
                            'Avoid generic phrases like "must see" — be specific about why it\'s special.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. Price right">
                    <p>
                        Overpricing kills interest. Use comparables to advise sellers. PropReady&apos;s listing
                        score shows how your listing compares — use it to improve.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="4. Add a video">
                    <p>
                        Listings with video get more engagement. A simple walk-through on your phone is better
                        than none. Add the video URL to your PropReady listing for extra impact.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="5. Features & tags">
                    <p>
                        Tag all relevant features: pool, security, generator, etc. Buyers filter by these —
                        missing tags mean missed matches.
                    </p>
                </AgentLearnSection>

                <AgentLearnCallout title="PropReady tip">
                    <p>
                        Use the listing score in your dashboard to identify weak spots (e.g. missing photos,
                        short description) and improve before pushing to buyers.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'buyer-psychology': {
        title: 'Understanding Buyer Psychology',
        icon: 'Brain',
        content: (
            <div className="contents">
                <p>
                    Buyers make emotional decisions and justify them logically. Understanding this helps you
                    communicate better and close more deals.
                </p>

                <AgentLearnSection title='1. The "home" feeling'>
                    <p>
                        Most buyers want more than square metres — they want to imagine their life in the space.
                        Help them visualise with specific, emotional language.
                    </p>
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            '"This is where you could have Sunday braais."',
                            '"Perfect for the kids to play safely."',
                            '"Picture your morning coffee on this patio."',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. Fear of missing out (FOMO)">
                    <p>
                        Genuine scarcity motivates action. Use real facts — never invent interest.
                    </p>
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            '"Another agent has a viewing this afternoon."',
                            '"We\'ve had a lot of interest this week."',
                            '"This is the only unit at this price in the complex."',
                        ]}
                    />
                    <AgentLearnInfo variant="warning" title="Ethics first">
                        <p>Use FOMO ethically — never fabricate interest or invent competing offers.</p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="3. Objection handling">
                    <AgentLearnBullets
                        variant="warning"
                        items={[
                            { text: <><strong>&quot;The price is too high&quot;</strong> — Show comparables, emphasise value and unique features.</> },
                            { text: <><strong>&quot;We need to think about it&quot;</strong> — Ask what specifically they need to consider; address those points.</> },
                            { text: <><strong>&quot;We&apos;re still looking&quot;</strong> — Stay in touch. Many buyers need 3–6 months and multiple viewings.</> },
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="4. First-time buyers">
                    <p>
                        They&apos;re nervous about the process. Education builds trust and loyalty.
                    </p>
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            'Walk them through the bond process and typical timelines.',
                            'Explain transfer costs and what happens after OTP.',
                            'Point them to PropReady\'s buyer learning centre for more detail.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="5. Don&apos;t push">
                    <p>
                        Aggressive tactics backfire. Listen more than you talk.
                    </p>
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Ask what they love and what concerns them.',
                            'Adapt your pace to their decision style.',
                            'A patient agent wins more referrals than a pushy one.',
                        ]}
                    />
                </AgentLearnSection>
            </div>
        ),
    },
    'working-with-sellers': {
        title: 'Working with Sellers Effectively',
        icon: 'Handshake',
        content: (
            <div className="contents">
                <p>
                    Sellers want a quick sale at the best price. Your job is to manage expectations,
                    market effectively, and keep them informed.
                </p>

                <AgentLearnSection title="1. The pricing conversation">
                    <p>
                        Sellers often overvalue their property. Bring comparables and explain that overpricing
                        leads to fewer viewings and longer time on market.
                    </p>
                    <AgentLearnInfo variant="tip">
                        <p>A realistic price often achieves a better net result than an aspirational one.</p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="2. Pre-listing preparation">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Advise on decluttering, minor repairs, and staging.',
                            'A clean, bright home photographs and shows better.',
                            'Offer to connect them with handymen or stagers if needed.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. Communication cadence">
                    <p>
                        Agree on how often you&apos;ll update them (e.g. weekly, or after every viewing).
                    </p>
                    <AgentLearnInfo variant="important">
                        <p>Nothing erodes trust like silence. Even &quot;no news this week&quot; is better than nothing.</p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="4. Handling offers">
                    <AgentLearnBullets
                        items={[
                            'Present all offers promptly and in writing.',
                            'Explain the terms, not just the price: conditions, occupational rent, deposit.',
                            'Help sellers compare offers holistically.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="5. Long-term relationships">
                    <p>
                        A seller today may be a buyer tomorrow, or refer you to friends. Stay in touch after
                        the sale — a simple &quot;how&apos;s the new home?&quot; goes a long way.
                    </p>
                </AgentLearnSection>
            </div>
        ),
    },
    'digital-marketing': {
        title: 'Digital Marketing for Real Estate',
        icon: 'Smartphone',
        content: (
            <div className="contents">
                <p>
                    Your online presence determines how many leads you attract. Here&apos;s how to leverage
                    digital channels effectively.
                </p>

                <AgentLearnSection title="1. PropReady as your base">
                    <p>
                        PropReady gives you prequalified leads and a place to manage properties and viewings.
                        When buyers prequalify, they&apos;re matched with agents like you.
                    </p>
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Complete your profile and keep service areas accurate.',
                            'Optimise every listed property before pushing to buyers.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. Property portals">
                    <p>
                        List on Property24, Private Property, and others. Consistency across platforms builds trust.
                    </p>
                    <AgentLearnInfo variant="warning">
                        <p>Same photos, descriptions, and prices everywhere — inconsistency erodes credibility.</p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="3. Social media">
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            'LinkedIn — professional credibility and market commentary.',
                            'Facebook & Instagram — property showcases and local community.',
                            'Share insights and tips — not just "buy now" posts.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="4. Email marketing">
                    <p>
                        Build a list of past clients and interested buyers. Send monthly market updates and new
                        listings — keep it valuable, not spammy.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="5. Response time">
                    <p>
                        Reply to enquiries within minutes when possible. Speed signals professionalism and urgency.
                    </p>
                </AgentLearnSection>

                <AgentLearnCallout title="Quick win">
                    <p>
                        When you get a new PropReady lead, share relevant listings from your portfolio in
                        your first message. It shows you&apos;re prepared and saves them time.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'legal-basics': {
        title: 'Legal Compliance Basics',
        icon: 'Scale',
        content: (
            <div className="contents">
                <p>
                    Estate agents must navigate several legal frameworks. Here are the essentials you need
                    to know.
                </p>

                <AgentLearnSection title="1. Offer to Purchase (OTP)">
                    <p>
                        The OTP is the contract between buyer and seller. It must be in writing and signed by
                        both parties.
                    </p>
                    <AgentLearnBullets
                        variant="compliance"
                        items={[
                            'Include all material terms: price, conditions, occupational rent, deposit, deadlines.',
                            'Recommend legal advice before signing for both parties.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. FICA (Financial Intelligence Centre Act)">
                    <p>
                        When handling deposits or facilitating transactions, verify client identity and address.
                    </p>
                    <AgentLearnInfo variant="warning">
                        <p>Keep FICA documents (ID, proof of address) on file. Non-compliance can result in fines.</p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="3. POPIA (Protection of Personal Information)">
                    <AgentLearnBullets
                        variant="compliance"
                        items={[
                            'Only collect what you need for the transaction.',
                            'Use data only for the purpose it was collected.',
                            'Store it securely and allow access or correction on request.',
                        ]}
                    />
                    <p>
                        PropReady is designed with privacy in mind — ensure you handle leads&apos; data responsibly.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="4. Mandate">
                    <p>
                        A mandate is the agreement between you and the seller. It should specify commission,
                        duration, exclusivity, and scope. Get it in writing.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="5. When in doubt">
                    <AgentLearnInfo variant="important">
                        <p>
                            Refer to your principal or legal counsel. It&apos;s better to pause and confirm than
                            to risk a void contract or disciplinary issue.
                        </p>
                    </AgentLearnInfo>
                </AgentLearnSection>
            </div>
        ),
    },
    'negotiation-skills': {
        title: 'Negotiation Skills',
        icon: 'MessageSquare',
        content: (
            <div className="contents">
                <p>
                    Every deal involves negotiation. Strong negotiation skills help you close more sales and
                    keep all parties satisfied.
                </p>

                <AgentLearnSection title="1. Understand both sides">
                    <p>
                        Before negotiating, know what each party wants: price, occupation date, conditions,
                        inclusions. The best deals create value for both — not just a win-lose on price.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="2. Anchor carefully">
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            'The first number sets the frame — use comparables to support your position.',
                            'If the seller is unrealistic, show market data before the first offer arrives.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. Use concessions strategically">
                    <p>
                        Don&apos;t give things away for free. Each concession should feel earned.
                    </p>
                    <AgentLearnInfo variant="tip">
                        <p>
                            Example: &quot;If you can bring the deposit to 10%, we can look at reducing the
                            price by R20k.&quot;
                        </p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="4. Deadlines create movement">
                    <p>
                        &quot;The offer is valid until 5pm tomorrow&quot; can focus minds — use deadlines ethically.
                    </p>
                    <AgentLearnInfo variant="warning">
                        <p>Never fabricate competing interest or false deadlines.</p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="5. Stay calm">
                    <p>
                        Emotions escalate. If things get tense, suggest a short break. Your role is to facilitate
                        agreement, not to take sides or lose your cool.
                    </p>
                </AgentLearnSection>

                <AgentLearnCallout title="Golden rule">
                    <p>
                        A deal that falls apart later helps no one. Ensure both parties understand and accept
                        the terms. Clarity prevents disputes.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'time-management': {
        title: 'Time Management for Agents',
        icon: 'Target',
        content: (
            <div className="contents">
                <p>
                    Agents juggle viewings, admin, marketing, and follow-ups. Without systems, you burn out
                    or drop balls. Here&apos;s how to work smarter.
                </p>

                <AgentLearnSection title="1. Prioritise hot leads">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'New leads — contact within 2 hours.',
                            'Leads who have viewed — follow up same day.',
                            'Qualified buyers with a short timeline — top of your list.',
                        ]}
                    />
                    <p>Use your PropReady dashboard to filter and sort by priority.</p>
                </AgentLearnSection>

                <AgentLearnSection title="2. Batch similar tasks">
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            'All calls in one block.',
                            'All listing updates in another.',
                            'Viewings clustered by area — less driving, more focus.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. Use a CRM (or PropReady)">
                    <p>
                        Track where each lead is: new, contacted, viewed, offer made. Set reminders for
                        follow-ups. Use status filters and notes to stay organised.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="4. Schedule admin time">
                    <AgentLearnInfo variant="important">
                        <p>
                            Block 30–60 minutes daily for paperwork, emails, and updates. If you don&apos;t
                            schedule it, it spills into evenings and weekends.
                        </p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="5. Protect your off-time">
                    <AgentLearnBullets
                        items={[
                            'Set boundaries: no calls after 8pm unless urgent.',
                            'Protect at least one weekend day off.',
                            'Sustainable pace beats short-term hustle.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnCallout title="PropReady tip">
                    <p>
                        Use the Viewings section to schedule and manage appointments in one place. Fewer
                        tools = less chaos.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
};

const AGENT_MODULES = {
    ...AGENT_MODULES_BASE,
    ...GROWTH_LEARN_ARTICLES,
    ...COMPLIANCE_LEARN_ARTICLES,
    ...PRACTICE_LEARN_ARTICLES,
};

export default function AgentLearnArticlePage() {
    const router = useRouter();
    const params = useParams();
    const slug = typeof params.slug === 'string' ? params.slug : '';
    const [currentAgent, setCurrentAgent] = useState<AgentPortalAgent | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const agent = localStorage.getItem('propReady_currentAgent');
        if (!agent) {
            router.replace('/agents/login');
            return;
        }
        setCurrentAgent(JSON.parse(agent));
    }, [router]);

    const agentModule = AGENT_MODULES[slug];

    if (!slug || !agentModule) {
        notFound();
    }

    const meta = LEARN_MODULE_META[slug];

    return (
        <AgentPortalLayout
            activePage="learn"
            agent={currentAgent}
            title="Learning Hub"
            pageHeader={
                <AgentPageHeader
                    variant="premium"
                    eyebrow="Learning Hub – Agents"
                    title={agentModule.title}
                >
                    <Link
                        href="/agents/learn"
                        className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-semibold text-white transition hover:bg-white/15"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Learning Hub
                    </Link>
                </AgentPageHeader>
            }
        >
            <div className={AGENT_PAGE_CONTAINER}>
                <AgentLearnArticleContent
                    category={meta?.category}
                    readMinutes={meta?.readMinutes}
                    title={agentModule.title}
                >
                    {agentModule.content}
                </AgentLearnArticleContent>
            </div>
        </AgentPortalLayout>
    );
}
