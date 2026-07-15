'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ArrowUpRight,
    Bell,
    Building2,
    ChevronRight,
    Info,
    Lightbulb,
    MapPin,
    MessageCircle,
    Plus,
    Sparkles,
    TrendingUp,
    X,
} from 'lucide-react';
import {
    AnimatedCounter,
    PvoBadge,
    PvoGlassCard,
    PvoProgressRing,
    PvoSection,
    PvoTabs,
    PvoThemeToggle,
} from './pvo-ui';
import {
    answerCoachQuestion,
    buildCustomImprovement,
    buildOptimizerSnapshot,
    buildSnapshotForLocation,
    buildSuburbInsightsForArea,
    computeSimulatorMetrics,
    formatZAR,
    optimizeBudget,
    resolveAreaProfile,
    type ForecastScenario,
    type ImprovementRecommendation,
    type LocationInput,
    type OptimizerSnapshot,
    type SuburbInsightsData,
} from '@/lib/property-optimizer';
import PvoLocationPanel from './PvoLocationPanel';
import CustomImprovementModal from './CustomImprovementModal';

export default function PropertyValueOptimizerDashboard() {
    const [dark, setDark] = useState(false);
    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<OptimizerSnapshot>(() => buildOptimizerSnapshot());
    const [suburbInsights, setSuburbInsights] = useState<SuburbInsightsData>(() =>
        buildSuburbInsightsForArea(resolveAreaProfile({ suburb: 'Bryanston', province: 'Gauteng' }))
    );
    const [customImprovements, setCustomImprovements] = useState<ImprovementRecommendation[]>([]);
    const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [budget, setBudget] = useState(300_000);
    const [forecastScenario, setForecastScenario] = useState<ForecastScenario>('expected');
    const [comparisonTab, setComparisonTab] = useState<'street' | 'suburb' | 'similar'>('suburb');
    const [hoverBreakdown, setHoverBreakdown] = useState<string | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [coachQuestion, setCoachQuestion] = useState('');
    const [coachHistory, setCoachHistory] = useState<
        { q: string; a: ReturnType<typeof answerCoachQuestion> }[]
    >([]);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(t);
    }, []);

    const allImprovements = useMemo(
        () => [...snapshot.improvements, ...customImprovements],
        [snapshot.improvements, customImprovements]
    );

    const simulator = useMemo(
        () =>
            computeSimulatorMetrics(
                snapshot.property,
                snapshot.market,
                selectedImprovements,
                allImprovements
            ),
        [snapshot, selectedImprovements, allImprovements]
    );

    const budgetPlan = useMemo(
        () => optimizeBudget(budget, allImprovements),
        [budget, allImprovements]
    );

    const handleLocationApply = useCallback((input: LocationInput) => {
        const next = buildSnapshotForLocation(input);
        setSnapshot(next);
        setCustomImprovements([]);
        setSelectedImprovements([]);
        setSuburbInsights(buildSuburbInsightsForArea(resolveAreaProfile(input)));
    }, []);

    const handleAddCustomImprovement = useCallback(
        (description: string, estimatedCost?: number, category?: string) => {
            const imp = buildCustomImprovement(
                { description, estimatedCost, category },
                snapshot.property,
                snapshot.market
            );
            setCustomImprovements((prev) => [...prev, imp]);
            setSelectedImprovements((prev) => [...prev, imp.id]);
        },
        [snapshot.property, snapshot.market]
    );

    const toggleImprovement = useCallback((id: string) => {
        setSelectedImprovements((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }, []);

    const applyBudgetPlan = () => {
        setSelectedImprovements(budgetPlan.selectedImprovementIds);
    };

    const askCoach = () => {
        if (!coachQuestion.trim()) return;
        const response = answerCoachQuestion(coachQuestion, snapshot, allImprovements);
        setCoachHistory((h) => [{ q: coachQuestion, a: response }, ...h].slice(0, 6));
        setCoachQuestion('');
    };

    const forecastData = snapshot.forecasts[forecastScenario];
    const breakdownChart = snapshot.breakdown.filter((b) => b.amount > 0 && b.id !== 'bond');

    const coachPrompts = [
        'Should I renovate?',
        'Should I sell now?',
        'Which renovation has the highest ROI?',
        'Should I install solar?',
        'Should I build a cottage?',
    ];

    if (loading) {
        return (
            <div className={`pvo-dashboard ${dark ? 'dark' : ''} space-y-6`}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="pvo-skeleton h-32 rounded-3xl" />
                ))}
            </div>
        );
    }

    return (
        <div className={`pvo-dashboard ${dark ? 'dark' : ''} relative`}>
            {/* Floating widgets */}
            <div className="hidden xl:block fixed right-6 top-28 z-30 space-y-3 w-52">
                <PvoGlassCard className="p-4 pvo-float-widget" glow>
                    <p className="text-[10px] uppercase tracking-wider pvo-muted mb-1">Live value</p>
                    <p className="text-lg font-bold pvo-heading tabular-nums">
                        {formatZAR(simulator.potentialValue)}
                    </p>
                    <p className="text-xs pvo-muted mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-gold" />
                        +{snapshot.growthSincePurchase}% since purchase
                    </p>
                </PvoGlassCard>
                <PvoGlassCard className="p-4 pvo-float-widget">
                    <p className="text-[10px] uppercase tracking-wider pvo-muted mb-1">AI confidence</p>
                    <p className="text-2xl font-bold text-gold">{snapshot.confidenceScore}%</p>
                </PvoGlassCard>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="pvo-icon-hero">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="pvo-eyebrow text-xs font-semibold uppercase tracking-[0.12em]">
                            Flagship · Property Wealth AI
                        </p>
                        <p className="pvo-muted text-sm">Hybrid valuation engine · Explainable insights</p>
                    </div>
                </div>
                <PvoThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
            </div>

            <PvoLocationPanel
                onApply={handleLocationApply}
                initial={{
                    suburb: snapshot.property.suburb,
                    municipality: snapshot.property.municipality,
                    province: snapshot.property.province,
                    streetAddress: snapshot.property.address.includes(',')
                        ? snapshot.property.address.split(',')[0]
                        : '',
                }}
            />

            {/* Top metrics strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-8 sm:mb-10">
                <MetricTile label="Est. Market Value" value={simulator.potentialValue} format={formatZAR} highlight />
                <MetricTile label="Growth Since Purchase" value={snapshot.growthSincePurchase} suffix="%" />
                <MetricTile label="Confidence Score" value={snapshot.confidenceScore} suffix="%" />
                <MetricTile label="Investment Grade" value={0} text={snapshot.investmentGrade} />
                <MetricTile label="Buyer Demand" value={snapshot.market.buyerDemand} suffix="/100" />
                <MetricTile label="Avg Annual Appreciation" value={snapshot.avgAnnualAppreciation} suffix="%" />
                <MetricTile label="Equity Growth" value={simulator.equity - snapshot.property.purchasePrice + snapshot.property.bondBalance} format={formatZAR} />
                <MetricTile label="Net Worth Contribution" value={snapshot.netWorthContribution} format={formatZAR} />
                <MetricTile label="Market Status" value={0} text={snapshot.marketStatus} />
                <MetricTile label="Last Updated" value={0} text={new Date(snapshot.lastUpdated).toLocaleDateString('en-ZA')} />
            </div>

            {/* Property summary card */}
            <PvoGlassCard className="p-6 sm:p-8 mb-10 overflow-hidden relative" glow>
                <div className="absolute top-0 right-0 w-64 h-64 pvo-gradient-orb opacity-40 pointer-events-none" />
                <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5">
                        <PvoBadge tone="gold">Property Summary</PvoBadge>
                        <h3 className="pvo-heading text-xl sm:text-2xl font-semibold mt-4 flex items-start gap-2">
                            <MapPin className="w-5 h-5 text-gold shrink-0 mt-1" />
                            {snapshot.property.address}
                        </h3>
                        <p className="pvo-muted text-sm mt-2">
                            {snapshot.property.suburb} · {snapshot.property.municipality} ·{' '}
                            {snapshot.property.province}
                        </p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <SummaryField label="Type" value={snapshot.property.propertyType} />
                            <SummaryField label="Year Built" value={String(snapshot.property.yearBuilt)} />
                            <SummaryField label="Bedrooms" value={String(snapshot.property.bedrooms)} />
                            <SummaryField label="Bathrooms" value={String(snapshot.property.bathrooms)} />
                            <SummaryField label="Garages" value={String(snapshot.property.garages)} />
                            <SummaryField label="Land" value={`${snapshot.property.landSizeSqm} m²`} />
                            <SummaryField label="Floor" value={`${snapshot.property.floorSizeSqm} m²`} />
                            <SummaryField label="Municipal Val." value={formatZAR(snapshot.property.municipalValuation)} />
                        </div>
                    </div>
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ValuePanel title="Estimated Market Value" amount={simulator.potentialValue} />
                        <ValuePanel title="Estimated Rental" amount={snapshot.estimatedRentalValue} monthly />
                        <ValuePanel title="Monthly Appreciation" amount={snapshot.monthlyAppreciation} />
                        <ValuePanel title="Annual Appreciation" amount={snapshot.annualAppreciation} />
                        {([1, 3, 5, 10, 20] as const).map((yr) => (
                            <div key={yr} className="pvo-stat-inner p-4 rounded-2xl">
                                <p className="text-[11px] uppercase tracking-wider pvo-muted">{yr}yr forecast</p>
                                <p className="text-lg font-bold pvo-heading tabular-nums mt-1">
                                    <AnimatedCounter value={snapshot.futureValues[yr]} format={formatZAR} />
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </PvoGlassCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
                {/* Valuation breakdown */}
                <PvoSection title="Valuation Breakdown" subtitle="Hover segments for transparent explanations">
                    <PvoGlassCard className="p-6">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={breakdownChart}
                                        dataKey="amount"
                                        nameKey="label"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        onMouseEnter={(_, i) => setHoverBreakdown(breakdownChart[i]?.id ?? null)}
                                        onMouseLeave={() => setHoverBreakdown(null)}
                                    >
                                        {breakdownChart.map((entry) => (
                                            <Cell key={entry.id} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: number) => formatZAR(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar">
                            {snapshot.breakdown.map((item) => (
                                <div
                                    key={item.id}
                                    className={`pvo-breakdown-row p-3 rounded-xl transition-all ${
                                        hoverBreakdown === item.id ? 'pvo-breakdown-active' : ''
                                    }`}
                                    onMouseEnter={() => setHoverBreakdown(item.id)}
                                    onMouseLeave={() => setHoverBreakdown(null)}
                                >
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="text-sm font-medium pvo-heading flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                                            {item.label}
                                        </span>
                                        <span className="text-sm font-bold tabular-nums">{formatZAR(Math.abs(item.amount))}</span>
                                    </div>
                                    {(hoverBreakdown === item.id || item.id === 'equity') && (
                                        <p className="text-xs pvo-muted mt-2 leading-relaxed">{item.explanation}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </PvoGlassCard>
                </PvoSection>

                {/* AI Property Score */}
                <PvoSection title="AI Property Score" subtitle="15 categories with benchmarks and improvement paths">
                    <PvoGlassCard className="p-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                            <PvoProgressRing score={snapshot.overallAiScore} />
                            <div className="text-center sm:text-left">
                                <p className="text-4xl font-bold pvo-heading">{snapshot.overallAiScore}/100</p>
                                <p className="pvo-muted text-sm mt-1">Overall PropReady AI Score</p>
                                <PvoBadge tone="green" >Grade {snapshot.investmentGrade}</PvoBadge>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                            {snapshot.categoryScores.map((cat) => (
                                <div key={cat.id} className="pvo-category-row rounded-xl overflow-hidden">
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-between p-3 text-left"
                                        onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                                    >
                                        <span className="text-sm font-medium pvo-heading">{cat.label}</span>
                                        <span className="flex items-center gap-2">
                                            <span className="text-sm font-bold tabular-nums">{cat.score}</span>
                                            <span className="text-xs pvo-muted">/ {cat.benchmark}</span>
                                            <ChevronRight
                                                className={`w-4 h-4 transition-transform ${expandedCategory === cat.id ? 'rotate-90' : ''}`}
                                            />
                                        </span>
                                    </button>
                                    {expandedCategory === cat.id && (
                                        <div className="px-3 pb-3 text-xs pvo-muted space-y-2 border-t pvo-border pt-2">
                                            <p>{cat.explanation}</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {cat.suggestions.map((s) => (
                                                    <li key={s}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </PvoGlassCard>
                </PvoSection>
            </div>

            {/* Improvement Engine - centrepiece */}
            <PvoSection
                id="improvement-engine"
                title="AI Property Improvement Engine"
                subtitle="Recommendations weighted by location, demand, costs and buyer preferences — not fixed percentages"
                action={
                    <div className="flex flex-wrap gap-2">
                        <PvoBadge tone="blue">{selectedImprovements.length} selected</PvoBadge>
                        <button
                            type="button"
                            onClick={() => setShowCustomModal(true)}
                            className="pvo-primary-btn px-4 py-2 rounded-full text-sm inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Describe your improvement
                        </button>
                    </div>
                }
            >
                {/* Simulator strip */}
                <PvoGlassCard className="p-6 mb-6 pvo-simulator-strip" glow>
                    <p className="pvo-eyebrow text-xs uppercase tracking-wider mb-4">Live Improvement Simulator</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <SimMetric label="Current Value" value={simulator.currentValue} />
                        <SimMetric label="Potential Value" value={simulator.potentialValue} highlight />
                        <SimMetric label="Renovation Cost" value={simulator.totalRenovationCost} />
                        <SimMetric label="Est. Profit" value={simulator.totalEstimatedProfit} />
                        <SimMetric label="ROI" value={simulator.roi} suffix="%" />
                        <SimMetric label="Equity" value={simulator.equity} />
                        <SimMetric label="Selling Price" value={simulator.estimatedSellingPrice} />
                        <SimMetric label="Rental +/mo" value={simulator.estimatedRentalIncrease} />
                        <SimMetric label="Days on Market" value={simulator.estimatedDaysOnMarket} suffix=" days" />
                        <SimMetric label="Future Appr." value={simulator.futureAppreciation} suffix="%" />
                    </div>
                </PvoGlassCard>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {customImprovements.map((imp) => (
                        <ImprovementCard
                            key={imp.id}
                            imp={imp}
                            selected={selectedImprovements.includes(imp.id)}
                            onToggle={() => toggleImprovement(imp.id)}
                            isCustom
                        />
                    ))}
                    {snapshot.improvements.map((imp) => (
                        <ImprovementCard
                            key={imp.id}
                            imp={imp}
                            selected={selectedImprovements.includes(imp.id)}
                            onToggle={() => toggleImprovement(imp.id)}
                        />
                    ))}
                </div>
            </PvoSection>

            <CustomImprovementModal
                open={showCustomModal}
                onClose={() => setShowCustomModal(false)}
                onAdd={handleAddCustomImprovement}
            />

            {/* Investment Planner */}
            <PvoSection title="Investment Planner" subtitle="Optimal improvement mix for your budget">
                <PvoGlassCard className="p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-1/3">
                            <label className="text-sm font-medium pvo-heading block mb-2">Renovation Budget</label>
                            <input
                                type="range"
                                min={50000}
                                max={800000}
                                step={10000}
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                                className="w-full pvo-range"
                            />
                            <p className="text-2xl font-bold text-gold mt-2 tabular-nums">{formatZAR(budget)}</p>
                            <button type="button" onClick={applyBudgetPlan} className="pvo-primary-btn mt-4 w-full">
                                Apply Optimal Plan
                            </button>
                        </div>
                        <div className="lg:flex-1 grid grid-cols-2 gap-4">
                            <PlannerStat label="Budget Used" value={formatZAR(budgetPlan.budgetUsed)} />
                            <PlannerStat label="Remaining" value={formatZAR(budgetPlan.remainingBudget)} />
                            <PlannerStat label="Value Increase" value={formatZAR(budgetPlan.expectedValueIncrease)} />
                            <PlannerStat label="Expected ROI" value={`${budgetPlan.expectedRoi}%`} />
                            <PlannerStat label="Timeline" value={`${budgetPlan.estimatedCompletionWeeks} weeks`} />
                            <div className="col-span-2 pvo-stat-inner p-4 rounded-2xl">
                                <p className="text-xs uppercase pvo-muted mb-2">Suggested order</p>
                                <ol className="text-sm pvo-heading space-y-1 list-decimal pl-4">
                                    {budgetPlan.suggestedOrder.map((name) => (
                                        <li key={name}>{name}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </PvoGlassCard>
            </PvoSection>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
                {/* Appreciation Forecast */}
                <PvoSection title="Property Appreciation Forecast">
                    <PvoGlassCard className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <PvoTabs
                                tabs={[
                                    { id: 'conservative' as const, label: 'Conservative' },
                                    { id: 'expected' as const, label: 'Expected' },
                                    { id: 'optimistic' as const, label: 'Optimistic' },
                                ]}
                                active={forecastScenario}
                                onChange={setForecastScenario}
                            />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecastData}>
                                    <defs>
                                        <linearGradient id="pvoArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#004D40" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#004D40" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="pvo-chart-grid" />
                                    <XAxis dataKey="year" tickFormatter={(y) => `${y}y`} />
                                    <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}m`} />
                                    <Tooltip formatter={(v: number) => formatZAR(v)} />
                                    <Area type="monotone" dataKey="value" stroke="#004D40" fill="url(#pvoArea)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs pvo-muted mt-4 flex items-start gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            Projections are estimates based on historical appreciation, inflation, interest rates and local
                            trends — not guarantees.
                        </p>
                    </PvoGlassCard>
                </PvoSection>

                {/* Market Intelligence */}
                <PvoSection title="Market Intelligence">
                    <PvoGlassCard className="p-6">
                        <div className="grid grid-cols-2 gap-3">
                            <MarketStat label="Avg Property Price" value={formatZAR(snapshot.market.avgPropertyPrice)} />
                            <MarketStat label="Avg Selling Price" value={formatZAR(snapshot.market.avgSellingPrice)} />
                            <MarketStat label="Avg Asking Price" value={formatZAR(snapshot.market.avgAskingPrice)} />
                            <MarketStat label="Days on Market" value={`${snapshot.market.avgDaysOnMarket} days`} />
                            <MarketStat label="Buyer Demand" value={`${snapshot.market.buyerDemand}/100`} />
                            <MarketStat label="Seller Competition" value={`${snapshot.market.sellerCompetition}/100`} />
                            <MarketStat label="Rental Demand" value={`${snapshot.market.rentalDemand}/100`} />
                            <MarketStat label="Luxury Demand" value={`${snapshot.market.luxuryDemand}/100`} />
                            <MarketStat label="Investor Demand" value={`${snapshot.market.investorDemand}/100`} />
                            <MarketStat label="Market Temp." value={snapshot.market.marketTemperature} />
                            <MarketStat label="Sold (90d)" value={String(snapshot.market.propertiesSold90d)} />
                            <MarketStat label="Active Listings" value={String(snapshot.market.activeListings)} />
                            <MarketStat label="Price Growth YoY" value={`${snapshot.market.priceGrowthYoY}%`} />
                            <MarketStat label="Inventory" value={`${snapshot.market.inventoryMonths} mo`} />
                            <MarketStat label="Price / m²" value={formatZAR(snapshot.market.pricePerSqm)} />
                        </div>
                    </PvoGlassCard>
                </PvoSection>
            </div>

            {/* Suburb Insights */}
            <PvoSection title="Suburb Insights" subtitle={snapshot.property.suburb}>
                <PvoGlassCard className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InsightList title="Schools" items={suburbInsights.schools.map((s) => `${s.name}${s.rating ? ` (${s.rating}★)` : ''} · ${s.distance}`)} />
                        <InsightList title="Universities" items={suburbInsights.universities.map((u) => `${u.name} · ${u.distance}`)} />
                        <InsightList title="Hospitals" items={suburbInsights.hospitals.map((h) => `${h.name} · ${h.distance}`)} />
                        <InsightList title="Shopping" items={suburbInsights.shoppingCentres.map((s) => `${s.name} · ${s.distance}`)} />
                        <InsightList title="Parks" items={suburbInsights.parks.map((p) => `${p.name} · ${p.distance}`)} />
                        <InsightList title="Transport" items={suburbInsights.publicTransport.map((t) => `${t.name} · ${t.distance}`)} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <ScoreChip label="Lifestyle" score={suburbInsights.lifestyleScore} />
                        <ScoreChip label="Walkability" score={suburbInsights.walkabilityScore} />
                        <ScoreChip label="Investment" score={suburbInsights.investmentScore} />
                        <div className="pvo-stat-inner p-4 rounded-2xl col-span-2 md:col-span-1">
                            <p className="text-xs pvo-muted">Crime trend</p>
                            <p className="text-sm font-medium pvo-heading mt-1">{suburbInsights.crimeTrend}</p>
                        </div>
                    </div>
                    <div className="mt-6 grid md:grid-cols-2 gap-4">
                        <InsightList title="Planned Developments" items={snapshot.market.plannedDevelopments} />
                        <InsightList title="Infrastructure Projects" items={snapshot.market.infrastructureProjects} />
                    </div>
                </PvoGlassCard>
            </PvoSection>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
                {/* Property Comparison */}
                <PvoSection title="Property Comparison">
                    <PvoGlassCard className="p-6">
                        <PvoTabs
                            tabs={[
                                { id: 'street' as const, label: 'Street' },
                                { id: 'suburb' as const, label: 'Suburb' },
                                { id: 'similar' as const, label: 'Similar' },
                            ]}
                            active={comparisonTab}
                            onChange={setComparisonTab}
                        />
                        <div className="mt-6 space-y-3">
                            {(snapshot.comparisons[comparisonTab] ?? []).map((row) => (
                                <div key={row.label} className="flex items-center justify-between p-3 pvo-stat-inner rounded-xl">
                                    <span className="text-sm pvo-muted">{row.label}</span>
                                    <div className="text-right text-sm">
                                        <span className="font-bold pvo-heading tabular-nums">
                                            {typeof row.subject === 'number' && row.unit === 'ZAR'
                                                ? formatZAR(row.subject)
                                                : `${row.subject}${row.unit === 'ZAR' ? '' : row.unit ?? ''}`}
                                        </span>
                                        <span className="pvo-muted mx-2">vs</span>
                                        <span className="tabular-nums">
                                            {typeof row.benchmark === 'number' && row.unit === 'ZAR'
                                                ? formatZAR(row.benchmark)
                                                : `${row.benchmark}${row.unit === 'ZAR' ? '' : row.unit ?? ''}`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PvoGlassCard>
                </PvoSection>

                {/* Home Equity Tracker */}
                <PvoSection title="Home Equity Tracker">
                    <PvoGlassCard className="p-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <PlannerStat label="Purchase Price" value={formatZAR(snapshot.property.purchasePrice)} />
                            <PlannerStat label="Current Value" value={formatZAR(simulator.potentialValue)} />
                            <PlannerStat label="Bond Balance" value={formatZAR(snapshot.property.bondBalance)} />
                            <PlannerStat label="Total Equity" value={formatZAR(simulator.equity)} />
                            <PlannerStat label="Equity After Reno" value={formatZAR(simulator.equity)} />
                            <PlannerStat label="Equity Growth" value={formatZAR(simulator.equity - snapshot.property.purchasePrice + snapshot.property.bondBalance)} />
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={forecastData}>
                                    <CartesianGrid strokeDasharray="3 3" className="pvo-chart-grid" />
                                    <XAxis dataKey="year" tickFormatter={(y) => `${y}y`} />
                                    <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}m`} />
                                    <Tooltip formatter={(v: number) => formatZAR(v)} />
                                    <Bar dataKey="equity" fill="#004D40" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </PvoGlassCard>
                </PvoSection>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
                {/* Property Health */}
                <PvoSection title="Property Health Dashboard">
                    <PvoGlassCard className="p-6">
                        <div className="space-y-3">
                            {snapshot.healthItems.map((item) => (
                                <div key={item.id} className="pvo-health-row p-4 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium pvo-heading text-sm">{item.label}</span>
                                        <PvoBadge tone={item.score >= 80 ? 'green' : item.score >= 65 ? 'warm' : 'default'}>
                                            {item.score}/100
                                        </PvoBadge>
                                    </div>
                                    <div className="h-1.5 rounded-full pvo-progress-track overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-primary to-gold transition-all duration-500"
                                            style={{ width: `${item.score}%` }}
                                        />
                                    </div>
                                    <p className="text-xs pvo-muted mt-2">{item.recommendation}</p>
                                    <p className="text-xs text-gold mt-1">
                                        Est. maintenance: {formatZAR(item.annualMaintenanceCost)}/yr
                                    </p>
                                </div>
                            ))}
                        </div>
                    </PvoGlassCard>
                </PvoSection>

                {/* Smart Alerts + Coach */}
                <div className="space-y-8">
                    <PvoSection title="Smart Alerts">
                        <div className="space-y-3">
                            {snapshot.alerts.map((alert) => (
                                <PvoGlassCard key={alert.id} className="p-4 flex gap-3">
                                    <Bell
                                        className={`w-5 h-5 shrink-0 ${
                                            alert.severity === 'opportunity'
                                                ? 'text-green-600'
                                                : alert.severity === 'warning'
                                                  ? 'text-amber-500'
                                                  : 'text-blue-500'
                                        }`}
                                    />
                                    <div>
                                        <p className="font-semibold pvo-heading text-sm">{alert.title}</p>
                                        <p className="text-xs pvo-muted mt-1">{alert.message}</p>
                                    </div>
                                </PvoGlassCard>
                            ))}
                        </div>
                    </PvoSection>

                    <PvoSection title="AI Property Coach" subtitle="Ask anything — answers include evidence and confidence">
                        <PvoGlassCard className="p-6">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {coachPrompts.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setCoachQuestion(p)}
                                        className="pvo-chip text-xs px-3 py-1.5 rounded-full"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={coachQuestion}
                                    onChange={(e) => setCoachQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && askCoach()}
                                    placeholder="Should I renovate before selling?"
                                    className="pvo-input flex-1 px-4 py-3 rounded-2xl text-sm"
                                />
                                <button type="button" onClick={askCoach} className="pvo-primary-btn px-4">
                                    <MessageCircle className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mt-4 space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                                {coachHistory.map((entry, i) => (
                                    <div key={i} className="pvo-coach-bubble p-4 rounded-2xl">
                                        <p className="text-xs font-semibold text-gold mb-1">{entry.q}</p>
                                        <p className="text-sm pvo-heading leading-relaxed">{entry.a.answer}</p>
                                        <ul className="mt-2 space-y-1">
                                            {entry.a.evidence.map((e) => (
                                                <li key={e} className="text-xs pvo-muted flex items-start gap-1">
                                                    <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                                                    {e}
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-xs mt-2 pvo-muted">
                                            Confidence: {entry.a.confidence}% · {entry.a.recommendation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </PvoGlassCard>
                    </PvoSection>
                </div>
            </div>

            {/* Architecture note */}
            <PvoGlassCard className="p-6 mb-8 border-dashed">
                <div className="flex items-start gap-4">
                    <Building2 className="w-8 h-8 text-gold shrink-0" />
                    <div>
                        <p className="font-semibold pvo-heading">Transparent hybrid valuation engine</p>
                        <p className="text-sm pvo-muted mt-2 leading-relaxed">
                            PropReady combines comparable sales, land value, replacement cost, location and demand premiums,
                            security, energy, infrastructure, inflation and interest rates with configurable weights — designed
                            for future ML integration with deeds office, municipal valuations, demographics and economic datasets.
                        </p>
                    </div>
                </div>
            </PvoGlassCard>
        </div>
    );
}

function MetricTile({
    label,
    value,
    format,
    suffix,
    text,
    highlight,
}: {
    label: string;
    value: number;
    format?: (v: number) => string;
    suffix?: string;
    text?: string;
    highlight?: boolean;
}) {
    return (
        <PvoGlassCard className={`p-4 ${highlight ? 'pvo-metric-highlight' : ''}`}>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider pvo-muted leading-tight">{label}</p>
            <p className="text-lg sm:text-xl font-bold pvo-heading tabular-nums mt-1 truncate">
                {text ?? (
                    <>
                        {format ? (
                            <AnimatedCounter value={value} format={format} />
                        ) : (
                            <AnimatedCounter value={value} format={(v) => `${Math.round(v)}${suffix ?? ''}`} />
                        )}
                    </>
                )}
            </p>
        </PvoGlassCard>
    );
}

function SummaryField({ label, value }: { label: string; value: string }) {
    return (
        <div className="pvo-stat-inner p-3 rounded-xl">
            <p className="text-[10px] uppercase tracking-wider pvo-muted">{label}</p>
            <p className="text-sm font-semibold pvo-heading mt-0.5 truncate">{value}</p>
        </div>
    );
}

function ValuePanel({ title, amount, monthly }: { title: string; amount: number; monthly?: boolean }) {
    return (
        <div className="pvo-stat-inner p-4 rounded-2xl">
            <p className="text-xs pvo-muted">{title}</p>
            <p className="text-xl font-bold pvo-heading tabular-nums mt-1">
                <AnimatedCounter value={amount} format={formatZAR} />
                {monthly && <span className="text-sm font-normal pvo-muted">/mo</span>}
            </p>
        </div>
    );
}

function SimMetric({ label, value, suffix, highlight }: { label: string; value: number; suffix?: string; highlight?: boolean }) {
    return (
        <div className={`p-3 rounded-xl ${highlight ? 'pvo-sim-highlight' : 'pvo-stat-inner'}`}>
            <p className="text-[10px] uppercase tracking-wider pvo-muted">{label}</p>
            <p className="text-base font-bold pvo-heading tabular-nums mt-1">
                {suffix === '%' || suffix === ' days' ? (
                    <AnimatedCounter value={value} format={(v) => `${Math.round(v * 10) / 10}${suffix}`} />
                ) : (
                    <AnimatedCounter value={value} format={formatZAR} />
                )}
            </p>
        </div>
    );
}

function ImprovementCard({
    imp,
    selected,
    onToggle,
    isCustom,
}: {
    imp: ImprovementRecommendation;
    selected: boolean;
    onToggle: () => void;
    isCustom?: boolean;
}) {
    return (
        <PvoGlassCard
            className={`p-5 transition-all duration-300 ${selected ? 'pvo-improvement-selected ring-2 ring-gold/40' : 'hover:pvo-improvement-hover'}`}
        >
            <div className="flex justify-between items-start gap-2 mb-3">
                <h4 className="font-semibold pvo-heading">{imp.name}</h4>
                <div className="flex flex-col items-end gap-1">
                    {isCustom && <PvoBadge tone="blue">Your plan</PvoBadge>}
                    <PvoBadge tone={imp.priority === 'Critical' || imp.priority === 'High' ? 'gold' : 'default'}>
                        {imp.priority}
                    </PvoBadge>
                </div>
            </div>
            <p className="text-xs pvo-muted mb-4 line-clamp-2">{imp.explanation}</p>
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <span>Cost: <strong className="pvo-heading">{formatZAR(imp.estimatedCost)}</strong></span>
                <span>Uplift: <strong className="text-green-600">{formatZAR(imp.estimatedValueIncrease)}</strong></span>
                <span>ROI: <strong className="text-gold">{imp.estimatedRoi}%</strong></span>
                <span>Profit: <strong>{formatZAR(imp.expectedProfit)}</strong></span>
                <span>Time: {imp.timeWeeks}w</span>
                <span>{imp.difficulty}</span>
                <span>Demand: {imp.buyerDemandScore}/100</span>
                <span>Confidence: {imp.confidence}%</span>
            </div>
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    selected ? 'bg-charcoal/10 pvo-heading' : 'pvo-primary-btn'
                }`}
            >
                {selected ? (
                    <>
                        <X className="w-4 h-4" /> Remove
                    </>
                ) : (
                    <>
                        <Plus className="w-4 h-4" /> Add Improvement
                    </>
                )}
            </button>
        </PvoGlassCard>
    );
}

function PlannerStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="pvo-stat-inner p-4 rounded-2xl">
            <p className="text-xs pvo-muted">{label}</p>
            <p className="text-lg font-bold pvo-heading mt-1">{value}</p>
        </div>
    );
}

function MarketStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="pvo-stat-inner p-3 rounded-xl">
            <p className="text-[10px] uppercase tracking-wider pvo-muted">{label}</p>
            <p className="text-sm font-semibold pvo-heading mt-1 capitalize">{value}</p>
        </div>
    );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
    return (
        <div>
            <p className="text-sm font-semibold pvo-heading mb-2">{title}</p>
            <ul className="space-y-1">
                {items.map((item) => (
                    <li key={item} className="text-xs pvo-muted flex items-start gap-1">
                        <ArrowUpRight className="w-3 h-3 shrink-0 mt-0.5 text-gold" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ScoreChip({ label, score }: { label: string; score: number }) {
    return (
        <div className="pvo-stat-inner p-4 rounded-2xl text-center">
            <p className="text-xs pvo-muted">{label}</p>
            <p className="text-2xl font-bold text-gold tabular-nums">{score}</p>
        </div>
    );
}
