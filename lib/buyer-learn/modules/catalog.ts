import { buildLessonFromBlueprint, type LessonBlueprint } from '@/lib/buyer-learn/build-lesson';
import type { LessonModule } from '@/lib/buyer-learn/types';

const BLUEPRINTS: LessonBlueprint[] = [
    {
        slug: 'prequalification',
        title: 'Getting Prequalified',
        subtitle:
            'Prequalification estimates buying power from income, obligations, and credit before you commit to a specific property — it is not a final home-loan grant.',
        difficulty: 'beginner',
        minutes: 12,
        xp: 100,
        badgeLabel: 'Prequal Pro',
        nextSlug: 'buying-process',
        nextTitle: 'The Buying Process',
        nextDescription: 'Walk the path from search to registration with clear stages.',
        personaIndex: 1,
        objectives: [
            {
                title: 'Soft vs full prequal',
                body: 'A soft prequalification is an indicative affordability estimate based on declared income, expenses, and a credit snapshot. It does not bind a credit provider to finance a specific property.\n\nA full (formal) assessment occurs after an Offer to Purchase, when the lender underwrites the borrower and the property under the National Credit Act.',
                whyItMatters:
                    'Confusing soft prequal with a grant leads buyers to treat a budget range as a binding commitment — and sellers to treat an estimate as certainty.',
                steps: [
                    {
                        label: 'Declare income & obligations',
                        detail:
                            'Provide net income, known debts, living costs, and dependents. Understatement of instalments inflates the estimate and creates false confidence.\n\nTreat the estimate as a ceiling band, not a target to stretch into.',
                    },
                    {
                        label: 'Run the soft estimate',
                        detail:
                            'An originator or lender produces an educational buying-power range. Note the date, assumptions, and deposit percentage used.\n\nAsk what would change the number: rate stress, lower deposit, or extra credit.',
                    },
                    {
                        label: 'Separate soft from formal',
                        detail:
                            'Formal approval requires a complete application pack, property details, valuation, and affordability assessment after an OTP.\n\nUntil then, you have guidance — not a grant letter for that erf or unit.',
                    },
                    {
                        label: 'Shop inside the band',
                        detail:
                            'Filter listings to purchase prices and estimated fees you can fund with deposit + buffers. Stretching to the top of soft prequal with zero fee cash is how transfers stall.',
                    },
                ],
                deepDive: {
                    title: 'Soft vs formal on paper',
                    body: 'Record three lines before you view seriously:\n1) Soft prequal amount and date.\n2) Assumed deposit % and cash available for fees/reserves.\n3) Walk-away purchase price after fees.\n\nDo not treat a soft letter as property-specific approval. When you offer, the bond clause and formal underwriting still govern whether the deal proceeds.\n\nEducational framework only — confirm with a registered credit provider.',
                },
            },
            {
                title: 'Why agents care',
                body: 'A current prequalification letter signals that the buyer has tested affordability with a credit professional and can credibly fund a purchase in a stated band. That credibility strengthens offers relative to unquantified interest.',
                whyItMatters:
                    'Sellers and listing agents discount vague affordability claims. Documented buying power reduces failed OTPs and wasted due diligence.',
                steps: [
                    {
                        label: 'Obtain a dated letter',
                        detail:
                            'Ask for a written soft prequal stating approximate amount, date, and key assumptions. Stale letters lose credibility.\n\nRefresh after material income or credit changes.',
                    },
                    {
                        label: 'Share the band, not every detail',
                        detail:
                            'Agents need the affordability ceiling and deposit readiness. They do not need your full bank statements for a first conversation.\n\nKeep sensitive documents for the formal application.',
                    },
                    {
                        label: 'Align offer with letter',
                        detail:
                            'Offers far above the stated band without explanation undermine trust. If your position improved, update the letter first.',
                    },
                    {
                        label: 'Use it in negotiation',
                        detail:
                            'In competing offers, a clean finance profile can matter as much as price — especially where the seller fears bond decline risk.',
                    },
                ],
                deepDive: {
                    title: 'Offer credibility checklist',
                    body: 'Before submitting an OTP, confirm: dated prequal within a recent window; deposit and fee cash ring-fenced; bond suspensive condition period realistic for your bank pack.\n\nCredibility is process readiness, not optimism.',
                },
            },
            {
                title: 'Documents to gather',
                body: 'A typical residential bond pack includes identity documents, proof of residence, recent payslips or income evidence, bank statements, and FICA particulars. Self-employed and commission earners usually need extended income evidence.',
                whyItMatters:
                    'Incomplete packs delay formal assessment and can breach bond-clause deadlines in the OTP.',
                steps: [
                    {
                        label: 'Identity & FICA',
                        detail:
                            'ID/passport, proof of address, and any required FICA forms. Name mismatches between ID, bank, and OTP cause avoidable queries.',
                    },
                    {
                        label: 'Income evidence',
                        detail:
                            'Payslips for salaried buyers; for variable income, contracts, commission schedules, or financials as the lender requires.\n\nExplain allowances and deductions clearly.',
                    },
                    {
                        label: 'Bank statements',
                        detail:
                            'Recent statements showing salary credits and living pattern. Large unexplained deposits invite follow-up — document the source.',
                    },
                    {
                        label: 'Existing credit schedule',
                        detail:
                            'List instalments (vehicle, personal loans, store accounts). Affordability is assessed on real obligations under the NCA.',
                    },
                ],
                deepDive: {
                    title: 'Document pack on paper',
                    body: 'Build a labelled PDF folder before you offer: ID, address, payslips, statements, credit schedule. Name files clearly for underwriters.\n\nIf income is complex (commission, overtime, second job), ask the originator what evidence the target bank expects before the OTP clock starts.',
                },
            },
            {
                title: 'Budget honesty',
                body: 'True buying capacity separates (1) deposit toward purchase price, (2) acquisition costs (transfer duty or VAT context, conveyancing and bond registration), and (3) post-transfer reserves for rates, levies, and shocks.\n\nMonthly repayment capacity must leave room for living costs after debt service.',
                whyItMatters:
                    'Conflating deposit cash with fee cash is a primary cause of transfer shortfalls.',
                steps: [
                    {
                        label: 'Split the cash piles',
                        detail:
                            'Write three envelopes: deposit, fees, reserves. Do not move fee money into a larger deposit to look stronger if it leaves transfer unfunded.',
                    },
                    {
                        label: 'Model the monthly stack',
                        detail:
                            'Bond repayment + rates/taxes + levies (if sectional) + insurance + maintenance buffer. Compare to net income after other debts.',
                    },
                    {
                        label: 'Stress the rate',
                        detail:
                            'On a variable rate, test +1–2 percentage points. If only the current-rate case works, the budget is fragile.',
                    },
                    {
                        label: 'Set a walk-away price',
                        detail:
                            'Convert cash and monthly limits into a maximum purchase price before emotional bidding.',
                    },
                ],
                deepDive: {
                    title: 'Budget layers worksheet',
                    body: 'For a target listing, calculate:\n• Deposit = price × deposit %\n• Fee estimate (educational calculator + attorney quote)\n• Reserve (e.g. 1–2 months of rates/levies/bond)\n• Max monthly after other instalments\n\nIf any layer is unfunded, reduce price or postpone — do not hope fees disappear.\n\nEducational only — not a credit quotation.',
                },
            },
        ],
        steps: [
            {
                label: 'Share basics',
                detail: 'Income, expenses, and a credit snapshot with an originator or lender.',
            },
            {
                label: 'Soft estimate',
                detail: 'Receive an educational buying-power range with dated assumptions.',
            },
            {
                label: 'Tighten documents',
                detail: 'Assemble FICA and income proofs for a later formal application.',
            },
            {
                label: 'Shop with clarity',
                detail: 'Filter listings to what deposit, fees, and monthly capacity can actually fund.',
            },
        ],
        timeline: [
            { title: 'Soft prequal', detail: 'Often same day online.', duration: 'Minutes–1 day' },
            { title: 'Document tidy-up', detail: 'Gather FICA and income proofs.', duration: '2–7 days' },
            { title: 'Formal later', detail: 'After an Offer to Purchase.', duration: 'When you offer' },
        ],
        knowledge: [
            {
                variant: 'myth-fact',
                title: 'Myth vs fact',
                myth: 'Prequal means the bank has already approved the exact property.',
                fact: 'Soft prequal is an estimate. Formal approval happens after an OTP and full underwriting.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep your prequal date visible — sellers trust fresher letters.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Shopping at the top of your stretch budget with zero fee buffer.',
            },
            {
                variant: 'law',
                title: 'South African law',
                body: 'Lenders must assess affordability under the National Credit Act before granting credit.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'A soft prequal is the same as a final home-loan grant.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Soft prequal guides budget; grants come after full assessment.',
            },
            {
                kind: 'mcq',
                prompt: 'Why do agents like prequalified buyers?',
                options: [
                    { id: 'a', label: 'They browse more show days' },
                    { id: 'b', label: 'Offers are more credible' },
                    { id: 'c', label: 'They skip FICA forever' },
                    { id: 'd', label: 'They never need deposits' },
                ],
                correctId: 'b',
                explanation: 'Credible budget = stronger, cleaner offers.',
            },
            {
                kind: 'scenario',
                prompt: 'Nomsa earns R24k net. She should first…',
                options: [
                    { id: 'a', label: 'Offer on a R3m home' },
                    { id: 'b', label: 'Get a soft prequal and fee buffer' },
                    { id: 'c', label: 'Ignore credit entirely' },
                    { id: 'd', label: 'Skip documents until registration' },
                ],
                correctId: 'b',
                explanation: 'Know the number, then shop inside it.',
            },
        ],
    },
    {
        slug: 'buying-process',
        title: 'The Buying Process',
        subtitle:
            'A residential purchase in South Africa typically moves from search and Offer to Purchase through bond assessment and conveyancing to registration at the Deeds Office — when ownership legally transfers.',
        difficulty: 'beginner',
        minutes: 14,
        xp: 110,
        badgeLabel: 'Process Pilot',
        nextSlug: 'agents',
        nextTitle: 'Working with Agents',
        nextDescription: 'Choose verified professionals and understand commission clearly.',
        personaIndex: 2,
        objectives: [
            {
                title: 'OTP basics',
                body: 'An Offer to Purchase (OTP) is the written contract that records price, parties, property description, occupation/possession dates, and suspensive conditions. Once accepted, it creates binding obligations subject to those conditions.',
                whyItMatters:
                    'Signing without understanding dates, penalties, and conditions is how deposits become contested and timelines compress unfairly.',
                steps: [
                    {
                        label: 'Read price and property description',
                        detail:
                            'Confirm erf/unit identifiers match the listing and title. Ambiguous descriptions create transfer disputes.',
                    },
                    {
                        label: 'Check dates and occupation',
                        detail:
                            'Occupation, possession, and transfer target dates allocate risk if the deal delays. Know when occupational interest applies.',
                    },
                    {
                        label: 'List suspensive conditions',
                        detail:
                            'Bond approval, sale of another property, or inspections — each has a fulfilment deadline. Missed deadlines can lapse protection.',
                    },
                    {
                        label: 'Know deposit handling',
                        detail:
                            'Deposits should be paid into a proper trust/attorney account as the OTP specifies — never into informal private accounts on request.',
                    },
                ],
                deepDive: {
                    title: 'OTP review on paper',
                    body: 'Before signing, annotate: purchase price; deposit amount and payee; bond amount and days to fulfil; occupation date; fixtures included/excluded; breach remedies.\n\nIf any clause is unclear, ask the conveyancer or a qualified advisor before you sign — not after acceptance.',
                },
            },
            {
                title: 'Finance condition',
                body: 'A bond (finance) suspensive condition makes the sale contingent on the buyer obtaining loan approval on stated terms within a deadline. If finance is declined within the clause’s rules, the buyer can usually exit without completing the purchase.',
                whyItMatters:
                    'Waiving or poorly drafting the bond clause transfers finance risk onto the buyer while deposit money is already committed.',
                steps: [
                    {
                        label: 'State the bond amount clearly',
                        detail:
                            'The clause should reflect what you will actually apply for. Vague wording creates fights about whether the condition was fulfilled.',
                    },
                    {
                        label: 'Protect the deadline',
                        detail:
                            'Build enough days for document gathering, bank queries, and valuation. Unrealistic periods force rushed incomplete applications.',
                    },
                    {
                        label: 'Do not waive lightly',
                        detail:
                            'Cash buyers may omit a bond clause; financed buyers who waive it absorb decline risk.',
                    },
                    {
                        label: 'Coordinate with the originator',
                        detail:
                            'Start the pack immediately after acceptance so the clause clock is used productively.',
                    },
                ],
                deepDive: {
                    title: 'Bond clause discipline',
                    body: 'Write the maximum purchase you can fund, the bond amount you will apply for, and a fulfilment period agreed with your originator’s realistic bank turnaround.\n\nIf the bank declines, follow the OTP’s notice requirements promptly through your conveyancer — silence can forfeit protections.',
                },
            },
            {
                title: 'Conveyancing role',
                body: 'Conveyancers (transferring attorneys) administer the legal transfer of ownership: gathering clearances, preparing deeds, arranging guarantees, and lodging at the Deeds Office. Bond attorneys act for the lender on mortgage registration.',
                whyItMatters:
                    'Without a competent conveyancing file, registration cannot occur even if the bank grants the loan.',
                steps: [
                    {
                        label: 'Instruct early',
                        detail:
                            'Once the OTP is accepted, ensure a conveyancer is appointed and has the signed contract.',
                    },
                    {
                        label: 'Supply FICA promptly',
                        detail:
                            'Buyer and seller FICA delays are among the most common transfer bottlenecks.',
                    },
                    {
                        label: 'Track clearances',
                        detail:
                            'Rates, levies, and certificates of compliance (where required) must be in order before lodgement.',
                    },
                    {
                        label: 'Ask for status updates',
                        detail:
                            'Request a simple weekly progress note — silence is not progress.',
                    },
                ],
                deepDive: {
                    title: 'Conveyancing map',
                    body: 'Typical file milestones: OTP received → FICA → rates/levy clearances → guarantees → lodgement → registration.\n\nAsk which milestones are outstanding and what you must still provide. Educational overview — your attorney manages the legal process.',
                },
            },
            {
                title: 'Registration day',
                body: 'Registration at the Deeds Office is the moment ownership formally transfers and, where applicable, the mortgage bond is registered. Occupation may occur on a different date if the OTP so provides.',
                whyItMatters:
                    'Confusing “keys today” with “registered owner” creates disputes about risk, insurance, and occupational interest.',
                steps: [
                    {
                        label: 'Distinguish occupation and transfer',
                        detail:
                            'You may occupy before registration under OTP terms — usually with occupational rent/interest rules.',
                    },
                    {
                        label: 'Confirm insurance',
                        detail:
                            'Risk often passes per OTP wording; insure when you assume risk, not only when you feel like an owner.',
                    },
                    {
                        label: 'Expect final accounts',
                        detail:
                            'Conveyancers issue final statements for fees, adjustments, and any balance of purchase price.',
                    },
                    {
                        label: 'Collect proof of registration',
                        detail:
                            'Keep the registration confirmation and update municipal/levy accounts into your name.',
                    },
                ],
                deepDive: {
                    title: 'What “registered” means',
                    body: 'Until deeds are registered, you are generally a purchaser under a conditional or pending transfer — not the registered owner.\n\nPlan moving, school catchment assumptions, and insurance around the OTP dates and your conveyancer’s lodgement estimate, not social-media timelines.',
                },
            },
        ],
        steps: [
            {
                label: 'Search & view',
                detail: 'Shortlist homes inside budget with prequal and fee buffers in mind.',
            },
            {
                label: 'Offer to Purchase',
                detail: 'Price, dates, deposit, and suspensive conditions in writing.',
            },
            {
                label: 'Bond & FICA',
                detail: 'Bank pack while conveyancer opens the file.',
            },
            {
                label: 'Transfer & register',
                detail: 'Clearances, guarantees, lodgement at the Deeds Office.',
            },
            {
                label: 'Keys & occupation',
                detail: 'As agreed in the OTP — may differ from registration day.',
            },
        ],
        timeline: [
            { title: 'Offer accepted', detail: 'Clock starts on conditions.', duration: 'Day 0' },
            { title: 'Bond process', detail: 'Application to grant.', duration: '2–6 weeks' },
            { title: 'Transfer prep', detail: 'Clearances and guarantees.', duration: 'Overlaps' },
            { title: 'Registration', detail: 'Deeds Office lodgement.', duration: '8–12 weeks typical' },
        ],
        knowledge: [
            {
                variant: 'definition',
                title: 'Suspensive condition',
                body: 'A clause that must be met — often bond approval — before the sale becomes fully binding.',
            },
            {
                variant: 'warning',
                title: 'Warning',
                body: 'Signing an OTP without understanding dates and penalties is how deposits get stuck.',
            },
            {
                variant: 'numbers',
                title: 'Numbers that matter',
                body: 'Budget transfer costs separately — often a meaningful extra on mid-market deals.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Ask your conveyancer for a simple weekly status — silence is not progress.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'What document usually starts a binding purchase path?',
                options: [
                    { id: 'a', label: 'WhatsApp voice note' },
                    { id: 'b', label: 'Offer to Purchase' },
                    { id: 'c', label: 'Municipal rates bill only' },
                    { id: 'd', label: 'Gym contract' },
                ],
                correctId: 'b',
                explanation: 'The OTP sets price, dates, and conditions.',
            },
            {
                kind: 'true-false',
                prompt: 'Registration at the Deeds Office is when ownership formally transfers.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'Registration is the legal transfer moment.',
            },
            {
                kind: 'scenario',
                prompt: 'Thabo’s OTP has a bond clause. If the bank declines, he…',
                options: [
                    { id: 'a', label: 'Is forced to buy cash immediately' },
                    { id: 'b', label: 'Can usually exit under that condition' },
                    { id: 'c', label: 'Must pay double deposit' },
                    { id: 'd', label: 'Skips conveyancing' },
                ],
                correctId: 'b',
                explanation: 'Bond suspensive conditions protect buyers when finance fails.',
            },
        ],
    },
    {
        slug: 'agents',
        title: 'Working with Agents',
        subtitle:
            'An estate agent markets property and facilitates negotiation under Property Practitioners Regulatory Authority (PPRA) rules. Commission is typically a seller cost on residential mandates — confirm your deal in writing.',
        difficulty: 'beginner',
        minutes: 11,
        xp: 90,
        badgeLabel: 'Agent Ally',
        nextSlug: 'first-time-tips',
        nextTitle: 'First-Time Buyer Tips',
        nextDescription: 'Practical habits that protect first-time buyers.',
        personaIndex: 3,
        objectives: [
            {
                title: 'Who pays commission',
                body: 'In most South African residential sales, the seller pays estate agency commission under the selling mandate. Buyers may still incur other costs (bond origination fees where applicable, attorney fees, transfer costs) — commission allocation is not universal and must be read from the mandate and OTP.',
                whyItMatters:
                    'Assuming you “owe the agent a percentage” without checking documents creates budget errors and negotiation confusion.',
                steps: [
                    {
                        label: 'Ask who the agent represents',
                        detail:
                            'Listing agents act primarily for the seller under a mandate. Buyer’s agents (where used) have a different brief — clarify representation.',
                    },
                    {
                        label: 'Read commission source',
                        detail:
                            'Confirm whether commission is seller-paid, dual, or otherwise structured. Do not rely on hallway summaries.',
                    },
                    {
                        label: 'Separate commission from your cash stack',
                        detail:
                            'Even if you do not pay commission, you still fund deposit, transfer costs, and bond costs. Keep those piles distinct.',
                    },
                    {
                        label: 'Get fee clarity in writing',
                        detail:
                            'Any buyer-side fee or referral arrangement should be disclosed before you rely on advice.',
                    },
                ],
                deepDive: {
                    title: 'Commission vs your costs',
                    body: 'Commission is a marketing/sale cost usually borne by the seller. Your acquisition cash is deposit + conveyancing/bond costs + reserves.\n\nIf someone claims you must pay agency commission as buyer, ask for the written basis. Educational guidance — deal structures vary.',
                },
            },
            {
                title: 'Verification',
                body: 'Property practitioners must comply with PPRA requirements, including holding a valid Fidelity Fund Certificate (FFC) where applicable. Verification reduces the risk of dealing with unregistered practitioners.',
                whyItMatters:
                    'Unregistered operators create enforceability and consumer-protection risk around deposits, mandates, and advice.',
                steps: [
                    {
                        label: 'Confirm credentials',
                        detail:
                            'Ask for PPRA/FFC status and agency details. Prefer practitioners who can evidence compliance without defensiveness.',
                    },
                    {
                        label: 'Check suburb fit',
                        detail:
                            'Local transaction experience matters for pricing feedback, stock knowledge, and negotiation norms.',
                    },
                    {
                        label: 'Test communication',
                        detail:
                            'Agree update frequency and channel. An agent who disappears before offer stage will disappear during bond stress.',
                    },
                    {
                        label: 'Trust process over pressure',
                        detail:
                            'Urgency tactics (“offer tonight or lose it”) without documents and numbers are a red flag.',
                    },
                ],
                deepDive: {
                    title: 'Agent selection brief',
                    body: 'Shortlist 2–3 verified practitioners. Score: compliance evidence, local knowledge, clarity on your budget, and willingness to explain OTP terms without rushing.\n\nChoose the person who protects process quality — not only the person with the glossiest listing photos.',
                },
            },
            {
                title: 'Briefing your agent',
                body: 'A useful buyer brief states maximum purchase price after fees, must-have property criteria, deal-breakers, timeline, and finance readiness (prequal status). Vague briefs produce mismatched viewings.',
                whyItMatters:
                    'Agents cannot filter stock against constraints you have not stated. Misalignment wastes weekends and weakens offer discipline.',
                steps: [
                    {
                        label: 'State the real ceiling',
                        detail:
                            'Give purchase-price max after fees — not an aspirational stretch you cannot fund.',
                    },
                    {
                        label: 'Separate must-haves from nice-to-haves',
                        detail:
                            'Bedrooms, parking, schools, sectional vs freehold, pet rules — rank them so trade-offs are explicit.',
                    },
                    {
                        label: 'Share prequal status',
                        detail:
                            'Dated buying-power evidence helps the agent advocate credibly with listing agents.',
                    },
                    {
                        label: 'Define response times',
                        detail:
                            'Agree how quickly you will feedback after viewings so the search stays efficient.',
                    },
                ],
                deepDive: {
                    title: 'One-page buyer brief',
                    body: 'Write: max price; deposit/fee cash ready; areas; property type; non-negotiables; timeline to move; finance contact.\n\nHand that page to your agent before the first viewing weekend. Update it when constraints change — do not leave the brief in your head.',
                },
            },
            {
                title: 'Red flags',
                body: 'Pressure to sign unread documents, requests to pay deposits into personal accounts, refusal to explain OTP clauses, and dismissal of conveyancer involvement are warning signs in a purchase process.',
                whyItMatters:
                    'Most costly buyer errors are process failures under urgency — not merely “paying a bit more”.',
                steps: [
                    {
                        label: 'Pause on pressure',
                        detail:
                            'If you are told there is no time to read, create time. Competing buyers still need lawful contracts.',
                    },
                    {
                        label: 'Protect deposit channels',
                        detail:
                            'Pay only as the OTP and attorney instructions specify. Informal “priority fees” to private accounts are a hard stop.',
                    },
                    {
                        label: 'Insist on clause clarity',
                        detail:
                            'Bond periods, occupation, fixtures, and penalties must be understandable before signature.',
                    },
                    {
                        label: 'Keep your professional team',
                        detail:
                            'Originator and conveyancer are not optional extras on a financed purchase.',
                    },
                ],
                deepDive: {
                    title: 'Walk-away triggers',
                    body: 'Pre-commit walk-away triggers: unexplained personal-account payments; unsigned blank annexures; “waive the bond clause and decide later”; refusal to allow conveyancer review.\n\nWalking away early is cheaper than litigating a rushed OTP.',
                },
            },
        ],
        steps: [
            {
                label: 'Shortlist verified agents',
                detail: 'Credentials, suburb fit, and clear communication norms.',
            },
            {
                label: 'Interview fit',
                detail: 'How they handle budget honesty and OTP explanations.',
            },
            {
                label: 'Share budget honestly',
                detail: 'Prequal and fee buffers make the brief usable.',
            },
            {
                label: 'View & offer support',
                detail: 'Strategy without pressure — documents before adrenaline.',
            },
        ],
        timeline: [
            { title: 'Intro call', detail: 'Fit and expectations.', duration: '1 day' },
            { title: 'Active search', detail: 'Views and feedback loops.', duration: '2–8 weeks' },
            { title: 'Offer stage', detail: 'OTP guidance.', duration: 'Deal-dependent' },
        ],
        knowledge: [
            {
                variant: 'myth-fact',
                title: 'Myth vs fact',
                myth: 'Buyers always pay the agent commission.',
                fact: 'In most residential deals the seller pays — but read the mandate and OTP.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Ask how often you will get updates — weekly beats silence.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Choosing an agent only because they listed the prettiest home online.',
            },
            {
                variant: 'law',
                title: 'South African law',
                body: 'Estate agents must comply with PPRA requirements to practise legally.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'PPRA compliance is irrelevant when choosing an agent.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Legal compliance protects you.',
            },
            {
                kind: 'mcq',
                prompt: 'Best first filter for an agent?',
                options: [
                    { id: 'a', label: 'Loudest Instagram' },
                    { id: 'b', label: 'Verified credentials + suburb experience' },
                    { id: 'c', label: 'Whoever texts first' },
                    { id: 'd', label: 'Cheapest mystery fee' },
                ],
                correctId: 'b',
                explanation: 'Credentials and local experience beat noise.',
            },
            {
                kind: 'scenario',
                prompt: 'Lerato feels pressured to offer today. She should…',
                options: [
                    { id: 'a', label: 'Pause and check budget + OTP terms' },
                    { id: 'b', label: 'Sign blank pages' },
                    { id: 'c', label: 'Ignore her prequal' },
                    { id: 'd', label: 'Skip the conveyancer' },
                ],
                correctId: 'a',
                explanation: 'Pressure is a red flag — clarity first.',
            },
        ],
    },
    {
        slug: 'first-time-tips',
        title: 'First-Time Buyer Tips',
        subtitle:
            'First-time purchase risk concentrates in budget layers, inspection discipline, offer caps, and team coordination — not in “finding the perfect kitchen”.',
        difficulty: 'beginner',
        minutes: 12,
        xp: 100,
        badgeLabel: 'First-Home Ready',
        nextSlug: 'transfer-costs',
        nextTitle: 'Transfer & Hidden Costs',
        nextDescription: 'See the full cash you need beyond the purchase price.',
        personaIndex: 0,
        objectives: [
            {
                title: 'Budget layers',
                body: 'A first-home budget has four layers: deposit equity, acquisition fees, monthly holding costs (bond + rates/levies + insurance), and an emergency reserve. Optimising only the monthly repayment figure ignores layers that fail at transfer or after move-in.',
                whyItMatters:
                    'The cheapest-looking repayment can still break you if fees and buffers were ignored.',
                steps: [
                    {
                        label: 'Fix deposit and fee cash',
                        detail:
                            'Know both amounts before you fall in love with a listing. Mixing them is the classic first-timer trap.',
                    },
                    {
                        label: 'Build the monthly stack',
                        detail:
                            'Bond + rates + levies + insurance + a maintenance provision. Compare to net income after existing debts.',
                    },
                    {
                        label: 'Keep a reserve',
                        detail:
                            'Moving costs, appliances, and a rates/levy shock happen in month one. Empty accounts at registration are fragile.',
                    },
                    {
                        label: 'Re-check before each offer',
                        detail:
                            'Every serious OTP should pass the four-layer test again — prices and fee estimates drift.',
                    },
                ],
                deepDive: {
                    title: 'Four-layer budget sheet',
                    body: 'On one page: (1) deposit available, (2) fee estimate + buffer, (3) max monthly you can service under +1% rate stress, (4) cash left after move-in basics.\n\nIf layer 2 or 4 is empty, reduce purchase price — do not “hope the attorney is cheap”.',
                },
            },
            {
                title: 'Inspection mindset',
                body: 'Staging emphasises aesthetics. Inspection focuses on structural condition, damp, roofing, electrical/plumbing risk, and sectional-title levy health. Cosmetic appeal does not underwrite latent defects.',
                whyItMatters:
                    'Skipping proper inspection because the kitchen was beautiful is a common — and expensive — first-time pattern.',
                steps: [
                    {
                        label: 'View with a written list',
                        detail:
                            'Must-haves, deal-breakers, and questions (damp, cracks, noise, parking, levy specials). Memory fails after the third home.',
                    },
                    {
                        label: 'Look past staging',
                        detail:
                            'Open cupboards, check ceilings, test water pressure where appropriate, and ask about known defects candidly.',
                    },
                    {
                        label: 'For sectional title, ask levy questions',
                        detail:
                            'Arrears culture, special levies, and body-corporate minutes matter as much as finishes.',
                    },
                    {
                        label: 'Use professionals when stakes rise',
                        detail:
                            'A home inspection or specialist report is cheaper than discovering wet works after registration.',
                    },
                ],
                deepDive: {
                    title: 'Viewing scorecard',
                    body: 'Score each home on: location fit, condition risk, monthly cost fit, and negotiation room. Do not let a single emotional feature override three failed scores.\n\nPhotograph and note issues the same day — comparison depends on records, not vibes.',
                },
            },
            {
                title: 'Offer discipline',
                body: 'Offer discipline means a pre-committed maximum purchase price and non-negotiable conditions (especially finance) decided before competitive pressure. Bidding wars exploit buyers without a walk-away number.',
                whyItMatters:
                    'Your walk-away number is the safety rail when urgency and social proof spike.',
                steps: [
                    {
                        label: 'Write the walk-away price',
                        detail:
                            'Do this before the viewing or auction-style weekend, based on budget layers — not on the seller’s asking price alone.',
                    },
                    {
                        label: 'Keep the bond clause',
                        detail:
                            'Financed buyers who waive finance protection to “win” absorb bank-decline risk.',
                    },
                    {
                        label: 'Compete on certainty when useful',
                        detail:
                            'Clean documents and realistic timelines can strengthen an offer without reckless overpaying.',
                    },
                    {
                        label: 'Sleep on stretch decisions',
                        detail:
                            'If the only way to win is to break your written ceiling, you are buying stress, not a home.',
                    },
                ],
                deepDive: {
                    title: 'Walk-away protocol',
                    body: 'Put the max price on paper and share it with your partner/advisor before negotiations. If an agent pushes past it, the answer is already written.\n\nDiscipline is not pessimism — it is how first-time buyers avoid decade-long repayment regret.',
                },
            },
            {
                title: 'Support team',
                body: 'A financed purchase typically needs three professionals coordinating: estate agent (search/negotiation), bond originator or bank (credit), and conveyancer (transfer). Gaps between them create deadline failures.',
                whyItMatters:
                    'First-time buyers often treat these roles as optional until an OTP clock is already running.',
                steps: [
                    {
                        label: 'Appoint early',
                        detail:
                            'Have originator and conveyancer contacts before you submit a serious offer.',
                    },
                    {
                        label: 'Share the same OTP',
                        detail:
                            'Everyone should work from the signed contract dates — not verbal summaries.',
                    },
                    {
                        label: 'Centralise documents',
                        detail:
                            'One pack for FICA/income avoids contradictory submissions to bank and attorney.',
                    },
                    {
                        label: 'Weekly status habit',
                        detail:
                            'Ask who owns the next action. Silence across all three roles means the file is stalling.',
                    },
                ],
                deepDive: {
                    title: 'Team RACI for buyers',
                    body: 'Agent: stock and negotiation. Originator: affordability and bank pack. Conveyancer: legal transfer and clearances.\n\nYou: decisions, documents, and deposit/fee cash. If one role is missing, name the gap before you offer.',
                },
            },
        ],
        steps: [
            { label: 'Prequal first', detail: 'Know your ceiling before emotional shopping.' },
            { label: 'Fee buffer', detail: 'Cash beyond deposit for transfer and bond costs.' },
            { label: 'View with a list', detail: 'Must-haves vs nice-to-haves, written down.' },
            { label: 'Offer calmly', detail: 'Conditions and walk-away price clear in advance.' },
        ],
        timeline: [
            { title: 'Prep money', detail: 'Savings + prequal.', duration: '2–8 weeks' },
            { title: 'Active search', detail: 'Views and comparisons.', duration: 'Varies' },
            { title: 'Offer to keys', detail: 'Finance + transfer.', duration: '2–4 months typical' },
        ],
        knowledge: [
            {
                variant: 'takeaway',
                title: 'Key takeaway',
                body: 'The cheapest-looking repayment can still break you if fees and buffers were ignored.',
            },
            {
                variant: 'warning',
                title: 'Warning',
                body: 'Bidding wars feel urgent — your walk-away number is your safety rail.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Take photos and notes at every viewing — memory lies after the third home.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Skipping a proper inspection because the kitchen was beautiful.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'What should exist before emotional bidding?',
                options: [
                    { id: 'a', label: 'A walk-away budget' },
                    { id: 'b', label: 'A new credit card' },
                    { id: 'c', label: 'Zero documents' },
                    { id: 'd', label: 'No conveyancer' },
                ],
                correctId: 'a',
                explanation: 'Discipline beats adrenaline.',
            },
            {
                kind: 'true-false',
                prompt: 'Transfer costs are optional for first-time buyers.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Costs still apply — plan cash separately.',
            },
            {
                kind: 'scenario',
                prompt: 'Sipho loves a home R80k over budget. Best move?',
                options: [
                    { id: 'a', label: 'Offer anyway and hope' },
                    { id: 'b', label: 'Re-check affordability and walk-away line' },
                    { id: 'c', label: 'Hide the overage from his partner' },
                    { id: 'd', label: 'Skip the inspection' },
                ],
                correctId: 'b',
                explanation: 'Reality check before commitment.',
            },
        ],
    },
    {
        slug: 'transfer-costs',
        title: 'Transfer & Hidden Costs',
        subtitle:
            'Acquisition cash includes transfer duty or VAT (context-dependent), conveyancing and bond registration fees, and clearance-related amounts — not only the purchase price and deposit.',
        difficulty: 'intermediate',
        minutes: 13,
        xp: 120,
        badgeLabel: 'Cost Clear',
        nextSlug: 'flisp-subsidy',
        nextTitle: 'Government Subsidies (FLISP)',
        nextDescription: 'See if a subsidy can help your first purchase.',
        personaIndex: 1,
        objectives: [
            {
                title: 'Transfer duty vs VAT',
                body: 'Transfer duty is a tax on the acquisition of property payable to SARS on many residential purchases of second-hand stock. Some transactions (commonly certain new builds from VAT vendors) are VAT-inclusive instead of transfer duty — the correct regime depends on the transaction structure.',
                whyItMatters:
                    'Applying the wrong tax assumption understates cash needed at transfer by a material amount.',
                steps: [
                    {
                        label: 'Identify the transaction type',
                        detail:
                            'Ask whether the sale is subject to transfer duty or VAT. Do not guess from the marketing brochure alone.',
                    },
                    {
                        label: 'Estimate early',
                        detail:
                            'Use an educational calculator for a first pass, then confirm with the conveyancer once the property and price are known.',
                    },
                    {
                        label: 'Watch price brackets',
                        detail:
                            'Transfer duty rates are tiered. Crossing a threshold changes the tax — model the actual offer price.',
                    },
                    {
                        label: 'Do not conflate with the bond',
                        detail:
                            'A bond grant finances the loan portion of price (subject to terms) — it does not automatically fund transfer tax or attorney fees.',
                    },
                ],
                deepDive: {
                    title: 'Tax regime checklist',
                    body: 'Before a serious offer, write: “Transfer duty or VAT?” and the estimated rand amount at your intended price.\n\nConfirm with conveyancer once the OTP is live. SARS rules and product structures change — verify current treatment for your deal. Educational content only.',
                },
            },
            {
                title: 'Attorney fees',
                body: 'Transfer attorneys charge professional fees and disbursements for conveyancing. Where a bond is registered, bond registration costs (often via the bank’s attorneys) are additional. Fee scales and disbursements vary — obtain a written estimate.',
                whyItMatters:
                    'Buyers who budget only transfer duty still underfund the attorney side of the cash stack.',
                steps: [
                    {
                        label: 'Request a written fee estimate',
                        detail:
                            'Ask for transfer duty/VAT, professional fees, and disbursements listed separately.',
                    },
                    {
                        label: 'Include bond registration costs',
                        detail:
                            'If you are financing, model bond attorney costs as a distinct line item.',
                    },
                    {
                        label: 'Update after OTP',
                        detail:
                            'Final figures follow the accepted price and property specifics — refresh the estimate.',
                    },
                    {
                        label: 'Pay on attorney request',
                        detail:
                            'Funds are called as the file progresses. Keep fee cash liquid and ring-fenced.',
                    },
                ],
                deepDive: {
                    title: 'Fee estimate anatomy',
                    body: 'A usable quote breaks out: transfer tax/VAT treatment, transfer attorney fee, bond registration fee, deeds office/disbursements, and any anticipated clearance advances.\n\nIf you only receive a single round number with no breakdown, ask again before you treat it as final.',
                },
            },
            {
                title: 'Clearances',
                body: 'Municipal rates clearances and (for sectional title) levy clearances confirm that amounts owing to the municipality or body corporate are addressed so transfer can proceed. Buyers should understand how adjustments and advances are handled in the conveyancing accounting.',
                whyItMatters:
                    'Clearance delays are a common reason lodgement slips even when finance is granted.',
                steps: [
                    {
                        label: 'Ask what clearances apply',
                        detail:
                            'Freehold vs sectional title have different levy/rates patterns. Your conveyancer will specify.',
                    },
                    {
                        label: 'Budget for adjustments',
                        detail:
                            'Pro-rata rates/levies may appear in final accounts. Keep a small contingency beyond headline fees.',
                    },
                    {
                        label: 'Do not ignore body corporate health',
                        detail:
                            'Special levies and arrears culture affect both clearance timing and your future monthly cost.',
                    },
                    {
                        label: 'Track the clearance milestone',
                        detail:
                            'On weekly status calls, ask whether rates/levy clearances are in hand.',
                    },
                ],
                deepDive: {
                    title: 'Clearances in the timeline',
                    body: 'Treat clearances as a critical path item alongside bond grant and FICA. A granted bond with outstanding rates/levy issues still cannot lodge cleanly.\n\nAsk early; escalate politely if the seller side is slow.',
                },
            },
            {
                title: 'Buffer planning',
                body: 'Fee buffers are cash reserved for acquisition costs and shortfalls, held separately from deposit equity. Many mid-market buyers underestimate fees by tens of thousands of rand.',
                whyItMatters:
                    'Deposit ≠ total cash required. Arriving at transfer with only deposit money stalls registration.',
                steps: [
                    {
                        label: 'Ring-fence a fees account',
                        detail:
                            'Physically or notionally separate deposit from fees so you do not “borrow” from the wrong pile.',
                    },
                    {
                        label: 'Model before you offer',
                        detail:
                            'Serious offers should already pass a deposit + fees + reserve test.',
                    },
                    {
                        label: 'Add contingency',
                        detail:
                            'Quotes move. A contingency percentage or rand buffer prevents last-week panic.',
                    },
                    {
                        label: 'Revisit if price rises',
                        detail:
                            'A higher accepted price can increase transfer duty and fees — re-run the model.',
                    },
                ],
                deepDive: {
                    title: 'Cash readiness rule',
                    body: 'Rule of thumb for learning: do not submit an OTP until deposit cash and a documented fee estimate (plus buffer) are both available without touching emergency reserves you need post-move.\n\nEducational planning aid — obtain deal-specific attorney figures.',
                },
            },
        ],
        steps: [
            { label: 'Estimate fees', detail: 'Educational calculator first — then attorney quote.' },
            { label: 'Confirm with attorney', detail: 'Property-specific written breakdown.' },
            { label: 'Ring-fence cash', detail: 'Fees account separate from deposit.' },
            { label: 'Pay on request', detail: 'As the conveyancer invoices through the file.' },
        ],
        timeline: [
            { title: 'Early estimate', detail: 'Before you offer seriously.', duration: 'Day 0' },
            { title: 'Updated quote', detail: 'After OTP.', duration: 'Week 1–2' },
            { title: 'Payment requests', detail: 'As transfer progresses.', duration: 'Ongoing' },
        ],
        knowledge: [
            {
                variant: 'numbers',
                title: 'Numbers that matter',
                body: 'Many buyers underestimate fees by tens of thousands — model before you offer.',
            },
            {
                variant: 'myth-fact',
                title: 'Myth vs fact',
                myth: 'If the bank grants the bond, transfer costs are covered automatically.',
                fact: 'Bond finance and transfer costs are different cash needs.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Ask for a written fee estimate listing transfer duty, fees, and disbursements.',
            },
            {
                variant: 'law',
                title: 'South African law',
                body: 'Transfer duty is governed by SARS rules; some new builds may be VAT-inclusive instead.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'The deposit always includes transfer attorney fees.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Plan fees separately unless your quote says otherwise.',
            },
            {
                kind: 'mcq',
                prompt: 'Best time to estimate transfer costs?',
                options: [
                    { id: 'a', label: 'After registration only' },
                    { id: 'b', label: 'Before serious offers' },
                    { id: 'c', label: 'Never' },
                    { id: 'd', label: 'Only after moving in' },
                ],
                correctId: 'b',
                explanation: 'Know cash needs early.',
            },
            {
                kind: 'scenario',
                prompt: 'Nomsa has exactly R135k — all earmarked as 10% deposit. She should…',
                options: [
                    { id: 'a', label: 'Also budget a fee buffer' },
                    { id: 'b', label: 'Ignore attorney invoices' },
                    { id: 'c', label: 'Assume VAT covers everything' },
                    { id: 'd', label: 'Skip the conveyancer' },
                ],
                correctId: 'a',
                explanation: 'Deposit ≠ total cash required.',
            },
        ],
    },
    {
        slug: 'flisp-subsidy',
        title: 'Government Subsidies (FLISP)',
        subtitle:
            'FLISP (and successor programme branding) can help qualifying first-time buyers bridge an affordability gap — it is not a substitute for bond assessment, OTP discipline, or conveyancing.',
        difficulty: 'intermediate',
        minutes: 11,
        xp: 100,
        badgeLabel: 'Subsidy Savvy',
        nextSlug: 'buying-deceased-estate',
        nextTitle: 'Buying a Deceased Estate',
        nextDescription: 'Understand executors, delays, and protections.',
        personaIndex: 1,
        objectives: [
            {
                title: 'Who it is for',
                body: 'Subsidy programmes for first-time buyers typically target households within defined income bands and other eligibility criteria (citizenship/residency, first-time status, property parameters). Thresholds and programme names change — eligibility is factual, not aspirational.',
                whyItMatters:
                    'Budgeting on outdated blog thresholds creates OTPs that assume money that will not arrive.',
                steps: [
                    {
                        label: 'Confirm first-time and income rules',
                        detail:
                            'Verify current official criteria before treating subsidy as part of your deposit stack.',
                    },
                    {
                        label: 'Check property and location rules',
                        detail:
                            'Some programmes constrain property type, price, or development context. Confirm fit before you offer.',
                    },
                    {
                        label: 'Treat eligibility as binary until confirmed',
                        detail:
                            '“Might qualify” is not cash. Do not stretch purchase price on a maybe.',
                    },
                    {
                        label: 'Document the source you used',
                        detail:
                            'Keep the official page/date you checked — programmes are revised.',
                    },
                ],
                deepDive: {
                    title: 'Eligibility verification habit',
                    body: 'Before relying on a subsidy in a purchase budget:\n1) Confirm programme name and administering channel.\n2) Confirm income band and first-time rules from an official source.\n3) Ask your originator how lenders treat the benefit on your deal.\n\nEducational overview only — not a grant decision.',
                },
            },
            {
                title: 'What it can do',
                body: 'A housing subsidy reduces the funding gap between what you can borrow/contribute and the purchase price, subject to programme rules and lender treatment. It does not eliminate the need for affordability assessment or transfer cost planning.',
                whyItMatters:
                    'Misunderstanding subsidy as “free house” leads to underfunded fees and weak bond applications.',
                steps: [
                    {
                        label: 'Map subsidy to the cash stack',
                        detail:
                            'Clarify whether it reduces loan size, supports deposit, or applies in another documented way for your lender.',
                    },
                    {
                        label: 'Keep fee funding intact',
                        detail:
                            'Subsidy discussions do not erase transfer duty/attorney costs — budget them anyway.',
                    },
                    {
                        label: 'Align timing expectations',
                        detail:
                            'Application and payout timing vary. Do not assume same-week cash at OTP signature.',
                    },
                    {
                        label: 'Stress the deal without subsidy',
                        detail:
                            'If the purchase only works if subsidy pays perfectly and on time, the structure is fragile.',
                    },
                ],
                deepDive: {
                    title: 'Subsidy in the underwriting picture',
                    body: 'Ask the originator: how is the benefit reflected in the bank’s affordability and loan amount? What documents prove entitlement? What happens if processing slips past the bond-clause deadline?\n\nWrite those answers beside your OTP dates.',
                },
            },
            {
                title: 'Verify current rules',
                body: 'Income bands, grant amounts, and administrative channels are policy instruments — they are updated. Secondary articles and social posts lag official notices.',
                whyItMatters:
                    'Using outdated income thresholds from a blog post years ago is a common and costly mistake.',
                steps: [
                    {
                        label: 'Prefer primary sources',
                        detail:
                            'Government / Human Settlements / accredited programme pages over unverified summaries.',
                    },
                    {
                        label: 'Re-check at offer time',
                        detail:
                            'A check from six months ago may be stale when you sign.',
                    },
                    {
                        label: 'Confirm with a professional channel',
                        detail:
                            'Originators and accredited helpdesks can explain lender-specific practice.',
                    },
                    {
                        label: 'Avoid WhatsApp “guarantees”',
                        detail:
                            'No informal promise replaces programme rules and bank credit assessment.',
                    },
                ],
                deepDive: {
                    title: 'Stale-data risk',
                    body: 'Print or save the criteria page (with date) you used for planning. If your income sits near a band edge, verify again before OTP — edge cases are where outdated numbers hurt most.',
                },
            },
            {
                title: 'Stack with process',
                body: 'Even with a subsidy pathway, you still need a valid OTP, bond application (where financed), FICA, and conveyancing to registration. Subsidy is an input to funding — not a parallel legal system.',
                whyItMatters:
                    'Buyers sometimes delay conveyancer instruction while “waiting for subsidy paperwork,” then miss contractual deadlines.',
                steps: [
                    {
                        label: 'Run the normal purchase path',
                        detail:
                            'OTP → finance conditions → conveyancer file → registration milestones remain mandatory.',
                    },
                    {
                        label: 'Integrate documents early',
                        detail:
                            'Subsidy forms and bond packs should be coordinated, not sequenced as afterthoughts.',
                    },
                    {
                        label: 'Protect bond-clause timing',
                        detail:
                            'If subsidy evidence is required for grant, start it immediately after acceptance.',
                    },
                    {
                        label: 'Keep fee cash ready',
                        detail:
                            'Registration still needs attorney funding regardless of subsidy status.',
                    },
                ],
                deepDive: {
                    title: 'One timeline, multiple workstreams',
                    body: 'Draw one timeline with three swimlanes: subsidy admin, bank credit, conveyancing. The OTP deadlines sit above all three.\n\nIf any swimlane cannot finish inside the bond clause, renegotiate dates before you rely on hope.',
                },
            },
        ],
        steps: [
            { label: 'Check eligibility', detail: 'Income, first-time status, and current official rules.' },
            { label: 'Confirm amount guidance', detail: 'Current programme details — not old blog posts.' },
            { label: 'Align with lender', detail: 'How subsidy interacts with your bond assessment.' },
            { label: 'Complete purchase path', detail: 'OTP, finance, and transfer still apply.' },
        ],
        timeline: [
            { title: 'Eligibility check', detail: 'Before you rely on it.', duration: 'Early' },
            { title: 'Application support', detail: 'With accredited channels.', duration: 'Deal timeline' },
            { title: 'Payout / benefit', detail: 'Per programme rules.', duration: 'Varies' },
        ],
        knowledge: [
            {
                variant: 'warning',
                title: 'Warning',
                body: 'Do not sign an OTP assuming a subsidy until eligibility is confirmed.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Ask your originator how lenders treat Flisp on your specific deal.',
            },
            {
                variant: 'definition',
                title: 'Quick definition',
                body: 'Flisp helps qualifying buyers bridge affordability — it is not a free house.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Using outdated income thresholds from a blog post years ago.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Flisp replaces the need for a bond application.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'You still follow the normal purchase and finance path.',
            },
            {
                kind: 'mcq',
                prompt: 'Before budgeting on Flisp you should…',
                options: [
                    { id: 'a', label: 'Verify current eligibility rules' },
                    { id: 'b', label: 'Guess the amount' },
                    { id: 'c', label: 'Skip FICA' },
                    { id: 'd', label: 'Ignore the OTP' },
                ],
                correctId: 'a',
                explanation: 'Rules change — verify.',
            },
            {
                kind: 'scenario',
                prompt: 'Nomsa might qualify. Best first step?',
                options: [
                    { id: 'a', label: 'Confirm eligibility with a trusted channel' },
                    { id: 'b', label: 'Offer above budget immediately' },
                    { id: 'c', label: 'Cancel her deposit plans' },
                    { id: 'd', label: 'Avoid conveyancers' },
                ],
                correctId: 'a',
                explanation: 'Confirm first, then plan.',
            },
        ],
    },
    {
        slug: 'buying-deceased-estate',
        title: 'Buying a Deceased Estate',
        subtitle:
            'Property in a deceased estate is sold by the appointed executor under Master’s Office oversight. Authority, timelines, and due diligence differ from a standard private sale.',
        difficulty: 'advanced',
        minutes: 12,
        xp: 110,
        badgeLabel: 'Estate Aware',
        nextSlug: 'understanding-trusts',
        nextTitle: 'Understanding Trusts',
        nextDescription: 'Learn what changes when a trust holds the property.',
        personaIndex: 2,
        objectives: [
            {
                title: 'Who can sell',
                body: 'The executor (or Master’s representative with authority) is typically the party empowered to sell estate assets, evidenced by letters of executorship (or equivalent authority). Heirs do not automatically have power to sell merely because they expect inheritance.',
                whyItMatters:
                    'Paying or contracting with the wrong party creates unenforceable deals and deposit risk.',
                steps: [
                    {
                        label: 'Confirm letters of executorship',
                        detail:
                            'Ask your conveyancer to verify the seller’s authority before you treat the OTP as routine.',
                    },
                    {
                        label: 'Match names on the OTP',
                        detail:
                            'The contracting seller should be the estate/executor as legally required — not an informal family spokesperson alone.',
                    },
                    {
                        label: 'Refuse informal shortcuts',
                        detail:
                            '“Priority fees” to private accounts to speed Master’s processes are a hard stop.',
                    },
                    {
                        label: 'Keep conveyancer in the lead',
                        detail:
                            'Estate transfers are document-heavy; attorney guidance is part of risk control.',
                    },
                ],
                deepDive: {
                    title: 'Authority checklist',
                    body: 'Before deposit release beyond OTP terms: executor identity confirmed; letters sighted by conveyancer; OTP seller description correct; deposit payee is a proper trust/attorney channel.\n\nEducational framework — your attorney confirms legal sufficiency.',
                },
            },
            {
                title: 'Extra delays',
                body: 'Deceased-estate transfers often take longer than average private sales because of Master’s Office processes, heir consultations, tax/clearance issues, and estate administration steps. Standard eight-to-twelve-week assumptions are frequently optimistic.',
                whyItMatters:
                    'Using a rush timeline and then panicking when the estate moves slowly leads to bad renegotiations and occupation disputes.',
                steps: [
                    {
                        label: 'Build timeline buffers',
                        detail:
                            'Extend bond-clause and occupation planning for estate complexity.',
                    },
                    {
                        label: 'Ask for estate experience',
                        detail:
                            'Prefer conveyancers who have recently completed deceased-estate transfers.',
                    },
                    {
                        label: 'Expect intermittent quiet periods',
                        detail:
                            'Administrative queues are normal; weekly status still matters.',
                    },
                    {
                        label: 'Align lease/move plans',
                        detail:
                            'Do not terminate a rental on a best-case estate transfer date.',
                    },
                ],
                deepDive: {
                    title: 'Delay planning sheet',
                    body: 'List: earliest realistic registration, drop-dead move date, rental overlap cost, and OTP occupation rules.\n\nIf overlap is unaffordable, renegotiate dates or do not offer — price discounts do not buy Master’s Office speed.',
                },
            },
            {
                title: 'Contract protections',
                body: 'OTPs on estate sales should address authority warranties, extended timelines, and conditions that protect the buyer if administration stalls. Copy-pasting a simple private-sale OTP without estate adaptations is risky.',
                whyItMatters:
                    'Weak contracts leave buyers exposed when estate administration is slower or more contested than promised.',
                steps: [
                    {
                        label: 'Review conditions with conveyancer',
                        detail:
                            'Before signing, escalate estate-specific clauses — not after deposit payment.',
                    },
                    {
                        label: 'Protect finance deadlines',
                        detail:
                            'Bond fulfilment periods must reflect realistic document flow from an estate seller.',
                    },
                    {
                        label: 'Clarify occupation risk',
                        detail:
                            'Who occupies, who pays occupational interest, and what happens if registration slips.',
                    },
                    {
                        label: 'Document everything',
                        detail:
                            'Estate deals attract more parties and opinions — written instructions beat WhatsApp lore.',
                    },
                ],
                deepDive: {
                    title: 'Estate OTP focus areas',
                    body: 'Authority, timelines, occupation, deposit handling, and breach remedies deserve annotated review.\n\nIf heirs disagree in the background, your protections are the contract and the Master’s process — not verbal family assurances.',
                },
            },
            {
                title: 'Due diligence',
                body: 'Beyond normal title and compliance checks, estate purchases may involve debts, outstanding rates/levies, occupancy by family members, and movable property disputes. Diligence should be explicit.',
                whyItMatters:
                    'Hidden occupation or clearance problems convert a “bargain” into a delayed, contentious transfer.',
                steps: [
                    {
                        label: 'Title and encumbrances',
                        detail:
                            'Confirm what must be cancelled or settled for clean transfer.',
                    },
                    {
                        label: 'Rates, levies, and debts',
                        detail:
                            'Clearance pathway should be understood early with the conveyancer.',
                    },
                    {
                        label: 'Occupation reality',
                        detail:
                            'Who is living there, and on what basis will vacant occupation be given?',
                    },
                    {
                        label: 'Fixtures and movables',
                        detail:
                            'Estate sales often blur what is included — list it in the OTP.',
                    },
                ],
                deepDive: {
                    title: 'Diligence questions for estates',
                    body: 'Ask: letters confirmed? occupants? special levies? rates arrears? existing bonds to cancel? any heir objections known to the executor?\n\nPrice the delay and complexity — not only the asking price discount.',
                },
            },
        ],
        steps: [
            { label: 'Confirm seller authority', detail: 'Letters of executorship verified via conveyancer.' },
            { label: 'Instruct conveyancer early', detail: 'Estate experience helps set realistic dates.' },
            { label: 'Build timeline buffers', detail: 'Do not assume standard private-sale speed.' },
            { label: 'Complete normal transfer', detail: 'Still registers at the Deeds Office when ready.' },
        ],
        timeline: [
            { title: 'Authority confirmed', detail: 'Executor can act.', duration: 'Prerequisite' },
            { title: 'OTP & conditions', detail: 'Protect against delays.', duration: 'Week 1' },
            { title: 'Extended transfer', detail: 'Estate complexity.', duration: 'Longer than average' },
        ],
        knowledge: [
            {
                variant: 'warning',
                title: 'Warning',
                body: 'Never pay large sums to private accounts “to speed things up”.',
            },
            {
                variant: 'law',
                title: 'South African law',
                body: 'Deceased estates are administered under the Administration of Estates framework with Master’s oversight.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Ask your conveyancer how many deceased-estate transfers they have completed recently.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Using a standard rush timeline and then panicking when the estate moves slowly.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'Who typically signs for a deceased estate sale?',
                options: [
                    { id: 'a', label: 'Any neighbour' },
                    { id: 'b', label: 'The appointed executor' },
                    { id: 'c', label: 'A random heir on WhatsApp' },
                    { id: 'd', label: 'The estate agent alone' },
                ],
                correctId: 'b',
                explanation: 'Executor authority is essential.',
            },
            {
                kind: 'true-false',
                prompt: 'Deceased estate transfers are always faster than normal transfers.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'They often take longer.',
            },
            {
                kind: 'scenario',
                prompt: 'Thabo is asked to pay a “priority fee” to a private account. He should…',
                options: [
                    { id: 'a', label: 'Refuse and speak to his conveyancer' },
                    { id: 'b', label: 'Pay cash immediately' },
                    { id: 'c', label: 'Ignore the OTP' },
                    { id: 'd', label: 'Skip FICA' },
                ],
                correctId: 'a',
                explanation: 'Protect funds — use proper channels.',
            },
        ],
    },
    {
        slug: 'understanding-trusts',
        title: 'Understanding Trusts',
        subtitle:
            'When a trust buys or sells, trustees must act within the trust deed and documented resolutions. Beneficiaries are not automatic contracting parties.',
        difficulty: 'advanced',
        minutes: 11,
        xp: 100,
        badgeLabel: 'Trust Literate',
        nextSlug: 'first-time-buyer-mistakes',
        nextTitle: 'Mistakes First-Time Buyers Make',
        nextDescription: 'Spot the pitfalls before they cost you.',
        personaIndex: 3,
        objectives: [
            {
                title: 'Trustees vs beneficiaries',
                body: 'Trustees administer trust assets according to the trust deed and applicable law. Beneficiaries hold beneficial interests as defined by the deed — they do not automatically have power to sell or bind the trust in a property transaction.',
                whyItMatters:
                    'Contracting with the wrong capacity (a beneficiary “selling” alone) undermines enforceability.',
                steps: [
                    {
                        label: 'Identify the trust formally',
                        detail:
                            'Name, registration/Master’s particulars, and current trustees — not informal family labels.',
                    },
                    {
                        label: 'Read who may bind the trust',
                        detail:
                            'The deed states signing requirements (e.g. all trustees, majority, or specified trustees).',
                    },
                    {
                        label: 'Do not equate beneficiary with seller',
                        detail:
                            'A beneficiary’s WhatsApp approval is not a substitute for trustee authority.',
                    },
                    {
                        label: 'Escalate doubts early',
                        detail:
                            'Conveyancers catch capacity defects — involve them before deposit momentum builds.',
                    },
                ],
                deepDive: {
                    title: 'Capacity in one page',
                    body: 'Write: trust name; trustees; deed signing rule; who will sign the OTP; who will sign transfer documents.\n\nIf any line is unknown, pause the deal until the conveyancer confirms capacity.',
                },
            },
            {
                title: 'Resolutions',
                body: 'A trust resolution is a formal trustee decision authorising a defined transaction (sale or purchase), often required alongside deed compliance. Lenders and conveyancers rely on resolutions to evidence authority.',
                whyItMatters:
                    'Missing or defective resolutions delay bond assessment and transfer — sometimes fatally relative to OTP deadlines.',
                steps: [
                    {
                        label: 'Request deed and resolutions early',
                        detail:
                            'Before celebrating a verbal acceptance, gather the authority pack.',
                    },
                    {
                        label: 'Match resolution to the deal',
                        detail:
                            'Price, property description, and authorised signatories should align with the OTP.',
                    },
                    {
                        label: 'Watch sole-trustee assumptions',
                        detail:
                            'One trustee acting alone may be insufficient — the deed controls.',
                    },
                    {
                        label: 'Refresh if trustees change',
                        detail:
                            'Stale resolutions after trustee changes create last-minute defects.',
                    },
                ],
                deepDive: {
                    title: 'Resolution quality checks',
                    body: 'Ask: dated? signed by required trustees? property correctly described? authority to sign OTP and transfer docs clear?\n\nSend the pack to conveyancer and lender in parallel to compress the critical path.',
                },
            },
            {
                title: 'Bond implications',
                body: 'When a trust borrows, lenders typically require enhanced KYC, trust deed review, resolutions, and sometimes suretyships from trustees. Assessment often takes longer than a straightforward natural-person application.',
                whyItMatters:
                    'Treating a trust purchase like a simple private timeline causes bond-clause breaches.',
                steps: [
                    {
                        label: 'Tell the originator immediately',
                        detail:
                            'Entity/trust deals need different packs — start before OTP if possible.',
                    },
                    {
                        label: 'Expect deeper KYC',
                        detail:
                            'Trustees’ identities, income/contribution sources, and trust particulars will be scrutinised.',
                    },
                    {
                        label: 'Clarify who is creditworthy',
                        detail:
                            'Understand whether the trust alone, trustees, or sureties carry the credit assessment.',
                    },
                    {
                        label: 'Extend fulfilment periods realistically',
                        detail:
                            'Build OTP finance deadlines for trust complexity.',
                    },
                ],
                deepDive: {
                    title: 'Trust finance briefing',
                    body: 'Before offer: confirm the target bank will consider trust borrowers for this property class; list required documents; estimate turnaround; decide suretyship appetite.\n\nEducational only — credit decisions are lender-specific.',
                },
            },
            {
                title: 'Deed checks',
                body: 'The trust deed defines powers, restrictions, and purpose. Some deeds limit borrowing, property investment, or require consents. A transaction outside deed powers is a structural defect.',
                whyItMatters:
                    'Discovering a deed restriction after OTP acceptance is how deals collapse late.',
                steps: [
                    {
                        label: 'Conveyancer reviews the deed',
                        detail:
                            'Powers to acquire/dispose and signing formalities are legal questions.',
                    },
                    {
                        label: 'Flag investment/borrowing limits',
                        detail:
                            'If the deed restricts geared property ownership, rethink structure before offering.',
                    },
                    {
                        label: 'Align OTP with deed formalities',
                        detail:
                            'Signing blocks should match required trustee combinations.',
                    },
                    {
                        label: 'Do not DIY interpret complex deeds',
                        detail:
                            'Ambiguity is for attorneys — not for group chats.',
                    },
                ],
                deepDive: {
                    title: 'Deed risk register',
                    body: 'List restrictions found (borrowing, asset types, consents). For each, note whether the planned OTP/bond still works.\n\nIf not, change structure or walk away before deposit inertia sets in.',
                },
            },
        ],
        steps: [
            { label: 'Identify the trust', detail: 'Name, number, and current trustees.' },
            { label: 'Collect resolutions', detail: 'Documented authority to transact.' },
            { label: 'Lender pack', detail: 'Extra KYC and deed review time.' },
            { label: 'Register as usual', detail: 'Deeds Office remains the transfer moment.' },
        ],
        timeline: [
            { title: 'Document gathering', detail: 'Deed + resolutions.', duration: '1–3 weeks' },
            { title: 'Bank assessment', detail: 'May take longer.', duration: 'Variable' },
            { title: 'Transfer', detail: 'Standard path once clear.', duration: 'Typical + buffer' },
        ],
        knowledge: [
            {
                variant: 'definition',
                title: 'Trust resolution',
                body: 'A formal decision by trustees authorising a transaction.',
            },
            {
                variant: 'warning',
                title: 'Warning',
                body: 'One trustee acting alone may not be enough — check the deed.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Send trust documents to your conveyancer early — before you celebrate.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Treating a trust sale like a simple private sale with the same timelines.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Any beneficiary can always sell trust property alone.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Trustees act per the deed — beneficiaries are not automatic sellers.',
            },
            {
                kind: 'mcq',
                prompt: 'What should you request early in a trust deal?',
                options: [
                    { id: 'a', label: 'Trust deed and resolutions' },
                    { id: 'b', label: 'Only a selfie' },
                    { id: 'c', label: 'Nothing in writing' },
                    { id: 'd', label: 'A verbal WhatsApp OK' },
                ],
                correctId: 'a',
                explanation: 'Authority must be documented.',
            },
            {
                kind: 'scenario',
                prompt: 'Lerato’s seller is a trust. She should…',
                options: [
                    { id: 'a', label: 'Involve her conveyancer immediately' },
                    { id: 'b', label: 'Skip authority checks' },
                    { id: 'c', label: 'Pay into a personal account' },
                    { id: 'd', label: 'Ignore the bank’s KYC' },
                ],
                correctId: 'a',
                explanation: 'Professionals catch authority gaps early.',
            },
        ],
    },
    {
        slug: 'first-time-buyer-mistakes',
        title: 'Mistakes First-Time Buyers Make',
        subtitle:
            'The costly first-time patterns are process failures: shopping without prequal, ignoring fees, emotional overpaying, and chaotic paperwork — usually under time pressure.',
        difficulty: 'beginner',
        minutes: 11,
        xp: 95,
        badgeLabel: 'Mistake-Proof',
        nextSlug: 'bond-application-avoid',
        nextTitle: 'What to Avoid When Applying for a Bond',
        nextDescription: 'Keep your application clean and approvable.',
        personaIndex: 0,
        objectives: [
            {
                title: 'Prequal skip',
                body: 'Viewing and offering without a soft affordability check means your “budget” is a guess. Agents and sellers discount unquantified interest, and you risk falling for stock you cannot fund.',
                whyItMatters:
                    'Skipping prequal weakens offers and invites OTP stress when the bank’s number arrives later.',
                steps: [
                    {
                        label: 'Get a dated soft prequal',
                        detail:
                            'Do this before the emotional viewing weekend — not after you have a favourite home.',
                    },
                    {
                        label: 'Share the band with your agent',
                        detail:
                            'Credible filters save time and prevent mismatched show days.',
                    },
                    {
                        label: 'Refresh after credit changes',
                        detail:
                            'New debt or income shifts invalidate old estimates.',
                    },
                    {
                        label: 'Offer only inside the band',
                        detail:
                            'Stretch offers without fee cash are future transfer crises.',
                    },
                ],
                deepDive: {
                    title: 'Anti-skip rule',
                    body: 'No serious OTP until soft prequal + fee estimate exist on paper. Excitement is allowed; undocumented affordability is not.',
                },
            },
            {
                title: 'Fee blindness',
                body: 'Fee blindness is budgeting deposit alone while transfer duty/VAT context, attorney fees, and bond registration costs remain unfunded. It is one of the most common first-time cash failures.',
                whyItMatters:
                    'Hidden cash needs appear as attorney invoices you cannot pay — with contractual deadlines running.',
                steps: [
                    {
                        label: 'Estimate fees before offering',
                        detail:
                            'Educational tools first; attorney quote when the property is known.',
                    },
                    {
                        label: 'Ring-fence fee cash',
                        detail:
                            'Separate from deposit so you do not raid the wrong pile.',
                    },
                    {
                        label: 'Add contingency',
                        detail:
                            'Quotes move with price and disbursements.',
                    },
                    {
                        label: 'Re-run if price rises',
                        detail:
                            'Accepted counter-offers can increase tax and fees.',
                    },
                ],
                deepDive: {
                    title: 'Fee-blindness cure',
                    body: 'On every shortlist card write three numbers: price, deposit, fees+buffer. If fees+buffer is blank, the home is not offer-ready.',
                },
            },
            {
                title: 'Emotional bidding',
                body: 'Emotional bidding is raising price or waiving protections because of urgency, scarcity narratives, or attachment to finishes — without re-testing affordability and walk-away rules.',
                whyItMatters:
                    'Most costly errors are rushed decisions with incomplete information.',
                steps: [
                    {
                        label: 'Pre-write the walk-away',
                        detail:
                            'Decide maximum price before the competitive moment.',
                    },
                    {
                        label: 'Protect finance conditions',
                        detail:
                            'Waiving the bond clause to “win” transfers bank risk to you.',
                    },
                    {
                        label: 'Sleep on stretch counters',
                        detail:
                            'If winning requires breaking your ceiling, you are buying stress.',
                    },
                    {
                        label: 'Use your team as friction',
                        detail:
                            'Ask originator/conveyancer to sanity-check before you escalate.',
                    },
                ],
                deepDive: {
                    title: 'Adrenaline protocol',
                    body: 'When you feel urgency: re-read walk-away number; re-check fee cash; confirm bond-clause days still realistic. If any fail, decline.\n\nAnother listing will appear; a broken budget lasts years.',
                },
            },
            {
                title: 'Paperwork chaos',
                body: 'Incomplete, inconsistent, or slow document packs cause bond delays, query loops, and missed suspensive deadlines. Chaos is a process choice — not bad luck.',
                whyItMatters:
                    'Delays kill deals that were otherwise affordable.',
                steps: [
                    {
                        label: 'Build the pack before OTP',
                        detail:
                            'ID, FICA, payslips, statements, credit schedule — labelled PDFs.',
                    },
                    {
                        label: 'Submit complete, not drip-fed',
                        detail:
                            'Partial packs invite repeated underwriting resets.',
                    },
                    {
                        label: 'Answer queries same day',
                        detail:
                            'Momentum matters inside bond-clause windows.',
                    },
                    {
                        label: 'Freeze new credit mid-process',
                        detail:
                            'New accounts change affordability mid-assessment.',
                    },
                ],
                deepDive: {
                    title: 'Paperwork SOP',
                    body: 'One shared folder; consistent filenames; one owner (you) chasing bank and attorney requests daily until grant and lodgement.\n\nTreat document speed as part of affordability.',
                },
            },
        ],
        steps: [
            { label: 'Spot the trap', detail: 'Name the mistake before it becomes an OTP habit.' },
            { label: 'Replace with a habit', detail: 'Prequal, fee buffer, walk-away, checklist.' },
            { label: 'Use your team', detail: 'Agent + originator + conveyancer on one timeline.' },
            { label: 'Review before OTP', detail: 'Calm final check against the four traps.' },
        ],
        timeline: [
            { title: 'Education week', detail: 'Modules + prequal.', duration: '1–2 weeks' },
            { title: 'Search with rules', detail: 'Budget filters on.', duration: 'Ongoing' },
            { title: 'Offer only when ready', detail: 'Documents warm.', duration: 'Deal day' },
        ],
        knowledge: [
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Maxing the repayment and forgetting rates can rise on a variable bond.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Write your walk-away price on paper before the viewing.',
            },
            {
                variant: 'takeaway',
                title: 'Key takeaway',
                body: 'Most costly errors are rushed decisions with incomplete information.',
            },
            {
                variant: 'warning',
                title: 'Warning',
                body: 'New retail credit just before a bond application can damage affordability.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'Which habit prevents emotional overpaying?',
                options: [
                    { id: 'a', label: 'A written walk-away number' },
                    { id: 'b', label: 'More coffee' },
                    { id: 'c', label: 'Ignoring prequal' },
                    { id: 'd', label: 'Skipping fees' },
                ],
                correctId: 'a',
                explanation: 'Decide before adrenaline hits.',
            },
            {
                kind: 'true-false',
                prompt: 'Messy documents rarely delay bond approvals.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Paperwork gaps cause real delays.',
            },
            {
                kind: 'scenario',
                prompt: 'Sipho wants to open a new store card this week before applying. He should…',
                options: [
                    { id: 'a', label: 'Wait until after the bond process' },
                    { id: 'b', label: 'Open three cards' },
                    { id: 'c', label: 'Hide it from the bank forever' },
                    { id: 'd', label: 'Cancel his deposit' },
                ],
                correctId: 'a',
                explanation: 'New credit can hurt affordability scores.',
            },
        ],
    },
    {
        slug: 'bond-application-avoid',
        title: 'What to Avoid When Applying for a Bond',
        subtitle:
            'During formal credit assessment, new debt, unexplained cash movements, incomplete packs, and slow responses change affordability outcomes and can breach OTP finance deadlines.',
        difficulty: 'intermediate',
        minutes: 10,
        xp: 95,
        badgeLabel: 'Clean Apply',
        nextSlug: 'buying-property-as-business',
        nextTitle: 'Buying a Property as a Business',
        nextDescription: 'Company purchases — documents and suretyships.',
        personaIndex: 2,
        objectives: [
            {
                title: 'Credit freeze',
                body: 'A credit freeze during assessment means avoiding new credit facilities (store accounts, vehicle finance, personal loans) that add instalments or hard enquiries while the lender is measuring affordability under the National Credit Act.',
                whyItMatters:
                    'Opening a clothing account or car loan mid-apply can change the affordability math and delay or decline the bond.',
                steps: [
                    {
                        label: 'Pause discretionary credit',
                        detail:
                            'Until grant is safe (and ideally until registration), avoid new facilities.',
                    },
                    {
                        label: 'Do not “hide” new debt',
                        detail:
                            'Undisclosed obligations surface on bureau data and damage trust.',
                    },
                    {
                        label: 'Delay large purchases on credit',
                        detail:
                            'Furniture and appliances can wait — or be cash-funded from a planned buffer.',
                    },
                    {
                        label: 'Tell your originator before big changes',
                        detail:
                            'If a credit event is unavoidable, plan disclosure and timing.',
                    },
                ],
                deepDive: {
                    title: 'Freeze window',
                    body: 'Treat the period from OTP acceptance to bond grant as a credit quiet period. The goal is a stable obligation profile for underwriting — not a lifestyle upgrade financed in parallel.',
                },
            },
            {
                title: 'Job stability story',
                body: 'Lenders assess continuity and sustainability of income. Changing jobs, shifting to probation, or altering pay structure mid-application without a documented narrative creates underwriting friction.',
                whyItMatters:
                    'Changing jobs mid-application without a plan to explain continuity of income is a common self-inflicted delay.',
                steps: [
                    {
                        label: 'Avoid elective job hops mid-file',
                        detail:
                            'If you can time a move after grant/registration, risk drops.',
                    },
                    {
                        label: 'Document continuity if you must move',
                        detail:
                            'Offer letters, contracts, and start dates should show income sustainability.',
                    },
                    {
                        label: 'Explain commission/variable pay clearly',
                        detail:
                            'Provide the evidence schedule your bank expects — do not average mentally.',
                    },
                    {
                        label: 'Flag probation and contract roles early',
                        detail:
                            'Surprises in week three of assessment waste bond-clause days.',
                    },
                ],
                deepDive: {
                    title: 'Income narrative sheet',
                    body: 'One page: employer, role, start date, pay structure, variable components, and evidence list. Share with the originator before submission so the first pack is complete.',
                },
            },
            {
                title: 'Complete packs',
                body: 'A complete pack is a coherent first submission of identity, FICA, income, statements, and application forms that matches the OTP parties and property. Drip-feeding documents resets underwriting attention.',
                whyItMatters:
                    'Incomplete first submissions convert a two-week path into a six-week query loop.',
                steps: [
                    {
                        label: 'Assemble before lodge',
                        detail:
                            'Checklist with the originator; submit once, cleanly.',
                    },
                    {
                        label: 'Name files clearly',
                        detail:
                            'Underwriters are human — “Payslip_March.pdf” beats “scan42”.',
                    },
                    {
                        label: 'Match OTP names',
                        detail:
                            'Spelling and party order differences cause avoidable KYC friction.',
                    },
                    {
                        label: 'Evidence large deposits',
                        detail:
                            'Unexplained cash inflows trigger questions — document sources upfront.',
                    },
                ],
                deepDive: {
                    title: 'First-submission standard',
                    body: 'If the originator cannot tick every required item, do not lodge “to start the clock.” A clean day-zero pack beats an early incomplete lodge every time.',
                },
            },
            {
                title: 'Fast replies',
                body: 'Underwriting queries have short practical half-lives inside OTP bond clauses. Slow replies are economically equivalent to a weaker application.',
                whyItMatters:
                    'Ghosting underwriters turns approvable files into lapsed conditions.',
                steps: [
                    {
                        label: 'Same-day response habit',
                        detail:
                            'Treat bank requests like payment deadlines.',
                    },
                    {
                        label: 'Keep your phone reachable',
                        detail:
                            'Missed calls for simple confirmations stall files.',
                    },
                    {
                        label: 'One channel owner',
                        detail:
                            'Decide who replies (you vs originator) so messages are not dropped.',
                    },
                    {
                        label: 'Escalate blockers early',
                        detail:
                            'If a document will take days, tell the conveyancer/agent so dates can be managed.',
                    },
                ],
                deepDive: {
                    title: 'Query SLA',
                    body: 'Personal SLA: acknowledge within hours; fulfil within one business day where possible. If not possible, send a status note with ETA.\n\nSilence is the most expensive reply.',
                },
            },
        ],
        steps: [
            { label: 'Freeze new credit', detail: 'Until grant is safe — avoid new instalments.' },
            { label: 'Submit complete FICA', detail: 'One clean pack — no drip-feeding.' },
            { label: 'Explain income clearly', detail: 'Commission and allowances documented.' },
            { label: 'Stay reachable', detail: 'Same-day responses when underwriters query.' },
        ],
        timeline: [
            { title: 'Application lodged', detail: 'Clock starts.', duration: 'Day 0' },
            { title: 'Queries window', detail: 'Banks ask follow-ups.', duration: 'Days–weeks' },
            { title: 'Grant or decline', detail: 'Outcome letter.', duration: 'Variable' },
        ],
        knowledge: [
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Changing jobs mid-application without a plan to explain continuity of income.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep PDFs named clearly: ID, payslip March, statement Feb — underwriters are human.',
            },
            {
                variant: 'warning',
                title: 'Warning',
                body: 'Large unexplained cash deposits can trigger questions — be ready to evidence them.',
            },
            {
                variant: 'law',
                title: 'South African law',
                body: 'Affordability assessments under the NCA mean lenders must understand your real obligations.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Opening a new clothing account during assessment is harmless.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'New credit can change affordability.',
            },
            {
                kind: 'mcq',
                prompt: 'Best response when the bank asks for another statement?',
                options: [
                    { id: 'a', label: 'Send it the same day if possible' },
                    { id: 'b', label: 'Ignore for three weeks' },
                    { id: 'c', label: 'Send a meme' },
                    { id: 'd', label: 'Change banks silently' },
                ],
                correctId: 'a',
                explanation: 'Speed keeps momentum.',
            },
            {
                kind: 'scenario',
                prompt: 'Thabo wants a new car loan this month while his bond is pending. He should…',
                options: [
                    { id: 'a', label: 'Wait until the bond outcome is clear' },
                    { id: 'b', label: 'Take both immediately' },
                    { id: 'c', label: 'Hide the car loan' },
                    { id: 'd', label: 'Cancel FICA' },
                ],
                correctId: 'a',
                explanation: 'One credit event at a time.',
            },
        ],
    },
    {
        slug: 'buying-property-as-business',
        title: 'Buying a Property as a Business',
        subtitle:
            'When a company or close corporation acquires property, authority comes from corporate governance documents and resolutions. Lenders often require personal suretyships — which reintroduce personal risk.',
        difficulty: 'advanced',
        minutes: 12,
        xp: 110,
        badgeLabel: 'Entity Buyer',
        nextSlug: 'home-loans',
        nextTitle: 'Understanding Home Loans',
        nextDescription: 'Revisit bond basics anytime — or start the hub again stronger.',
        personaIndex: 2,
        objectives: [
            {
                title: 'Entity documents',
                body: 'Entity purchases typically require CIPC registration documents, constitutional documents, beneficial ownership/FICA information, and a resolution authorising the acquisition and any related borrowing. The OTP buyer name must match the legal entity.',
                whyItMatters:
                    'Using a personal OTP template when the buyer is meant to be the company creates title and finance defects.',
                steps: [
                    {
                        label: 'Confirm the buying entity',
                        detail:
                            'Pty Ltd, CC, or other — and that it is in good standing.',
                    },
                    {
                        label: 'Assemble the corporate pack',
                        detail:
                            'Registration docs, directors/members, FICA, and signed resolution.',
                    },
                    {
                        label: 'Align OTP party names',
                        detail:
                            'Exact legal name and registration number on the contract.',
                    },
                    {
                        label: 'Instruct conveyancer early',
                        detail:
                            'Entity KYC and authority checks take longer than natural-person files.',
                    },
                ],
                deepDive: {
                    title: 'Entity pack checklist',
                    body: 'Before offer: CIPC docs; directors/members list; resolution to buy (and borrow if geared); FICA for entity and relevant individuals; OTP in entity name.\n\nIf any item is missing, you are not offer-ready.',
                },
            },
            {
                title: 'Suretyships',
                body: 'A suretyship is a personal undertaking to meet the entity’s obligations if the entity defaults. Banks commonly require directors/members to stand surety on entity property loans, which can expose personal assets despite “limited liability” branding.',
                whyItMatters:
                    'Signing suretyship without reading scope, duration, and enforcement terms converts a company deal into personal contingent debt.',
                steps: [
                    {
                        label: 'Ask early if surety is required',
                        detail:
                            'Lender appetite varies by entity, property, and credit profile.',
                    },
                    {
                        label: 'Read the suretyship terms',
                        detail:
                            'Unlimited vs limited, joint and several liability, and when it ends.',
                    },
                    {
                        label: 'Take advice before signing',
                        detail:
                            'This is legal/credit risk — not a clerical annexure.',
                    },
                    {
                        label: 'Price the personal downside',
                        detail:
                            'If you cannot bear surety risk, reconsider structure or ticket size.',
                    },
                ],
                deepDive: {
                    title: 'Surety decision frame',
                    body: 'Write: who must sign; what obligations are covered; whether it is continuing; what happens on exit/refinance.\n\nEducational warning only — obtain professional advice before accepting suretyship.',
                },
            },
            {
                title: 'Bank appetite',
                body: 'Not all credit providers treat entity borrowers equally for residential or investment stock. Some prefer natural persons; others will fund entities with stronger covenants and sureties. Product availability is an empirical question, not a right.',
                whyItMatters:
                    'Discovering after OTP that no bank will fund your entity type wastes deposit risk and timelines.',
                steps: [
                    {
                        label: 'Pre-clear with an originator',
                        detail:
                            'Ask which lenders will consider your entity + property class.',
                    },
                    {
                        label: 'Compare covenants',
                        detail:
                            'Deposit expectations, suretyships, and pricing differ.',
                    },
                    {
                        label: 'Build longer credit timelines',
                        detail:
                            'Entity assessments often exceed personal turnaround.',
                    },
                    {
                        label: 'Have a fallback structure',
                        detail:
                            'If entity funding fails, know whether personal purchase is viable — before you are locked in.',
                    },
                ],
                deepDive: {
                    title: 'Lender market check',
                    body: 'Before OTP: shortlist lenders; note deposit/surety norms; estimate days to grant; confirm conveyancer experience with entity transfers.\n\nDo not assume personal-home-loan norms apply.',
                },
            },
            {
                title: 'Tax & advice',
                body: 'Owning through an entity changes tax, accounting, and sometimes transfer duty/VAT analysis. Structure decisions should precede OTP — not follow registration surprises.',
                whyItMatters:
                    'Accountant-after-the-fact is how buyers inherit inefficient structures and unexpected tax friction.',
                steps: [
                    {
                        label: 'Speak to an accountant before offering',
                        detail:
                            'Purpose (trading, investment, owner-use) drives structure advice.',
                    },
                    {
                        label: 'Coordinate tax with conveyancer',
                        detail:
                            'VAT vs transfer duty treatment can be deal-specific.',
                    },
                    {
                        label: 'Document the intended use',
                        detail:
                            'Internal consistency helps advisors and lenders.',
                    },
                    {
                        label: 'Revisit after material changes',
                        detail:
                            'If use or shareholding changes, re-check advice.',
                    },
                ],
                deepDive: {
                    title: 'Advice-before-OTP rule',
                    body: 'Mandatory calls before entity OTP: accountant (tax/structure) + originator (credit feasibility) + conveyancer (authority and transfer path).\n\nEducational sequencing — not a substitute for formal advice.',
                },
            },
        ],
        steps: [
            { label: 'Confirm structure', detail: 'Pty Ltd, CC, or other — in writing.' },
            { label: 'Assemble corporate pack', detail: 'CIPC docs, resolutions, FICA.' },
            { label: 'Understand surety', detail: 'Who stands behind the loan personally.' },
            { label: 'Transfer with entity buyer', detail: 'Conveyancer runs entity KYC to registration.' },
        ],
        timeline: [
            { title: 'Advisory first', detail: 'Accountant + originator.', duration: 'Before offering' },
            { title: 'Credit assessment', detail: 'Entity + members.', duration: 'Longer than personal' },
            { title: 'Registration', detail: 'Entity as owner.', duration: 'Standard + complexity' },
        ],
        knowledge: [
            {
                variant: 'warning',
                title: 'Warning',
                body: 'Personal suretyship can put your own assets on the line — read it.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Ask the lender early if they even fund your entity type for this property class.',
            },
            {
                variant: 'law',
                title: 'South African law',
                body: 'Companies and close corporations have formal governance — resolutions must authorise the purchase.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Using a personal OTP template when the buyer is meant to be the company.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'What do banks often require from directors on entity bonds?',
                options: [
                    { id: 'a', label: 'Personal suretyships' },
                    { id: 'b', label: 'A playlist' },
                    { id: 'c', label: 'Nothing ever' },
                    { id: 'd', label: 'Only a nickname' },
                ],
                correctId: 'a',
                explanation: 'Suretyships are common — understand them.',
            },
            {
                kind: 'true-false',
                prompt: 'Entity purchases never need resolutions.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Authority must be documented.',
            },
            {
                kind: 'scenario',
                prompt: 'Thabo’s CC wants to buy. First call should be…',
                options: [
                    { id: 'a', label: 'Accountant + bond originator' },
                    { id: 'b', label: 'Only a furniture store' },
                    { id: 'c', label: 'Random social media poll' },
                    { id: 'd', label: 'Skip all advisors' },
                ],
                correctId: 'a',
                explanation: 'Structure and finance advice first.',
            },
        ],
    },
];

export const CATALOG_LESSONS: LessonModule[] = BLUEPRINTS.map(buildLessonFromBlueprint);
