import type { LessonChapter, LessonModule } from '@/lib/buyer-learn/types';

const CHAPTERS: LessonChapter[] = [
    {
        id: 'what-is-a-bond',
        title: 'What a bond really is',
        eyebrow: 'The foundation',
        plainEnglish:
            'A home loan (mortgage loan) is credit advanced to finance the acquisition of immovable property. In South Africa it is typically secured by a mortgage bond registered over that property at the Deeds Office in favour of the lender (mortgagee) until the debt is settled.',
        whyItMatters:
            'You acquire ownership subject to a registered real security right. Misunderstanding that structure leads to confused decisions on deposit, interest rate, term, and early settlement — because the economic and legal obligations are not the same as renting.',
        tone: 'dark',
        illustration: 'bond',
        infographic: [
            {
                id: 'b1',
                label: 'You find a home',
                detail:
                    'Price and suburb set how large a loan you need. This is also where you decide whether the monthly repayment can sit beside rates, levies, and life costs.\n\nA bond starts with a number you can actually carry — not only a number a bank might approve.',
            },
            {
                id: 'b2',
                label: 'Bank registers a bond',
                detail:
                    'When the transaction proceeds, a mortgage bond is registered against the property in the Deeds Registry. That registered bond is the lender’s real security for repayment.\n\nOwnership vests in you subject to that mortgage — it is a formal real right, not an informal IOU.',
            },
            {
                id: 'b3',
                label: 'You repay monthly',
                detail:
                    'Each repayment typically covers interest and capital over a long term (often 20–30 years in SA). Longer terms lower the monthly amount but increase total interest paid.\n\nKnow both the monthly figure and what the term implies over time.',
            },
            {
                id: 'b4',
                label: 'You settle & cancel',
                detail:
                    'When the loan is paid up, the bond is cancelled and the title is cleared of that mortgage. Selling earlier usually means settling the outstanding balance from the proceeds.\n\nUnderstanding exit is part of understanding the bond.',
            },
        ],
        caseStudy: {
            id: 'cs-bond',
            headline: 'Sipho buys in Randburg',
            story:
                'Sipho earns R28,000 net in Johannesburg. He eyes a R1.35m sectional title with a 10% deposit. The bond is not “free money” — it is a long contract secured by that unit.',
            city: 'Johannesburg',
            propertyLabel: '2-bed sectional · Randburg',
            price: 1350000,
            deposit: 135000,
            bond: 1215000,
            ratePct: 10.5,
            monthly: 12400,
            note: 'Educational estimate near recent prime bands — not a bank quote. Confirm live pricing with lenders.',
        },
        mistakes: [
            'Treating the purchase price as the only number that matters.',
            'Ignoring that term length (20 vs 30 years) changes monthly repayments dramatically.',
            'Signing without understanding the bond is registered against the property.',
        ],
        mythFact: {
            myth: 'Once the bank approves you, the home is fully yours with no strings.',
            fact: 'The bank holds a registered mortgage until the loan is settled. You own — with obligations.',
        },
        exercise: {
            kind: 'choice',
            prompt: 'What is the bank’s main security on a residential bond?',
            options: [
                {
                    id: 'a',
                    label: 'Your furniture and appliances',
                    feedback: 'No — household goods are not the bond security.',
                },
                {
                    id: 'b',
                    label: 'The property registered under the mortgage',
                    feedback: 'Correct — the bonded property secures the loan.',
                    correct: true,
                },
                {
                    id: 'c',
                    label: 'A handshake with the estate agent',
                    feedback: 'Agents facilitate — they do not secure the loan.',
                },
            ],
        },
        checklist: {
            title: 'Bond basics cheat sheet',
            items: [
                'Purchase price vs bond amount vs cash needed at transfer',
                'Term length (years) and how it affects monthly repayments',
                'What “registered bond” means at the Deeds Office',
                'Who pays bond registration costs (budget separately)',
            ],
        },
        quiz: {
            id: 'q-bond',
            kind: 'mcq',
            prompt: 'A South African home loan is typically secured by…',
            options: [
                { id: 'a', label: 'A registered mortgage over the property' },
                { id: 'b', label: 'Your social media following' },
                { id: 'c', label: 'The estate agent’s commission only' },
                { id: 'd', label: 'A verbal promise to the seller' },
            ],
            correctId: 'a',
            explanation: 'The bond is registered against the property — that is the bank’s security.',
        },
        deepDive: {
            title: 'Prime, margin, and why your rate is personal',
            body: 'Lenders often quote relative to prime — a reference interest rate — then apply a margin reflecting assessed credit and security risk.\n\nDeposit (hence LTV), credit history, income stability, product type, and property characteristics can all affect the offered rate. Two borrowers purchasing similar stock can receive different margins.\n\nCompare the full contractual rate and fee schedule, not the word “prime” in isolation. Ask what conditions could alter the offer before registration.\n\nPricing practices differ by credit provider and change over time — confirm with your bank or a registered credit provider. Educational content only.',
        },
        bridge: {
            nextLabel: 'How deposits change everything',
            teaser: 'Next you will see why 10% vs 20% is not just a round number — it reshapes risk, rate, and monthly pressure.',
        },
    },
    {
        id: 'deposits',
        title: 'Deposits that actually help you',
        eyebrow: 'Cash & confidence',
        plainEnglish:
            'A deposit is the equity contribution paid toward the purchase price so that the loan (bond) finances a smaller portion of the acquisition. Higher deposits reduce loan-to-value (LTV), which typically improves the lender’s security position and can improve pricing — subject to credit assessment.',
        whyItMatters:
            'Minimising deposit to maximise purchase price increases leverage and repayment burden while shrinking cash available for acquisition costs and reserves. Affordability is a function of deposit, fees, debt service, and buffers — not deposit percentage alone.',
        tone: 'light',
        illustration: 'deposit',
        infographic: [
            {
                id: 'd1',
                label: '0–5% deposit',
                detail:
                    'Very small deposits usually mean tougher approvals and higher risk pricing. Your monthly payment and buffer are thinner if anything goes wrong.\n\nTreat ultra-low deposits as a stress test, not a trophy.',
            },
            {
                id: 'd2',
                label: '10% deposit',
                detail:
                    'A common first-home path in many SA deals — still budget transfer and bond costs separately from the deposit cash.\n\n10% down is not “done” if fees are unfunded.',
            },
            {
                id: 'd3',
                label: '20%+ deposit',
                detail:
                    'Larger deposits often improve the bank’s risk story and can unlock better pricing. You also borrow less, which lowers monthly pressure.\n\nThe trade-off is opportunity cost of cash — still keep an emergency buffer.',
            },
            {
                id: 'd4',
                label: 'Keep a fee buffer',
                detail:
                    'Transfer duty or VAT context, attorney fees, and bond registration costs sit on top of the deposit. Model them before you offer.\n\nMixing deposit and fee money is how buyers get stuck at transfer.',
            },
        ],
        caseStudy: {
            id: 'cs-deposit',
            headline: 'Same home, two deposit stories',
            story:
                'On Sipho’s R1.35m unit, 10% deposit means ~R135k down and a larger bond. At 20%, he borrows less — monthly pressure drops and the bank’s risk story improves.',
            city: 'Johannesburg',
            propertyLabel: '2-bed sectional · Randburg',
            price: 1350000,
            deposit: 270000,
            bond: 1080000,
            ratePct: 11.5,
            monthly: 10900,
            note: 'Illustrative 20% path — compare against your real quotes.',
        },
        mistakes: [
            'Spending every rand of savings on the deposit and arriving at transfer broke.',
            'Forgetting bond registration and transfer attorney costs.',
            'Chasing a bigger house that forces a fragile deposit.',
        ],
        mythFact: {
            myth: 'Banks always require 20% or you cannot buy.',
            fact: 'Many first-time buyers proceed around 10% — subject to affordability, credit, and product rules. Confirm with a lender or originator.',
        },
        exercise: {
            kind: 'choice',
            prompt: 'You have R200k cash. The home is R1.4m. What is the wiser first move?',
            options: [
                {
                    id: 'a',
                    label: 'Put all R200k into the deposit and hope fees appear later',
                    feedback: 'Risky — transfer and bond costs still need cash.',
                },
                {
                    id: 'b',
                    label: 'Split deposit vs fee/buffer so you can actually register',
                    feedback: 'Yes — a slightly smaller deposit with a buffer beats a stuck transfer.',
                    correct: true,
                },
                {
                    id: 'c',
                    label: 'Skip budgeting and rely on the seller to cover fees',
                    feedback: 'Do not assume — fee responsibility must be clear in writing.',
                },
            ],
        },
        checklist: {
            title: 'Deposit readiness list',
            items: [
                'Target deposit % for the suburb and bank appetite',
                'Separate envelope for transfer duty / attorney / bond costs',
                '2–3 months buffer for rates and life after move-in',
                'Proof of funds ready for the conveyancer',
            ],
        },
        quiz: {
            id: 'q-deposit',
            kind: 'true-false',
            prompt: 'Transfer and bond registration costs should be budgeted separately from your deposit.',
            options: [
                { id: 'true', label: 'True' },
                { id: 'false', label: 'False' },
            ],
            correctId: 'true',
            explanation: 'Deposit lowers the loan; fees are extra cash needed to register.',
        },
        deepDive: {
            title: 'Loan-to-value (LTV) in plain English',
            body: 'Loan-to-value (LTV) = loan amount ÷ property value (typically the lender’s valuation for credit purposes). Lower LTV means higher borrower equity and, all else equal, lower credit risk for the mortgagee — which can support more competitive pricing.\n\nDo not deplete emergency liquidity solely to chase a marginal rate improvement. Solvency under rate and cost shocks matters more than a small pricing delta.\n\nNote: the lender’s valuation may differ from the contractual purchase price; LTV follows the security value used in credit assessment.',
        },
        bridge: {
            nextLabel: 'Fixed vs variable rates',
            teaser: 'Next: why “prime” headlines scare people — and how to choose certainty vs flexibility without panic.',
        },
    },
    {
        id: 'rates',
        title: 'Fixed vs variable rates',
        eyebrow: 'The monthly story',
        plainEnglish:
            'Variable rates are typically linked to prime (plus a borrower-specific margin) and can change when the reference rate cycle moves. Fixed rates remain constant for a contractual fixed period, after which many products revert to a variable rate unless renegotiated. Neither structure is universally superior — the choice depends on cash-flow headroom and tolerance for repayment volatility.',
        whyItMatters:
            'A low day-one variable rate can rise. A fixed rate can cost more initially but reduces repayment uncertainty during the fixed window. Underwrite the repayment you can sustain after a 1–2 percentage point rise — or understand the fixed-period terms precisely.',
        tone: 'dark',
        illustration: 'rates',
        infographic: [
            {
                id: 'r1',
                label: 'Variable',
                detail:
                    'A variable rate tracks prime (plus your margin). When the cycle moves up, repayments can rise; when it eases, they can fall.\n\nVariable suits buyers with genuine monthly headroom who understand the risk.',
            },
            {
                id: 'r2',
                label: 'Fixed window',
                detail:
                    'A fixed rate stays steady for a set period (often 1–2 years on many SA products). You pay for predictability — sometimes at a higher starting rate.\n\nRead the product rules: early settlement and break costs matter.',
            },
            {
                id: 'r3',
                label: 'After the fix',
                detail:
                    'When the fixed window ends, many loans revert to a variable rate unless you renegotiate or re-fix.\n\nDiary the end date so the change is a decision, not a surprise.',
            },
            {
                id: 'r4',
                label: 'Stress test',
                detail:
                    'Before you choose, ask whether you can still pay if rates rise 1–2%. If the answer is no, shrink the loan, raise the deposit, or pick more certainty.\n\nStress testing is part of the product choice — not optional maths.',
            },
        ],
        caseStudy: {
            id: 'cs-rates',
            headline: 'Sipho stress-tests +1%',
            story:
                'At ~R12,400/month on his illustrative bond, a 1% rate rise is not theoretical — it is groceries and fuel. He chooses a budget that survives a bump.',
            city: 'Johannesburg',
            propertyLabel: '2-bed sectional · Randburg',
            price: 1350000,
            deposit: 135000,
            bond: 1215000,
            ratePct: 12.75,
            monthly: 13300,
            note: 'Rough +1% stress — use your bank’s schedule for exact figures.',
        },
        mistakes: [
            'Budgeting only for today’s rate with zero headroom.',
            'Fixing without reading what happens when the fixed period ends.',
            'Comparing “prime” headlines instead of the actual offered rate.',
        ],
        mythFact: {
            myth: 'Fixed rates are always safer and always cheaper.',
            fact: 'Fixed can buy certainty but may price higher. Variable can be cheaper initially — with movement risk. Match the product to your buffer.',
        },
        exercise: {
            kind: 'choice',
            prompt: 'You have a tight monthly budget and hate surprises. What should you prioritise?',
            options: [
                {
                    id: 'a',
                    label: 'The absolute lowest day-one variable rate with no stress test',
                    feedback: 'Dangerous if a rate rise breaks your budget.',
                },
                {
                    id: 'b',
                    label: 'A repayment you can still afford after a 1–2% rise (or a suitable fix)',
                    feedback: 'Correct — resilience beats bragging rights.',
                    correct: true,
                },
                {
                    id: 'c',
                    label: 'Ignore the rate type entirely',
                    feedback: 'Rate structure is central to monthly survival.',
                },
            ],
        },
        quiz: {
            id: 'q-rates',
            kind: 'mcq',
            prompt: 'Variable home-loan rates in South Africa typically move with…',
            options: [
                { id: 'a', label: 'Prime / the interest-rate cycle' },
                { id: 'b', label: 'The estate agent’s mood' },
                { id: 'c', label: 'Petrol prices only' },
                { id: 'd', label: 'Your WhatsApp status' },
            ],
            correctId: 'a',
            explanation: 'Variable pricing tracks the prime cycle — stress-test your budget.',
        },
        deepDive: {
            title: 'When a short fix can help',
            body: 'Some buyers fix for the first 12–24 months while settling transfer costs, furniture, moving, and new levies — then revisit once cash flow is calmer.\n\nThe point is intentional certainty during a noisy life chapter, not a permanent religion about fixed vs variable.\n\nWrite your reason for fixing (or not) next to the quote. If you cannot explain the choice in one sentence, you are guessing.\n\nConfirm break costs, revert terms, and fees with your lender before you sign.',
        },
        bridge: {
            nextLabel: 'Banks vs bond originators',
            teaser: 'Next: how one application can reach several banks — and who actually pays the originator.',
        },
    },
    {
        id: 'originators',
        title: 'Banks vs bond originators',
        eyebrow: 'Competition for you',
        plainEnglish:
            'A bond originator can assemble a credit application and submit it to multiple lenders. In the South African market, the successful lender typically remunerates the originator — the borrower is not usually charged that fee directly when a loan is granted (confirm current commercial arrangements).',
        whyItMatters:
            'Approaching a single bank can leave pricing untested. An originator creates competitive tension — but you remain responsible for the accuracy of disclosures and for selecting the offer on total cost and conditions.',
        tone: 'light',
        illustration: 'originator',
        infographic: [
            {
                id: 'o1',
                label: 'Share your pack',
                detail:
                    'Prepare one honest document pack — ID, income proof, statements — and use the same truth with every lender.\n\nInconsistencies slow approvals and damage trust.',
            },
            {
                id: 'o2',
                label: 'Originator submits',
                detail:
                    'An originator can package the application and submit to multiple banks where appropriate, creating competition on pricing and terms.\n\nYou still own the facts in the file.',
            },
            {
                id: 'o3',
                label: 'Compare offers',
                detail:
                    'Compare rate, fees, conditions, and what could change before registration — not just the flashiest subject line.\n\nWrite the totals side by side before you decide.',
            },
            {
                id: 'o4',
                label: 'You stay in control',
                detail:
                    'You choose which grant to accept. Nobody should rush you into silence or skip explanations.\n\nA good process creates options; you keep the decision.',
            },
        ],
        caseStudy: {
            id: 'cs-orig',
            headline: 'Sipho lets banks compete',
            story:
                'Instead of walking into one branch, Sipho uses an originator. Two banks respond with different margins. He picks the clearer total cost — not the flashiest email subject line.',
            city: 'Johannesburg',
            propertyLabel: '2-bed sectional · Randburg',
            price: 1350000,
            deposit: 135000,
            bond: 1215000,
            ratePct: 11.5,
            monthly: 12100,
            note: 'Competition can improve pricing — results vary by profile.',
        },
        mistakes: [
            'Hiding debt or income because “the other bank will not see it”.',
            'Accepting the first SMS without comparing conditions.',
            'Thinking the originator works for the bank against you — incentives differ, but clarity is your job.',
        ],
        mythFact: {
            myth: 'Bond originators always charge the buyer a big fee.',
            fact: 'On standard home loans, banks usually pay the originator on grant. Confirm any fees in writing for your case.',
        },
        exercise: {
            kind: 'checklist',
            prompt: 'Tick what you will prepare before speaking to an originator or bank:',
            checklist: [
                'Clear ID and proof of address (FICA)',
                'Latest payslips and bank statements',
                'List of monthly expenses and existing debts',
                'Honest questions about rate, initiation fees, and conditions',
            ],
        },
        checklist: {
            title: 'Originator conversation cheat sheet',
            items: [
                'Ask which banks will see your application',
                'Confirm who pays the originator fee',
                'Request offers in writing with rate and conditions',
                'Compare total cost — not only the headline rate',
            ],
        },
        quiz: {
            id: 'q-orig',
            kind: 'true-false',
            prompt: 'On a typical SA home loan, the bank — not the buyer — often pays the bond originator when the loan is granted.',
            options: [
                { id: 'true', label: 'True' },
                { id: 'false', label: 'False' },
            ],
            correctId: 'true',
            explanation: 'Originators are commonly bank-paid on grant — still confirm your agreement.',
        },
        deepDive: {
            title: 'When going direct still makes sense',
            body: 'If you already have a strong private-banking relationship or a staff product, a direct channel can be fine.\n\nThe principle stays the same: compare, document, and do not outsource your judgement. Ask for the full rate, fees, and conditions in writing.\n\nWhether you use an originator or a branch, you are responsible for the accuracy of your application.',
        },
        bridge: {
            nextLabel: 'FICA — your approval unlock',
            teaser: 'Last chapter: the documents banks cannot skip — and how to avoid the #1 delay.',
        },
    },
    {
        id: 'fica',
        title: 'FICA readiness',
        eyebrow: 'Documents that unlock approvals',
        plainEnglish:
            'FICA (Financial Intelligence Centre Act) obligations require accountable institutions, including banks, to establish and verify client identity and related particulars before fully establishing a business relationship. Incomplete FICA documentation delays credit finalisation and transfer timelines.',
        whyItMatters:
            'A missing or inconsistent identity/address pack can stall a grant while another buyer’s file proceeds. FICA readiness is operationally decisive, not administrative trivia.',
        tone: 'dark',
        illustration: 'fica',
        infographic: [
            {
                id: 'f1',
                label: 'Identity',
                detail:
                    'Banks need valid identity documents (for example green barcoded ID, smart ID, or passport as required for your profile).\n\nExpired or mismatched IDs are a classic approval delay.',
            },
            {
                id: 'f2',
                label: 'Address',
                detail:
                    'Provide recent proof of residential address in your name, or follow the affidavit route your lender accepts when that is not available.\n\nAddress mismatches across documents slow FICA badly.',
            },
            {
                id: 'f3',
                label: 'Income pack',
                detail:
                    'Expect payslips, bank statements, and sometimes IRP5s or employment contracts depending on how you earn.\n\nSelf-employed packs are usually heavier — start early.',
            },
            {
                id: 'f4',
                label: 'Stay consistent',
                detail:
                    'Names, IDs, and addresses must match across the file. Small typos create big delays.\n\nBuild one clean pack and reuse it — do not reinvent documents per bank.',
            },
        ],
        caseStudy: {
            id: 'cs-fica',
            headline: 'Sipho’s two-day delay',
            story:
                'Sipho’s grant paused because his proof of address was outdated. A fresh statement fixed it in two days — but those were two days of panic. He now keeps a FICA folder on his phone.',
            city: 'Johannesburg',
            propertyLabel: '2-bed sectional · Randburg',
            price: 1350000,
            deposit: 135000,
            bond: 1215000,
            ratePct: 10.5,
            monthly: 12400,
            note: 'Document delays are the most avoidable timeline killers. Figures are educational only.',
        },
        mistakes: [
            'Submitting blurry photos of ID documents.',
            'Using a proof of address that does not match your application.',
            'Waiting until after the OTP to start gathering papers.',
        ],
        mythFact: {
            myth: 'FICA is optional if you are a salary earner with a good job.',
            fact: 'FICA is a legal requirement for accountable institutions. Job title does not skip it.',
        },
        exercise: {
            kind: 'checklist',
            prompt: 'Build your FICA kit — tick what you already have ready today:',
            checklist: [
                'Clear ID copy (both sides if smart ID)',
                'Proof of address less than 3 months old',
                'Latest 3 months bank statements',
                'Latest payslips (or commission schedule)',
            ],
        },
        checklist: {
            title: 'FICA & income pack',
            items: [
                'ID / smart ID / passport as applicable',
                'Proof of residential address',
                'Payslips and bank statements',
                'Marriage / antenuptial docs if relevant',
                'Share with originator or bank via secure channel only',
            ],
        },
        quiz: {
            id: 'q-fica',
            kind: 'mcq',
            prompt: 'What usually stalls bond approvals fastest?',
            options: [
                { id: 'a', label: 'Incomplete or mismatched FICA and income documents' },
                { id: 'b', label: 'Choosing a nice kitchen splashback' },
                { id: 'c', label: 'Sending too many thank-you notes' },
                { id: 'd', label: 'Asking too many questions' },
            ],
            correctId: 'a',
            explanation: 'Clean, consistent documents keep underwriting moving.',
        },
        deepDive: {
            title: 'POPIA and sharing documents',
            body: 'Share sensitive documents only through channels your bank or originator specifies. You are allowed to ask how your data is stored and who can access it.\n\nCuriosity about privacy is healthy — not rude. Do not email ID packs to informal personal addresses “to speed things up”.\n\nA clean, controlled pack protects both your approval timeline and your personal information.',
        },
        bridge: {
            nextLabel: 'You are ready for prequalification',
            teaser: 'You understand bonds, deposits, rates, originators, and FICA. Next lesson: get a realistic budget before you fall in love with a listing.',
        },
    },
];

export const HOME_LOANS_LESSON: LessonModule = {
    meta: {
        slug: 'home-loans',
        title: 'Mastering home loans in South Africa',
        subtitle:
            'Bonds, deposits, rates, originators, and FICA — taught like a premium course, not a PDF.',
        difficulty: 'beginner',
        minutes: 28,
        xp: 160,
        badgeId: 'bond-basics',
        badgeLabel: 'Bond Basics',
        nextSlug: 'prequalification',
        nextTitle: 'Getting Prequalified',
        nextDescription:
            'Learn why soft pre-qualification unlocks stronger offers and clearer shopping budgets.',
        courseLabel: 'Home loans',
        chapterCount: CHAPTERS.length,
    },
    objectives: CHAPTERS.map((ch) => ({
        id: ch.id,
        title: ch.title,
        body: ch.plainEnglish,
    })),
    chapters: CHAPTERS,
    sections: [
        {
            type: 'objectives',
            id: 'objectives',
            title: 'What you will master',
            items: CHAPTERS.map((ch) => ({
                id: ch.id,
                title: ch.title,
                body: ch.plainEnglish,
            })),
        },
        {
            type: 'achievement',
            id: 'achievement',
            title: 'Bond Basics unlocked',
            body: 'You finished the home loans course. Keep the streak going — prequalification is next.',
            badgeLabel: 'Bond Basics',
            xp: 160,
        },
        {
            type: 'next',
            id: 'next',
            slug: 'prequalification',
            title: 'Getting Prequalified',
            description:
                'Know your buying power before you fall in love with a listing.',
        },
    ],
};
