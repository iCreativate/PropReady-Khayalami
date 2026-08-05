import { buildLessonFromBlueprint, type LessonBlueprint } from '@/lib/buyer-learn/build-lesson';
import type { LessonModule } from '@/lib/buyer-learn/types';
import { INVESTOR_INSURANCE_BLUEPRINTS } from '@/lib/buyer-learn/modules/insurance';

const HUB = '/learn/investors';

function investorBp(
    partial: Omit<LessonBlueprint, 'hubBasePath' | 'progressId'> & { slug: string }
): LessonBlueprint {
    return {
        ...partial,
        hubBasePath: HUB,
        progressId: `investor-${partial.slug}`,
    };
}

const BLUEPRINTS: LessonBlueprint[] = [
    investorBp({
        slug: 'strategies',
        title: 'Investment Strategies',
        subtitle:
            'A property investment strategy sets how you allocate capital, time, and risk to target returns. Compare buy-to-let, value-add/flip, commercial, and REIT exposure — then choose what fits your constraints.',
        difficulty: 'beginner',
        minutes: 14,
        xp: 120,
        badgeLabel: 'Strategy Scout',
        nextSlug: 'returns',
        nextTitle: 'Calculating Returns',
        nextDescription: 'Master ROI, yield, and cash flow before you commit capital.',
        personaIndex: 4,
        objectives: [
            {
                title: 'What a property strategy is',
                body: 'A property investment strategy is a documented framework for allocating capital and operating capacity toward defined return objectives (income, capital appreciation, or both), subject to explicit risk limits and acquisition criteria. It functions as a decision filter before you view, offer, or finance a property.',
                whyItMatters:
                    'Without a strategy, acquisition decisions default to marketing narratives and social proof. A written framework forces trade-offs between capital, leverage, liquidity, and operational burden to be stated before you negotiate.',
                steps: [
                    {
                        label: 'Define return objectives',
                        detail:
                            'State the primary return objective in investment terms: recurring net rental cash flow, capital appreciation over a defined horizon, total return (income + growth), or liquid property exposure without direct asset management.\n\nIf the objective cannot be stated precisely, acquisition criteria cannot be tested — only rationalised after the fact.',
                    },
                    {
                        label: 'Map capital & capacity',
                        detail:
                            'Separate deployable capital into deposit, acquisition costs (transfer/bond/attorney), and operating reserves. Separately quantify weekly capacity for sourcing, due diligence, tenancy, and works.\n\nCapital without capacity pushes toward professionally managed buy-to-let or listed property. Capacity without capital constrains ticket size and leverage — it does not justify undercapitalised speculation.',
                    },
                    {
                        label: 'Set risk constraints',
                        detail:
                            'Define maximum loan-to-value (LTV), minimum liquid reserves (commonly expressed as months of property operating costs plus debt service), and the maximum monthly shortfall you can fund from non-property income under vacancy or rate stress.\n\nThese are underwriting constraints. An opportunity that breaches them is misaligned with your risk capacity, regardless of projected upside.',
                    },
                    {
                        label: 'Codify acquisition criteria',
                        detail:
                            'Convert objectives and constraints into measurable filters: eligible micro-markets, property type, maximum price, target net yield band, maximum acceptable vacancy, and mandatory walk-away conditions.\n\nApply the filter before viewings. A strategy that cannot reject deals is not an investment process.',
                    },
                ],
                deepDive: {
                    title: 'Strategy on paper',
                    body: 'A written property investment strategy is an operating brief for capital allocation — concise enough to update quarterly, precise enough to underwrite against.\n\nInclude five sections:\n1) Return objective — income, appreciation, or total return, with time horizon and liquidity preference.\n2) Capital stack — deposit budget, acquisition-cost budget, and reserve budget as separate amounts (do not conflate them).\n3) Operating capacity — hours available for asset management, and whether tenancy/works will be self-managed or outsourced (including assumed fee drag).\n4) Risk constraints — maximum LTV, concentration limits (e.g. exposure to one node), and mandatory stress tests (interest rate +1–2 percentage points; 1–2 months’ vacancy).\n5) Acquisition filter — eligible suburbs/stock, excluded stock, target net yield / cash-on-cash bands, and non-negotiable due-diligence gates.\n\nApplication: screen listings against the filter before viewing; re-test net income, debt service, and reserves before offer; revisit the brief after registration when rates, income, or objectives change.\n\nFailure mode: an unwritten “strategy” that shifts under urgency. Documentation preserves underwriting discipline.\n\nEducational framework only — not financial, tax, or legal advice. Confirm credit, tax, and conveyancing decisions with appropriately registered professionals.',
                },
            },
            {
                title: 'Buy-to-let basics',
                body: 'Buy-to-let is the acquisition of income-producing property where the primary underwriting focus is net rental income after operating costs and vacancy, with capital appreciation as a secondary (and uncertain) component of total return. In South Africa, gross yield is a screening metric; net yield and debt-service capacity under stress determine whether the asset is viable.',
                whyItMatters:
                    'If net operating income cannot support holding costs and debt service through a normal vacancy period, the purchase transfers liquidity risk onto the investor’s other income — it is not a robust income strategy.',
                steps: [
                    {
                        label: 'Establish achievable rent',
                        detail:
                            'Anchor rental assumptions to recent concluded lets of comparable units in the same micro-market (size, condition, amenities), not asking rents in marketing material. Ask local agents about days-to-let and prevailing vacancy.\n\nOverstated rent is the most common input error in buy-to-let models and directly inflates apparent yield.',
                    },
                    {
                        label: 'Build the operating cost stack',
                        detail:
                            'Deduct municipal rates/taxes, levies (where applicable), insurance, property management fees (often in the region of 8–12% of collected rent when outsourced — confirm locally), maintenance provisions, and an explicit vacancy allowance.\n\nNet operating income (NOI) is what remains before financing costs. Omitting line items does not improve returns — it hides them.',
                    },
                    {
                        label: 'Calculate gross and net yield',
                        detail:
                            'Gross rental yield = (annual gross rent ÷ purchase price) × 100. It is useful for initial screening only.\n\nNet rental yield = (annual NOI after operating costs and vacancy ÷ purchase price) × 100. Where the asset is geared, also calculate cash-on-cash return = annual pre-tax cash flow after debt service ÷ total cash invested (deposit + acquisition costs + immediate capex).',
                    },
                    {
                        label: 'Stress vacancy and rates',
                        detail:
                            'Test whether you can meet bond repayments and unavoidable holding costs for 1–2 months with zero rental income, and whether debt service remains manageable if the interest rate rises by 1–2 percentage points.\n\nBuy-to-let underwriting assumes tenant turnover and rate cycles as normal states, not exceptions.',
                    },
                ],
                deepDive: {
                    title: 'Buy-to-let underwriting on paper',
                    body: 'A buy-to-let underwriting sheet should separate income, operating costs, and financing.\n\nIncome: achievable monthly rent × 12, then apply a vacancy factor (e.g. model 11 months’ rent if you assume one vacant month per year — adjust to local evidence).\n\nOperating costs: rates, levies, insurance, management, maintenance (percentage of rent or a rand provision), and known special-levy risk where relevant.\n\nFinancing: scheduled repayment at the offered rate and at +1% / +2%. Assess whether base-case and stress-case shortfalls are fundable from non-property income without breaching your reserve rule.\n\nExample decision rule: proceed only if base-case net yield meets your band and the +2% rate case remains serviceable through two vacant months.\n\nAlso record tenant profile (affordability/screening standard) and operating model (self-manage vs agent, including fee drag). Operations are part of return — not an afterthought to purchase price.',
                },
            },
            {
                title: 'Fix-and-flip risks',
                body: 'A fix-and-flip (value-add) strategy acquires under-improved stock, funds remediation/renovation, and exits via resale. Profit is residual after purchase price, renovation, holding costs, selling costs, and contingency — not sale price minus purchase price alone. Underwrite after-repair value (ARV) from comparable sales, and carry a renovation contingency (commonly 15–20% as a learning rule of thumb) for latent defects.',
                whyItMatters:
                    'Cost overrun, programme delay, or a soft exit can eliminate margin entirely. Thin underwriting converts a flip into an unplanned hold under stress.',
                steps: [
                    {
                        label: 'Anchor ARV in comparable sales',
                        detail:
                            'After-repair value must be evidenced by recent arm’s-length sales of similar size, location, and finish — not aspirational asking prices. Thin comparable evidence increases exit risk.\n\nWithout a defensible ARV, the project is speculative trading, not a controlled value-add strategy.',
                    },
                    {
                        label: 'Scope and contingency the works',
                        detail:
                            'Itemise structural, wet works, electrical, and finishes with contractor quotes where possible. Add a contingency (commonly 15–20%) for latent defects discovered once works open up.\n\nUndercapitalised renovation budgets are a primary cause of forced holds and distressed exits.',
                    },
                    {
                        label: 'Include holding and disposal costs',
                        detail:
                            'Holding costs include interest (or opportunity cost of equity), rates, insurance, security, and utilities during works and marketing. Disposal costs include agent commission, marketing, and time-on-market assumptions.\n\nEconomic profit = net sale proceeds − purchase − renovation − holding − selling costs (including contingency).',
                    },
                    {
                        label: 'Set a minimum residual margin',
                        detail:
                            'Define the minimum profit in rands and as a percentage of capital at risk after contingency and a slow-sale case. If viability requires perfect timing and zero surprises, decline the deal.\n\nValue-add strategy is margin discipline under construction and liquidity uncertainty.',
                    },
                ],
                deepDive: {
                    title: 'Value-add underwriting on paper',
                    body: 'Before offer, document:\n\n• Maximum purchase price\n• Works scope and quote band\n• Contingency % (15–20% is a common training assumption — adjust to complexity)\n• Holding period (base and extended)\n• ARV from comps, plus a discounted soft-market ARV\n• Selling costs\n• Minimum residual profit after all of the above\n\nRun base and slow-exit cases. If the slow case fails your minimum margin, the strategy rejects the deal irrespective of aesthetic upside.\n\nAlso state your execution edge: project control capability versus reliance on contractors funded by your capital. Strategy should match competence and governance of the works.',
                },
            },
            {
                title: 'Commercial vs residential',
                body: 'Residential investment typically means dwellings let to individuals/households (including sectional title). Commercial investment means premises let for business use (office, retail, industrial, mixed-use). Commercial leases are often longer and capital tickets larger, but vacancy can be longer and tenant underwriting more specialised. Neither asset class is inherently lower risk.',
                whyItMatters:
                    'Selecting commercial for perceived sophistication — without matching capital, lease expertise, and void tolerance — is a strategy mismatch, not progression.',
                steps: [
                    {
                        label: 'Compare the tenant covenant',
                        detail:
                            'Residential underwriting centres on household affordability and tenancy conduct. Commercial underwriting centres on business viability, lease structure (term, escalations, renewals), fit-out obligations, and default/reinstatement risk.\n\nAsk who pays, for how long, on what terms, and what the re-letting pathway is if they exit.',
                    },
                    {
                        label: 'Compare capital and diligence intensity',
                        detail:
                            'Commercial acquisitions often require larger equity cheques and specialised legal/technical due diligence. Residential tickets can be smaller — which also makes it easier to overspread capital across poorly screened stock.\n\nMatch ticket size to reserves, leverage limits, and experience.',
                    },
                    {
                        label: 'Compare vacancy and re-letting risk',
                        detail:
                            'Residential voids are painful; commercial voids can be longer and costlier (incentives, fit-out, narrower demand). Model longer vacancy for commercial before treating headline yield as superior.\n\nYield without a credible re-letting assumption is incomplete underwriting.',
                    },
                    {
                        label: 'Select on mandate fit',
                        detail:
                            'Asset-class choice should follow capital, capacity, network, and risk constraints — not status. A strategy mismatch appears as an asset you cannot re-let, refinance, or operate within your governance capacity.',
                    },
                ],
                deepDive: {
                    title: 'Asset-class selection on paper',
                    body: 'Build a comparison matrix:\n\nResidential — typical lease length, re-let velocity in the target micro-market, management intensity, equity required, and your informational edge (e.g. local demand knowledge).\n\nCommercial — the same columns, plus tenant-industry risk, lease complexity, and fit-out/reinstatement exposure.\n\nScore capital fit, time fit, skill fit, and stress tolerance. The higher-scoring lane becomes your primary mandate for the next 12–24 months.\n\nRevisit only when evidence (capital, capacity, or market structure) changes — not because a single listing is persuasive.',
                },
            },
            {
                title: 'When REITs fit',
                body: 'A Real Estate Investment Trust (REIT) is a listed (or regulated) vehicle that owns a portfolio of income-producing properties. Investors hold shares/units and receive exposure to property income and asset values without directly owning or managing individual buildings. Liquidity is typically higher than direct property, but unit prices are marked to market and distributions are not guaranteed.',
                whyItMatters:
                    'REITs can provide diversified property exposure and liquidity; they do not replicate the cash-flow profile or control rights of a directly owned, geared freehold or sectional-title asset.',
                steps: [
                    {
                        label: 'Understand the claim you hold',
                        detail:
                            'You own a security in a property-owning vehicle — not title to a specific flat or shop, and not day-to-day control of tenants or capex.\n\nYou exchange direct control and idiosyncratic asset selection for diversification, professional management, and (usually) secondary-market liquidity.',
                    },
                    {
                        label: 'Price and distribution risk',
                        detail:
                            'Listed prices can move with equity-market conditions even when underlying occupancy is stable. Liquidity enables exit — and also enables forced selling under stress.\n\nIf your objective requires stable direct ownership economics, a REIT is a different instrument with different risk factors.',
                    },
                    {
                        label: 'Define the portfolio role',
                        detail:
                            'Common roles: a bridge while accumulating a deposit; a satellite allocation beside a physical asset; or a core liquid property allocation for investors who accept market pricing and limited control.\n\nSize the position to the role. “It is property” is not an investment thesis.',
                    },
                    {
                        label: 'Apply written mandate rules',
                        detail:
                            'Set allocation limits, review dates, and exit criteria (thesis break, concentration, liquidity needs). Listed property still requires a mandate.\n\nConfirm product, tax, and suitability characteristics with advice appropriate to your circumstances — REIT regimes and distribution treatment can be technical.',
                    },
                ],
                deepDive: {
                    title: 'REITs in the strategy mandate',
                    body: 'Add REIT exposure to your written strategy only with an explicit job:\n\n• Bridge — liquid property exposure while accumulating equity for direct acquisition\n• Satellite — diversify beyond a single physical micro-market\n• Core — primary property allocation if you accept mark-to-market pricing and limited asset-level control\n\nDocument risks: unit-price volatility, distribution variability, and no direct control of individual assets. Document benefits: professional management, diversification, and typically lower operational burden than a geared direct asset.\n\nApply the same discipline as direct property: objective, horizon, sizing, and review date. Educational content only — product selection requires advice suited to your situation.',
                },
            },
        ],
        steps: [
            {
                label: 'Write your strategy',
                detail:
                    'Put goal, capital, time, risk limits, and a deal filter on one page before you view stock. Paper beats memory when FOMO hits.',
            },
            {
                label: 'Pick a primary path',
                detail:
                    'Choose buy-to-let, flip, commercial, or listed property based on fit — not status. One primary lane keeps decisions clean.',
            },
            {
                label: 'Stress the numbers',
                detail:
                    'Run vacancy, rate, and cost scenarios. If only the perfect case works, the strategy says no.',
            },
            {
                label: 'Check the market',
                detail:
                    'Validate tenant demand and comps in the micro-market. City averages are not a suburb strategy.',
            },
            {
                label: 'Structure the deal',
                detail:
                    'Align deposit, finance, and holding vehicle with advice after the strategy is clear — structure follows strategy.',
            },
        ],
        timeline: [
            {
                title: 'Strategy on paper',
                detail:
                    'Define goals, capital, time available, and risk limits before you view stock. This becomes your deal filter.',
                duration: '1–2 weeks',
            },
            {
                title: 'Deal sourcing',
                detail:
                    'Shortlist suburbs and stock types that match the strategy — ignore everything else.',
                duration: '2–6 weeks',
            },
            {
                title: 'Offer & finance',
                detail:
                    'OTP, due diligence, and bond work only on deals that still pass your written filter.',
                duration: '4–12 weeks',
            },
        ],
        knowledge: [
            {
                variant: 'myth-fact',
                title: 'Myth vs fact',
                myth: 'Any rental property will cash-flow from day one.',
                fact: 'Many SA deals cash-flow thinly at first — vacancies, rates, and levies matter.',
            },
            {
                variant: 'definition',
                title: 'Property strategy',
                body: 'A documented capital-allocation framework linking return objectives, capital and capacity constraints, risk limits (including LTV and reserves), and measurable acquisition criteria for a chosen approach (e.g. buy-to-let or value-add).',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Aim for areas with real tenant demand — near work nodes, transport, and schools — not only areas that look good online.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Buying a flip without a 15–20% renovation contingency and a holding-cost buffer.',
            },
            {
                variant: 'numbers',
                title: 'SA yield band',
                body: 'Gross rental yields often sit around 6–10% depending on suburb and stock — always convert to net before you celebrate.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'What is a property investment strategy?',
                options: [
                    { id: 'a', label: 'A plan matching capital, time, risk, and return goals to a property approach' },
                    { id: 'b', label: 'Buying whatever is trending on social media' },
                    { id: 'c', label: 'A guaranteed way to double your money in a year' },
                    { id: 'd', label: 'Skipping research because “property always goes up”' },
                ],
                correctId: 'a',
                explanation: 'Strategy is a filter for capital, time, risk, and returns — not a hype checklist.',
            },
            {
                kind: 'mcq',
                prompt: 'What is a typical SA buy-to-let focus?',
                options: [
                    { id: 'a', label: 'Monthly rental income plus long-term growth' },
                    { id: 'b', label: 'Same-day flip with zero holding costs' },
                    { id: 'c', label: 'Guaranteed tax-free returns' },
                    { id: 'd', label: 'Skipping all tenant screening' },
                ],
                correctId: 'a',
                explanation: 'Buy-to-let balances rental income with capital appreciation over time.',
            },
            {
                kind: 'true-false',
                prompt: 'Fix-and-flip needs renovation and holding-cost buffers.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'Unexpected costs and slower sales eat profit fast.',
            },
            {
                kind: 'scenario',
                prompt: 'You want liquidity without managing tenants. Best fit?',
                options: [
                    { id: 'a', label: 'REITs or listed property' },
                    { id: 'b', label: 'Raw land development' },
                    { id: 'c', label: 'Hands-on multi-unit flips' },
                    { id: 'd', label: 'Ignore diversification entirely' },
                ],
                correctId: 'a',
                explanation: 'REITs give property exposure with liquidity and less day-to-day ops.',
            },
        ],
    }),
    investorBp({
        slug: 'returns',
        title: 'Calculating Returns',
        subtitle:
            'Return metrics for underwriting: gross and net rental yield, cash-on-cash return, capital appreciation scenarios, and stress-tested cash flow.',
        difficulty: 'intermediate',
        minutes: 14,
        xp: 130,
        badgeLabel: 'Returns Ready',
        nextSlug: 'financing',
        nextTitle: 'Investment Financing',
        nextDescription: 'How investment bonds, deposits, and leverage actually work.',
        personaIndex: 4,
        includeAffordabilityTool: true,
        objectives: [
            {
                title: 'Gross vs net yield',
                body: 'Gross rental yield = (annual gross rental income ÷ purchase price) × 100. It is a screening ratio that ignores operating costs and vacancy.\n\nNet rental yield uses net operating income after rates/taxes, levies, insurance, management, maintenance provisions, and an explicit vacancy allowance, divided by purchase price. Underwriting should be driven by net yield and debt service — not gross yield alone.',
                whyItMatters:
                    'Acquisitions priced on gross yield routinely understate cash drag. Operating costs and vacancy are part of the return definition.',
            },
            {
                title: 'Cash-on-cash ROI',
                body: 'Cash-on-cash return = annual pre-tax cash flow after operating costs and debt service ÷ total cash invested (deposit, acquisition costs, and immediate capital expenditure). It measures return on equity deployed, which differs from yield on full purchase price when the asset is geared.',
                whyItMatters:
                    'Leverage changes return on cash at risk. Comparing ungeared yield to geared cash-on-cash without stating the capital stack misstates performance.',
            },
            {
                title: 'Capital growth',
                body: 'Capital appreciation is the change in asset value over time. It is uncertain, path-dependent, and micro-market specific. Model it as scenario ranges (base / soft / strong), not as a single promised percentage from marketing material.',
                whyItMatters:
                    'If viability requires aggressive appreciation assumptions, the thesis is speculative. A sound mandate should remain coherent under average growth outcomes.',
            },
            {
                title: 'Stress tests',
                body: 'A stress test re-underwrites the asset under adverse but plausible states: interest rate +1–2 percentage points, extended vacancy, and known special-levy or maintenance shocks. If only the perfect occupancy and current-rate case works, the cash-flow thesis is fragile.',
                whyItMatters:
                    'South African rate cycles and tenant turnover are normal operating conditions. Stress testing is part of return analysis, not pessimism.',
            },
        ],
        steps: [
            {
                label: 'List all income',
                detail:
                    'Start with achievable rent from comps, then add parking or extras only if they are real and recurring.\n\nBrochure rent is marketing. Comp rent is evidence.',
            },
            {
                label: 'List all costs',
                detail:
                    'Include rates, levies, insurance, management, maintenance, and a vacancy allowance.\n\nMissing one line item is how “good yields” disappear after transfer.',
            },
            {
                label: 'Compute yields',
                detail:
                    'Gross yield screens deals quickly. Net yield (after costs and voids) decides them.\n\nIf bonded, also check cash-on-cash return on the cash you actually invest.',
            },
            {
                label: 'Stress the deal',
                detail:
                    'Re-run the sheet at +1–2% rates and 1–2 vacant months.\n\nIf only the perfect month works, the return story is fragile — walk or renegotiate.',
            },
        ],
        timeline: [
            { title: 'Gather comps', detail: 'Rents and sales in the micro-market.', duration: '2–5 days' },
            { title: 'Build a sheet', detail: 'Income, costs, and scenarios.', duration: '1 day' },
            { title: 'Decide', detail: 'Hold, renegotiate, or walk.', duration: 'Same week' },
        ],
        knowledge: [
            {
                variant: 'definition',
                title: 'Gross rental yield',
                body: 'Gross rental yield = (annual gross rent ÷ purchase price) × 100. Screening metric only — it excludes operating costs, vacancy, and financing.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Always model net yield after vacancies and management (often 8–12% of rent).',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Using optimistic rent with zero vacancy buffer.',
            },
            {
                variant: 'warning',
                title: 'Watch rates',
                body: 'A 1–2% rate move can wipe thin cash-flow deals.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'Gross yield ignores which costs?',
                options: [
                    { id: 'a', label: 'Rates, levies, vacancies, and management' },
                    { id: 'b', label: 'Only the purchase price' },
                    { id: 'c', label: 'Only the deposit' },
                    { id: 'd', label: 'Nothing — it includes everything' },
                ],
                correctId: 'a',
                explanation: 'Gross is a screen; net includes operating reality.',
            },
            {
                kind: 'true-false',
                prompt: 'Cash-on-cash ROI looks at return on your cash invested, not the full price.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'Leverage changes the return on the cash you put down.',
            },
        ],
    }),
    investorBp({
        slug: 'financing',
        title: 'Investment Financing',
        subtitle:
            'How deposits, investment bonds, and leverage work — without overextending.',
        difficulty: 'intermediate',
        minutes: 12,
        xp: 120,
        badgeLabel: 'Finance Fluent',
        nextSlug: 'tax',
        nextTitle: 'Tax & Legal Considerations',
        nextDescription: 'Rental tax, CGT, deductions, and holding structures.',
        personaIndex: 5,
        includeAffordabilityTool: true,
        objectives: [
            {
                title: 'Investment vs primary bonds',
                body: 'A primary residence loan finances an owner-occupied dwelling. An investment loan finances property acquired to let or hold for return. Credit providers typically assess investment exposure differently — often with higher equity contributions, different pricing, and affordability tests that still apply under the National Credit Act.\n\nRequest investment product terms explicitly; do not extrapolate from an owner-occupier indication.',
                whyItMatters:
                    'Mis-assuming deposit and rate equivalence can break acquisition feasibility after you are already committed to a shortlist.',
            },
            {
                title: 'Deposit reality',
                body: 'Acquisition cash must be segregated into (1) equity/deposit toward purchase price, (2) acquisition costs (transfer duty or VAT context, conveyancing and bond registration costs), and (3) post-transfer operating reserves for vacancy and maintenance.\n\n“Deposit ready” is incomplete if costs and reserves are unfunded.',
                whyItMatters:
                    'Conflating these buckets creates immediate liquidity stress at transfer or at the first void — when options are worst.',
            },
            {
                title: 'Leverage carefully',
                body: 'Leverage is the use of borrowed capital so that a given equity outlay controls a larger asset. It amplifies equity returns when income and values cooperate — and amplifies losses when rates rise, vacancies extend, or values soften.\n\nMaximum LTV with no reserve is not capital efficiency; it is reduced resilience.',
                whyItMatters:
                    'The underwriting question is whether debt service remains manageable under stress — not whether today’s repayment looks affordable.',
            },
            {
                title: 'Serviceability',
                body: 'Serviceability is the assessment of whether the borrower’s income and obligations can support the contractual repayment — a requirement for credit providers under South African credit regulation, and a discipline investors should apply independently.\n\nTest whether you can meet bond and unavoidable holding costs if rent is delayed for 60 days.',
                whyItMatters:
                    'If viability assumes uninterrupted rent, control of the investment sits with tenancy outcomes rather than with your mandate.',
            },
        ],
        steps: [
            {
                label: 'Know your deposit',
                detail:
                    'Separate cash into deposit, transfer/bond fees, and operating reserves before you speak to a lender.\n\n“I have the deposit” is incomplete if fees and buffers are unfunded.',
            },
            {
                label: 'Compare lenders',
                detail:
                    'Ask specifically for investment loan terms — deposits and pricing often differ from primary-home products.\n\nCompare rate, fees, LTV, and conditions in writing.',
            },
            {
                label: 'Stress repayments',
                detail:
                    'Model the installment at today’s rate and at higher rates, with and without rent for 1–2 months.\n\nServiceability is your problem first, then the bank’s.',
            },
            {
                label: 'Keep reserves',
                detail:
                    'Do not deploy every rand into the deposit. Reserves fund voids and repairs without panic decisions.\n\nLeverage without reserves is a strategy for stress.',
            },
        ],
        timeline: [
            { title: 'Pre-check with a lender', detail: 'Indicative investment appetite.', duration: '3–7 days' },
            { title: 'Formal application', detail: 'After an OTP on the right deal.', duration: '2–6 weeks' },
            { title: 'Registration', detail: 'Bond and transfer complete.', duration: '8–12+ weeks' },
        ],
        knowledge: [
            {
                variant: 'law',
                title: 'National Credit Act',
                body: 'Lenders must assess affordability before granting credit — investors included.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep a rate and vacancy buffer before you scale to a second unit.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Maxing LTV on every deal with no cash reserve.',
            },
            {
                variant: 'numbers',
                title: 'Cash buffer',
                body: 'Many investors keep 2–3 months of costs aside for voids and repairs.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Investment bonds are always priced the same as primary residence bonds.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Banks often require more deposit and price risk differently.',
            },
            {
                kind: 'mcq',
                prompt: 'What does leverage do?',
                options: [
                    { id: 'a', label: 'Amplifies both gains and losses' },
                    { id: 'b', label: 'Removes all risk' },
                    { id: 'c', label: 'Guarantees rental income' },
                    { id: 'd', label: 'Skips FICA forever' },
                ],
                correctId: 'a',
                explanation: 'Borrowed money magnifies outcomes in both directions.',
            },
        ],
    }),
    investorBp({
        slug: 'tax',
        title: 'Tax & Legal Considerations',
        subtitle:
            'Rental tax, capital gains, deductions, and structures — get advice early.',
        difficulty: 'intermediate',
        minutes: 11,
        xp: 110,
        badgeLabel: 'Tax Aware',
        nextSlug: 'portfolio',
        nextTitle: 'Portfolio Management',
        nextDescription: 'Tenants, maintenance, and scaling without chaos.',
        personaIndex: 5,
        objectives: [
            {
                title: 'Rental income tax',
                body: 'In South Africa, rental income is generally included in taxable income. Allowable deductions may reduce taxable rental profit, but cash receipts are not tax-free “side income”.\n\nModel a conservative tax outflow in cash-flow underwriting from acquisition — provisional and annual obligations can materially change net cash retained.',
                whyItMatters:
                    'Unplanned tax liabilities force deferred maintenance, distress sales, or personal cash strain — outcomes that are avoidable with earlier modelling and advice.',
            },
            {
                title: 'Capital gains tax',
                body: 'Capital gains tax (CGT) may arise on disposal where proceeds exceed base cost, subject to South African tax rules, inclusions, and any applicable exclusions or specific circumstances.\n\nUnderwrite exit with selling costs and a conservative CGT allowance. Confirm base-cost components and current rules with a registered tax practitioner — this module is educational, not tax advice.',
                whyItMatters:
                    'Entry-only models overstate economic profit. Exit tax and costs are part of total return.',
            },
            {
                title: 'Allowable deductions',
                body: 'Deductions may include interest, rates, levies, fees, and certain repairs. Keep invoices from month one.',
                whyItMatters:
                    'Weak records mean you overpay tax or create SARS risk.',
            },
            {
                title: 'Entity choice',
                body: 'Personal, company, or trust each have different cost and compliance. Choose with professional advice after you know your strategy.',
                whyItMatters:
                    'Wrong structure adds fees and is hard to unwind.',
            },
        ],
        steps: [
            {
                label: 'Track every rand',
                detail:
                    'From the first month, keep leases, invoices, and bank records in one folder.\n\nTax strategy starts with evidence — not with a year-end scramble.',
            },
            {
                label: 'Separate personal spend',
                detail:
                    'Use a dedicated account for rent and property costs where practical.\n\nMixed household and investment cash creates messy records and weak claims.',
            },
            {
                label: 'Speak to a tax pro',
                detail:
                    'Before you pick a company or trust, get advice on cost, compliance, and exit.\n\nStructure follows strategy — “tax magic” slogans do not.',
            },
            {
                label: 'Plan the exit',
                detail:
                    'Sketch selling costs and a conservative capital gains allowance when you buy.\n\nEntry-only models overstate what you keep.',
            },
        ],
        timeline: [
            { title: 'Setup books', detail: 'Account and folder structure.', duration: 'Before purchase' },
            { title: 'Annual return', detail: 'Declare rental income and claims.', duration: 'Tax year' },
            { title: 'On sale', detail: 'CGT and attorney final accounts.', duration: 'Exit' },
        ],
        knowledge: [
            {
                variant: 'warning',
                title: 'Not tax advice',
                body: 'This module is educational. Confirm with a registered tax practitioner.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Keep invoices for repairs and improvements — classification affects deductions.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Choosing a trust or company for “tax magic” without understanding costs.',
            },
            {
                variant: 'law',
                title: 'SARS reality',
                body: 'Rental income must be declared. Under-reporting is not a strategy.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Rental income in South Africa is generally taxable.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'Declare rental income and claim allowable deductions properly.',
            },
            {
                kind: 'mcq',
                prompt: 'Before picking a trust or company structure you should…',
                options: [
                    { id: 'a', label: 'Get professional tax and legal advice' },
                    { id: 'b', label: 'Copy a social media post' },
                    { id: 'c', label: 'Skip all paperwork' },
                    { id: 'd', label: 'Ignore capital gains forever' },
                ],
                correctId: 'a',
                explanation: 'Structure has cost, compliance, and exit implications.',
            },
        ],
    }),
    investorBp({
        slug: 'portfolio',
        title: 'Portfolio Management',
        subtitle:
            'Tenants, maintenance, systems, and scaling without burning out.',
        difficulty: 'intermediate',
        minutes: 12,
        xp: 120,
        badgeLabel: 'Ops Steady',
        nextSlug: 'market-analysis',
        nextTitle: 'Market Analysis',
        nextDescription: 'Spot growth areas and value with clearer comps.',
        personaIndex: 5,
        objectives: [
            {
                title: 'Tenant screening',
                body: 'Screen affordability, payment history, and references before keys change hands. A short vacancy beats a bad tenancy.',
                whyItMatters:
                    'One weak tenant can wipe months of return.',
            },
            {
                title: 'Maintenance rhythm',
                body: 'Fix small issues on a schedule instead of waiting for emergencies. Budget an annual maintenance allowance.',
                whyItMatters:
                    'Deferred repairs hurt cash flow now and sale value later.',
            },
            {
                title: 'Systems',
                body: 'Track rent, renewals, compliance, and invoices consistently. Chaos in your head will not survive a second unit.',
                whyItMatters:
                    'Systems turn ownership into a business you can scale.',
            },
            {
                title: 'When to outsource',
                body: 'Managers charge a fee to handle letting and day-to-day issues. Compare that fee to your time and mistake risk.',
                whyItMatters:
                    'Self-managing is not free if it burns evenings.',
            },
        ],
        steps: [
            {
                label: 'Screen properly',
                detail:
                    'Check affordability, payment behaviour, and references before handover, then sign a clear lease.\n\nFilling fast with a weak tenant usually costs more than a short vacancy.',
            },
            {
                label: 'Document everything',
                detail:
                    'Do an ingoing inspection with photos and signed condition notes.\n\nDocumentation protects deposits, disputes, and your exit story later.',
            },
            {
                label: 'Schedule upkeep',
                detail:
                    'Plan seasonal and annual checks (geyser, damp, roof, gutters) instead of waiting for emergencies.\n\nPreventive spend is usually cheaper than crisis spend.',
            },
            {
                label: 'Review performance',
                detail:
                    'Each quarter, review rent collected, voids, arrears, and maintenance.\n\nOps metrics tell you whether to hold, improve, refinance, or sell.',
            },
        ],
        timeline: [
            { title: 'Onboarding tenant', detail: 'Lease, deposit, FICA, keys.', duration: '1–2 weeks' },
            { title: 'Steady state', detail: 'Rent collection and maintenance.', duration: 'Ongoing' },
            { title: 'Renewal / exit', detail: 'Notice, inspection, deposit refund.', duration: 'As needed' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'A good lease and clear house rules prevent most disputes.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Skipping credit and employer checks to “fill the unit faster”.',
            },
            {
                variant: 'warning',
                title: 'Neglect tax',
                body: 'Deferred maintenance destroys value and tenant retention.',
            },
            {
                variant: 'takeaway',
                title: 'Scale with systems',
                body: 'Add units only when your ops can absorb another vacancy shock.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'Best first step before handing over keys?',
                options: [
                    { id: 'a', label: 'Proper screening and a signed lease' },
                    { id: 'b', label: 'Verbal handshake only' },
                    { id: 'c', label: 'Skip the deposit' },
                    { id: 'd', label: 'Ignore references' },
                ],
                correctId: 'a',
                explanation: 'Screening and paperwork protect both sides.',
            },
            {
                kind: 'true-false',
                prompt: 'Property management fees (often 8–12% of rent) can be worth it if they free your time.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'Outsourcing is a trade-off of fee vs time and skill.',
            },
        ],
    }),
    investorBp({
        slug: 'market-analysis',
        title: 'Market Analysis',
        subtitle:
            'Judge suburbs with micro-markets, comps, demand drivers, and supply risks.',
        difficulty: 'intermediate',
        minutes: 11,
        xp: 110,
        badgeLabel: 'Market Reader',
        nextSlug: 'pre-purchase-mistakes',
        nextTitle: 'Pre-Purchase Mistakes',
        nextDescription: 'Avoid the errors that happen before you even offer.',
        personaIndex: 4,
        objectives: [
            {
                title: 'Micro-markets',
                body: 'A micro-market is the suburb or street cluster where your property competes. City averages hide big differences.',
                whyItMatters:
                    'Local demand — not national headlines — prices your deal.',
            },
            {
                title: 'Comps',
                body: 'Comps are recent sales and listings of similar nearby stock. Prefer recent sold prices over cherry-picked records.',
                whyItMatters:
                    'Without comps you negotiate blind.',
            },
            {
                title: 'Demand drivers',
                body: 'Demand comes from jobs, transport, schools, and amenities people actually use. Walk the area by day and evening.',
                whyItMatters:
                    'Pretty amenities without real demand produce soft rents.',
            },
            {
                title: 'Supply risks',
                body: 'New competing stock nearby can pressure rents and days-on-market. Check what is being built before you buy.',
                whyItMatters:
                    'Oversupply can stall cash flow and growth for years.',
            },
        ],
        steps: [
            {
                label: 'Define the node',
                detail:
                    'Mark the streets, transport links, and amenities that define your micro-market.\n\nCity-wide stories hide street-level reality.',
            },
            {
                label: 'Pull comps',
                detail:
                    'Gather recent sold and listed comps of similar size and condition from the last 6–12 months.\n\nSold prices beat asking prices when you are underwriting.',
            },
            {
                label: 'Check demand',
                detail:
                    'Ask how quickly similar rentals let and what voids look like locally.\n\nDays-on-market and letting speed are demand in plain language.',
            },
            {
                label: 'Walk the area',
                detail:
                    'Visit by day and evening. Photos miss noise, access, and empty streets.\n\nYour feet are part of due diligence.',
            },
        ],
        timeline: [
            { title: 'Desktop research', detail: 'Data and listings.', duration: '2–4 days' },
            { title: 'On-the-ground', detail: 'Viewings and street sense.', duration: '1–2 weekends' },
            { title: 'Decision memo', detail: 'Buy, wait, or change suburb.', duration: '1 day' },
        ],
        knowledge: [
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Track days-on-market — slow stock often signals price or demand issues.',
            },
            {
                variant: 'mistake',
                title: 'Common mistake',
                body: 'Buying on a national headline without checking the suburb.',
            },
            {
                variant: 'definition',
                title: 'Infrastructure',
                body: 'Transport links and employment nodes often support rental demand.',
            },
            {
                variant: 'numbers',
                title: 'Vacancy signal',
                body: 'Ask agents how long similar units sit empty — that is real demand data.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'City-wide averages are enough to buy a specific street.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Micro-market comps and demand matter more than city averages.',
            },
            {
                kind: 'mcq',
                prompt: 'A useful demand signal is…',
                options: [
                    { id: 'a', label: 'How quickly similar rentals get let' },
                    { id: 'b', label: 'A viral property meme' },
                    { id: 'c', label: 'Ignoring vacancy entirely' },
                    { id: 'd', label: 'Only looking at national GDP' },
                ],
                correctId: 'a',
                explanation: 'Local letting speed reflects real tenant demand.',
            },
        ],
    }),
    investorBp({
        slug: 'pre-purchase-mistakes',
        title: 'Pre-Purchase Mistakes',
        subtitle:
            'Catch weak research, emotional buys, and poor locations before you offer.',
        difficulty: 'beginner',
        minutes: 10,
        xp: 100,
        badgeLabel: 'Due Diligence',
        nextSlug: 'financial-mistakes',
        nextTitle: 'Financial Mistakes',
        nextDescription: 'Protect cash flow from cost shocks and over-leverage.',
        personaIndex: 4,
        objectives: [
            {
                title: 'Research first',
                body: 'Write budget, yield target, suburbs, and deal-breakers before viewings. Measure listings against the brief — not FOMO.',
                whyItMatters:
                    'A written brief keeps emotion from setting the price.',
            },
            {
                title: 'Location truth',
                body: 'Judge location by real tenant demand, not staged amenity photos. Ask what rents and voids actually look like.',
                whyItMatters:
                    'You can renovate a kitchen — not a weak node.',
            },
            {
                title: 'Inspection',
                body: 'Inspect structure, damp, roof, plumbing, and electrics. Use a professional on serious candidates.',
                whyItMatters:
                    'Defects become your cash-flow problem after transfer.',
            },
            {
                title: 'Walk-away power',
                body: 'Set max price, minimum net yield, and deal-breakers in advance — then decline deals that fail the brief.',
                whyItMatters:
                    'Missing a mediocre deal is cheaper than owning a bad one.',
            },
        ],
        steps: [
            {
                label: 'Write the brief',
                detail:
                    'Before viewings, write budget, yield target, suburb list, and deal-breakers.\n\nThe brief is your FOMO brake.',
            },
            {
                label: 'Run comps',
                detail:
                    'Check sales and rental comps for every serious candidate.\n\nWithout comps, emotion sets the price.',
            },
            {
                label: 'Inspect properly',
                detail:
                    'Look past staging to structure, damp, roof, plumbing, and electrics — use a professional on finalists.\n\nDefects become your cash-flow problem after transfer.',
            },
            {
                label: 'Decide cold',
                detail:
                    'Sleep on emotional favourites and re-check the brief in the morning.\n\nWalk-away power is a pre-purchase skill, not a personality trait.',
            },
        ],
        timeline: [
            { title: 'Brief', detail: 'Criteria on paper.', duration: '1 day' },
            { title: 'Shortlist', detail: '3–5 candidates max.', duration: '1–3 weeks' },
            { title: 'Diligence', detail: 'Inspection and numbers.', duration: '3–10 days' },
        ],
        knowledge: [
            {
                variant: 'mistake',
                title: 'Emotional bidding',
                body: 'Overpaying because you “love the kitchen” wrecks yield forever.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Use a written investment brief to kill FOMO.',
            },
            {
                variant: 'warning',
                title: 'Skip the inspection',
                body: 'Hidden defects become your cash-flow problem.',
            },
            {
                variant: 'takeaway',
                title: 'Walk away',
                body: 'A missed deal is cheaper than a bad one.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'What should come before a strong emotional attachment to a listing?',
                options: [
                    { id: 'a', label: 'A written brief and hard numbers' },
                    { id: 'b', label: 'An instant full-price offer' },
                    { id: 'c', label: 'Ignoring comps' },
                    { id: 'd', label: 'Skipping inspections' },
                ],
                correctId: 'a',
                explanation: 'Criteria and numbers keep FOMO in check.',
            },
            {
                kind: 'true-false',
                prompt: 'Poor location choices can derail an otherwise pretty property.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'Demand and liquidity live in the micro-market.',
            },
        ],
    }),
    investorBp({
        slug: 'financial-mistakes',
        title: 'Financial Mistakes',
        subtitle:
            'Avoid cost blind spots, over-leverage, rate shocks, and empty reserves.',
        difficulty: 'beginner',
        minutes: 10,
        xp: 100,
        badgeLabel: 'Cash Guard',
        nextSlug: 'property-management-mistakes',
        nextTitle: 'Property Management Mistakes',
        nextDescription: 'Tenant and maintenance errors that cost thousands.',
        personaIndex: 5,
        objectives: [
            {
                title: 'Full cost stack',
                body: 'Budget transfer/bond costs, rates, levies, and insurance on top of the price. Build a cost sheet before you offer.',
                whyItMatters:
                    'Deposit-only thinking creates cash stress at transfer.',
            },
            {
                title: 'Over-leverage',
                body: 'Over-leverage means so much debt that a normal setback becomes a crisis. Cap LTV so buffers still exist.',
                whyItMatters:
                    'Thin buffers turn ordinary setbacks into emergencies.',
            },
            {
                title: 'Rate shocks',
                body: 'Model repayments 1–2% higher before you commit. If only today’s rate works, the deal is fragile.',
                whyItMatters:
                    'Stress testing beats restructuring under pressure.',
            },
            {
                title: 'Reserves',
                body: 'Keep liquid cash for voids and repairs — often about 2–3 months of property costs as a starting buffer.',
                whyItMatters:
                    'Reserves stop panic tenants and forced sales.',
            },
        ],
        steps: [
            {
                label: 'List every fee',
                detail:
                    'Build a sheet of once-off costs (transfer, bond, attorney) and monthly costs (rates, levies, insurance).\n\nDeposit-only budgeting is the classic financial mistake.',
            },
            {
                label: 'Stress rates',
                detail:
                    'Recalculate repayments at +1% and +2%. Thin deals flip negative fast.\n\nIf stress fails, cut price, raise deposit, or walk.',
            },
            {
                label: 'Cap leverage',
                detail:
                    'Set a maximum LTV and stick to it so life events and voids do not become crises.\n\nMore debt is not automatically more strategy.',
            },
            {
                label: 'Fund a reserve',
                detail:
                    'Keep liquid cash for voids and repairs before you buy the next unit.\n\nReserves are part of the purchase decision, not an afterthought.',
            },
        ],
        timeline: [
            { title: 'Cost sheet', detail: 'One-time and monthly.', duration: '1 day' },
            { title: 'Stress test', detail: 'Rate and vacancy.', duration: '1 day' },
            { title: 'Go / no-go', detail: 'Only if buffers survive.', duration: 'Same week' },
        ],
        knowledge: [
            {
                variant: 'mistake',
                title: 'Deposit only thinking',
                body: 'Transfer and bond costs can be a large extra cash hit.',
            },
            {
                variant: 'warning',
                title: 'Max LTV always',
                body: 'Leaves no room when rates rise or tenants leave.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'If the deal only works at perfect occupancy, it does not work.',
            },
            {
                variant: 'numbers',
                title: 'Reserve rule of thumb',
                body: 'Many investors keep 2–3 months of property costs liquid.',
            },
        ],
        quiz: [
            {
                kind: 'true-false',
                prompt: 'Purchase price is the only cash you need at transfer.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'Fees, deposits, and buffers sit on top of the headline price.',
            },
            {
                kind: 'mcq',
                prompt: 'Over-leveraging mainly increases…',
                options: [
                    { id: 'a', label: 'Downside risk when rates or vacancies move' },
                    { id: 'b', label: 'Guaranteed profits' },
                    { id: 'c', label: 'Tax-free status' },
                    { id: 'd', label: 'Tenant happiness automatically' },
                ],
                correctId: 'a',
                explanation: 'More debt means thinner buffers when reality shifts.',
            },
        ],
    }),
    investorBp({
        slug: 'property-management-mistakes',
        title: 'Property Management Mistakes',
        subtitle:
            'Fix weak screening, neglected maintenance, and fuzzy process before they cost you.',
        difficulty: 'beginner',
        minutes: 10,
        xp: 100,
        badgeLabel: 'Ops Aware',
        nextSlug: 'portfolio-strategy-mistakes',
        nextTitle: 'Portfolio Strategy Mistakes',
        nextDescription: 'Diversification, tax planning, and realistic expectations.',
        personaIndex: 4,
        objectives: [
            {
                title: 'Screen thoroughly',
                body: 'Verify affordability, payment behaviour, and references before handover — then use a clear written lease.',
                whyItMatters:
                    'Skipping checks to fill faster usually costs more than a short vacancy.',
            },
            {
                title: 'Maintain early',
                body: 'Fix damp, leaks, and safety issues while they are small. Log date, cost, and contractor for every job.',
                whyItMatters:
                    'Early fixes protect yield and long-term value.',
            },
            {
                title: 'Communicate',
                body: 'Set clear rules for rent, response times, and inspections in the lease — then apply them consistently.',
                whyItMatters:
                    'Clarity prevents most disputes.',
            },
            {
                title: 'Know the law',
                body: 'Learn the basics of deposits, notice, and fair process — get advice when cases get complex. This is education, not legal advice.',
                whyItMatters:
                    'Process mistakes turn ops issues into legal ones.',
            },
        ],
        steps: [
            {
                label: 'Standardise screening',
                detail:
                    'Use the same affordability, reference, and document checklist for every applicant.\n\nConsistency beats “this one feels fine”.',
            },
            {
                label: 'Ingoing inspection',
                detail:
                    'Photograph and sign condition at move-in. This is your baseline for deposits and disputes.\n\nSkip it and arguments become expensive stories.',
            },
            {
                label: 'Maintenance log',
                detail:
                    'Record date, issue, cost, and contractor for every job.\n\nPatterns (repeat damp, failing geyser) tell you where next year’s budget goes.',
            },
            {
                label: 'Review arrears weekly',
                detail:
                    'Act on late rent early with a clear process.\n\nSilence trains arrears; early contact protects yield.',
            },
        ],
        timeline: [
            { title: 'Screening', detail: 'Before approval.', duration: '3–7 days' },
            { title: 'Onboarding', detail: 'Lease and inspection.', duration: '1–3 days' },
            { title: 'Ops cadence', detail: 'Weekly rent, monthly checks.', duration: 'Ongoing' },
        ],
        knowledge: [
            {
                variant: 'mistake',
                title: 'Any tenant will do',
                body: 'Bad screening creates months of pain.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Respond to maintenance fast — it builds trust and protects the asset.',
            },
            {
                variant: 'warning',
                title: 'Ignore damp',
                body: 'Small moisture issues become structural and legal headaches.',
            },
            {
                variant: 'takeaway',
                title: 'Process beats personality',
                body: 'Friendly landlords still need firm systems.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'Inadequate tenant screening most often leads to…',
                options: [
                    { id: 'a', label: 'Arrears, damage, and vacancy cost' },
                    { id: 'b', label: 'Automatic capital growth' },
                    { id: 'c', label: 'Lower interest rates' },
                    { id: 'd', label: 'Free insurance forever' },
                ],
                correctId: 'a',
                explanation: 'Poor screening hits cash flow and asset condition.',
            },
            {
                kind: 'true-false',
                prompt: 'Maintenance neglect can damage both yield and long-term value.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'true',
                explanation: 'Deferred repairs compound into bigger bills and weaker exits.',
            },
        ],
    }),
    investorBp({
        slug: 'portfolio-strategy-mistakes',
        title: 'Portfolio Strategy Mistakes',
        subtitle:
            'How holdings work together — diversification, tax, realistic returns, and scalable ops.',
        difficulty: 'intermediate',
        minutes: 14,
        xp: 110,
        badgeLabel: 'Strategy Steady',
        nextSlug: 'strategies',
        nextTitle: 'Investment Strategies',
        nextDescription: 'Loop back and refine which strategy fits your next deal.',
        personaIndex: 5,
        objectives: [
            {
                title: 'What portfolio strategy means',
                body: 'A portfolio strategy is a mandate for how multiple holdings interact across micro-markets, leverage, ownership/tax structure, operating standards, and refinance or disposal rules. It is distinct from single-asset acquisition underwriting: adding doors without a portfolio mandate can increase concentration and operational risk without improving risk-adjusted return.',
                whyItMatters:
                    'Unit count is not a performance metric. Without concentration, leverage, and ops rules, growth can amplify correlated risk.',
                steps: [
                    {
                        label: 'List every holding',
                        detail:
                            'Write each property with suburb, stock type, debt, rent, and reserves attached to it.\n\nYou cannot steer a portfolio you have not mapped.',
                    },
                    {
                        label: 'Name the job of the portfolio',
                        detail:
                            'Is the portfolio meant to pay monthly income, grow equity, or both over a set horizon?\n\nOne sentence prevents buying random “opportunities”.',
                    },
                    {
                        label: 'Set portfolio rules',
                        detail:
                            'Define max leverage, max concentration in one node, and minimum reserves across all doors.\n\nRules turn stress into decisions.',
                    },
                    {
                        label: 'Schedule the review',
                        detail:
                            'Pick quarterly ops checks and an annual strategy reset with tax advice as complexity grows.\n\nWithout a calendar, strategy decays into drift.',
                    },
                ],
                deepDive: {
                    title: 'Portfolio strategy on paper',
                    body: 'A portfolio strategy page answers how your holdings work together — not how exciting the next listing looks.\n\nInclude:\n1) Purpose — income, growth, or balanced, with a time horizon.\n2) Inventory — every asset with node, yield/rent, debt, and vacancy history.\n3) Risk map — concentration by suburb, tenant type, and lender.\n4) Capital rules — max LTV, cash reserve target, and when you stop buying.\n5) Ops standard — screening, maintenance cadence, and when you outsource.\n6) Exit rules — refinance, sell, or hold triggers (rate, yield, life events).\n\nUpdate after every purchase and at least annually. Educational framework only — confirm tax, lending, and legal choices with professionals.',
                },
            },
            {
                title: 'Diversify thoughtfully',
                body: 'Diversification in direct property means reducing correlated exposure across micro-markets, stock types, and tenant profiles so that a single local demand, body-corporate, or employer-hub shock does not impair most of portfolio income simultaneously.\n\nAcquiring multiple identical units on one street increases scale; it does not, by itself, diversify risk. Diversify within competence — unfamiliar distant markets can add complexity without reducing correlation.',
                whyItMatters:
                    'Concentration risk is often invisible until a node softens. Measure exposure before you call additional purchases “diversification”.',
                steps: [
                    {
                        label: 'Measure concentration',
                        detail:
                            'Calculate what % of value and rent sits in one suburb, one stock type, or one tenant profile.\n\nIf one shock hits most of your income, you are concentrated.',
                    },
                    {
                        label: 'Choose a second node carefully',
                        detail:
                            'Add diversification inside your competence — a second understood micro-market beats a random city far away.\n\nUnknown markets add complexity without guaranteed safety.',
                    },
                    {
                        label: 'Diversify risk factors',
                        detail:
                            'Think beyond “more doors”: employer hubs, lease lengths, and debt types can correlate.\n\nTrue diversification spreads what can go wrong at the same time.',
                    },
                    {
                        label: 'Rebalance with intent',
                        detail:
                            'Sometimes diversification means selling or not buying again in the crowded node.\n\nGrowth and diversification are different jobs.',
                    },
                ],
                deepDive: {
                    title: 'Diversification on paper',
                    body: 'Draw a simple exposure chart: rows for each property, columns for node, stock type, tenant type, and % of portfolio rent.\n\nHighlight any column where one category exceeds your rule (for example more than half of rent from one suburb). That highlight is your next strategy decision: improve ops there, refinance, sell, or buy elsewhere.\n\nDiversification is not a moral goal — it is risk management for the income and equity you already built.',
                },
            },
            {
                title: 'Expect realism',
                body: 'Treat yields and growth as ranges. Double-digit cash yields every year are not a normal SA base case.',
                whyItMatters:
                    'Unrealistic targets push overpaying and over-leveraging.',
                deepDive: {
                    title: 'Return bands on paper',
                    body: 'Write three columns for every serious deal and for the portfolio: base, stress, and stretch.\n\nBase = realistic rent, normal voids, today’s costs.\nStress = higher rates and longer vacancy.\nStretch = optimistic rent/growth you will not rely on.\n\nYour strategy should fund life and debt in the base/stress columns. Stretch is optional upside — not the reason you buy.',
                },
            },
            {
                title: 'Plan tax early',
                body: 'Plan rental tax, CGT, and structure before you scale — with a registered practitioner as complexity grows.',
                whyItMatters:
                    'Late tax surprises shrink returns and force bad exits.',
                deepDive: {
                    title: 'Tax planning on paper',
                    body: 'Add a tax block to the portfolio page: how income is declared, what records you keep, and when you review structure with a practitioner.\n\nBefore a third or fourth unit — or before moving into a company/trust — book advice. Structure has cost. This module is educational, not tax advice.',
                },
            },
            {
                title: 'Scale on systems',
                body: 'Improve screening, maintenance, and reserves before adding another unit. Broken ops times unit count equals chaos.',
                whyItMatters:
                    'People and process come before door count.',
                deepDive: {
                    title: 'Scale readiness on paper',
                    body: 'Create a go/no-go checklist before the next purchase: screening checklist exists, maintenance log is current, reserves meet your rule, arrears process is clear, and you can absorb another void without panic.\n\nIf any box fails, invest in ops first. Unit count is not a strategy score.',
                },
            },
        ],
        steps: [
            {
                label: 'Write the portfolio plan',
                detail:
                    'On one page, state goals, allowed markets, leverage caps, reserve rules, and when you will sell or refinance.\n\nA portfolio without a plan is just a pile of deeds.',
            },
            {
                label: 'Map concentration',
                detail:
                    'List exposure by suburb, stock type, tenant profile, and debt. Three units on one street is growth — not diversification.\n\nConcentration risk should be visible, not accidental.',
            },
            {
                label: 'Set return bands',
                detail:
                    'Define base, stress, and stretch return cases for the portfolio — not a single brochure yield.\n\nStrategy succeeds when the base case is liveable.',
            },
            {
                label: 'Review annually',
                detail:
                    'Once a year, decide hold, improve, refinance, or sell with intent — and update tax/structure advice as complexity grows.\n\nReviews turn ownership into management.',
            },
            {
                label: 'Invest in ops first',
                detail:
                    'Fix screening, maintenance, and reserves before adding another door.\n\nBroken systems times more units equals more chaos.',
            },
        ],
        timeline: [
            {
                title: 'Portfolio review',
                detail: 'Check performance, concentration risk, vacancies, and debt headroom across all holdings.',
                duration: 'Quarterly',
            },
            {
                title: 'Tax check-in',
                detail: 'Review income, deductions, and structure with a registered practitioner as complexity grows.',
                duration: 'Annually',
            },
            {
                title: 'Strategy reset',
                detail: 'Update next acquisition criteria, leverage caps, and markets you will (and will not) buy in.',
                duration: 'Annually',
            },
        ],
        knowledge: [
            {
                variant: 'definition',
                title: 'Portfolio strategy',
                body: 'A mandate for how multiple holdings interact across micro-markets, leverage, tax/ownership structure, operations, and exit/refinance rules — distinct from single-asset acquisition underwriting.',
            },
            {
                variant: 'mistake',
                title: 'Unrealistic expectations',
                body: 'Assuming double-digit cash yields every year in every suburb as your base case.',
            },
            {
                variant: 'tip',
                title: 'Pro tip',
                body: 'Diversify across nodes and risk factors — not just “more of the same street”.',
            },
            {
                variant: 'warning',
                title: 'Growth for growth’s sake',
                body: 'More units with broken systems multiplies stress and multiplies mistakes.',
            },
            {
                variant: 'takeaway',
                title: 'Long game',
                body: 'Patient capital, realistic bands, and clean ops beat hype cycles.',
            },
        ],
        quiz: [
            {
                kind: 'mcq',
                prompt: 'What is a portfolio strategy?',
                options: [
                    {
                        id: 'a',
                        label: 'A plan for how holdings work together across markets, debt, tax, ops, and exits',
                    },
                    { id: 'b', label: 'Buying every listing in one suburb' },
                    { id: 'c', label: 'Ignoring tax until SARS writes to you' },
                    { id: 'd', label: 'Maximising unit count with no systems' },
                ],
                correctId: 'a',
                explanation: 'Portfolio strategy links holdings, risk, tax, operations, and exits — not just deal count.',
            },
            {
                kind: 'true-false',
                prompt: 'Diversification only means buying as many units as possible on one street.',
                options: [
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' },
                ],
                correctId: 'false',
                explanation: 'True diversification spreads micro-market and tenant risk.',
            },
            {
                kind: 'mcq',
                prompt: 'Before scaling unit count, prioritise…',
                options: [
                    { id: 'a', label: 'Working operations and cash buffers' },
                    { id: 'b', label: 'Maximum leverage on every deal' },
                    { id: 'c', label: 'Ignoring tax planning' },
                    { id: 'd', label: 'Skipping reviews forever' },
                ],
                correctId: 'a',
                explanation: 'Systems and reserves make scale sustainable.',
            },
        ],
    }),
];

export const INVESTOR_LESSONS: LessonModule[] = [
    ...BLUEPRINTS,
    ...INVESTOR_INSURANCE_BLUEPRINTS,
].map(buildLessonFromBlueprint);

export function getInvestorLesson(slug: string): LessonModule | null {
    return INVESTOR_LESSONS.find((l) => l.meta.slug === slug) || null;
}

export const INVESTOR_LEARN_ORDER = [...BLUEPRINTS, ...INVESTOR_INSURANCE_BLUEPRINTS].map((b) => b.slug);
