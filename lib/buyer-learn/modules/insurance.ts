import type { LessonBlueprint } from '@/lib/buyer-learn/build-lesson';

type HubConfig = {
    hubBasePath?: string;
    progressPrefix?: string;
};

function withHub(
    bp: Omit<LessonBlueprint, 'hubBasePath' | 'progressId'> & { slug: string },
    hub: HubConfig
): LessonBlueprint {
    return {
        ...bp,
        ...(hub.hubBasePath ? { hubBasePath: hub.hubBasePath } : {}),
        ...(hub.progressPrefix ? { progressId: `${hub.progressPrefix}${bp.slug}` } : {}),
    };
}

/** Shared educational insurance modules — persona copy varies by hub. */
function homeInsuranceBp(
    hub: HubConfig,
    copy: { title: string; subtitle: string; nextSlug: string; nextTitle: string; nextDescription: string }
): LessonBlueprint {
    return withHub(
        {
            slug: 'home-insurance',
            title: copy.title,
            subtitle: copy.subtitle,
            difficulty: 'beginner',
            minutes: 12,
            xp: 110,
            badgeLabel: 'Cover Basics',
            nextSlug: copy.nextSlug,
            nextTitle: copy.nextTitle,
            nextDescription: copy.nextDescription,
            personaIndex: hub.progressPrefix === 'investor-' ? 4 : 0,
            objectives: [
                {
                    title: 'What home insurance is',
                    body: 'Home insurance is a contract that pays (or reinstates) for covered loss or damage to a property — fire, storm, flood (where included), burst geysers, and similar insured events — subject to policy wording, excesses, and exclusions.\n\nIt is not a guarantee that every loss is paid. Cover lives in the schedule and wording, not in marketing slogans.',
                },
                {
                    title: 'Building vs contents',
                    body: 'Building (or structure) insurance covers the immovable property: walls, roof, fixtures, and usually outbuildings as defined. Contents insurance covers movable household goods — furniture, appliances, clothing, electronics.\n\nOn a sectional-title unit, the body corporate often insures the building; owners still need contents (and sometimes improvements) cover. Confirm who insures what before transfer.',
                },
                {
                    title: 'Bond and bank requirements',
                    body: 'When a home loan is registered, lenders typically require continuous building insurance with the bank noted as interested party / loss payee until the bond is cancelled. Lapse of cover can breach bond conditions.\n\nContents and life/disability cover are separate decisions — useful, but not the same product as building insurance.',
                },
                {
                    title: 'Sum insured & underinsurance',
                    body: 'The sum insured should reflect rebuild / replacement cost, not market value or purchase price. Underinsurance triggers average: a claim can be paid only in proportion to how underinsured you were.\n\nRevisit sums after renovations, load-shedding upgrades, or material cost inflation.',
                },
            ],
            steps: [
                {
                    label: 'Separate building and contents',
                    detail:
                        'Write two lists: (1) structure and fixtures the bank or body corporate must cover, and (2) movable goods you want contents cover for. Sectional-title buyers should ask the managing agent what the body corporate policy includes before assuming “the complex is insured” means their couch is covered.\n\nKeep the lists with your transfer pack so you can compare them to the policy schedule wording.',
                },
                {
                    label: 'Confirm sectional-title rules',
                    detail:
                        'Request written confirmation of the body corporate’s building insurer, sum insured approach, and excesses. Ask whether owner improvements (e.g. enclosed balconies, upgraded kitchens) need separate scheduling.\n\nIf the answer is vague, escalate to the trustees or managing agent in writing — verbal hallway answers are not proof of cover.',
                },
                {
                    label: 'Set rebuild sum insured',
                    detail:
                        'Ask for a rebuild / replacement estimate, not a market-value guess. Purchase price includes land and location premium; insurance needs the cost to reinstate the structure after an insured event.\n\nUnderinsurance can trigger average, so revisit the sum after renovations or major cost inflation.',
                },
                {
                    label: 'Note the bank on the policy',
                    detail:
                        'If a bond will be registered, ensure the lender is recorded as interested party / loss payee as required. Conveyancers and banks routinely ask for proof of cover before or at registration.\n\nDiary the debit-order date — an unpaid premium can lapse cover and breach bond conditions.',
                },
            ],
            timeline: [
                { title: 'Quote early', detail: 'Get building cover quotes while finance is in progress.', duration: 'Before transfer' },
                { title: 'Inception at risk', detail: 'Cover must be live when the bank requires it — often from registration or occupation.', duration: 'Transfer week' },
                { title: 'Annual review', detail: 'Update sums, excesses, and risk address after changes.', duration: 'Yearly' },
            ],
            knowledge: [
                {
                    variant: 'definition',
                    title: 'Sum insured',
                    body: 'The maximum the insurer will consider for a covered loss under that section — subject to average, excess, and wording.',
                },
                {
                    variant: 'mistake',
                    title: 'Common mistake',
                    body: 'Insuring for purchase price or municipal value instead of rebuild cost.',
                },
                {
                    variant: 'warning',
                    title: 'Warning',
                    body: 'Letting building cover lapse while a bond is live can breach your loan agreement.',
                },
                {
                    variant: 'tip',
                    title: 'Pro tip',
                    body: 'Keep policy schedules with your transfer pack — conveyancers and banks ask for proof of cover.',
                },
            ],
            quiz: [
                {
                    kind: 'mcq',
                    prompt: 'Building insurance is primarily meant to cover…',
                    options: [
                        { id: 'a', label: 'The structure and fixed parts of the property (as defined in the policy)' },
                        { id: 'b', label: 'Only your television and clothing' },
                        { id: 'c', label: 'Your neighbour’s bond instalment' },
                        { id: 'd', label: 'Municipal rates forever' },
                    ],
                    correctId: 'a',
                    explanation: 'Building cover targets the structure; contents is a separate section or policy.',
                },
                {
                    kind: 'true-false',
                    prompt: 'Purchase price is always the correct building sum insured.',
                    options: [
                        { id: 'true', label: 'True' },
                        { id: 'false', label: 'False' },
                    ],
                    correctId: 'false',
                    explanation: 'Rebuild / replacement cost drives sum insured — not market price.',
                },
                {
                    kind: 'mcq',
                    prompt: 'On many sectional-title purchases, the building is often insured by…',
                    options: [
                        { id: 'a', label: 'The body corporate (confirm in writing)' },
                        { id: 'b', label: 'The estate agent personally' },
                        { id: 'c', label: 'No one — insurance is illegal in complexes' },
                        { id: 'd', label: 'Only the previous tenant' },
                    ],
                    correctId: 'a',
                    explanation: 'Body corporate building cover is common — still verify scope and your contents gap.',
                },
            ],
        },
        hub
    );
}

function insuranceTypesBp(
    hub: HubConfig,
    copy: { title: string; subtitle: string; nextSlug: string; nextTitle: string; nextDescription: string; typesBody: string }
): LessonBlueprint {
    return withHub(
        {
            slug: 'insurance-types',
            title: copy.title,
            subtitle: copy.subtitle,
            difficulty: 'beginner',
            minutes: 11,
            xp: 105,
            badgeLabel: 'Cover Map',
            nextSlug: copy.nextSlug,
            nextTitle: copy.nextTitle,
            nextDescription: copy.nextDescription,
            personaIndex: hub.progressPrefix === 'investor-' ? 4 : 0,
            objectives: [
                {
                    title: 'Building / homeowners',
                    body: 'Homeowners or building insurance responds to insured damage to the structure. Excesses, flood/subsidence exclusions, and geyser limits matter as much as the premium.\n\nAlways read the schedule for the risk address, sum insured, and interested parties.',
                },
                {
                    title: 'Household contents',
                    body: 'Contents cover replaces or repairs movable goods after insured events (theft, fire, storm, etc.). High-value items may need specified listing. Security conditions (alarms, burglar bars) can be warranties — breach them and claims fail.',
                },
                {
                    title: 'Life, disability & retrenchment (bond protection)',
                    body: copy.typesBody,
                },
                {
                    title: 'Liability & special risks',
                    body: 'Personal liability (often bundled) can respond if you are legally liable for injury or damage to others. Landlords need landlord / loss-of-rent sections. Builders’ risk, SASRIA (political riot where applicable), and all-risks for portable items are separate add-ons — not automatic.\n\nMap products to risks; do not assume one policy covers every scenario.',
                },
            ],
            steps: [
                {
                    label: 'List your risks',
                    detail:
                        'Map risks in plain language: structure damage, contents theft/fire, death/disability affecting the bond, liability to visitors or neighbours, tenant damage, and vacancy. Different risks usually need different policy sections — bundling names can hide gaps.\n\nInvestors and landlords should add loss-of-rent and malicious-damage questions explicitly.',
                },
                {
                    label: 'Match products',
                    detail:
                        'For each risk, name the product that responds: building/homeowners, contents, credit life/bond protection, personal or landlord liability, SASRIA where relevant, and all-risks for portable items. If a risk has no product, you are self-insuring it — which only works if cash reserves can fund the worst case.\n\nAsk the intermediary to show the schedule line that covers each risk.',
                },
                {
                    label: 'Check warranties',
                    detail:
                        'Security and occupancy conditions are common claim killers: alarms that must be armed, burglar bars, forced-entry definitions, and vacancy limits. Read them before you bind, then test whether your real lifestyle meets them.\n\nA cheaper premium that you will breach every week is not cheaper after a declined claim.',
                },
                {
                    label: 'Review annually',
                    detail:
                        'Life events change cover needs: new appliances, renovations, a home office, short-term letting, or a bond balance that has fallen. Set a yearly calendar reminder to update sums insured and disclose use changes.\n\nMid-term changes should be notified when they happen — not only at renewal.',
                },
            ],
            timeline: [
                { title: 'Structure first', detail: 'Building cover for bonded or owned property.', duration: 'Mandatory with most bonds' },
                { title: 'Contents next', detail: 'Quote contents at occupation.', duration: 'Move-in week' },
                { title: 'Protection layer', detail: 'Consider life/disability aligned to debt.', duration: 'With bond or annually' },
            ],
            knowledge: [
                {
                    variant: 'myth-fact',
                    title: 'Myth vs fact',
                    myth: 'One “home insurance” product covers building, contents, life, and tenants automatically.',
                    fact: 'These are different sections or policies — confirm each risk is actually scheduled.',
                },
                {
                    variant: 'tip',
                    title: 'Pro tip',
                    body: 'Ask for a one-page cover map: risk → product → sum → excess → key exclusion.',
                },
                {
                    variant: 'law',
                    title: 'South African context',
                    body: 'Insurance is regulated; advice should come from appropriately licensed intermediaries — PropReady educates; it does not sell policies.',
                },
            ],
            quiz: [
                {
                    kind: 'mcq',
                    prompt: 'Contents insurance mainly covers…',
                    options: [
                        { id: 'a', label: 'Movable household goods (as defined)' },
                        { id: 'b', label: 'Only the roof tiles' },
                        { id: 'c', label: 'Transfer duty' },
                        { id: 'd', label: 'Agent commission' },
                    ],
                    correctId: 'a',
                    explanation: 'Contents = movables; building = structure.',
                },
                {
                    kind: 'true-false',
                    prompt: 'Bond protection / life cover replaces the need for building insurance.',
                    options: [
                        { id: 'true', label: 'True' },
                        { id: 'false', label: 'False' },
                    ],
                    correctId: 'false',
                    explanation: 'Life/disability and building insurance address different risks.',
                },
                {
                    kind: 'scenario',
                    prompt: 'A geyser bursts and damages ceilings and a couch. Which covers are typically relevant?',
                    options: [
                        { id: 'a', label: 'Building for the structure/geyser; contents for the couch — subject to wording' },
                        { id: 'b', label: 'Only life insurance' },
                        { id: 'c', label: 'Only FLISP' },
                        { id: 'd', label: 'Nothing — geysers are never insured' },
                    ],
                    correctId: 'a',
                    explanation: 'Different assets fall under different sections; always check excesses and limits.',
                },
            ],
        },
        hub
    );
}

function whyInsuranceBp(
    hub: HubConfig,
    copy: { title: string; subtitle: string; nextSlug: string; nextTitle: string; nextDescription: string; whyBody: string }
): LessonBlueprint {
    return withHub(
        {
            slug: 'why-insurance-matters',
            title: copy.title,
            subtitle: copy.subtitle,
            difficulty: 'beginner',
            minutes: 10,
            xp: 95,
            badgeLabel: 'Risk Aware',
            nextSlug: copy.nextSlug,
            nextTitle: copy.nextTitle,
            nextDescription: copy.nextDescription,
            personaIndex: hub.progressPrefix === 'investor-' ? 5 : 1,
            objectives: [
                {
                    title: 'Insurance transfers catastrophic risk',
                    body: 'A single fire, flood, or major theft can wipe out years of savings and equity. Insurance does not prevent loss — it stops one event from becoming financial ruin when the claim is valid and cover is adequate.\n\nPremium is a planned cost; uninsured rebuild is an unplanned crisis.',
                },
                {
                    title: 'Lenders and counterparties require it',
                    body: copy.whyBody,
                },
                {
                    title: 'Cash-flow and sleep-at-night',
                    body: 'Knowing excesses and what is covered lets you budget for small shocks and reserve insurance for large ones. Without cover, every storm season becomes a balance-sheet threat.\n\nPair insurance with an emergency fund — excesses and rejected claims still need cash.',
                },
                {
                    title: 'Community and neighbour effects',
                    body: 'In complexes, inadequate building cover can leave all owners exposed through special levies after a major event. On freestanding properties, underinsurance can leave you unable to reinstate — and still owing the bank.\n\nInsurance is part of responsible ownership, not optional decoration.',
                },
            ],
            steps: [
                {
                    label: 'Name the catastrophe',
                    detail:
                        'Ask: which single event in the next twelve months would you not financially survive — fire, flood, major theft, or liability claim? If the answer is “any serious building loss,” you are not self-insured; you are exposed.\n\nWrite the rebuild/replacement order of magnitude next to your emergency fund so the gap is visible.',
                },
                {
                    label: 'Price the premium vs rebuild',
                    detail:
                        'Compare a year of premium to the cost of rebuilding or replacing contents. Premiums are planned cash flow; uninsured reinstatement is an unplanned crisis that can run while the bond, levies, and rates continue.\n\nThis is budgeting maths, not fear marketing.',
                },
                {
                    label: 'Meet bond conditions',
                    detail:
                        'If a mortgage is registered, treat continuous building cover as a loan condition, not a lifestyle optional. Lenders require cover because the property is their security.\n\nAsk your originator or bank what proof they need and when — then diary renewal and debit-order dates.',
                },
                {
                    label: 'Document proof',
                    detail:
                        'Store schedules, payment confirmations, and broker contacts where you can retrieve them during transfer or after a claim. Conveyancers and banks ask for proof at predictable milestones.\n\nCloud folder + offline copy beats hunting WhatsApp threads after a storm.',
                },
            ],
            timeline: [
                { title: 'Before offer', detail: 'Understand insurance as a holding cost in affordability.', duration: 'Planning' },
                { title: 'Before registration', detail: 'Bind required cover.', duration: 'Finance & transfer' },
                { title: 'Ownership', detail: 'Keep premiums paid and sums current.', duration: 'Ongoing' },
            ],
            knowledge: [
                {
                    variant: 'takeaway',
                    title: 'Takeaway',
                    body: 'Insurance is how you keep a house a home after a disaster — not how you avoid all costs.',
                },
                {
                    variant: 'numbers',
                    title: 'Numbers mindset',
                    body: 'If rebuild cost is R1.5m and you have R80k savings, uninsured structural loss is not “self-insured” — it is under-reserved.',
                },
                {
                    variant: 'warning',
                    title: 'Warning',
                    body: 'Skipping cover to “save” premium is often the most expensive budget cut you can make.',
                },
            ],
            quiz: [
                {
                    kind: 'true-false',
                    prompt: 'Insurance prevents fires and floods from happening.',
                    options: [
                        { id: 'true', label: 'True' },
                        { id: 'false', label: 'False' },
                    ],
                    correctId: 'false',
                    explanation: 'Insurance responds financially to covered events — it does not prevent them.',
                },
                {
                    kind: 'mcq',
                    prompt: 'Why do banks usually insist on building insurance for bonded homes?',
                    options: [
                        { id: 'a', label: 'To protect the security behind the loan if the property is damaged' },
                        { id: 'b', label: 'To replace your need for a deposit' },
                        { id: 'c', label: 'Because rates clearances require it' },
                        { id: 'd', label: 'To pay the estate agent' },
                    ],
                    correctId: 'a',
                    explanation: 'The property secures the loan — lenders require it to stay insurable and reinstatable.',
                },
            ],
        },
        hub
    );
}

function choosingInsurerBp(
    hub: HubConfig,
    copy: { title: string; subtitle: string; nextSlug: string; nextTitle: string; nextDescription: string; chooseBody: string }
): LessonBlueprint {
    return withHub(
        {
            slug: 'choosing-an-insurer',
            title: copy.title,
            subtitle: copy.subtitle,
            difficulty: 'intermediate',
            minutes: 12,
            xp: 115,
            badgeLabel: 'Insurer Ready',
            nextSlug: copy.nextSlug,
            nextTitle: copy.nextTitle,
            nextDescription: copy.nextDescription,
            personaIndex: hub.progressPrefix === 'investor-' ? 5 : 2,
            objectives: [
                {
                    title: 'Compare more than premium',
                    body: 'The cheapest premium often hides high excesses, narrow flood/subsidence cover, geyser limits, or harsh security warranties. Compare sum insured, excess, key exclusions, claim routes, and whether your risk address is acceptable.\n\nA low premium that does not pay is not a bargain.',
                },
                {
                    title: 'Use licensed advice',
                    body: copy.chooseBody,
                },
                {
                    title: 'Disclose honestly',
                    body: 'Non-disclosure of prior claims, security, occupancy, business use, or renovations can void cover. Tell the truth on applications and mid-term changes (e.g. Airbnb, home business, vacant for months).\n\nInsurers underwrite the risk you describe — not the risk you wish you had.',
                },
                {
                    title: 'Claims service & proof habits',
                    body: 'Ask how claims are reported, typical timelines, and what evidence is needed (photos, invoices, police case numbers). Keep a simple inventory of high-value contents with receipts.\n\nGood records speed valid claims; poor records slow or shrink them.',
                },
            ],
            steps: [
                {
                    label: 'Gather risk facts',
                    detail:
                        'Before requesting quotes, assemble risk address, rebuild estimate, security features, occupancy (owner-occupied, tenanted, vacant), claims history, and any business or short-term letting use. Incomplete facts produce cheap but invalid comparisons.\n\nHonest disclosure protects claims later.',
                },
                {
                    label: 'Get 2–3 comparable quotes',
                    detail:
                        'Ask each intermediary to quote the same sums insured and similar excesses. If one quote is far cheaper, hunt the exclusion, geyser limit, flood wording, or warranty that created the gap.\n\nLike-for-like schedules beat premium-only shopping.',
                },
                {
                    label: 'Read exclusions aloud',
                    detail:
                        'Review flood, subsidence, theft conditions, geyser limits, and vacancy clauses out loud with whoever will live with the risk. If you do not understand a clause, ask for plain-language confirmation in writing.\n\nUnreadable wording is not “fine print you can ignore”.',
                },
                {
                    label: 'Bind with bank details',
                    detail:
                        'Confirm inception date, debit order, and interested-party wording for the lender. Mis-typed addresses and missing bank notations cause transfer delays and claim friction.\n\nKeep the schedule PDF with your conveyancing pack the same day you bind.',
                },
            ],
            timeline: [
                { title: 'Quote window', detail: 'Parallel quotes while bond is processing.', duration: '1–2 weeks' },
                { title: 'Choose & bind', detail: 'Select cover that matches bank + your risk.', duration: '1–3 days' },
                { title: '30-day review', detail: 'Confirm schedule, debit order, and documents filed.', duration: 'First month' },
            ],
            knowledge: [
                {
                    variant: 'tip',
                    title: 'Pro tip',
                    body: 'Ask: “What would make this claim fail?” — then fix those conditions before you need to claim.',
                },
                {
                    variant: 'mistake',
                    title: 'Common mistake',
                    body: 'Switching insurer for R30/month without checking whether flood or geyser cover got worse.',
                },
                {
                    variant: 'definition',
                    title: 'Excess',
                    body: 'The first amount you pay on a valid claim. Higher excess usually lowers premium — and raises cash needed at claim time.',
                },
            ],
            quiz: [
                {
                    kind: 'mcq',
                    prompt: 'When comparing insurers, you should primarily match…',
                    options: [
                        { id: 'a', label: 'Sums insured, excesses, and key exclusions — not premium alone' },
                        { id: 'b', label: 'Only the brand colour of the app' },
                        { id: 'c', label: 'Whoever answers the phone first' },
                        { id: 'd', label: 'The highest excess with no questions asked' },
                    ],
                    correctId: 'a',
                    explanation: 'Like-for-like comparison is the only fair premium comparison.',
                },
                {
                    kind: 'true-false',
                    prompt: 'You should disclose home-business or short-term letting use to your insurer.',
                    options: [
                        { id: 'true', label: 'True' },
                        { id: 'false', label: 'False' },
                    ],
                    correctId: 'true',
                    explanation: 'Use changes risk — non-disclosure can void claims.',
                },
                {
                    kind: 'mcq',
                    prompt: 'A licensed intermediary helps you…',
                    options: [
                        { id: 'a', label: 'Compare appropriate products and explain wording at a high level' },
                        { id: 'b', label: 'Guarantee every claim will be paid' },
                        { id: 'c', label: 'Cancel your bond automatically' },
                        { id: 'd', label: 'Skip FICA forever' },
                    ],
                    correctId: 'a',
                    explanation: 'Advice and placement — not a claim guarantee.',
                },
            ],
        },
        hub
    );
}

function uninsuredRisksBp(
    hub: HubConfig,
    copy: { title: string; subtitle: string; nextSlug: string; nextTitle: string; nextDescription: string; gapBody: string }
): LessonBlueprint {
    return withHub(
        {
            slug: 'uninsured-risks',
            title: copy.title,
            subtitle: copy.subtitle,
            difficulty: 'intermediate',
            minutes: 11,
            xp: 110,
            badgeLabel: 'Gap Closed',
            nextSlug: copy.nextSlug,
            nextTitle: copy.nextTitle,
            nextDescription: copy.nextDescription,
            personaIndex: hub.progressPrefix === 'investor-' ? 4 : 3,
            objectives: [
                {
                    title: 'What “uninsured” really means',
                    body: 'Without valid cover, you fund repairs, replacement, alternative accommodation, and legal liability from your own pocket — while the bond, levies, and rates usually continue.\n\nSelf-insurance only works if you actually hold enough cash (or credit) for a worst-case rebuild. Most households do not.',
                },
                {
                    title: 'Bond breach and forced outcomes',
                    body: copy.gapBody,
                },
                {
                    title: 'Average, exclusions, and “I thought I was covered”',
                    body: 'Many people discover they were underinsured (average applied), excluded (flood/subsidence), or in breach of warranties (alarm not armed). The result feels like “no insurance” even when a policy existed.\n\nRead schedules after binding — not after the storm.',
                },
                {
                    title: 'Vacant, transferring, and in-between periods',
                    body: 'Vacant properties, renovation shells, and the gap between occupation dates are classic claim-denial windows. Sellers remain at risk until registration; buyers need clarity on when their cover starts.\n\nAsk in writing: who carries risk on which date?',
                },
            ],
            steps: [
                {
                    label: 'Stress-test cash',
                    detail:
                        'Ask whether savings or accessible credit could fund a serious rebuild or contents replacement within 90 days while the bond and levies still run. If not, “self-insurance” is a slogan, not a plan.\n\nWrite the gap number down — it makes the premium decision concrete.',
                },
                {
                    label: 'Close forced gaps',
                    detail:
                        'Keep bank-required building cover continuous from the date your loan conditions demand it. Lapse letters and unpaid debit orders are common quiet failures.\n\nSet calendar alerts two weeks before renewal and on debit-order day.',
                },
                {
                    label: 'Hunt silent gaps',
                    detail:
                        'Check for underinsurance (average), unpaid premiums, vacancy exclusions, early occupation without clarity, and owner-occupier wording on a let unit. These gaps feel like “having insurance” until a claim is reduced or declined.\n\nA 30-minute schedule review prevents a multi-year setback.',
                },
                {
                    label: 'Write the risk handover',
                    detail:
                        'Before early occupation or registration, confirm in writing with the conveyancer who carries risk on which date — seller policy, buyer policy, or body corporate. Ambiguity here is a classic South African transfer gap.\n\nDo not rely on “the agent said it should be fine”.',
                },
            ],
            timeline: [
                { title: 'Premium unpaid', detail: 'Cover can lapse — reinstate before the next risk event.', duration: 'Immediate' },
                { title: 'Major uninsured loss', detail: 'Repairs + alternative lodging + ongoing bond.', duration: 'Months–years of strain' },
                { title: 'Recovery plan', detail: 'Bind adequate cover; rebuild emergency fund.', duration: 'After any scare' },
            ],
            knowledge: [
                {
                    variant: 'warning',
                    title: 'Warning',
                    body: 'An unpaid debit order can lapse cover quietly — watch bank statements the week premiums run.',
                },
                {
                    variant: 'mistake',
                    title: 'Common mistake',
                    body: 'Assuming the body corporate or the seller’s policy covers you after you take occupation.',
                },
                {
                    variant: 'takeaway',
                    title: 'Takeaway',
                    body: 'No cover (or ineffective cover) turns a property asset into a personal liability overnight.',
                },
            ],
            quiz: [
                {
                    kind: 'mcq',
                    prompt: 'If building cover lapses while a bond is registered, a likely consequence is…',
                    options: [
                        { id: 'a', label: 'Breach of bond conditions and serious financial exposure if damage occurs' },
                        { id: 'b', label: 'Automatic bond cancellation with a gift' },
                        { id: 'c', label: 'Free rebuild by the municipality' },
                        { id: 'd', label: 'Higher FLISP subsidy' },
                    ],
                    correctId: 'a',
                    explanation: 'Lenders require continuous cover; uninsured damage hits you and can breach the loan.',
                },
                {
                    kind: 'true-false',
                    prompt: 'Underinsurance can reduce a claim payout even if you have a policy.',
                    options: [
                        { id: 'true', label: 'True' },
                        { id: 'false', label: 'False' },
                    ],
                    correctId: 'true',
                    explanation: 'Average clauses reduce payouts when sums insured are too low.',
                },
                {
                    kind: 'scenario',
                    prompt: 'You move in a week before transfer and a pipe bursts. What should you have clarified in writing?',
                    options: [
                        { id: 'a', label: 'Whose insurance responds between occupation and registration' },
                        { id: 'b', label: 'Whether the agent likes the paint colour' },
                        { id: 'c', label: 'The estate’s WhatsApp group name only' },
                        { id: 'd', label: 'Nothing — pipes never burst early' },
                    ],
                    correctId: 'a',
                    explanation: 'Risk handover dates are a classic gap — confirm before early occupation.',
                },
            ],
        },
        hub
    );
}

const BUYER_HUB: HubConfig = {};
const SELLER_HUB: HubConfig = { hubBasePath: '/sellers', progressPrefix: 'seller-' };
const INVESTOR_HUB: HubConfig = { hubBasePath: '/learn/investors', progressPrefix: 'investor-' };

export const BUYER_INSURANCE_BLUEPRINTS: LessonBlueprint[] = [
    homeInsuranceBp(BUYER_HUB, {
        title: 'Home Insurance Basics',
        subtitle:
            'Building vs contents, bond requirements, and why rebuild cost — not purchase price — sets your sum insured.',
        nextSlug: 'insurance-types',
        nextTitle: 'Types of Insurance',
        nextDescription: 'Map building, contents, life cover, and liability so nothing important is left out.',
    }),
    insuranceTypesBp(BUYER_HUB, {
        title: 'Types of Insurance',
        subtitle:
            'Homeowners, contents, bond protection, and liability — different products for different risks on the path to ownership.',
        nextSlug: 'why-insurance-matters',
        nextTitle: 'Why Insurance Matters',
        nextDescription: 'See how cover protects equity, cash flow, and your bond agreement.',
        typesBody:
            'Credit life / bond protection can settle or reduce debt if you die, become disabled, or (where included) are retrenched — subject to waiting periods and exclusions. It protects the loan book and your estate; it does not rebuild a burnt house.\n\nTreat it as debt protection, reviewed when your balance or dependents change.',
    }),
    whyInsuranceBp(BUYER_HUB, {
        title: 'Why Insurance Matters',
        subtitle:
            'Premiums are planned costs. Uninsured disasters are career-derailing bills — especially when a bond is still outstanding.',
        nextSlug: 'choosing-an-insurer',
        nextTitle: 'Finding the Right Insurer',
        nextDescription: 'Compare cover quality, not only the monthly debit.',
        whyBody:
            'Banks require building insurance so the security behind your home loan can be reinstated after damage. Falling out of cover can put you in breach of bond conditions.\n\nConveyancers and banks will ask for proof of cover at key transfer milestones — budget time to bind early.',
    }),
    choosingInsurerBp(BUYER_HUB, {
        title: 'Finding the Right Insurer',
        subtitle:
            'How to compare quotes, use licensed advice, disclose honestly, and bind cover the bank will accept.',
        nextSlug: 'uninsured-risks',
        nextTitle: 'When You Have No Cover',
        nextDescription: 'Understand lapse, underinsurance, and the real cost of going bare.',
        chooseBody:
            'Work with a licensed short-term insurance intermediary or the bank’s insurance channel if offered — ask who earns commission and what alternatives were compared.\n\nPropReady teaches the questions to ask; a licensed adviser places the policy.',
    }),
    uninsuredRisksBp(BUYER_HUB, {
        title: 'When You Have No Cover',
        subtitle:
            'What happens if cover lapses, you are underinsured, or nobody clarified risk between occupation and transfer.',
        nextSlug: 'transfer-costs',
        nextTitle: 'Transfer Costs & Fees',
        nextDescription: 'Fold insurance into the full cost of buying and owning.',
        gapBody:
            'If required building cover lapses, you may breach bond conditions. After a major uninsured loss you can still owe the full loan while the home is uninhabitable — a double burden of debt and rebuild.\n\nBanks protect their security; you must protect your equity and living situation.',
    }),
];

export const SELLER_INSURANCE_BLUEPRINTS: LessonBlueprint[] = [
    homeInsuranceBp(SELLER_HUB, {
        title: 'Home Insurance While Selling',
        subtitle:
            'Keep building cover live until registration, understand vacant-home conditions, and know what buyers will ask for.',
        nextSlug: 'insurance-types',
        nextTitle: 'Types of Insurance for Sellers',
        nextDescription: 'Clarify building, contents, and liability while the home is on the market.',
    }),
    insuranceTypesBp(SELLER_HUB, {
        title: 'Types of Insurance for Sellers',
        subtitle:
            'Which covers you keep until transfer, what buyers arrange, and how liability sits during show days and occupation.',
        nextSlug: 'why-insurance-matters',
        nextTitle: 'Why Seller Cover Matters',
        nextDescription: 'Protect net proceeds from a last-minute disaster on a listed home.',
        typesBody:
            'While selling, keep building cover continuous. Contents may reduce as you pack — update sums so you are not paying for empty rooms or under-declaring what remains.\n\nCredit life on your existing bond still matters until cancellation; do not cancel protection blindly mid-sale without advice.',
    }),
    whyInsuranceBp(SELLER_HUB, {
        title: 'Why Seller Cover Matters',
        subtitle:
            'A fire or storm on a listed property can destroy sale timing, buyer finance, and your net proceeds overnight.',
        nextSlug: 'choosing-an-insurer',
        nextTitle: 'Choosing Cover While You Sell',
        nextDescription: 'Keep the right insurer engaged through transfer day.',
        whyBody:
            'Until registration, you typically remain the owner at risk. Buyers, banks, and conveyancers expect the property to stay insured. A major uninsured loss can collapse an OTP, delay transfer, or force painful renegotiation.\n\nInsurance protects the deal you worked to create.',
    }),
    choosingInsurerBp(SELLER_HUB, {
        title: 'Choosing Cover While You Sell',
        subtitle:
            'Tell your insurer the home is on the market, confirm vacant or show-day conditions, and time cancellation for after registration.',
        nextSlug: 'uninsured-risks',
        nextTitle: 'Selling Without Proper Cover',
        nextDescription: 'See the damage an uninsured event can do mid-mandate.',
        chooseBody:
            'Notify your intermediary that the property is listed, may be vacant between move-out and transfer, or will have frequent strangers on show days. Ask whether conditions or premiums change.\n\nDo not cancel building cover the day you accept an offer — wait for registration guidance from your conveyancer and bank.',
    }),
    uninsuredRisksBp(SELLER_HUB, {
        title: 'Selling Without Proper Cover',
        subtitle:
            'Vacant-home exclusions, early buyer occupation, and mid-sale disasters — gaps that wipe seller proceeds.',
        nextSlug: 'costs',
        nextTitle: 'Selling Costs & Fees',
        nextDescription: 'Add insurance continuity to your net-proceeds checklist.',
        gapBody:
            'If cover lapses while you still own the home, you carry full rebuild risk and may still owe the bond. A damaged listed home often loses buyers or forces price cuts far larger than a year of premiums.\n\nNever hand keys for early occupation without written clarity on whose insurance responds.',
    }),
];

export const INVESTOR_INSURANCE_BLUEPRINTS: LessonBlueprint[] = [
    homeInsuranceBp(INVESTOR_HUB, {
        title: 'Landlord & Building Cover',
        subtitle:
            'Investment property insurance is an operating cost: building, landlord extensions, and loss of rent belong in your yield model.',
        nextSlug: 'insurance-types',
        nextTitle: 'Types of Investor Insurance',
        nextDescription: 'Landlord, liability, and rent-loss covers that residential owner-occupier policies often miss.',
    }),
    insuranceTypesBp(INVESTOR_HUB, {
        title: 'Types of Investor Insurance',
        subtitle:
            'Landlord policies, loss of rent, liability, and why a standard homeowners policy can fail on a let unit.',
        nextSlug: 'why-insurance-matters',
        nextTitle: 'Why Investors Insure',
        nextDescription: 'Protect NOI and debt service when tenants and buildings take hits.',
        typesBody:
            'Landlord packages often add malicious damage by tenants, loss of rent after insured damage, and owner’s liability. Owner-occupier contents wording may exclude or limit letting.\n\nCredit life on investment bonds still matters for estate liquidity — model it separately from building cover.',
    }),
    whyInsuranceBp(INVESTOR_HUB, {
        title: 'Why Investors Insure',
        subtitle:
            'One uninsured event can erase years of yield — and still leave the bond, rates, and levies running.',
        nextSlug: 'choosing-an-insurer',
        nextTitle: 'Choosing Landlord Cover',
        nextDescription: 'Underwrite insurers the way you underwrite suburbs.',
        whyBody:
            'Lenders require building cover on investment bonds too. Beyond compliance, insurance stabilises net operating income: loss-of-rent extensions can keep debt service alive after an insured event.\n\nUninsured voids turn “positive gearing” into forced selling pressure.',
    }),
    choosingInsurerBp(INVESTOR_HUB, {
        title: 'Choosing Landlord Cover',
        subtitle:
            'Disclose letting use, tenant type, and vacancy — then compare landlord wording, not homeowner marketing.',
        nextSlug: 'uninsured-risks',
        nextTitle: 'Investing Uninsured',
        nextDescription: 'See how bare risks destroy portfolio maths.',
        chooseBody:
            'Use an intermediary who understands landlord products. Disclose short-term letting, student lets, or multi-let explicitly. Compare loss-of-rent indemnity periods and malicious-damage limits — not only the debit order.\n\nRe-quote when you change use (e.g. Airbnb) or leave a unit vacant.',
    }),
    uninsuredRisksBp(INVESTOR_HUB, {
        title: 'Investing Uninsured',
        subtitle:
            'Vacancy exclusions, tenant damage gaps, and underinsurance — how portfolios quietly go bare.',
        nextSlug: 'returns',
        nextTitle: 'Calculating Returns',
        nextDescription: 'Put insurance premiums and rent-loss cover into NOI and stress tests.',
        gapBody:
            'An uninsured or wrongly worded landlord policy leaves you funding repairs and vacancy while the bond runs. Serious damage can trigger covenant issues with the bank and wipe cash reserves meant for the next deposit.\n\nInsurance is part of underwriting — not an afterthought at registration.',
    }),
];
