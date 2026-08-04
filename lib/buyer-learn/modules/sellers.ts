import { buildLessonFromBlueprint, type LessonBlueprint } from '@/lib/buyer-learn/build-lesson';
import type { LessonModule } from '@/lib/buyer-learn/types';

const HUB = '/sellers';

function sellerBp(
    partial: Omit<LessonBlueprint, 'hubBasePath' | 'progressId'> & { slug: string }
): LessonBlueprint {
    return {
        ...partial,
        hubBasePath: HUB,
        progressId: `seller-${partial.slug}`,
    };
}

const BLUEPRINTS: LessonBlueprint[] = [
    sellerBp({
        slug: 'pricing-strategy',
        title: 'Pricing Your Property',
        subtitle: 'Asking price is an underwriting decision based on comparable evidence, not emotion or financing need.',
        difficulty: 'beginner',
        minutes: 12,
        xp: 120,
        badgeLabel: 'Pricing Ready',
        nextSlug: 'agent-selection',
        nextTitle: 'Choosing the Right Agent',
        nextDescription: 'Mandates, commission, and how to appoint the right selling agent.',
        personaIndex: 0,
        objectives: [
            {
                title: 'Market valuation & CMA',
                body: 'A market valuation estimates likely selling price from recent comparable sales and competing listings in the same micro-market. A Comparative Market Analysis (CMA) typically presents sold comps, current listings, local trends, and property-specific condition/features.\n\nIt is an evidence-based estimate — not a guarantee of sale price.',
            },
            {
                title: 'Value drivers',
                body: 'Price is influenced by location (amenities, access, perceived safety), size and layout, condition and capital improvements, distinctive features, and local supply/demand.\n\nUnique features support premium pricing only when buyers in that micro-market will pay for them.',
            },
            {
                title: 'Pricing strategies',
                body: 'Competitive pricing sets the asking price at or slightly below evidenced market value to maximise enquiry and competitive tension. Premium pricing sets above evidenced value and usually extends days-on-market.\n\nStrategy must match liquidity preference and evidence quality.',
            },
            {
                title: 'Pricing mistakes',
                body: 'Overpricing, emotional pricing (anchoring to what you need to clear debt), ignoring market conditions, and relying on a single valuation are the most common seller errors.\n\nMultiple independent valuations reduce anchoring bias.',
            },
        ],
        steps: [
            { label: 'Gather comps', detail: 'Collect recent sold prices and active listings of similar size/condition nearby. Prefer sold evidence over asking prices.' },
            { label: 'Adjust for differences', detail: 'Adjust for condition, upgrades, aspect, and unique features — do not treat every nearby sale as identical.' },
            { label: 'Set asking band', detail: 'Choose a competitive or premium band with an explicit walk-down rule if enquiry is weak.' },
            { label: 'Revisit with evidence', detail: 'If the listing stagnates, re-underwrite against fresh comps rather than cutting randomly.' },
        ],
        timeline: [
            { title: 'CMA & valuations', detail: 'Obtain 2–3 agent valuations / CMAs.', duration: '3–10 days' },
            { title: 'Price decision', detail: 'Set asking price and review trigger.', duration: '1–2 days' },
            { title: 'Market test', detail: 'Monitor enquiry and feedback for 2–4 weeks.', duration: 'Ongoing' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'A Comparative Market Analysis (CMA) primarily uses…',
                options: [
                    { id: 'a', label: 'Recent comparable sales and competing listings' },
                    { id: 'b', label: 'What the seller still owes on the bond' },
                    { id: 'c', label: 'National average house-price headlines only' },
                    { id: 'd', label: 'The cost of the seller’s renovations alone' },
                ],
                correctId: 'a',
                explanation: 'CMA is market-evidence based, not debt- or cost-based pricing.',
            },
            {
                kind: 'true-false',
                prompt: 'Overpricing usually shortens time on market.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Overpricing typically lengthens days-on-market and can weaken eventual sale proceeds.',
            },
        ],
    }),
    sellerBp({
        slug: 'agent-selection',
        title: 'Choosing the Right Agent',
        subtitle: 'Mandate type, commission, track record, and marketing plan determine how your listing is represented.',
        difficulty: 'beginner',
        minutes: 11,
        xp: 110,
        badgeLabel: 'Mandate Ready',
        nextSlug: 'marketing',
        nextTitle: 'Marketing Your Property',
        nextDescription: 'Photography, staging, and channels that reach qualified buyers.',
        personaIndex: 1,
        objectives: [
            {
                title: 'PPRA & professional status',
                body: 'Estate agents in South Africa must comply with Property Practitioners Regulatory Authority (PPRA) requirements to practise. Ask for verification (including Fidelity Fund Certificate where applicable) before you appoint.\n\nProfessional status is a baseline filter, not a performance guarantee.',
            },
            {
                title: 'Sole vs open mandate',
                body: 'A sole mandate typically grants one agency exclusive marketing rights for a period. An open mandate allows multiple agencies to market concurrently.\n\nSole mandates can create accountability and focused marketing; open mandates can create competition but dilute ownership of the campaign.',
            },
            {
                title: 'Commission structure',
                body: 'Agent commission is usually a percentage of selling price (plus VAT where applicable), often seller-paid under the mandate — confirm the written rate, VAT treatment, and when it becomes payable.\n\nNegotiate and record terms before you sign.',
            },
            {
                title: 'Selection criteria',
                body: 'Assess local sold track record, proposed marketing plan, communication cadence, and valuation honesty — not only the highest suggested asking price.\n\nThe highest valuation is not automatically the best appointment.',
            },
        ],
        steps: [
            { label: 'Shortlist agents', detail: 'Interview 2–3 agents with local sold evidence and a written marketing proposal.' },
            { label: 'Compare mandates', detail: 'Compare sole vs open terms, duration, notice, and commission in writing.' },
            { label: 'Verify credentials', detail: 'Confirm PPRA / FFC status and agency processes.' },
            { label: 'Appoint in writing', detail: 'Sign a clear mandate — never rely on verbal promises.' },
        ],
        timeline: [
            { title: 'Interviews', detail: 'Meet shortlisted agents.', duration: '1–2 weeks' },
            { title: 'Mandate', detail: 'Sign and start marketing.', duration: 'Same week' },
            { title: 'Review', detail: 'Assess activity against the plan.', duration: '2–4 weeks' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'A sole mandate always means the agent works for free.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Commission is usually payable under the mandate when a sale is concluded on the agreed terms — confirm the written agreement.',
            },
            {
                kind: 'mcq',
                prompt: 'Before appointing an agent you should…',
                options: [
                    { id: 'a', label: 'Verify professional credentials and compare written proposals' },
                    { id: 'b', label: 'Only pick whoever quotes the highest price' },
                    { id: 'c', label: 'Skip reading the mandate' },
                    { id: 'd', label: 'Appoint verbally with no paperwork' },
                ],
                correctId: 'a',
                explanation: 'Credentials plus written terms protect both parties.',
            },
        ],
    }),
    sellerBp({
        slug: 'marketing',
        title: 'Marketing Your Property',
        subtitle: 'Buyer demand follows presentation quality, accurate listing data, and channel reach — not listing volume alone.',
        difficulty: 'beginner',
        minutes: 10,
        xp: 100,
        badgeLabel: 'Marketing Ready',
        nextSlug: 'sale-process',
        nextTitle: 'The Selling Process',
        nextDescription: 'Offers, negotiation, conveyancing, and transfer milestones.',
        personaIndex: 2,
        objectives: [
            {
                title: 'Photography & staging',
                body: 'Professional photography and light staging reduce friction in online discovery. Clutter, poor lighting, and inaccurate room portrayal suppress enquiry.\n\nPresentation is part of pricing strategy — weak media can force price cuts later.',
            },
            {
                title: 'Listing accuracy',
                body: 'Floor area, rates/levies, parking, and material defects disclosures should be accurate. Misleading listings create failed viewings and legal risk.\n\nAccuracy builds qualified demand.',
            },
            {
                title: 'Channel mix',
                body: 'Effective campaigns combine portals, agency databases, social distribution, and targeted buyer matching — with tracking of enquiry quality.\n\nMore portals without a plan is not a strategy.',
            },
            {
                title: 'Viewing management',
                body: 'Structured viewing windows, pre-qualification questions, and feedback loops improve security and negotiation intelligence.\n\nFeedback should update price or presentation decisions.',
            },
        ],
        steps: [
            { label: 'Prep the home', detail: 'Declutter, repair obvious defects, and stage key rooms.' },
            { label: 'Shoot & copy', detail: 'Professional photos and factual listing copy.' },
            { label: 'Launch channels', detail: 'Portals, database, and targeted outreach with tracking.' },
            { label: 'Review weekly', detail: 'Enquiry volume, quality, and feedback → adjust.' },
        ],
        timeline: [
            { title: 'Prep & shoot', detail: 'Ready the asset and media.', duration: '3–10 days' },
            { title: 'Go live', detail: 'List and begin viewings.', duration: 'Week 1' },
            { title: 'Optimise', detail: 'Iterate on feedback.', duration: 'Ongoing' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Inaccurate floor area or levy figures can waste viewings and damage trust.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'Listing accuracy is part of qualified demand generation.',
            },
            {
                kind: 'mcq',
                prompt: 'Weekly marketing review should track…',
                options: [
                    { id: 'a', label: 'Enquiry quality and feedback, not only listing count' },
                    { id: 'b', label: 'How many portals exist worldwide' },
                    { id: 'c', label: 'Only the seller’s preferred Instagram filter' },
                    { id: 'd', label: 'Nothing — set and forget' },
                ],
                correctId: 'a',
                explanation: 'Feedback and enquiry quality drive adjustments.',
            },
        ],
    }),
    sellerBp({
        slug: 'sale-process',
        title: 'The Selling Process',
        subtitle: 'From offer to registration: OTP terms, suspensive conditions, conveyancing, and transfer milestones.',
        difficulty: 'intermediate',
        minutes: 12,
        xp: 120,
        badgeLabel: 'Process Fluent',
        nextSlug: 'costs',
        nextTitle: 'Selling Costs & Fees',
        nextDescription: 'Commission, bond cancellation, and cash you must budget as seller.',
        personaIndex: 0,
        objectives: [
            {
                title: 'Offer to Purchase (OTP)',
                body: 'An Offer to Purchase is a written contract proposal. Once accepted (and any formalities met), it becomes the sale agreement subject to its terms and suspensive conditions.\n\nRead dates, price, inclusions, and conditions before you sign.',
            },
            {
                title: 'Suspensive conditions',
                body: 'Common suspensive conditions include bond approval and sale of the purchaser’s property by a deadline. If a condition fails, the sale typically falls away on the agreed terms.\n\nDiary every deadline.',
            },
            {
                title: 'Conveyancing role',
                body: 'A conveyancer (transfer attorney) effects transfer of ownership and coordinates with the bond attorney where applicable. Sellers usually appoint (or agree) the transferring attorney under the OTP.\n\nRespond quickly to document requests.',
            },
            {
                title: 'Registration & occupation',
                body: 'Ownership transfers on registration in the Deeds Office. Occupation and occupational rent (if any) follow the OTP. Proceeds are distributed after clearing bond and agreed costs.\n\nAsk for a clear expected timeline — it varies by complexity.',
            },
        ],
        steps: [
            { label: 'Negotiate OTP', detail: 'Price, dates, inclusions, conditions — in writing.' },
            { label: 'Fulfil conditions', detail: 'Track bond and other suspensive deadlines.' },
            { label: 'Conveyancing pack', detail: 'IDs, clearance figures, keys, compliance certificates as required.' },
            { label: 'Register & settle', detail: 'Transfer registers; net proceeds after clearances.' },
        ],
        timeline: [
            { title: 'Offer accepted', detail: 'OTP signed.', duration: 'Day 0' },
            { title: 'Bond / conditions', detail: 'Purchaser finance and conditions.', duration: 'Often 21–45+ days' },
            { title: 'Transfer', detail: 'Conveyancing to registration.', duration: 'Often 8–12+ weeks total — varies' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'A suspensive condition in an OTP…',
                options: [
                    { id: 'a', label: 'Must usually be fulfilled by a deadline for the sale to proceed fully' },
                    { id: 'b', label: 'Is optional decoration' },
                    { id: 'c', label: 'Removes the need for a conveyancer' },
                    { id: 'd', label: 'Guarantees registration in 7 days' },
                ],
                correctId: 'a',
                explanation: 'Suspensive conditions gate the binding effect of the sale.',
            },
            {
                kind: 'true-false',
                prompt: 'Ownership typically transfers when the deed is registered, not merely when the OTP is signed.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'Registration in the Deeds Office effects transfer of ownership.',
            },
        ],
    }),
    sellerBp({
        slug: 'costs',
        title: 'Selling Costs & Fees',
        subtitle: 'Net proceeds equal sale price minus commission, bond cancellation, clearance figures, and agreed adjustments — budget them before you accept an offer.',
        difficulty: 'intermediate',
        minutes: 11,
        xp: 110,
        badgeLabel: 'Costs Clear',
        nextSlug: 'tips',
        nextTitle: 'Seller Tips & Best Practices',
        nextDescription: 'Preparation, viewings, and negotiation habits that protect value.',
        personaIndex: 3,
        objectives: [
            {
                title: 'Agent commission',
                body: 'Commission is typically calculated on the selling price (plus VAT where applicable) under the mandate. Confirm rate, VAT, and payment timing in writing.\n\nCommission is usually the largest selling cost.',
            },
            {
                title: 'Bond cancellation',
                body: 'If a mortgage bond exists, cancellation costs and outstanding balance must be settled from proceeds (or otherwise arranged). Request a cancellation figure early.\n\nUnderestimating cancellation delay is a common timeline risk.',
            },
            {
                title: 'Rates, levies & clearances',
                body: 'Municipal rates/clearance and body-corporate levy clearance (sectional title) are typically required for transfer. Special levies can appear late — ask early.\n\nClearance figures affect net cash and timing.',
            },
            {
                title: 'Net proceeds model',
                body: 'Build a net sheet: price − commission − cancellation − clearance/levy adjustments − other agreed costs = estimated net.\n\nAccept offers against net, not headline price alone.',
            },
        ],
        steps: [
            { label: 'List every cost', detail: 'Commission, VAT, cancellation, clearances, certificates.' },
            { label: 'Request figures', detail: 'Agent, bank, municipality/body corporate.' },
            { label: 'Build net sheet', detail: 'Estimate net before accepting.' },
            { label: 'Update at OTP', detail: 'Re-check figures when price/dates change.' },
        ],
        timeline: [
            { title: 'Cost map', detail: 'Draft net sheet.', duration: 'Before listing' },
            { title: 'Formal figures', detail: 'Bank and clearance requests.', duration: 'After OTP' },
            { title: 'Final account', detail: 'At registration.', duration: 'Transfer' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Sellers should budget net proceeds, not only the asking price.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'Costs and clearances reduce cash received.',
            },
            {
                kind: 'mcq',
                prompt: 'Bond cancellation figures are typically needed when…',
                options: [
                    { id: 'a', label: 'A mortgage bond is registered against the property' },
                    { id: 'b', label: 'The property has never had a bond and never will' },
                    { id: 'c', label: 'Only commercial sales' },
                    { id: 'd', label: 'Never — bonds cancel automatically with no paperwork' },
                ],
                correctId: 'a',
                explanation: 'Registered bonds require cancellation as part of transfer.',
            },
        ],
    }),
    sellerBp({
        slug: 'tips',
        title: 'Seller Tips & Best Practices',
        subtitle: 'Preparation, viewing discipline, and negotiation habits that protect sale probability and price.',
        difficulty: 'beginner',
        minutes: 10,
        xp: 100,
        badgeLabel: 'Seller Habits',
        nextSlug: 'selling-deceased-estate',
        nextTitle: 'Selling a Deceased Estate',
        nextDescription: 'Executor authority, Master’s Office, and timelines.',
        personaIndex: 1,
        objectives: [
            {
                title: 'Home preparation',
                body: 'Repair safety/compliance issues, declutter, and complete small high-ROI fixes before photography.\n\nDeferred defects become buyer leverage.',
            },
            {
                title: 'Viewing discipline',
                body: 'Secure valuables, brief occupants, and gather structured feedback after each viewing.\n\nFeedback informs price and presentation adjustments.',
            },
            {
                title: 'Negotiation posture',
                body: 'Know your walk-away net price and non-negotiables before offers arrive.\n\nEmotion without a net floor destroys outcomes.',
            },
            {
                title: 'Document readiness',
                body: 'Keep ID, compliance certificates, and levy/rates info ready for conveyancing.\n\nSlow documents slow transfer.',
            },
        ],
        steps: [
            { label: 'Prep checklist', detail: 'Repairs, declutter, certificates.' },
            { label: 'Viewing protocol', detail: 'Security, feedback log.' },
            { label: 'Net floor', detail: 'Write minimum acceptable net.' },
            { label: 'Respond fast', detail: 'OTP and conveyancing requests within agreed SLAs.' },
        ],
        timeline: [
            { title: 'Prep', detail: 'Ready the home.', duration: '1–3 weeks' },
            { title: 'Market', detail: 'List and view.', duration: 'Ongoing' },
            { title: 'Negotiate', detail: 'Offers to OTP.', duration: 'As offers arrive' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Knowing your minimum acceptable net before offers arrive improves negotiation discipline.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'A pre-set net floor reduces emotional over/under-reacting.',
            },
            {
                kind: 'mcq',
                prompt: 'Structured viewing feedback should…',
                options: [
                    { id: 'a', label: 'Inform price and presentation decisions' },
                    { id: 'b', label: 'Be ignored once the listing is live' },
                    { id: 'c', label: 'Replace the need for an OTP' },
                    { id: 'd', label: 'Only include compliments' },
                ],
                correctId: 'a',
                explanation: 'Feedback is market data.',
            },
        ],
    }),
    sellerBp({
        slug: 'selling-deceased-estate',
        title: 'Selling a Deceased Estate',
        subtitle: 'Deceased-estate sales require executor authority, Master’s Office processes, and longer conveyancing timelines.',
        difficulty: 'intermediate',
        minutes: 12,
        xp: 120,
        badgeLabel: 'Estate Aware',
        nextSlug: 'understanding-trusts',
        nextTitle: 'Understanding Trusts',
        nextDescription: 'Trustee authority and resolutions when selling trust property.',
        personaIndex: 2,
        objectives: [
            {
                title: 'Executor authority',
                body: 'Only a duly appointed executor (or authorised representative) can bind the estate to sell. Buyers and conveyancers will require proof of authority.\n\nActing without authority creates invalid or delayed transactions.',
            },
            {
                title: 'Master’s Office oversight',
                body: 'Deceased estates are administered under the Administration of Estates framework with Master’s Office oversight. Timelines often exceed ordinary private sales.\n\nSet buyer expectations early.',
            },
            {
                title: 'Contract protections',
                body: 'OTPs should reflect estate realities: authority conditions, extended dates, and clear occupation arrangements.\n\nStandard rush timelines often fail.',
            },
            {
                title: 'Due diligence pack',
                body: 'Title, debts, rates/levies, and occupation status must be clarified for conveyancing.\n\nEarly document gathering reduces abortive costs.',
            },
        ],
        steps: [
            { label: 'Confirm authority', detail: 'Letters of executorship / authority documents.' },
            { label: 'Brief the market', detail: 'Disclose estate process and realistic timelines.' },
            { label: 'Tailor OTP', detail: 'Conditions and dates suited to estate transfer.' },
            { label: 'Conveyancing early', detail: 'Engage an experienced estate conveyancer.' },
        ],
        timeline: [
            { title: 'Authority', detail: 'Confirm executor status.', duration: 'Before listing' },
            { title: 'Sale', detail: 'Offer to accepted OTP.', duration: 'Variable' },
            { title: 'Transfer', detail: 'Often longer than standard.', duration: 'Months — case dependent' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Any family member may sell deceased-estate property without executor appointment.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Sale requires proper authority — typically the appointed executor.',
            },
            {
                kind: 'mcq',
                prompt: 'Deceased-estate transfers often take longer because…',
                options: [
                    { id: 'a', label: 'Master’s Office and estate administration steps apply' },
                    { id: 'b', label: 'Deeds Offices refuse all estate transfers' },
                    { id: 'c', label: 'OTPs are illegal for estates' },
                    { id: 'd', label: 'Commission cannot be charged' },
                ],
                correctId: 'a',
                explanation: 'Estate administration adds process and oversight.',
            },
        ],
    }),
    sellerBp({
        slug: 'understanding-trusts',
        title: 'Understanding Trusts',
        subtitle: 'Trust property sales require trustee authority, resolutions, and documents conveyancers will insist on before transfer.',
        difficulty: 'intermediate',
        minutes: 11,
        xp: 110,
        badgeLabel: 'Trust Ready',
        nextSlug: 'first-time-seller-mistakes',
        nextTitle: 'Mistakes First-Time Sellers Make',
        nextDescription: 'Overpricing, weak prep, and other predictable errors.',
        personaIndex: 3,
        objectives: [
            {
                title: 'Trustees vs beneficiaries',
                body: 'Trustees (not beneficiaries alone) generally hold authority to deal with trust assets under the trust instrument and applicable law.\n\nConfirm who may sign and bind the trust.',
            },
            {
                title: 'Resolutions & documents',
                body: 'Conveyancers typically require trustee resolutions, trust deed extracts, and identity/FICA packs for trustees.\n\nIncomplete packs stall transfer.',
            },
            {
                title: 'Bond cancellation on trust assets',
                body: 'If a bond is registered, cancellation follows the same need for proper authority and figures.\n\nCoordinate bank and trustees early.',
            },
            {
                title: 'Buyer due diligence',
                body: 'Buyers will scrutinise authority more closely than a natural-person sale. Transparency reduces failed OTPs.\n\nDisclose structure early in marketing.',
            },
        ],
        steps: [
            { label: 'Read the trust deed', detail: 'Who may sell, signing rules, restrictions.' },
            { label: 'Pass resolutions', detail: 'Formal trustee authority to sell.' },
            { label: 'Assemble pack', detail: 'Deed extracts, IDs, FICA, bond figures.' },
            { label: 'Brief conveyancer', detail: 'Use counsel experienced in trust transfers.' },
        ],
        timeline: [
            { title: 'Authority pack', detail: 'Resolutions and documents.', duration: 'Before/at listing' },
            { title: 'OTP', detail: 'Sale agreement.', duration: 'When offer accepted' },
            { title: 'Transfer', detail: 'Trust conveyancing.', duration: 'Often longer — varies' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Beneficiaries can usually sell trust property without trustee authority.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Trustees generally hold dealing authority under the trust instrument.',
            },
            {
                kind: 'mcq',
                prompt: 'Conveyancers commonly require…',
                options: [
                    { id: 'a', label: 'Trustee resolutions and trust documentation' },
                    { id: 'b', label: 'Only a WhatsApp approval' },
                    { id: 'c', label: 'No identity documents' },
                    { id: 'd', label: 'Verbal consent from one beneficiary' },
                ],
                correctId: 'a',
                explanation: 'Formal trust documents underpin a valid transfer.',
            },
        ],
    }),
    sellerBp({
        slug: 'first-time-seller-mistakes',
        title: 'Mistakes First-Time Sellers Make',
        subtitle: 'Overpricing, weak preparation, and poor media are the predictable errors that extend days-on-market.',
        difficulty: 'beginner',
        minutes: 10,
        xp: 100,
        badgeLabel: 'Mistake Aware',
        nextSlug: 'selling-pitfalls',
        nextTitle: 'What to Avoid When Selling',
        nextDescription: 'Defects disclosure, staging, and bond clearance traps.',
        personaIndex: 0,
        objectives: [
            {
                title: 'Overpricing',
                body: 'Anchoring to an aspirational price without comp support reduces enquiry and can force larger cuts later.\n\nEvidence-based asking prices protect net outcomes.',
            },
            {
                title: 'Skipping preparation',
                body: 'Listing before repairs and decluttering transfers negotiation power to buyers.\n\nPrep is part of pricing.',
            },
            {
                title: 'Weak photography',
                body: 'Phone snaps in poor light suppress portal conversion.\n\nMedia quality is demand infrastructure.',
            },
            {
                title: 'Ignoring feedback',
                body: 'Continuing unchanged after repeated ‘too expensive / needs work’ feedback wastes marketing spend.\n\nFeedback is a decision input.',
            },
        ],
        steps: [
            { label: 'Price from comps', detail: 'Not from hope.' },
            { label: 'Prep before shoot', detail: 'Repairs and declutter first.' },
            { label: 'Invest in media', detail: 'Professional photography.' },
            { label: 'Act on feedback', detail: 'Adjust price or presentation.' },
        ],
        timeline: [
            { title: 'Correct course', detail: 'If stagnating, re-underwrite in week 2–4.', duration: 'Ongoing' },
            { title: 'Re-launch', detail: 'Fresh media/price if needed.', duration: 'As required' },
            { title: 'Close', detail: 'OTP on evidence-aligned terms.', duration: 'When ready' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'The highest suggested valuation is always the best listing strategy.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Unsupported asking prices often harm sale probability and net proceeds.',
            },
            {
                kind: 'mcq',
                prompt: 'A common first-time seller mistake is…',
                options: [
                    { id: 'a', label: 'Listing before preparation and overpricing without comps' },
                    { id: 'b', label: 'Getting multiple valuations' },
                    { id: 'c', label: 'Using accurate listing data' },
                    { id: 'd', label: 'Responding quickly to conveyancers' },
                ],
                correctId: 'a',
                explanation: 'Prep and evidence-based price matter.',
            },
        ],
    }),
    sellerBp({
        slug: 'selling-pitfalls',
        title: 'What to Avoid When Selling',
        subtitle: 'Non-disclosure, weak staging, and late bond-clearance work create delay, disputes, and aborted sales.',
        difficulty: 'beginner',
        minutes: 10,
        xp: 100,
        badgeLabel: 'Pitfall Proof',
        nextSlug: 'selling-property-under-business',
        nextTitle: 'Selling a Property Under a Business',
        nextDescription: 'Company/CC resolutions, authority, and tax awareness.',
        personaIndex: 1,
        objectives: [
            {
                title: 'Defects disclosure',
                body: 'Material defects should be disclosed as required by law and good practice. Concealment risks disputes, claims, and collapsed sales.\n\nTransparency is risk management.',
            },
            {
                title: 'Staging & presentation',
                body: 'Neglecting presentation invites low offers. Fix visible issues before blame the market.\n\nPresentation and price interact.',
            },
            {
                title: 'Bond clearance timing',
                body: 'Start cancellation/clearance processes promptly after OTP. Late figures delay registration.\n\nDiary bank and municipal/levy requests.',
            },
            {
                title: 'Unrealistic timelines',
                body: 'Promising buyers a rush transfer you cannot control damages trust.\n\nCommunicate ranges, not fantasies.',
            },
        ],
        steps: [
            { label: 'Disclose properly', detail: 'Known material issues — with advice where needed.' },
            { label: 'Stage & repair', detail: 'Visible issues before go-live.' },
            { label: 'Start clearances early', detail: 'Bank, rates, levies after OTP.' },
            { label: 'Set timeline ranges', detail: 'Honest conveyancing expectations.' },
        ],
        timeline: [
            { title: 'Pre-list', detail: 'Disclosure and prep.', duration: 'Before live' },
            { title: 'Post-OTP', detail: 'Clearances and cancellation.', duration: 'Immediately' },
            { title: 'To register', detail: 'Conveyancing milestones.', duration: 'Weeks–months' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Hiding known material defects is a sound negotiation tactic.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Non-disclosure creates legal and transactional risk.',
            },
            {
                kind: 'mcq',
                prompt: 'Bond cancellation figures should be requested…',
                options: [
                    { id: 'a', label: 'Promptly after a viable OTP, not at the last minute' },
                    { id: 'b', label: 'Only after registration' },
                    { id: 'c', label: 'Never if there is a bond' },
                    { id: 'd', label: 'Only by the buyer’s cousin' },
                ],
                correctId: 'a',
                explanation: 'Early clearance work protects the timeline.',
            },
        ],
    }),
    sellerBp({
        slug: 'selling-property-under-business',
        title: 'Selling a Property Under a Business',
        subtitle: 'Company or close corporation sales need corporate authority, resolutions, and awareness of tax consequences — get professional advice.',
        difficulty: 'advanced',
        minutes: 12,
        xp: 120,
        badgeLabel: 'Entity Seller',
        nextSlug: 'pricing-strategy',
        nextTitle: 'Pricing Your Property',
        nextDescription: 'Loop back to pricing with a clearer cost and authority picture.',
        personaIndex: 4,
        objectives: [
            {
                title: 'Corporate authority',
                body: 'A company or close corporation can sell only through properly authorised organs (e.g. directors/members) under MOI/association and applicable company law.\n\nConfirm signing authority before marketing.',
            },
            {
                title: 'Resolutions',
                body: 'Board/member resolutions authorising sale and signatories are typically required by conveyancers and counterparties.\n\nUnsigned or informal approvals are insufficient.',
            },
            {
                title: 'Bond & securities',
                body: 'If the property secures debt, cancellation and bank requirements follow — often with additional corporate FICA.\n\nStart bank engagement early.',
            },
            {
                title: 'Tax awareness',
                body: 'Disposals by companies can trigger tax consequences (including CGT and other corporate tax considerations). This module is educational — obtain registered tax advice before you price or accept.\n\nStructure and timing affect net proceeds.',
            },
        ],
        steps: [
            { label: 'Confirm entity & MOI', detail: 'Who may authorise a sale.' },
            { label: 'Pass resolutions', detail: 'Formal authority to sell and sign.' },
            { label: 'FICA & bank pack', detail: 'Corporate identity and bond figures.' },
            { label: 'Tax advice', detail: 'Model net after professional input.' },
        ],
        timeline: [
            { title: 'Authority', detail: 'Resolutions ready.', duration: 'Before listing' },
            { title: 'Sale', detail: 'OTP with correct party names.', duration: 'At offer' },
            { title: 'Transfer & tax', detail: 'Conveyancing plus tax filings as advised.', duration: 'Post-sale' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep decisions evidence-based and documented — mandates, OTPs, and net sheets beat memory.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Optimising for headline price while ignoring net proceeds, authority, or timeline reality.',
            },
            {
                variant: 'takeaway',
                title: 'Takeaway',
                body: 'Process discipline protects sale probability and net cash.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'A company property can be sold on a personal OTP in a director’s own name without corporate authority.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'The correct legal seller and authority must appear in the transaction documents.',
            },
            {
                kind: 'mcq',
                prompt: 'Before accepting an offer on company-owned property you should…',
                options: [
                    { id: 'a', label: 'Confirm authority, resolutions, and get tax advice on net proceeds' },
                    { id: 'b', label: 'Ignore the MOI' },
                    { id: 'c', label: 'Skip FICA because it is a company' },
                    { id: 'd', label: 'Use only a verbal member chat as authority' },
                ],
                correctId: 'a',
                explanation: 'Authority and tax shape a valid, economic sale.',
            },
        ],
    })

];

export const SELLER_LESSONS: LessonModule[] = BLUEPRINTS.map(buildLessonFromBlueprint);

export function getSellerLesson(slug: string): LessonModule | null {
    return SELLER_LESSONS.find((l) => l.meta.slug === slug) || null;
}

export const SELLER_LEARN_ORDER = BLUEPRINTS.map((b) => b.slug);
