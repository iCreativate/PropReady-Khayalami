import { monthlyPayment, runAmortisation } from '@/lib/smart-bond/engine';
import type { BondSimInput, ChartMetric, ChartRange, IqProperty } from './types';

export function formatZar(n: number) {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        maximumFractionDigits: 0,
    }).format(Math.round(n));
}

export function formatPct(n: number, digits = 1) {
    return `${n.toFixed(digits)}%`;
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

export function mortgageProgress(p: IqProperty) {
    const original = Math.max(p.purchasePrice * 0.9, p.outstandingBond);
    return Math.min(100, Math.max(0, ((original - p.outstandingBond) / original) * 100));
}

export function roiPct(p: IqProperty) {
    const invested = p.purchasePrice - (p.purchasePrice - p.outstandingBond > 0
        ? Math.max(0, p.purchasePrice * 0.1)
        : 0);
    // Simple total return: equity growth + cash flow annualised proxy
    const growth = p.currentValue - p.purchasePrice;
    const cashAnnual = netCashFlow(p) * 12;
    const basis = Math.max(1, p.purchasePrice * 0.2);
    return ((growth + cashAnnual) / basis) * 100;
}

export function portfolioKpis(properties: IqProperty[]) {
    const value = properties.reduce((s, p) => s + p.currentValue, 0);
    const bond = properties.reduce((s, p) => s + p.outstandingBond, 0);
    const equity = value - bond;
    const cashFlow = properties.reduce((s, p) => s + netCashFlow(p), 0);
    const rental = properties.reduce((s, p) => s + p.rentalIncome, 0);
    const purchase = properties.reduce((s, p) => s + p.purchasePrice, 0);
    return {
        value,
        bond,
        equity,
        cashFlow,
        rental,
        purchase,
        growthPct: capitalGrowthPct(purchase, value),
        ltv: value > 0 ? (bond / value) * 100 : 0,
    };
}

export function filterHistory(property: IqProperty | null, properties: IqProperty[], range: ChartRange) {
    const months =
        range === '1m' ? 2 : range === '6m' ? 6 : range === '1y' ? 12 : range === '5y' ? 60 : 120;
    if (property) {
        return property.history.slice(-months);
    }
    // Aggregate portfolio: average last N from first property lengths aligned by index from end
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

export function simulateBond(property: IqProperty, sim: BondSimInput) {
    const rate = sim.refinanceRate ?? property.interestRate;
    let scheduled = property.monthlyBond;
    if (sim.refinanceRate != null) {
        scheduled = monthlyPayment(property.outstandingBond, rate, property.remainingTermMonths);
    }
    // Bi-weekly ≈ 26 half-payments / year ≈ 13 months of payments
    const extraFromBiWeekly = sim.biWeekly ? scheduled / 12 : 0;
    const extraMonthly = sim.extraMonthly + extraFromBiWeekly;

    const baseline = runAmortisation({
        balance: property.outstandingBond,
        annualRatePct: property.interestRate,
        scheduledPayment: property.monthlyBond,
        extraMonthly: 0,
        annualLumpSum: 0,
        maxMonths: property.remainingTermMonths + 24,
    });
    const optimized = runAmortisation({
        balance: property.outstandingBond,
        annualRatePct: rate,
        scheduledPayment: scheduled,
        extraMonthly,
        annualLumpSum: sim.annualLump,
        maxMonths: property.remainingTermMonths + 24,
    });

    const monthsSaved = Math.max(0, baseline.monthsToSettle - optimized.monthsToSettle);
    const interestSaved = Math.max(0, baseline.totalInterest - optimized.totalInterest);
    const monthlySavings = Math.max(0, property.monthlyBond - scheduled);
    const payoff = new Date();
    payoff.setMonth(payoff.getMonth() + optimized.monthsToSettle);

    const compareYears = Math.min(
        20,
        Math.ceil(Math.max(baseline.monthsToSettle, optimized.monthsToSettle) / 12)
    );
    const chart: { year: number; baselineInterest: number; optimizedInterest: number }[] = [];
    for (let y = 1; y <= compareYears; y++) {
        const bEnd = Math.min(y * 12, baseline.rows.length) - 1;
        const oEnd = Math.min(y * 12, optimized.rows.length) - 1;
        chart.push({
            year: y,
            baselineInterest: Math.round(baseline.rows[bEnd]?.cumulativeInterest ?? baseline.totalInterest),
            optimizedInterest: Math.round(
                optimized.rows[oEnd]?.cumulativeInterest ?? optimized.totalInterest
            ),
        });
    }

    return {
        scheduled: Math.round(scheduled),
        monthsSaved,
        interestSaved: Math.round(interestSaved),
        monthlySavings: Math.round(monthlySavings),
        lifetimeSavings: Math.round(interestSaved + monthlySavings * monthsSaved * 0.15),
        payoffDate: payoff.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }),
        yearsSaved: Math.round((monthsSaved / 12) * 10) / 10,
        chart,
        baselineMonths: baseline.monthsToSettle,
        optimizedMonths: optimized.monthsToSettle,
    };
}

export function equityUnlock(property: IqProperty) {
    const equity = equityOf(property);
    const available = Math.max(0, equity * 0.8); // keep ~20% buffer
    const recommended = Math.min(available, equity * 0.6);
    const deposit = recommended * 0.9;
    const buyingPower = deposit / 0.1; // assume 10% deposit on next purchase
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
    const growthScore = Math.min(100, Math.max(20, capitalGrowthPct(selected.purchasePrice, selected.currentValue)));
    const diversityScore = Math.min(100, properties.length * 28);
    const vacancyScore = selected.occupancyRate;
    const maintScore = selected.renovations.some((r) => r.status === 'in_progress') ? 70 : 88;

    const weighted =
        debtScore * 0.22 +
        cashScore * 0.18 +
        yieldScore * 0.14 +
        growthScore * 0.16 +
        diversityScore * 0.1 +
        vacancyScore * 0.12 +
        maintScore * 0.08;

    const score = Math.round(Math.min(98, Math.max(32, weighted)));
    const tips: string[] = [];
    if (port.ltv > 75) tips.push('Reduce LTV with extras or a larger deposit on the next deal.');
    if (cf < 0) tips.push('Lift rent toward market or trim non-essential expenses to flip cash flow positive.');
    if (selected.occupancyRate < 95) tips.push('Tighten vacancy risk — renew early or price to the suburb median.');
    if (properties.length < 2) tips.push('Diversification is thin — model a second unit with equity unlock.');
    if (tips.length === 0) tips.push('Strong balance — keep extras flowing and revalue annually.');

    return {
        score,
        parts: [
            { label: 'Debt ratio', value: Math.round(debtScore) },
            { label: 'Cash flow', value: Math.round(cashScore) },
            { label: 'Rental yield', value: Math.round(yieldScore) },
            { label: 'Capital growth', value: Math.round(growthScore) },
            { label: 'Diversification', value: Math.round(diversityScore) },
            { label: 'Vacancy risk', value: Math.round(vacancyScore) },
            { label: 'Maintenance', value: Math.round(maintScore) },
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
    const netWorth = projectedEquity;
    const retirementIncome = Math.round(passive * 0.85);

    return {
        years,
        projectedValue,
        projectedEquity,
        passiveIncome: passive,
        outstandingDebt: projectedDebt,
        netWorth,
        retirementIncome,
    };
}

export function buildInsights(property: IqProperty, properties: IqProperty[], bondSim: ReturnType<typeof simulateBond>) {
    const growth = capitalGrowthPct(property.purchasePrice, property.currentValue);
    const unlock = equityUnlock(property);
    const topReno = [...property.renovations]
        .filter((r) => r.cost > 0 && r.actualValueAdd > 0)
        .sort((a, b) => b.actualValueAdd / b.cost - a.actualValueAdd / a.cost)[0];
    const marketRentGap = property.use === 'investment' ? Math.round(property.currentValue * 0.00055 - property.rentalIncome) : 0;

    return [
        {
            id: 'growth',
            tone: 'growth' as const,
            confidence: 88,
            title: `Your property appreciated by ${growth.toFixed(0)}% since purchase.`,
            body: `${property.name} moved from ${formatZar(property.purchasePrice)} to ${formatZar(property.currentValue)}.`,
        },
        {
            id: 'extra',
            tone: 'save' as const,
            confidence: 84,
            title:
                bondSim.interestSaved > 0
                    ? `Paying ${formatZar(bondSim.scheduled === property.monthlyBond ? 1500 : bondSim.monthlySavings || 1500)} strategically could save ~${formatZar(Math.max(bondSim.interestSaved, 740_000))} in interest.`
                    : 'Paying R1,500 extra monthly could save you hundreds of thousands in interest.',
            body: 'Extras attack principal when interest bites hardest — early years matter most.',
        },
        {
            id: 'rent',
            tone: marketRentGap > 0 ? ('warn' as const) : ('info' as const),
            confidence: 76,
            title:
                marketRentGap > 400
                    ? `Your rental income is ~${formatZar(marketRentGap)} below a suburb heuristic.`
                    : 'Rental income looks aligned with a simple suburb heuristic.',
            body: 'Compare to recent leases on your street before renegotiating.',
        },
        {
            id: 'refi',
            tone: 'info' as const,
            confidence: 71,
            title: 'Refinancing could reduce your monthly repayments.',
            body: `Current rate ${property.interestRate.toFixed(2)}% — model a sharper margin in Bond Optimizer.`,
        },
        {
            id: 'equity',
            tone: 'growth' as const,
            confidence: 82,
            title: 'Your available equity may fund another investment property.',
            body: `About ${formatZar(unlock.recommended)} recommended release → ~${formatZar(unlock.buyingPower)} buying power at 10% deposit.`,
        },
        {
            id: 'reno',
            tone: 'save' as const,
            confidence: 79,
            title: topReno
                ? `${topReno.room} renovations generated the highest return on investment.`
                : 'Track renovation ROI to prioritise the next upgrade.',
            body: topReno
                ? `${formatZar(topReno.cost)} in → ${formatZar(topReno.actualValueAdd)} value created.`
                : 'Kitchen and bathroom refreshes often lead SA retail yields.',
        },
        {
            id: 'portfolio',
            tone: 'info' as const,
            confidence: 80,
            title: `Portfolio spans ${properties.length} propert${properties.length === 1 ? 'y' : 'ies'}.`,
            body: `Combined equity ${formatZar(portfolioKpis(properties).equity)} with LTV ${formatPct(portfolioKpis(properties).ltv, 0)}.`,
        },
    ];
}

export function projectedFutureValue(property: IqProperty, years = 10) {
    return Math.round(property.currentValue * Math.pow(1.05, years));
}

export function interestPaidEstimate(property: IqProperty) {
    // Rough lifetime interest paid so far (educational)
    const yearsHeld = Math.max(
        1,
        (Date.now() - new Date(property.purchaseDate).getTime()) / (365.25 * 24 * 3600 * 1000)
    );
    return Math.round(property.monthlyBond * 12 * yearsHeld * 0.55);
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
        `PropReady Property IQ™ — ${REPORT_TYPES.find((r) => r.id === kind)?.label}`,
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
    a.download = `propready-property-iq-${kind}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
