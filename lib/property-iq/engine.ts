import { monthlyPayment } from '@/lib/smart-bond/engine';
import type {
    BondSimInput,
    ChartMetric,
    ChartRange,
    IqProperty,
    PortfolioGoal,
    PropertyCondition,
    PropertyType,
    BuildFunding,
} from './types';
import {
    propertyConditionScore,
    totalBuildCostOf,
    coerceBuildCostBreakdown,
    coerceBuildFunding,
    buildFundingLabel,
    type BuildCostBreakdown,
} from './types';
import { formatCurrency } from '@/lib/currency';
import {
    currentSaPrimeRate,
    inferPrimeMargin,
    saBondRateOn,
} from './sa-prime-rates';
import {
    locationAnchorValue,
    locationAppreciationPct,
    resolveCompanionSuburb,
} from './location-value';

export function formatZar(n: number) {
    return formatCurrency(Math.round(n));
}

export function formatPct(n: number, digits = 1) {
    return `${n.toFixed(digits)}%`;
}

/** Bank-style rounding to the nearest cent. */
export function roundCents(n: number): number {
    if (!Number.isFinite(n)) return 0;
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Common SA home-loan terms (years). */
export const BOND_TERM_YEAR_OPTIONS = [20, 25, 30] as const;

export function bondTermYearsOf(property: IqProperty): number {
    if (property.bondTermMonths > 0) {
        return Math.round(property.bondTermMonths / 12);
    }
    return 20;
}

/** Rate used for Companion maths — falls back to current SA prime when unset. */
export function effectiveBondRatePct(property: Pick<IqProperty, 'interestRate'>): number {
    if (property.interestRate > 0) return property.interestRate;
    return currentSaPrimeRate();
}

/** Remaining months for instalment / what-if maths. */
export function effectiveRemainingTermMonths(
    property: Pick<IqProperty, 'remainingTermMonths' | 'bondTermMonths'>
): number {
    if (property.remainingTermMonths > 0) return property.remainingTermMonths;
    if (property.bondTermMonths > 0) return property.bondTermMonths;
    return 240;
}

/**
 * Monthly instalment for display and what-if.
 * Recomputes from outstanding + rate + remaining term when the stored figure is missing.
 */
export function effectiveMonthlyBond(
    property: Pick<
        IqProperty,
        'monthlyBond' | 'outstandingBond' | 'interestRate' | 'remainingTermMonths' | 'bondTermMonths'
    >
): number {
    if (property.monthlyBond > 0) return roundCents(property.monthlyBond);
    const balance = Math.max(0, property.outstandingBond || 0);
    if (balance <= 0) return 0;
    return roundCents(
        monthlyPayment(balance, effectiveBondRatePct(property), effectiveRemainingTermMonths(property))
    );
}

export function bondTermLabel(property: IqProperty): string {
    const y = bondTermYearsOf(property);
    return y > 0 ? `${y} years` : '—';
}

/**
 * Accurate equal-instalment (reducing-balance) monthly repayment.
 * Nominal annual rate ÷ 12 — standard SA home-loan method. Nearest cent.
 */
export function calcMonthlyBondAccurate(
    principal: number,
    annualRatePct: number,
    termMonths: number
): number {
    if (principal <= 0 || termMonths <= 0) return 0;
    if (annualRatePct <= 0) return roundCents(principal / termMonths);
    return roundCents(monthlyPayment(principal, annualRatePct, termMonths));
}

/**
 * Original loan: explicit amount, else purchase price − deposit paid.
 * Cash purchases always return 0.
 */
export function originalBondOf(property: IqProperty): number {
    if (property.purchaseFunding === 'cash') return 0;
    if (property.originalBondAmount > 0) return roundCents(property.originalBondAmount);
    const deposit = Math.max(0, property.depositPaid || 0);
    if (property.purchasePrice > 0) {
        return Math.max(0, roundCents(property.purchasePrice - deposit));
    }
    return Math.max(0, roundCents(property.outstandingBond));
}

/** First-of-month settlement / registration date used for amortisation. */
export function bondStartMonth(property: IqProperty): Date {
    const raw = property.transferDate || property.purchaseDate;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

export type BondScheduleMonth = {
    index: number;
    date: Date;
    year: number;
    month: number;
    rate: number;
    payment: number;
    interest: number;
    principalPaid: number;
    balance: number;
};

export type BondScheduleResult = {
    principal: number;
    termMonths: number;
    marginPct: number;
    quotedRate: number;
    months: BondScheduleMonth[];
    /** Balance after `monthsHeld` payments (to-date outstanding). */
    outstandingToDate: number;
    monthsHeld: number;
    /** Instalment that would apply now on the remaining balance. */
    currentInstalment: number;
    effectiveRateNow: number;
    totalInterestPaid: number;
    totalPrincipalPaid: number;
    totalPaid: number;
};

/**
 * Month-by-month SA home-loan schedule.
 * Uses historical prime + client margin (variable rate), recalculates the instalment
 * each month on the outstanding balance for the remaining term, and rounds to cents —
 * matching how SA banks typically reprice a variable bond.
 */
export function runVariableBondSchedule(
    property: IqProperty,
    options?: {
        asOf?: Date;
        /** `toDate` (default) stops at months owned — fast for portfolio/sync. `full` projects whole term. */
        horizon?: 'toDate' | 'full';
    }
): BondScheduleResult {
    const principal = originalBondOf(property);
    const termMonths = property.bondTermMonths > 0 ? property.bondTermMonths : 240;
    const extras = Math.max(0, roundCents(property.extraMonthlyPayment || 0));
    const quotedRate = property.interestRate > 0 ? property.interestRate : currentSaPrimeRate();
    const marginPct = inferPrimeMargin(quotedRate);
    const start = bondStartMonth(property);
    const asOf = options?.asOf ?? new Date();
    const monthsHeld = Math.min(termMonths, monthsBetween(start, asOf));
    const horizon = options?.horizon ?? 'toDate';
    const iterationLimit =
        horizon === 'full' ? termMonths : Math.min(termMonths, Math.max(monthsHeld, 0));

    const oneOffByMonth = new Map<string, number>();
    for (const o of property.oneOffPayments || []) {
        if (!o?.date || !(o.amount > 0)) continue;
        const d = new Date(o.date);
        if (Number.isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        oneOffByMonth.set(key, roundCents((oneOffByMonth.get(key) || 0) + o.amount));
    }

    const months: BondScheduleMonth[] = [];
    let balance = principal;
    const cursor = new Date(start);

    if (principal > 0 && termMonths > 0 && quotedRate > 0 && iterationLimit > 0) {
        for (let i = 0; i < iterationLimit && balance > 0.005; i++) {
            const remaining = termMonths - i;
            const annualRate = saBondRateOn(cursor, marginPct);
            const instalment = calcMonthlyBondAccurate(balance, annualRate, remaining);
            const payment = roundCents(instalment + extras);
            const interest = roundCents(balance * (annualRate / 100 / 12));
            let principalPaid = roundCents(payment - interest);
            if (principalPaid < 0) principalPaid = 0;

            let appliedPayment = payment;
            if (principalPaid >= balance) {
                principalPaid = roundCents(balance);
                appliedPayment = roundCents(interest + principalPaid);
                balance = 0;
            } else {
                balance = roundCents(balance - principalPaid);
            }

            const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
            const lump = oneOffByMonth.get(key) || 0;
            if (lump > 0 && balance > 0) {
                const appliedLump = Math.min(balance, roundCents(lump));
                balance = roundCents(balance - appliedLump);
                principalPaid = roundCents(principalPaid + appliedLump);
                appliedPayment = roundCents(appliedPayment + appliedLump);
            }

            months.push({
                index: i,
                date: new Date(cursor),
                year: cursor.getFullYear(),
                month: cursor.getMonth(),
                rate: annualRate,
                payment: appliedPayment,
                interest,
                principalPaid,
                balance,
            });

            if (balance <= 0.005) {
                balance = 0;
                break;
            }
            cursor.setMonth(cursor.getMonth() + 1);
        }
    }

    const totalInterestPaid = roundCents(months.reduce((s, m) => s + m.interest, 0));
    const totalPrincipalPaid = roundCents(months.reduce((s, m) => s + m.principalPaid, 0));
    const totalPaid = roundCents(months.reduce((s, m) => s + m.payment, 0));

    const outstandingToDate =
        monthsHeld <= 0
            ? roundCents(principal)
            : months.length === 0
              ? roundCents(principal)
              : monthsHeld >= months.length
                ? roundCents(months[months.length - 1]?.balance ?? 0)
                : roundCents(months[monthsHeld - 1]?.balance ?? principal);

    const remaining = Math.max(0, termMonths - monthsHeld);
    const effectiveRateNow = saBondRateOn(asOf, marginPct);
    const currentInstalment =
        outstandingToDate > 0 && remaining > 0 && effectiveRateNow > 0
            ? calcMonthlyBondAccurate(outstandingToDate, effectiveRateNow, remaining)
            : 0;

    return {
        principal,
        termMonths,
        marginPct,
        quotedRate,
        months,
        outstandingToDate,
        monthsHeld,
        currentInstalment,
        effectiveRateNow,
        totalInterestPaid,
        totalPrincipalPaid,
        totalPaid,
    };
}

/** Whole months from start (1st of month) to as-of date. */
function monthsBetween(start: Date, asOf: Date): number {
    let months =
        (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth());
    if (asOf.getDate() < start.getDate()) months -= 1;
    return Math.max(0, months);
}

/**
 * Equal-instalment monthly repayment from original bond, rate, and term.
 */
export function calcMonthlyBond(
    property: Pick<
        IqProperty,
        | 'originalBondAmount'
        | 'outstandingBond'
        | 'interestRate'
        | 'bondTermMonths'
        | 'purchasePrice'
        | 'depositPaid'
    >
): number {
    const asProperty = property as IqProperty;
    const principal = originalBondOf(asProperty);
    const termMonths = property.bondTermMonths > 0 ? property.bondTermMonths : 240;
    if (principal <= 0 || property.interestRate <= 0 || termMonths <= 0) return 0;
    return calcMonthlyBondAccurate(principal, property.interestRate, termMonths);
}

/**
 * Outstanding balance after months owned — variable SA prime path, cent-accurate.
 */
export function calcOutstandingBond(property: IqProperty): number {
    const original = originalBondOf(property);
    if (original <= 0) return 0;

    const termMonths = property.bondTermMonths > 0 ? property.bondTermMonths : 240;
    const monthsHeld = monthsSinceDate(property.transferDate || property.purchaseDate);
    if (monthsHeld <= 0) return roundCents(original);
    if (monthsHeld >= termMonths) return 0;

    if (property.interestRate <= 0) {
        // No rate yet — straight-line capital only (last resort).
        const remaining = Math.max(0, termMonths - monthsHeld) / termMonths;
        return roundCents(original * remaining);
    }

    return runVariableBondSchedule(property).outstandingToDate;
}

/**
 * Keep original bond, monthly instalment and outstanding balance in sync
 * with purchase price, deposit, term, rate and purchase date.
 */
export function syncDerivedBondFields(property: IqProperty): IqProperty {
    const deposit = Math.max(0, property.depositPaid || 0);
    let next: IqProperty = {
        ...property,
        depositPaid: deposit,
        purchaseFunding: property.purchaseFunding === 'cash' ? 'cash' : 'bond',
    };

    if (next.purchaseFunding === 'cash') {
        const paidInFull = next.purchasePrice > 0 ? next.purchasePrice : deposit;
        return syncDerivedCurrentValue({
            ...next,
            depositPaid: paidInFull,
            originalBondAmount: 0,
            outstandingBond: 0,
            monthlyBond: 0,
            remainingTermMonths: 0,
            previousMonthBond: 0,
        });
    }

    if (next.purchasePrice > 0 && (deposit > 0 || next.originalBondAmount <= 0)) {
        next = {
            ...next,
            originalBondAmount: Math.max(0, roundCents(next.purchasePrice - deposit)),
        };
    }

    const termMonths = next.bondTermMonths > 0 ? next.bondTermMonths : 240;
    const monthsHeld = monthsSinceDate(next.transferDate || next.purchaseDate);
    next = {
        ...next,
        bondTermMonths: termMonths,
        remainingTermMonths: Math.max(0, termMonths - monthsHeld),
    };

    // Bond properties need a rate to price the instalment. Empty rate → current prime
    // so monthly repayment / what-if are not stuck at R0.
    if (
        next.interestRate <= 0 &&
        (originalBondOf(next) > 0 || next.outstandingBond > 0 || next.purchasePrice > next.depositPaid)
    ) {
        next = { ...next, interestRate: currentSaPrimeRate() };
    }

    // Prefer pricing the instalment from a known outstanding balance (preserves manual balances)
    // when the stored monthly figure is missing.
    if (next.outstandingBond > 0 && next.monthlyBond <= 0 && next.interestRate > 0) {
        const remaining = Math.max(1, next.remainingTermMonths || termMonths - monthsHeld || termMonths);
        next = {
            ...next,
            remainingTermMonths: remaining,
            monthlyBond: calcMonthlyBondAccurate(next.outstandingBond, next.interestRate, remaining),
        };
        return syncDerivedCurrentValue(next);
    }

    if (next.interestRate > 0 && originalBondOf(next) > 0) {
        const schedule = runVariableBondSchedule(next);
        const remaining = Math.max(0, termMonths - schedule.monthsHeld);
        let monthlyBond = schedule.currentInstalment;
        if (monthlyBond <= 0 && schedule.outstandingToDate > 0 && remaining > 0) {
            monthlyBond = calcMonthlyBondAccurate(
                schedule.outstandingToDate,
                schedule.effectiveRateNow || next.interestRate,
                remaining
            );
        }
        next = {
            ...next,
            outstandingBond: schedule.outstandingToDate,
            monthlyBond,
            remainingTermMonths: remaining,
        };
    } else {
        const monthlyBond = calcMonthlyBond(next);
        next = {
            ...next,
            monthlyBond,
            outstandingBond: calcOutstandingBond({ ...next, monthlyBond }),
        };
    }

    return syncDerivedCurrentValue(next);
}

/**
 * Switch between cash purchase and bond finance, clearing or restoring bond maths.
 */
export function withPurchaseFunding(
    property: IqProperty,
    funding: 'cash' | 'bond'
): IqProperty {
    if (funding === 'cash') {
        return syncDerivedBondFields({
            ...property,
            purchaseFunding: 'cash',
            depositPaid: property.purchasePrice > 0 ? property.purchasePrice : property.depositPaid,
            originalBondAmount: 0,
            outstandingBond: 0,
            monthlyBond: 0,
            interestRate: 0,
            remainingTermMonths: 0,
        });
    }
    return syncDerivedBondFields({
        ...property,
        purchaseFunding: 'bond',
    });
}

/**
 * Set original bond repayment term in years (e.g. 20 / 25 / 30).
 * Updates remaining months from purchase date when available.
 * Recalculates monthly repayment and outstanding balance.
 */
export function withBondTermYears(property: IqProperty, years: number): IqProperty {
    const y = Math.max(1, Math.round(years));
    const bondTermMonths = y * 12;
    return syncDerivedBondFields({
        ...property,
        bondTermMonths,
    });
}

/** Patch bond inputs and keep monthly repayment + outstanding in sync. */
export function withBondFinance(
    property: IqProperty,
    patch: Partial<
        Pick<
            IqProperty,
            | 'originalBondAmount'
            | 'outstandingBond'
            | 'interestRate'
            | 'bondTermMonths'
            | 'purchaseDate'
            | 'transferDate'
            | 'purchasePrice'
            | 'depositPaid'
            | 'extraMonthlyPayment'
            | 'purchaseFunding'
        >
    >
): IqProperty {
    let next: IqProperty = { ...property, ...patch };

    if (next.purchaseFunding === 'cash') {
        return syncDerivedBondFields({
            ...next,
            purchaseFunding: 'cash',
            depositPaid:
                next.purchasePrice > 0
                    ? next.purchasePrice
                    : Math.max(0, next.depositPaid || 0),
            originalBondAmount: 0,
            outstandingBond: 0,
            monthlyBond: 0,
            interestRate: 0,
        });
    }

    if (patch.purchasePrice !== undefined || patch.depositPaid !== undefined) {
        if (next.purchasePrice > 0) {
            const deposit = Math.max(0, next.depositPaid || 0);
            next = {
                ...next,
                depositPaid: deposit,
                originalBondAmount: Math.max(0, roundCents(next.purchasePrice - deposit)),
            };
        }
    }

    return syncDerivedBondFields(next);
}

export function capitalGrowthPct(purchase: number, current: number) {
    if (purchase <= 0) return 0;
    return ((current - purchase) / purchase) * 100;
}

export function equityOf(p: IqProperty) {
    return Math.max(0, p.currentValue - p.outstandingBond);
}

export function ltvOf(p: IqProperty) {
    if (p.currentValue <= 0) return 0;
    return (p.outstandingBond / p.currentValue) * 100;
}

export function netCashFlow(p: IqProperty) {
    return p.rentalIncome - p.monthlyBond - p.monthlyExpenses;
}

export function grossYield(p: IqProperty) {
    if (p.currentValue <= 0) return 0;
    return ((p.rentalIncome * 12) / p.currentValue) * 100;
}

export function netYield(p: IqProperty) {
    if (p.currentValue <= 0) return 0;
    const netAnnual = (p.rentalIncome - p.monthlyExpenses) * 12;
    return (netAnnual / p.currentValue) * 100;
}

export function monthlyProfit(p: IqProperty) {
    return p.rentalIncome - p.monthlyExpenses - (p.use === 'investment' ? p.monthlyBond : 0);
}

export function mortgageProgress(p: IqProperty) {
    const original = Math.max(originalBondOf(p), p.outstandingBond, 1);
    return Math.min(100, Math.max(0, ((original - p.outstandingBond) / original) * 100));
}

export function roiPct(p: IqProperty) {
    const growth = p.currentValue - p.purchasePrice;
    const cashAnnual = netCashFlow(p) * 12;
    const basis = Math.max(1, p.purchasePrice * 0.2);
    return ((growth + cashAnnual) / basis) * 100;
}

export function momChange(current: number, previous: number) {
    const delta = current - previous;
    const pct = previous !== 0 ? (delta / Math.abs(previous)) * 100 : 0;
    return { delta, pct };
}

export function daysUntil(date: string | null) {
    if (!date) return null;
    const end = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function portfolioKpis(properties: IqProperty[]) {
    const value = properties.reduce((s, p) => s + p.currentValue, 0);
    const prevValue = properties.reduce((s, p) => s + (p.previousMonthValue || p.currentValue), 0);
    const bond = properties.reduce((s, p) => s + p.outstandingBond, 0);
    const prevBond = properties.reduce((s, p) => s + (p.previousMonthBond || p.outstandingBond), 0);
    const equity = value - bond;
    const prevEquity = prevValue - prevBond;
    const cashFlow = properties.reduce((s, p) => s + netCashFlow(p), 0);
    const rental = properties.reduce((s, p) => s + p.rentalIncome, 0);
    const prevRental = properties.reduce((s, p) => s + (p.previousMonthRental || p.rentalIncome), 0);
    const expenses = properties.reduce((s, p) => s + p.monthlyExpenses, 0);
    const purchase = properties.reduce((s, p) => s + p.purchasePrice, 0);
    const growthThisYear = properties.reduce((s, p) => {
        const row = p.history[p.history.length - 12];
        const then = row?.value ?? p.purchasePrice;
        return s + (p.currentValue - then);
    }, 0);

    return {
        value,
        prevValue,
        bond,
        prevBond,
        equity,
        prevEquity,
        cashFlow,
        rental,
        prevRental,
        expenses,
        purchase,
        netWorth: equity,
        growthThisYear,
        growthPct: capitalGrowthPct(purchase, value),
        ltv: value > 0 ? (bond / value) * 100 : 0,
        count: properties.length,
    };
}

export type OverviewCard = {
    id: string;
    label: string;
    value: number;
    format: 'zar' | 'count' | 'pct';
    delta: number;
    deltaPct: number;
    spark: number[];
    tone: 'up' | 'down' | 'neutral';
    insight: string;
};

export function portfolioOverviewCards(properties: IqProperty[]): OverviewCard[] {
    const k = portfolioKpis(properties);
    const valueSpark = properties[0]?.history.slice(-12).map((h) => {
        let v = 0;
        for (const p of properties) {
            const row = p.history.find((x) => x.month === h.month) ?? p.history[p.history.length - 1];
            v += row?.value ?? 0;
        }
        return v;
    }) ?? [k.value];

    const equitySpark = properties[0]?.history.slice(-12).map((h) => {
        let v = 0;
        for (const p of properties) {
            const row = p.history.find((x) => x.month === h.month) ?? p.history[p.history.length - 1];
            v += row?.equity ?? 0;
        }
        return v;
    }) ?? [k.equity];

    const cashSpark = properties[0]?.history.slice(-12).map((h) => {
        let v = 0;
        for (const p of properties) {
            const row = p.history.find((x) => x.month === h.month) ?? p.history[p.history.length - 1];
            v += row?.cashFlow ?? 0;
        }
        return v;
    }) ?? [k.cashFlow];

    const rentalSpark = properties[0]?.history.slice(-12).map((h) => {
        let v = 0;
        for (const p of properties) {
            const row = p.history.find((x) => x.month === h.month) ?? p.history[p.history.length - 1];
            v += row?.rental ?? 0;
        }
        return v;
    }) ?? [k.rental];

    const mk = (
        id: string,
        label: string,
        value: number,
        format: OverviewCard['format'],
        delta: number,
        deltaPct: number,
        spark: number[],
        preferUp: boolean,
        insight: string
    ): OverviewCard => {
        const good = preferUp ? delta >= 0 : delta <= 0;
        return {
            id,
            label,
            value,
            format,
            delta,
            deltaPct,
            spark,
            tone: delta === 0 ? 'neutral' : good ? 'up' : 'down',
            insight,
        };
    };

    const vMom = momChange(k.value, k.prevValue);
    const bMom = momChange(k.bond, k.prevBond);
    const eMom = momChange(k.equity, k.prevEquity);
    const rMom = momChange(k.rental, k.prevRental);

    return [
        mk('value', 'Total Portfolio Value', k.value, 'zar', vMom.delta, vMom.pct, valueSpark, true, 'Market values edged higher this month.'),
        mk('bond', 'Total Outstanding Bond', k.bond, 'zar', bMom.delta, bMom.pct, valueSpark.map((v, i) => v * 0.4 - i * 2000), false, 'Principal is ticking down with each repayment.'),
        mk('equity', 'Total Equity', k.equity, 'zar', eMom.delta, eMom.pct, equitySpark, true, 'Equity is your real wealth engine.'),
        mk('rental', 'Monthly Rental Income', k.rental, 'zar', rMom.delta, rMom.pct, rentalSpark, true, 'Keep leases renewing above inflation.'),
        mk('expenses', 'Monthly Expenses', k.expenses, 'zar', 0, 0, cashSpark.map((c) => Math.abs(c) * 0.4), false, 'Trim non-essentials to protect cash flow.'),
        mk('cashflow', 'Monthly Cash Flow', k.cashFlow, 'zar', cashSpark.length > 1 ? cashSpark.at(-1)! - cashSpark.at(-2)! : 0, 0, cashSpark, true, 'Positive cash flow compounds quietly.'),
        mk('networth', 'Net Worth', k.netWorth, 'zar', eMom.delta, eMom.pct, equitySpark, true, 'Net worth = portfolio equity today.'),
        mk('growth', 'Portfolio Growth This Year', k.growthThisYear, 'zar', k.growthThisYear, k.growthPct, valueSpark, true, 'YoY capital growth across your book.'),
        mk('count', 'Number of Properties', k.count, 'count', 0, 0, [1, 1, 2, 2, 3, 3, k.count], true, 'Diversify carefully — quality over quantity.'),
    ];
}

export function filterHistory(property: IqProperty | null, properties: IqProperty[], range: ChartRange) {
    const months =
        range === '1m' ? 2 : range === '6m' ? 6 : range === '1y' ? 12 : range === '5y' ? 60 : 120;
    if (property) {
        return property.history.slice(-months);
    }
    const lens = Math.min(...properties.map((p) => p.history.length), months);
    const out: IqProperty['history'] = [];
    for (let i = 0; i < lens; i++) {
        const idxFromEnd = lens - i;
        let value = 0;
        let equity = 0;
        let rental = 0;
        let cashFlow = 0;
        let growth = 0;
        let month = '';
        for (const p of properties) {
            const row = p.history[p.history.length - idxFromEnd];
            if (!row) continue;
            value += row.value;
            equity += row.equity;
            rental += row.rental;
            cashFlow += row.cashFlow;
            growth += row.growth;
            month = row.month;
        }
        out.push({
            month,
            value,
            equity,
            rental,
            cashFlow,
            growth: properties.length ? growth / properties.length : 0,
        });
    }
    return out;
}

export function metricValue(row: IqProperty['history'][0], metric: ChartMetric) {
    switch (metric) {
        case 'equity':
            return row.equity;
        case 'rental':
            return row.rental;
        case 'cashflow':
            return row.cashFlow;
        case 'growth':
            return row.growth;
        default:
            return row.value;
    }
}

export function sparkline(history: IqProperty['history'], metric: ChartMetric = 'value') {
    return history.slice(-12).map((h) => metricValue(h, metric));
}

function formatPayoffDate(monthsFromNow: number, asOf = new Date()): string {
    const d = new Date(asOf.getFullYear(), asOf.getMonth(), 1);
    d.setMonth(d.getMonth() + Math.max(0, monthsFromNow));
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' });
}

function formatDurationMonths(months: number): string {
    const m = Math.max(0, Math.round(months));
    const y = Math.floor(m / 12);
    const rem = m % 12;
    if (y <= 0) return `${rem} mo`;
    if (rem <= 0) return `${y}y`;
    return `${y}y ${rem}m`;
}

/**
 * Cent-accurate equal-instalment amortisation (SA bank style).
 * Interest = round(balance × monthly rate); extras reduce capital after the instalment.
 * Holding the contractual instalment constant shortens the term — the usual SA extra-payment path.
 */
export function runSaCentAmortisation(input: {
    balance: number;
    annualRatePct: number;
    scheduledPayment: number;
    extraMonthly?: number;
    maxMonths?: number;
}): {
    rows: { balance: number; cumulativeInterest: number; extra: number }[];
    monthsToSettle: number;
    totalInterest: number;
    totalExtra: number;
    totalPaid: number;
    finalBalance: number;
} {
    const maxMonths = input.maxMonths ?? 600;
    let balance = roundCents(Math.max(0, input.balance));
    const monthlyRate = Math.max(0, input.annualRatePct) / 100 / 12;
    const scheduled = roundCents(Math.max(0, input.scheduledPayment));
    const extraMonthly = roundCents(Math.max(0, input.extraMonthly || 0));

    const rows: { balance: number; cumulativeInterest: number; extra: number }[] = [];
    let cumulativeInterest = 0;
    let totalPaid = 0;
    let totalExtra = 0;
    let month = 0;

    while (balance > 0.005 && month < maxMonths) {
        month += 1;
        const interest = roundCents(balance * monthlyRate);
        let principalFromInstalment = roundCents(scheduled - interest);
        let appliedExtra = extraMonthly;

        if (principalFromInstalment < 0) {
            // Instalment does not cover interest — educational edge case; still apply extras to capital.
            principalFromInstalment = 0;
        }

        let appliedPrincipal = roundCents(principalFromInstalment + appliedExtra);
        if (appliedPrincipal >= balance) {
            appliedExtra = roundCents(Math.max(0, balance - principalFromInstalment));
            appliedPrincipal = balance;
            balance = 0;
        } else {
            balance = roundCents(balance - appliedPrincipal);
        }

        const paidThisMonth = roundCents(interest + appliedPrincipal);
        cumulativeInterest = roundCents(cumulativeInterest + interest);
        totalPaid = roundCents(totalPaid + paidThisMonth);
        totalExtra = roundCents(totalExtra + appliedExtra);

        rows.push({
            balance,
            cumulativeInterest,
            extra: appliedExtra,
        });
    }

    return {
        rows,
        monthsToSettle: month,
        totalInterest: cumulativeInterest,
        totalExtra,
        totalPaid,
        finalBalance: balance,
    };
}

export function simulateBond(property: IqProperty, sim: BondSimInput) {
    const balance = roundCents(Math.max(0, property.outstandingBond || 0));
    const storedRate = property.interestRate > 0 ? property.interestRate : 0;
    const modelRate = effectiveBondRatePct(property);
    const rate =
        sim.refinanceRate != null && sim.refinanceRate > 0 ? sim.refinanceRate : modelRate;
    const termForPayment = effectiveRemainingTermMonths(property);

    // Contractual instalment: prefer the stored figure; otherwise price from balance/rate/term.
    let scheduled = roundCents(Math.max(0, property.monthlyBond || 0));
    if (sim.refinanceRate != null) {
        scheduled = roundCents(monthlyPayment(balance, rate, termForPayment));
    } else if (scheduled <= 0 && balance > 0) {
        scheduled = roundCents(monthlyPayment(balance, rate, termForPayment));
    }

    const standingExtra = roundCents(Math.max(0, property.extraMonthlyPayment || 0));
    const whatIfExtraMonthly = roundCents(Math.max(0, sim.extraMonthly || 0));
    const extraFromBiWeekly = sim.biWeekly ? roundCents(scheduled / 12) : 0;
    // Baseline = instalment + any standing extra already on file.
    // Optimised = baseline extras + the what-if amount (slider / scenario).
    const baselineExtra = standingExtra;
    const optimizedExtra = roundCents(standingExtra + whatIfExtraMonthly + extraFromBiWeekly);

    const maxMonths = Math.min(600, Math.max(termForPayment + 120, 360));

    const baseline = runSaCentAmortisation({
        balance,
        annualRatePct: rate,
        scheduledPayment: scheduled,
        extraMonthly: baselineExtra,
        maxMonths,
    });
    const optimized = runSaCentAmortisation({
        balance,
        annualRatePct: rate,
        scheduledPayment: scheduled,
        extraMonthly: optimizedExtra,
        maxMonths,
    });

    const monthsSaved = Math.max(0, baseline.monthsToSettle - optimized.monthsToSettle);
    const interestSaved = Math.max(0, roundCents(baseline.totalInterest - optimized.totalInterest));
    const baselineInstalment = roundCents(Math.max(0, property.monthlyBond || scheduled));
    const monthlySavings =
        sim.refinanceRate != null ? Math.max(0, roundCents(baselineInstalment - scheduled)) : 0;

    const compareYears = Math.max(
        1,
        Math.min(30, Math.ceil(Math.max(baseline.monthsToSettle, optimized.monthsToSettle, 1) / 12))
    );
    const chart: { year: number; baseline: number; optimized: number; label: string }[] = [
        {
            year: 0,
            label: 'Now',
            baseline: Math.round(balance),
            optimized: Math.round(balance),
        },
    ];
    for (let y = 1; y <= compareYears; y++) {
        const bEnd = Math.min(y * 12, baseline.rows.length) - 1;
        const oEnd = Math.min(y * 12, optimized.rows.length) - 1;
        const baselineBal = bEnd >= 0 ? Math.round(baseline.rows[bEnd]?.balance ?? 0) : 0;
        const optimizedBal =
            optimized.rows.length > 0 && y * 12 > optimized.rows.length
                ? 0
                : oEnd >= 0
                  ? Math.round(optimized.rows[oEnd]?.balance ?? 0)
                  : 0;
        chart.push({
            year: y,
            label: `Y${y}`,
            baseline: baselineBal,
            optimized: optimizedBal,
        });
    }

    const interestChart: { year: number; baselineInterest: number; optimizedInterest: number }[] = [];
    for (let y = 1; y <= compareYears; y++) {
        const bEnd = Math.min(y * 12, baseline.rows.length) - 1;
        const oEnd = Math.min(y * 12, optimized.rows.length) - 1;
        interestChart.push({
            year: y,
            baselineInterest: Math.round(
                baseline.rows[bEnd]?.cumulativeInterest ?? baseline.totalInterest
            ),
            optimizedInterest: Math.round(
                optimized.rows[oEnd]?.cumulativeInterest ?? optimized.totalInterest
            ),
        });
    }

    const yearsSaved = Math.floor(monthsSaved / 12);
    const monthsSavedRemainder = monthsSaved % 12;

    return {
        scheduled,
        rateUsed: rate,
        rateIsAssumed: storedRate <= 0 && sim.refinanceRate == null,
        whatIfExtra: whatIfExtraMonthly,
        standingExtra,
        monthsSaved,
        yearsSaved: Math.round((monthsSaved / 12) * 10) / 10,
        yearsSavedWhole: yearsSaved,
        monthsSavedRemainder,
        durationSavedLabel: formatDurationMonths(monthsSaved),
        interestSaved: Math.round(interestSaved),
        monthlySavings: Math.round(monthlySavings),
        lifetimeSavings: Math.round(interestSaved),
        totalExtraPaid: Math.round(optimized.totalExtra),
        baselineInterest: Math.round(baseline.totalInterest),
        optimizedInterest: Math.round(optimized.totalInterest),
        baselineMonths: baseline.monthsToSettle,
        optimizedMonths: optimized.monthsToSettle,
        baselineDurationLabel: formatDurationMonths(baseline.monthsToSettle),
        optimizedDurationLabel: formatDurationMonths(optimized.monthsToSettle),
        payoffDate: formatPayoffDate(optimized.monthsToSettle),
        baselinePayoffDate: formatPayoffDate(baseline.monthsToSettle),
        chart,
        interestChart,
        principalPaid: Math.round(
            Math.max(
                0,
                (property.originalBondAmount || property.purchasePrice * 0.9) - property.outstandingBond
            )
        ),
        assumption: `Equal instalment of ${formatCurrency(scheduled, true, 2)}/mo at ${rate.toFixed(2)}% p.a. held flat; extras reduce capital and shorten the term. Variable SA rates can move — not a bank quote.`,
    };
}

export function whatIfExtra(property: IqProperty, extraMonthly: number) {
    return simulateBond(property, {
        extraMonthly,
        annualLump: 0,
        biWeekly: false,
        refinanceRate: null,
    });
}

export function monthsSinceDate(iso: string | null | undefined): number {
    if (!iso) return 0;
    const start = new Date(iso);
    if (Number.isNaN(start.getTime())) return 0;
    const now = new Date();
    let months =
        (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) months -= 1;
    return Math.max(0, months);
}

/** Fractional years owned for compound appreciation (purchase → today). */
export function yearsOwnedFractional(iso: string | null | undefined, asOf = new Date()): number {
    if (!iso) return 0;
    const start = new Date(iso);
    if (Number.isNaN(start.getTime())) return 0;
    const ms = asOf.getTime() - start.getTime();
    if (ms <= 0) return 0;
    return ms / (365.25 * 24 * 60 * 60 * 1000);
}

/** Condition multiplier — excellent lifts value, poor discounts it (Value Optimizer style). */
export function conditionValueMultiplier(condition: PropertyCondition | string | undefined | null): number {
    const score = propertyConditionScore(condition);
    return 0.75 + (score / 100) * 0.35;
}

/** Mild type tilt on the annual appreciation rate. */
export function propertyTypeAppreciationFactor(type: PropertyType | string | undefined | null): number {
    switch (type) {
        case 'vacant_land':
            return 0.92;
        case 'apartment':
            return 0.96;
        case 'townhouse':
        case 'duplex':
            return 0.98;
        case 'smallholding':
            return 1.04;
        case 'commercial':
            return 0.94;
        case 'self_built':
            return 1.02;
        case 'house':
        default:
            return 1;
    }
}

/**
 * Effective annual appreciation % for auto current value.
 * Prefer explicit override → location/province model → national SA model × type.
 */
export function appreciationRatePct(property: IqProperty): number {
    const custom = property.expectedAnnualIncreasePct;
    if (typeof custom === 'number' && Number.isFinite(custom) && custom > 0) {
        return Math.min(20, Math.max(0, custom));
    }
    const match = resolveCompanionSuburb(property);
    return locationAppreciationPct(match, property.propertyType);
}

export type CurrentValueEstimate = {
    value: number;
    yearsOwned: number;
    ratePct: number;
    compoundedPurchase: number;
    /** Compounded construction cost (self_built only). */
    compoundedBuild: number;
    /** Land portion of auto value (self_built / vacant_land). */
    landValue: number;
    /** Dwelling portion after condition (self_built). */
    buildValue: number;
    conditionMultiplier: number;
    renovationUplift: number;
    mode: 'auto' | 'manual';
    /** Property24 suburb average used as the location anchor (0 if unmatched). */
    suburbAverage: number;
    locationAnchor: number;
    locationMatched: boolean;
    locationLabel: string;
    locationSource: string;
    priceYear: number | null;
};

function locationBlendWeights(hasPurchase: boolean, matched: boolean) {
    if (!matched) return { purchase: 1, location: 0 };
    // Location is the majority signal when a Property24 suburb average exists.
    if (hasPurchase) return { purchase: 0.38, location: 0.62 };
    return { purchase: 0, location: 1 };
}

/**
 * Auto current value (location-first):
 * - Anchors to Property24 suburb average for suburb + city when available
 * - Blends in purchase compounded at a disclosed province model rate
 * - Applies condition + renovation uplift
 */
export function estimateCurrentValue(property: IqProperty, asOf = new Date()): CurrentValueEstimate {
    const yearsOwned = yearsOwnedFractional(property.purchaseDate, asOf);
    const match = resolveCompanionSuburb(property);
    const ratePct = appreciationRatePct(property);
    const rate = ratePct / 100;
    const purchase = Math.max(0, property.purchasePrice || 0);
    const conditionMultiplier = conditionValueMultiplier(property.propertyCondition);
    const renovationUplift = Math.round(
        (property.renovations ?? [])
            .filter((r) => r.status === 'completed' || r.status === 'in_progress')
            .reduce((s, r) => s + (r.actualValueAdd || r.estimatedValueAdd || 0), 0)
    );
    const mode = property.currentValueMode === 'manual' ? 'manual' : 'auto';
    const locationAnchor = locationAnchorValue(property, match);
    const suburbAverage = match?.avgPropertyPrice ?? 0;
    const locationMeta = {
        suburbAverage,
        locationAnchor,
        locationMatched: Boolean(match),
        locationLabel: match ? `${match.suburb}, ${match.city}` : '',
        locationSource: match?.source || '',
        priceYear: match?.priceYear ?? null,
    };
    const baseMeta = {
        yearsOwned: Math.round(yearsOwned * 100) / 100,
        ratePct: Math.round(ratePct * 100) / 100,
        conditionMultiplier: Math.round(conditionMultiplier * 1000) / 1000,
        renovationUplift,
        mode: mode as 'auto' | 'manual',
        ...locationMeta,
    };

    const weights = locationBlendWeights(purchase > 0, Boolean(match) && locationAnchor > 0);

    if (property.propertyType === 'self_built') {
        const buildCost = totalBuildCostOf(property);
        const buildYears = yearsOwnedFractional(
            property.buildCompletionDate || property.purchaseDate,
            asOf
        );
        const compoundedPurchase =
            purchase > 0 ? Math.round(purchase * Math.pow(1 + rate, yearsOwned)) : 0;
        const compoundedBuild =
            buildCost > 0 ? Math.round(buildCost * Math.pow(1 + rate, buildYears)) : 0;
        const landFromPurchase = compoundedPurchase;
        // Location stand estimate: share of suburb anchor attributed to land for self-built.
        const landFromLocation = match
            ? Math.round(locationAnchor * 0.35 * conditionMultiplier)
            : 0;
        const landValue =
            landFromPurchase > 0 && landFromLocation > 0
                ? Math.round(landFromPurchase * weights.purchase + landFromLocation * weights.location)
                : landFromPurchase > 0
                  ? landFromPurchase
                  : landFromLocation;
        const buildValue = Math.round(compoundedBuild * conditionMultiplier);
        const value = Math.max(0, landValue + buildValue + renovationUplift);
        return {
            ...baseMeta,
            value,
            compoundedPurchase,
            compoundedBuild,
            landValue,
            buildValue,
        };
    }

    if (property.propertyType === 'vacant_land') {
        const compoundedPurchase =
            purchase > 0 ? Math.round(purchase * Math.pow(1 + rate, yearsOwned)) : 0;
        const locationLand = match ? Math.round(locationAnchor) : 0;
        const landValue =
            compoundedPurchase > 0 && locationLand > 0
                ? Math.round(compoundedPurchase * weights.purchase + locationLand * weights.location)
                : compoundedPurchase > 0
                  ? compoundedPurchase
                  : locationLand;
        const value = Math.max(0, landValue + renovationUplift);
        return {
            ...baseMeta,
            value,
            compoundedPurchase,
            compoundedBuild: 0,
            landValue,
            buildValue: 0,
            conditionMultiplier: 1,
        };
    }

    const compoundedPurchase =
        purchase > 0 ? Math.round(purchase * Math.pow(1 + rate, yearsOwned)) : 0;
    const purchaseLeg = Math.round(compoundedPurchase * conditionMultiplier);
    const locationLeg = Math.round(locationAnchor * conditionMultiplier);
    let value: number;
    if (purchaseLeg > 0 && locationLeg > 0) {
        value = Math.round(
            purchaseLeg * weights.purchase + locationLeg * weights.location + renovationUplift
        );
    } else if (locationLeg > 0) {
        value = Math.max(0, locationLeg + renovationUplift);
    } else {
        value = Math.max(0, purchaseLeg + renovationUplift);
    }

    return {
        ...baseMeta,
        value,
        compoundedPurchase,
        compoundedBuild: 0,
        landValue: 0,
        buildValue: 0,
    };
}

/** Apply auto current value when mode is auto; leave manual overrides alone. */
export function syncDerivedCurrentValue(property: IqProperty): IqProperty {
    const mode = property.currentValueMode === 'manual' ? 'manual' : 'auto';
    const buildCostBreakdown = coerceBuildCostBreakdown(property.buildCostBreakdown);
    const buildCost = totalBuildCostOf({
        buildCost: property.buildCost,
        buildCostBreakdown,
    });
    const withBuild = {
        ...property,
        buildCost,
        buildCostBreakdown,
        buildFunding: coerceBuildFunding(property.buildFunding),
        buildCompletionDate: property.buildCompletionDate || null,
    };
    if (mode === 'manual') {
        return { ...withBuild, currentValueMode: 'manual' };
    }
    const estimate = estimateCurrentValue({ ...withBuild, currentValueMode: 'auto' });
    const nextValue = estimate.value > 0 ? estimate.value : property.currentValue;
    return {
        ...withBuild,
        currentValueMode: 'auto',
        propertyCondition: property.propertyCondition || 'average',
        currentValue: nextValue,
        previousMonthValue:
            property.previousMonthValue > 0 ? property.previousMonthValue : nextValue,
    };
}

/** Update build spend stages / completion for self-built and refresh auto value. */
export function withBuildInvestment(
    property: IqProperty,
    patch: {
        buildCost?: number;
        buildCostBreakdown?: Partial<BuildCostBreakdown>;
        buildFunding?: BuildFunding;
        buildCompletionDate?: string | null;
    }
): IqProperty {
    const current = coerceBuildCostBreakdown(property.buildCostBreakdown);
    const editingStages = patch.buildCostBreakdown !== undefined;
    const nextBreakdown = editingStages
        ? {
              foundation:
                  patch.buildCostBreakdown!.foundation !== undefined
                      ? Math.max(0, patch.buildCostBreakdown!.foundation || 0)
                      : current.foundation,
              structure:
                  patch.buildCostBreakdown!.structure !== undefined
                      ? Math.max(0, patch.buildCostBreakdown!.structure || 0)
                      : current.structure,
              finishes:
                  patch.buildCostBreakdown!.finishes !== undefined
                      ? Math.max(0, patch.buildCostBreakdown!.finishes || 0)
                      : current.finishes,
          }
        : current;

    const staged = nextBreakdown.foundation + nextBreakdown.structure + nextBreakdown.finishes;
    const buildCost = editingStages
        ? Math.round(staged)
        : patch.buildCost !== undefined
          ? Math.max(0, Number.isFinite(patch.buildCost) ? patch.buildCost : 0)
          : totalBuildCostOf(property);

    return syncDerivedCurrentValue({
        ...property,
        buildCostBreakdown: nextBreakdown,
        buildCost,
        buildFunding:
            patch.buildFunding !== undefined
                ? coerceBuildFunding(patch.buildFunding)
                : coerceBuildFunding(property.buildFunding),
        buildCompletionDate:
            patch.buildCompletionDate !== undefined
                ? patch.buildCompletionDate
                : property.buildCompletionDate || null,
        currentValueMode: property.currentValueMode === 'manual' ? 'manual' : 'auto',
    });
}

export function withPropertyType(property: IqProperty, propertyType: PropertyType): IqProperty {
    return syncDerivedCurrentValue({
        ...property,
        propertyType,
        currentValueMode: property.currentValueMode === 'manual' ? 'manual' : 'auto',
    });
}

export function withPropertyCondition(property: IqProperty, condition: PropertyCondition): IqProperty {
    return syncDerivedCurrentValue({
        ...property,
        propertyCondition: condition,
        currentValueMode: 'auto',
    });
}

export function withCurrentValueMode(
    property: IqProperty,
    mode: 'auto' | 'manual',
    manualValue?: number
): IqProperty {
    if (mode === 'manual') {
        return {
            ...property,
            currentValueMode: 'manual',
            currentValue:
                typeof manualValue === 'number' && Number.isFinite(manualValue)
                    ? Math.max(0, Math.round(manualValue))
                    : property.currentValue,
        };
    }
    return syncDerivedCurrentValue({
        ...property,
        currentValueMode: 'auto',
    });
}

export function purchaseYearOf(property: IqProperty): number | null {
    if (!property.purchaseDate) return null;
    const d = new Date(property.purchaseDate);
    if (Number.isNaN(d.getTime())) return null;
    return d.getFullYear();
}

export function yearsOwnedLabel(monthsHeld: number): string {
    if (monthsHeld <= 0) return '—';
    const y = Math.floor(monthsHeld / 12);
    const m = monthsHeld % 12;
    if (y <= 0) return `${m} mo`;
    if (m === 0) return `${y} yr${y === 1 ? '' : 's'}`;
    return `${y}y ${m}m`;
}

/**
 * Interest & principal paid so far, driven by purchase/transfer date + bond terms.
 * Uses the same variable-rate schedule as outstanding balance when rate is set.
 */
export function bondPaidToDate(property: IqProperty) {
    const startDate = property.transferDate || property.purchaseDate;
    const monthsHeld = monthsSinceDate(startDate);
    const purchaseYear = purchaseYearOf(property);
    const original = originalBondOf(property);

    if (original > 0 && property.interestRate > 0 && monthsHeld > 0) {
        const schedule = runVariableBondSchedule(property);
        const outstanding = schedule.outstandingToDate;
        return {
            startDate,
            monthsHeld: schedule.monthsHeld,
            yearsOwned: yearsOwnedLabel(schedule.monthsHeld),
            purchaseYear,
            original,
            principalPaid: roundCents(Math.max(0, original - outstanding)),
            interestPaid: roundCents(
                schedule.months.slice(0, schedule.monthsHeld).reduce((s, m) => s + m.interest, 0)
            ),
            totalPaid: roundCents(
                schedule.months.slice(0, schedule.monthsHeld).reduce((s, m) => s + m.payment, 0)
            ),
        };
    }

    const principalPaid = Math.max(0, roundCents(original - property.outstandingBond));
    const oneOff = (property.oneOffPayments || []).reduce((s, o) => s + (o.amount || 0), 0);
    const extras = Math.max(0, property.extraMonthlyPayment || 0);
    let interestPaid = 0;
    let totalPaid = 0;

    if (monthsHeld > 0 && property.monthlyBond > 0) {
        totalPaid = roundCents(property.monthlyBond * monthsHeld + extras * monthsHeld + oneOff);
        interestPaid = Math.max(0, roundCents(totalPaid - principalPaid));
    }

    return {
        startDate,
        monthsHeld,
        yearsOwned: yearsOwnedLabel(monthsHeld),
        purchaseYear,
        original,
        principalPaid,
        interestPaid,
        totalPaid,
    };
}

export function bondTracker(property: IqProperty) {
    const progress = mortgageProgress(property);
    const paid = bondPaidToDate(property);
    const yearsRemaining = Math.floor(property.remainingTermMonths / 12);
    const monthsRemaining = property.remainingTermMonths % 12;
    const completion = new Date();
    completion.setMonth(completion.getMonth() + property.remainingTermMonths);
    const withExtras = simulateBond(property, {
        extraMonthly: 0,
        annualLump: 0,
        biWeekly: false,
        refinanceRate: null,
    });

    return {
        progress,
        yearsRemaining,
        monthsRemaining,
        principalPaid: paid.principalPaid,
        interestPaid: paid.interestPaid,
        totalPaid: paid.totalPaid,
        monthsHeld: paid.monthsHeld,
        yearsOwned: paid.yearsOwned,
        purchaseYear: paid.purchaseYear,
        original: paid.original,
        outstanding: property.outstandingBond,
        interestSaved: withExtras.interestSaved,
        completionDate: completion.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }),
        ltv: ltvOf(property),
    };
}

export function equityUnlock(property: IqProperty) {
    const equity = equityOf(property);
    const available = Math.max(0, equity * 0.8);
    const recommended = Math.min(available, equity * 0.6);
    const deposit = recommended * 0.9;
    const buyingPower = deposit / 0.1;
    return {
        marketValue: property.currentValue,
        bond: property.outstandingBond,
        equity,
        available,
        recommended,
        deposit,
        buyingPower,
    };
}

export function healthScore(properties: IqProperty[], selected: IqProperty) {
    const port = portfolioKpis(properties);
    const debtScore = Math.max(0, 100 - port.ltv);
    const cf = netCashFlow(selected);
    const cashScore = cf >= 0 ? Math.min(100, 55 + cf / 200) : Math.max(10, 45 + cf / 300);
    const yieldScore = Math.min(100, grossYield(selected) * 12);
    const growthScore = Math.min(
        100,
        Math.max(20, capitalGrowthPct(selected.purchasePrice, selected.currentValue))
    );
    const diversityScore = Math.min(100, properties.length * 28);
    const vacancyScore = selected.occupancyRate;
    const maintScore = selected.renovations.some((r) => r.status === 'in_progress') ? 70 : 88;
    const riskScore = Math.max(20, 100 - port.ltv * 0.5 - (selected.vacancyDaysYtd || 0));

    const weighted =
        debtScore * 0.18 +
        cashScore * 0.14 +
        yieldScore * 0.1 +
        growthScore * 0.14 +
        diversityScore * 0.1 +
        vacancyScore * 0.1 +
        maintScore * 0.08 +
        riskScore * 0.16;

    const score = Math.round(Math.min(98, Math.max(32, weighted)));
    const tips: string[] = [];
    if (port.ltv > 75) tips.push('Reduce debt ratio with extras or a larger deposit on the next deal.');
    if (cf < 0) tips.push('Lift rent toward market or trim expenses to flip cash flow positive.');
    if (selected.occupancyRate < 95) tips.push('Tighten vacancy risk — renew early or price to the suburb median.');
    if (properties.length < 2) tips.push('Diversification is thin — model a second unit with equity unlock.');
    if (tips.length === 0) tips.push('Strong balance — keep extras flowing and revalue annually.');

    return {
        score,
        parts: [
            { label: 'Equity', value: Math.round(Math.min(100, (port.equity / Math.max(1, port.value)) * 100)) },
            { label: 'Cash flow', value: Math.round(cashScore) },
            { label: 'Debt', value: Math.round(debtScore) },
            { label: 'Vacancy', value: Math.round(vacancyScore) },
            { label: 'Maintenance', value: Math.round(maintScore) },
            { label: 'Diversification', value: Math.round(diversityScore) },
            { label: 'Rental performance', value: Math.round(yieldScore) },
            { label: 'Capital growth', value: Math.round(growthScore) },
            { label: 'Risk', value: Math.round(riskScore) },
        ],
        tips,
    };
}

export function wealthForecast(
    properties: IqProperty[],
    years: 5 | 10 | 20,
    scenario: 'base' | 'extra' | 'expand'
) {
    const port = portfolioKpis(properties);
    const growthRate = scenario === 'expand' ? 0.07 : scenario === 'extra' ? 0.055 : 0.045;
    const debtPaydown = scenario === 'extra' ? 0.08 : 0.05;
    const rentalGrowth = scenario === 'expand' ? 0.06 : 0.04;
    const expandBump = scenario === 'expand' ? 1.35 : 1;

    const projectedValue = Math.round(port.value * Math.pow(1 + growthRate, years) * expandBump);
    const projectedDebt = Math.round(port.bond * Math.pow(1 - debtPaydown, years));
    const projectedEquity = Math.max(0, projectedValue - projectedDebt);
    const passive = Math.round(port.rental * Math.pow(1 + rentalGrowth, years) * (scenario === 'expand' ? 1.5 : 1));

    return {
        years,
        projectedValue,
        projectedEquity,
        passiveIncome: passive,
        outstandingDebt: projectedDebt,
        netWorth: projectedEquity,
        retirementIncome: Math.round(passive * 0.85),
    };
}

export type CompanionInsight = {
    id: string;
    tone: 'save' | 'info' | 'warn' | 'growth';
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    title: string;
    body: string;
    metric: string;
    metricLabel: string;
};

/**
 * Fact-based Companion recommendations from this property's stored numbers.
 * Bodies explain the maths and assumptions — educational, not bank advice.
 */
export function buildInsights(
    property: IqProperty,
    _properties: IqProperty[],
    _bondSim: ReturnType<typeof simulateBond>
): CompanionInsight[] {
    const insights: CompanionInsight[] = [];
    const isBond =
        property.purchaseFunding !== 'cash' &&
        (property.outstandingBond > 0 || property.monthlyBond > 0);
    const paid = bondPaidToDate(property);
    const tracker = isBond ? bondTracker(property) : null;
    const growth = capitalGrowthPct(property.purchasePrice, property.currentValue);
    const yearsOwned = yearsOwnedFractional(property.purchaseDate);
    const annualisedGrowth =
        yearsOwned > 0.25 && property.purchasePrice > 0
            ? (Math.pow(Math.max(0.01, property.currentValue / property.purchasePrice), 1 / yearsOwned) -
                  1) *
              100
            : null;
    const unlock = equityUnlock(property);
    const eq = equityOf(property);
    const ltv = ltvOf(property);
    const cf = netCashFlow(property);
    const gYield = grossYield(property);
    const nYield = netYield(property);
    const leaseDays = daysUntil(property.leaseExpiry);
    const topReno = [...(property.renovations ?? [])]
        .filter((r) => r.cost > 0 && (r.actualValueAdd > 0 || r.estimatedValueAdd > 0))
        .sort((a, b) => {
            const roiA = (a.actualValueAdd || a.estimatedValueAdd) / Math.max(1, a.cost);
            const roiB = (b.actualValueAdd || b.estimatedValueAdd) / Math.max(1, b.cost);
            return roiB - roiA;
        })[0];
    const valueEstimate = estimateCurrentValue(property);
    const modelRate = appreciationRatePct(property);

    if (isBond && property.interestRate > 0 && property.outstandingBond > 0) {
        const extraAmt = 2000;
        const extra = whatIfExtra(property, extraAmt);
        const interestSaved = Math.max(0, extra.interestSaved || 0);
        const yearsSaved = Math.max(0, extra.yearsSaved || 0);
        if (interestSaved > 0 || yearsSaved > 0) {
            insights.push({
                id: 'extra',
                tone: 'save',
                impact: interestSaved >= 50_000 || yearsSaved >= 2 ? 'high' : 'medium',
                confidence: 86,
                title: `+${formatZar(extraAmt)}/mo extras could save about ${formatZar(interestSaved)} in interest`,
                body: [
                    `Modelled on your current instalment of ${formatCurrency(property.monthlyBond, true, 2)} at ${property.interestRate.toFixed(2)}% p.a., with outstanding capital ${formatZar(property.outstandingBond)}.`,
                    `Keeping the same rate path and remaining term shape, the amortisation settles around ${extra.payoffDate || 'a sooner date'} — about ${yearsSaved} year${yearsSaved === 1 ? '' : 's'} earlier than the baseline schedule.`,
                    `Educational equal-instalment scenario only (variable SA rates can move). Confirm any change with your bank before acting.`,
                ].join(' '),
                metric: formatZar(interestSaved),
                metricLabel: 'Interest avoided',
            });
        }

        if (tracker && paid.monthsHeld > 0) {
            insights.push({
                id: 'bond-progress',
                tone: 'info',
                impact: tracker.progress < 35 ? 'high' : tracker.progress < 60 ? 'medium' : 'low',
                confidence: 92,
                title: `${Math.round(tracker.progress)}% of the original bond capital is paid`,
                body: [
                    `Original facility ~${formatZar(tracker.original || property.originalBondAmount)}; outstanding ${formatZar(tracker.outstanding)}.`,
                    `Over ${paid.yearsOwned} of ownership you have paid about ${formatZar(paid.principalPaid)} in capital and ${formatZar(paid.interestPaid)} in interest (schedule-based to date).`,
                    `Loan-to-value is ${ltv.toFixed(1)}% against current value ${formatZar(property.currentValue)}. Roughly ${tracker.yearsRemaining}y ${tracker.monthsRemaining}m remain at the current repayment pace (target finish ${tracker.completionDate}).`,
                ].join(' '),
                metric: `${Math.round(tracker.progress)}%`,
                metricLabel: 'Capital repaid',
            });
        }

        const illustrativeBetterRate = Math.max(7.5, property.interestRate - 1);
        if (property.interestRate >= 10.5 && property.outstandingBond >= 200_000) {
            const refi = simulateBond(property, {
                extraMonthly: 0,
                annualLump: 0,
                biWeekly: false,
                refinanceRate: illustrativeBetterRate,
            });
            const refiSave = Math.max(0, refi.interestSaved || 0);
            insights.push({
                id: 'refi',
                tone: 'info',
                impact: refiSave >= 80_000 ? 'high' : 'medium',
                confidence: 68,
                title: `Illustrative refinance at ${illustrativeBetterRate.toFixed(2)}% vs your ${property.interestRate.toFixed(2)}%`,
                body: [
                    `Holding balance ${formatZar(property.outstandingBond)} and remaining term, a flat ${illustrativeBetterRate.toFixed(2)}% scenario (about 1pp below your stored rate) estimates ~${formatZar(refiSave)} less total interest over the rest of the loan.`,
                    `Banks price to credit score, LTV and product — this is not a quote. Use it to decide whether a formal refinance enquiry is worth the fees.`,
                ].join(' '),
                metric: formatZar(refiSave),
                metricLabel: 'Illustrative interest gap',
            });
        }
    }

    if (property.purchasePrice > 0 && property.currentValue > 0) {
        const randGain = property.currentValue - property.purchasePrice;
        insights.push({
            id: 'growth',
            tone: 'growth',
            impact: Math.abs(growth) >= 40 ? 'medium' : 'low',
            confidence: property.currentValueMode === 'manual' ? 70 : 84,
            title: `Value moved ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% since purchase (${formatZar(randGain)})`,
            body: [
                `Purchase ${formatZar(property.purchasePrice)}${paid.purchaseYear ? ` (${paid.purchaseYear})` : ''} → current ${formatZar(property.currentValue)}${property.currentValueMode === 'manual' ? ' (manual figure)' : ' (auto estimate)'}.`,
                yearsOwned > 0
                    ? `Held ~${yearsOwned.toFixed(1)} years${annualisedGrowth != null ? ` · compound annual growth about ${annualisedGrowth.toFixed(1)}% p.a.` : ''}.`
                    : '',
                property.currentValueMode !== 'manual'
                    ? valueEstimate.locationMatched
                        ? `Auto value is location-led: Property24 suburb average for ${valueEstimate.locationLabel}${valueEstimate.priceYear ? ` (${valueEstimate.priceYear})` : ''} is ${formatZar(valueEstimate.suburbAverage)}, size/type-adjusted to ${formatZar(valueEstimate.locationAnchor)}, then blended with purchase growth at ~${modelRate.toFixed(1)}% p.a. and condition ${valueEstimate.conditionMultiplier.toFixed(2)}${valueEstimate.renovationUplift > 0 ? `, plus ${formatZar(valueEstimate.renovationUplift)} renovation uplift` : ''}.`
                        : `No Property24 suburb match yet — add suburb/city so value can anchor to local averages. Meanwhile using ~${modelRate.toFixed(1)}% p.a. purchase growth × condition ${valueEstimate.conditionMultiplier.toFixed(2)}${valueEstimate.renovationUplift > 0 ? `, plus ${formatZar(valueEstimate.renovationUplift)} renovation uplift` : ''}.`
                    : 'You locked a manual current value — switch to auto in Edit to use location-based suburb averages.',
                'Educational estimate only — not a bank, municipal or formal valuer appraisal.',
            ]
                .filter(Boolean)
                .join(' '),
            metric: `${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%`,
            metricLabel: 'Since purchase',
        });
    }

    if (property.propertyType === 'self_built' && valueEstimate.landValue + valueEstimate.buildValue > 0) {
        const buildSpend = totalBuildCostOf(property);
        insights.push({
            id: 'self-built',
            tone: 'growth',
            impact: 'medium',
            confidence: buildSpend > 0 ? 80 : 55,
            title: `Stand ~${formatZar(valueEstimate.landValue)} · dwelling ~${formatZar(valueEstimate.buildValue)}`,
            body: [
                `Built-on-land valuation compounds land purchase and construction spend separately.`,
                buildSpend > 0
                    ? `Recorded build spend ${formatZar(buildSpend)} (${buildFundingLabel(property.buildFunding)}), grown from ${property.buildCompletionDate || property.purchaseDate || 'purchase/completion'}, then adjusted for condition.`
                    : 'Add foundation, structure and finishes spend in Edit so the dwelling leg is not understated.',
                `Combined auto estimate ${formatZar(valueEstimate.value)} including renovations ${formatZar(valueEstimate.renovationUplift)}.`,
            ].join(' '),
            metric: formatZar(valueEstimate.value),
            metricLabel: 'Land + dwelling',
        });
    }

    if (property.currentValue > 0) {
        insights.push({
            id: 'equity',
            tone: 'growth',
            impact: eq >= 500_000 ? 'medium' : 'low',
            confidence: 88,
            title: `Equity sits at ${formatZar(eq)} (LTV ${ltv.toFixed(1)}%)`,
            body: [
                `Current value ${formatZar(property.currentValue)} minus outstanding bond ${formatZar(property.outstandingBond)}.`,
                unlock.recommended > 0
                    ? `A cautious access of ~${formatZar(unlock.recommended)} (about 60% of equity, leaving headroom) could support a deposit toward roughly ${formatZar(unlock.buyingPower)} of buying power at a 10% deposit assumption — fees, affordability and bank policy still apply.`
                    : 'Build more equity (pay down capital or lift value) before modelling a second deposit.',
            ].join(' '),
            metric: formatZar(eq),
            metricLabel: 'Net equity',
        });
    }

    if (property.rentalIncome > 0 || property.use === 'investment') {
        const rentAnnual = property.rentalIncome * 12;
        insights.push({
            id: 'cashflow',
            tone: cf >= 0 ? 'save' : 'warn',
            impact: cf < 0 ? 'high' : cf < 1500 ? 'medium' : 'low',
            confidence: property.rentalIncome > 0 ? 90 : 60,
            title:
                cf >= 0
                    ? `Monthly cash flow about +${formatZar(cf)} after bond & expenses`
                    : `Monthly cash flow about ${formatZar(cf)} — shortfall to close`,
            body: [
                `Rent ${formatZar(property.rentalIncome)}/mo − bond ${formatZar(property.monthlyBond)}/mo − expenses ${formatZar(property.monthlyExpenses)}/mo.`,
                property.currentValue > 0
                    ? `Gross yield ${gYield.toFixed(2)}% p.a. on current value (${formatZar(rentAnnual)} rent / ${formatZar(property.currentValue)}). Net yield after bond+expenses ${nYield.toFixed(2)}% p.a.`
                    : 'Add a current value to express yield on capital.',
                cf < 0
                    ? `Closing the ${formatZar(Math.abs(cf))}/mo gap needs higher rent, lower costs, or a smaller instalment — vacancy (${property.occupancyRate}% occupancy) magnifies the drag.`
                    : `Annualised net about ${formatZar(cf * 12)} before tax. Escalations and vacancy will move this.`,
            ].join(' '),
            metric: `${cf >= 0 ? '+' : ''}${formatZar(cf)}`,
            metricLabel: 'Net / month',
        });

        const marketRentHeuristic = Math.round(property.currentValue * 0.00055);
        const marketRentGap = marketRentHeuristic - property.rentalIncome;
        if (property.currentValue > 0 && property.rentalIncome > 0 && Math.abs(marketRentGap) >= 300) {
            insights.push({
                id: 'rent',
                tone: marketRentGap > 0 ? 'warn' : 'info',
                impact: marketRentGap > 800 ? 'medium' : 'low',
                confidence: 62,
                title:
                    marketRentGap > 0
                        ? `Rent is ~${formatZar(marketRentGap)}/mo below a simple value-based heuristic`
                        : `Rent is ~${formatZar(Math.abs(marketRentGap))}/mo above a simple value-based heuristic`,
                body: [
                    `Heuristic uses 0.055% of current value per month → ~${formatZar(marketRentHeuristic)}/mo vs your ${formatZar(property.rentalIncome)}/mo.`,
                    `That is a rough national rule of thumb, not a suburb comparable set. Check recent leases nearby and lease clauses before changing rent.`,
                ].join(' '),
                metric: formatZar(Math.abs(marketRentGap)),
                metricLabel: marketRentGap > 0 ? 'Possible uplift' : 'Above heuristic',
            });
        }
    }

    if (property.use === 'investment' || property.rentalIncome > 0 || property.leaseExpiry) {
        if (leaseDays != null && leaseDays >= 0) {
            insights.push({
                id: 'lease',
                tone: leaseDays < 90 ? 'warn' : 'info',
                impact: leaseDays < 60 ? 'high' : leaseDays < 120 ? 'medium' : 'low',
                confidence: 95,
                title:
                    leaseDays === 0
                        ? 'Lease ends today — plan handover or renewal'
                        : `Lease ends in ${leaseDays} day${leaseDays === 1 ? '' : 's'} (${property.leaseExpiry})`,
                body: [
                    leaseDays < 90
                        ? 'Inside a typical 90-day planning window: confirm intention to renew, market rent evidence, and deposit/inspection logistics to avoid void weeks.'
                        : 'You still have runway — diary a renewal discussion so pricing and notice periods are not rushed.',
                    property.rentalEscalationPct > 0
                        ? `Stored escalation ${property.rentalEscalationPct}% — apply only if the lease allows it.`
                        : 'No escalation % stored; check the written lease for annual increases.',
                ].join(' '),
                metric: `${leaseDays}d`,
                metricLabel: 'Until lease end',
            });
        } else if (property.use === 'investment') {
            insights.push({
                id: 'lease-missing',
                tone: 'warn',
                impact: 'medium',
                confidence: 90,
                title: 'No lease end date on file',
                body: 'Add the lease expiry in Edit so Companion can countdown renewals and flag vacancy risk before notice periods bite.',
                metric: '—',
                metricLabel: 'Lease end',
            });
        }
    }

    if (topReno) {
        const valueAdd = topReno.actualValueAdd || topReno.estimatedValueAdd || 0;
        const roi = valueAdd / Math.max(1, topReno.cost);
        insights.push({
            id: 'reno',
            tone: 'save',
            impact: roi >= 1.4 ? 'low' : 'medium',
            confidence: topReno.actualValueAdd > 0 ? 82 : 70,
            title: `${topReno.category || 'Upgrade'}: ${formatZar(topReno.cost)} spend → ${formatZar(valueAdd)} value add`,
            body: [
                `ROI about ${(roi * 100).toFixed(0)}% on this line (${String(topReno.status).replace('_', ' ')}${topReno.date ? ` · ${topReno.date}` : ''}).`,
                roi >= 1.2
                    ? 'This line already looks efficient — log photos and warranties, then prioritise the next room with a similar value-add hypothesis.'
                    : 'If value-add is soft, revisit quotes vs comparable sales uplift before the next project.',
            ].join(' '),
            metric: `${Math.round(roi * 100)}%`,
            metricLabel: 'Line ROI',
        });
    } else if ((property.renovations ?? []).length === 0 && property.currentValue > 0) {
        insights.push({
            id: 'reno-empty',
            tone: 'info',
            impact: 'low',
            confidence: 75,
            title: 'No renovations logged yet',
            body: 'Capture spend and estimated value-add on the Renovations tab. Companion folds completed uplift into auto current value and ranks upgrades by ROI.',
            metric: '0',
            metricLabel: 'Projects logged',
        });
    }

    if (!isBond && property.purchaseFunding === 'cash' && property.currentValue > 0) {
        insights.push({
            id: 'cash-owned',
            tone: 'growth',
            impact: 'low',
            confidence: 88,
            title: 'Cash purchase — full equity equals current value',
            body: `No bond instalment in Companion maths, so equity is ${formatZar(eq)} on value ${formatZar(property.currentValue)}. Extra-repayment and refinance tips stay hidden until you add an outstanding facility.`,
            metric: formatZar(eq),
            metricLabel: 'Unencumbered equity',
        });
    }

    return insights;
}


const IMPACT_RANK = { high: 0, medium: 1, low: 2 } as const;

export function prioritisedInsights(
    property: IqProperty,
    properties: IqProperty[],
    bondSim: ReturnType<typeof simulateBond>,
    limit = 4
) {
    return [...buildInsights(property, properties, bondSim)].sort(
        (a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact] || b.confidence - a.confidence
    ).slice(0, limit);
}

export function allPrioritisedInsights(
    property: IqProperty,
    properties: IqProperty[],
    bondSim: ReturnType<typeof simulateBond>
) {
    return prioritisedInsights(property, properties, bondSim, 99);
}

export function goalProgress(goal: PortfolioGoal, properties: IqProperty[]) {
    const k = portfolioKpis(properties);
    let current = 0;
    switch (goal.kind) {
        case 'property_count':
            current = k.count;
            break;
        case 'passive_income':
            current = Math.max(0, k.cashFlow);
            break;
        case 'portfolio_value':
            current = k.value;
            break;
        case 'payoff':
            current = Math.max(0, k.bond);
            break;
        default:
            current = 0;
    }
    const target = Math.max(1, goal.target || 1);
    const pct =
        goal.kind === 'payoff'
            ? Math.min(100, Math.max(0, 100 - (current / Math.max(1, properties.reduce((s, p) => s + (p.originalBondAmount || p.purchasePrice), 0))) * 100))
            : Math.min(100, Math.round((current / target) * 100));
    return { current, pct };
}

export function projectedFutureValue(property: IqProperty, years = 10) {
    return Math.round(property.currentValue * Math.pow(1.05, years));
}

export function interestPaidEstimate(property: IqProperty) {
    return bondTracker(property).interestPaid;
}

export const REPORT_TYPES = [
    { id: 'portfolio', label: 'Portfolio Summary' },
    { id: 'networth', label: 'Net Worth Report' },
    { id: 'bond', label: 'Bond Report' },
    { id: 'cashflow', label: 'Cash Flow Report' },
    { id: 'performance', label: 'Property Performance' },
    { id: 'tax', label: 'Tax Summary' },
    { id: 'investment', label: 'Investment Report' },
] as const;

export function downloadReport(
    kind: (typeof REPORT_TYPES)[number]['id'],
    property: IqProperty,
    properties: IqProperty[]
) {
    const port = portfolioKpis(properties);
    const lines = [
        `PropReady Property Companion™ — ${REPORT_TYPES.find((r) => r.id === kind)?.label}`,
        `Generated: ${new Date().toLocaleString('en-ZA')}`,
        '',
        `Focus property: ${property.name} · ${property.address}`,
        `Purchase: ${formatZar(property.purchasePrice)}`,
        `Current value: ${formatZar(property.currentValue)}`,
        `Equity: ${formatZar(equityOf(property))}`,
        `Outstanding bond: ${formatZar(property.outstandingBond)}`,
        `Monthly cash flow: ${formatZar(netCashFlow(property))}`,
        '',
        'Portfolio',
        `Total value: ${formatZar(port.value)}`,
        `Total equity: ${formatZar(port.equity)}`,
        `Total bond: ${formatZar(port.bond)}`,
        `Combined cash flow: ${formatZar(port.cashFlow)}`,
        '',
        'Educational summary for discussion with banks, accountants and advisors.',
        'Not formal financial, tax or credit advice.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propready-property-companion-${kind}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
