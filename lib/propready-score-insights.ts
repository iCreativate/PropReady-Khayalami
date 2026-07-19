import {
    calculateMonthlyBondBudget,
    getPropReadyScoreLabel,
    parseStoredAmount,
    type BuyerQuizResult,
} from '@/lib/quiz-result';
import type { BuyerDocument } from '@/lib/buyer-documents';

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
    projectedBoost: number;
    factors: ScoreFactor[];
    recommendations: AiRecommendation[];
    aiFeatures: { id: string; title: string; body: string }[];
    monthlyBudget: number;
    depositAmount: number;
    depositPctOfPreQual: number | null;
    debtToIncomePct: number | null;
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
    }
): PropReadyScoreInsights {
    const docs = options?.documents ?? [];
    const viewingCount = options?.viewingCount ?? 0;

    const income = parseStoredAmount(result?.monthlyIncome);
    const expenses = parseStoredAmount(result?.expenses);
    const deposit = parseStoredAmount(result?.depositSaved);
    const preQual = result?.preQualAmount ?? 0;
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
                    ? 'Core FICA pack uploaded — ready for an originator review.'
                    : `${docCompleteness}/3 core documents uploaded (ID, income, pre-qual letter).`,
        },
    ];

    const recommendations: AiRecommendation[] = [];

    if (!result || score === 0) {
        recommendations.push({
            id: 'take-quiz',
            priority: 'high',
            title: 'Complete your PropReady assessment',
            body: 'A 5-minute quiz unlocks your score, pre-qualification amount, and personalised AI guidance.',
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
            body: `Aim for about R${target.toLocaleString('en-ZA')} (≈10% of your pre-qual). A larger deposit can lower the bond amount and improve approval odds.`,
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
            body: 'Bond originators need these first. Completing your FICA pack unlocks thorough pre-qualification — free for you on PropReady.',
            href: '/dashboard/documents',
            cta: 'Open documents',
            feature: 'Doc readiness AI',
        });
    } else if (!hasPrequal && !hasBank) {
        recommendations.push({
            id: 'originator',
            priority: 'medium',
            title: 'Start a full originator prequal',
            body: 'Your basics are in. Connect with a bond originator for bank-level pre-qualification and a formal letter to use on offers.',
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
            body: `Search listings around ${monthlyBudget > 0 ? `R${monthlyBudget.toLocaleString('en-ZA')}/month bond` : 'your pre-qual'} and book a viewing so PropReady can match you with a working agent.`,
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

    // Cap list; keep highest priority first
    const priorityRank: Record<RecommendationPriority, number> = {
        high: 0,
        medium: 1,
        low: 2,
    };
    recommendations.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
    const topRecs = recommendations.slice(0, 5);

    const projectedBoost = Math.min(
        25,
        topRecs
            .filter((r) => r.priority === 'high')
            .length *
            6 +
            topRecs.filter((r) => r.priority === 'medium').length * 3
    );

    const summary =
        score >= 80
            ? 'You look refinance- and purchase-ready for most mid-market bonds — keep documents current.'
            : score >= 65
              ? 'A solid buying position. A few targeted moves can push you into an excellent band.'
              : score >= 50
                ? 'You’re on the right path. Focus on deposit, debt, and documents for the fastest lift.'
                : score > 0
                  ? 'Early stage — follow the AI recommendations below to strengthen affordability signals.'
                  : 'Complete your assessment to unlock a live PropReady Score and AI plan.';

    const narrative =
        preQual > 0
            ? `Based on your profile, PropReady models roughly R${preQual.toLocaleString('en-ZA')} of purchasing power with an estimated bond repayment near R${monthlyBudget.toLocaleString('en-ZA')} / month (20-year, illustrative 10% rate). AI recommendations below prioritise the actions most likely to raise your score and bank confidence.`
            : 'Once we have your income and expenses, we’ll estimate purchasing power, monthly bond, and a prioritised action plan.';

    const aiFeatures = [
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
            id: 'match-coach',
            title: 'Budget match coach',
            body: 'Keeps browsing and viewings aligned to your pre-qualification band.',
        },
    ];

    return {
        score,
        label,
        summary,
        narrative,
        projectedBoost,
        factors,
        recommendations: topRecs,
        aiFeatures,
        monthlyBudget,
        depositAmount: deposit,
        depositPctOfPreQual: depositPct,
        debtToIncomePct: dti,
    };
}
