import { COMPARABLE_BENCHMARKS, DEMO_MARKET, DEMO_PROPERTY, SUBURB_INSIGHTS } from './demo-data';
import { IMPROVEMENT_TEMPLATES, templateToRecommendation } from './improvements';
import type {
    BudgetPlan,
    CategoryScore,
    ForecastPoint,
    ForecastScenario,
    ImprovementRecommendation,
    InvestmentGrade,
    MarketContext,
    OptimizerSnapshot,
    PropertyHealthItem,
    PropertyProfile,
    SimulatorMetrics,
    SmartAlert,
    ValuationBreakdownItem,
    ValuationEngineWeights,
} from './types';
import { DEFAULT_VALUATION_WEIGHTS } from './weights';
import {
    buildMarketFromArea,
    buildPropertyForLocation,
    resolveAreaProfile,
    type LocationInput,
} from './locations';

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

function ageYears(property: PropertyProfile) {
    return new Date().getFullYear() - property.yearBuilt;
}

function locationMultiplier(property: PropertyProfile, market: MarketContext) {
    const suburbPremium = property.suburb.toLowerCase().includes('bryanston') ? 1.12 : 1.04;
    const schoolBoost = 1 + (market.schoolScore / 100) * 0.08;
    const transportBoost = 1 + (market.transportScore / 100) * 0.04;
    return suburbPremium * schoolBoost * transportBoost;
}

function demandMultiplier(market: MarketContext) {
    return 0.85 + (market.buyerDemand / 100) * 0.3 + (market.supplyDemandRatio < 1 ? 0.08 : -0.04);
}

function conditionMultiplier(property: PropertyProfile) {
    return 0.75 + (property.conditionScore / 100) * 0.35;
}

function labourMultiplier(market: MarketContext) {
    return 1 + market.inflationRate / 100 + 0.03;
}

function computeComparableBase(property: PropertyProfile, market: MarketContext) {
    const sqmRate = market.pricePerSqm * locationMultiplier(property, market);
    const buildingComponent = property.floorSizeSqm * sqmRate * 0.72;
    const landComponent = property.landSizeSqm * (sqmRate * 0.35);
    const compBlend =
        COMPARABLE_BENCHMARKS.similarHomes * 0.4 +
        COMPARABLE_BENCHMARKS.suburbAverage * 0.35 +
        COMPARABLE_BENCHMARKS.recentlySold * 0.25;
    return buildingComponent * 0.45 + landComponent * 0.25 + compBlend * 0.3;
}

export function computeHybridMarketValue(
    property: PropertyProfile,
    market: MarketContext,
    weights: ValuationEngineWeights = DEFAULT_VALUATION_WEIGHTS,
    selectedImprovementIds: string[] = [],
    allImprovements?: ImprovementRecommendation[]
): number {
    const loc = locationMultiplier(property, market);
    const demand = demandMultiplier(market);
    const condition = conditionMultiplier(property);
    const age = ageYears(property);
    const ageFactor = clamp(1 - age * 0.004, 0.72, 1);

    const comparableBase = computeComparableBase(property, market);
    const landValue = property.landSizeSqm * market.pricePerSqm * 0.38 * loc;
    const replacementCost =
        property.floorSizeSqm * 11_500 * (1 + market.inflationRate / 100) * condition;

    const locationPremium = comparableBase * (loc - 1) * 2.5;
    const marketPremium = comparableBase * (market.priceGrowthYoY / 100) * 1.8;
    const demandPremium = comparableBase * (demand - 1) * 2.2;

    const securityFeatures = property.existingFeatures.filter((f) =>
        /fence|cctv|alarm|security/i.test(f)
    ).length;
    const energyFeatures = property.existingFeatures.filter((f) =>
        /solar|geyser|battery|energy/i.test(f)
    ).length;
    const smartFeatures = property.existingFeatures.filter((f) =>
        /fibre|smart|automation/i.test(f)
    ).length;

    const securityPremium = securityFeatures * 28_000 * weights.securityPremium * 10;
    const energyPremium = energyFeatures * 35_000 * weights.energyEfficiency * 10;
    const smartPremium = smartFeatures * 18_000 * weights.smartHome * 10;

    const crimeAdj = comparableBase * ((100 - market.crimeIndex) / 100 - 0.5) * weights.crimeAdjustment * 2;
    const infraBoost =
        comparableBase *
        (market.infrastructureProjects.length * 0.012 + market.plannedDevelopments.length * 0.015);
    const popGrowth = comparableBase * (market.populationGrowth / 100) * weights.populationGrowth * 3;
    const inflationAdj = comparableBase * (market.inflationRate / 100) * weights.inflation * 2;
    const rateAdj = comparableBase * ((11.75 - market.primeInterestRate) / 100) * weights.interestRate * 2;
    const histAppr = comparableBase * (market.historicalAppreciation / 100) * weights.historicalAppreciation * 2;
    const supplyAdj =
        comparableBase * (market.supplyDemandRatio < 1 ? 0.04 : -0.03) * weights.supplyDemand * 2;

    let improvementUplift = 0;
    if (selectedImprovementIds.length) {
        const recs = allImprovements ?? buildImprovementRecommendations(property, market);
        improvementUplift = recs
            .filter((r) => selectedImprovementIds.includes(r.id))
            .reduce((sum, r) => sum + r.estimatedValueIncrease, 0);
        const overlapPenalty = Math.max(0, selectedImprovementIds.length - 3) * 0.015;
        improvementUplift *= 1 - overlapPenalty;
    }

    const weighted =
        comparableBase * weights.comparableSales +
        landValue * weights.landValue +
        replacementCost * weights.replacementCost +
        locationPremium * weights.locationPremium +
        marketPremium * weights.marketPremium +
        demandPremium * weights.demandPremium +
        comparableBase * condition * ageFactor * weights.conditionFactor +
        securityPremium +
        energyPremium +
        smartPremium +
        crimeAdj +
        infraBoost +
        popGrowth +
        inflationAdj +
        rateAdj +
        histAppr +
        supplyAdj +
        improvementUplift;

    return Math.round(weighted);
}

export function buildValuationBreakdown(
    property: PropertyProfile,
    market: MarketContext,
    totalValue: number,
    bondBalance: number
): ValuationBreakdownItem[] {
    const loc = locationMultiplier(property, market);
    const land = Math.round(property.landSizeSqm * market.pricePerSqm * 0.38 * loc);
    const building = Math.round(totalValue * 0.42);
    const improvements = Math.round(
        property.existingFeatures.length * 42_000 + property.conditionScore * 2_800
    );
    const locationPrem = Math.round(totalValue * 0.11);
    const marketPrem = Math.round(totalValue * (market.priceGrowthYoY / 100) * 0.35);
    const demandPrem = Math.round(totalValue * ((market.buyerDemand - 50) / 100) * 0.12);
    const growthPot = Math.round(totalValue * (market.historicalAppreciation / 100) * 0.25);
    const equity = Math.max(0, totalValue - bondBalance);

    const items: Omit<ValuationBreakdownItem, 'percentage'>[] = [
        {
            id: 'land',
            label: 'Land Value',
            amount: land,
            explanation:
                'Derived from land size, suburb land rate and location premium relative to municipal valuation.',
            color: '#004D40',
        },
        {
            id: 'building',
            label: 'Building Value',
            amount: building,
            explanation:
                'Replacement cost adjusted for age, floor area and overall condition score.',
            color: '#00796B',
        },
        {
            id: 'improvements',
            label: 'Improvements',
            amount: improvements,
            explanation:
                'Existing upgrades (solar, security, borehole, etc.) valued against buyer preference data.',
            color: '#DC2626',
        },
        {
            id: 'location',
            label: 'Location Premium',
            amount: locationPrem,
            explanation:
                'Schools, Sandton proximity, and Bryanston lifestyle score vs municipality average.',
            color: '#B45309',
        },
        {
            id: 'market',
            label: 'Market Premium',
            amount: marketPrem,
            explanation: `Current ${market.priceGrowthYoY}% YoY price growth and warm market conditions.`,
            color: '#7C3AED',
        },
        {
            id: 'demand',
            label: 'Demand Premium',
            amount: demandPrem,
            explanation: `Buyer demand at ${market.buyerDemand}/100 with ${market.inventoryMonths} months inventory.`,
            color: '#2563EB',
        },
        {
            id: 'growth',
            label: 'Future Growth Potential',
            amount: growthPot,
            explanation:
                'Infrastructure projects, population growth and planned developments in the corridor.',
            color: '#059669',
        },
        {
            id: 'equity',
            label: 'Estimated Equity',
            amount: equity,
            explanation: `Market value minus outstanding bond of ${formatZAR(bondBalance)}.`,
            color: '#0D9488',
        },
    ];

    if (bondBalance > 0) {
        items.push({
            id: 'bond',
            label: 'Outstanding Bond',
            amount: -bondBalance,
            explanation: 'Remaining home loan balance reduces net equity position.',
            color: '#64748B',
        });
    }

    const absTotal = items.reduce((s, i) => s + Math.abs(i.amount), 0);
    return items.map((item) => ({
        ...item,
        percentage: absTotal > 0 ? Math.round((Math.abs(item.amount) / absTotal) * 1000) / 10 : 0,
    }));
}

export function buildCategoryScores(
    property: PropertyProfile,
    market: MarketContext
): CategoryScore[] {
    const categories: Omit<CategoryScore, 'score' | 'benchmark'>[] = [
        {
            id: 'investment',
            label: 'Investment Potential',
            explanation: 'Rental yield, appreciation history and investor demand in Bryanston.',
            suggestions: ['Consider flatlet for dual income', 'Monitor Sandton Gateway impact'],
        },
        {
            id: 'location',
            label: 'Location',
            explanation: 'Proximity to Sandton CBD, schools and arterial access.',
            suggestions: ['Highlight Nicolway and Sandton access in marketing'],
        },
        {
            id: 'security',
            label: 'Security',
            explanation: 'Existing electric fence and crime trend improvements.',
            suggestions: ['Add CCTV integration', 'Upgrade to smart security hub'],
        },
        {
            id: 'energy',
            label: 'Energy Efficiency',
            explanation: 'Solar geyser present — full solar + battery would maximise score.',
            suggestions: ['Install hybrid inverter system', 'Add ceiling insulation'],
        },
        {
            id: 'schools',
            label: 'Schools',
            explanation: `School quality score ${market.schoolScore}/100 for catchment area.`,
            suggestions: ['Document school proximity in listing'],
        },
        {
            id: 'transport',
            label: 'Public Transport',
            explanation: 'Gautrain access via Sandton — car-dependent suburb otherwise.',
            suggestions: ['Note Gautrain park-and-ride options for commuters'],
        },
        {
            id: 'lifestyle',
            label: 'Lifestyle',
            explanation: `Lifestyle score ${SUBURB_INSIGHTS.lifestyleScore}/100 — country clubs, dining, parks.`,
            suggestions: ['Upgrade entertainment area for indoor-outdoor living'],
        },
        {
            id: 'condition',
            label: 'Condition',
            explanation: `Overall condition ${property.conditionScore}/100 — roof maintenance due.`,
            suggestions: ['Schedule roof inspection', 'Refresh exterior paint'],
        },
        {
            id: 'luxury',
            label: 'Luxury Appeal',
            explanation: `Luxury demand at ${market.luxuryDemand}/100 in this price segment.`,
            suggestions: ['Kitchen and bathroom refresh for premium positioning'],
        },
        {
            id: 'rental',
            label: 'Rental Demand',
            explanation: `Rental demand ${market.rentalDemand}/100 — strong for 4-bed family homes.`,
            suggestions: ['Obtain rental appraisal if considering let'],
        },
        {
            id: 'family',
            label: 'Family Appeal',
            explanation: '4 bedrooms, pool and garden align with family buyer profile.',
            suggestions: ['Maintain garden for show days', 'Highlight staff quarters'],
        },
        {
            id: 'future',
            label: 'Future Growth',
            explanation: 'Planned BRT and mixed-use developments support medium-term growth.',
            suggestions: ['Track municipal rezoning announcements'],
        },
        {
            id: 'walkability',
            label: 'Walkability',
            explanation: `Walk score ${SUBURB_INSIGHTS.walkabilityScore}/100 — typical for northern suburbs.`,
            suggestions: ['Emphasise security estate-style living instead'],
        },
        {
            id: 'sustainability',
            label: 'Sustainability',
            explanation: 'Borehole and solar geyser provide resilience advantages.',
            suggestions: ['Add rainwater harvesting', 'Install EV charger'],
        },
        {
            id: 'smart',
            label: 'Smart Home Readiness',
            explanation: 'Fibre-ready but no integrated automation yet.',
            suggestions: ['Install smart home hub', 'Ensure fibre is active not just ready'],
        },
    ];

    const baseScores: Record<string, number> = {
        investment: 82,
        location: 88,
        security: 74,
        energy: 68,
        schools: market.schoolScore,
        transport: market.transportScore,
        lifestyle: SUBURB_INSIGHTS.lifestyleScore,
        condition: property.conditionScore,
        luxury: market.luxuryDemand,
        rental: market.rentalDemand,
        family: 85,
        future: SUBURB_INSIGHTS.investmentScore,
        walkability: SUBURB_INSIGHTS.walkabilityScore,
        sustainability: 76,
        smart: 58,
    };

    return categories.map((c) => ({
        ...c,
        score: Math.round(clamp(baseScores[c.id] ?? 70, 35, 98)),
        benchmark: 72,
    }));
}

export function buildImprovementRecommendations(
    property: PropertyProfile,
    market: MarketContext
): ImprovementRecommendation[] {
    const multipliers = {
        location: locationMultiplier(property, market),
        demand: demandMultiplier(market),
        condition: 1 + (100 - property.conditionScore) / 200,
        labour: labourMultiplier(market),
        quality: 0.92 + market.buyerDemand / 500,
    };

    return IMPROVEMENT_TEMPLATES.map((t) => templateToRecommendation(t, multipliers)).sort(
        (a, b) => b.estimatedRoi - a.estimatedRoi
    );
}

export function computeSimulatorMetrics(
    property: PropertyProfile,
    market: MarketContext,
    selectedIds: string[],
    improvements: ImprovementRecommendation[]
): SimulatorMetrics {
    const currentValue = computeHybridMarketValue(property, market);
    const selected = improvements.filter((i) => selectedIds.includes(i.id));
    const totalCost = selected.reduce((s, i) => s + i.estimatedCost, 0);
    const totalUplift = selected.reduce((s, i) => s + i.estimatedValueIncrease, 0);
    const potentialValue = computeHybridMarketValue(
        property,
        market,
        DEFAULT_VALUATION_WEIGHTS,
        selectedIds,
        improvements
    );
    const profit = totalUplift - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const equity = potentialValue - property.bondBalance;
    const rentalBase = currentValue * 0.0045;
    const rentalBoost = selected.reduce((s, i) => {
        const tpl = IMPROVEMENT_TEMPLATES.find((t) => t.id === i.id);
        return s + (tpl?.rentalBoost ?? 0);
    }, 0);

    const domBase = market.avgDaysOnMarket;
    const domReduction = Math.min(18, selected.length * 3 + (roi > 40 ? 5 : 0));

    return {
        currentValue,
        potentialValue,
        totalRenovationCost: totalCost,
        totalEstimatedProfit: profit,
        roi: Math.round(roi * 10) / 10,
        equity,
        futureAppreciation: market.historicalAppreciation + (selected.length > 2 ? 0.4 : 0),
        estimatedSellingPrice: Math.round(potentialValue * 0.97),
        estimatedRentalIncrease: Math.round(rentalBoost),
        estimatedDaysOnMarket: Math.max(21, domBase - domReduction),
    };
}

export function optimizeBudget(
    budget: number,
    improvements: ImprovementRecommendation[]
): BudgetPlan {
    const sorted = [...improvements].sort((a, b) => {
        const effA = a.expectedProfit / a.estimatedCost;
        const effB = b.expectedProfit / b.estimatedCost;
        return effB - effA;
    });

    const selected: ImprovementRecommendation[] = [];
    let remaining = budget;

    for (const imp of sorted) {
        if (imp.estimatedCost <= remaining) {
            selected.push(imp);
            remaining -= imp.estimatedCost;
        }
    }

    const budgetUsed = budget - remaining;
    const valueIncrease = selected.reduce((s, i) => s + i.estimatedValueIncrease, 0);
    const profit = selected.reduce((s, i) => s + i.expectedProfit, 0);
    const weeks = selected.reduce((s, i) => s + i.timeWeeks, 0);

    return {
        budget,
        budgetUsed,
        remainingBudget: remaining,
        expectedValueIncrease: valueIncrease,
        expectedRoi: budgetUsed > 0 ? Math.round((profit / budgetUsed) * 1000) / 10 : 0,
        suggestedOrder: selected.map((i) => i.name),
        estimatedCompletionWeeks: weeks,
        selectedImprovementIds: selected.map((i) => i.id),
    };
}

export function buildForecasts(
    baseValue: number,
    equity: number,
    market: MarketContext,
    scenario: ForecastScenario
): ForecastPoint[] {
    const rates: Record<ForecastScenario, number> = {
        conservative: market.historicalAppreciation * 0.65 + market.inflationRate * 0.5,
        expected: market.historicalAppreciation,
        optimistic: market.historicalAppreciation * 1.35 + market.populationGrowth * 0.5,
    };
    const rate = rates[scenario] / 100;
    const years = [1, 3, 5, 10, 20];

    return years.map((year) => {
        const value = Math.round(baseValue * Math.pow(1 + rate, year));
        const bondDecay = Math.max(0, 1 - year * 0.04);
        const projectedEquity = Math.round(value - equity * bondDecay * 0.3);
        return {
            year,
            value,
            equity: projectedEquity,
            appreciation: Math.round((Math.pow(1 + rate, year) - 1) * 1000) / 10,
        };
    });
}

function gradeFromScore(score: number): InvestmentGrade {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 78) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
}

export function buildPropertyHealth(property: PropertyProfile): PropertyHealthItem[] {
    const age = ageYears(property);
    return [
        { id: 'roof', label: 'Roof Condition', score: clamp(88 - age * 1.2, 45, 95), status: age > 15 ? 'fair' : 'good', annualMaintenanceCost: 12_000, recommendation: 'Inspect flashing and waterproofing within 6 months.' },
        { id: 'plumbing', label: 'Plumbing', score: 76, status: 'good', annualMaintenanceCost: 8_500, recommendation: 'Replace ageing gate valves proactively.' },
        { id: 'electrical', label: 'Electrical', score: 74, status: 'good', annualMaintenanceCost: 6_000, recommendation: 'COC renewal recommended before sale.' },
        { id: 'foundation', label: 'Foundation', score: 91, status: 'excellent', annualMaintenanceCost: 3_000, recommendation: 'Monitor drainage around perimeter walls.' },
        { id: 'exterior', label: 'Exterior', score: 68, status: 'fair', annualMaintenanceCost: 15_000, recommendation: 'Exterior repaint would lift valuation comparables.' },
        { id: 'interior', label: 'Interior', score: property.conditionScore, status: 'good', annualMaintenanceCost: 18_000, recommendation: 'Refresh kitchen cabinetry and flooring.' },
        { id: 'security', label: 'Security', score: 79, status: 'good', annualMaintenanceCost: 5_500, recommendation: 'Integrate CCTV with mobile alerts.' },
        { id: 'energy', label: 'Energy Efficiency', score: 71, status: 'good', annualMaintenanceCost: 4_000, recommendation: 'Expand solar to cover essential circuits.' },
        { id: 'water', label: 'Water Efficiency', score: 82, status: 'good', annualMaintenanceCost: 3_500, recommendation: 'Service borehole pump annually.' },
        { id: 'maintenance', label: 'Maintenance Score', score: 73, status: 'good', annualMaintenanceCost: 76_000, recommendation: 'Budget 1% of property value annually for upkeep.' },
    ].map((item) => ({
        ...item,
        status: item.score >= 85 ? 'excellent' : item.score >= 72 ? 'good' : item.score >= 58 ? 'fair' : 'poor',
    })) as PropertyHealthItem[];
}

export function buildSmartAlerts(market: MarketContext, property: PropertyProfile): SmartAlert[] {
    const now = new Date().toISOString();
    return [
        { id: 'a1', type: 'demand', title: 'Buyer demand rising', message: `Buyer demand up to ${market.buyerDemand}/100 in ${property.suburb} — favourable selling window.`, severity: 'opportunity', timestamp: now },
        { id: 'a2', type: 'development', title: 'Municipal development approved', message: 'Sandton Gateway mixed-use precinct rezoning approved — monitor comparable sales.', severity: 'info', timestamp: now },
        { id: 'a3', type: 'rates', title: 'Interest rate watch', message: `Prime at ${market.primeInterestRate}% — renovation finance costs remain elevated.`, severity: 'warning', timestamp: now },
        { id: 'a4', type: 'sale', title: 'Comparable sold nearby', message: 'Similar 4-bed on Jacaranda sold 4.2% above asking within 38 days.', severity: 'opportunity', timestamp: now },
        { id: 'a5', type: 'trend', title: 'Solar renovation trend', message: 'Solar + battery combos showing 42% avg ROI in northern Johannesburg this quarter.', severity: 'info', timestamp: now },
    ];
}

export function buildComparisons(property: PropertyProfile, snapshot: OptimizerSnapshot) {
    const val = snapshot.estimatedMarketValue;
    return {
        street: [
            { label: 'Price', subject: val, benchmark: COMPARABLE_BENCHMARKS.streetAverage, unit: 'ZAR', higherIsBetter: true },
            { label: 'Land Size', subject: property.landSizeSqm, benchmark: 820, unit: 'm²', higherIsBetter: true },
            { label: 'Floor Size', subject: property.floorSizeSqm, benchmark: 300, unit: 'm²', higherIsBetter: true },
            { label: 'Condition', subject: property.conditionScore, benchmark: 70, unit: '/100', higherIsBetter: true },
        ],
        suburb: [
            { label: 'Price', subject: val, benchmark: COMPARABLE_BENCHMARKS.suburbAverage, unit: 'ZAR', higherIsBetter: true },
            { label: 'Appreciation', subject: snapshot.avgAnnualAppreciation, benchmark: 6.2, unit: '%', higherIsBetter: true },
            { label: 'Luxury Score', subject: snapshot.market.luxuryDemand, benchmark: 75, unit: '/100', higherIsBetter: true },
            { label: 'Rental Yield', subject: 5.8, benchmark: 5.2, unit: '%', higherIsBetter: true },
        ],
        similar: [
            { label: 'Price', subject: val, benchmark: COMPARABLE_BENCHMARKS.similarHomes, unit: 'ZAR', higherIsBetter: true },
            { label: 'Investment Potential', subject: snapshot.overallAiScore, benchmark: 74, unit: '/100', higherIsBetter: true },
            { label: 'Market Demand', subject: snapshot.market.buyerDemand, benchmark: 70, unit: '/100', higherIsBetter: true },
            { label: 'Days on Market', subject: snapshot.market.avgDaysOnMarket, benchmark: 52, unit: 'days', higherIsBetter: false },
        ],
    };
}

export function formatZAR(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function buildSnapshotForLocation(
    input: LocationInput,
    baseProperty: PropertyProfile = DEMO_PROPERTY
): OptimizerSnapshot {
    const area = resolveAreaProfile(input);
    const market = buildMarketFromArea(area);
    const property = buildPropertyForLocation(baseProperty, input, area);
    return buildOptimizerSnapshot(property, market);
}

export function buildOptimizerSnapshot(
    property: PropertyProfile = DEMO_PROPERTY,
    market: MarketContext = DEMO_MARKET
): OptimizerSnapshot {
    const estimatedMarketValue = computeHybridMarketValue(property, market);
    const growthSincePurchase =
        ((estimatedMarketValue - property.purchasePrice) / property.purchasePrice) * 100;
    const equity = estimatedMarketValue - property.bondBalance;
    const categoryScores = buildCategoryScores(property, market);
    const overallAiScore = Math.round(
        categoryScores.reduce((s, c) => s + c.score, 0) / categoryScores.length
    );
    const improvements = buildImprovementRecommendations(property, market);

    const futureValues = {
        1: Math.round(estimatedMarketValue * (1 + market.historicalAppreciation / 100)),
        3: Math.round(estimatedMarketValue * Math.pow(1 + market.historicalAppreciation / 100, 3)),
        5: Math.round(estimatedMarketValue * Math.pow(1 + market.historicalAppreciation / 100, 5)),
        10: Math.round(estimatedMarketValue * Math.pow(1 + market.historicalAppreciation / 100, 10)),
        20: Math.round(estimatedMarketValue * Math.pow(1 + market.historicalAppreciation / 100, 20)),
    } as Record<1 | 3 | 5 | 10 | 20, number>;

    const estimatedRentalValue = Math.round(estimatedMarketValue * 0.0048);

    const snapshotBase: OptimizerSnapshot = {
        property,
        market,
        estimatedMarketValue,
        estimatedRentalValue,
        confidenceScore: 87,
        growthSincePurchase: Math.round(growthSincePurchase * 10) / 10,
        investmentGrade: gradeFromScore(overallAiScore),
        avgAnnualAppreciation: market.historicalAppreciation,
        equity,
        netWorthContribution: Math.round(equity * 0.94),
        monthlyAppreciation: Math.round((estimatedMarketValue * (market.historicalAppreciation / 100)) / 12),
        annualAppreciation: Math.round(estimatedMarketValue * (market.historicalAppreciation / 100)),
        futureValues,
        breakdown: buildValuationBreakdown(property, market, estimatedMarketValue, property.bondBalance),
        categoryScores,
        overallAiScore,
        improvements,
        forecasts: {
            conservative: buildForecasts(estimatedMarketValue, equity, market, 'conservative'),
            expected: buildForecasts(estimatedMarketValue, equity, market, 'expected'),
            optimistic: buildForecasts(estimatedMarketValue, equity, market, 'optimistic'),
        },
        comparisons: {},
        healthItems: buildPropertyHealth(property),
        alerts: buildSmartAlerts(market, property),
        lastUpdated: new Date().toISOString(),
        marketStatus: market.marketTemperature.charAt(0).toUpperCase() + market.marketTemperature.slice(1) + ' market',
    };

    return {
        ...snapshotBase,
        comparisons: buildComparisons(property, snapshotBase),
    };
}

export {
    COMPARABLE_BENCHMARKS,
    DEMO_MARKET,
    DEMO_PROPERTY,
    SUBURB_INSIGHTS,
};
