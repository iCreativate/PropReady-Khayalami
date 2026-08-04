'use client';

import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ArrowDownRight,
    ArrowUpRight,
    Building2,
    Calendar,
    FileText,
    Gauge,
    HelpCircle,
    Home,
    Lightbulb,
    PiggyBank,
    Plus,
    Sparkles,
    TrendingUp,
    Upload,
    Wrench,
} from 'lucide-react';
import {
    PROPERTY_IQ_DEMO,
    REPORT_TYPES,
    buildInsights,
    capitalGrowthPct,
    downloadReport,
    equityOf,
    equityUnlock,
    filterHistory,
    formatPct,
    formatZar,
    grossYield,
    healthScore,
    interestPaidEstimate,
    ltvOf,
    metricValue,
    mortgageProgress,
    netCashFlow,
    portfolioKpis,
    projectedFutureValue,
    roiPct,
    simulateBond,
    sparkline,
    wealthForecast,
    type BondSimInput,
    type ChartMetric,
    type ChartRange,
    type IqProperty,
} from '@/lib/property-iq';

function Spark({ data, stroke = '#fecaca' }: { data: number[]; stroke?: string }) {
    const w = 120;
    const h = 36;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const span = Math.max(1, max - min);
    const pts = data
        .map((v, i) => {
            const x = (i / Math.max(1, data.length - 1)) * w;
            const y = h - ((v - min) / span) * (h - 4) - 2;
            return `${x},${y}`;
        })
        .join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="piq-spark" aria-hidden>
            <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" points={pts} />
        </svg>
    );
}

function Tip({ text }: { text: string }) {
    return (
        <span className="piq-tooltip" title={text} aria-label={text}>
            <HelpCircle className="w-3.5 h-3.5" />
        </span>
    );
}

function HealthGauge({ score }: { score: number }) {
    const r = 54;
    const c = 2 * Math.PI * r;
    const len = (score / 100) * c;
    return (
        <div className="relative mx-auto w-[160px]">
            <svg viewBox="0 0 140 140" className="w-full">
                <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(28,28,28,0.08)" strokeWidth="12" />
                <circle
                    cx="70"
                    cy="70"
                    r={r}
                    fill="none"
                    stroke="url(#piqGauge)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${len} ${c - len}`}
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)' }}
                />
                <defs>
                    <linearGradient id="piqGauge" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#dc2626" />
                        <stop offset="100%" stopColor="#c4a574" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 grid place-content-center text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">Health</p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">{score}</p>
            </div>
        </div>
    );
}

export default function PropertyIQDashboard({ embedded = false }: { embedded?: boolean }) {
    const [properties] = useState(PROPERTY_IQ_DEMO);
    const [selectedId, setSelectedId] = useState(properties[0]?.id ?? '');
    const [range, setRange] = useState<ChartRange>('1y');
    const [metric, setMetric] = useState<ChartMetric>('value');
    const [forecastYears, setForecastYears] = useState<5 | 10 | 20>(10);
    const [forecastScenario, setForecastScenario] = useState<'base' | 'extra' | 'expand'>('base');
    const [sim, setSim] = useState<BondSimInput>({
        extraMonthly: 1500,
        annualLump: 0,
        biWeekly: false,
        refinanceRate: null,
    });

    const selected = useMemo(
        () => properties.find((p) => p.id === selectedId) ?? properties[0],
        [properties, selectedId]
    ) as IqProperty;

    const port = useMemo(() => portfolioKpis(properties), [properties]);
    const history = useMemo(
        () => filterHistory(null, properties, range),
        [properties, range]
    );
    const chartData = useMemo(
        () =>
            history.map((h) => ({
                month: h.month,
                value: metricValue(h, metric),
            })),
        [history, metric]
    );

    const bond = useMemo(() => simulateBond(selected, sim), [selected, sim]);
    const unlock = useMemo(() => equityUnlock(selected), [selected]);
    const health = useMemo(() => healthScore(properties, selected), [properties, selected]);
    const insights = useMemo(
        () => buildInsights(selected, properties, bond),
        [selected, properties, bond]
    );
    const forecast = useMemo(
        () => wealthForecast(properties, forecastYears, forecastScenario),
        [properties, forecastYears, forecastScenario]
    );

    const expenseData = selected.expenses;
    const renoInvested = selected.renovations.reduce((s, r) => s + r.cost, 0);
    const renoValue = selected.renovations.reduce(
        (s, r) => s + (r.actualValueAdd || r.estimatedValueAdd),
        0
    );

    const growth = capitalGrowthPct(selected.purchasePrice, selected.currentValue);
    const cash = netCashFlow(selected);

    const ranges: { id: ChartRange; label: string }[] = [
        { id: '1m', label: '1M' },
        { id: '6m', label: '6M' },
        { id: '1y', label: '1Y' },
        { id: '5y', label: '5Y' },
        { id: 'life', label: 'Life' },
    ];
    const metrics: { id: ChartMetric; label: string }[] = [
        { id: 'value', label: 'Portfolio Value' },
        { id: 'equity', label: 'Equity' },
        { id: 'rental', label: 'Rental Income' },
        { id: 'cashflow', label: 'Cash Flow' },
        { id: 'growth', label: 'Capital Growth' },
    ];

    const kpis = [
        {
            label: 'Total Portfolio Value',
            value: formatZar(port.value),
            trend: `+${formatPct(port.growthPct, 0)}`,
            up: true,
            spark: sparkline(properties[0].history, 'value'),
            tip: 'Sum of estimated current market values across your portfolio.',
        },
        {
            label: 'Total Equity',
            value: formatZar(port.equity),
            trend: 'Building',
            up: true,
            spark: sparkline(properties[0].history, 'equity'),
            tip: 'Market value minus outstanding bond balances.',
        },
        {
            label: 'Outstanding Bond',
            value: formatZar(port.bond),
            trend: `${formatPct(port.ltv, 0)} LTV`,
            up: false,
            spark: properties[0].history.slice(-12).map((h) => h.value - h.equity),
            tip: 'Combined home-loan balances still owing.',
        },
        {
            label: 'Monthly Cash Flow',
            value: formatZar(port.cashFlow),
            trend: port.cashFlow >= 0 ? 'Positive' : 'Watch',
            up: port.cashFlow >= 0,
            spark: sparkline(properties[0].history, 'cashflow'),
            tip: 'Rental income minus bond and operating expenses (portfolio).',
        },
    ];

    const financialMetrics = [
        { label: 'Purchase Price', value: formatZar(selected.purchasePrice), tip: 'What you paid (or contracted).', icon: Home },
        { label: 'Current Value', value: formatZar(selected.currentValue), tip: 'Illustrative market estimate.', icon: TrendingUp },
        { label: 'Capital Growth', value: formatPct(growth), tip: 'Change vs purchase price.', icon: ArrowUpRight },
        { label: 'Outstanding Bond', value: formatZar(selected.outstandingBond), tip: 'Remaining loan balance.', icon: Building2 },
        { label: 'Equity', value: formatZar(equityOf(selected)), tip: 'Value minus bond.', icon: PiggyBank },
        { label: 'Monthly Bond', value: formatZar(selected.monthlyBond), tip: 'Current instalment estimate.', icon: Calendar },
        { label: 'Interest Paid (est.)', value: formatZar(interestPaidEstimate(selected)), tip: 'Educational lifetime interest so far.', icon: Gauge },
        { label: 'Rental Income', value: formatZar(selected.rentalIncome), tip: 'Gross monthly rent.', icon: Sparkles },
        { label: 'Monthly Expenses', value: formatZar(selected.monthlyExpenses), tip: 'Rates, levies, insurance, etc.', icon: FileText },
        { label: 'Net Cash Flow', value: formatZar(cash), tip: 'Rent − bond − expenses.', icon: TrendingUp },
        { label: 'ROI (heuristic)', value: formatPct(Math.min(999, roiPct(selected)), 0), tip: 'Simplified total-return proxy.', icon: Lightbulb },
        { label: 'LTV', value: formatPct(ltvOf(selected), 0), tip: 'Bond ÷ current value.', icon: Gauge },
        { label: 'Projected Value (10y)', value: formatZar(projectedFutureValue(selected, 10)), tip: '5% p.a. educational compound.', icon: ArrowUpRight },
    ];

    return (
        <div className={`piq-page home-landing ${embedded ? 'piq-portal-embed' : ''}`}>
            <div className="piq-shell">
                <div className="piq-layout">
                    <div className="piq-main pb-20 xl:pb-4">
                        {/* Hero + KPIs */}
                        <section className="piq-hero">
                            <p className="piq-kicker">PropReady flagship</p>
                            <h1 className="piq-hero-title">Property IQ™</h1>
                            <p className="piq-hero-tag">Build. Track. Grow Your Property Wealth.</p>
                            <div className="piq-kpi-grid">
                                {kpis.map((k) => (
                                    <div key={k.label} className="piq-kpi">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="piq-kpi-label">{k.label}</p>
                                            <Tip text={k.tip} />
                                        </div>
                                        <p className="piq-kpi-value">{k.value}</p>
                                        <p className={`piq-kpi-trend ${k.up ? 'piq-kpi-trend--up' : 'piq-kpi-trend--down'}`}>
                                            {k.up ? (
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            ) : (
                                                <ArrowDownRight className="w-3.5 h-3.5" />
                                            )}
                                            {k.trend}
                                        </p>
                                        <Spark data={k.spark} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Performance chart */}
                        <section className="piq-section">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Portfolio Performance</h2>
                                    <p className="piq-section-sub">Interactive wealth trajectory — switch metrics without leaving the page.</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="piq-pills">
                                        {ranges.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                className={`piq-pill ${range === r.id ? 'piq-pill--active' : ''}`}
                                                onClick={() => setRange(r.id)}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="piq-pills">
                                        {metrics.map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                className={`piq-pill ${metric === m.id ? 'piq-pill--active' : ''}`}
                                                onClick={() => setMetric(m.id)}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="piq-chart-box">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="piqArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#dc2626" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,28,0.06)" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="rgba(28,28,28,0.25)" />
                                        <YAxis
                                            tick={{ fontSize: 11 }}
                                            stroke="rgba(28,28,28,0.25)"
                                            tickFormatter={(v) =>
                                                metric === 'growth' ? `${v}%` : `${Math.round(v / 1000)}k`
                                            }
                                        />
                                        <Tooltip
                                            formatter={(v: number) =>
                                                metric === 'growth' ? formatPct(v) : formatZar(v)
                                            }
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#dc2626"
                                            fill="url(#piqArea)"
                                            strokeWidth={2.5}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* Property cards */}
                        <section>
                            <div className="mb-3 flex items-end justify-between gap-3">
                                <div>
                                    <h2 className="piq-section-title">Your properties</h2>
                                    <p className="piq-section-sub">Select a property to refresh every section below.</p>
                                </div>
                            </div>
                            <div className="piq-rail">
                                {properties.map((p) => {
                                    const g = capitalGrowthPct(p.purchasePrice, p.currentValue);
                                    const active = p.id === selected.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className={`piq-pcard ${active ? 'piq-pcard--active' : ''}`}
                                            onClick={() => setSelectedId(p.id)}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={p.image} alt="" className="piq-pcard-img" />
                                            <div className="piq-pcard-body space-y-2">
                                                <div>
                                                    <p className="font-semibold tracking-tight">{p.name}</p>
                                                    <p className="text-xs text-charcoal/45">{p.address}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <p className="text-charcoal/40">Value</p>
                                                        <p className="font-semibold tabular-nums">{formatZar(p.currentValue)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-charcoal/40">Growth</p>
                                                        <p className="font-semibold tabular-nums text-[#0f766e]">
                                                            {formatPct(g, 0)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-charcoal/40">Equity</p>
                                                        <p className="font-semibold tabular-nums">{formatZar(equityOf(p))}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-charcoal/40">Yield</p>
                                                        <p className="font-semibold tabular-nums">{formatPct(grossYield(p))}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="mb-1 flex justify-between text-[10px] text-charcoal/40">
                                                        <span>Mortgage progress</span>
                                                        <span>{mortgageProgress(p).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="piq-progress">
                                                        <span style={{ width: `${mortgageProgress(p)}%` }} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-charcoal/5 px-2 py-0.5 text-[11px] font-semibold">
                                                        <Sparkles className="w-3 h-3 text-[#dc2626]" /> AI {p.aiScore}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-[#dc2626]">
                                                        View details →
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Financial overview */}
                        <section className="piq-section" id="piq-financial">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Financial Overview</h2>
                                    <p className="piq-section-sub">
                                        {selected.name} — premium metrics, not spreadsheets.
                                    </p>
                                </div>
                            </div>
                            <div className="piq-metric-grid">
                                {financialMetrics.map((m) => (
                                    <div key={m.label} className="piq-metric">
                                        <div className="piq-metric-label">
                                            <m.icon className="w-3.5 h-3.5 text-[#dc2626]" />
                                            {m.label}
                                            <Tip text={m.tip} />
                                        </div>
                                        <p className="piq-metric-value">{m.value}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Smart Bond Optimizer embed */}
                        <section className="piq-section piq-section--dark" id="piq-bond">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Smart Bond Optimizer</h2>
                                    <p className="piq-section-sub">
                                        Simulate extras, lumpsums, bi-weekly cadence and refinance — instantly.
                                    </p>
                                </div>
                            </div>
                            <div className="piq-slider-row mb-6">
                                <div className="piq-field">
                                    <label>
                                        <span>Extra monthly</span>
                                        <span>{formatZar(sim.extraMonthly)}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={8000}
                                        step={100}
                                        value={sim.extraMonthly}
                                        onChange={(e) =>
                                            setSim((s) => ({ ...s, extraMonthly: Number(e.target.value) }))
                                        }
                                    />
                                </div>
                                <div className="piq-field">
                                    <label>
                                        <span>Annual lump sum</span>
                                        <span>{formatZar(sim.annualLump)}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100000}
                                        step={1000}
                                        value={sim.annualLump}
                                        onChange={(e) =>
                                            setSim((s) => ({ ...s, annualLump: Number(e.target.value) }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="piq-chip-row mb-6">
                                <button
                                    type="button"
                                    className={`piq-chip ${sim.biWeekly ? 'piq-chip--active' : ''}`}
                                    onClick={() => setSim((s) => ({ ...s, biWeekly: !s.biWeekly }))}
                                >
                                    Bi-weekly repayments
                                </button>
                                {[null, 10.75, 11.0, 11.25].map((rate) => (
                                    <button
                                        key={String(rate)}
                                        type="button"
                                        className={`piq-chip ${sim.refinanceRate === rate ? 'piq-chip--active' : ''}`}
                                        onClick={() => setSim((s) => ({ ...s, refinanceRate: rate }))}
                                    >
                                        {rate == null ? 'Current rate' : `Refi ${rate}%`}
                                    </button>
                                ))}
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                                {[
                                    { l: 'Years saved', v: `${bond.yearsSaved}` },
                                    { l: 'Interest saved', v: formatZar(bond.interestSaved) },
                                    { l: 'New payoff', v: bond.payoffDate },
                                    { l: 'Monthly delta', v: formatZar(bond.monthlySavings) },
                                    { l: 'Lifetime savings', v: formatZar(bond.lifetimeSavings) },
                                ].map((x) => (
                                    <div
                                        key={x.l}
                                        className="rounded-2xl border border-white/12 bg-white/5 px-3.5 py-3"
                                    >
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                                            {x.l}
                                        </p>
                                        <p className="mt-1 text-lg font-semibold tabular-nums">{x.v}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="piq-chart-box !h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={bond.chart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                        <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
                                        <YAxis
                                            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                                            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                                        />
                                        <Tooltip formatter={(v: number) => formatZar(v)} />
                                        <Line
                                            type="monotone"
                                            dataKey="baselineInterest"
                                            name="Current schedule"
                                            stroke="#F87171"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="optimizedInterest"
                                            name="Optimised"
                                            stroke="#5eead4"
                                            strokeWidth={2.5}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* Equity unlock */}
                        <section className="piq-section" id="piq-equity">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Equity Unlock Calculator</h2>
                                    <p className="piq-section-sub">
                                        See how equity can fund another deposit — responsibly.
                                    </p>
                                </div>
                            </div>
                            <div className="piq-metric-grid mb-4">
                                {[
                                    { l: 'Current market value', v: formatZar(unlock.marketValue) },
                                    { l: 'Outstanding bond', v: formatZar(unlock.bond) },
                                    { l: 'Available equity (80%)', v: formatZar(unlock.available) },
                                    { l: 'Recommended release', v: formatZar(unlock.recommended) },
                                    { l: 'Potential deposit', v: formatZar(unlock.deposit) },
                                    { l: 'Est. buying power', v: formatZar(unlock.buyingPower) },
                                ].map((x) => (
                                    <div key={x.l} className="piq-metric">
                                        <p className="piq-metric-label">{x.l}</p>
                                        <p className="piq-metric-value">{x.v}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-2xl border border-[#0f766e]/20 bg-[rgba(15,118,110,0.06)] p-4 text-sm leading-relaxed text-charcoal/70">
                                <strong className="text-charcoal">Insight:</strong> Based on your available equity,
                                you may qualify to purchase another investment property around{' '}
                                {formatZar(unlock.buyingPower)} (10% deposit heuristic). Always stress rates, keep a
                                cash buffer, and speak to a registered credit provider before releasing equity.
                            </div>
                        </section>

                        {/* Renovations */}
                        <section className="piq-section" id="piq-reno">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Renovations & Improvements</h2>
                                    <p className="piq-section-sub">
                                        Money in vs value created — {formatZar(renoInvested)} invested ·{' '}
                                        {formatZar(renoValue)} value signal.
                                    </p>
                                </div>
                            </div>
                            <div className="piq-chart-box !h-[200px] mb-5">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={selected.renovations.map((r) => ({
                                            name: r.room,
                                            invested: r.cost,
                                            value: r.actualValueAdd || r.estimatedValueAdd,
                                        }))}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,28,0.06)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(v: number) => formatZar(v)} />
                                        <Bar dataKey="invested" name="Invested" fill="#c4a574" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="value" name="Value added" fill="#dc2626" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="piq-reno-grid">
                                {selected.renovations.map((r) => {
                                    const roi = r.cost > 0 ? ((r.actualValueAdd || r.estimatedValueAdd) / r.cost) * 100 : 0;
                                    return (
                                        <div key={r.id} className="piq-reno">
                                            <div className="piq-reno-imgs">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={r.beforeImage} alt="" />
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={r.afterImage} alt="" />
                                            </div>
                                            <div className="p-4 space-y-2">
                                                <div className="flex justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold">{r.room}</p>
                                                        <p className="text-xs text-charcoal/45">
                                                            {r.category} · {r.contractor}
                                                        </p>
                                                    </div>
                                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/40">
                                                        {r.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div>
                                                        <p className="text-charcoal/40">Cost</p>
                                                        <p className="font-semibold">{formatZar(r.cost)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-charcoal/40">Value add</p>
                                                        <p className="font-semibold">
                                                            {formatZar(r.actualValueAdd || r.estimatedValueAdd)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-charcoal/40">ROI</p>
                                                        <p className="font-semibold text-[#0f766e]">{formatPct(roi, 0)}</p>
                                                    </div>
                                                </div>
                                                <div className="piq-progress">
                                                    <span style={{ width: `${r.progress}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Expenses */}
                        <section className="piq-section" id="piq-expenses">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Property Expenses</h2>
                                    <p className="piq-section-sub">Category breakdown for {selected.name}.</p>
                                </div>
                            </div>
                            <div className="grid lg:grid-cols-2 gap-6">
                                <div className="piq-chart-box">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={expenseData}
                                                dataKey="amount"
                                                nameKey="category"
                                                innerRadius={55}
                                                outerRadius={90}
                                                paddingAngle={3}
                                            >
                                                {expenseData.map((e) => (
                                                    <Cell key={e.category} fill={e.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: number) => formatZar(v)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2">
                                    {expenseData.map((e) => (
                                        <div
                                            key={e.category}
                                            className="flex items-center justify-between rounded-xl border border-charcoal/[0.06] bg-white px-3 py-2.5"
                                        >
                                            <span className="inline-flex items-center gap-2 text-sm font-semibold">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{ background: e.color }}
                                                />
                                                {e.category}
                                            </span>
                                            <span className="text-sm font-semibold tabular-nums">
                                                {formatZar(e.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Rental */}
                        <section className="piq-section" id="piq-rental">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Rental Performance</h2>
                                    <p className="piq-section-sub">
                                        {selected.tenantStatus === 'owner-occupied'
                                            ? 'Primary residence — rental metrics shown as planning context.'
                                            : 'Income, occupancy and yield at a glance.'}
                                    </p>
                                </div>
                            </div>
                            <div className="piq-metric-grid mb-5">
                                {[
                                    { l: 'Monthly rental', v: formatZar(selected.rentalIncome) },
                                    { l: 'Occupancy', v: formatPct(selected.occupancyRate, 0) },
                                    { l: 'Lease expiry', v: selected.leaseExpiry ?? '—' },
                                    { l: 'Gross yield', v: formatPct(grossYield(selected)) },
                                    { l: 'Tenant status', v: selected.tenantStatus },
                                    { l: 'Monthly profit', v: formatZar(cash) },
                                ].map((x) => (
                                    <div key={x.l} className="piq-metric">
                                        <p className="piq-metric-label">{x.l}</p>
                                        <p className="piq-metric-value capitalize">{x.v}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="piq-chart-box !h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={selected.history.slice(-18).map((h) => ({
                                            month: h.month,
                                            rental: h.rental,
                                            cashFlow: h.cashFlow,
                                        }))}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,28,0.06)" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                        <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(v: number) => formatZar(v)} />
                                        <Area type="monotone" dataKey="rental" stroke="#0f766e" fill="rgba(15,118,110,0.15)" />
                                        <Area type="monotone" dataKey="cashFlow" stroke="#dc2626" fill="rgba(220,38,38,0.1)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* AI insights */}
                        <section className="piq-section" id="piq-ai">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">AI Property Intelligence</h2>
                                    <p className="piq-section-sub">Actionable coaching cards with confidence signals.</p>
                                </div>
                            </div>
                            <div className="piq-insights">
                                {insights.map((ins) => (
                                    <div key={ins.id} className={`piq-insight piq-insight--${ins.tone}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <Lightbulb className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                                                {ins.confidence}% confidence
                                            </span>
                                        </div>
                                        <p className="mt-2 font-semibold tracking-tight leading-snug">{ins.title}</p>
                                        <p className="mt-1.5 text-sm text-charcoal/55 leading-relaxed">{ins.body}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Wealth forecast */}
                        <section className="piq-section piq-section--dark" id="piq-forecast">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Wealth Forecast</h2>
                                    <p className="piq-section-sub">Project 5 / 10 / 20 years across scenarios.</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="piq-pills">
                                        {([5, 10, 20] as const).map((y) => (
                                            <button
                                                key={y}
                                                type="button"
                                                className={`piq-pill ${forecastYears === y ? 'piq-pill--active' : ''}`}
                                                onClick={() => setForecastYears(y)}
                                            >
                                                {y}Y
                                            </button>
                                        ))}
                                    </div>
                                    <div className="piq-pills">
                                        {(
                                            [
                                                ['base', 'Base'],
                                                ['extra', 'Extra repay'],
                                                ['expand', 'Expand'],
                                            ] as const
                                        ).map(([id, label]) => (
                                            <button
                                                key={id}
                                                type="button"
                                                className={`piq-pill ${forecastScenario === id ? 'piq-pill--active' : ''}`}
                                                onClick={() => setForecastScenario(id)}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { l: 'Projected portfolio value', v: formatZar(forecast.projectedValue) },
                                    { l: 'Projected equity', v: formatZar(forecast.projectedEquity) },
                                    { l: 'Passive income / mo', v: formatZar(forecast.passiveIncome) },
                                    { l: 'Outstanding debt', v: formatZar(forecast.outstandingDebt) },
                                    { l: 'Net worth', v: formatZar(forecast.netWorth) },
                                    { l: 'Est. retirement income', v: formatZar(forecast.retirementIncome) },
                                ].map((x) => (
                                    <div key={x.l} className="rounded-2xl border border-white/12 bg-white/5 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                                            {x.l}
                                        </p>
                                        <p className="mt-1 text-xl font-semibold tabular-nums">{x.v}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Timeline */}
                        <section className="piq-section" id="piq-timeline">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Property Timeline</h2>
                                    <p className="piq-section-sub">Milestones for {selected.name}.</p>
                                </div>
                            </div>
                            <div className="piq-timeline">
                                {[...selected.timeline]
                                    .sort((a, b) => b.date.localeCompare(a.date))
                                    .map((t) => (
                                        <div key={t.id} className="piq-tl-item">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
                                                {new Date(t.date).toLocaleDateString('en-ZA', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}{' '}
                                                · {t.kind}
                                            </p>
                                            <p className="font-semibold mt-0.5">{t.title}</p>
                                            <p className="text-sm text-charcoal/55">{t.detail}</p>
                                        </div>
                                    ))}
                            </div>
                        </section>

                        {/* Document vault */}
                        <section className="piq-section" id="piq-docs">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Document Vault</h2>
                                    <p className="piq-section-sub">Secure cards — preview ready (demo).</p>
                                </div>
                            </div>
                            <div className="piq-docs">
                                {selected.documents.map((d) => (
                                    <div key={d.id} className="piq-doc">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-charcoal/[0.05] text-[#dc2626]">
                                            <FileText className="w-4 h-4" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-semibold truncate">{d.name}</p>
                                            <p className="text-xs text-charcoal/45 capitalize">
                                                {d.category} · {d.sizeLabel} · {d.uploadedAt}
                                            </p>
                                            <button
                                                type="button"
                                                className="mt-2 text-xs font-semibold text-[#dc2626]"
                                            >
                                                Preview
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Health score */}
                        <section className="piq-section" id="piq-health">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">Portfolio Health Score</h2>
                                    <p className="piq-section-sub">Debt, cash flow, yield, growth, risk & maintenance.</p>
                                </div>
                            </div>
                            <div className="piq-gauge-wrap">
                                <HealthGauge score={health.score} />
                                <div className="space-y-3">
                                    {health.parts.map((p) => (
                                        <div key={p.label}>
                                            <div className="mb-1 flex justify-between text-xs font-semibold">
                                                <span className="text-charcoal/50">{p.label}</span>
                                                <span>{p.value}</span>
                                            </div>
                                            <div className="piq-progress">
                                                <span style={{ width: `${p.value}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    <ul className="mt-4 space-y-2">
                                        {health.tips.map((t) => (
                                            <li key={t} className="text-sm text-charcoal/60 leading-relaxed">
                                                · {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Reports */}
                        <section className="piq-section" id="piq-reports">
                            <div className="piq-section-head">
                                <div>
                                    <h2 className="piq-section-title">One-click reports</h2>
                                    <p className="piq-section-sub">
                                        Professional summaries for banks, accountants and advisors (demo export).
                                    </p>
                                </div>
                            </div>
                            <div className="piq-report-grid">
                                {REPORT_TYPES.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        className="piq-report-btn"
                                        onClick={() => downloadReport(r.id, selected, properties)}
                                    >
                                        <span>{r.label}</span>
                                        <FileText className="w-4 h-4 text-[#dc2626]" />
                                    </button>
                                ))}
                            </div>
                            <p className="mt-4 text-xs text-charcoal/40 leading-relaxed">
                                Educational Property IQ™ demo using sample South African portfolio data. Not formal
                                financial, tax or credit advice.
                            </p>
                        </section>
                    </div>

                    {/* Sticky sidebar */}
                    <aside className="piq-aside" aria-label="Property IQ summary">
                        <div className="piq-aside-card">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal/40">
                                Live summary
                            </p>
                            <p className="mt-2 font-semibold tracking-tight">{selected.name}</p>
                            <p className="text-xs text-charcoal/45">{selected.suburb}, {selected.city}</p>
                            <div className="mt-4 space-y-2.5 text-sm">
                                {[
                                    ['Portfolio value', formatZar(port.value)],
                                    ['Equity', formatZar(port.equity)],
                                    ['Outstanding bond', formatZar(port.bond)],
                                    ['Monthly cash flow', formatZar(port.cashFlow)],
                                    ['Health score', `${health.score}/100`],
                                ].map(([l, v]) => (
                                    <div key={l} className="flex justify-between gap-2">
                                        <span className="text-charcoal/45">{l}</span>
                                        <span className="font-semibold tabular-nums">{v}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="piq-aside-actions">
                                <button type="button" className="piq-aside-btn piq-aside-btn--primary">
                                    <Plus className="w-3.5 h-3.5" /> Add Expense
                                </button>
                                <button type="button" className="piq-aside-btn">
                                    <Upload className="w-3.5 h-3.5" /> Upload Document
                                </button>
                                <button type="button" className="piq-aside-btn">
                                    <Wrench className="w-3.5 h-3.5" /> Add Renovation
                                </button>
                                <a href="#piq-bond" className="piq-aside-btn">
                                    <Gauge className="w-3.5 h-3.5" /> Optimise Bond
                                </a>
                                <a href="#piq-reports" className="piq-aside-btn">
                                    <FileText className="w-3.5 h-3.5" /> Generate Report
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="piq-mobile-sticky">
                <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                        <p className="font-semibold truncate">{selected.name}</p>
                        <p className="text-charcoal/45 tabular-nums">
                            {formatZar(port.equity)} equity · Health {health.score}
                        </p>
                    </div>
                    <a
                        href="#piq-bond"
                        className="shrink-0 rounded-full bg-[#dc2626] px-3 py-2 font-semibold text-white"
                    >
                        Optimise
                    </a>
                </div>
            </div>
        </div>
    );
}
