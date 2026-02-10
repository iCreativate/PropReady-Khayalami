import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    ArrowLeft,
    BookOpen,
    Home,
    UserPlus,
    ShieldCheck,
    Megaphone,
    Brain,
    Handshake,
    Smartphone,
    Scale,
    MessageSquare,
    Target,
} from 'lucide-react';

const AGENT_MODULES: Record<string, { title: string; icon: string; content: React.ReactNode }> = {
    'lead-conversion': {
        title: 'Lead Conversion Best Practices',
        icon: 'UserPlus',
        content: (
            <div className="space-y-6 text-charcoal/90">
                <p className="text-lg">
                    Prequalified leads from PropReady have already shown intent and affordability. Your job is to
                    convert that potential into viewings and offers. Here&apos;s how to do it consistently.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Speed Matters</h3>
                <p>
                    Contact new leads within the first 2 hours. Studies show that leads contacted within 5 minutes
                    are 21x more likely to qualify than those contacted after 30 minutes. Check your PropReady
                    dashboard regularly and prioritise &quot;new&quot; leads.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Use the Pre-Qualification Data</h3>
                <p>
                    You have access to their budget, preferred areas, and property type. Reference this in your
                    first message. &quot;I saw you&apos;re looking for a 3-bed around R2.5m in Sandton—I have two
                    matches that just came on the market.&quot; Personalisation builds trust instantly.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Qualify Further Before Viewings</h3>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Confirm their timeline (buying now vs. in 6 months)</li>
                    <li>Ask about finance: pre-approved or still with bond originator?</li>
                    <li>Clarify non-negotiables: schools, commute, security</li>
                </ul>
                <p className="mt-4">
                    This prevents wasted viewings and shows you respect their time.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Book Viewings Quickly</h3>
                <p>
                    PropReady helps you manage viewings. Offer 2–3 specific time slots rather than &quot;when are
                    you free?&quot; This reduces back-and-forth and increases commitment.
                </p>

                <div className="premium-card p-6 rounded-xl mt-6 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                    <h4 className="text-xl font-bold text-gold mb-3">Quick Win</h4>
                    <p className="text-charcoal/80">
                        Mark leads as &quot;contacted&quot; or &quot;qualified&quot; in your dashboard so you
                        can track your pipeline and follow up on warm leads who haven&apos;t viewed yet.
                    </p>
                </div>
            </div>
        ),
    },
    'eaab-compliance': {
        title: 'EAAB Compliance & Ethics',
        icon: 'ShieldCheck',
        content: (
            <div className="space-y-6 text-charcoal/90">
                <p className="text-lg">
                    The Estate Agency Affairs Board (EAAB) regulates estate agents in South Africa. Compliance
                    protects you, your clients, and your reputation.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Registration</h3>
                <p>
                    You must be registered with the EAAB to practice as an estate agent. Ensure your Fidelity
                    Fund Certificate (FFC) is current and displayed where required. Operating without a valid
                    FFC is illegal.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Mandatory Disclosure</h3>
                <p>
                    Disclose your status as an estate agent in all dealings. Disclose any interest you have in
                    a property (e.g. if you or a related party are the seller). Failure to disclose can lead
                    to disciplinary action and civil claims.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Commission</h3>
                <p>
                    Commission must be agreed in writing (typically in the mandate or OTP). Avoid verbal
                    agreements. The EAAB sets guidelines; ensure your agreements are clear and enforceable.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Handling Trust Money</h3>
                <p>
                    Deposit and other trust funds must be held in a designated trust account. Never mix
                    trust money with operating funds. Keep meticulous records for audits.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">5. Ethical Conduct</h3>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Act in the best interest of your client</li>
                    <li>Do not misrepresent properties or withhold material facts</li>
                    <li>Treat all parties fairly and avoid conflicts of interest</li>
                    <li>Maintain confidentiality</li>
                </ul>

                <div className="premium-card p-6 rounded-xl mt-6 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                    <h4 className="text-xl font-bold text-gold mb-3">Stay Updated</h4>
                    <p className="text-charcoal/80">
                        Visit the EAAB website regularly for updates on regulations, CPD requirements, and
                        industry notices.
                    </p>
                </div>
            </div>
        ),
    },
    'listing-tips': {
        title: 'Property Marketing & Listing Tips',
        icon: 'Megaphone',
        content: (
            <div className="space-y-6 text-charcoal/90">
                <p className="text-lg">
                    Great listings attract more viewings and sell faster. Here&apos;s how to make your
                    properties stand out on PropReady and other portals.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Photos Matter Most</h3>
                <p>
                    Use high-quality, well-lit photos. Shoot during the golden hour for warmth. Include wide
                    shots of each room, the kitchen, bathrooms, and outdoor space. Avoid clutter—tidy and
                    stage before shooting. Consider a professional photographer for premium listings.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Write Compelling Descriptions</h3>
                <p>
                    Lead with the best feature (view, location, finishes). Use bullet points for specs.
                    Mention nearby schools, transport, and amenities. Avoid generic phrases like &quot;must
                    see&quot;—be specific about why it&apos;s special.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Price Right</h3>
                <p>
                    Overpricing kills interest. Use comparables (similar sold properties in the area) to
                    advise sellers. PropReady&apos;s listing score can help you see how your listing
                    compares—use it to improve.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Add a Video</h3>
                <p>
                    Listings with video get more engagement. A simple walk-through on your phone is better
                    than none. Add the video URL to your PropReady listing for extra impact.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">5. Features & Tags</h3>
                <p>
                    Tag all relevant features: pool, security, generator, etc. Buyers filter by these—missing
                    tags mean missed matches.
                </p>

                <div className="premium-card p-6 rounded-xl mt-6 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                    <h4 className="text-xl font-bold text-gold mb-3">PropReady Tip</h4>
                    <p className="text-charcoal/80">
                        Use the listing score in your dashboard to identify weak spots (e.g. missing photos,
                        short description) and improve before pushing to buyers.
                    </p>
                </div>
            </div>
        ),
    },
    'buyer-psychology': {
        title: 'Understanding Buyer Psychology',
        icon: 'Brain',
        content: (
            <div className="space-y-6 text-charcoal/90">
                <p className="text-lg">
                    Buyers make emotional decisions and justify them logically. Understanding this helps you
                    communicate better and close more deals.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. The &quot;Home&quot; Feeling</h3>
                <p>
                    Most buyers are looking for more than square metres—they want to imagine their life in
                    the space. Help them visualise: &quot;This is where you could have Sunday braais&quot; or
                    &quot;Perfect for the kids to play safely.&quot;
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Fear of Missing Out (FOMO)</h3>
                <p>
                    Genuine scarcity works: &quot;Another agent has a viewing this afternoon&quot; or
                    &quot;We&apos;ve had a lot of interest.&quot; Use it ethically—never fabricate
                    interest.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Objection Handling</h3>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>&quot;The price is too high&quot;</strong>—Show comparables, emphasise value and unique features.</li>
                    <li><strong>&quot;We need to think about it&quot;</strong>—What specifically do they need to consider? Address those.</li>
                    <li><strong>&quot;We&apos;re still looking&quot;</strong>—Stay in touch. Many buyers need 3–6 months and multiple viewings.</li>
                </ul>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. First-Time Buyers</h3>
                <p>
                    They&apos;re nervous about the process. Educate them: bond process, transfer costs,
                    timelines. Point them to PropReady&apos;s buyer learning centre if they need more detail.
                    Being helpful builds loyalty.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">5. Don&apos;t Push</h3>
                <p>
                    Aggressive tactics backfire. Listen more than you talk. Ask what they love and what
                    concerns them. Adapt your approach to their style.
                </p>
            </div>
        ),
    },
    'working-with-sellers': {
        title: 'Working with Sellers Effectively',
        icon: 'Handshake',
        content: (
            <div className="space-y-6 text-charcoal/90">
                <p className="text-lg">
                    Sellers want a quick sale at the best price. Your job is to manage expectations,
                    market effectively, and keep them informed.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. The Pricing Conversation</h3>
                <p>
                    Sellers often overvalue their property. Bring comparables: similar properties sold in the
                    area. Explain that overpricing leads to fewer viewings and longer time on market. A
                    realistic price often achieves a better net result.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Pre-Listing Preparation</h3>
                <p>
                    Advise on decluttering, minor repairs, and staging. A clean, bright home photographs
                    better and shows better. Offer to connect them with handymen or stagers if needed.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Communication Cadence</h3>
                <p>
                    Agree on how often you&apos;ll update them (e.g. weekly, or after every viewing).
                    Nothing erodes trust like silence. Even &quot;no news this week&quot; is better than
                    nothing.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Handling Offers</h3>
                <p>
                    Present all offers promptly and in writing. Explain the terms, not just the price:
                    conditions, occupational rent, deposit. Help sellers compare holistically.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">5. Long-Term Relationships</h3>
                <p>
                    A seller today may be a buyer tomorrow, or refer you to friends. Stay in touch after
                    the sale. A simple &quot;how&apos;s the new home?&quot; goes a long way.
                </p>
            </div>
        ),
    },
    'digital-marketing': {
        title: 'Digital Marketing for Real Estate',
        icon: 'Smartphone',
        content: (
            <div className="space-y-6 text-charcoal/90">
                <p className="text-lg">
                    Your online presence determines how many leads you attract. Here&apos;s how to leverage
                    digital channels effectively.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. PropReady as Your Base</h3>
                <p>
                    PropReady gives you prequalified leads and a place to manage properties and viewings.
                    Ensure your profile is complete and your listed properties are optimised. When buyers
                    prequalify, they&apos;re matched with agents like you—so a strong presence here pays off.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Property Portals</h3>
                <p>
                    List on Property24, Private Property, and others. Consistency matters: same photos,
                    descriptions, and prices across platforms. Inconsistency erodes trust.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Social Media</h3>
                <p>
                    LinkedIn for professional credibility. Facebook and Instagram for property showcases and
                    local community. Share new listings, market insights, and tips—not just &quot;buy now&quot;
                    posts.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Email Marketing</h3>
                <p>
                    Build a list of past clients and interested buyers. Send monthly market updates, new
                    listings, and helpful content. Keep it valuable, not spammy.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">5. Response Time</h3>
                <p>
                    Reply to enquiries within minutes when possible. Speed signals professionalism and
                    urgency.
                </p>

                <div className="premium-card p-6 rounded-xl mt-6 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                    <h4 className="text-xl font-bold text-gold mb-3">Quick Win</h4>
                    <p className="text-charcoal/80">
                        When you get a new PropReady lead, share relevant listings from your portfolio in
                        your first message. It shows you&apos;re prepared and saves them time.
                    </p>
                </div>
            </div>
        ),
    },
    'legal-basics': {
        title: 'Legal Compliance Basics',
        icon: 'Scale',
        content: (
            <div className="space-y-6 text-charcoal/90">
                <p className="text-lg">
                    Estate agents must navigate several legal frameworks. Here are the essentials you need
                    to know.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Offer to Purchase (OTP)</h3>
                <p>
                    The OTP is the contract between buyer and seller. It must be in writing and signed by
                    both parties. Ensure all material terms are included: price, conditions, occupational
                    rent, deposit, and deadlines. Recommend that both parties get legal advice before
                    signing.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. FICA (Financial Intelligence Centre Act)</h3>
                <p>
                    When handling deposits or facilitating transactions, you may need to verify the identity
                    and address of clients. Keep FICA documents (ID, proof of address) on file. Non-compliance
                    can result in fines and reputational damage.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. POPIA (Protection of Personal Information)</h3>
                <p>
                    You collect names, IDs, contact details, and financial information. You must:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Only collect what you need</li>
                    <li>Use it only for the purpose it was collected</li>
                    <li>Store it securely</li>
                    <li>Allow clients to access or correct their data</li>
                </ul>
                <p className="mt-4">
                    PropReady is designed with privacy in mind—ensure you handle leads&apos; data
                    responsibly.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Mandate</h3>
                <p>
                    A mandate is the agreement between you and the seller (or buyer, in some cases). It
                    should specify commission, duration, exclusivity, and scope. Get it in writing.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">5. When in Doubt</h3>
                <p>
                    Refer to your principal or legal counsel. It&apos;s better to pause and confirm than to
                    risk a void contract or disciplinary issue.
                </p>
            </div>
        ),
    },
    'negotiation-skills': {
        title: 'Negotiation Skills',
        icon: 'MessageSquare',
        content: (
            <div className="space-y-6 text-charcoal/90">
                <p className="text-lg">
                    Every deal involves negotiation. Strong negotiation skills help you close more sales and
                    keep all parties satisfied.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Understand Both Sides</h3>
                <p>
                    Before negotiating, know what each party wants: price, occupation date, conditions,
                    inclusions. The best deals create value for both—not just a win-lose on price.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Anchor Carefully</h3>
                <p>
                    The first number sets the frame. If the buyer lowballs, counter with comparables and
                    rationale. If the seller is unrealistic, show market data before the first offer.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Use Concessions Strategically</h3>
                <p>
                    Don&apos;t give things away for free. &quot;If you can bring the deposit to 10%, we can
                    look at reducing the price by R20k.&quot; Each concession should feel earned.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Deadlines Create Movement</h3>
                <p>
                    &quot;The offer is valid until 5pm tomorrow&quot; or &quot;Another party is viewing
                    this afternoon&quot; can focus minds. Use deadlines ethically—never fabricate.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">5. Stay Calm</h3>
                <p>
                    Emotions escalate. If things get tense, suggest a short break. Your role is to facilitate
                    agreement, not to take sides or lose your cool.
                </p>

                <div className="premium-card p-6 rounded-xl mt-6 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                    <h4 className="text-xl font-bold text-gold mb-3">Golden Rule</h4>
                    <p className="text-charcoal/80">
                        A deal that falls apart later helps no one. Ensure both parties understand and accept
                        the terms. Clarity prevents disputes.
                    </p>
                </div>
            </div>
        ),
    },
    'time-management': {
        title: 'Time Management for Agents',
        icon: 'Target',
        content: (
            <div className="space-y-6 text-charcoal/90">
                <p className="text-lg">
                    Agents juggle viewings, admin, marketing, and follow-ups. Without systems, you burn out
                    or drop balls. Here&apos;s how to work smarter.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Prioritise Hot Leads</h3>
                <p>
                    Not all leads are equal. Focus first on: new leads (contact within 2 hours), leads who
                    have viewed (follow up same day), and qualified buyers with a short timeline. Use your
                    PropReady dashboard to filter and sort.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Batch Similar Tasks</h3>
                <p>
                    Do all calls in one block, all listing updates in another, all viewings in clusters by
                    area. Context-switching costs time and focus.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Use a CRM (or PropReady)</h3>
                <p>
                    Track where each lead is: new, contacted, viewed, offer made. Set reminders for
                    follow-ups. Your PropReady dashboard helps—use the status filters and notes to stay
                    organised.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">4. Schedule Admin Time</h3>
                <p>
                    Block 30–60 minutes daily for paperwork, emails, and updates. If you don&apos;t schedule
                    it, it spills into evenings and weekends.
                </p>

                <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">5. Protect Your Off-Time</h3>
                <p>
                    Real estate is 24/7, but you don&apos;t have to be. Set boundaries: no calls after 8pm
                    unless urgent, or one weekend day off. Sustainable pace beats short-term hustle.
                </p>

                <div className="premium-card p-6 rounded-xl mt-6 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                    <h4 className="text-xl font-bold text-gold mb-3">PropReady Tip</h4>
                    <p className="text-charcoal/80">
                        Use the Viewings section to schedule and manage appointments in one place. Fewer
                        tools = less chaos.
                    </p>
                </div>
            </div>
        ),
    },
};

export default async function AgentLearnArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const module = AGENT_MODULES[slug];

    if (!module) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-charcoal text-xl font-bold">PropReady</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/agents/dashboard" className="text-charcoal/90 hover:text-charcoal transition">
                                Dashboard
                            </Link>
                            <Link href="/agents/learn" className="text-gold font-semibold">
                                Learning Hub
                            </Link>
                            <Link href="/agents/settings" className="text-charcoal/90 hover:text-charcoal transition">
                                Settings
                            </Link>
                        </div>
                    </div>

                    <Link
                        href="/agents/learn"
                        className="flex items-center space-x-2 text-charcoal hover:text-gold transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Learning Hub</span>
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-24 pb-16">
                <div className="container mx-auto max-w-3xl relative z-10">
                    <div className="mb-8">
                        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gold/20 border border-gold/30 mb-4">
                            <BookOpen className="w-4 h-4 text-gold" />
                            <span className="text-gold font-semibold text-sm">Learning Hub – Agents</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
                            {module.title}
                        </h1>
                    </div>

                    <article className="prose prose-lg max-w-none">
                        {module.content}
                    </article>

                    <div className="mt-12 pt-8 border-t border-charcoal/20">
                        <Link
                            href="/agents/learn"
                            className="inline-flex items-center space-x-2 text-gold font-semibold hover:underline"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Learning Hub</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
