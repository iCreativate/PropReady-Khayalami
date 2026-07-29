export type KnowledgeArticle = {
    id: string;
    title: string;
    category: string;
    summary: string;
    body: string;
    faqs?: Array<{ q: string; a: string }>;
};

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
    {
        id: 'home-loans',
        title: 'How home loans (bonds) work in South Africa',
        category: 'Foundations',
        summary: 'A bond is a secured loan registered over property; you repay principal and interest over an agreed term.',
        body: `A South African home loan (bond) is typically an amortising loan: each instalment covers interest on the outstanding balance and a portion of principal. Early years are interest-heavy; later years repay more capital.

Banks and other lenders price loans using their cost of funds, risk, and competitive positioning. Many variable-rate loans are quoted as prime ± a margin. Affordability assessments, credit history, and valuations are central to approval decisions.

Smart Bond Optimizer models standard amortising maths for education — your loan agreement and lender statements are authoritative.`,
        faqs: [
            {
                q: 'Is a prequalification the same as approval?',
                a: 'No. Soft or indicative figures help planning. Formal approval follows lender underwriting.',
            },
        ],
    },
    {
        id: 'amortisation',
        title: 'Amortisation explained',
        category: 'Foundations',
        summary: 'Amortisation is the schedule of how each payment splits into interest and principal.',
        body: `Amortisation schedules show, month by month, how interest is calculated on the reducing balance and how principal declines. Extra payments that lenders allow to reduce capital can shorten the term and cut total interest in a standard model — subject to product rules (including access bonds).`,
    },
    {
        id: 'compound-interest',
        title: 'Compound interest on home loans',
        category: 'Foundations',
        summary: 'Interest is charged on the outstanding balance; unpaid interest can compound depending on product rules.',
        body: `On a performing amortising bond, interest is typically calculated on the outstanding capital. Paying more than the instalment (where permitted) reduces capital sooner, which reduces future interest in the model. Missing payments can increase costs and damage credit records.`,
    },
    {
        id: 'ltv',
        title: 'Loan-to-value (LTV) ratios',
        category: 'Equity & risk',
        summary: 'LTV compares the loan balance to property value and influences risk and product options.',
        body: `LTV = outstanding loan ÷ property value. Lower LTV generally means more equity cushion. Lenders may cap LTV for purchases or further advances. Estimated LTV in this tool uses your inputs — banks use their own valuations.`,
    },
    {
        id: 'repo-prime',
        title: 'Repo rate, prime rate, and bond pricing',
        category: 'Rates',
        summary: 'The SARB repo rate influences banking funding costs; prime is a reference rate many lenders use.',
        body: `The South African Reserve Bank sets the repo rate as a key monetary policy tool. Commercial banks publish a prime lending rate that often moves with the repo cycle. Home loans priced at “prime minus/plus” therefore often change when prime changes.

Historical rate paths are educational context only — they are not forecasts. Fixed-rate products behave differently during the fixed period.`,
    },
    {
        id: 'fixed-variable',
        title: 'Fixed vs variable interest',
        category: 'Rates',
        summary: 'Variable rates can move with prime; fixed rates offer payment certainty for a period, often with conditions.',
        body: `Variable (floating) rates can rise or fall, changing instalments and total interest. Fixed rates can help budgeting during the fixed term but may include break fees and eventually revert.

Neither option is universally “better”. Suitability depends on cash-flow buffers, risk tolerance, and product terms. Scenario tools here illustrate sensitivity — not predictions.`,
    },
    {
        id: 'refinancing',
        title: 'Refinancing and switching lenders',
        category: 'Strategy',
        summary: 'Refinancing replaces or restructures a loan; savings depend on rate, fees, term, and break costs.',
        body: `People explore refinancing for a lower rate, different term, cash-out (further advance), or product features. Always weigh initiation/legal fees, possible early settlement or break costs, and whether a longer term lowers the instalment but increases lifetime interest.

Estimates in Smart Bond Optimizer exclude many real-world fees unless you enter them.`,
    },
    {
        id: 'access-bonds',
        title: 'Access bonds (read-and-write facilities)',
        category: 'Strategy',
        summary: 'Some SA products let you deposit extras and later redraw prepaid funds, subject to rules.',
        body: `An access bond (or similar flexible facility) may allow prepaid amounts to reduce interest while remaining withdrawable up to agreed limits. Deposits can lower interest day-count on capital; withdrawals increase capital again and can extend costs.

Not every lender offers the same flexibility. Always confirm with your bank how interest is calculated on prepaid funds and what redraw conditions apply.`,
    },
    {
        id: 'transfer-costs',
        title: 'Transfer duty, transfer fees, and bond registration',
        category: 'Buying costs',
        summary: 'Buying property involves transfer duty (where applicable), conveyancing fees, and bond registration costs.',
        body: `Transfer duty is a tax on property acquisitions above threshold bands set in law (bands change over time — verify current SARS tables). Conveyancers charge professional fees; bond registration has separate costs when you register a new bond.

In-app transfer cost tools are educational approximations, not quotes.`,
    },
    {
        id: 'rental-yield',
        title: 'Rental yield, cash flow, and ROI',
        category: 'Investment',
        summary: 'Gross yield, net yield, and cash flow measure different aspects of rental performance.',
        body: `Gross yield ≈ annual rent ÷ property value. Net yield subtracts operating costs (rates, levies, insurance, maintenance, vacancy). Cash flow also subtracts bond instalments. ROI measures return on equity capital.

Positive paper yields can still produce negative cash flow with high gearing. Vacancy and maintenance are real risks.`,
    },
    {
        id: 'wealth-path',
        title: 'Property wealth roadmap (educational)',
        category: 'Wealth',
        summary: 'A staged view from first home to long-term portfolio thinking — without prescribing leverage.',
        body: `A balanced educational sequence many planners discuss: (1) sustainable primary residence bond, (2) emergency buffers, (3) interest reduction via extras/access deposits where suitable, (4) equity growth, (5) only then explore further property if income, credit, valuation, and risk appetite support it.

Borrowing against equity is never automatic — it requires lender approval.`,
    },
];

export const RATE_HISTORY_ILLUSTRATIVE = [
    { year: 2018, repo: 6.75, prime: 10.25 },
    { year: 2019, repo: 6.5, prime: 10.0 },
    { year: 2020, repo: 3.5, prime: 7.0 },
    { year: 2021, repo: 3.75, prime: 7.25 },
    { year: 2022, repo: 7.0, prime: 10.5 },
    { year: 2023, repo: 8.25, prime: 11.75 },
    { year: 2024, repo: 8.0, prime: 11.5 },
    { year: 2025, repo: 7.5, prime: 11.0 },
    { year: 2026, repo: 8.25, prime: 11.75 },
];
