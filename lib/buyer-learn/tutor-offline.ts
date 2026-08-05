import { listBuyerLessons } from '@/lib/buyer-learn/index';
import { INVESTOR_LESSONS } from '@/lib/buyer-learn/modules/investors';
import { SELLER_LESSONS } from '@/lib/buyer-learn/modules/sellers';
import type { LessonModule } from '@/lib/buyer-learn/types';
import { LEARNING_HUBS } from '@/lib/learning-hubs';

export type TutorKnowledgeEntry = {
    id: string;
    hub: 'buyers' | 'sellers' | 'investors' | 'propready' | 'general';
    title: string;
    keywords: string[];
    body: string;
    lessonTitle?: string;
};

const STOP = new Set([
    'a',
    'an',
    'the',
    'and',
    'or',
    'to',
    'of',
    'in',
    'on',
    'for',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'it',
    'this',
    'that',
    'with',
    'as',
    'at',
    'by',
    'from',
    'about',
    'into',
    'over',
    'after',
    'before',
    'between',
    'out',
    'up',
    'down',
    'what',
    'why',
    'how',
    'when',
    'where',
    'who',
    'which',
    'can',
    'could',
    'should',
    'would',
    'do',
    'does',
    'did',
    'me',
    'my',
    'i',
    'we',
    'you',
    'your',
    'please',
    'tell',
    'explain',
    'give',
    'need',
    'want',
]);

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9%\s\-]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 1 && !STOP.has(t));
}

function uniqueTokens(text: string): string[] {
    return Array.from(new Set(tokenize(text)));
}

function clip(text: string, max = 700): string {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= max) return cleaned;
    return `${cleaned.slice(0, max - 1).trim()}…`;
}

function hubFromPath(hubBasePath?: string): TutorKnowledgeEntry['hub'] {
    if (hubBasePath?.includes('investors')) return 'investors';
    if (hubBasePath?.includes('sellers')) return 'sellers';
    return 'buyers';
}

function lessonEntries(lesson: LessonModule, hub: TutorKnowledgeEntry['hub']): TutorKnowledgeEntry[] {
    const entries: TutorKnowledgeEntry[] = [];
    const lessonKw = uniqueTokens(`${lesson.meta.title} ${lesson.meta.subtitle} ${lesson.meta.slug}`);

    entries.push({
        id: `${hub}-${lesson.meta.slug}-overview`,
        hub,
        title: lesson.meta.title,
        lessonTitle: lesson.meta.title,
        keywords: lessonKw,
        body: `${lesson.meta.subtitle}\n\nThis ${hub} hub lesson covers: ${lesson.objectives.map((o) => o.title).join('; ')}.`,
    });

    for (const obj of lesson.objectives) {
        entries.push({
            id: `${hub}-${lesson.meta.slug}-obj-${obj.id}`,
            hub,
            title: `${lesson.meta.title}: ${obj.title}`,
            lessonTitle: lesson.meta.title,
            keywords: uniqueTokens(`${lesson.meta.title} ${obj.title} ${obj.body}`).slice(0, 40),
            body: `${obj.title}\n\n${clip(obj.body, 900)}`,
        });
    }

    for (const section of lesson.sections) {
        if (section.type === 'knowledge') {
            for (const block of section.blocks) {
                const text =
                    block.variant === 'myth-fact'
                        ? `Myth: ${block.myth || ''}\nFact: ${block.fact || block.body}`
                        : block.body;
                if (!text.trim()) continue;
                entries.push({
                    id: `${hub}-${lesson.meta.slug}-k-${block.id}`,
                    hub,
                    title: `${lesson.meta.title}: ${block.title}`,
                    lessonTitle: lesson.meta.title,
                    keywords: uniqueTokens(`${lesson.meta.title} ${block.title} ${text}`).slice(0, 30),
                    body: `${block.title} (${block.variant})\n\n${clip(text, 700)}`,
                });
            }
        }
    }

    if (lesson.chapters?.length) {
        for (const ch of lesson.chapters) {
            entries.push({
                id: `${hub}-${lesson.meta.slug}-ch-${ch.id}`,
                hub,
                title: `${lesson.meta.title}: ${ch.title}`,
                lessonTitle: lesson.meta.title,
                keywords: uniqueTokens(
                    `${lesson.meta.title} ${ch.title} ${ch.plainEnglish} ${ch.whyItMatters}`
                ).slice(0, 40),
                body: `${ch.title}\n\n${clip(ch.plainEnglish, 650)}\n\nWhy it matters: ${clip(ch.whyItMatters, 280)}`,
            });
        }
    }

    return entries;
}

const PROPREADY_ENTRIES: TutorKnowledgeEntry[] = [
    {
        id: 'pr-what',
        hub: 'propready',
        title: 'What is PropReady?',
        keywords: uniqueTokens(
            'what is propready prop ready ikhayalami platform property south africa learning education tools professionals'
        ),
        body: `PropReady (also styled PropReady · iKhayalami — “Your Home. Ready.”) is South Africa’s intelligent property platform. It combines immersive property education, decision tools (like the bond calculator and PropReady Score), and connections to verified professionals — estate agents, bond originators, and conveyancers.

It is not a traditional classifieds listing site. The focus is helping buyers, sellers, and investors learn, decide, and act with clarity before and during a property journey.

Core learning and buyer/seller journeys are free. Educational guidance only — PropReady does not replace a bank, conveyancer, insurer, or tax adviser.`,
    },
    {
        id: 'pr-why',
        hub: 'propready',
        title: 'Why PropReady?',
        keywords: uniqueTokens(
            'why propready benefits value purpose mission free buyers sellers learn decide connect'
        ),
        body: `Why PropReady exists: property decisions in South Africa are expensive and jargon-heavy. PropReady helps you:

1) Learn first — buyers, sellers, and investors hubs with immersive lessons on bonds, OTPs, transfer costs, insurance, selling process, yields, and more.
2) Decide with tools — educational calculators and scores so you see numbers before emotion.
3) Connect when ready — verified professionals when the process needs an agent, originator, or conveyancer.

Why people use it: free core journeys for buyers and sellers, South Africa–specific process education, and a single place to prepare before speaking to banks or attorneys.`,
    },
    {
        id: 'pr-who',
        hub: 'propready',
        title: 'Who PropReady is for',
        keywords: uniqueTokens(
            'who for audience buyers sellers investors agents originators conveyancers first-time'
        ),
        body: `PropReady is for:
- First-time and experienced home buyers
- Sellers preparing to list or transfer
- Property investors building buy-to-let or portfolio skills
- Professionals who serve them: PPRA-oriented agents, bond originators, and conveyancers (via professional portals)

Buyers and sellers start with Get Started / a short quiz, then use the Learning Center hubs at their own pace.`,
    },
    {
        id: 'pr-not',
        hub: 'propready',
        title: 'What PropReady is not',
        keywords: uniqueTokens(
            'not listing bank conveyancer replace advice credit legal tax insurance quote'
        ),
        body: `PropReady is not:
- A classic property classifieds marketplace (primary focus is learning + tools + professional connection)
- A bank or credit provider — it does not grant home loans
- A substitute for a conveyancer, attorney, insurer, or registered financial adviser

Formal credit decisions, legal transfer, insurance placement, and tax advice remain with the appropriate licensed professionals. PropReady educates so you arrive prepared.`,
    },
    {
        id: 'pr-start',
        hub: 'propready',
        title: 'How to start on PropReady',
        keywords: uniqueTokens(
            'how start begin get started quiz journey valuation learning center hub sign in'
        ),
        body: `How to start:
1) Buyers: open Get Started (/get-started) or the Buyers Learning Center (/learn), take the quiz when ready, then learn modules like home loans, prequal, transfer costs, and insurance.
2) Sellers: open the Sellers hub (/sellers) and Book a Free Valuation (/sellers/property-quiz) when you want agent-ready listing inputs.
3) Investors: open /learn/investors for strategy, returns, financing, tax basics, and landlord insurance.
4) Professionals: use Professionals sign-in to choose agent, bond originator, or conveyancer portals.

Learning hub modules unlock chapter by chapter with quizzes; AI Tutor can answer from lesson content even offline.`,
    },
    {
        id: 'pr-free',
        hub: 'propready',
        title: 'Is PropReady free?',
        keywords: uniqueTokens('free cost price buyers sellers paid professional plans'),
        body: `Core learning and buyer/seller journeys are free. You can learn and use educational tools at your own pace. Professional portals (agents, originators, conveyancers) may involve product or plan terms for those roles — buyer/seller education itself is positioned as 100% free for buyers and sellers.`,
    },
    {
        id: 'pr-hubs',
        hub: 'propready',
        title: 'Learning hubs on PropReady',
        keywords: uniqueTokens(
            'learning hub buyers sellers investors modules center education courses'
        ),
        body: `PropReady Learning Center has three public hubs:
${LEARNING_HUBS.map((h) => `- ${h.title} (${h.href}): ${h.description}`).join('\n')}

Each hub has immersive lessons with chapters, South African case studies, quizzes, and progress tracking.`,
    },
    {
        id: 'pr-brand',
        hub: 'propready',
        title: 'PropReady iKhayalami meaning',
        keywords: uniqueTokens('ikhayalami your home ready brand name meaning south africa'),
        body: `PropReady · iKhayalami pairs “PropReady” with “iKhayalami” — signalling home and readiness in a South African context. The product line “Your Home. Ready.” means arriving at bonds, offers, and transfer prepared through learning and tools, not guessing.`,
    },
];

const PROPERTY_GLOSSARY: Array<{ id: string; title: string; aliases: string; body: string }> = [
    {
        id: 'gloss-valuation',
        title: 'Property valuation',
        aliases: 'property valuation valuation market valuation value appraisal estimate worth cma comparative',
        body: `A property valuation is an estimate of what a property is likely worth in the current market — usually for selling, buying, refinancing, or insurance rebuild context.

In South African residential practice you’ll often hear:
• Agent / market valuation or CMA (Comparative Market Analysis): uses recent comparable sales, competing listings, condition, and local demand. It is an evidence-based estimate, not a guaranteed sale price.
• Bank valuation: the lender’s assessment of security value when granting a home loan. The bank may value lower than the asking price.
• Formal valuation (valuer): a more formal report by a professional valuer — sometimes required for deceased estates, disputes, or certain lending cases.
• Municipal valuation: used for rates — not the same as market price.

A PropReady “Book a Free Valuation” path helps sellers capture listing-ready inputs and connect toward agent valuations — it is educational preparation, not a bank or municipal valuation certificate.

Educational only — confirm figures with agents, valuers, or lenders.`,
    },
    {
        id: 'gloss-cma',
        title: 'Comparative Market Analysis (CMA)',
        aliases: 'cma comparative market analysis comps comparable sales',
        body: `A CMA compares your property to recent sold homes and active listings that are similar in size, condition, and location. Agents use it to recommend an asking-price band. Prefer sold evidence over asking prices. A CMA is not a deed-office fact or a promise of sale proceeds.`,
    },
    {
        id: 'gloss-bond',
        title: 'Home loan (bond)',
        aliases: 'bond home loan mortgage home loan bond registration mortgagee',
        body: `A home loan (bond) is credit used to buy property, secured by a mortgage bond registered over that property at the Deeds Office until the debt is settled. You own the home subject to the bank’s registered security. Affordability is assessed under the National Credit Act. Confirm live rates and approval with lenders or a bond originator.`,
    },
    {
        id: 'gloss-deposit',
        title: 'Deposit',
        aliases: 'deposit down payment equity ltv loan to value',
        body: `A deposit is the portion of the purchase price you pay from your own funds (not the bond). Higher deposits usually mean lower LTV (loan-to-value) and can improve pricing odds. Deposit cash is separate from transfer costs, bond registration fees, and moving buffers.`,
    },
    {
        id: 'gloss-prequal',
        title: 'Prequalification (soft vs full)',
        aliases: 'prequal prequalification soft prequal full assessment affordability credit check',
        body: `Soft prequalification is an early affordability estimate from declared income/expenses (and sometimes a soft credit view). Full assessment / formal application uses full documents and typically a hard credit enquiry. Soft estimates are planning tools — not guarantees of grant.`,
    },
    {
        id: 'gloss-otp',
        title: 'Offer to Purchase (OTP)',
        aliases: 'otp offer to purchase deed of sale agreement sale contract suspensive',
        body: `The Offer to Purchase (OTP) is the written contract for buying/selling a property. It sets price, deposits, occupation, and suspensive conditions (often bond approval). Read every annexure before signing. Pay only into the conveyancer’s trust account — never a personal account.`,
    },
    {
        id: 'gloss-suspensive',
        title: 'Suspensive conditions',
        aliases: 'suspensive condition bond clause subject to finance conditions precedent',
        body: `Suspensive conditions are requirements that must be met for the sale to become fully binding — commonly buyer bond approval by a deadline. If the condition fails and the clause is properly used, the deal typically falls away under the OTP’s terms. Deadlines matter.`,
    },
    {
        id: 'gloss-conveyancer',
        title: 'Conveyancer',
        aliases: 'conveyancer transfer attorney conveyancing deeds office registration',
        body: `A conveyancer is an attorney who handles property transfer and related Deeds Office registration. They manage FiCA, clearances, guarantees, and registration. Buyers and sellers usually each have conveyancing representation depending on the deal structure. PropReady educates — conveyancers do the legal transfer.`,
    },
    {
        id: 'gloss-transfer-duty',
        title: 'Transfer duty',
        aliases: 'transfer duty transfer cost SARS vat property purchase tax',
        body: `Transfer duty is a tax often payable when acquiring property (subject to SARS rules and exemptions). Some deals are VAT-supply instead of transfer duty. Amounts and brackets change — get a conveyancer estimate for your price and deal type. Duty is separate from the deposit.`,
    },
    {
        id: 'gloss-occupation',
        title: 'Occupation vs registration',
        aliases: 'occupation registration occupational rent interest take occupation transfer date',
        body: `Occupation is when you physically move in. Registration is when ownership usually transfers at the Deeds Office. They can fall on different dates. If you occupy before registration, occupational interest/rent may apply under the OTP. Confirm risk and insurance for the in-between period.`,
    },
    {
        id: 'gloss-fica',
        title: 'FiCA',
        aliases: 'fica fica documents know your customer identity proof of address',
        body: `FiCA (Financial Intelligence Centre Act) requires institutions to verify identity and related information. Expect ID, proof of residence, and sometimes source-of-funds questions from banks, conveyancers, and agents. Incomplete FiCA packs delay bonds and transfers.`,
    },
    {
        id: 'gloss-agent',
        title: 'Estate agent',
        aliases: 'estate agent realtor property agent ppra mandate commission',
        body: `An estate agent markets and negotiates property sales (and sometimes rentals) under a mandate. In SA, check PPRA registration. Commission is often seller-paid and set in the mandate. Buyers should still understand incentives and never pay deposits into personal accounts.`,
    },
    {
        id: 'gloss-mandate',
        title: 'Sole vs open mandate',
        aliases: 'sole mandate open mandate dual mandate listing agreement',
        body: `A mandate is the seller’s written appointment of an agent. Sole mandate: typically one agency for a period. Open mandate: multiple agencies may market. Read duration, commission, cancellation, and marketing commitments before signing.`,
    },
    {
        id: 'gloss-building-insurance',
        title: 'Building insurance',
        aliases: 'building insurance homeowners cover structure insurance bond insurance required',
        body: `Building (homeowners) insurance covers the structure against insured events as defined in the policy. Lenders usually require continuous building cover while a bond is registered, with the bank noted as interested party. Sum insured should track rebuild cost — not purchase price. Contents is separate.`,
    },
    {
        id: 'gloss-contents',
        title: 'Contents insurance',
        aliases: 'contents insurance household goods movable belongings',
        body: `Contents insurance covers movable household goods (furniture, appliances, clothing, electronics) subject to wording, excesses, and security warranties. On sectional title, the body corporate often insures the building — owners still typically need contents cover.`,
    },
    {
        id: 'gloss-sectional',
        title: 'Sectional title',
        aliases: 'sectional title body corporate levy scheme unit apartment complex',
        body: `Sectional title means you own a section (e.g. a unit) plus an undivided share in common property, governed by a body corporate. Levies fund shared costs and usually building insurance for the scheme. Always confirm levy amounts, special levies, and what the scheme policy covers.`,
    },
    {
        id: 'gloss-freehold',
        title: 'Freehold / freestanding',
        aliases: 'freehold freestanding full title erf stand',
        body: `Freehold (full title) usually means you own the erf/stand and the dwelling on it, subject to municipal rates and any registered bonds or servitudes. You typically arrange your own building insurance (unlike many sectional schemes where the body corporate covers the building).`,
    },
    {
        id: 'gloss-rates',
        title: 'Rates and taxes',
        aliases: 'rates taxes municipal rates clearance certificate levies',
        body: `Municipal rates (and related charges) are billed on property ownership. On transfer, a rates clearance certificate is typically required. Sellers should settle arrears; buyers should budget ongoing rates after registration. Levies apply in sectional schemes in addition to rates where applicable.`,
    },
    {
        id: 'gloss-originator',
        title: 'Bond originator',
        aliases: 'bond originator mortgage originator home loan intermediary compare banks',
        body: `A bond originator helps package and submit home-loan applications to one or more lenders. They can compare options; the bank still decides credit. Using an originator does not remove NCA affordability rules or the need for complete documents.`,
    },
    {
        id: 'gloss-flisp',
        title: 'FLISP / finance-linked subsidy',
        aliases: 'flisp subsidy first time buyer government subsidy finance linked',
        body: `FLISP (and successor programme branding) can help qualifying first-time buyers bridge an affordability gap when taking a home loan. Eligibility, income bands, and amounts change — never budget a subsidy until you verify current rules with official sources and your lender/originator.`,
    },
    {
        id: 'gloss-yield',
        title: 'Rental yield',
        aliases: 'yield rental yield gross yield net yield roi return cash flow vacancy',
        body: `Gross yield roughly compares annual rent to property price. Net yield subtracts costs (rates, levies, insurance, maintenance, vacancy, fees) before or after financing depending on your model. Investors should stress-test vacancy and rate increases — excitement is not underwriting.`,
    },
    {
        id: 'gloss-capital-gains',
        title: 'Capital gains tax (property)',
        aliases: 'cgt capital gains tax primary residence exclusion sars sale profit',
        body: `When you dispose of property, capital gains tax concepts may apply under SARS rules, with possible primary-residence relief subject to conditions. This is high-level education only — get tax advice for your facts before you sell or restructure.`,
    },
    {
        id: 'gloss-deceased-estate',
        title: 'Deceased estate property',
        aliases: 'deceased estate executor letters of executorship estate late',
        body: `Property in a deceased estate is sold or transferred under estate administration. Expect executor authority (letters of executorship), possible Master’s Office timelines, and extra conveyancing steps. Buyers should verify authority before paying deposits.`,
    },
    {
        id: 'gloss-trust',
        title: 'Buying or selling via a trust',
        aliases: 'trust property trustees resolution letter of authority',
        body: `Trust deals need proper trustee authority and documents (e.g. letters of authority, resolutions). Banks and conveyancers scrutinise capacity. Do not sign a personal OTP if the buyer/seller is meant to be the trust.`,
    },
    {
        id: 'gloss-asking-price',
        title: 'Asking price vs market value',
        aliases: 'asking price list price market value offer price',
        body: `Asking price is what the seller advertises. Market value is the evidenced likely transaction price. Overpricing relative to comps usually lengthens days on market. Buyers should underwrite value from evidence, not only the ticket price.`,
    },
    {
        id: 'gloss-bank-valuation',
        title: 'Bank valuation',
        aliases: 'bank valuation security value loan valuation panel valuer',
        body: `A bank valuation estimates the property’s security value for lending. If the bank values below the purchase price, you may need a larger deposit or a renegotiation. It is separate from an agent CMA and from municipal valuation.`,
    },
    {
        id: 'gloss-rebuild',
        title: 'Rebuild cost / sum insured',
        aliases: 'rebuild cost sum insured replacement cost underinsurance average',
        body: `Insurance sum insured for buildings should reflect rebuild/replacement cost, not market price (which includes land). Underinsurance can reduce claims via average. Revisit sums after renovations or cost inflation.`,
    },
    {
        id: 'gloss-clearance',
        title: 'Clearance certificates',
        aliases: 'rates clearance levy clearance electrical compliance certificates',
        body: `Transfer often needs certificates such as rates clearance and, for sectional title, levy clearance. Compliance certificates (e.g. electrical) may be required under the OTP or practice. Missing clearances delay registration.`,
    },
    {
        id: 'gloss-occupational-interest',
        title: 'Occupational interest / rent',
        aliases: 'occupational interest occupational rent early occupation',
        body: `If a buyer occupies before registration (or a seller stays after), the OTP may charge occupational interest/rent for that period. Confirm the rate, start date, and who carries risk/insurance in writing.`,
    },
    {
        id: 'gloss-ltv',
        title: 'Loan-to-value (LTV)',
        aliases: 'ltv loan to value gearing leverage',
        body: `LTV is the loan amount divided by the property’s relevant value (often purchase price or bank valuation). Higher LTV means more leverage and often stricter credit pricing. Deposit percentage is the main lever buyers control.`,
    },
];

const GENERAL_SA_ENTRIES: TutorKnowledgeEntry[] = [
    ...PROPERTY_GLOSSARY.map((g) => ({
        id: g.id,
        hub: 'general' as const,
        title: g.title,
        keywords: uniqueTokens(`${g.title} ${g.aliases} what is definition mean meaning`),
        body: g.body,
    })),
    {
        id: 'sa-property-journey',
        hub: 'general',
        title: 'South African property journey overview',
        keywords: uniqueTokens(
            'property journey buy sell invest south africa process steps overview how property works'
        ),
        body: `Typical SA residential paths:
• Buyers: learn → prequal → search → OTP → bond → conveyancing → registration/occupation.
• Sellers: valuation/CMA → mandate → marketing → offers → bond cancellation/costs → transfer.
• Investors: strategy → underwrite yield/costs/insurance → finance → manage tenants → review portfolio.

PropReady’s hubs teach each stage. Formal credit, legal transfer, and advice stay with licensed professionals.`,
    },
];


let cachedEntries: TutorKnowledgeEntry[] | null = null;

export function getTutorKnowledgeEntries(): TutorKnowledgeEntry[] {
    if (cachedEntries) return cachedEntries;

    const entries: TutorKnowledgeEntry[] = [
        ...PROPREADY_ENTRIES,
        ...GENERAL_SA_ENTRIES,
    ];

    for (const lesson of listBuyerLessons()) {
        entries.push(...lessonEntries(lesson, 'buyers'));
    }
    for (const lesson of SELLER_LESSONS) {
        entries.push(...lessonEntries(lesson, 'sellers'));
    }
    for (const lesson of INVESTOR_LESSONS) {
        entries.push(...lessonEntries(lesson, 'investors'));
    }

    cachedEntries = entries;
    return entries;
}

function scoreEntry(
    entry: TutorKnowledgeEntry,
    tokens: string[],
    preferredHub: TutorKnowledgeEntry['hub'],
    lessonTitle: string,
    rawQuery = ''
): number {
    if (tokens.length === 0) return 0;
    let score = 0;
    const titleTokens = new Set(tokenize(entry.title));
    const kw = new Set(entry.keywords);
    const bodyTokens = new Set(tokenize(entry.body).slice(0, 80));
    const q = rawQuery.toLowerCase();

    for (const t of tokens) {
        if (titleTokens.has(t)) score += 6;
        if (kw.has(t)) score += 4;
        if (bodyTokens.has(t)) score += 1;
        if (entry.lessonTitle && tokenize(entry.lessonTitle).includes(t)) score += 2;
    }

    // “What is a property valuation?” → strong glossary title match
    if (/what (is|are)|what'?s|define|meaning of|explain/i.test(q)) {
        const title = entry.title.toLowerCase();
        if (tokens.some((t) => title.includes(t) && t.length > 3)) score += 10;
        if (entry.id.startsWith('gloss-')) score += 6;
        // Phrase overlap: valuation, otp, etc.
        const significant = tokens.filter((t) => t.length > 3);
        const hitAll = significant.length > 0 && significant.every((t) => title.includes(t) || kw.has(t));
        if (hitAll) score += 14;
    }

    if (entry.hub === 'general' && entry.id.startsWith('gloss-')) score += 2;
    if (entry.hub === preferredHub) score += 3;
    if (entry.hub === 'propready' && tokens.some((t) => t.includes('propready') || t === 'prop' || t === 'ready' || t === 'ikhayalami')) {
        score += 12;
    }
    if (lessonTitle && entry.lessonTitle && entry.lessonTitle.toLowerCase() === lessonTitle.toLowerCase()) {
        score += 8;
    }

    return score;
}

function findGlossaryDefinition(message: string): TutorKnowledgeEntry | null {
    const q = message.toLowerCase();
    const whatMatch = q.match(
        /(?:what (?:is|are)|what'?s|define|explain|meaning of)\s+(?:a |an |the )?(.+?)[\s?!.]*$/i
    );
    const subject = (whatMatch?.[1] || q).replace(/^(a|an|the)\s+/i, '').trim();
    if (!subject || subject.length < 3) return null;

    const subjectTokens = uniqueTokens(subject);
    const glossary = getTutorKnowledgeEntries().filter((e) => e.id.startsWith('gloss-'));

    let best: { entry: TutorKnowledgeEntry; score: number } | null = null;
    for (const entry of glossary) {
        const title = entry.title.toLowerCase();
        let score = 0;
        if (title === subject || title.includes(subject) || subject.includes(title)) score += 30;
        for (const t of subjectTokens) {
            if (title.includes(t)) score += 8;
            if (entry.keywords.includes(t)) score += 5;
        }
        // Common synonym: valuation / property valuation
        if (/valuat/.test(subject) && /valuat/.test(title)) score += 20;
        if (best === null || score > best.score) best = { entry, score };
    }

    return best && best.score >= 12 ? best.entry : null;
}

function isPropReadyQuestion(q: string): boolean {
    return /propready|prop\s*ready|ikhayalami|what is this (app|platform|site)|why (use |should i use )?propready/i.test(
        q
    );
}

function propReadyFocusId(q: string): string | null {
    const lower = q.toLowerCase();
    if (/what is|what'?s|define|explain what/.test(lower) && /propready|prop\s*ready|ikhayalami|this (app|platform|site)/.test(lower)) {
        return 'pr-what';
    }
    if (/why/.test(lower) && /propready|prop\s*ready|use it|should i/.test(lower)) {
        return 'pr-why';
    }
    if (/who .+ for|who is it for|audience/.test(lower)) return 'pr-who';
    if (/free|cost|price/.test(lower) && /propready|prop\s*ready|buyer|seller/.test(lower)) {
        return 'pr-free';
    }
    if (/how (do i |to )?start|get started/.test(lower)) return 'pr-start';
    if (/not a |isn'?t a |replace|listing site/.test(lower)) return 'pr-not';
    if (/learning hub|modules|buyers hub|sellers hub|investors hub/.test(lower)) return 'pr-hubs';
    return null;
}

function isSummariseLesson(q: string): boolean {
    return /summar(y|ise|ize)|overview|what is this lesson|recap this/i.test(q);
}

function formatAnswer(
    query: string,
    matches: TutorKnowledgeEntry[],
    lessonTitle: string,
    opts?: { conversational?: boolean; followUpHint?: string; userName?: string }
): string {
    const conversational = opts?.conversational !== false;
    const name = opts?.userName;

    if (matches.length === 0) {
        return conversational
            ? address(
                  name,
                  `I’m with you — I might need a bit more detail on that. Are you asking about bonds, transfer costs, insurance, selling, investing, or what PropReady is?\n\nWe’re in “${lessonTitle}” if you want me to stick to this lesson.`
              )
            : address(
                  name,
                  `I don’t have a perfect match yet. Try bonds, transfer costs, OTPs, insurance, selling, investing, or what PropReady is.`
              );
    }

    const primary = matches[0];
    const secondary = matches[1];
    const topicLabel = primary.title.includes(':')
        ? primary.title.split(':').slice(1).join(':').trim()
        : primary.title;

    let core = '';
    if (isPropReadyQuestion(query) || primary.hub === 'propready') {
        core = clip(primary.body, 650);
    } else if (isSummariseLesson(query)) {
        core = `Quick take on “${primary.lessonTitle || lessonTitle}”: ${clip(primary.body, 520)}`;
    } else {
        core = clip(primary.body, 580);
    }

    let reply = conversational
        ? address(name, `Got it — here’s the useful bit on ${topicLabel}.\n\n${core}`)
        : core;

    if (secondary && conversational) {
        reply += `\n\nAlso worth knowing: ${clip(secondary.body, 220)}`;
    }

    const followUp =
        opts?.followUpHint ||
        (primary.hub === 'propready'
            ? 'Want how to get started as a buyer, seller, or investor next?'
            : preferredFollowUp(primary, lessonTitle));

    reply += `\n\n${followUp}`;
    return reply;
}

function preferredFollowUp(entry: TutorKnowledgeEntry, lessonTitle: string): string {
    if (entry.hub === 'sellers') return 'Want pricing, mandates, or selling costs next?';
    if (entry.hub === 'investors') return 'Want yields, financing, or landlord insurance next?';
    if (/insurance|cover|insurer/i.test(entry.title + entry.body)) {
        return 'Want building vs contents, or what happens if cover lapses?';
    }
    if (/bond|prequal|loan|deposit/i.test(entry.title + entry.body)) {
        return 'Want a simple cash-beyond-deposit checklist next?';
    }
    return `Want me to go deeper, or switch back to “${lessonTitle}”?`;
}

export type TutorHistoryTurn = { role: 'user' | 'assistant'; content: string };

export type OfflineTutorContext = {
    message: string;
    lessonTitle?: string;
    lessonSubtitle?: string;
    hubBasePath?: string;
    history?: TutorHistoryTurn[];
    userName?: string;
};

function address(name: string | undefined, sentence: string): string {
    const n = name?.trim();
    if (!n) return sentence;
    if (new RegExp(`^${n}\\b`, 'i').test(sentence.trim())) return sentence;
    return `${n}, ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
}

function isGreeting(q: string): boolean {
    const t = q.trim();
    return (
        /^(hi|h+i+|hello|hey|howdy|good\s*(morning|afternoon|evening)|hola|sawubona)(\s+[a-z'’]+){0,4}[\s!?.]*$/i.test(
            t
        ) || /^(how are you|how’s it going|hows it going|whats up|what’s up)[\s!?.]*$/i.test(t)
    );
}

function isThanks(q: string): boolean {
    return /^(thanks|thank you|thx|cheers|great|awesome|perfect|cool|ok thanks|okay thanks)[\s!?.]*$/i.test(
        q.trim()
    );
}

function isAffirmation(q: string): boolean {
    return /^(yes|yeah|yep|sure|please|ok|okay|do it|go ahead|please do)[\s!?.]*$/i.test(
        q.trim()
    );
}

function isDeepen(q: string): boolean {
    return /^(tell me more|more detail|go deeper|elaborate|continue|next|more)[\s!?.]*$/i.test(
        q.trim()
    );
}

function isNegation(q: string): boolean {
    return /^(no|nope|nah|not now|maybe later|stop|that’s enough|thats enough)[\s!?.]*$/i.test(
        q.trim()
    );
}

function isHelp(q: string): boolean {
    return /^(help|what can you (do|help with)|how do you work)\??$/i.test(q.trim());
}

function lastAssistantOffer(history: TutorHistoryTurn[]): string | null {
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role !== 'assistant') continue;
        const text = history[i].content;
        const want = text.match(/want[^.?!\n]*\?/i);
        if (want) return want[0].replace(/\?$/, '');
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        const last = lines[lines.length - 1];
        if (last?.includes('?')) return last.replace(/\?$/, '');
    }
    return null;
}

function lastAssistantTopic(history: TutorHistoryTurn[]): string {
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role !== 'assistant') continue;
        // Prefer the “useful bit on X” line or first substantive paragraph
        const useful = history[i].content.match(/useful bit on ([^.\n]+)/i);
        if (useful) return useful[1].trim();
        return clip(history[i].content, 220);
    }
    return '';
}

function expandWithHistory(message: string, history: TutorHistoryTurn[]): string {
    const trimmed = message.trim();
    // "what about building insurance" already has a clear topic — don't drag prior turns in
    if (
        /^(and|also|what about|how about|same for)\s+.+/i.test(trimmed) &&
        trimmed.split(/\s+/).length >= 3
    ) {
        return trimmed;
    }

    const isShortBridge = trimmed.split(/\s+/).length <= 4;
    if (!isShortBridge || history.length === 0) return message;

    const priorUsers = history
        .filter((h) => h.role === 'user')
        .slice(-2)
        .map((h) => h.content)
        .join(' ');
    return `${trimmed} ${priorUsers}`.trim();
}

function conversationalIntentReply(
    message: string,
    lessonTitle: string,
    hubBasePath: string | undefined,
    history: TutorHistoryTurn[],
    userName?: string
): string | null {
    const hub = hubFromPath(hubBasePath);
    const hubHint =
        hub === 'sellers'
            ? 'selling, pricing, mandates, or insurance while you sell'
            : hub === 'investors'
              ? 'yields, financing, or landlord cover'
              : 'bonds, prequal, transfer costs, or insurance';
    const name = userName?.trim();

    if (isGreeting(message)) {
        return name
            ? `Hey ${name} — good to chat again. I’m your PropReady tutor for “${lessonTitle}”.\n\nAsk me anything about ${hubHint}, what PropReady is, or say “summarise this lesson”.\n\nWhat would you like to clear up first?`
            : `Hey — good to meet you. I’m your PropReady tutor for “${lessonTitle}”.\n\nAsk me anything about ${hubHint}, what PropReady is, or say “summarise this lesson” and I’ll keep it practical.\n\nWhat would you like to clear up first?`;
    }

    if (isThanks(message)) {
        return name
            ? `Anytime, ${name}. If you want to keep going, we can dig into ${hubHint} — or I can recap “${lessonTitle}”. What’s next?`
            : `Anytime. If you want to keep going, we can dig into ${hubHint} — or I can recap “${lessonTitle}”. What’s next?`;
    }

    if (isNegation(message)) {
        return name
            ? `No problem, ${name}. I’m here when you need me — just ask about ${hubHint} or PropReady whenever you’re ready.`
            : `No problem. I’m here when you need me — just ask about ${hubHint} or PropReady whenever you’re ready.`;
    }

    if (isHelp(message)) {
        return `${name ? `${name}, I` : 'I'} can help in plain English with almost anything property-related in South Africa — for example:\n• Definitions (valuation, OTP, bond, transfer duty, CMA, FiCA…)\n• What PropReady is and why it exists\n• This lesson (“${lessonTitle}”)\n• Buying, selling, insurance, and investing steps\n\nAsk normally — “what is a property valuation?” works great. What should we start with?`;
    }

    if (isAffirmation(message)) {
        const offer = lastAssistantOffer(history);
        if (offer) {
            return null;
        }
        return name
            ? `Sure, ${name} — want a quick summary of “${lessonTitle}”, or shall we pick ${hubHint}?`
            : `Sure — want a quick summary of “${lessonTitle}”, or shall we pick ${hubHint}?`;
    }

    if (isDeepen(message)) {
        return null;
    }

    return null;
}

/** Local retrieval tutor — works without OPENAI_API_KEY; supports basic conversation. */
export function answerTutorOffline(ctx: OfflineTutorContext): string {
    const message = ctx.message.trim();
    const lessonTitle = ctx.lessonTitle || 'this lesson';
    const preferredHub = hubFromPath(ctx.hubBasePath);
    const history = (ctx.history || []).slice(-12);
    const entries = getTutorKnowledgeEntries();

    const intent = conversationalIntentReply(
        message,
        lessonTitle,
        ctx.hubBasePath,
        history,
        ctx.userName
    );
    if (intent) return intent;

    let retrievalQuery = message;
    if (isAffirmation(message)) {
        retrievalQuery = lastAssistantOffer(history) || `summarise ${lessonTitle}`;
    } else if (isDeepen(message)) {
        retrievalQuery = lastAssistantTopic(history) || lessonTitle;
    } else {
        retrievalQuery = expandWithHistory(message, history);
    }

    const tokens = uniqueTokens(
        `${retrievalQuery} ${isSummariseLesson(retrievalQuery) || isSummariseLesson(message) ? lessonTitle : ''} ${ctx.lessonSubtitle || ''}`
    );

    const focusId = propReadyFocusId(message) || propReadyFocusId(retrievalQuery);
    if (focusId) {
        const focused = entries.find((e) => e.id === focusId);
        const related = entries
            .filter((e) => e.hub === 'propready' && e.id !== focusId)
            .slice(0, 1);
        if (focused) {
            return formatAnswer(message, [focused, ...related], lessonTitle, {
                conversational: true,
                userName: ctx.userName,
            });
        }
    }

    // Direct glossary answers for “what is a property valuation?” etc.
    const glossaryHit = findGlossaryDefinition(message) || findGlossaryDefinition(retrievalQuery);
    if (glossaryHit && /what (is|are)|what'?s|define|explain|meaning of/i.test(message)) {
        return formatAnswer(message, [glossaryHit], lessonTitle, {
            conversational: true,
            followUpHint: 'Want how this shows up when buying, selling, or getting a bond?',
            userName: ctx.userName,
        });
    }

    const scored = entries
        .map((entry) => ({
            entry,
            score: scoreEntry(entry, tokens, preferredHub, lessonTitle, message),
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);

    if (isPropReadyQuestion(message) && !/insurance|bond|transfer|otp|yield|agent/i.test(message)) {
        const pr = entries.filter((e) => e.hub === 'propready');
        const prScored = pr
            .map((entry) => ({
                entry,
                score: scoreEntry(entry, tokens, preferredHub, lessonTitle, message) + 5,
            }))
            .sort((a, b) => b.score - a.score);
        return formatAnswer(
            message,
            prScored.slice(0, 2).map((x) => x.entry),
            lessonTitle,
            { conversational: true, userName: ctx.userName }
        );
    }

    if (isSummariseLesson(message) || isSummariseLesson(retrievalQuery)) {
        const lessonMatches = entries.filter(
            (e) =>
                e.lessonTitle?.toLowerCase() === lessonTitle.toLowerCase() &&
                e.id.includes('-overview')
        );
        if (lessonMatches[0]) {
            const chapterBits = entries
                .filter(
                    (e) =>
                        e.lessonTitle?.toLowerCase() === lessonTitle.toLowerCase() &&
                        e.id.includes('-obj-')
                )
                .slice(0, 2);
            return formatAnswer(message, [lessonMatches[0], ...chapterBits], lessonTitle, {
                conversational: true,
                followUpHint: 'Want the first chapter explained more slowly?',
                userName: ctx.userName,
            });
        }
    }

    const top = scored.slice(0, 6).map((x) => x.entry);
    const deduped: TutorKnowledgeEntry[] = [];
    const seenIds = new Set<string>();
    for (const e of top) {
        if (seenIds.has(e.id)) continue;
        seenIds.add(e.id);
        deduped.push(e);
        if (deduped.length >= 2) break;
    }

    // Very weak match → conversational clarification instead of empty dump
    if (!deduped.length || (scored[0]?.score ?? 0) < 4) {
        const recentUser = [...history].reverse().find((h) => h.role === 'user')?.content;
        if (recentUser && recentUser !== message) {
            const bridged = uniqueTokens(`${message} ${recentUser}`);
            const bridgedScored = entries
                .map((entry) => ({
                    entry,
                    score: scoreEntry(entry, bridged, preferredHub, lessonTitle, message),
                }))
                .filter((x) => x.score > 3)
                .sort((a, b) => b.score - a.score)
                .slice(0, 2)
                .map((x) => x.entry);
            if (bridgedScored.length) {
                return formatAnswer(message, bridgedScored, lessonTitle, {
                    conversational: true,
                    userName: ctx.userName,
                });
            }
        }
        return formatAnswer(message, [], lessonTitle, {
            conversational: true,
            userName: ctx.userName,
        });
    }

    return formatAnswer(message, deduped, lessonTitle, {
        conversational: true,
        userName: ctx.userName,
    });
}

/** Compact snippets to inject into live OpenAI system prompt. */
export function retrieveTutorContextSnippets(ctx: OfflineTutorContext, limit = 4): string {
    const preferredHub = hubFromPath(ctx.hubBasePath);
    const tokens = uniqueTokens(`${ctx.message} ${ctx.lessonTitle || ''} ${ctx.lessonSubtitle || ''}`);
    const scored = getTutorKnowledgeEntries()
        .map((entry) => ({
            entry,
            score: scoreEntry(entry, tokens, preferredHub, ctx.lessonTitle || '', ctx.message),
        }))
        .filter((x) => x.score > 4)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    if (!scored.length) return '';
    return scored
        .map((x) => `### ${x.entry.title}\n${clip(x.entry.body, 500)}`)
        .join('\n\n');
}
