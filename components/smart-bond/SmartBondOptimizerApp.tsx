'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
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
    Activity,
    Banknote,
    BookOpen,
    Building2,
    Calculator,
    CalendarClock,
    Download,
    Gauge,
    Home,
    Landmark,
    LineChart as LineChartIcon,
    Percent,
    PiggyBank,
    Printer,
    RefreshCw,
    Sparkles,
    Target,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import {
    aggregateAmortisation,
    analyseInvestmentPlan,
    applyScenario,
    bondHealthScore,
    buildInsights,
    compareBaselineVsOptimized,
    DISCLAIMER,
    equityNow,
    estimateTransferCosts,
    exportAmortisationCsv,
    exportFinancialSummaryPdf,
    formatDate,
    formatMonthsAsYears,
    formatPct,
    formatZar,
    investmentScore,
    KNOWLEDGE_ARTICLES,
    loadSmartBondState,
    ltvPct,
    monthlyPayment,
    portfolioSummary,
    projectEquitySeries,
    RATE_HISTORY_ILLUSTRATIVE,
    rateShockPayment,
    refinanceAnalysis,
    rentVsBuy,
    saveSmartBondState,
    SA_PRIME_REFERENCE,
    SA_REPO_REFERENCE,
    wealthScore,
    withDerivedRepayment,
    type AmortisationView,
    type BondProfile,
    type GoalKind,
    type InvestmentPlanInput,
    type PortfolioProperty,
    type ScenarioOverrides,
    type SboTab,
} from '@/lib/smart-bond';
import {
    SboCallout,
    SboInsightBadge,
    SboKpi,
    SboNumberField,
    SboScoreRing,
    SboSection,
    SboSlider,
    SboTabButton,
} from '@/components/smart-bond/sbo-ui';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

const TABS: Array<{ id: SboTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'optimizer', label: 'Optimizer' },
    { id: 'rates', label: 'Fixed vs Variable' },
    { id: 'equity', label: 'Equity Builder' },
    { id: 'investment', label: 'Investment Planner' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'refinance', label: 'Refinance' },
    { id: 'scenarios', label: 'Scenarios' },
    { id: 'goals', label: 'Goals' },
    { id: 'knowledge', label: 'Knowledge' },
    { id: 'calculators', label: 'Calculators' },
];

const GOAL_OPTIONS: Array<{ id: GoalKind; label: string }> = [
    { id: 'payoff_target', label: 'Pay off bond in a target timeframe' },
    { id: 'debt_free_retirement', label: 'Debt-free before retirement' },
    { id: 'reduce_repayment', label: 'Reduce monthly repayment pressure' },
    { id: 'second_property', label: 'Plan toward a second property' },
    { id: 'portfolio_five', label: 'Build toward five properties' },
    { id: 'max_equity', label: 'Maximise equity growth' },
    { id: 'passive_income', label: 'Grow passive rental income' },
];

const CHART_GOLD = '#DC2626';
const CHART_SLATE = '#64748B';
const CHART_TEAL = '#0D9488';

export default function SmartBondOptimizerApp() {
    const [hydrated, setHydrated] = useState(false);
    const [profile, setProfile] = useState<BondProfile>(() => withDerivedRepayment(loadSmartBondState().profile));
    const [scenario, setScenario] = useState<ScenarioOverrides>(() => loadSmartBondState().scenario);
    const [portfolio, setPortfolio] = useState<PortfolioProperty[]>(() => loadSmartBondState().portfolio);
    const [tab, setTab] = useState<SboTab>('overview');
    const [amortView, setAmortView] = useState<AmortisationView>('yearly');
    const [goal, setGoal] = useState<GoalKind>('payoff_target');
    const [goalYears, setGoalYears] = useState(10);
    const [refiRate, setRefiRate] = useState(10.75);
    const [refiTerm, setRefiTerm] = useState(240);
    const [refiFees, setRefiFees] = useState(18500);
    const [invest, setInvest] = useState<InvestmentPlanInput>({
        monthlyIncome: 55000,
        monthlyExpenses: 28000,
        existingBondRepayment: 0,
        rentalIncome: 14500,
        savings: 120000,
        depositAmount: 350000,
        targetPrice: 1750000,
        maintenanceMonthly: 1200,
        insuranceMonthly: 900,
        ratesMonthly: 1800,
        vacancyMonthsPerYear: 1,
        interestRate: 11.75,
        loanTermYears: 20,
    });
    const [knowledgeId, setKnowledgeId] = useState(KNOWLEDGE_ARTICLES[0].id);
    const [calcPurchase, setCalcPurchase] = useState(2000000);
    const [calcDeposit, setCalcDeposit] = useState(400000);
    const [calcRate, setCalcRate] = useState(11.75);
    const [calcTerm, setCalcTerm] = useState(20);
    const [calcRent, setCalcRent] = useState(12000);

    useEffect(() => {
        const s = loadSmartBondState();
        setProfile(withDerivedRepayment(s.profile));
        setScenario(s.scenario);
        setPortfolio(s.portfolio);
        setTab(s.activeTab);
        setInvest((prev) => ({
            ...prev,
            existingBondRepayment: withDerivedRepayment(s.profile).monthlyRepayment,
            monthlyIncome: s.profile.monthlyIncome,
            monthlyExpenses: s.profile.monthlyExpenses,
        }));
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        const t = window.setTimeout(() => {
            saveSmartBondState({
                profile,
                scenario,
                portfolio,
                activeTab: tab,
                bookmarks: [],
                updatedAt: new Date().toISOString(),
            });
        }, 400);
        return () => window.clearTimeout(t);
    }, [profile, scenario, portfolio, tab, hydrated]);

    const liveProfile = useMemo(() => withDerivedRepayment(profile), [profile]);
    const comparison = useMemo(() => compareBaselineVsOptimized(liveProfile), [liveProfile]);
    const insights = useMemo(() => buildInsights(liveProfile), [liveProfile]);
    const wealth = useMemo(() => wealthScore(liveProfile, comparison), [liveProfile, comparison]);
    const health = useMemo(() => bondHealthScore(liveProfile, comparison), [liveProfile, comparison]);
    const equity = equityNow(liveProfile.propertyValue, liveProfile.outstandingBalance);
    const ltv = ltvPct(liveProfile.outstandingBalance, liveProfile.propertyValue);
    const settlement = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + comparison.optimized.monthsToSettle);
        return d;
    }, [comparison.optimized.monthsToSettle]);

    const equitySeries = useMemo(
        () => projectEquitySeries(liveProfile, 15, comparison.optimized),
        [liveProfile, comparison.optimized]
    );

    const principalInterestChart = useMemo(() => {
        return aggregateAmortisation(comparison.optimized.rows, 'yearly').map((r) => ({
            label: r.label,
            principal: Math.round(r.principal + r.extra),
            interest: Math.round(r.interest),
            balance: Math.round(r.balance),
        }));
    }, [comparison.optimized.rows]);

    const amortTable = useMemo(
        () => aggregateAmortisation(comparison.optimized.rows, amortView).slice(0, 60),
        [comparison.optimized.rows, amortView]
    );

    const shockData = useMemo(() => {
        const deltas = [-2, -1, 0, 1, 2, 3];
        return deltas.map((d) => ({
            shock: `${d > 0 ? '+' : ''}${d}%`,
            repayment: Math.round(
                rateShockPayment(
                    liveProfile.outstandingBalance,
                    liveProfile.annualInterestRate,
                    liveProfile.remainingTermMonths,
                    d
                )
            ),
        }));
    }, [liveProfile]);

    const scenarioProfile = useMemo(
        () => withDerivedRepayment(applyScenario(liveProfile, scenario)),
        [liveProfile, scenario]
    );
    const scenarioCmp = useMemo(() => compareBaselineVsOptimized(scenarioProfile), [scenarioProfile]);

    const portSummary = useMemo(() => portfolioSummary(portfolio), [portfolio]);
    const portScore = useMemo(() => investmentScore(portfolio), [portfolio]);
    const investResult = useMemo(() => analyseInvestmentPlan(invest), [invest]);
    const refi = useMemo(
        () =>
            refinanceAnalysis({
                balance: liveProfile.outstandingBalance,
                currentRate: liveProfile.annualInterestRate,
                currentPayment: liveProfile.monthlyRepayment,
                remainingMonths: liveProfile.remainingTermMonths,
                newRate: refiRate,
                newTermMonths: refiTerm,
                fees: refiFees,
            }),
        [liveProfile, refiRate, refiTerm, refiFees]
    );

    const transferEst = useMemo(() => estimateTransferCosts(calcPurchase), [calcPurchase]);
    const rentBuy = useMemo(
        () =>
            rentVsBuy({
                rentMonthly: calcRent,
                buyPrice: calcPurchase,
                deposit: calcDeposit,
                rate: calcRate,
                termYears: calcTerm,
                years: 10,
                appreciationPct: liveProfile.annualAppreciationPct,
            }),
        [calcRent, calcPurchase, calcDeposit, calcRate, calcTerm, liveProfile.annualAppreciationPct]
    );

    const goalRoadmap = useMemo(() => {
        const needExtra =
            goal === 'payoff_target' || goal === 'debt_free_retirement' || goal === 'max_equity'
                ? Math.max(0, Math.round(liveProfile.monthlyRepayment * (0.08 + goalYears / 100)))
                : liveProfile.extraMonthly;
        const projected = compareBaselineVsOptimized({
            ...liveProfile,
            extraMonthly: Math.max(liveProfile.extraMonthly, needExtra),
        });
        return {
            needExtra,
            months: projected.optimized.monthsToSettle,
            interestSaved: projected.interestSaved,
            milestones: [
                { t: '0–6 mo', d: 'Confirm loan statements, rate type, and access-bond rules with your lender.' },
                { t: '6–18 mo', d: 'Build payment consistency and emergency buffer before aggressive extras.' },
                { t: '18–36 mo', d: 'Track LTV and equity; revisit refinance only if fees and break-even support it.' },
                {
                    t: '36+ mo',
                    d:
                        goal === 'second_property' || goal === 'portfolio_five' || goal === 'passive_income'
                            ? 'Reassess affordability for further property only after buffers and lender criteria allow.'
                            : 'Stay the course on extras; review annually when rates or income change.',
                },
            ],
        };
    }, [goal, goalYears, liveProfile]);

    function patchProfile(partial: Partial<BondProfile>) {
        setProfile((prev) => {
            const next = { ...prev, ...partial };
            if (
                partial.outstandingBalance != null ||
                partial.annualInterestRate != null ||
                partial.remainingTermMonths != null ||
                partial.monthlyRepayment === 0
            ) {
                return withDerivedRepayment({ ...next, monthlyRepayment: partial.monthlyRepayment ?? 0 });
            }
            return withDerivedRepayment(next);
        });
    }

    if (!hydrated) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-40 rounded-[1.25rem] bg-charcoal/[0.06]" />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl bg-charcoal/[0.06]" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-[1.25rem] border border-charcoal/[0.08] bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#7F1D1D] p-6 text-white shadow-lg sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                            Flagship · PropReady Intelligence
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Smart Bond Optimizer
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                            A premium South African home-loan planning workspace to help you understand your bond,
                            reduce estimated interest, accelerate repayment, build equity, compare strategies, and
                            explore long-term property wealth — with clear labels for facts, assumptions, and
                            estimates.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 print:hidden">
                        <button
                            type="button"
                            className={`${PORTAL_SECONDARY_BTN} !bg-white/10 !text-white !border-white/20`}
                            onClick={() => exportFinancialSummaryPdf(liveProfile)}
                        >
                            <Download className="h-4 w-4" />
                            PDF summary
                        </button>
                        <button
                            type="button"
                            className={`${PORTAL_SECONDARY_BTN} !bg-white/10 !text-white !border-white/20`}
                            onClick={() => exportAmortisationCsv(comparison.optimized.rows)}
                        >
                            <Download className="h-4 w-4" />
                            Excel/CSV schedule
                        </button>
                        <button
                            type="button"
                            className={`${PORTAL_PRIMARY_BTN}`}
                            onClick={() => window.print()}
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                    </div>
                </div>
            </section>

            <SboCallout>{DISCLAIMER}</SboCallout>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
                {TABS.map((t) => (
                    <SboTabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                        {t.label}
                    </SboTabButton>
                ))}
            </div>

            {tab === 'overview' ? (
                <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SboKpi label="Property value" value={formatZar(liveProfile.propertyValue)} icon={Home} tone="accent" />
                        <SboKpi label="Outstanding bond" value={formatZar(liveProfile.outstandingBalance)} icon={Landmark} />
                        <SboKpi label="Original loan" value={formatZar(liveProfile.originalLoanAmount)} icon={Banknote} />
                        <SboKpi label="Monthly repayment" value={formatZar(liveProfile.monthlyRepayment)} icon={Wallet} />
                        <SboKpi label="Extra monthly" value={formatZar(liveProfile.extraMonthly)} icon={PiggyBank} tone="good" trend="Planned" />
                        <SboKpi label="Interest rate" value={`${formatPct(liveProfile.annualInterestRate, 2)} · ${liveProfile.interestType}`} icon={Percent} />
                        <SboKpi label="Remaining term" value={formatMonthsAsYears(liveProfile.remainingTermMonths)} icon={CalendarClock} />
                        <SboKpi label="Est. settlement" value={formatDate(settlement)} icon={Target} hint="With current extras (estimate)" />
                        <SboKpi label="Estimated equity" value={formatZar(equity)} icon={TrendingUp} tone="good" />
                        <SboKpi label="Loan-to-value" value={formatPct(ltv, 1)} icon={Gauge} tone={ltv > 80 ? 'warn' : 'good'} />
                        <SboKpi label="Remaining interest" value={formatZar(comparison.baseline.totalInterest)} icon={Activity} hint="Baseline schedule estimate" />
                        <SboKpi label="Est. interest saved" value={formatZar(comparison.interestSaved)} icon={Sparkles} tone="good" hint="Vs baseline with extras" />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[280px_280px_1fr]">
                        <SboScoreRing score={wealth.score} label="Wealth Score" sub={wealth.label} />
                        <SboScoreRing score={health.score} label="Bond Health" sub={health.label} />
                        <SboSection title="Score drivers" subtitle="Proprietary educational scores — not credit scores or bank ratings.">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[...wealth.factors, ...health.factors].slice(0, 6).map((f) => (
                                    <div key={f.key + f.label} className="rounded-xl border border-charcoal/[0.08] p-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-charcoal">{f.label}</span>
                                            <span className="tabular-nums text-charcoal/70">{Math.round(f.score)}</span>
                                        </div>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-charcoal/[0.06]">
                                            <div
                                                className="h-full rounded-full bg-gold transition-all"
                                                style={{ width: `${Math.min(100, f.score)}%` }}
                                            />
                                        </div>
                                        <p className="mt-1.5 text-[11px] text-charcoal/50">{f.note}</p>
                                    </div>
                                ))}
                            </div>
                        </SboSection>
                    </div>

                    <SboSection title="AI-assisted insights" subtitle="Plain-language explanations tagged as fact, estimate, assumption, or opportunity.">
                        <div className="grid gap-3 md:grid-cols-2">
                            {insights.map((ins) => (
                                <div key={ins.id} className="rounded-2xl border border-charcoal/[0.08] bg-white p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-charcoal">{ins.title}</p>
                                        <SboInsightBadge kind={ins.kind} />
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{ins.body}</p>
                                </div>
                            ))}
                        </div>
                    </SboSection>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <SboSection title="Principal vs interest" subtitle="Yearly view of the optimised path (estimate).">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={principalInterestChart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${Math.round(v / 1000)}k`} />
                                        <Tooltip formatter={(v: number) => formatZar(v)} />
                                        <Legend />
                                        <Area type="monotone" dataKey="principal" stackId="1" stroke={CHART_TEAL} fill={CHART_TEAL} fillOpacity={0.35} name="Principal + extras" />
                                        <Area type="monotone" dataKey="interest" stackId="1" stroke={CHART_GOLD} fill={CHART_GOLD} fillOpacity={0.35} name="Interest" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </SboSection>
                        <SboSection title="Equity trajectory" subtitle="Assumes your appreciation % — property values can fall.">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={equitySeries}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${Math.round(v / 1000)}k`} />
                                        <Tooltip formatter={(v: number) => formatZar(v)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="equity" stroke={CHART_TEAL} strokeWidth={2} name="Equity" dot={false} />
                                        <Line type="monotone" dataKey="balance" stroke={CHART_GOLD} strokeWidth={2} name="Balance" dot={false} />
                                        <Line type="monotone" dataKey="value" stroke={CHART_SLATE} strokeWidth={2} name="Property value" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </SboSection>
                    </div>

                    <SboSection title="Quick profile inputs" subtitle="Autosaved locally in your browser.">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <SboNumberField label="Property value (R)" value={liveProfile.propertyValue} onChange={(n) => patchProfile({ propertyValue: n })} />
                            <SboNumberField label="Outstanding balance (R)" value={liveProfile.outstandingBalance} onChange={(n) => patchProfile({ outstandingBalance: n, monthlyRepayment: 0 })} />
                            <SboNumberField label="Original loan (R)" value={liveProfile.originalLoanAmount} onChange={(n) => patchProfile({ originalLoanAmount: n })} />
                            <SboNumberField label="Interest rate (% p.a.)" value={liveProfile.annualInterestRate} step={0.05} onChange={(n) => patchProfile({ annualInterestRate: n, monthlyRepayment: 0 })} />
                            <SboNumberField label="Remaining term (months)" value={liveProfile.remainingTermMonths} onChange={(n) => patchProfile({ remainingTermMonths: n, monthlyRepayment: 0 })} />
                            <SboNumberField label="Monthly income (R)" value={liveProfile.monthlyIncome} onChange={(n) => patchProfile({ monthlyIncome: n })} />
                            <label className="block space-y-1.5">
                                <span className="text-sm font-medium text-charcoal/70">Interest type</span>
                                <select
                                    className="h-11 w-full rounded-xl border border-charcoal/[0.12] bg-white px-3 text-sm"
                                    value={liveProfile.interestType}
                                    onChange={(e) =>
                                        patchProfile({ interestType: e.target.value as BondProfile['interestType'] })
                                    }
                                >
                                    <option value="variable">Variable (prime-linked)</option>
                                    <option value="fixed">Fixed (for a period)</option>
                                </select>
                            </label>
                            <SboNumberField label="Annual appreciation assumption (%)" value={liveProfile.annualAppreciationPct} step={0.1} onChange={(n) => patchProfile({ annualAppreciationPct: n })} hint="Assumption — not a forecast" />
                            <SboNumberField label="Monthly expenses (R)" value={liveProfile.monthlyExpenses} onChange={(n) => patchProfile({ monthlyExpenses: n })} />
                        </div>
                    </SboSection>
                </div>
            ) : null}

            {tab === 'optimizer' ? (
                <div className="space-y-6">
                    <SboSection title="Bond Optimizer" subtitle="Sliders update estimated years saved, interest saved, and settlement date instantly.">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-5">
                                <SboSlider label="Extra monthly repayment" value={liveProfile.extraMonthly} min={0} max={20000} step={100} display={formatZar(liveProfile.extraMonthly)} onChange={(n) => patchProfile({ extraMonthly: n })} />
                                <SboSlider label="Annual lump sum" value={liveProfile.annualLumpSum} min={0} max={200000} step={1000} display={formatZar(liveProfile.annualLumpSum)} onChange={(n) => patchProfile({ annualLumpSum: n })} />
                                <SboSlider label="Interest rate" value={liveProfile.annualInterestRate} min={6} max={16} step={0.05} display={formatPct(liveProfile.annualInterestRate, 2)} onChange={(n) => patchProfile({ annualInterestRate: n, monthlyRepayment: 0 })} />
                                <SboSlider label="Remaining term (months)" value={liveProfile.remainingTermMonths} min={12} max={360} step={1} display={formatMonthsAsYears(liveProfile.remainingTermMonths)} onChange={(n) => patchProfile({ remainingTermMonths: n, monthlyRepayment: 0 })} />
                                <SboSlider label="Deposit (context)" value={liveProfile.depositAmount} min={0} max={liveProfile.propertyValue} step={5000} display={formatZar(liveProfile.depositAmount)} onChange={(n) => patchProfile({ depositAmount: n })} />
                                <SboSlider label="Appreciation assumption" value={liveProfile.annualAppreciationPct} min={0} max={12} step={0.1} display={formatPct(liveProfile.annualAppreciationPct, 1)} onChange={(n) => patchProfile({ annualAppreciationPct: n })} />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <SboKpi label="Years saved (est.)" value={formatMonthsAsYears(comparison.monthsSaved)} icon={Sparkles} tone="good" />
                                <SboKpi label="Interest saved (est.)" value={formatZar(comparison.interestSaved)} icon={PiggyBank} tone="good" />
                                <SboKpi label="New settlement (est.)" value={formatDate(settlement)} icon={CalendarClock} />
                                <SboKpi label="Baseline total interest" value={formatZar(comparison.baseline.totalInterest)} icon={Activity} />
                                <SboKpi label="Optimised total interest" value={formatZar(comparison.optimized.totalInterest)} icon={TrendingUp} />
                                <SboKpi label="Total extras paid (est.)" value={formatZar(comparison.optimized.totalExtra)} icon={Wallet} />
                            </div>
                        </div>
                    </SboSection>

                    <SboSection
                        title="Amortisation schedule"
                        subtitle="Monthly, quarterly, or yearly aggregation."
                        action={
                            <div className="flex gap-2">
                                {(['monthly', 'quarterly', 'yearly'] as AmortisationView[]).map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => setAmortView(v)}
                                        className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                                            amortView === v ? 'bg-gold text-white' : 'bg-charcoal/[0.05] text-charcoal/70'
                                        }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="text-[11px] uppercase tracking-wide text-charcoal/45">
                                    <tr>
                                        <th className="py-2 pr-4">Period</th>
                                        <th className="py-2 pr-4">Payment</th>
                                        <th className="py-2 pr-4">Principal</th>
                                        <th className="py-2 pr-4">Interest</th>
                                        <th className="py-2 pr-4">Extra</th>
                                        <th className="py-2">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {amortTable.map((r) => (
                                        <tr key={r.label} className="border-t border-charcoal/[0.06]">
                                            <td className="py-2 pr-4 font-medium">{r.label}</td>
                                            <td className="py-2 pr-4 tabular-nums">{formatZar(r.payment)}</td>
                                            <td className="py-2 pr-4 tabular-nums">{formatZar(r.principal)}</td>
                                            <td className="py-2 pr-4 tabular-nums">{formatZar(r.interest)}</td>
                                            <td className="py-2 pr-4 tabular-nums">{formatZar(r.extra)}</td>
                                            <td className="py-2 tabular-nums">{formatZar(r.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            type="button"
                            className={`${PORTAL_SECONDARY_BTN} mt-4`}
                            onClick={() => exportAmortisationCsv(comparison.optimized.rows)}
                        >
                            <Download className="h-4 w-4" /> Download full schedule (CSV)
                        </button>
                    </SboSection>
                </div>
            ) : null}

            {tab === 'rates' ? (
                <div className="space-y-6">
                    <SboSection title="Fixed vs Variable Interest Centre" subtitle="Balanced education for the South African market — not a prediction engine.">
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-charcoal/[0.08] p-5">
                                <h3 className="font-semibold text-charcoal">Variable (often prime-linked)</h3>
                                <ul className="mt-3 space-y-2 text-sm text-charcoal/65">
                                    <li>• Instalments can rise or fall when prime moves.</li>
                                    <li>• Can benefit if rates decline; budget risk if rates rise.</li>
                                    <li>• Commonly quoted as prime ± a margin set by your lender.</li>
                                </ul>
                            </div>
                            <div className="rounded-2xl border border-charcoal/[0.08] p-5">
                                <h3 className="font-semibold text-charcoal">Fixed (for a defined period)</h3>
                                <ul className="mt-3 space-y-2 text-sm text-charcoal/65">
                                    <li>• Payment certainty during the fixed window aids budgeting.</li>
                                    <li>• Break costs / conditions may apply if you exit early.</li>
                                    <li>• After expiry, loans often revert to a variable structure.</li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <SboKpi label="Illustrative repo reference" value={formatPct(SA_REPO_REFERENCE, 2)} icon={Landmark} hint="Educational reference only" />
                            <SboKpi label="Illustrative prime reference" value={formatPct(SA_PRIME_REFERENCE, 2)} icon={Percent} hint="Update to your bank’s prime" />
                        </div>
                    </SboSection>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <SboSection title="Rate shock on your instalment" subtitle="Estimated repayment if your rate moves by the shock shown.">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={shockData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="shock" />
                                        <YAxis tickFormatter={(v) => `R${Math.round(v / 1000)}k`} />
                                        <Tooltip formatter={(v: number) => formatZar(v)} />
                                        <Bar dataKey="repayment" fill={CHART_GOLD} radius={[8, 8, 0, 0]} name="Est. repayment" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </SboSection>
                        <SboSection title="Illustrative repo & prime path" subtitle="Simplified educational series — verify official SARB / bank publications.">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={RATE_HISTORY_ILLUSTRATIVE}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="year" />
                                        <YAxis domain={[0, 14]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="repo" stroke={CHART_SLATE} name="Repo (illust.)" />
                                        <Line type="monotone" dataKey="prime" stroke={CHART_GOLD} name="Prime (illust.)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </SboSection>
                    </div>
                </div>
            ) : null}

            {tab === 'equity' ? (
                <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SboKpi label="Estimated equity" value={formatZar(equity)} icon={TrendingUp} tone="good" />
                        <SboKpi label="LTV" value={formatPct(ltv, 1)} icon={Gauge} />
                        <SboKpi label="Property value" value={formatZar(liveProfile.propertyValue)} icon={Home} />
                        <SboKpi label="Bond balance" value={formatZar(liveProfile.outstandingBalance)} icon={Landmark} />
                    </div>
                    <SboSection title="Property Wealth Roadmap" subtitle="Educational journey — borrowing against equity requires lender approval.">
                        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {[
                                'Buy & stabilise the primary bond',
                                'Reduce interest via extras / access deposits',
                                'Build equity & improve LTV',
                                'Maintain buffers & insurance',
                                'Explore further property only if affordable',
                                'Consider rental income carefully',
                                'Diversify portfolio thoughtfully',
                                'Long-term wealth with disciplined risk',
                            ].map((step, i) => (
                                <li key={step} className="rounded-2xl border border-charcoal/[0.08] bg-white p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gold">Step {i + 1}</p>
                                    <p className="mt-1 text-sm font-medium text-charcoal">{step}</p>
                                </li>
                            ))}
                        </ol>
                    </SboSection>
                    <SboSection title="Equity growth chart" subtitle="Combines repayment schedule with your appreciation assumption.">
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={equitySeries}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="year" />
                                    <YAxis tickFormatter={(v) => `R${Math.round(v / 1000)}k`} />
                                    <Tooltip formatter={(v: number) => formatZar(v)} />
                                    <Area type="monotone" dataKey="equity" stroke={CHART_TEAL} fill={CHART_TEAL} fillOpacity={0.3} name="Equity" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </SboSection>
                </div>
            ) : null}

            {tab === 'investment' ? (
                <div className="space-y-6">
                    <SboSection title="Investment Property Planner" subtitle="Planning estimates only — not an approval or recommendation to buy.">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {(
                                [
                                    ['monthlyIncome', 'Monthly income'],
                                    ['monthlyExpenses', 'Monthly expenses'],
                                    ['existingBondRepayment', 'Existing bond repayment'],
                                    ['rentalIncome', 'Expected rent'],
                                    ['savings', 'Savings available'],
                                    ['depositAmount', 'Deposit'],
                                    ['targetPrice', 'Target price'],
                                    ['maintenanceMonthly', 'Maintenance / mo'],
                                    ['insuranceMonthly', 'Insurance / mo'],
                                    ['ratesMonthly', 'Rates & levies / mo'],
                                    ['vacancyMonthsPerYear', 'Vacancy months / yr'],
                                    ['interestRate', 'Interest rate %'],
                                    ['loanTermYears', 'Loan term (years)'],
                                ] as const
                            ).map(([key, label]) => (
                                <SboNumberField
                                    key={key}
                                    label={label}
                                    value={invest[key]}
                                    step={key === 'interestRate' ? 0.05 : 1}
                                    onChange={(n) => setInvest((p) => ({ ...p, [key]: n }))}
                                />
                            ))}
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <SboKpi label="Loan needed (est.)" value={formatZar(investResult.loanNeeded)} icon={Landmark} />
                            <SboKpi label="Repayment (est.)" value={formatZar(investResult.repayment)} icon={Wallet} />
                            <SboKpi label="Cash flow (est.)" value={formatZar(investResult.cashFlow)} icon={Activity} tone={investResult.cashFlow >= 0 ? 'good' : 'warn'} />
                            <SboKpi label="DTI (est.)" value={formatPct(investResult.dti, 1)} icon={Gauge} />
                            <SboKpi label="Gross yield (est.)" value={formatPct(investResult.grossYield, 1)} icon={Percent} />
                            <SboKpi label="Net yield (est.)" value={formatPct(investResult.netYield, 1)} icon={Percent} />
                            <SboKpi label="LTV (est.)" value={formatPct(investResult.ltv, 1)} icon={Home} />
                            <SboKpi
                                label="Time to deposit (est.)"
                                value={
                                    investResult.monthsToDeposit == null
                                        ? '—'
                                        : formatMonthsAsYears(investResult.monthsToDeposit)
                                }
                                icon={CalendarClock}
                            />
                        </div>
                        <p className="mt-4 text-sm text-charcoal/60">{investResult.affordabilityNote}</p>
                    </SboSection>
                </div>
            ) : null}

            {tab === 'portfolio' ? (
                <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SboKpi label="Portfolio value" value={formatZar(portSummary.totalValue)} icon={Building2} />
                        <SboKpi label="Outstanding debt" value={formatZar(portSummary.totalDebt)} icon={Landmark} />
                        <SboKpi label="Combined equity" value={formatZar(portSummary.equity)} icon={TrendingUp} tone="good" />
                        <SboKpi label="Monthly rent" value={formatZar(portSummary.rent)} icon={Banknote} />
                        <SboKpi label="Operating expenses" value={formatZar(portSummary.opex)} icon={Wallet} />
                        <SboKpi label="Cash flow (est.)" value={formatZar(portSummary.cashFlow)} icon={Activity} tone={portSummary.cashFlow >= 0 ? 'good' : 'warn'} />
                        <SboKpi label="Gross yield" value={formatPct(portSummary.grossYield, 1)} icon={Percent} />
                        <SboKpi label="Net yield" value={formatPct(portSummary.netYield, 1)} icon={Percent} />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                        <SboScoreRing score={portScore.score} label="Investment Score" sub={portScore.label} />
                        <SboSection title="Portfolio properties" subtitle="Add residential, rental, holiday, or commercial holdings.">
                            <div className="space-y-3">
                                {portfolio.map((p, idx) => (
                                    <div key={p.id} className="grid gap-2 rounded-xl border border-charcoal/[0.08] p-3 sm:grid-cols-4">
                                        <input
                                            className="rounded-lg border border-charcoal/[0.12] px-2 py-2 text-sm sm:col-span-2"
                                            value={p.name}
                                            onChange={(e) =>
                                                setPortfolio((rows) =>
                                                    rows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r))
                                                )
                                            }
                                        />
                                        <select
                                            className="rounded-lg border border-charcoal/[0.12] px-2 py-2 text-sm"
                                            value={p.kind}
                                            onChange={(e) =>
                                                setPortfolio((rows) =>
                                                    rows.map((r, i) =>
                                                        i === idx
                                                            ? { ...r, kind: e.target.value as PortfolioProperty['kind'] }
                                                            : r
                                                    )
                                                )
                                            }
                                        >
                                            <option value="residential">Residential</option>
                                            <option value="rental">Rental</option>
                                            <option value="holiday">Holiday</option>
                                            <option value="commercial">Commercial</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="text-sm text-gold"
                                            onClick={() => setPortfolio((rows) => rows.filter((_, i) => i !== idx))}
                                        >
                                            Remove
                                        </button>
                                        <SboNumberField label="Value" value={p.value} onChange={(n) => setPortfolio((rows) => rows.map((r, i) => (i === idx ? { ...r, value: n } : r)))} />
                                        <SboNumberField label="Loan" value={p.loanBalance} onChange={(n) => setPortfolio((rows) => rows.map((r, i) => (i === idx ? { ...r, loanBalance: n } : r)))} />
                                        <SboNumberField label="Rent / mo" value={p.monthlyRent} onChange={(n) => setPortfolio((rows) => rows.map((r, i) => (i === idx ? { ...r, monthlyRent: n } : r)))} />
                                        <SboNumberField label="Opex / mo" value={p.monthlyExpenses} onChange={(n) => setPortfolio((rows) => rows.map((r, i) => (i === idx ? { ...r, monthlyExpenses: n } : r)))} />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className={PORTAL_SECONDARY_BTN}
                                    onClick={() =>
                                        setPortfolio((rows) => [
                                            ...rows,
                                            {
                                                id: `p-${Date.now()}`,
                                                name: `Property ${rows.length + 1}`,
                                                kind: 'rental',
                                                value: 1500000,
                                                loanBalance: 1000000,
                                                monthlyRent: 12000,
                                                monthlyExpenses: 3500,
                                                rate: 11.75,
                                                remainingMonths: 240,
                                            },
                                        ])
                                    }
                                >
                                    Add property
                                </button>
                            </div>
                        </SboSection>
                    </div>
                    <SboSection title="Portfolio mix" subtitle="Value share by property.">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={portfolio.map((p) => ({ name: p.name, value: p.value }))}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={100}
                                        label
                                    >
                                        {portfolio.map((_, i) => (
                                            <Cell key={i} fill={[CHART_GOLD, CHART_TEAL, CHART_SLATE, '#F59E0B'][i % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: number) => formatZar(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </SboSection>
                </div>
            ) : null}

            {tab === 'refinance' ? (
                <div className="space-y-6">
                    <SboSection title="Refinance Centre" subtitle="Compare current vs hypothetical refinance — include fees for a fairer estimate.">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <SboNumberField label="New rate %" value={refiRate} step={0.05} onChange={setRefiRate} />
                            <SboNumberField label="New term (months)" value={refiTerm} onChange={setRefiTerm} />
                            <SboNumberField label="Fees (R)" value={refiFees} onChange={setRefiFees} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <SboKpi label="New repayment (est.)" value={formatZar(refi.newPayment)} icon={Wallet} />
                            <SboKpi label="Monthly difference" value={formatZar(refi.monthlySaving)} icon={RefreshCw} tone={refi.monthlySaving > 0 ? 'good' : 'warn'} />
                            <SboKpi label="Interest difference (est.)" value={formatZar(refi.interestSaving)} icon={Percent} />
                            <SboKpi
                                label="Break-even"
                                value={
                                    Number.isFinite(refi.breakEvenMonths)
                                        ? formatMonthsAsYears(refi.breakEvenMonths)
                                        : 'N/A'
                                }
                                icon={CalendarClock}
                            />
                        </div>
                        <p className="mt-3 text-sm text-charcoal/60">
                            Net long-term saving estimate after fees: {formatZar(refi.netLongTermSaving)}. Extending term can
                            lower instalments while increasing lifetime interest — review both carefully.
                        </p>
                    </SboSection>
                    <SboSection title="Access bonds (education)" subtitle="Product features differ by lender.">
                        <div className="prose prose-sm max-w-none text-charcoal/70">
                            <p>
                                Flexible / access facilities may let prepaid amounts reduce interest while remaining
                                withdrawable within limits. Deposits can help; withdrawals restore capital and can extend
                                costs. Confirm day-count interest rules, redraw conditions, and fees with your bank.
                            </p>
                        </div>
                    </SboSection>
                </div>
            ) : null}

            {tab === 'scenarios' ? (
                <div className="space-y-6">
                    <SboSection title="Scenario Simulator" subtitle="Layer rate shocks, extras, bonuses, inflation assumptions, and one-off costs.">
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-4">
                                <SboSlider label="Rate change (pp)" value={scenario.rateDeltaPct} min={-3} max={4} step={0.25} display={`${scenario.rateDeltaPct > 0 ? '+' : ''}${scenario.rateDeltaPct}`} onChange={(n) => setScenario((s) => ({ ...s, rateDeltaPct: n }))} />
                                <SboSlider label="Extra monthly add-on" value={scenario.extraMonthly} min={0} max={15000} step={100} display={formatZar(scenario.extraMonthly)} onChange={(n) => setScenario((s) => ({ ...s, extraMonthly: n }))} />
                                <SboSlider label="Annual bonus / lump" value={scenario.annualBonus + scenario.lumpSum} min={0} max={250000} step={1000} display={formatZar(scenario.annualBonus + scenario.lumpSum)} onChange={(n) => setScenario((s) => ({ ...s, annualBonus: n, lumpSum: 0 }))} />
                                <SboSlider label="Appreciation %" value={scenario.appreciationPct} min={0} max={12} step={0.1} display={formatPct(scenario.appreciationPct, 1)} onChange={(n) => setScenario((s) => ({ ...s, appreciationPct: n }))} />
                                <SboSlider label="Unexpected expense added to balance" value={scenario.unexpectedExpense} min={0} max={200000} step={1000} display={formatZar(scenario.unexpectedExpense)} onChange={(n) => setScenario((s) => ({ ...s, unexpectedExpense: n }))} />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <SboKpi label="Scenario rate" value={formatPct(scenarioProfile.annualInterestRate, 2)} icon={Percent} />
                                <SboKpi label="Scenario repayment" value={formatZar(scenarioProfile.monthlyRepayment)} icon={Wallet} />
                                <SboKpi label="Term (est.)" value={formatMonthsAsYears(scenarioCmp.optimized.monthsToSettle)} icon={CalendarClock} />
                                <SboKpi label="Interest (est.)" value={formatZar(scenarioCmp.optimized.totalInterest)} icon={Activity} />
                                <SboKpi label="Interest vs baseline" value={formatZar(comparison.baseline.totalInterest - scenarioCmp.optimized.totalInterest)} icon={Sparkles} tone="good" />
                                <SboKpi label="Months vs baseline" value={formatMonthsAsYears(comparison.baseline.monthsToSettle - scenarioCmp.optimized.monthsToSettle)} icon={LineChartIcon} />
                            </div>
                        </div>
                    </SboSection>
                </div>
            ) : null}

            {tab === 'goals' ? (
                <div className="space-y-6">
                    <SboSection title="Goal Planner" subtitle="Personalised educational roadmap from your objective.">
                        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                            <div className="space-y-3">
                                {GOAL_OPTIONS.map((g) => (
                                    <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => setGoal(g.id)}
                                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                                            goal === g.id
                                                ? 'border-gold bg-gold/5 font-semibold text-charcoal'
                                                : 'border-charcoal/[0.08] text-charcoal/70 hover:bg-[#F8FAFC]'
                                        }`}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                            <SboNumberField label="Target horizon (years)" value={goalYears} min={1} onChange={setGoalYears} />
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <SboKpi label="Suggested extra (est.)" value={formatZar(goalRoadmap.needExtra)} icon={PiggyBank} />
                            <SboKpi label="Payoff horizon (est.)" value={formatMonthsAsYears(goalRoadmap.months)} icon={Target} />
                            <SboKpi label="Interest saved vs baseline (est.)" value={formatZar(goalRoadmap.interestSaved)} icon={Sparkles} tone="good" />
                        </div>
                        <ol className="mt-5 space-y-3">
                            {goalRoadmap.milestones.map((m) => (
                                <li key={m.t} className="rounded-xl border border-charcoal/[0.08] px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gold">{m.t}</p>
                                    <p className="mt-1 text-sm text-charcoal/70">{m.d}</p>
                                </li>
                            ))}
                        </ol>
                    </SboSection>
                </div>
            ) : null}

            {tab === 'knowledge' ? (
                <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                    <div className="space-y-2">
                        {KNOWLEDGE_ARTICLES.map((a) => (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => setKnowledgeId(a.id)}
                                className={`w-full rounded-xl border px-3 py-3 text-left text-sm ${
                                    knowledgeId === a.id
                                        ? 'border-gold bg-gold/5 font-semibold'
                                        : 'border-charcoal/[0.08] hover:bg-[#F8FAFC]'
                                }`}
                            >
                                <p className="text-[10px] uppercase tracking-wide text-charcoal/45">{a.category}</p>
                                <p className="text-charcoal">{a.title}</p>
                            </button>
                        ))}
                    </div>
                    <SboSection
                        title={KNOWLEDGE_ARTICLES.find((a) => a.id === knowledgeId)?.title || 'Knowledge'}
                        subtitle={KNOWLEDGE_ARTICLES.find((a) => a.id === knowledgeId)?.summary}
                    >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-charcoal/70">
                            {KNOWLEDGE_ARTICLES.find((a) => a.id === knowledgeId)?.body}
                        </p>
                        {KNOWLEDGE_ARTICLES.find((a) => a.id === knowledgeId)?.faqs?.map((f) => (
                            <div key={f.q} className="mt-4 rounded-xl bg-[#F8FAFC] p-4">
                                <p className="text-sm font-semibold text-charcoal">{f.q}</p>
                                <p className="mt-1 text-sm text-charcoal/65">{f.a}</p>
                            </div>
                        ))}
                    </SboSection>
                </div>
            ) : null}

            {tab === 'calculators' ? (
                <div className="space-y-6">
                    <SboSection title="Advanced calculators" subtitle="Bond, deposit, transfer costs, rent vs buy, and more — all estimates.">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <SboNumberField label="Purchase price" value={calcPurchase} onChange={setCalcPurchase} />
                            <SboNumberField label="Deposit" value={calcDeposit} onChange={setCalcDeposit} />
                            <SboNumberField label="Rate %" value={calcRate} step={0.05} onChange={setCalcRate} />
                            <SboNumberField label="Term (years)" value={calcTerm} onChange={setCalcTerm} />
                            <SboNumberField label="Comparable rent / mo" value={calcRent} onChange={setCalcRent} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <SboKpi
                                label="Bond repayment"
                                value={formatZar(
                                    monthlyPayment(Math.max(0, calcPurchase - calcDeposit), calcRate, calcTerm * 12)
                                )}
                                icon={Calculator}
                            />
                            <SboKpi label="Loan amount" value={formatZar(Math.max(0, calcPurchase - calcDeposit))} icon={Landmark} />
                            <SboKpi label="Deposit %" value={formatPct(calcPurchase ? (calcDeposit / calcPurchase) * 100 : 0, 1)} icon={Percent} />
                            <SboKpi label="Transfer costs (rough)" value={formatZar(transferEst.total)} icon={BookOpen} hint="Educational approximation" />
                            <SboKpi label="10y rent paid (est.)" value={formatZar(rentBuy.rentTotal)} icon={Home} />
                            <SboKpi label="10y buy equity (est.)" value={formatZar(rentBuy.buyEquity)} icon={TrendingUp} />
                            <SboKpi label="Transfer duty (rough)" value={formatZar(transferEst.transferDuty)} icon={Banknote} />
                            <SboKpi label="Bond registration (rough)" value={formatZar(transferEst.bondRegistration)} icon={Building2} />
                        </div>
                    </SboSection>
                </div>
            ) : null}
        </div>
    );
}
