import AgentLearnCallout from '@/components/AgentLearnCallout';
import AgentLearnArticleLead from '@/components/AgentLearnArticleLead';
import AgentLearnSection, {
    AgentLearnBullets,
    AgentLearnDoDont,
    AgentLearnHighlight,
    AgentLearnInfo,
    AgentLearnSteps,
} from '@/components/AgentLearnSection';

export const GROWTH_LEARN_ARTICLES: Record<
    string,
    { title: string; icon: string; content: React.ReactNode }
> = {
    'how-to-get-leads': {
        title: 'How to Get More Quality Leads',
        icon: 'Magnet',
        content: (
            <div className="contents">
                <p>
                    Top agents don&apos;t wait for the phone to ring — they build predictable lead
                    engines. In South Africa&apos;s competitive market, quality beats quantity: one
                    prequalified buyer is worth more than twenty cold enquiries.
                </p>

                <AgentLearnSection title="1. Own your farm area digitally and physically">
                    <p>
                        Proven producers dominate a suburb or corridor. Become the obvious agent in
                        one area before expanding.
                    </p>
                    <AgentLearnSteps
                        items={[
                            'Pick 2–3 suburbs and track every listing, sale, and days-on-market stat monthly.',
                            'Door-knock or drop value reports after registrations — consistency beats one-off blitzes.',
                            'Post local market updates weekly (not only your listings) on WhatsApp and social.',
                            'Register on PropReady and keep your service area accurate so prequalified leads match you.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. Turn every interaction into a referral asset">
                    <p>
                        Referrals and repeat business are the lowest-cost, highest-trust lead source.
                        Most agents under-ask.
                    </p>
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Ask every satisfied viewer: "Who else do you know looking in this area?"',
                            'Send a thank-you message within 2 hours of every viewing with 2–3 similar options.',
                            'Stay in touch with past clients quarterly — market snapshots, not sales pitches.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. Maximise portals and PropReady together">
                    <p>
                        Portals bring reach; PropReady brings intent. Use both, but prioritise leads
                        who have already shown affordability and area preference.
                    </p>
                    <div className="learn-highlight-row">
                        <AgentLearnHighlight
                            label="Response window"
                            value="Under 5 min"
                            detail="21× higher contact rate vs 30+ minutes"
                        />
                        <AgentLearnHighlight
                            label="Weekly target"
                            value="10 new conversations"
                            detail="Mix of PropReady, portal, and sphere leads"
                        />
                    </div>
                </AgentLearnSection>

                <AgentLearnSection title="4. Content that attracts sellers (not just likes)">
                    <p>
                        Seller leads create inventory. Share pricing reality, staging tips, and
                        &quot;what sold near you&quot; — sellers hire agents who educate, not hype.
                    </p>
                </AgentLearnSection>

                <AgentLearnCallout title="Winning habit">
                    <p>
                        Block 20 minutes every morning for lead generation only: follow-ups, sphere
                        calls, and new PropReady contacts. Protect this block like a viewing.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'leads-to-clients': {
        title: 'Convert Leads to Clients: A Proven Pipeline',
        icon: 'TrendingUp',
        content: (
            <div className="contents">
                <p>
                    A lead becomes a client when they trust you enough to share time, documents, and
                    decisions. The best agents run a simple pipeline — not a messy inbox.
                </p>

                <AgentLearnSection title="The 5-stage conversion pipeline">
                    <AgentLearnSteps
                        items={[
                            'New — lead received; acknowledge within minutes.',
                            'Contacted — spoken or messaged; needs and timeline confirmed.',
                            'Qualified — budget, finance, and area fit verified.',
                            'Viewing booked — appointment in calendar with property shortlist.',
                            'Client — mandate signed (seller) or offer path started (buyer).',
                        ]}
                    />
                    <p>
                        Move leads forward one stage at a time. Never skip qualification to &quot;keep
                        them warm&quot; — it wastes viewings.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="The first conversation script (proven structure)">
                    <p>
                        Structure builds confidence. Use this flow on every PropReady lead:
                    </p>
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            { text: <><strong>Thank</strong> them for using PropReady and confirm what they searched for.</> },
                            { text: <><strong>Clarify</strong> timeline: moving this month or researching?</> },
                            { text: <><strong>Confirm finance</strong>: pre-approved, in progress, or cash?</> },
                            { text: <><strong>Offer value</strong>: 2–3 matches or a realistic price opinion.</> },
                            { text: <><strong>Book</strong> a specific viewing slot — never leave with &quot;I&apos;ll call you.&quot;</> },
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Objections that kill conversions (and how to handle them)">
                    <AgentLearnBullets
                        variant="warning"
                        items={[
                            { text: <><strong>&quot;Just browsing&quot;</strong> — Ask what would make them act in 90 days.</> },
                            { text: <><strong>&quot;Need to speak to my partner&quot;</strong> — Offer a joint 15-min call or viewing.</> },
                            { text: <><strong>&quot;Your fee is high&quot;</strong> — Anchor on net proceeds and marketing reach.</> },
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="When to walk away">
                    <p>
                        Not every lead should become a client. Politely pause unresponsive or unqualified
                        leads after 5–7 professional touches. Your time is inventory for serious buyers
                        and sellers.
                    </p>
                </AgentLearnSection>

                <AgentLearnCallout title="Pipeline metric">
                    <p>
                        Track your contact-to-viewing rate. Top performers aim for 40%+ of qualified
                        buyers to book a viewing within 14 days. Use your PropReady dashboard to mark
                        stages and spot leaks.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'winning-formula': {
        title: 'The Winning Formula for Top-Producing Agents',
        icon: 'Trophy',
        content: (
            <div className="contents">
                <p>
                    High production is not luck — it&apos;s a repeatable formula: consistent lead flow,
                    disciplined follow-up, listing inventory, and flawless execution at viewings and
                    offers. This is the model used by top teams globally, adapted for SA.
                </p>

                <div className="learn-formula-card">
                    <p className="learn-formula-title">The PropReady winning formula</p>
                    <p className="learn-formula-equation">
                        Leads × Speed × Trust × Listings = Closings
                    </p>
                    <p className="learn-formula-note">
                        Weakness in any variable caps your income. Diagnose which lever to pull this
                        quarter.
                    </p>
                </div>

                <AgentLearnSection title="Leads — fill the top of the funnel weekly">
                    <p>
                        Aim for multiple sources: PropReady prequalified buyers, sphere, portals, and
                        seller prospecting. Top agents schedule lead time before admin.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="Speed — the unfair advantage">
                    <p>
                        Respond fast, book fast, follow up fast. Speed signals professionalism and
                        wins mandates when sellers are interviewing agents.
                    </p>
                    <div className="learn-highlight-row">
                        <AgentLearnHighlight label="Lead response" value="&lt; 5 min" />
                        <AgentLearnHighlight label="Viewing offer" value="Same day" />
                        <AgentLearnHighlight label="Offer feedback" value="&lt; 2 hours" />
                    </div>
                </AgentLearnSection>

                <AgentLearnSection title="Trust — your real product">
                    <p>
                        PPRA compliance, clear communication, and honest pricing build trust faster than
                        discounts. Verified agents on PropReady start ahead — maintain that edge with
                        preparation on every call.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="Listings — control your destiny">
                    <p>
                        Buyers are abundant; good stock is scarce. Allocate time every week to seller
                        prospecting, CMAs, and listing presentations. One new mandate per month
                        compounds dramatically over a year.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="Weekly scorecard (15 minutes every Friday)">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'New leads contacted',
                            'Viewings completed vs booked',
                            'Offers submitted',
                            'Listing appointments set',
                            'Follow-ups overdue (should be zero)',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnCallout title="90-day challenge">
                    <p>
                        For the next 90 days: 10 sphere touches per week, every PropReady lead
                        contacted in 5 minutes, and one seller valuation appointment per week. Track
                        on paper. Most agents who complete this see measurable pipeline growth.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'follow-up-system': {
        title: 'The 7-Touch Follow-Up System',
        icon: 'Repeat',
        content: (
            <div className="contents">
                <AgentLearnArticleLead>
                    Most deals are lost in the follow-up gap. A structured 7-touch sequence keeps you
                    top-of-mind without feeling pushy — used by high-conversion teams worldwide.
                </AgentLearnArticleLead>

                <AgentLearnSection title="The 7 touches (over 14 days)">
                    <AgentLearnSteps
                        items={[
                            'Day 0: Immediate call + SMS confirming you received their enquiry.',
                            'Day 1: WhatsApp with 2–3 property links matched to their brief.',
                            'Day 3: Voice note or call — ask one qualifying question they haven’t answered.',
                            'Day 5: Share a relevant sold story or suburb insight.',
                            'Day 7: Invite to a specific viewing slot (two options).',
                            'Day 10: Check-in — timeline still the same?',
                            'Day 14: Professional close-out or move to long-term nurture list.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Rules that make it work">
                    <AgentLearnBullets
                        items={[
                            'Every touch adds value — never "just checking in" alone.',
                            'Use their name and reference their budget/area every time.',
                            'Log each touch in PropReady or your CRM so nothing slips.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnCallout title="Pro tip">
                    <p>
                        Batch follow-ups at 8:30am and 4:30pm. Conversion rates jump when contacts
                        happen at consistent times buyers expect.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'listing-presentations': {
        title: 'Win Listing Presentations Every Time',
        icon: 'Presentation',
        content: (
            <div className="contents">
                <p>
                    Mandates are won before you walk in — through preparation, comparables, and a clear
                    marketing plan. This framework is used by top listing agents to beat incumbents.
                </p>

                <AgentLearnSection title="Before the appointment">
                    <AgentLearnSteps
                        items={[
                            'Pull 3–5 comparable sales (last 90 days) and active competition.',
                            'Prepare a one-page marketing plan: portals, social, PropReady, photography.',
                            'Research the seller’s motivation (upsizing, relocation, divorce, investment).',
                            'Arrive with a printed or tablet CMA — not a verbal guess.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="During the presentation">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Lead with their goal, not your biography (60 seconds max on you).',
                            'Present a recommended price range with evidence — then stop talking.',
                            'Show how you\'ll get buyer feedback in week one and report weekly.',
                            'Ask for the mandate when they nod — don\'t leave without a next step.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="After — strike while trust is high">
                    <p>
                        Send a summary email within 2 hours: price strategy, marketing plan, and
                        mandate documents. Sellers choose the agent who is most organised, not always
                        the cheapest.
                    </p>
                </AgentLearnSection>

                <AgentLearnCallout title="Listing win rate">
                    <p>
                        Agents who use structured CMAs and written marketing plans win 2–3× more
                        exclusive mandates than those who only promise exposure.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'winning-pitch': {
        title: 'The Winning Pitch: Scripts & Objection Handling',
        icon: 'Mic',
        content: (
            <div className="contents">
                <p>
                    A winning pitch is not a monologue — it is a structured conversation that builds
                    trust, surfaces real concerns, and moves the client to a clear next step. Master
                    these frameworks for buyer calls, seller valuations, and listing presentations.
                </p>

                <AgentLearnSection title="1. The 4-part pitch structure">
                    <p>
                        Use the same skeleton every time. Consistency beats improvisation when nerves
                        hit.
                    </p>
                    <AgentLearnSteps
                        items={[
                            'Hook — reference their specific need (area, budget, or property goal).',
                            'Proof — one relevant win: similar sale, buyer match, or suburb result.',
                            'Plan — 2–3 concrete steps you will take in the next 7 days.',
                            'Ask — book the viewing, mandate meeting, or follow-up with a date and time.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. Buyer pitch (first call)">
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            { text: <><strong>Open:</strong> &quot;Thanks for using PropReady — I see you&apos;re looking for [type] around [area] near [budget].&quot;</> },
                            { text: <><strong>Qualify:</strong> Timeline, finance status, and must-haves vs nice-to-haves.</> },
                            { text: <><strong>Deliver:</strong> Two specific listings with one sentence each on why they fit.</> },
                            { text: <><strong>Close:</strong> &quot;I have Saturday 10am or Sunday 2pm — which works for a viewing?&quot;</> },
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. Seller pitch (valuation)">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Start with their goal: speed, price, or minimum stress — not your fee.',
                            'Present CMA evidence before your marketing plan.',
                            'Explain weekly feedback loops so they never feel in the dark.',
                            'Ask: "If the numbers and plan make sense, are you open to an exclusive mandate?"',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="4. The LAER objection framework">
                    <p>
                        When you hear pushback, resist the urge to argue. Listen, acknowledge, explore,
                        then respond.
                    </p>
                    <AgentLearnSteps
                        items={[
                            'Listen — let them finish without interrupting.',
                            'Acknowledge — "That makes sense given what you\'ve seen so far."',
                            'Explore — ask one question: "What would need to be true for you to move forward?"',
                            'Respond — address the real concern with evidence, not pressure.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="5. Top objections and winning responses">
                    <AgentLearnBullets
                        variant="warning"
                        items={[
                            { text: <><strong>&quot;Your commission is too high&quot;</strong> — Reframe to net proceeds and marketing investment; show what cheaper agents skip.</> },
                            { text: <><strong>&quot;We want to think about it&quot;</strong> — Isolate: &quot;Is it the price, the timeline, or something about our plan?&quot;</> },
                            { text: <><strong>&quot;We&apos;re speaking to other agents&quot;</strong> — Welcome it; differentiate on process, reporting, and buyer database.</> },
                            { text: <><strong>&quot;The price is too high&quot;</strong> (buyer) — Comparables, value features, and finance options — never dismiss their feeling.</> },
                            { text: <><strong>&quot;Just send me options on WhatsApp&quot;</strong> — Send 2–3, then call within an hour to book a viewing while interest is hot.</> },
                            { text: <><strong>&quot;We&apos;re not ready yet&quot;</strong> — Agree a nurture cadence and one value touch per month until their timeline shifts.</> },
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="6. Do and don&apos;t under pressure">
                    <AgentLearnDoDont
                        doItems={[
                            'Pause 2 seconds before answering — it shows confidence.',
                            'Use their words back: "You mentioned timeline is the worry…"',
                            'End every conversation with a scheduled next step.',
                            'Role-play objections weekly with a colleague or mentor.',
                        ]}
                        dontItems={[
                            'Discount your fee before they ask — it signals weak value.',
                            'Talk over objections or get defensive about the market.',
                            'Leave without asking for the business or a clear follow-up date.',
                            'Memorise scripts word-for-word — sound natural, not robotic.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="7. Closing lines that work">
                    <p>
                        Assumptive closes feel natural when you have earned trust through the pitch.
                    </p>
                    <AgentLearnBullets
                        variant="success"
                        items={[
                            '"Based on what you\'ve told me, shall we book the viewing for Saturday morning?"',
                            '"If the CMA and marketing plan look right, I can bring the mandate for signature tomorrow."',
                            '"Would you prefer to start with an exclusive mandate or a sole mandate for 90 days?"',
                        ]}
                    />
                    <AgentLearnInfo variant="important">
                        <p>
                            Never fabricate competing offers or urgency. Ethical pitching builds the
                            reputation that feeds referrals for years.
                        </p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <div className="learn-highlight-row">
                    <AgentLearnHighlight
                        label="Practice target"
                        value="3 role-plays"
                        detail="Per week on your weakest objection"
                    />
                    <AgentLearnHighlight
                        label="Close metric"
                        value="80%+"
                        detail="Of qualified calls should end with a booked next step"
                    />
                </div>

                <AgentLearnCallout title="Winning habit">
                    <p>
                        Block 20 minutes weekly dedicated only to: recording your buyer pitch,
                        listening back once, and fixing one delivery habit. Repeat until it sounds
                        natural — not scripted.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
};
