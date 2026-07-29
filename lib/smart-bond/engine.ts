import { clamp } from '@/lib/smart-bond/format';
import type {
    AmortisationRow,
    AmortisationView,
    BondProfile,
    InvestmentPlanInput,
    PortfolioProperty,
    ScenarioOverrides,
    ScoreBreakdown,
} from '@/lib/smart-bond/types';

export function monthlyRateFromAnnual(annualPct: number) {
    return annualPct / 100 / 12;
}

/** Standard equal-instalment (amortising) monthly repayment. */
export function monthlyPayment(principal: number, annualRatePct: number, termMonths: number) {
    if (principal <= 0 || termMonths <= 0) return 0;
    const r = monthlyRateFromAnnual(annualRatePct);
    if (r <= 0) return principal / termMonths;
    const pow = Math.pow(1 + r, termMonths);
    return (principal * (r * pow)) / (pow - 1);
}

export function withDerivedRepayment(profile: BondProfile): BondProfile {
    const base =
        profile.monthlyRepayment > 0
            ? profile.monthlyRepayment
            : monthlyPayment(
                  profile.outstandingBalance,
                  profile.annualInterestRate,
                  profile.remainingTermMonths
              );
    return { ...profile, monthlyRepayment: Math.round(base) };
}

export type RunResult = {
    rows: AmortisationRow[];
    monthsToSettle: number;
    totalInterest: number;
    totalPaid: number;
    totalExtra: number;
    finalBalance: number;
};

/**
 * Simulate amortisation with optional extra monthly + annual lump sum (month 12 of each year).
 * Caps at 600 months for safety.
 */
export function runAmortisation(input: {
    balance: number;
    annualRatePct: number;
    scheduledPayment: number;
    extraMonthly?: number;
    annualLumpSum?: number;
    maxMonths?: number;
}): RunResult {
    const maxMonths = input.maxMonths ?? 600;
    let balance = Math.max(0, input.balance);
    const r = monthlyRateFromAnnual(input.annualRatePct);
    const scheduled = Math.max(0, input.scheduledPayment);
    const extraMonthly = Math.max(0, input.extraMonthly || 0);
    const annualLump = Math.max(0, input.annualLumpSum || 0);

    const rows: AmortisationRow[] = [];
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    let totalPaid = 0;
    let totalExtra = 0;
    let month = 0;

    while (balance > 1 && month < maxMonths) {
        month += 1;
        const interest = balance * r;
        let principalComponent = scheduled - interest;
        let payment = scheduled;
        let extra = extraMonthly;

        if (month % 12 === 0 && annualLump > 0) {
            extra += annualLump;
        }

        if (principalComponent < 0) {
            // Payment does not cover interest — still accrue (educational edge case)
            principalComponent = 0;
        }

        let appliedPrincipal = principalComponent + extra;
        if (appliedPrincipal > balance) {
            extra = Math.max(0, extra - (appliedPrincipal - balance - principalComponent));
            appliedPrincipal = balance;
            payment = interest + appliedPrincipal - Math.max(0, extraMonthly);
            if (month % 12 === 0) payment = interest + appliedPrincipal;
        }

        balance = Math.max(0, balance - appliedPrincipal);
        cumulativeInterest += interest;
        cumulativePrincipal += appliedPrincipal;
        totalPaid += interest + appliedPrincipal;
        totalExtra += Math.max(0, extra);

        rows.push({
            period: month,
            label: `M${month}`,
            payment: interest + appliedPrincipal,
            principal: Math.max(0, appliedPrincipal - Math.max(0, extra)),
            interest,
            extra: Math.max(0, extra),
            balance,
            cumulativeInterest,
            cumulativePrincipal,
        });
    }

    return {
        rows,
        monthsToSettle: month,
        totalInterest: cumulativeInterest,
        totalPaid,
        totalExtra,
        finalBalance: balance,
    };
}

export function aggregateAmortisation(rows: AmortisationRow[], view: AmortisationView) {
    if (view === 'monthly') return rows;
    const size = view === 'quarterly' ? 3 : 12;
    const out: AmortisationRow[] = [];
    for (let i = 0; i < rows.length; i += size) {
        const chunk = rows.slice(i, i + size);
        const last = chunk[chunk.length - 1];
        out.push({
            period: Math.floor(i / size) + 1,
            label: view === 'quarterly' ? `Q${Math.floor(i / size) + 1}` : `Y${Math.floor(i / size) + 1}`,
            payment: chunk.reduce((s, r) => s + r.payment, 0),
            principal: chunk.reduce((s, r) => s + r.principal, 0),
            interest: chunk.reduce((s, r) => s + r.interest, 0),
            extra: chunk.reduce((s, r) => s + r.extra, 0),
            balance: last.balance,
            cumulativeInterest: last.cumulativeInterest,
            cumulativePrincipal: last.cumulativePrincipal,
        });
    }
    return out;
}

export function compareBaselineVsOptimized(profile: BondProfile) {
    const p = withDerivedRepayment(profile);
    const baseline = runAmortisation({
        balance: p.outstandingBalance,
        annualRatePct: p.annualInterestRate,
        scheduledPayment: p.monthlyRepayment,
        extraMonthly: 0,
        annualLumpSum: 0,
    });
    const optimized = runAmortisation({
        balance: p.outstandingBalance,
        annualRatePct: p.annualInterestRate,
        scheduledPayment: p.monthlyRepayment,
        extraMonthly: p.extraMonthly,
        annualLumpSum: p.annualLumpSum,
    });
    const monthsSaved = Math.max(0, baseline.monthsToSettle - optimized.monthsToSettle);
    const interestSaved = Math.max(0, baseline.totalInterest - optimized.totalInterest);
    return { baseline, optimized, monthsSaved, interestSaved, profile: p };
}

export function equityNow(propertyValue: number, balance: number) {
    return Math.max(0, propertyValue - balance);
}

export function ltvPct(balance: number, propertyValue: number) {
    if (propertyValue <= 0) return 0;
    return (balance / propertyValue) * 100;
}

export function projectEquitySeries(
    profile: BondProfile,
    years: number,
    run: RunResult
) {
    const points: Array<{
        year: number;
        value: number;
        balance: number;
        equity: number;
        ltv: number;
    }> = [];
    for (let y = 0; y <= years; y++) {
        const month = y * 12;
        const row = run.rows[Math.min(month, run.rows.length - 1)];
        const balance = y === 0 ? profile.outstandingBalance : row?.balance ?? 0;
        const value =
            profile.propertyValue * Math.pow(1 + profile.annualAppreciationPct / 100, y);
        const equity = Math.max(0, value - balance);
        points.push({
            year: y,
            value,
            balance,
            equity,
            ltv: ltvPct(balance, value),
        });
    }
    return points;
}

export function rateShockPayment(balance: number, baseRate: number, termMonths: number, delta: number) {
    return monthlyPayment(balance, baseRate + delta, termMonths);
}

export function refinanceAnalysis(input: {
    balance: number;
    currentRate: number;
    currentPayment: number;
    remainingMonths: number;
    newRate: number;
    newTermMonths: number;
    fees: number;
}) {
    const currentRun = runAmortisation({
        balance: input.balance,
        annualRatePct: input.currentRate,
        scheduledPayment: input.currentPayment,
    });
    const newPayment = monthlyPayment(input.balance, input.newRate, input.newTermMonths);
    const newRun = runAmortisation({
        balance: input.balance,
        annualRatePct: input.newRate,
        scheduledPayment: newPayment,
    });
    const monthlySaving = input.currentPayment - newPayment;
    const interestSaving = currentRun.totalInterest - newRun.totalInterest;
    const breakEvenMonths =
        monthlySaving > 0 ? Math.ceil(input.fees / monthlySaving) : Number.POSITIVE_INFINITY;
    return {
        newPayment,
        monthlySaving,
        interestSaving,
        breakEvenMonths,
        currentTotalInterest: currentRun.totalInterest,
        newTotalInterest: newRun.totalInterest,
        fees: input.fees,
        netLongTermSaving: interestSaving - input.fees,
    };
}

export function analyseInvestmentPlan(input: InvestmentPlanInput) {
    const loanNeeded = Math.max(0, input.targetPrice - input.depositAmount);
    const suggestedDepositPct = input.targetPrice > 0 ? (input.depositAmount / input.targetPrice) * 100 : 0;
    const repayment = monthlyPayment(loanNeeded, input.interestRate, input.loanTermYears * 12);
    const effectiveRent =
        input.rentalIncome * (1 - clamp(input.vacancyMonthsPerYear, 0, 12) / 12);
    const operating =
        input.maintenanceMonthly + input.insuranceMonthly + input.ratesMonthly;
    const cashFlow = effectiveRent - repayment - operating;
    const grossYield =
        input.targetPrice > 0 ? ((input.rentalIncome * 12) / input.targetPrice) * 100 : 0;
    const netYield =
        input.targetPrice > 0
            ? (((effectiveRent - operating) * 12) / input.targetPrice) * 100
            : 0;
    const totalDebtService = input.existingBondRepayment + repayment;
    const dti =
        input.monthlyIncome > 0 ? (totalDebtService / input.monthlyIncome) * 100 : 0;
    const surplus =
        input.monthlyIncome -
        input.monthlyExpenses -
        input.existingBondRepayment +
        input.rentalIncome;
    const monthsToDeposit =
        surplus > 0 && input.depositAmount > input.savings
            ? Math.ceil((input.depositAmount - input.savings) / surplus)
            : input.depositAmount <= input.savings
              ? 0
              : null;
    const ltv = ltvPct(loanNeeded, input.targetPrice);
    return {
        loanNeeded,
        repayment,
        cashFlow,
        grossYield,
        netYield,
        dti,
        monthsToDeposit,
        suggestedDepositPct,
        ltv,
        affordabilityNote:
            dti > 30
                ? 'Estimated debt-to-income is elevated versus common planning heuristics — lenders apply their own assessments.'
                : 'Estimated debt-to-income is within a commonly discussed planning band — not an approval.',
    };
}

export function portfolioSummary(properties: PortfolioProperty[]) {
    const totalValue = properties.reduce((s, p) => s + p.value, 0);
    const totalDebt = properties.reduce((s, p) => s + p.loanBalance, 0);
    const equity = totalValue - totalDebt;
    const rent = properties.reduce((s, p) => s + p.monthlyRent, 0);
    const opex = properties.reduce((s, p) => s + p.monthlyExpenses, 0);
    const bondPay = properties.reduce(
        (s, p) => s + monthlyPayment(p.loanBalance, p.rate, Math.max(1, p.remainingMonths)),
        0
    );
    const cashFlow = rent - opex - bondPay;
    const grossYield = totalValue > 0 ? ((rent * 12) / totalValue) * 100 : 0;
    const netYield = totalValue > 0 ? (((rent - opex) * 12) / totalValue) * 100 : 0;
    const roi = equity > 0 ? (cashFlow * 12) / equity * 100 : 0;
    return {
        totalValue,
        totalDebt,
        equity,
        rent,
        opex,
        bondPay,
        cashFlow,
        grossYield,
        netYield,
        roi,
        ltv: ltvPct(totalDebt, totalValue),
        count: properties.length,
    };
}

export function investmentScore(properties: PortfolioProperty[]): ScoreBreakdown {
    const s = portfolioSummary(properties);
    const cashScore = clamp(50 + s.cashFlow / 200, 0, 100);
    const equityScore = clamp((s.equity / Math.max(1, s.totalValue)) * 100, 0, 100);
    const yieldScore = clamp(s.netYield * 12, 0, 100);
    const leverageScore = clamp(100 - s.ltv, 0, 100);
    const diversifyScore = clamp(properties.length * 20, 0, 100);
    const factors = [
        { key: 'cash', label: 'Cash flow', score: cashScore, weight: 0.25, note: 'After estimated bond & opex' },
        { key: 'equity', label: 'Equity share', score: equityScore, weight: 0.25, note: 'Equity vs portfolio value' },
        { key: 'yield', label: 'Net yield', score: yieldScore, weight: 0.2, note: 'Indicative net rental yield' },
        { key: 'leverage', label: 'Loan exposure', score: leverageScore, weight: 0.15, note: 'Lower LTV scores higher' },
        { key: 'div', label: 'Diversification', score: diversifyScore, weight: 0.15, note: 'Number of properties' },
    ];
    const score = Math.round(factors.reduce((t, f) => t + f.score * f.weight, 0));
    return {
        score,
        label: score >= 75 ? 'Strong' : score >= 55 ? 'Building' : 'Early stage',
        factors,
    };
}

export function wealthScore(profile: BondProfile, optimized: ReturnType<typeof compareBaselineVsOptimized>): ScoreBreakdown {
    const p = optimized.profile;
    const eq = equityNow(p.propertyValue, p.outstandingBalance);
    const ltv = ltvPct(p.outstandingBalance, p.propertyValue);
    const equityFactor = clamp((eq / Math.max(1, p.propertyValue)) * 120, 0, 100);
    const ltvFactor = clamp(100 - ltv, 0, 100);
    const payoffFactor = clamp(
        100 - (optimized.optimized.monthsToSettle / Math.max(1, p.originalTermMonths)) * 80,
        0,
        100
    );
    const extraFactor = clamp((p.extraMonthly / Math.max(1, p.monthlyRepayment)) * 200, 0, 100);
    const affordFactor = clamp(
        100 - ((p.monthlyRepayment + p.extraMonthly) / Math.max(1, p.monthlyIncome)) * 220,
        0,
        100
    );
    const resilience =
        p.monthlyIncome - p.monthlyExpenses - p.monthlyRepayment > 0
            ? clamp(
                  ((p.monthlyIncome - p.monthlyExpenses - p.monthlyRepayment) /
                      Math.max(1, p.monthlyIncome)) *
                      150,
                  0,
                  100
              )
            : 20;
    const factors = [
        { key: 'equity', label: 'Equity growth', score: equityFactor, weight: 0.22, note: 'Current equity vs property value' },
        { key: 'ltv', label: 'Loan-to-value', score: ltvFactor, weight: 0.18, note: 'Lower LTV supports resilience' },
        { key: 'payoff', label: 'Payoff trajectory', score: payoffFactor, weight: 0.18, note: 'Estimated path with extras' },
        { key: 'extra', label: 'Repayment behaviour', score: extraFactor, weight: 0.14, note: 'Extra repayments vs instalment' },
        { key: 'afford', label: 'Affordability headroom', score: affordFactor, weight: 0.14, note: 'Bond vs income heuristic' },
        { key: 'resilience', label: 'Financial resilience', score: resilience, weight: 0.14, note: 'Surplus after living costs' },
    ];
    const score = Math.round(factors.reduce((t, f) => t + f.score * f.weight, 0));
    return {
        score,
        label: score >= 80 ? 'Excellent' : score >= 65 ? 'Healthy' : score >= 45 ? 'Developing' : 'Needs attention',
        factors,
    };
}

export function bondHealthScore(profile: BondProfile, optimized: ReturnType<typeof compareBaselineVsOptimized>): ScoreBreakdown {
    const p = optimized.profile;
    const ltv = ltvPct(p.outstandingBalance, p.propertyValue);
    const interestShare =
        optimized.baseline.totalInterest /
        Math.max(1, optimized.baseline.totalInterest + p.outstandingBalance);
    const interestEff = clamp(100 - interestShare * 100, 0, 100);
    const consistency = p.extraMonthly > 0 || p.annualLumpSum > 0 ? 82 : 55;
    const termHealth = clamp(100 - (p.remainingTermMonths / 360) * 70, 0, 100);
    const rateHealth = clamp(100 - (p.annualInterestRate - 8) * 8, 0, 100);
    const equityPace = clamp(optimized.interestSaved / 5000, 0, 100);
    const factors = [
        { key: 'ltv', label: 'LTV health', score: clamp(100 - ltv, 0, 100), weight: 0.25, note: 'Balance vs value' },
        { key: 'interest', label: 'Interest efficiency', score: interestEff, weight: 0.2, note: 'Interest share of total cost' },
        { key: 'consistency', label: 'Payment consistency', score: consistency, weight: 0.15, note: 'Extras / lump sums planned' },
        { key: 'term', label: 'Remaining term', score: termHealth, weight: 0.15, note: 'Shorter remaining term scores higher' },
        { key: 'rate', label: 'Rate positioning', score: rateHealth, weight: 0.15, note: 'Vs typical SA prime band (illustrative)' },
        { key: 'pace', label: 'Acceleration', score: equityPace, weight: 0.1, note: 'Estimated interest saved via extras' },
    ];
    const score = Math.round(factors.reduce((t, f) => t + f.score * f.weight, 0));
    return {
        score,
        label: score >= 80 ? 'Robust' : score >= 60 ? 'Stable' : score >= 40 ? 'Watch' : 'Stressed',
        factors,
    };
}

export function applyScenario(profile: BondProfile, s: ScenarioOverrides): BondProfile {
    return {
        ...profile,
        annualInterestRate: Math.max(0.1, profile.annualInterestRate + s.rateDeltaPct),
        extraMonthly: profile.extraMonthly + s.extraMonthly,
        annualLumpSum: profile.annualLumpSum + s.annualBonus + s.lumpSum,
        annualAppreciationPct: s.appreciationPct || profile.annualAppreciationPct,
        remainingTermMonths: Math.max(1, profile.remainingTermMonths + s.termMonthsDelta),
        outstandingBalance: Math.max(0, profile.outstandingBalance + s.unexpectedExpense),
    };
}

/** Rough SA transfer duty + fees educational estimate (not conveyancer advice). */
export function estimateTransferCosts(purchasePrice: number) {
    // Simplified educational bands — not a conveyancing quote
    const duty =
        purchasePrice <= 1_100_000
            ? 0
            : purchasePrice <= 1_512_500
              ? (purchasePrice - 1_100_000) * 0.03
              : purchasePrice <= 2_177_500
                ? 12_375 + (purchasePrice - 1_512_500) * 0.06
                : purchasePrice <= 2_790_000
                  ? 52_275 + (purchasePrice - 2_177_500) * 0.08
                  : purchasePrice <= 12_100_000
                    ? 101_275 + (purchasePrice - 2_790_000) * 0.11
                    : 1_125_375 + (purchasePrice - 12_100_000) * 0.13;
    const transferFees = purchasePrice * 0.01;
    const bondRegistration = purchasePrice * 0.008;
    return {
        transferDuty: duty,
        transferFees,
        bondRegistration,
        total: duty + transferFees + bondRegistration,
    };
}

export function rentVsBuy(input: {
    rentMonthly: number;
    buyPrice: number;
    deposit: number;
    rate: number;
    termYears: number;
    years: number;
    appreciationPct: number;
}) {
    const loan = Math.max(0, input.buyPrice - input.deposit);
    const payment = monthlyPayment(loan, input.rate, input.termYears * 12);
    const rentTotal = input.rentMonthly * 12 * input.years;
    const buyInterest = runAmortisation({
        balance: loan,
        annualRatePct: input.rate,
        scheduledPayment: payment,
        maxMonths: input.years * 12,
    }).totalInterest;
    const endValue = input.buyPrice * Math.pow(1 + input.appreciationPct / 100, input.years);
    const endBalance =
        runAmortisation({
            balance: loan,
            annualRatePct: input.rate,
            scheduledPayment: payment,
            maxMonths: input.years * 12,
        }).finalBalance;
    const buyEquity = endValue - endBalance;
    return { payment, rentTotal, buyInterest, endValue, endBalance, buyEquity };
}
