'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
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
    CalendarClock,
    Download,
    FileText,
    Gauge,
    Home,
    Landmark,
    LayoutGrid,
    Percent,
    PiggyBank,
    Plus,
    Printer,
    RefreshCw,
    Rocket,
    Sparkles,
    SlidersHorizontal,
    Target,
    Trash2,
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
    portfolioSummary,
    projectEquitySeries,
    RATE_HISTORY_ILLUSTRATIVE,
    rateShockPayment,
    refinanceAnalysis,
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
    AIInsightCard,
    ChartContainer,
    ComparisonCard,
    DisclaimerBanner,
    FinancialInput,
    MetricCard,
    Panel,
    ProgressRing,
    SectionIntro,
    SmartSlider,
    StickyActionBar,
    TabPill,
    formatChipZar,
} from '@/components/smart-bond/sbo-ui';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';
import PortalHero, { PORTAL_HERO_SECONDARY_BTN } from '@/components/PortalHero';

const TABS: Array<{ id: SboTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'optimizer', label: 'Optimizer', icon: SlidersHorizontal },
    { id: 'savings', label: 'Interest Savings', icon: PiggyBank },
    { id: 'equity', label: 'Equity Builder', icon: TrendingUp },
    { id: 'investment', label: 'Investment', icon: Building2 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'learn', label: 'Learn', icon: BookOpen },
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

function normalizeTab(t: string): SboTab {
    if (t === 'rates' || t === 'scenarios') return 'savings';
    if (t === 'portfolio' || t === 'refinance' || t === 'calculators') return 'investment';
    if (t === 'knowledge' || t === 'goals') return 'learn';
    if (['overview', 'optimizer', 'savings', 'equity', 'investment', 'reports', 'learn'].includes(t)) {
        return t as SboTab;
    }
    return 'overview';
}

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

    useEffect(() => {
        const s = loadSmartBondState();
        setProfile(withDerivedRepayment(s.profile));
        setScenario(s.scenario);
        setPortfolio(s.portfolio);
        setTab(normalizeTab(s.activeTab));
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
                { t: '6–18 mo', d: 'Build payment consistency and an emergency buffer before aggressive extras.' },
                { t: '18–36 mo', d: 'Track LTV and equity; revisit refinance only if fees and break-even support it.' },
                {
                    t: '36+ mo',
                    d:
                        goal === 'second_property' || goal === 'portfolio_five' || goal === 'passive_income'
                            ? 'Reassess affordability for further property only once buffers and lender criteria allow.'
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

    function updatePortfolioRow(idx: number, patch: Partial<PortfolioProperty>) {
        setPortfolio((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    }

    if (!hydrated) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-52 rounded-[1.5rem] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
                <div className="flex gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="h-10 w-28 shrink-0 rounded-full bg-slate-100" />
                    ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-[1.15rem] bg-white ring-1 ring-slate-900/[0.04]" />
                    ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="h-72 rounded-[1.25rem] bg-white ring-1 ring-slate-900/[0.04]" />
                    <div className="h-72 rounded-[1.25rem] bg-white ring-1 ring-slate-900/[0.04]" />
                </div>
            </div>
        );
    }

    return (
        <div className="pb-28 print:pb-0">
            <div className="space-y-6 print:space-y-4">
                {/* Hero */}
                <PortalHero
                    eyebrow="Flagship · PropReady Intelligence"
                    eyebrowIcon={<Sparkles className="h-3.5 w-3.5 text-gold" />}
                    title="Smart Bond Optimizer"
                    description="A premium South African home-loan workspace that turns your bond into a clear plan — cut estimated interest, accelerate payoff, grow equity, and explore long-term property wealth. Every figure is clearly labelled as fact, estimate, or assumption."
                    actions={
                        <>
                            <button
                                type="button"
                                className={PORTAL_HERO_SECONDARY_BTN}
                                onClick={() => setTab('reports')}
                            >
                                <FileText className="h-4 w-4" />
                                View reports
                            </button>
                            <button
                                type="button"
                                className={PORTAL_PRIMARY_BTN}
                                onClick={() => setTab('optimizer')}
                            >
                                <Rocket className="h-4 w-4" />
                                Optimise my bond
                            </button>
                        </>
                    }
                    stats={[
                        {
                            label: 'Est. interest saved',
                            value: formatZar(comparison.interestSaved),
                            tone: 'success',
                        },
                        {
                            label: 'Wealth score',
                            value: (
                                <>
                                    {wealth.score}{' '}
                                    <span className="text-sm font-normal text-white/50">/ 100</span>
                                </>
                            ),
                        },
                        {
                            label: 'Est. settlement',
                            value: formatDate(settlement),
                        },
                    ]}
                />

                <DisclaimerBanner>{DISCLAIMER}</DisclaimerBanner>

                {/* Sticky tab nav */}
                <div className="sticky top-0 z-30 -mx-1 bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/95 to-transparent px-1 py-2 print:hidden">
                    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
                        {TABS.map((t) => (
                            <TabPill key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                                <span className="flex items-center gap-1.5">
                                    <t.icon className="h-3.5 w-3.5" />
                                    {t.label}
                                </span>
                            </TabPill>
                        ))}
                    </div>
                </div>

                {tab === 'overview' ? (
                    <div className="space-y-6">
                        <SectionIntro
                            eyebrow="Your bond, at a glance"
                            title="Overview dashboard"
                            body="A working snapshot of your property, bond, and progress — built from the figures you enter. Update anything below and every score, chart, and insight recalculates instantly. Figures are illustrative until you save a real plan."
                        />

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard label="Property value" value={formatZar(liveProfile.propertyValue)} icon={Home} tone="brand" />
                            <MetricCard label="Outstanding bond" value={formatZar(liveProfile.outstandingBalance)} icon={Landmark} />
                            <MetricCard label="Monthly repayment" value={formatZar(liveProfile.monthlyRepayment)} icon={Wallet} />
                            <MetricCard label="Extra monthly" value={formatZar(liveProfile.extraMonthly)} icon={PiggyBank} tone="good" trend="Planned" trendPositive />
                            <MetricCard label="Interest rate" value={`${formatPct(liveProfile.annualInterestRate, 2)} · ${liveProfile.interestType}`} icon={Percent} tone="info" />
                            <MetricCard label="Remaining term" value={formatMonthsAsYears(liveProfile.remainingTermMonths)} icon={CalendarClock} />
                            <MetricCard label="Estimated equity" value={formatZar(equity)} icon={TrendingUp} tone="good" />
                            <MetricCard
                                label="Loan-to-value"
                                value={formatPct(ltv, 1)}
                                icon={Gauge}
                                tone={ltv > 90 ? 'danger' : ltv > 80 ? 'warn' : 'good'}
                                hint="Balance vs property value"
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,260px)_1fr]">
                            <ProgressRing score={wealth.score} label="Wealth Score" sub={wealth.label} />
                            <ProgressRing score={health.score} label="Bond Health" sub={health.label} color="#0D9488" />
                            <Panel>
                                <h3 className="text-base font-semibold text-slate-900">Score drivers</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Proprietary educational scores — not credit scores or bank ratings.
                                </p>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {[...wealth.factors, ...health.factors].slice(0, 6).map((f) => (
                                        <div key={f.key + f.label} className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-900/[0.04]">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-slate-800">{f.label}</span>
                                                <span className="tabular-nums text-slate-500">{Math.round(f.score)}</span>
                                            </div>
                                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className="h-full rounded-full bg-gold transition-all"
                                                    style={{ width: `${Math.min(100, f.score)}%` }}
                                                />
                                            </div>
                                            <p className="mt-1.5 text-[11px] text-slate-500">{f.note}</p>
                                        </div>
                                    ))}
                                </div>
                            </Panel>
                        </div>

                        <Panel>
                            <h3 className="text-base font-semibold text-slate-900">AI Financial Coach</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Plain-language explanations tagged as fact, estimate, assumption, or opportunity.
                            </p>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {insights.map((ins) => (
                                    <AIInsightCard
                                        key={ins.id}
                                        kind={ins.kind}
                                        title={ins.title}
                                        body={ins.body}
                                        actionLabel={ins.kind === 'opportunity' ? 'Open Optimizer' : undefined}
                                        onAction={ins.kind === 'opportunity' ? () => setTab('optimizer') : undefined}
                                    />
                                ))}
                            </div>
                        </Panel>

                        <ComparisonCard
                            leftTitle="Current schedule (no extras)"
                            rightTitle="Optimised with your extras"
                            leftValue={formatMonthsAsYears(comparison.baseline.monthsToSettle)}
                            rightValue={formatMonthsAsYears(comparison.optimized.monthsToSettle)}
                            highlight={`Est. ${formatMonthsAsYears(comparison.monthsSaved)} faster and ${formatZar(comparison.interestSaved)} less interest.`}
                            footnote="Assumes a constant rate and uninterrupted payments — a planning estimate, not a guarantee."
                        />

                        <div className="grid gap-4 lg:grid-cols-2">
                            <ChartContainer title="Principal vs interest" subtitle="Yearly view of the optimised path (estimate).">
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
                            </ChartContainer>
                            <ChartContainer title="Equity trajectory" subtitle="Assumes your appreciation % — property values can fall.">
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
                            </ChartContainer>
                        </div>

                        <Panel>
                            <SectionIntro
                                eyebrow="Autosaved locally"
                                title="Your bond profile"
                                body="Keep these figures current for accurate estimates across every tab. Nothing is sent anywhere — it's saved in your browser only."
                            />
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <FinancialInput label="Property value" value={liveProfile.propertyValue} onChange={(n) => patchProfile({ propertyValue: n })} step={10000} />
                                <FinancialInput label="Outstanding balance" value={liveProfile.outstandingBalance} onChange={(n) => patchProfile({ outstandingBalance: n, monthlyRepayment: 0 })} step={10000} />
                                <FinancialInput label="Original loan amount" value={liveProfile.originalLoanAmount} onChange={(n) => patchProfile({ originalLoanAmount: n })} step={10000} />
                                <FinancialInput label="Monthly income" value={liveProfile.monthlyIncome} onChange={(n) => patchProfile({ monthlyIncome: n })} step={500} />
                                <FinancialInput label="Monthly expenses" value={liveProfile.monthlyExpenses} onChange={(n) => patchProfile({ monthlyExpenses: n })} step={500} />
                                <FinancialInput
                                    label="Appreciation assumption"
                                    value={liveProfile.annualAppreciationPct}
                                    onChange={(n) => patchProfile({ annualAppreciationPct: n })}
                                    currency={false}
                                    step={0.1}
                                    suffix="% p.a."
                                    hint="Assumption — not a forecast"
                                />
                                <label className="block space-y-1.5">
                                    <span className="text-sm font-medium text-slate-700">Interest type</span>
                                    <select
                                        className="h-11 w-full rounded-2xl bg-white px-3 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-900/[0.08] focus:outline-none focus:ring-2 focus:ring-gold/30"
                                        value={liveProfile.interestType}
                                        onChange={(e) => patchProfile({ interestType: e.target.value as BondProfile['interestType'] })}
                                    >
                                        <option value="variable">Variable (prime-linked)</option>
                                        <option value="fixed">Fixed (for a period)</option>
                                    </select>
                                </label>
                            </div>
                        </Panel>
                    </div>
                ) : null}

                {tab === 'optimizer' ? (
                    <div className="space-y-6">
                        <SectionIntro
                            eyebrow="Why extras matter"
                            title="Small extras, big impact"
                            body="Every rand you add above your scheduled instalment goes straight toward capital — because interest is charged on the reducing balance, extras compound into shorter terms and lower lifetime interest in a standard amortising model."
                            example="On a R1.2m bond at 11.75%, an extra R1,000/month can save years off the term and a meaningful amount in total interest — try the sliders below to see your own numbers."
                        />

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                                <SmartSlider
                                    label="Extra monthly repayment"
                                    value={liveProfile.extraMonthly}
                                    min={0}
                                    max={20000}
                                    step={100}
                                    display={formatZar(liveProfile.extraMonthly)}
                                    onChange={(n) => patchProfile({ extraMonthly: n })}
                                    why="Paid on top of your instalment every month — reduces capital sooner."
                                    tooltip="Extra monthly amounts go straight to principal, cutting the interest charged in future months."
                                    chips={[500, 1000, 2500, 5000].map((v) => ({
                                        label: formatChipZar(v),
                                        value: liveProfile.extraMonthly + v,
                                    }))}
                                />
                                <SmartSlider
                                    label="Annual lump sum"
                                    value={liveProfile.annualLumpSum}
                                    min={0}
                                    max={200000}
                                    step={1000}
                                    display={formatZar(liveProfile.annualLumpSum)}
                                    onChange={(n) => patchProfile({ annualLumpSum: n })}
                                    why="A yearly bonus, 13th cheque, or tax refund applied to capital each December."
                                />
                                <SmartSlider
                                    label="Interest rate"
                                    value={liveProfile.annualInterestRate}
                                    min={6}
                                    max={16}
                                    step={0.05}
                                    display={formatPct(liveProfile.annualInterestRate, 2)}
                                    onChange={(n) => patchProfile({ annualInterestRate: n, monthlyRepayment: 0 })}
                                    why="Match this to your latest bank statement for the most accurate projection."
                                />
                                <SmartSlider
                                    label="Remaining term"
                                    value={liveProfile.remainingTermMonths}
                                    min={12}
                                    max={360}
                                    step={1}
                                    display={formatMonthsAsYears(liveProfile.remainingTermMonths)}
                                    onChange={(n) => patchProfile({ remainingTermMonths: n, monthlyRepayment: 0 })}
                                    why="Months left on your current agreement, per your latest statement."
                                />
                                <SmartSlider
                                    label="Appreciation assumption"
                                    value={liveProfile.annualAppreciationPct}
                                    min={0}
                                    max={12}
                                    step={0.1}
                                    display={formatPct(liveProfile.annualAppreciationPct, 1)}
                                    onChange={(n) => patchProfile({ annualAppreciationPct: n })}
                                    why="Used only for the equity chart — property values can also fall."
                                />
                            </div>
                            <div className="space-y-4">
                                <ComparisonCard
                                    leftTitle="Baseline total interest"
                                    rightTitle="Optimised total interest"
                                    leftValue={formatZar(comparison.baseline.totalInterest)}
                                    rightValue={formatZar(comparison.optimized.totalInterest)}
                                    highlight={`Estimated saving: ${formatZar(comparison.interestSaved)}`}
                                    footnote="Estimate based on a standard amortising model with your extras applied."
                                />
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <MetricCard label="Years saved (est.)" value={formatMonthsAsYears(comparison.monthsSaved)} icon={Sparkles} tone="good" />
                                    <MetricCard label="New settlement (est.)" value={formatDate(settlement)} icon={CalendarClock} tone="brand" />
                                    <MetricCard label="Total extras paid (est.)" value={formatZar(comparison.optimized.totalExtra)} icon={Wallet} />
                                    <MetricCard label="Optimised repayment path" value={formatZar(liveProfile.monthlyRepayment)} icon={Activity} hint="Scheduled instalment, excl. extras" />
                                </div>
                            </div>
                        </div>

                        <Panel>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">Amortisation schedule</h3>
                                    <p className="mt-1 text-xs text-slate-500">Monthly, quarterly, or yearly aggregation of your optimised path.</p>
                                </div>
                                <div className="flex gap-2">
                                    {(['monthly', 'quarterly', 'yearly'] as AmortisationView[]).map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setAmortView(v)}
                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                                                amortView === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="max-h-96 overflow-auto rounded-xl ring-1 ring-slate-900/[0.05]">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                                        <tr>
                                            <th className="py-2 pl-4 pr-4">Period</th>
                                            <th className="py-2 pr-4">Payment</th>
                                            <th className="py-2 pr-4">Principal</th>
                                            <th className="py-2 pr-4">Interest</th>
                                            <th className="py-2 pr-4">Extra</th>
                                            <th className="py-2 pr-4">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {amortTable.map((r) => (
                                            <tr key={r.label} className="border-t border-slate-100">
                                                <td className="py-2 pl-4 pr-4 font-medium text-slate-700">{r.label}</td>
                                                <td className="py-2 pr-4 tabular-nums text-slate-600">{formatZar(r.payment)}</td>
                                                <td className="py-2 pr-4 tabular-nums text-slate-600">{formatZar(r.principal)}</td>
                                                <td className="py-2 pr-4 tabular-nums text-slate-600">{formatZar(r.interest)}</td>
                                                <td className="py-2 pr-4 tabular-nums text-slate-600">{formatZar(r.extra)}</td>
                                                <td className="py-2 pr-4 tabular-nums text-slate-600">{formatZar(r.balance)}</td>
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
                        </Panel>
                    </div>
                ) : null}

                {tab === 'savings' ? (
                    <div className="space-y-6">
                        <SectionIntro
                            eyebrow="Interest savings centre"
                            title="Fixed vs Variable — and rate risk"
                            body="Balanced education for the South African market. Neither structure is universally better — the right choice depends on your buffers, risk tolerance, and how long you plan to keep the loan."
                        />

                        <div className="grid gap-4 lg:grid-cols-2">
                            <ComparisonCard
                                leftTitle="Variable (often prime-linked)"
                                rightTitle="Fixed (for a defined period)"
                                leftValue="Moves with prime"
                                rightValue="Payment certainty"
                                highlight="Confirm break costs, reversion terms, and margin with your lender before switching."
                                footnote="Fixed-rate loans usually revert to variable once the fixed period ends."
                            />
                            <ComparisonCard
                                leftTitle="Illustrative repo rate"
                                rightTitle="Illustrative prime rate"
                                leftValue={formatPct(SA_REPO_REFERENCE, 2)}
                                rightValue={formatPct(SA_PRIME_REFERENCE, 2)}
                                footnote="Educational reference only — verify current SARB / bank publications."
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <ChartContainer title="Rate shock on your instalment" subtitle="Estimated repayment if your rate moves by the shock shown.">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={shockData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="shock" />
                                        <YAxis tickFormatter={(v) => `R${Math.round(v / 1000)}k`} />
                                        <Tooltip formatter={(v: number) => formatZar(v)} />
                                        <Bar dataKey="repayment" fill={CHART_GOLD} radius={[8, 8, 0, 0]} name="Est. repayment" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <ChartContainer title="Illustrative repo & prime path" subtitle="Simplified educational series — verify official SARB / bank publications.">
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
                            </ChartContainer>
                        </div>

                        <Panel>
                            <SectionIntro
                                title="Scenario stress test"
                                body="Layer a rate shock, extra repayments, a bonus, appreciation, or an unexpected expense to see how resilient your plan is."
                            />
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-4">
                                    <SmartSlider
                                        label="Rate change"
                                        value={scenario.rateDeltaPct}
                                        min={-3}
                                        max={4}
                                        step={0.25}
                                        display={`${scenario.rateDeltaPct > 0 ? '+' : ''}${scenario.rateDeltaPct} pp`}
                                        onChange={(n) => setScenario((s) => ({ ...s, rateDeltaPct: n }))}
                                    />
                                    <SmartSlider
                                        label="Extra monthly add-on"
                                        value={scenario.extraMonthly}
                                        min={0}
                                        max={15000}
                                        step={100}
                                        display={formatZar(scenario.extraMonthly)}
                                        onChange={(n) => setScenario((s) => ({ ...s, extraMonthly: n }))}
                                    />
                                    <SmartSlider
                                        label="Annual bonus / lump sum"
                                        value={scenario.annualBonus + scenario.lumpSum}
                                        min={0}
                                        max={250000}
                                        step={1000}
                                        display={formatZar(scenario.annualBonus + scenario.lumpSum)}
                                        onChange={(n) => setScenario((s) => ({ ...s, annualBonus: n, lumpSum: 0 }))}
                                    />
                                    <SmartSlider
                                        label="Unexpected expense added to balance"
                                        value={scenario.unexpectedExpense}
                                        min={0}
                                        max={200000}
                                        step={1000}
                                        display={formatZar(scenario.unexpectedExpense)}
                                        onChange={(n) => setScenario((s) => ({ ...s, unexpectedExpense: n }))}
                                    />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <MetricCard label="Scenario rate" value={formatPct(scenarioProfile.annualInterestRate, 2)} icon={Percent} tone="info" />
                                    <MetricCard label="Scenario repayment" value={formatZar(scenarioProfile.monthlyRepayment)} icon={Wallet} />
                                    <MetricCard label="Term (est.)" value={formatMonthsAsYears(scenarioCmp.optimized.monthsToSettle)} icon={CalendarClock} />
                                    <MetricCard label="Interest (est.)" value={formatZar(scenarioCmp.optimized.totalInterest)} icon={Activity} />
                                    <MetricCard
                                        label="Interest vs baseline"
                                        value={formatZar(comparison.baseline.totalInterest - scenarioCmp.optimized.totalInterest)}
                                        icon={Sparkles}
                                        tone={comparison.baseline.totalInterest - scenarioCmp.optimized.totalInterest >= 0 ? 'good' : 'danger'}
                                    />
                                    <MetricCard
                                        label="Months vs baseline"
                                        value={formatMonthsAsYears(Math.abs(comparison.baseline.monthsToSettle - scenarioCmp.optimized.monthsToSettle))}
                                        icon={Gauge}
                                    />
                                </div>
                            </div>
                        </Panel>
                    </div>
                ) : null}

                {tab === 'equity' ? (
                    <div className="space-y-6">
                        <SectionIntro
                            eyebrow="Equity & wealth roadmap"
                            title="Build equity, track LTV"
                            body="Equity grows as you repay capital and (if it occurs) as property values rise. Loan-to-value (LTV) tells lenders how much cushion exists between your bond and your home's worth."
                        />

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard label="Estimated equity" value={formatZar(equity)} icon={TrendingUp} tone="good" />
                            <MetricCard label="Loan-to-value" value={formatPct(ltv, 1)} icon={Gauge} tone={ltv > 90 ? 'danger' : ltv > 80 ? 'warn' : 'good'} />
                            <MetricCard label="Property value" value={formatZar(liveProfile.propertyValue)} icon={Home} />
                            <MetricCard label="Bond balance" value={formatZar(liveProfile.outstandingBalance)} icon={Landmark} />
                        </div>

                        <ChartContainer title="Equity growth chart" subtitle="Combines your repayment schedule with your appreciation assumption." height="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={equitySeries}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="year" />
                                    <YAxis tickFormatter={(v) => `R${Math.round(v / 1000)}k`} />
                                    <Tooltip formatter={(v: number) => formatZar(v)} />
                                    <Area type="monotone" dataKey="equity" stroke={CHART_TEAL} fill={CHART_TEAL} fillOpacity={0.3} name="Equity" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <Panel>
                            <SectionIntro
                                title="Your wealth roadmap"
                                body="Pick a goal to see a suggested extra repayment and a staged, educational timeline toward it."
                            />
                            <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {GOAL_OPTIONS.map((g) => (
                                        <button
                                            key={g.id}
                                            type="button"
                                            onClick={() => setGoal(g.id)}
                                            className={`rounded-xl px-4 py-3 text-left text-sm transition ${
                                                goal === g.id
                                                    ? 'bg-gold/10 font-semibold text-slate-900 ring-1 ring-gold/30'
                                                    : 'text-slate-600 ring-1 ring-slate-900/[0.06] hover:bg-slate-50'
                                            }`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                                <FinancialInput
                                    label="Target horizon"
                                    value={goalYears}
                                    onChange={setGoalYears}
                                    currency={false}
                                    min={1}
                                    step={1}
                                    suffix="years"
                                />
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <MetricCard label="Suggested extra (est.)" value={formatZar(goalRoadmap.needExtra)} icon={PiggyBank} tone="good" />
                                <MetricCard label="Payoff horizon (est.)" value={formatMonthsAsYears(goalRoadmap.months)} icon={Target} />
                                <MetricCard label="Interest saved vs baseline (est.)" value={formatZar(goalRoadmap.interestSaved)} icon={Sparkles} tone="good" />
                            </div>
                            <div className="mt-6 space-y-0">
                                {goalRoadmap.milestones.map((m, i) => (
                                    <div key={m.t} className="relative flex gap-4 pb-6 last:pb-0">
                                        <div className="flex flex-col items-center">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-white">
                                                {i + 1}
                                            </div>
                                            {i < goalRoadmap.milestones.length - 1 ? (
                                                <div className="mt-1 w-px flex-1 bg-slate-200" />
                                            ) : null}
                                        </div>
                                        <div className="flex-1 rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-900/[0.04]">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gold">{m.t}</p>
                                            <p className="mt-1 text-sm text-slate-600">{m.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    </div>
                ) : null}

                {tab === 'investment' ? (
                    <div className="space-y-6">
                        <SectionIntro
                            eyebrow="Investment planner"
                            title="Plan your next property"
                            body="Model affordability, yield, and cash flow for a further purchase. These are planning estimates only — not an approval or recommendation to buy."
                        />

                        <Panel>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <FinancialInput label="Monthly income" value={invest.monthlyIncome} onChange={(n) => setInvest((p) => ({ ...p, monthlyIncome: n }))} step={500} />
                                <FinancialInput label="Monthly expenses" value={invest.monthlyExpenses} onChange={(n) => setInvest((p) => ({ ...p, monthlyExpenses: n }))} step={500} />
                                <FinancialInput label="Existing bond repayment" value={invest.existingBondRepayment} onChange={(n) => setInvest((p) => ({ ...p, existingBondRepayment: n }))} step={500} />
                                <FinancialInput label="Expected rent" value={invest.rentalIncome} onChange={(n) => setInvest((p) => ({ ...p, rentalIncome: n }))} step={500} />
                                <FinancialInput label="Savings available" value={invest.savings} onChange={(n) => setInvest((p) => ({ ...p, savings: n }))} step={5000} />
                                <FinancialInput label="Deposit" value={invest.depositAmount} onChange={(n) => setInvest((p) => ({ ...p, depositAmount: n }))} step={5000} />
                                <FinancialInput label="Target price" value={invest.targetPrice} onChange={(n) => setInvest((p) => ({ ...p, targetPrice: n }))} step={10000} />
                                <FinancialInput label="Maintenance / mo" value={invest.maintenanceMonthly} onChange={(n) => setInvest((p) => ({ ...p, maintenanceMonthly: n }))} step={100} />
                                <FinancialInput label="Insurance / mo" value={invest.insuranceMonthly} onChange={(n) => setInvest((p) => ({ ...p, insuranceMonthly: n }))} step={100} />
                                <FinancialInput label="Rates & levies / mo" value={invest.ratesMonthly} onChange={(n) => setInvest((p) => ({ ...p, ratesMonthly: n }))} step={100} />
                                <FinancialInput
                                    label="Vacancy"
                                    value={invest.vacancyMonthsPerYear}
                                    onChange={(n) => setInvest((p) => ({ ...p, vacancyMonthsPerYear: n }))}
                                    currency={false}
                                    step={1}
                                    suffix="mo / yr"
                                />
                                <FinancialInput
                                    label="Interest rate"
                                    value={invest.interestRate}
                                    onChange={(n) => setInvest((p) => ({ ...p, interestRate: n }))}
                                    currency={false}
                                    step={0.05}
                                    suffix="% p.a."
                                />
                                <FinancialInput
                                    label="Loan term"
                                    value={invest.loanTermYears}
                                    onChange={(n) => setInvest((p) => ({ ...p, loanTermYears: n }))}
                                    currency={false}
                                    step={1}
                                    suffix="years"
                                />
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <MetricCard label="Loan needed (est.)" value={formatZar(investResult.loanNeeded)} icon={Landmark} />
                                <MetricCard label="Repayment (est.)" value={formatZar(investResult.repayment)} icon={Wallet} />
                                <MetricCard label="Cash flow (est.)" value={formatZar(investResult.cashFlow)} icon={Activity} tone={investResult.cashFlow >= 0 ? 'good' : 'warn'} />
                                <MetricCard label="DTI (est.)" value={formatPct(investResult.dti, 1)} icon={Gauge} tone={investResult.dti > 30 ? 'warn' : 'neutral'} />
                                <MetricCard label="Gross yield (est.)" value={formatPct(investResult.grossYield, 1)} icon={Percent} tone="info" />
                                <MetricCard label="Net yield (est.)" value={formatPct(investResult.netYield, 1)} icon={Percent} tone="info" />
                                <MetricCard label="LTV (est.)" value={formatPct(investResult.ltv, 1)} icon={Home} />
                                <MetricCard
                                    label="Time to deposit (est.)"
                                    value={investResult.monthsToDeposit == null ? '—' : formatMonthsAsYears(investResult.monthsToDeposit)}
                                    icon={CalendarClock}
                                />
                            </div>
                            <p className="mt-4 text-sm text-slate-500">{investResult.affordabilityNote}</p>
                        </Panel>

                        <Panel>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">Portfolio (simplified)</h3>
                                    <p className="mt-1 text-xs text-slate-500">A lightweight view of your combined property holdings.</p>
                                </div>
                                <ProgressRing score={portScore.score} label="Investment Score" sub={portScore.label} color="#0D9488" />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <MetricCard label="Portfolio value" value={formatZar(portSummary.totalValue)} icon={Building2} />
                                <MetricCard label="Combined equity" value={formatZar(portSummary.equity)} icon={TrendingUp} tone="good" />
                                <MetricCard label="Monthly rent" value={formatZar(portSummary.rent)} icon={Banknote} />
                                <MetricCard label="Cash flow (est.)" value={formatZar(portSummary.cashFlow)} icon={Activity} tone={portSummary.cashFlow >= 0 ? 'good' : 'warn'} />
                            </div>
                            <div className="mt-4 space-y-3">
                                {portfolio.map((p, idx) => (
                                    <div key={p.id} className="grid gap-2 rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-900/[0.04] sm:grid-cols-6 sm:items-center">
                                        <input
                                            className="h-9 rounded-lg border border-slate-200 px-2 text-sm sm:col-span-2"
                                            value={p.name}
                                            onChange={(e) => updatePortfolioRow(idx, { name: e.target.value })}
                                        />
                                        <select
                                            className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
                                            value={p.kind}
                                            onChange={(e) => updatePortfolioRow(idx, { kind: e.target.value as PortfolioProperty['kind'] })}
                                        >
                                            <option value="residential">Residential</option>
                                            <option value="rental">Rental</option>
                                            <option value="holiday">Holiday</option>
                                            <option value="commercial">Commercial</option>
                                        </select>
                                        <input
                                            type="number"
                                            className="h-9 rounded-lg border border-slate-200 px-2 text-sm tabular-nums"
                                            value={p.value}
                                            onChange={(e) => updatePortfolioRow(idx, { value: Number(e.target.value) || 0 })}
                                            aria-label="Value"
                                        />
                                        <input
                                            type="number"
                                            className="h-9 rounded-lg border border-slate-200 px-2 text-sm tabular-nums"
                                            value={p.loanBalance}
                                            onChange={(e) => updatePortfolioRow(idx, { loanBalance: Number(e.target.value) || 0 })}
                                            aria-label="Loan balance"
                                        />
                                        <button
                                            type="button"
                                            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg text-sm font-medium text-gold hover:bg-gold/5"
                                            onClick={() => setPortfolio((rows) => rows.filter((_, i) => i !== idx))}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Remove
                                        </button>
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
                                    <Plus className="h-4 w-4" /> Add property
                                </button>
                            </div>
                        </Panel>

                        <Panel>
                            <h3 className="text-base font-semibold text-slate-900">Refinance mini-planner</h3>
                            <p className="mt-1 text-xs text-slate-500">Compare your current loan against a hypothetical refinance — include fees for a fair estimate.</p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                <FinancialInput label="New rate" value={refiRate} onChange={setRefiRate} currency={false} step={0.05} suffix="%" />
                                <FinancialInput label="New term" value={refiTerm} onChange={setRefiTerm} currency={false} step={12} suffix="months" />
                                <FinancialInput label="Fees" value={refiFees} onChange={setRefiFees} step={500} />
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <MetricCard label="New repayment (est.)" value={formatZar(refi.newPayment)} icon={Wallet} />
                                <MetricCard label="Monthly difference" value={formatZar(refi.monthlySaving)} icon={RefreshCw} tone={refi.monthlySaving > 0 ? 'good' : 'warn'} />
                                <MetricCard label="Interest difference (est.)" value={formatZar(refi.interestSaving)} icon={Percent} />
                                <MetricCard
                                    label="Break-even"
                                    value={Number.isFinite(refi.breakEvenMonths) ? formatMonthsAsYears(refi.breakEvenMonths) : 'N/A'}
                                    icon={CalendarClock}
                                />
                            </div>
                            <p className="mt-3 text-sm text-slate-500">
                                Net long-term saving estimate after fees: {formatZar(refi.netLongTermSaving)}. Extending the term can lower
                                instalments while increasing lifetime interest — weigh both carefully.
                            </p>
                        </Panel>
                    </div>
                ) : null}

                {tab === 'reports' ? (
                    <div className="space-y-6">
                        <SectionIntro
                            eyebrow="Reports centre"
                            title="Export your plan"
                            body="Download a PDF summary or the full CSV amortisation schedule, or print this page for your records."
                        />
                        <Panel>
                            <div className="flex flex-wrap gap-2 print:hidden">
                                <button type="button" className={PORTAL_PRIMARY_BTN} onClick={() => void exportFinancialSummaryPdf(liveProfile)}>
                                    <Download className="h-4 w-4" /> PDF summary
                                </button>
                                <button type="button" className={PORTAL_SECONDARY_BTN} onClick={() => exportAmortisationCsv(comparison.optimized.rows)}>
                                    <Download className="h-4 w-4" /> Excel / CSV schedule
                                </button>
                                <button type="button" className={PORTAL_SECONDARY_BTN} onClick={() => window.print()}>
                                    <Printer className="h-4 w-4" /> Print
                                </button>
                            </div>
                        </Panel>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard label="Property value" value={formatZar(liveProfile.propertyValue)} icon={Home} />
                            <MetricCard label="Outstanding bond" value={formatZar(liveProfile.outstandingBalance)} icon={Landmark} />
                            <MetricCard label="Monthly repayment" value={formatZar(liveProfile.monthlyRepayment)} icon={Wallet} />
                            <MetricCard label="Extra monthly" value={formatZar(liveProfile.extraMonthly)} icon={PiggyBank} tone="good" />
                            <MetricCard label="Estimated equity" value={formatZar(equity)} icon={TrendingUp} tone="good" />
                            <MetricCard label="Loan-to-value" value={formatPct(ltv, 1)} icon={Gauge} tone={ltv > 80 ? 'warn' : 'good'} />
                            <MetricCard label="Est. settlement" value={formatDate(settlement)} icon={Target} />
                            <MetricCard label="Est. interest saved" value={formatZar(comparison.interestSaved)} icon={Sparkles} tone="good" />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <ComparisonCard
                                leftTitle="Baseline total interest"
                                rightTitle="Optimised total interest"
                                leftValue={formatZar(comparison.baseline.totalInterest)}
                                rightValue={formatZar(comparison.optimized.totalInterest)}
                                highlight={`Estimated saving: ${formatZar(comparison.interestSaved)}`}
                            />
                            <ComparisonCard
                                leftTitle="Baseline payoff"
                                rightTitle="Optimised payoff"
                                leftValue={formatMonthsAsYears(comparison.baseline.monthsToSettle)}
                                rightValue={formatMonthsAsYears(comparison.optimized.monthsToSettle)}
                                highlight={`Estimated ${formatMonthsAsYears(comparison.monthsSaved)} faster`}
                                footnote="Figures are educational estimates and depend on rates, fees, and payment consistency."
                            />
                        </div>
                    </div>
                ) : null}

                {tab === 'learn' ? (
                    <div className="space-y-6">
                        <SectionIntro
                            eyebrow="Knowledge centre"
                            title="Learn the fundamentals"
                            body="Clear, balanced explanations of South African home-loan concepts — foundations, rates, strategy, and investment."
                        />
                        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
                            <div className="space-y-2">
                                {KNOWLEDGE_ARTICLES.map((a) => (
                                    <button
                                        key={a.id}
                                        type="button"
                                        onClick={() => setKnowledgeId(a.id)}
                                        className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                                            knowledgeId === a.id
                                                ? 'bg-gold/10 font-semibold text-slate-900 ring-1 ring-gold/30'
                                                : 'text-slate-600 ring-1 ring-slate-900/[0.06] hover:bg-slate-50'
                                        }`}
                                    >
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">{a.category}</p>
                                        <p className="text-slate-900">{a.title}</p>
                                    </button>
                                ))}
                            </div>
                            <Panel>
                                {(() => {
                                    const article = KNOWLEDGE_ARTICLES.find((a) => a.id === knowledgeId);
                                    if (!article) return null;
                                    return (
                                        <>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">{article.category}</p>
                                            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{article.title}</h3>
                                            <p className="mt-2 text-sm text-slate-500">{article.summary}</p>
                                            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{article.body}</p>
                                            {article.faqs?.map((f) => (
                                                <div key={f.q} className="mt-4 rounded-2xl bg-sky-50/70 p-4 ring-1 ring-sky-100">
                                                    <p className="text-sm font-semibold text-sky-900">{f.q}</p>
                                                    <p className="mt-1 text-sm text-sky-900/70">{f.a}</p>
                                                </div>
                                            ))}
                                        </>
                                    );
                                })()}
                            </Panel>
                        </div>
                    </div>
                ) : null}
            </div>

            <StickyActionBar
                summary={`Est. interest saved: ${formatZar(comparison.interestSaved)} · ${formatMonthsAsYears(comparison.monthsSaved)} faster payoff`}
                primaryLabel="Optimise My Bond"
                onPrimary={() => setTab('optimizer')}
                secondaryLabel="Generate Report"
                onSecondary={() => void exportFinancialSummaryPdf(liveProfile)}
            />
        </div>
    );
}
