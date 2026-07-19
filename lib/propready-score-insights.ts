import {
    calculateMonthlyBondBudget,
    getPropReadyScoreLabel,
    parseStoredAmount,
    type BuyerQuizResult,
} from '@/lib/quiz-result';
import type { BuyerDocument } from '@/lib/buyer-documents';
import {
    resolvePrequalMode,
    type PrequalModeInfo,
} from '@/lib/buyer-full-prequal';

export type ScoreFactorId =
    | 'income'
    | 'employment'
    | 'debt'
    | 'deposit'
    | 'credit'
    | 'documents'
    | 'readiness';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface ScoreFactor {
    id: ScoreFactorId;
    label: string;
    points: number;
    maxPoints: number;
    status: 'strong' | 'ok' | 'weak';
    detail: string;
}

export interface AiRecommendation {
    id: string;
    priority: RecommendationPriority;
    title: string;
    body: string;
    href?: string;
    cta?: string;
    /** Soft AI feature tag shown in the UI */
    feature: string;
}

export interface PropReadyScoreInsights {
    score: number;
    label: string;
    summary: string;
    narrative: string;
    disclaimer: string;
    projectedBoost: number;
    factors: ScoreFactor[];
    recommendations: AiRecommendation[];
    aiFeatures: { id: string; title: string; body: string }[];
    monthlyBudget: number;
    depositAmount: number;
    depositPctOfPreQual: number | null;
    debtToIncomePct: number | null;
    prequal: PrequalModeInfo;
    recommendationTitle: string;
    recommendationSubtitle: string;
}

function employmentPoints(status?: string): number {
    const map: Record<string, number> = {
        permanent: 20,
        contract: 15,
        'self-employed': 12,
        freelance: 10,
        'part-time': 8,
        unemployed: 0,
    };
    return map[status || ''] ?? 0;
}

function incomePoints(income: number): number {
    if (income >= 50000) return 30;
    if (income >= 30000) return 25;
    if (income >= 20000) return 20;
    if (income >= 15000) return 15;
    if (income >= 10000) return 10;
    if (income >= 5000) return 5;
    return 0;
}

function debtPoints(income: number, expenses: number): number {
    if (income <= 0) return 0;
    const debtRatio = (expenses / income) * 100;
    if (debtRatio === 0) return 25;
    if (debtRatio <= 10) return 22;
    if (debtRatio <= 20) return 18;
    if (debtRatio <= 30) return 12;
    if (debtRatio <= 40) return 6;
    return 0;
}

function depositPoints(deposit: number): number {
    if (deposit >= 200000) return 15;
    if (deposit >= 150000) return 12;
    if (deposit >= 100000) return 10;
    if (deposit >= 50000) return 7;
    if (deposit >= 25000) return 4;
    if (deposit > 0) return 2;
    return 0;
}

function creditPoints(credit?: string): number {
    const map: Record<string, number> = {
        excellent: 10,
        good: 7,
        average: 4,
        poor: 1,
    };
    return credit ? map[credit] ?? 0 : 0;
}

function factorStatus(points: number, max: number): ScoreFactor['status'] {
    const ratio = max === 0 ? 0 : points / max;
    if (ratio >= 0.75) return 'strong';
    if (ratio >= 0.4) return 'ok';
    return 'weak';
}

function employmentLabel(status?: string): string {
    const map: Record<string, string> = {
        permanent: 'Permanent employment',
        contract: 'Contract role',
        'self-employed': 'Self-employed',
        freelance: 'Freelance',
        'part-time': 'Part-time',
        unemployed: 'Not currently employed',
    };
    return map[status || ''] || 'Employment not provided';
}

function creditLabel(credit?: string): string {
    const map: Record<string, string> = {
        excellent: 'Excellent credit profile',
        good: 'Good credit profile',
        average: 'Average credit profile',
        poor: 'Credit needs attention',
    };
    return credit ? map[credit] || 'Credit self-assessment captured' : 'Credit score not assessed yet';
}

/**
 * Build transparent score factors + rule-based AI recommendations for the buyer dashboard.
 */
export function buildPropReadyScoreInsights(
    result: BuyerQuizResult | null | undefined,
    options?: {
        documents?: BuyerDocument[];
        viewingCount?: number;
        userId?: string | null;
    }
): PropReadyScoreInsights {
    const docs = options?.documents ?? [];
    const viewingCount = options?.viewingCount ?? 0;

    const income = parseStoredAmount(result?.monthlyIncome);
    const expenses = parseStoredAmount(result?.expenses);
    const deposit = parseStoredAmount(result?.depositSaved);
    const softPreQual = result?.preQualAmount ?? 0;
    const prequal = resolvePrequalMode({
        userId: options?.userId,
        softAmount: softPreQual,
        documents: docs,
    });
    const preQual = prequal.displayAmount;
    const score = Math.min(100, Math.max(0, Math.round(result?.score ?? 0)));
    const label = getPropReadyScoreLabel(score);
    const monthlyBudget = calculateMonthlyBondBudget(preQual);
    const dti =
        income > 0 ? Math.round((expenses / income) * 1000) / 10 : null;
    const depositPct =
        preQual > 0 ? Math.round((deposit / preQual) * 1000) / 10 : null;

    const incomePts = incomePoints(income);
    const empPts = employmentPoints(result?.employmentStatus);
    const debtPts = debtPoints(income, result?.hasDebt ? expenses : 0);
    const depPts = depositPoints(deposit);
    const credPts = creditPoints(result?.creditScore);

    const hasId = docs.some((d) => d.type === 'id');
    const hasIncome = docs.some((d) => d.type === 'income');
    const hasPrequal = docs.some((d) => d.type === 'pre-qualification');
    const hasBank = docs.some((d) => d.type === 'bank-statement');
    const docCompleteness = [hasId, hasIncome, hasPrequal].filter(Boolean).length;
    const docPts = Math.round((docCompleteness / 3) * 10);

    const factors: ScoreFactor[] = [
        {
            id: 'income',
            label: 'Affordability',
            points: incomePts,
            maxPoints: 30,
            status: factorStatus(incomePts, 30),
            detail:
                income > 0
                    ? `Declared income supports a modelled pre-qualification of about R${preQual.toLocaleString('en-ZA')}.`
                    : 'Add your monthly income so we can model a realistic bond amount.',
        },
        {
            id: 'employment',
            label: 'Employment',
            points: empPts,
            maxPoints: 20,
            status: factorStatus(empPts, 20),
            detail: employmentLabel(result?.employmentStatus),
        },
        {
            id: 'debt',
            label: 'Debt load',
            points: debtPts,
            maxPoints: 25,
            status: factorStatus(debtPts, 25),
            detail:
                dti == null
                    ? 'No debt or expense profile yet.'
                    : dti === 0
                      ? 'No monthly debt declared — strong for lender affordability checks.'
                      : `Estimated debt-to-income around ${dti}%. Lenders typically prefer under ~30%.`,
        },
        {
            id: 'deposit',
            label: 'Deposit',
            points: depPts,
            maxPoints: 15,
            status: factorStatus(depPts, 15),
            detail:
                deposit > 0
                    ? depositPct != null
                        ? `R${deposit.toLocaleString('en-ZA')} saved (~${depositPct}% of pre-qual). 10%+ usually unlocks better bond options.`
                        : `R${deposit.toLocaleString('en-ZA')} saved toward a deposit.`
                    : 'No deposit captured yet — even R25k–R50k improves lender comfort.',
        },
        {
            id: 'credit',
            label: 'Credit health',
            points: credPts,
            maxPoints: 10,
            status: factorStatus(credPts, 10),
            detail: creditLabel(result?.creditScore),
        },
        {
            id: 'documents',
            label: 'Doc readiness',
            points: docPts,
            maxPoints: 10,
            status: factorStatus(docPts, 10),
            detail:
                docCompleteness === 3
                    ? prequal.isFull
                        ? 'FICA pack complete and full originator prequal captured.'
                        : 'Core FICA pack uploaded — ready for an originator review.'
                    : `${docCompleteness}/3 core documents uploaded (ID, income, pre-qual letter).`,
        },
    ];

    const recommendations: AiRecommendation[] = [];

    if (prequal.isFull) {
        recommendations.push(
            {
                id: 'offer-with-letter',
                priority: 'high',
                title: 'Make offers within your full prequal',
                body: `Your originator prequal of R${preQual.toLocaleString('en-ZA')} is what agents and sellers will take seriously. Keep offers inside this band unless you top up cash.`,
                href: '/search',
                cta: 'Browse in budget',
                feature: 'Offer coach',
            },
            {
                id: 'agent-align-offer',
                priority: 'high',
                title: 'Brief your agent with the letter amount',
                body: 'Share your full prequal figure (and validity date) with your working agent before negotiations so offers are credible from day one.',
                href: '/dashboard/agent',
                cta: 'Open My Agent',
                feature: 'Journey coach',
            },
            {
                id: 'keep-fica-fresh',
                priority: 'medium',
                title: 'Keep FICA documents current',
                body: 'Banks re-check ID, income, and statements close to bond registration. Refresh payslips and statements if they are older than 3 months.',
                href: '/dashboard/documents',
                cta: 'Review documents',
                feature: 'Doc readiness',
            },
            {
                id: 'transfer-costs',
                priority: 'medium',
                title: 'Budget transfer & registration costs',
                body: 'Set cash aside for transfer duty, conveyancing, and bond registration — separate from your deposit — before you go unconditional.',
                href: '/learn/transfer-costs',
                cta: 'Transfer costs guide',
                feature: 'Cost planner',
            },
            {
                id: 'no-new-credit',
                priority: 'high',
                title: 'Avoid new credit until registered',
                body: 'New loans, phones, or store cards can void affordability after a full prequal. Stay clear of fresh credit until bond registration.',
                href: '/learn/bond-application-avoid',
                cta: 'What to avoid',
                feature: 'Credit radar',
            },
            {
                id: 'originator-followup',
                priority: 'medium',
                title: prequal.originatorName
                    ? `Stay close to ${prequal.originatorName}`
                    : 'Stay close to your bond originator',
                body: 'Ask for bank feedback, rate options, and any extra documents needed so formal approval stays on track once you have an accepted offer.',
                href: '/dashboard/documents',
                cta: 'Bond originators',
                feature: 'Prequal navigator',
            },
            {
                id: 'book-viewings',
                priority: viewingCount === 0 ? 'high' : 'low',
                title: viewingCount === 0 ? 'Book targeted viewings' : 'Keep viewing notes sharp',
                body:
                    viewingCount === 0
                        ? 'With a full prequal, prioritise listings near your approved amount and book viewings through PropReady.'
                        : 'After each viewing, note condition, comps, and must-haves so your next offer is decisive.',
                href: viewingCount === 0 ? '/search' : '/dashboard/viewings',
                cta: viewingCount === 0 ? 'Find homes' : 'Your viewings',
                feature: 'Match engine',
            }
        );

        if (deposit < preQual * 0.05 && preQual > 0) {
            recommendations.push({
                id: 'cash-buffer',
                priority: 'medium',
                title: 'Strengthen your cash buffer',
                body: 'Even with full prequal, a larger deposit / contingency reduces monthly repayments and strengthens your offer position.',
                href: '/calculator',
                cta: 'Bond calculator',
                feature: 'Deposit coach',
            });
        }
    } else {
        if (!result || score === 0) {
            recommendations.push({
                id: 'take-quiz',
                priority: 'high',
                title: 'Complete your PropReady assessment',
                body: 'A 5-minute quiz unlocks your soft pre-qualification estimate and personalised AI guidance.',
                href: '/quiz',
                cta: 'Start assessment',
                feature: 'Score bootstrap',
            });
        }

        if (deposit < 50000 && preQual > 0) {
            const target = Math.min(Math.round(preQual * 0.1), 150000);
            recommendations.push({
                id: 'boost-deposit',
                priority: 'high',
                title: 'Grow your deposit buffer',
                body: `Aim for about R${target.toLocaleString('en-ZA')} (≈10% of your soft pre-qual). A larger deposit can lower the bond amount and improve approval odds.`,
                href: '/calculator',
                cta: 'Run bond calculator',
                feature: 'Deposit coach',
            });
        }

        if (dti != null && dti > 30) {
            recommendations.push({
                id: 'reduce-debt',
                priority: 'high',
                title: 'Ease monthly debt before applying',
                body: `Your modelled debt load is around ${dti}% of income. Clearing or consolidating revolving debt before a bond application strengthens affordability.`,
                href: '/learn/prequalification',
                cta: 'Learn affordability tips',
                feature: 'Debt advisor',
            });
        }

        if (!result?.creditScore || result.creditScore === 'poor' || result.creditScore === 'average') {
            recommendations.push({
                id: 'credit-check',
                priority: result?.creditScore === 'poor' ? 'high' : 'medium',
                title: 'Check and clean your credit report',
                body: 'Pull a free credit report, dispute errors, and keep accounts current for 3–6 months before submitting to a bank.',
                href: '/learn/bond-application-avoid',
                cta: 'Bond tips',
                feature: 'Credit radar',
            });
        }

        if (!hasId || !hasIncome) {
            recommendations.push({
                id: 'upload-fica',
                priority: 'high',
                title: 'Upload ID and proof of income',
                body: 'Bond originators need these first. Completing your FICA pack unlocks a full pre-qualification — free for you on PropReady.',
                href: '/dashboard/documents',
                cta: 'Open documents',
                feature: 'Doc readiness AI',
            });
        } else if (prequal.isAwaitingFull) {
            recommendations.push({
                id: 'awaiting-letter',
                priority: 'high',
                title: 'Upload your originator prequal letter',
                body: 'When your bond originator confirms an amount, upload the letter and enter the official figure so PropReady replaces this soft estimate.',
                href: '/dashboard/documents',
                cta: 'Update documents',
                feature: 'Full prequal',
            });
        } else if (!hasPrequal) {
            recommendations.push({
                id: 'originator',
                priority: 'high',
                title: 'Complete a full originator prequal',
                body: 'This dashboard figure is a soft estimate only. Send your pack to a bond originator for a bank-ready letter — then your PropReady prequal and recommendations update.',
                href: '/dashboard/documents',
                cta: 'Meet originators',
                feature: 'Prequal navigator',
            });
        }

        if (viewingCount === 0 && preQual > 0) {
            recommendations.push({
                id: 'start-viewings',
                priority: 'medium',
                title: 'Tour homes in your budget band',
                body: `Search listings around ${monthlyBudget > 0 ? `R${monthlyBudget.toLocaleString('en-ZA')}/month bond` : 'your soft pre-qual'} and book a viewing so PropReady can match you with a working agent.`,
                href: '/search',
                cta: 'Browse matches',
                feature: 'Match engine',
            });
        } else if (viewingCount > 0) {
            recommendations.push({
                id: 'agent-followup',
                priority: 'low',
                title: 'Align with your working agent',
                body: 'You already have viewing activity. Confirm next steps, offer strategy, and document status with your agent so you move as one team.',
                href: '/dashboard/agent',
                cta: 'View My Agent',
                feature: 'Journey coach',
            });
        }

        if (result?.employmentStatus === 'self-employed' || result?.employmentStatus === 'freelance') {
            recommendations.push({
                id: 'self-emp-docs',
                priority: 'medium',
                title: 'Prepare self-employed pack',
                body: 'Banks often want 6 months of bank statements, tax returns, and management accounts. Gather these before you submit.',
                href: '/learn/home-loans',
                cta: 'Home loan guide',
                feature: 'Self-emp checklist',
            });
        }
    }

    // Cap soft list; show full set when fully prequalified
    const priorityRank: Record<RecommendationPriority, number> = {
        high: 0,
        medium: 1,
        low: 2,
    };
    recommendations.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
    const topRecs = prequal.isFull ? recommendations.slice(0, 8) : recommendations.slice(0, 5);

    const projectedBoost = prequal.isFull
        ? 0
        : Math.min(
              25,
              topRecs.filter((r) => r.priority === 'high').length * 6 +
                  topRecs.filter((r) => r.priority === 'medium').length * 3
          );

    const summary = prequal.isFull
        ? `Full pre-qualification confirmed${prequal.originatorName ? ` with ${prequal.originatorName}` : ''}. Recommendations below follow a bank-ready buying plan.`
        : score >= 80
          ? 'You look purchase-ready on a soft estimate — unlock a full originator prequal to confirm the number banks will use.'
          : score >= 65
            ? 'A solid soft buying position. Complete a full originator prequal to update this figure and unlock full recommendations.'
            : score >= 50
              ? 'You’re on the right path. This is a soft prequal — documents + originator review will strengthen and update it.'
              : score > 0
                ? 'Early soft estimate — follow the AI recommendations and finish a full bond-originator prequal.'
                : 'Complete your assessment to unlock a soft PropReady Score, then a full originator prequal.';

    const narrative = prequal.isFull
        ? `Your displayed purchasing power of R${preQual.toLocaleString('en-ZA')} comes from your full bond-originator pre-qualification (soft quiz estimate was R${prequal.softAmount.toLocaleString('en-ZA')}). Estimated bond repayment is about R${monthlyBudget.toLocaleString('en-ZA')} / month (illustrative 20-year, 10%).`
        : preQual > 0
          ? `Based on your quiz answers, PropReady models a soft pre-qualification of about R${preQual.toLocaleString('en-ZA')} with an estimated bond near R${monthlyBudget.toLocaleString('en-ZA')} / month (20-year, illustrative 10% rate). This is not a bank or originator approval.`
          : 'Once we have your income and expenses, we’ll estimate a soft purchasing power, monthly bond, and a prioritised action plan.';

    const disclaimer = prequal.isFull
        ? `Full pre-qualification recorded${prequal.originatorName ? ` via ${prequal.originatorName}` : ' via your bond originator'}. Final bank approval still depends on credit checks, property valuation, and underwriting at application.`
        : prequal.isAwaitingFull
          ? 'Soft pre-qualification only — you have started a full originator process. When your letter is ready, upload it and enter the official amount so this scorecard updates and full recommendations unlock.'
          : 'Soft pre-qualification only — based on your PropReady quiz, not a bank or bond-originator approval. Complete a full prequal with a bond originator to update this amount and unlock the full recommendation set.';

    const aiFeatures = prequal.isFull
        ? [
              {
                  id: 'full-prequal',
                  title: 'Full prequal sync',
                  body: 'Dashboard purchasing power follows your originator letter amount instead of the soft quiz estimate.',
              },
              {
                  id: 'offer-plan',
                  title: 'Offer-ready plan',
                  body: 'Recommendations shift to negotiation, FICA currency, transfer costs, and credit freeze until registration.',
              },
              {
                  id: 'agent-align',
                  title: 'Agent alignment',
                  body: 'Keeps your working agent briefed on the official figure sellers will trust.',
              },
              {
                  id: 'originator-loop',
                  title: 'Originator loop',
                  body: 'Stays linked to your bond originator for rate options and formal approval.',
              },
          ]
        : [
              {
                  id: 'score-explain',
                  title: 'Score explainer',
                  body: 'Transparent breakdown of how income, employment, debt, deposit, and credit feed your PropReady Score.',
              },
              {
                  id: 'next-best',
                  title: 'Next-best actions',
                  body: 'Prioritised AI recommendations ranked by likely impact on approval odds and score uplift.',
              },
              {
                  id: 'doc-readiness',
                  title: 'Doc readiness',
                  body: 'Tracks ID, income proof, and pre-qual progress so originators can move faster.',
              },
              {
                  id: 'full-upgrade',
                  title: 'Full prequal upgrade',
                  body: 'After a bond-originator letter, your soft estimate is replaced and full recommendations appear.',
              },
          ];

    return {
        score,
        label,
        summary,
        narrative,
        disclaimer,
        projectedBoost,
        factors,
        recommendations: topRecs,
        aiFeatures,
        monthlyBudget,
        depositAmount: deposit,
        depositPctOfPreQual: depositPct,
        debtToIncomePct: dti,
        prequal,
        recommendationTitle: prequal.isFull ? 'Full prequal recommendations' : 'AI recommendations',
        recommendationSubtitle: prequal.isFull
            ? 'Bank-ready next steps after your originator letter'
            : 'Next best actions — complete a full originator prequal to expand this list',
    };
}
