import { monthlyPayment, runAmortisation } from '@/lib/smart-bond/engine';
import { estimateFees } from '@/lib/conveyancer-connect/fees';

export function formatZar(amount: number) {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(amount)));
}

export function formatNumber(num: number) {
    return new Intl.NumberFormat('en-ZA').format(Math.max(0, Math.round(num)));
}

export function parseMoneyInput(raw: string): number {
    return Number(raw.replace(/[^0-9]/g, '')) || 0;
}

export type BondRepaymentSummary = {
    loanAmount: number;
    monthlyRepayment: number;
    totalInterest: number;
    totalPayable: number;
    depositPct: number;
    ltvPct: number;
    payments: number;
};

export function summariseBondRepayment(input: {
    purchasePrice: number;
    deposit: number;
    interestRate: number;
    loanTermYears: number;
}): BondRepaymentSummary {
    const loanAmount = Math.max(0, input.purchasePrice - input.deposit);
    const payments = Math.max(0, Math.round(input.loanTermYears * 12));
    const monthly = monthlyPayment(loanAmount, input.interestRate, payments);
    const totalPayable = monthly * payments;
    const totalInterest = Math.max(0, totalPayable - loanAmount);
    const depositPct = input.purchasePrice > 0 ? (input.deposit / input.purchasePrice) * 100 : 0;
    const ltvPct = input.purchasePrice > 0 ? (loanAmount / input.purchasePrice) * 100 : 0;

    return {
        loanAmount,
        monthlyRepayment: Math.round(monthly),
        totalInterest: Math.round(totalInterest),
        totalPayable: Math.round(totalPayable),
        depositPct,
        ltvPct,
        payments,
    };
}

export function stressRepayments(input: {
    loanAmount: number;
    interestRate: number;
    loanTermYears: number;
    bumps?: number[];
}) {
    const bumps = input.bumps ?? [0, 1, 2];
    const payments = Math.max(1, Math.round(input.loanTermYears * 12));
    return bumps.map((bump) => {
        const rate = input.interestRate + bump;
        const monthly = Math.round(monthlyPayment(input.loanAmount, rate, payments));
        return { bump, rate, monthly };
    });
}

export function extraPaymentImpact(input: {
    loanAmount: number;
    interestRate: number;
    loanTermYears: number;
    extraMonthly: number;
}) {
    const payments = Math.max(1, Math.round(input.loanTermYears * 12));
    const scheduled = monthlyPayment(input.loanAmount, input.interestRate, payments);
    const baseline = runAmortisation({
        balance: input.loanAmount,
        annualRatePct: input.interestRate,
        scheduledPayment: scheduled,
        maxMonths: payments + 12,
    });
    const withExtra = runAmortisation({
        balance: input.loanAmount,
        annualRatePct: input.interestRate,
        scheduledPayment: scheduled,
        extraMonthly: Math.max(0, input.extraMonthly),
        maxMonths: payments + 12,
    });

    return {
        scheduled: Math.round(scheduled),
        baselineMonths: baseline.monthsToSettle,
        optimizedMonths: withExtra.monthsToSettle,
        monthsSaved: Math.max(0, baseline.monthsToSettle - withExtra.monthsToSettle),
        interestSaved: Math.max(0, Math.round(baseline.totalInterest - withExtra.totalInterest)),
        yearOneInterest: Math.round(
            withExtra.rows.slice(0, 12).reduce((sum, row) => sum + row.interest, 0)
        ),
        yearOnePrincipal: Math.round(
            withExtra.rows.slice(0, 12).reduce((sum, row) => sum + row.principal, 0)
        ),
        balanceAfterFiveYears: Math.round(
            withExtra.rows[Math.min(60, withExtra.rows.length) - 1]?.balance ??
                withExtra.finalBalance
        ),
    };
}

/** Reverse affordability: monthly budget → max loan / purchase price at a deposit %. */
export function affordabilityFromBudget(input: {
    monthlyBudget: number;
    interestRate: number;
    loanTermYears: number;
    depositPct: number;
}) {
    const payments = Math.max(1, Math.round(input.loanTermYears * 12));
    const r = input.interestRate / 100 / 12;
    const budget = Math.max(0, input.monthlyBudget);

    let maxLoan = 0;
    if (budget > 0 && payments > 0) {
        if (r <= 0) {
            maxLoan = budget * payments;
        } else {
            const pow = Math.pow(1 + r, payments);
            maxLoan = (budget * (pow - 1)) / (r * pow);
        }
    }

    const depositPct = Math.min(90, Math.max(0, input.depositPct)) / 100;
    const maxPurchase =
        depositPct >= 0.999 ? maxLoan : maxLoan / Math.max(0.01, 1 - depositPct);
    const depositCash = Math.max(0, maxPurchase - maxLoan);

    return {
        maxLoan: Math.round(maxLoan),
        maxPurchase: Math.round(maxPurchase),
        depositCash: Math.round(depositCash),
    };
}

export function acquisitionCashEstimate(input: {
    purchasePrice: number;
    deposit: number;
}) {
    const loanAmount = Math.max(0, input.purchasePrice - input.deposit);
    const fees = estimateFees({
        propertyValue: input.purchasePrice,
        bondAmount: loanAmount,
        priceBand: 2,
    });
    return {
        deposit: Math.max(0, input.deposit),
        transferDuty: fees.lines.find((l) => l.id === 'transfer-duty')?.amount ?? 0,
        transferFees: fees.lines.find((l) => l.id === 'professional')?.amount ?? 0,
        bondFees: fees.lines.find((l) => l.id === 'bond-reg')?.amount ?? 0,
        other:
            fees.subtotal -
            (fees.lines.find((l) => l.id === 'transfer-duty')?.amount ?? 0) -
            (fees.lines.find((l) => l.id === 'professional')?.amount ?? 0) -
            (fees.lines.find((l) => l.id === 'bond-reg')?.amount ?? 0),
        vat: fees.vat,
        acquisitionCosts: fees.total,
        cashToClose: Math.max(0, input.deposit) + fees.total,
        lines: fees.lines,
    };
}

export const PRICE_PRESETS = [
    { label: 'R1.2m', value: 1_200_000 },
    { label: 'R1.8m', value: 1_800_000 },
    { label: 'R2.5m', value: 2_500_000 },
    { label: 'R3.5m', value: 3_500_000 },
] as const;

export const DEPOSIT_PRESETS = [0, 10, 20, 30] as const;
export const TERM_PRESETS = [10, 15, 20, 25, 30] as const;

/** Annual balance remaining for repayment curve (year 0 = full loan). */
export function yearlyBalanceCurve(input: {
    loanAmount: number;
    interestRate: number;
    loanTermYears: number;
    extraMonthly?: number;
}): { year: number; balance: number; interestPaid: number; principalPaid: number }[] {
    const payments = Math.max(1, Math.round(input.loanTermYears * 12));
    const scheduled = monthlyPayment(input.loanAmount, input.interestRate, payments);
    const result = runAmortisation({
        balance: input.loanAmount,
        annualRatePct: input.interestRate,
        scheduledPayment: scheduled,
        extraMonthly: Math.max(0, input.extraMonthly || 0),
        maxMonths: payments + 12,
    });

    const points: { year: number; balance: number; interestPaid: number; principalPaid: number }[] = [
        { year: 0, balance: input.loanAmount, interestPaid: 0, principalPaid: 0 },
    ];

    let interestPaid = 0;
    let principalPaid = 0;
    for (let y = 1; y <= input.loanTermYears; y++) {
        const endMonth = Math.min(y * 12, result.rows.length);
        const slice = result.rows.slice((y - 1) * 12, endMonth);
        interestPaid += slice.reduce((s, r) => s + r.interest, 0);
        principalPaid += slice.reduce((s, r) => s + r.principal, 0);
        const balance = result.rows[endMonth - 1]?.balance ?? 0;
        points.push({
            year: y,
            balance: Math.max(0, Math.round(balance)),
            interestPaid: Math.round(interestPaid),
            principalPaid: Math.round(principalPaid),
        });
        if (balance <= 1) break;
    }
    return points;
}

export type AffordabilityBand = 'comfortable' | 'stretch' | 'tight';

export function classifyAffordability(monthly: number, budget: number): {
    band: AffordabilityBand;
    label: string;
    hint: string;
    ratio: number;
} {
    if (budget <= 0) {
        return {
            band: 'comfortable',
            label: 'Set a budget to score this',
            hint: 'Add a monthly comfort budget to see how this repayment sits.',
            ratio: 0,
        };
    }
    const ratio = monthly / budget;
    if (ratio <= 0.85) {
        return {
            band: 'comfortable',
            label: 'Comfortable',
            hint: 'This repayment sits within your comfort budget with room to breathe.',
            ratio,
        };
    }
    if (ratio <= 1.05) {
        return {
            band: 'stretch',
            label: 'Stretch',
            hint: 'You are near your comfort line — a rate rise or rates/levies could pinch.',
            ratio,
        };
    }
    return {
        band: 'tight',
        label: 'Tight',
        hint: 'This repayment exceeds your comfort budget. Lower price, raise deposit, or extend term.',
        ratio,
    };
}

export function recommendTerm(rows: { years: number; monthly: number; interest: number }[]): {
    years: number;
    reason: string;
} {
    if (rows.length === 0) return { years: 20, reason: 'A 20-year term is a common South African starting point.' };
    // Prefer the term that keeps monthly moderate while cutting interest vs longest
    const longest = rows[rows.length - 1];
    const mid = rows.find((r) => r.years === 20) || rows[Math.floor(rows.length / 2)];
    const shortest = rows[0];
    const midVsLongInterestSave = longest.interest - mid.interest;
    const midVsShortMonthlyDelta = mid.monthly - shortest.monthly;
    if (midVsLongInterestSave > longest.interest * 0.12 && midVsShortMonthlyDelta < mid.monthly * 0.35) {
        return {
            years: mid.years,
            reason: `${mid.years} years balances a manageable repayment with meaningfully less interest than the longest term.`,
        };
    }
    return {
        years: mid.years,
        reason: `${mid.years} years is a practical midpoint between cash-flow pressure and total interest.`,
    };
}

export function buildCoachInsight(input: {
    mode: 'repayment' | 'affordability' | 'cash';
    monthly: number;
    loanAmount: number;
    totalInterest: number;
    depositPct: number;
    ltvPct: number;
    interestRate: number;
    loanTermYears: number;
    extraMonthly: number;
    monthsSaved: number;
    interestSaved: number;
    affordBand: AffordabilityBand;
    maxPurchase: number;
    cashToClose: number;
    purchasePrice: number;
}): { headline: string; body: string; actions: string[] } {
    if (input.mode === 'affordability') {
        return {
            headline: 'What this budget can unlock',
            body: `At ${formatZar(input.monthly)}/month and ${input.interestRate}% over ${input.loanTermYears} years, an indicative purchase ceiling sits near ${formatZar(input.maxPurchase)}. Banks still weigh income, debts and credit — treat this as a planning band.`,
            actions: [
                'Run a soft prequal before you offer',
                'Keep 3–6 months of repayments in reserve',
                'Stress the rate +2% before you stretch',
            ],
        };
    }
    if (input.mode === 'cash') {
        return {
            headline: 'Cash beyond the deposit',
            body: `Plan for about ${formatZar(input.cashToClose)} to close on a ${formatZar(input.purchasePrice)} purchase — deposit plus illustrative transfer duty, attorney and bond registration costs.`,
            actions: [
                'Ask a conveyancer for a written quote',
                'Budget rates/levy clearances separately',
                'Don’t confuse deposit with cash-to-close',
            ],
        };
    }

    const actions: string[] = [];
    if (input.depositPct < 10) {
        actions.push('Aim for at least 10% deposit to improve LTV optics');
    } else if (input.depositPct < 20) {
        actions.push('A higher deposit can cut LTV and sometimes pricing');
    }
    if (input.extraMonthly <= 0) {
        actions.push('Try +R1,000 extra monthly to see interest saved');
    } else if (input.interestSaved > 0) {
        actions.push(`Your extra payments could save about ${formatZar(input.interestSaved)}`);
    }
    if (input.affordBand === 'tight') {
        actions.push('Lower the price band or lengthen the term for breathing room');
    } else if (input.affordBand === 'stretch') {
        actions.push('Model a +2% rate rise before you commit');
    } else {
        actions.push('Lock the habit of paying a little extra when cash allows');
    }
    if (actions.length < 3) {
        actions.push('Learn how prime + margin pricing works in our home loans lesson');
    }

    let headline = 'Your repayment story';
    let body = `You’d repay about ${formatZar(input.monthly)}/month on a ${formatZar(input.loanAmount)} loan. Over ${input.loanTermYears} years, interest is roughly ${formatZar(input.totalInterest)} — LTV sits at ${input.ltvPct.toFixed(0)}%.`;

    if (input.extraMonthly > 0 && input.monthsSaved > 0) {
        headline = 'Extra payments change the ending';
        body = `At +${formatZar(input.extraMonthly)}/month you could settle ~${input.monthsSaved} months sooner and save about ${formatZar(input.interestSaved)} in interest (educational estimate).`;
    } else if (input.affordBand === 'tight') {
        headline = 'This repayment looks tight';
        body = `${formatZar(input.monthly)}/month sits above your comfort budget. Soften it with price, deposit, or term — then re-check after a +2% rate stress.`;
    } else if (input.ltvPct > 90) {
        headline = 'High LTV — price the risk';
        body = `LTV near ${input.ltvPct.toFixed(0)}% means less equity buffer. Banks may price risk higher; a larger deposit often helps more than a longer term.`;
    }

    return { headline, body, actions: actions.slice(0, 3) };
}

/** Debt-to-income: bond instalment + optional living expenses vs gross income. */
export function debtToIncomeRatio(
    monthlyRepayment: number,
    monthlyIncome: number,
    monthlyExpenses = 0
): number {
    if (monthlyIncome <= 0) return 0;
    return ((monthlyRepayment + monthlyExpenses) / monthlyIncome) * 100;
}

export type BondScenarioCard = {
    id: 'current' | 'optimised' | 'aggressive';
    label: string;
    monthly: number;
    interestPaid: number;
    durationYears: number;
    durationMonths: number;
    interestSaved: number;
    totalCost: number;
    recommended?: boolean;
};

export function buildScenarioComparison(input: {
    purchasePrice: number;
    deposit: number;
    interestRate: number;
    loanTermYears: number;
    extraMonthly: number;
}): BondScenarioCard[] {
    const base = summariseBondRepayment({
        purchasePrice: input.purchasePrice,
        deposit: input.deposit,
        interestRate: input.interestRate,
        loanTermYears: input.loanTermYears,
    });
    const optimisedExtra = input.extraMonthly > 0 ? input.extraMonthly : 1_000;
    const aggressiveExtra = Math.max(optimisedExtra * 2, 2_500);

    const optimisedImpact = extraPaymentImpact({
        loanAmount: base.loanAmount,
        interestRate: input.interestRate,
        loanTermYears: input.loanTermYears,
        extraMonthly: optimisedExtra,
    });
    const aggressiveImpact = extraPaymentImpact({
        loanAmount: base.loanAmount,
        interestRate: input.interestRate,
        loanTermYears: input.loanTermYears,
        extraMonthly: aggressiveExtra,
    });

    const baselineInterest = base.totalInterest;
    const scenarios: BondScenarioCard[] = [
        {
            id: 'current',
            label: 'Current scenario',
            monthly: base.monthlyRepayment,
            interestPaid: base.totalInterest,
            durationYears: input.loanTermYears,
            durationMonths: base.payments,
            interestSaved: 0,
            totalCost: base.totalPayable,
        },
        {
            id: 'optimised',
            label: 'Optimised',
            monthly: optimisedImpact.scheduled + optimisedExtra,
            interestPaid: Math.max(0, baselineInterest - optimisedImpact.interestSaved),
            durationYears: Math.round((optimisedImpact.optimizedMonths / 12) * 10) / 10,
            durationMonths: optimisedImpact.optimizedMonths,
            interestSaved: optimisedImpact.interestSaved,
            totalCost: base.loanAmount + Math.max(0, baselineInterest - optimisedImpact.interestSaved),
            recommended: true,
        },
        {
            id: 'aggressive',
            label: 'Aggressive repayment',
            monthly: aggressiveImpact.scheduled + aggressiveExtra,
            interestPaid: Math.max(0, baselineInterest - aggressiveImpact.interestSaved),
            durationYears: Math.round((aggressiveImpact.optimizedMonths / 12) * 10) / 10,
            durationMonths: aggressiveImpact.optimizedMonths,
            interestSaved: aggressiveImpact.interestSaved,
            totalCost: base.loanAmount + Math.max(0, baselineInterest - aggressiveImpact.interestSaved),
        },
    ];
    return scenarios;
}

export type BondChartTab = 'balance' | 'interest' | 'principal' | 'equity' | 'cashflow';

export type BondChartPoint = {
    year: number;
    balance: number;
    interestPaid: number;
    principalPaid: number;
    equity: number;
    cashFlow: number;
};

export function buildBondChartSeries(input: {
    purchasePrice: number;
    loanAmount: number;
    interestRate: number;
    loanTermYears: number;
    extraMonthly?: number;
    monthlyRepayment: number;
}): BondChartPoint[] {
    const curve = yearlyBalanceCurve({
        loanAmount: input.loanAmount,
        interestRate: input.interestRate,
        loanTermYears: input.loanTermYears,
        extraMonthly: input.extraMonthly,
    });
    return curve.map((p) => ({
        year: p.year,
        balance: p.balance,
        interestPaid: p.interestPaid,
        principalPaid: p.principalPaid,
        equity: Math.max(0, input.purchasePrice - p.balance),
        cashFlow: p.year === 0 ? 0 : -input.monthlyRepayment * 12,
    }));
}

export type BondInsight = {
    id: string;
    icon: 'savings' | 'deposit' | 'dti' | 'rate' | 'term';
    title: string;
    body: string;
};

export function generateBondInsights(input: {
    monthlyRepayment: number;
    loanAmount: number;
    totalInterest: number;
    depositPct: number;
    ltvPct: number;
    interestRate: number;
    loanTermYears: number;
    extraMonthly: number;
    monthsSaved: number;
    interestSaved: number;
    dtiPct: number;
    monthlyIncome: number;
    affordBand: AffordabilityBand;
}): BondInsight[] {
    const insights: BondInsight[] = [];

    const extraForInsight = input.extraMonthly > 0 ? input.extraMonthly : 1_000;
    const extraPreview = extraPaymentImpact({
        loanAmount: input.loanAmount,
        interestRate: input.interestRate,
        loanTermYears: input.loanTermYears,
        extraMonthly: extraForInsight,
    });
    if (extraPreview.interestSaved > 0) {
        insights.push({
            id: 'extra',
            icon: 'savings',
            title: 'Accelerate your payoff',
            body: `Paying an extra ${formatZar(extraForInsight)} monthly could save approximately ${formatZar(extraPreview.interestSaved)} in interest and reduce your bond term by nearly ${Math.round(extraPreview.monthsSaved / 12)} years.`,
        });
    }

    if (input.depositPct < 15) {
        const at15 = summariseBondRepayment({
            purchasePrice: input.loanAmount / (1 - input.depositPct / 100),
            deposit: (input.loanAmount / (1 - input.depositPct / 100)) * 0.15,
            interestRate: input.interestRate,
            loanTermYears: input.loanTermYears,
        });
        if (at15.monthlyRepayment < input.monthlyRepayment) {
            insights.push({
                id: 'deposit',
                icon: 'deposit',
                title: 'Grow your deposit',
                body: `Increasing your deposit to 15% could lower your monthly repayment to about ${formatZar(at15.monthlyRepayment)} and improve your LTV position with lenders.`,
            });
        }
    }

    if (input.monthlyIncome > 0) {
        if (input.dtiPct <= 35) {
            insights.push({
                id: 'dti',
                icon: 'dti',
                title: 'Healthy debt-to-income',
                body: `Your debt-to-income ratio of ${input.dtiPct.toFixed(0)}% indicates a comfortable borrowing position relative to your stated income.`,
            });
        } else if (input.dtiPct > 45) {
            insights.push({
                id: 'dti-tight',
                icon: 'dti',
                title: 'DTI needs attention',
                body: `At ${input.dtiPct.toFixed(0)}% debt-to-income, lenders may view this as stretched. Consider a larger deposit or lower purchase price.`,
            });
        }
    } else if (input.affordBand === 'comfortable') {
        insights.push({
            id: 'afford',
            icon: 'dti',
            title: 'Repayment within budget',
            body: 'Your instalment sits within your comfort budget with room for rates, levies and maintenance.',
        });
    }

    const stressPlus1 = monthlyPayment(
        input.loanAmount,
        input.interestRate + 1,
        Math.round(input.loanTermYears * 12)
    );
    if (stressPlus1 > input.monthlyRepayment * 1.08) {
        insights.push({
            id: 'rate',
            icon: 'rate',
            title: 'Rate sensitivity',
            body: `A +1% rate rise would lift your instalment to about ${formatZar(Math.round(stressPlus1))} — stress-test before you offer.`,
        });
    }

    if (input.loanTermYears >= 25) {
        insights.push({
            id: 'term',
            icon: 'term',
            title: 'Term trade-off',
            body: `A shorter term than ${input.loanTermYears} years typically cuts total interest materially — compare the Optimised scenario above.`,
        });
    }

    return insights.slice(0, 4);
}

export type SavedBondCalculation = {
    id: string;
    label: string;
    savedAt: string;
    purchasePrice: number;
    deposit: number;
    interestRate: number;
    loanTerm: number;
    extraMonthly: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyBudget: number;
};

export const DEFAULT_BOND_INPUTS = {
    purchasePrice: 1_800_000,
    deposit: 180_000,
    interestRate: 11.75,
    loanTerm: 20,
    extraMonthly: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyBudget: 18_000,
    affordDepositPct: 10,
};

