import { runAmortisation } from '@/lib/smart-bond/engine';
import { formatCurrency } from '@/lib/currency';
import type { IqProperty, IqRenovation } from './types';
import {
    bondPaidToDate,
    bondStartMonth,
    calcMonthlyBondAccurate,
    monthsSinceDate,
    originalBondOf,
    roundCents,
    runVariableBondSchedule,
} from './engine';
import {
    currentSaPrimeRate,
    formatPrimeMargin,
} from './sa-prime-rates';

export const MONTH_LABELS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
] as const;

/** ZAR with cents for spreadsheet cells — R 1,250,000.09 */
export function formatZarCents(n: number): string {
    return formatCurrency(roundCents(n), true, 2);
}

export function formatZarSheet(n: number): string {
    if (!n) return 'R 0.00';
    return formatZarCents(n);
}

export type YearMonthGrid = {
    years: number[];
    /** monthIndex 0-11 → year → amount */
    cells: number[][];
    yearSubtotals: number[];
    grandTotal: number;
    startYear: number;
    endYear: number;
    /** Average effective bond rate (% p.a.) used in each year column. */
    yearRates?: number[];
    /** Variable-rate metadata when modelled off SA prime history. */
    variableRate?: {
        marginPct: number;
        marginLabel: string;
        currentPrime: number;
        quotedRate: number;
    };
};

function parseStartDate(property: IqProperty): Date {
    const raw = property.transferDate || property.purchaseDate;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Mortgage repayment calendar with SA variable rates.
 * Built from the same schedule engine used for outstanding-balance accuracy.
 */
export function buildBondRepaymentGrid(property: IqProperty): YearMonthGrid {
    const schedule = runVariableBondSchedule(property, { horizon: 'full' });
    const start = bondStartMonth(property);
    const termMonths = schedule.termMonths;

    const end = new Date(start);
    end.setMonth(end.getMonth() + Math.max(0, termMonths - 1));

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) years.push(y);

    const cells: number[][] = MONTH_LABELS.map(() => years.map(() => 0));
    const yearSubtotals = years.map(() => 0);
    const yearRateSum = years.map(() => 0);
    const yearRateCount = years.map(() => 0);

    for (const row of schedule.months) {
        const yi = years.indexOf(row.year);
        if (yi < 0) continue;
        cells[row.month][yi] = row.payment;
        yearSubtotals[yi] = roundCents(yearSubtotals[yi] + row.payment);
        yearRateSum[yi] += row.rate;
        yearRateCount[yi] += 1;
    }

    const yearRates = years.map((_, i) =>
        yearRateCount[i] > 0 ? Math.round((yearRateSum[i] / yearRateCount[i]) * 100) / 100 : 0
    );
    const grandTotal = roundCents(yearSubtotals.reduce((s, v) => s + v, 0));

    return {
        years,
        cells,
        yearSubtotals,
        grandTotal,
        startYear,
        endYear,
        yearRates,
        variableRate: {
            marginPct: schedule.marginPct,
            marginLabel: formatPrimeMargin(schedule.marginPct),
            currentPrime: currentSaPrimeRate(),
            quotedRate: schedule.quotedRate,
        },
    };
}

/**
 * Rates & taxes calendar from purchase through current month.
 */
export function buildRatesGrid(property: IqProperty): YearMonthGrid {
    const start = parseStartDate(property);
    const now = new Date();
    const endYear = Math.max(now.getFullYear(), start.getFullYear());
    const startYear = start.getFullYear();
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) years.push(y);

    const monthly = roundCents(property.municipalRates || 0);
    const cells: number[][] = MONTH_LABELS.map(() => years.map(() => 0));
    const yearSubtotals = years.map(() => 0);

    if (monthly > 0) {
        const cursor = new Date(start);
        const last = new Date(now.getFullYear(), now.getMonth(), 1);
        while (cursor <= last) {
            const y = cursor.getFullYear();
            const m = cursor.getMonth();
            const yi = years.indexOf(y);
            if (yi >= 0) {
                cells[m][yi] = monthly;
                yearSubtotals[yi] = roundCents(yearSubtotals[yi] + monthly);
            }
            cursor.setMonth(cursor.getMonth() + 1);
        }
    }

    const grandTotal = roundCents(yearSubtotals.reduce((s, v) => s + v, 0));
    return { years, cells, yearSubtotals, grandTotal, startYear, endYear };
}

export type RenoLedgerRow = {
    id: string;
    date: string;
    room: string;
    item: string;
    description: string;
    amount: number;
};

export type RenoLedgerSection = {
    room: string;
    rows: RenoLedgerRow[];
    subtotal: number;
};

export function buildRenovationsLedger(property: IqProperty): {
    sections: RenoLedgerSection[];
    grandTotal: number;
} {
    const byRoom = new Map<string, IqRenovation[]>();
    for (const r of property.renovations) {
        const room = (r.room || r.category || 'Other').toUpperCase();
        const list = byRoom.get(room) ?? [];
        list.push(r);
        byRoom.set(room, list);
    }

    const sections: RenoLedgerSection[] = [];
    let grandTotal = 0;

    for (const [room, items] of byRoom) {
        const rows: RenoLedgerRow[] = items
            .slice()
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
            .map((r) => ({
                id: r.id,
                date: r.date || '',
                room,
                item: String(r.category || r.room || 'Improvement'),
                description: r.notes || r.contractor || r.status.replace('_', ' '),
                amount: roundCents(r.cost),
            }));
        const subtotal = roundCents(rows.reduce((s, r) => s + r.amount, 0));
        grandTotal = roundCents(grandTotal + subtotal);
        sections.push({ room, rows, subtotal });
    }

    return { sections, grandTotal };
}

export type SpendBreakdownRow = {
    item: string;
    description: string;
    amount: number;
    color: string;
};

export function buildSpendSummary(property: IqProperty) {
    const ratesGrid = buildRatesGrid(property);
    const reno = buildRenovationsLedger(property);
    const bondGrid = buildBondRepaymentGrid(property);

    const monthsHeld = monthsSinceDate(property.transferDate || property.purchaseDate);
    const instalment = roundCents(property.monthlyBond || 0);
    const extras = roundCents(property.extraMonthlyPayment || 0);
    const oneOff = (property.oneOffPayments || []).reduce((s, o) => s + (o.amount || 0), 0);
    const mortgagePaid = roundCents(
        monthsHeld > 0 && instalment > 0
            ? instalment * monthsHeld + extras * monthsHeld + oneOff
            : bondPaidToDate(property).totalPaid
    );

    const legal = roundCents(
        property.expenses.find((e) => /legal|transfer/i.test(e.category))?.amount ?? 0
    );

    const rows: SpendBreakdownRow[] = [
        {
            item: 'Mortgage bond',
            description: property.bank || 'Home loan repayments',
            amount: mortgagePaid,
            color: '#64748b',
        },
        {
            item: 'Renovations',
            description: 'Property renovation',
            amount: reno.grandTotal,
            color: '#0f766e',
        },
        {
            item: 'Legal costs',
            description: 'Property transfer',
            amount: legal,
            color: '#c4a574',
        },
        {
            item: 'Rates and taxes',
            description: 'Municipal',
            amount: ratesGrid.grandTotal,
            color: '#dc2626',
        },
    ];

    if (property.rentalIncome > 0 && monthsHeld > 0) {
        rows.push({
            item: 'Rental income',
            description: 'Lease',
            amount: roundCents(property.rentalIncome * monthsHeld),
            color: '#059669',
        });
    }

    const totalSpent = roundCents(
        rows.filter((r) => r.item !== 'Rental income').reduce((s, r) => s + r.amount, 0)
    );

    return {
        purchasePrice: property.purchasePrice,
        depositPaid: property.depositPaid || 0,
        totalSpent,
        rows,
        pie: rows.filter((r) => r.item !== 'Rental income' && r.amount > 0),
        bondGrid,
        ratesGrid,
        reno,
        monthLabels: MONTH_LABELS,
        instalment,
        principal: originalBondOf(property),
        rate: property.interestRate,
        termMonths: property.bondTermMonths || 240,
        verify: verifyBondInstalment(property),
    };
}

/** Confirm instalment clears the loan within the stated term. */
export function verifyBondInstalment(property: IqProperty) {
    const principal = originalBondOf(property);
    const termMonths = property.bondTermMonths > 0 ? property.bondTermMonths : 240;
    const rate = property.interestRate;
    const instalment = calcMonthlyBondAccurate(principal, rate, termMonths);
    if (principal <= 0 || rate <= 0 || termMonths <= 0) {
        return {
            instalment: 0,
            settles: false,
            finalBalance: principal,
            totalInterest: 0,
            monthsToSettle: 0,
        };
    }
    const sim = runAmortisation({
        balance: principal,
        annualRatePct: rate,
        scheduledPayment: instalment,
        extraMonthly: 0,
        annualLumpSum: 0,
        maxMonths: termMonths + 2,
    });
    return {
        instalment,
        settles: sim.finalBalance < 1 && sim.monthsToSettle <= termMonths + 1,
        finalBalance: roundCents(sim.finalBalance),
        totalInterest: roundCents(sim.totalInterest),
        monthsToSettle: sim.monthsToSettle,
    };
}
