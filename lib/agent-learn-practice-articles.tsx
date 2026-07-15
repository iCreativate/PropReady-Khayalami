import AgentLearnCallout from '@/components/AgentLearnCallout';
import AgentLearnSection, {
    AgentLearnBullets,
    AgentLearnDoDont,
    AgentLearnHighlight,
    AgentLearnInfo,
    AgentLearnSteps,
} from '@/components/AgentLearnSection';

export const PRACTICE_LEARN_ARTICLES: Record<
    string,
    { title: string; icon: string; content: React.ReactNode }
> = {
    'social-media-for-agents': {
        title: 'Social Media That Wins Listings & Buyers',
        icon: 'Share2',
        content: (
            <div className="contents">
                <p>
                    Social media is not a billboard — it is a trust engine. Agents who educate their
                    market consistently win more mandates and inbound buyer enquiries than those who only
                    post &quot;just listed&quot; tiles.
                </p>

                <AgentLearnSection title="1. Pick two platforms and show up weekly">
                    <p>
                        Spread thin across five apps and you will disappear. Dominate one professional and
                        one visual channel for your farm area.
                    </p>
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'LinkedIn — market commentary, sold stories, and professional credibility.',
                            'Instagram or Facebook — property reels, suburb tours, and community presence.',
                            'Post on fixed days (e.g. Tuesday market update, Thursday listing spotlight).',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. Content pillars that convert">
                    <AgentLearnSteps
                        items={[
                            'Market insight — what sold, at what price, and why it matters locally.',
                            'Seller education — pricing reality, staging, and preparation checklists.',
                            'Buyer help — affordability tips, area guides, and viewing preparation.',
                            'Proof — testimonials, before/after staging, and days-on-market wins.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. Turn engagement into conversations">
                    <p>
                        Every comment and DM is a micro-lead. Respond within hours with a helpful answer,
                        then invite a private chat if appropriate.
                    </p>
                    <div className="learn-highlight-row">
                        <AgentLearnHighlight
                            label="Ideal response"
                            value="Under 2 hrs"
                            detail="On comments and DMs during business hours"
                        />
                        <AgentLearnHighlight
                            label="Weekly cadence"
                            value="3–4 posts"
                            detail="Consistency beats viral one-offs"
                        />
                    </div>
                </AgentLearnSection>

                <AgentLearnCallout title="PropReady tip">
                    <p>
                        Link social posts back to your PropReady listings and prequalified buyer flow —
                        one consistent brand from post to viewing booking.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'email-and-nurture': {
        title: 'Email & WhatsApp Nurture Sequences',
        icon: 'Mail',
        content: (
            <div className="contents">
                <p>
                    Most agents lose deals in the gap between first contact and ready-to-buy. Simple nurture
                    sequences keep you useful — not pushy — while buyers and sellers move through their
                    timelines.
                </p>

                <AgentLearnSection title="1. Build lists with permission">
                    <AgentLearnBullets
                        variant="compliance"
                        items={[
                            'Only message people who opted in or gave you their details for property updates.',
                            'Include an easy opt-out on bulk messages — POPIA applies to agents too.',
                            'Segment: active buyers, past clients, sphere, and long-term nurture.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. The 4-message buyer nurture">
                    <AgentLearnSteps
                        items={[
                            'Welcome — thank them, confirm area and budget, offer 2–3 matches.',
                            'Value — suburb snapshot or recent sale that fits their brief.',
                            'Invite — specific viewing slots with dates and times.',
                            'Check-in — timeline still the same? Offer to pause or update preferences.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. Seller nurture after valuation">
                    <p>
                        Not every valuation signs on the day. Stay top-of-mind with useful updates until
                        they are ready to mandate.
                    </p>
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            'Monthly micro-CMA: one paragraph on activity near their property.',
                            'Pre-listing checklist PDF — photos, repairs, and compliance reminders.',
                            'Case study: how you marketed and sold a similar home nearby.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnInfo variant="warning" title="Avoid spam">
                    <p>
                        If every message is &quot;call me&quot; or &quot;price drop&quot;, people mute you.
                        Lead with insight; ask for the meeting second.
                    </p>
                </AgentLearnInfo>
            </div>
        ),
    },
    'pricing-to-sell': {
        title: 'Pricing to Sell: CMAs & Seller Conversations',
        icon: 'LineChart',
        content: (
            <div className="contents">
                <p>
                    The right price is not the highest price — it is the price that attracts qualified
                    buyers, generates viewings, and closes within a realistic window. Your CMA is the
                    foundation of every listing conversation.
                </p>

                <AgentLearnSection title="1. Build a defensible CMA">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Use 3–6 comparable sales from the last 90 days in the same suburb or complex.',
                            'Adjust for size, condition, parking, views, and levy differences — note every assumption.',
                            'Show active competition: what else is on market at similar price points today.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. The pricing conversation">
                    <p>
                        Sellers often anchor to what they need, not what the market will pay. Your job is
                        to bridge hope and evidence without damaging trust.
                    </p>
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            'Start with sold facts, not opinion — let comparables do the heavy lifting.',
                            'Present a range: aspirational ask vs realistic sell band.',
                            'Agree review triggers: if no serious interest in 14–21 days, revisit price or presentation.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. When to recommend a price reduction">
                    <AgentLearnDoDont
                        doItems={[
                            'Track views, enquiries, and second viewings weekly with the seller.',
                            'Tie reductions to market feedback, not frustration.',
                            'Refresh photos and copy before a price change when presentation is weak.',
                        ]}
                        dontItems={[
                            'Let a stale listing sit 60+ days without an honest review meeting.',
                            'Blame the market without showing competing stock data.',
                            'Promise a sale by a date you cannot control.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnCallout title="Listing win rate">
                    <p>
                        Agents who present a written CMA and a 30-day marketing plan in the first meeting
                        win more exclusive mandates — preparation signals professionalism.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'show-day-playbook': {
        title: 'The Show Day Playbook',
        icon: 'DoorOpen',
        content: (
            <div className="contents">
                <p>
                    Show days compress weeks of interest into a few hours. A tight playbook turns foot
                    traffic into qualified follow-ups and offers — instead of a crowded open house with
                    no next steps.
                </p>

                <AgentLearnSection title="1. Pre-show preparation (48 hours before)">
                    <AgentLearnSteps
                        items={[
                            'Confirm access, security, and parking with the seller — signage ready.',
                            'Send invites to your database: buyers who match price, area, and property type.',
                            'Brief the seller: valuables secured, pets away, lights on, fresh scent.',
                            'Prepare registration: name, phone, pre-approval status, and timeline.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. On the day — run the room">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Greet every visitor within 30 seconds — first impression is yours, not the kitchen.',
                            'Qualify quietly: buying now or browsing? Finance in place?',
                            'Highlight 3 hero features, then let them explore — do not shadow every step.',
                            'Book private follow-up viewings for serious buyers before they leave.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. Same-day follow-up">
                    <p>
                        Show day leads go cold fast. Contact every registered buyer before end of day.
                    </p>
                    <div className="learn-highlight-row">
                        <AgentLearnHighlight
                            label="Follow-up window"
                            value="Same day"
                            detail="WhatsApp or call while the property is fresh"
                        />
                        <AgentLearnHighlight
                            label="Seller update"
                            value="Within 24 hrs"
                            detail="Foot count, feedback themes, and next steps"
                        />
                    </div>
                </AgentLearnSection>

                <AgentLearnCallout title="Winning habit">
                    <p>
                        Block 30 minutes after every show day dedicated only to: same-day buyer
                        follow-ups, viewing feedback, and seller updates. No admin until complete.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'agent-mistakes': {
        title: 'Top Mistakes Agents Make (and How to Avoid Them)',
        icon: 'AlertTriangle',
        content: (
            <div className="contents">
                <p>
                    Most agent careers are not derailed by one bad deal — they stall from repeated small
                    mistakes: slow follow-up, vague pricing, and weak systems. Here are the patterns that
                    cost commissions, and the fixes top producers use instead.
                </p>

                <AgentLearnSection title="1. Slow or generic follow-up">
                    <p>
                        Waiting hours to reply — or sending copy-paste messages — tells buyers they are a
                        number. Speed plus personalisation wins.
                    </p>
                    <AgentLearnDoDont
                        doItems={[
                            'Contact new leads within 5 minutes when possible.',
                            'Reference their budget, area, and property type in the first message.',
                            'Log every touch in PropReady or your CRM the same day.',
                        ]}
                        dontItems={[
                            'Send "just checking in" with no new value attached.',
                            'Let weekend enquiries wait until Monday without an auto-acknowledgement.',
                            'Rely on memory instead of a written follow-up sequence.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. Overpricing listings to win the mandate">
                    <p>
                        Inflated prices please sellers briefly and poison the listing. Days on market
                        climb; trust erodes; reductions become painful.
                    </p>
                    <AgentLearnInfo variant="important">
                        <p>
                            Present a CMA with sold evidence and agree upfront when you will review price
                            if enquiry is weak — protect the relationship and the sale.
                        </p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="3. Ignoring compliance and disclosure">
                    <AgentLearnBullets
                        variant="compliance"
                        items={[
                            'Marketing without a valid Fidelity Fund Certificate on display where required.',
                            'Verbal commission or mandate terms — get it in writing every time.',
                            'Skipping FICA and POPIA steps because the client is "a friend".',
                            'Giving financial advice without the right licence — refer to originators.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="4. No pipeline system">
                    <p>
                        Treating every lead as a one-off creates feast-or-famine income. Pipeline
                        discipline turns activity into predictable closings.
                    </p>
                    <AgentLearnSteps
                        items={[
                            'Tag every lead: new, contacted, qualified, viewing, offer, nurture.',
                            'Review pipeline every morning — top 10 leads get action first.',
                            'Batch admin into fixed blocks; protect mornings for revenue work.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="5. Weak listing presentation">
                    <AgentLearnDoDont
                        doItems={[
                            'Invest in photos, accurate specs, and complete portal features.',
                            'Refresh stale listings before blaming the market.',
                            'Use video on premium stock — engagement compounds reach.',
                        ]}
                        dontItems={[
                            'Upload phone snaps in poor light with clutter visible.',
                            'Leave descriptions generic or features untagged.',
                            'Set and forget a listing for 30+ days without a seller review.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="6. Burning out through reactive days">
                    <AgentLearnBullets
                        variant="warning"
                        items={[
                            'Saying yes to every viewing without protecting lead-generation time.',
                            'No boundaries on evenings and weekends — clients expect availability, not slavery.',
                            'Confusing busy with productive — measure conversations and mandates, not hours.',
                        ]}
                    />
                    <AgentLearnCallout title="Golden rule">
                        <p>
                            Fix the system before you fix the hustle. One hour planning Sunday saves five
                            hours of chaos Monday.
                        </p>
                    </AgentLearnCallout>
                </AgentLearnSection>
            </div>
        ),
    },
    'crm-and-systems': {
        title: 'CRM & Pipeline Systems That Scale',
        icon: 'Workflow',
        content: (
            <div className="contents">
                <p>
                    Talent gets you started; systems get you to consistent production. A simple CRM
                    rhythm beats a expensive tool nobody updates — the habit matters more than the
                    software.
                </p>

                <AgentLearnSection title="1. Minimum viable pipeline">
                    <AgentLearnSteps
                        items={[
                            'New — acknowledged, not yet spoken to.',
                            'Active — in conversation; needs and timeline confirmed.',
                            'Viewing — appointments booked or completed.',
                            'Offer — negotiating or awaiting finance.',
                            'Nurture — not now, but worth quarterly contact.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. Daily CRM hygiene (15 minutes)">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Move stale leads to nurture or close-out — no zombie records.',
                            'Add notes after every call: what they said, what you promised, next date.',
                            'Set tasks with due dates — your CRM should tell you who to call today.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="3. PropReady + your stack">
                    <p>
                        Use PropReady for prequalified buyer flow, listings, and viewings. Mirror critical
                        data in your CRM if you use one — one source of truth for follow-ups.
                    </p>
                    <AgentLearnInfo variant="tip" title="Quick win">
                        <p>
                            End each day with three fields updated on your hottest leads: last contact,
                            next action, and temperature (hot/warm/cold).
                        </p>
                    </AgentLearnInfo>
                </AgentLearnSection>
            </div>
        ),
    },
    'daily-routine-top-producers': {
        title: 'Daily Routines of Top-Producing Agents',
        icon: 'Sunrise',
        content: (
            <div className="contents">
                <p>
                    Top producers do not work more hours by accident — they protect revenue blocks and
                    batch everything else. Steal the structure, adapt it to your market and family life.
                </p>

                <AgentLearnSection title="1. Morning: revenue first">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Review pipeline and call the top 5–10 leads before email and social.',
                            '45-minute lead block: follow-ups, sphere touches, new PropReady contacts.',
                            'Confirm today\'s viewings and prep property sheets the night before.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="2. Midday: appointments and listings">
                    <p>
                        Block viewings and seller meetings in clusters by area when possible — less driving,
                        more conversations.
                    </p>
                    <div className="learn-highlight-row">
                        <AgentLearnHighlight
                            label="Lead block"
                            value="45 min"
                            detail="Protected every morning before admin"
                        />
                        <AgentLearnHighlight
                            label="Admin batch"
                            value="90 min"
                            detail="Emails, portals, and CRM — fixed afternoon slot"
                        />
                    </div>
                </AgentLearnSection>

                <AgentLearnSection title="3. Afternoon: admin batch">
                    <AgentLearnSteps
                        items={[
                            'Update CRM and PropReady — notes, tasks, listing tweaks.',
                            'Return calls and messages in one sitting, not all day.',
                            'Prep tomorrow: viewing confirmations and CMA tweaks for valuations.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="4. Weekly anchors">
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            'Monday — pipeline review and week priorities.',
                            'Wednesday — seller updates on active listings.',
                            'Friday — sphere touches and nurture content scheduled.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnCallout title="Winning habit">
                    <p>
                        Plan 20 minutes every Sunday evening dedicated only to: three must-win outcomes
                        for the week, calendar blocks for lead time, and viewing prep. Protect this
                        block before reactive work fills your week.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
};
