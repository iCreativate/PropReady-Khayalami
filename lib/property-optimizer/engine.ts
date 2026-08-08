import { BLANK_PROPERTY, DEMO_MARKET, DEMO_PROPERTY, NEUTRAL_MARKET } from './demo-data';
import { IMPROVEMENT_TEMPLATES, templateToRecommendation } from './improvements';
import type {
    AcquisitionType,
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
    SaleDeductible,
    SaleProceedsBreakdown,
    CgtEstimate,
    SellSuggestion,
    SimulatorMetrics,
    SmartAlert,
    ValuationBasis,
    ValuationBreakdownItem,
    ValuationEngineWeights,
} from './types';
import { DEFAULT_VALUATION_WEIGHTS } from './weights';
import { formatCurrency } from '@/lib/currency';
import {
    buildMarketFromArea,
    buildPropertyForLocation,
    resolveAreaProfile,
    type LocationInput,
} from './locations';

/**
 * Long-run SA residential appreciation used only when no suburb YoY series exists.
 * Not a Property24 suburb fact — always disclosed in valuationDisclaimer.
 */
export const SA_MODEL_APPRECIATION_PCT = 5;

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

function ageYears(property: PropertyProfile) {
    return new Date().getFullYear() - property.yearBuilt;
}

function locationMultiplier(property: PropertyProfile, market: MarketContext) {
    const schoolBoost = 1 + (market.schoolScore / 100) * 0.08;
    const transportBoost = 1 + (market.transportScore / 100) * 0.04;
    const demandBoost = 1 + ((market.buyerDemand - 50) / 100) * 0.06;
    return schoolBoost * transportBoost * demandBoost;
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

/** Beds / baths / parking relative to a typical SA family home. */
function specsMultiplier(property: PropertyProfile) {
    const bedFactor = 1 + (property.bedrooms - 3) * 0.055;
    const bathFactor = 1 + (property.bathrooms - 2) * 0.035;
    const garageFactor = 1 + (property.garages - 1) * 0.028;
    const typeBoost = /apartment|flat/i.test(property.propertyType)
        ? 0.92
        : /townhouse|cluster/i.test(property.propertyType)
          ? 0.96
          : /smallholding/i.test(property.propertyType)
            ? 1.05
            : 1;
    return clamp(bedFactor * bathFactor * garageFactor * typeBoost, 0.72, 1.45);
}

/**
 * Size + location comps only — never hard-coded Bryanston demo benchmarks.
 * Anchors to suburb/province avg when floor/land are sparse.
 */
function computeComparableBase(property: PropertyProfile, market: MarketContext) {
    const loc = locationMultiplier(property, market);
    const specs = specsMultiplier(property);
    const sqmRate = market.pricePerSqm * loc;
    const floor = Math.max(0, property.floorSizeSqm);
    const land = Math.max(0, property.landSizeSqm);

    const buildingComponent = floor * sqmRate * 0.72;
    const landComponent = land * (sqmRate * 0.35);
    const sizeBased = (buildingComponent * 0.65 + landComponent * 0.35) * specs;

    const suburbAnchor =
        market.avgPropertyPrice > 0
            ? market.avgPropertyPrice * specs * (floor > 0 ? clamp(floor / 280, 0.55, 1.55) : 1)
            : sizeBased;

    if (floor <= 0 && land <= 0) {
        return Math.max(0, Math.round(suburbAnchor));
    }
    if (market.avgPropertyPrice <= 0) {
        return Math.max(0, Math.round(sizeBased));
    }
    // Prefer the user's size inputs; lightly blend suburb average for area context.
    return Math.max(0, Math.round(sizeBased * 0.78 + suburbAnchor * 0.22));
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
    const land = Math.round(property.landSizeSqm * Math.max(market.pricePerSqm, 0) * 0.38 * loc);
    const building = Math.round(totalValue * 0.42);
    const improvements = Math.round(
        property.existingFeatures.length * 42_000 + property.conditionScore * 2_800
    );
    const locationPrem = Math.round(totalValue * 0.11);
    const equity = Math.max(0, totalValue - bondBalance);
    const place = property.suburb?.trim() || 'your property';
    const sourceNote = market.hasVerifiedSuburbAverage
        ? `Anchored to Property24 suburb average for ${place}${market.priceYear ? ` (${market.priceYear})` : ''}.`
        : 'No Property24 suburb average matched — amounts are model splits from your inputs only.';

    const items: Omit<ValuationBreakdownItem, 'percentage'>[] = [
        {
            id: 'land',
            label: 'Land Value (model)',
            amount: land,
            explanation: `Model estimate from land size × derived area rate. ${sourceNote}`,
            color: '#004D40',
        },
        {
            id: 'building',
            label: 'Building Value (model)',
            amount: building,
            explanation: 'Model share of headline estimate allocated to improvements / structure.',
            color: '#00796B',
        },
        {
            id: 'improvements',
            label: 'Recorded upgrades (model)',
            amount: improvements,
            explanation: 'Illustrative allowance from features you marked — not a registered valuer appraisal.',
            color: '#DC2626',
        },
        {
            id: 'location',
            label: 'Location component (model)',
            amount: locationPrem,
            explanation: `Model location share for ${place}. Not a street-level comparable sale.`,
            color: '#B45309',
        },
        {
            id: 'equity',
            label: 'Estimated Equity',
            amount: equity,
            explanation: `Headline estimate minus outstanding bond of ${formatZAR(bondBalance)}.`,
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
    const place = property.suburb?.trim() || 'this property';
    const verified = market.hasVerifiedSuburbAverage;
    const securityFeatures = property.existingFeatures.filter((f) =>
        /fence|cctv|alarm|security/i.test(f)
    ).length;
    const energyFeatures = property.existingFeatures.filter((f) =>
        /solar|geyser|battery|energy/i.test(f)
    ).length;
    const waterFeatures = property.existingFeatures.filter((f) =>
        /borehole|water|rain/i.test(f)
    ).length;
    const smartFeatures = property.existingFeatures.filter((f) =>
        /fibre|smart|automation/i.test(f)
    ).length;

    const familyScore = clamp(
        55 + property.bedrooms * 6 + property.bathrooms * 4 + property.garages * 3,
        40,
        92
    );

    const categories: CategoryScore[] = [
        {
            id: 'suburb-data',
            label: 'Suburb market data',
            score: verified ? 88 : 28,
            benchmark: 70,
            explanation: verified
                ? `Property24 suburb average available for ${place}${market.priceYear ? ` (${market.priceYear})` : ''}: ${formatZAR(market.avgPropertyPrice)}.`
                : `No Property24 suburb average matched for ${place || 'your search'}. Search and select a SA suburb to anchor pricing.`,
            suggestions: verified
                ? ['Use floor/land size so the model can scale vs the suburb average']
                : ['Search suburb or address until a Property24 match fills municipality / province'],
        },
        {
            id: 'ownership',
            label: 'Ownership inputs',
            score: property.purchasePrice > 0 ? 82 : 35,
            benchmark: 70,
            explanation:
                property.purchasePrice > 0
                    ? `Purchase price of ${formatZAR(property.purchasePrice)} is included in the growth model.`
                    : 'Add purchase price and date for a purchase-growth estimate.',
            suggestions: ['Enter purchase price and purchase date from your offer / transfer docs'],
        },
        {
            id: 'specs',
            label: 'Property specs',
            score: clamp(
                40 +
                    (property.floorSizeSqm > 0 ? 20 : 0) +
                    (property.landSizeSqm > 0 ? 15 : 0) +
                    (property.bedrooms > 0 ? 10 : 0),
                30,
                90
            ),
            benchmark: 70,
            explanation: `${property.bedrooms} bed · ${property.bathrooms} bath · ${property.floorSizeSqm || '—'} m² floor · ${property.landSizeSqm || '—'} m² land.`,
            suggestions: ['Confirm floor and land size from plans or municipal records'],
        },
        {
            id: 'condition',
            label: 'Condition (user model)',
            score: property.conditionScore,
            benchmark: 70,
            explanation: `Condition score ${property.conditionScore}/100 is a model input from your profile — not an inspection report.`,
            suggestions: ['Update after a professional inspection or COC findings'],
        },
        {
            id: 'security',
            label: 'Security features',
            score: clamp(45 + securityFeatures * 14, 40, 92),
            benchmark: 70,
            explanation:
                securityFeatures > 0
                    ? `${securityFeatures} security-related feature(s) recorded on this property.`
                    : 'No security features recorded yet.',
            suggestions: ['Mark electric fence, alarm, CCTV if already installed'],
        },
        {
            id: 'energy',
            label: 'Energy features',
            score: clamp(45 + energyFeatures * 16, 40, 92),
            benchmark: 70,
            explanation:
                energyFeatures > 0
                    ? `${energyFeatures} energy-related feature(s) recorded.`
                    : 'No solar / battery features recorded yet.',
            suggestions: ['Toggle solar / battery under Value Builders if completed'],
        },
        {
            id: 'water',
            label: 'Water resilience',
            score: clamp(45 + waterFeatures * 18, 40, 90),
            benchmark: 70,
            explanation:
                waterFeatures > 0
                    ? `${waterFeatures} water-security feature(s) recorded.`
                    : 'No borehole / water features recorded.',
            suggestions: ['Record borehole or rainwater systems if present'],
        },
        {
            id: 'family',
            label: 'Family configuration',
            score: familyScore,
            benchmark: 70,
            explanation: 'Score from beds, baths and parking you entered — not a buyer survey.',
            suggestions: ['Keep specs aligned with the actual dwelling'],
        },
        {
            id: 'smart',
            label: 'Connectivity / smart',
            score: clamp(42 + smartFeatures * 16, 40, 88),
            benchmark: 70,
            explanation:
                smartFeatures > 0
                    ? `${smartFeatures} connectivity / smart feature(s) recorded.`
                    : 'No fibre / smart-home features recorded.',
            suggestions: ['Mark fibre if the property is connected'],
        },
    ];

    return categories;
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
    const place = property.suburb?.trim() || 'your area';
    const alerts: SmartAlert[] = [];

    if (market.hasVerifiedSuburbAverage && market.avgPropertyPrice > 0) {
        alerts.push({
            id: 'p24-avg',
            type: 'trend',
            title: 'Property24 suburb average',
            message: `${place}: ${formatZAR(market.avgPropertyPrice)}${
                market.priceYear ? ` (${market.priceYear})` : ''
            }. Source: Property24 suburb values extract.`,
            severity: 'info',
            timestamp: now,
        });
    } else {
        alerts.push({
            id: 'no-suburb',
            type: 'trend',
            title: 'Suburb average unavailable',
            message:
                'No Property24 suburb average matched yet. Search and select a South African suburb to anchor the estimate.',
            severity: 'warning',
            timestamp: now,
        });
    }

    if (property.purchasePrice > 0) {
        alerts.push({
            id: 'purchase-model',
            type: 'sale',
            title: 'Purchase-growth model active',
            message: `Using your purchase price of ${formatZAR(property.purchasePrice)} with a disclosed SA model appreciation rate where suburb YoY data is unavailable.`,
            severity: 'info',
            timestamp: now,
        });
    }

    alerts.push({
        id: 'not-valuation',
        type: 'rates',
        title: 'Not a formal valuation',
        message:
            'PropReady estimates are decision-support only — not a bank, municipal, or professional valuer appraisal.',
        severity: 'warning',
        timestamp: now,
    });

    return alerts;
}

export function buildComparisons(property: PropertyProfile, snapshot: OptimizerSnapshot) {
    const val = snapshot.estimatedMarketValue;
    const suburbAvg = snapshot.market.hasVerifiedSuburbAverage
        ? snapshot.market.avgPropertyPrice
        : 0;

    return {
        suburb: suburbAvg > 0
            ? [
                  {
                      label: 'Your estimate vs Property24 suburb average',
                      subject: val,
                      benchmark: suburbAvg,
                      unit: 'ZAR',
                      higherIsBetter: true,
                  },
                  {
                      label: 'Floor size (your input)',
                      subject: property.floorSizeSqm,
                      benchmark: property.floorSizeSqm,
                      unit: 'm²',
                      higherIsBetter: true,
                  },
                  {
                      label: 'Land size (your input)',
                      subject: property.landSizeSqm,
                      benchmark: property.landSizeSqm,
                      unit: 'm²',
                      higherIsBetter: true,
                  },
              ]
            : [
                  {
                      label: 'Suburb average',
                      subject: 0,
                      benchmark: 0,
                      unit: 'ZAR',
                      higherIsBetter: true,
                  },
              ],
        similar: [
            {
                label: 'Insufficient street / similar-home comps',
                subject: val,
                benchmark: 0,
                unit: 'ZAR',
                higherIsBetter: true,
            },
        ],
        street: [
            {
                label: 'Insufficient street-level sales feed',
                subject: val,
                benchmark: 0,
                unit: 'ZAR',
                higherIsBetter: true,
            },
        ],
    };
}

export function formatZAR(amount: number): string {
    return formatCurrency(amount);
}

/** Years (fractional) between purchase date and now */
export function yearsSincePurchase(purchaseDate: string, asOf: Date = new Date()): number {
    const purchased = new Date(purchaseDate);
    if (Number.isNaN(purchased.getTime())) return 0;
    const ms = asOf.getTime() - purchased.getTime();
    return Math.max(0, ms / (365.25 * 24 * 60 * 60 * 1000));
}

const ACQUISITION_LABELS: Record<AcquisitionType, string> = {
    purchased: 'Purchased',
    bought_cash: 'Bought cash',
    inherited: 'Inherited',
    family_home: 'Family home',
};

/** Default agent rate before VAT — typical SA mid-range mandate */
export const DEFAULT_AGENT_COMMISSION_PCT = 6.5;
const VAT_RATE = 0.15;

/** SA CGT parameters (individuals) — from 1 March 2026 */
export const CGT_PRIMARY_RESIDENCE_EXCLUSION = 3_000_000;
export const CGT_ANNUAL_EXCLUSION = 50_000;
export const CGT_INCLUSION_RATE = 0.4;
export const DEFAULT_MARGINAL_TAX_RATE_PCT = 45;

/** IDs that are not disposal costs for CGT base (settled debts / the tax itself) */
const NON_SELLING_DEDUCTIBLE_IDS = new Set(['cgt', 'rates-taxes']);

/**
 * Estimate capital gains tax payable to SARS on a residential property disposal (individual).
 * Illustrative only — not a SARS assessment.
 */
export function estimateCapitalGainsTax(params: {
    salePrice: number;
    /** Acquisition / base cost (purchase or value at inheritance) + capital improvements */
    baseCost: number;
    baseCostAssumed?: boolean;
    /** Agent commission + disposal-related fees (excludes bond settlement & rates arrears) */
    sellingCosts: number;
    isPrimaryResidence?: boolean;
    marginalTaxRatePct?: number;
}): CgtEstimate {
    const proceeds = Math.max(0, Math.round(params.salePrice));
    const baseCost = Math.max(0, Math.round(params.baseCost));
    const sellingCosts = Math.max(0, Math.round(params.sellingCosts));
    const isPrimaryResidence = params.isPrimaryResidence !== false;
    const marginalTaxRatePct = clamp(
        typeof params.marginalTaxRatePct === 'number' && Number.isFinite(params.marginalTaxRatePct)
            ? params.marginalTaxRatePct
            : DEFAULT_MARGINAL_TAX_RATE_PCT,
        0,
        45
    );

    const capitalGain = Math.max(0, proceeds - sellingCosts - baseCost);
    const primaryResidenceExclusion = isPrimaryResidence ? CGT_PRIMARY_RESIDENCE_EXCLUSION : 0;
    const primaryResidenceExclusionApplied = Math.min(capitalGain, primaryResidenceExclusion);
    const afterPrimary = Math.max(0, capitalGain - primaryResidenceExclusionApplied);
    const annualExclusionApplied = Math.min(afterPrimary, CGT_ANNUAL_EXCLUSION);
    const netCapitalGain = Math.max(0, afterPrimary - annualExclusionApplied);
    const taxableCapitalGain = Math.round(netCapitalGain * CGT_INCLUSION_RATE);
    const estimatedCgt = Math.round(taxableCapitalGain * (marginalTaxRatePct / 100));
    const maxEffectiveRatePct = Math.round(CGT_INCLUSION_RATE * 45 * 1000) / 10; // 18%

    return {
        proceeds,
        baseCost,
        baseCostAssumed: Boolean(params.baseCostAssumed),
        sellingCosts,
        capitalGain,
        isPrimaryResidence,
        primaryResidenceExclusion,
        primaryResidenceExclusionApplied,
        annualExclusion: annualExclusionApplied,
        netCapitalGain,
        inclusionRatePct: CGT_INCLUSION_RATE * 100,
        taxableCapitalGain,
        marginalTaxRatePct,
        estimatedCgt,
        maxEffectiveRatePct,
    };
}

/** Illustrative SA seller fee defaults (overridable by the seller) */
export function buildDefaultSellerDeductibles(params: {
    grossSalePrice: number;
    bondBalance: number;
    underBond: boolean;
}): SaleDeductible[] {
    const { grossSalePrice, bondBalance, underBond } = params;
    const toBank = underBond && bondBalance > 0 ? bondBalance : 0;
    const bondCancellation =
        toBank > 0 ? Math.min(15_000, Math.max(8_000, Math.round(grossSalePrice * 0.002))) : 0;
    const complianceCertificates = Math.min(
        10_000,
        Math.max(5_000, Math.round(grossSalePrice * 0.0015))
    );
    const ratesClearance = Math.min(6_000, Math.max(2_000, Math.round(grossSalePrice * 0.001)));

    const rows: SaleDeductible[] = [
        {
            id: 'rates-taxes',
            label: 'Rates & taxes owed',
            amount: 0,
            note: 'Municipal rates / taxes arrears settled at clearance',
        },
        {
            id: 'cgt',
            label: 'SARS capital gains tax (est.)',
            amount: 0,
            note: 'Auto-calculated — see CGT working below',
        },
        {
            id: 'bond-cancel',
            label: 'Bond cancellation fees',
            amount: bondCancellation,
            note: 'Attorney & bank admin to cancel the bond',
        },
        {
            id: 'compliance',
            label: 'Compliance certificates',
            amount: complianceCertificates,
            note: 'Electrical, beetle, gas, plumbing (as required)',
        },
        {
            id: 'rates-clearance',
            label: 'Rates / levy clearance fee',
            amount: ratesClearance,
            note: 'Municipal or body corporate clearance admin',
        },
    ];

    return rows.filter((r) => r.id !== 'bond-cancel' || r.amount > 0 || toBank > 0);
}

export function buildSaleProceedsBreakdown(params: {
    grossSalePrice: number;
    purchasePrice: number;
    renovationSpend: number;
    costBasis: number;
    bondBalance: number;
    underBond: boolean;
    /** Use custom sale price label when user entered a target */
    salePriceSource?: 'suggested' | 'custom';
    agentCommissionPct?: number;
    agentCommissionAmount?: number;
    /** When true, % rate already includes VAT (do not add 15%) */
    agentCommissionIncludesVat?: boolean;
    /** When set, replaces illustrative fee defaults */
    deductibles?: SaleDeductible[];
    isPrimaryResidence?: boolean;
    marginalTaxRatePct?: number;
    /** Keep user-entered CGT instead of auto estimate */
    cgtManualOverride?: boolean;
    /** Base cost for CGT (defaults to costBasis) */
    cgtBaseCost?: number;
    cgtBaseCostAssumed?: boolean;
}): SaleProceedsBreakdown {
    const {
        grossSalePrice,
        purchasePrice,
        renovationSpend,
        costBasis,
        bondBalance,
        underBond,
        salePriceSource = 'suggested',
        agentCommissionAmount,
        agentCommissionIncludesVat = false,
        cgtManualOverride = false,
    } = params;

    const ratePct =
        typeof params.agentCommissionPct === 'number' &&
        Number.isFinite(params.agentCommissionPct) &&
        params.agentCommissionPct >= 0
            ? Math.round(params.agentCommissionPct * 100) / 100
            : DEFAULT_AGENT_COMMISSION_PCT;

    const useFixed =
        typeof agentCommissionAmount === 'number' &&
        Number.isFinite(agentCommissionAmount) &&
        agentCommissionAmount > 0;

    let toAgent: number;
    let agentCommissionRatePct = ratePct;
    let agentNote: string;
    let agentLabel: string;

    if (useFixed) {
        toAgent = Math.round(agentCommissionAmount);
        agentCommissionRatePct = grossSalePrice > 0 ? Math.round((toAgent / grossSalePrice) * 1000) / 10 : 0;
        agentLabel = 'Estate agent commission (fixed)';
        agentNote = 'Amount entered from your mandate / agreement';
    } else if (agentCommissionIncludesVat) {
        toAgent = Math.round(grossSalePrice * (ratePct / 100));
        agentLabel = `Estate agent commission (${ratePct}% incl. VAT)`;
        agentNote = 'Rate entered as all-in (VAT already included)';
    } else {
        const agentCommissionExVat = Math.round(grossSalePrice * (ratePct / 100));
        const agentVat = Math.round(agentCommissionExVat * VAT_RATE);
        toAgent = agentCommissionExVat + agentVat;
        agentLabel = `Estate agent commission (${ratePct}% + VAT)`;
        agentNote = 'Includes 15% VAT on commission';
    }

    const toBank = underBond && bondBalance > 0 ? bondBalance : 0;

    let allDeductibles: SaleDeductible[] = (params.deductibles ??
        buildDefaultSellerDeductibles({
            grossSalePrice,
            bondBalance,
            underBond,
        })).map((d) => ({
        id: d.id,
        label: (d.label || 'Deductible').trim(),
        amount: Math.max(0, Math.round(d.amount || 0)),
        note: d.note,
    }));

    // Selling costs for CGT = agent + disposal fees (not bond, rates arrears, or CGT itself)
    const sellingCostsForCgt =
        toAgent +
        allDeductibles
            .filter((d) => !NON_SELLING_DEDUCTIBLE_IDS.has(d.id))
            .reduce((sum, d) => sum + d.amount, 0);

    const cgtBaseCost =
        typeof params.cgtBaseCost === 'number' && params.cgtBaseCost >= 0
            ? params.cgtBaseCost
            : costBasis;

    const cgtEstimate = estimateCapitalGainsTax({
        salePrice: grossSalePrice,
        baseCost: cgtBaseCost,
        baseCostAssumed: params.cgtBaseCostAssumed,
        sellingCosts: sellingCostsForCgt,
        isPrimaryResidence: params.isPrimaryResidence,
        marginalTaxRatePct: params.marginalTaxRatePct,
    });

    if (!cgtManualOverride) {
        const cgtNote = cgtEstimate.isPrimaryResidence
            ? `Auto: gain after R${(CGT_PRIMARY_RESIDENCE_EXCLUSION / 1_000_000).toFixed(0)}m primary exclusion · ${cgtEstimate.marginalTaxRatePct}% marginal`
            : `Auto: investment property (no primary exclusion) · ${cgtEstimate.marginalTaxRatePct}% marginal`;
        const cgtRow: SaleDeductible = {
            id: 'cgt',
            label: 'SARS capital gains tax (est.)',
            amount: cgtEstimate.estimatedCgt,
            note: cgtNote,
        };
        const hasCgt = allDeductibles.some((d) => d.id === 'cgt');
        allDeductibles = hasCgt
            ? allDeductibles.map((d) => (d.id === 'cgt' ? cgtRow : d))
            : [cgtRow, ...allDeductibles];
    }

    const activeDeductibles = allDeductibles.filter((d) => d.amount > 0);
    const ratesAndTaxesOwed = allDeductibles.find((d) => d.id === 'rates-taxes')?.amount ?? 0;
    const capitalGainsTax = allDeductibles.find((d) => d.id === 'cgt')?.amount ?? 0;
    const otherSellerCosts = activeDeductibles.reduce((sum, d) => sum + d.amount, 0);

    const totalDeductions = toBank + toAgent + otherSellerCosts;
    const netToSeller = grossSalePrice - totalDeductions;
    const estimatedProfit = grossSalePrice - toAgent - otherSellerCosts - costBasis;

    const lines: SaleProceedsBreakdown['lines'] = [
        {
            id: 'gross',
            label: salePriceSource === 'custom' ? 'Your target sale price' : 'Suggested selling price',
            amount: grossSalePrice,
            note:
                salePriceSource === 'custom'
                    ? 'Sale price you entered for this breakdown'
                    : 'Gross proceeds before deductions',
        },
    ];

    if (toBank > 0) {
        lines.push({
            id: 'bank',
            label: 'To the bank (bond settlement)',
            amount: -toBank,
            note: 'Outstanding home loan settled at transfer',
        });
    }

    lines.push({
        id: 'agent',
        label: agentLabel,
        amount: -toAgent,
        note: agentNote,
    });

    for (const d of activeDeductibles) {
        lines.push({
            id: d.id,
            label: d.label,
            amount: -d.amount,
            note: d.note,
        });
    }

    lines.push({
        id: 'net',
        label: 'Estimated cash to you',
        amount: netToSeller,
        note: 'After bank, agent, SARS CGT and other deductibles',
    });

    return {
        grossSalePrice,
        salePriceSource,
        purchasePrice,
        renovationSpend,
        costBasis,
        toBank,
        toAgent,
        agentCommissionRatePct,
        agentCommissionIsFixed: useFixed,
        agentCommissionIncludesVat: useFixed ? true : agentCommissionIncludesVat,
        deductibles: allDeductibles,
        ratesAndTaxesOwed,
        capitalGainsTax,
        cgtEstimate: cgtManualOverride ? { ...cgtEstimate, estimatedCgt: capitalGainsTax } : cgtEstimate,
        otherSellerCosts,
        totalDeductions,
        netToSeller,
        estimatedProfit,
        lines,
    };
}

function resolveAcquisitionType(params: {
    acquisitionType?: AcquisitionType;
    inherited?: boolean;
}): AcquisitionType {
    if (params.acquisitionType) return params.acquisitionType;
    if (params.inherited) return 'inherited';
    return 'bought_cash';
}

/**
 * Suggest a selling price from:
 * 1) purchase price grown with compound suburb appreciation
 * 2) uplift from improvements already made
 * 3) blend toward suburb average (location anchor)
 */
export function estimateSellSuggestion(params: {
    purchasePrice: number;
    purchaseDate: string;
    annualAppreciationPct: number;
    suburbAverage: number;
    /** Size/spec hybrid for this property — preferred over raw suburb average */
    sizeBasedValue?: number;
    completedImprovementIds: string[];
    improvements: ImprovementRecommendation[];
    renovationSpend?: number;
    otherImprovementLabels?: string[];
    acquisitionType?: AcquisitionType;
    inherited?: boolean;
    underBond?: boolean;
    bondBalance?: number;
    expectedSalePrice?: number;
    agentCommissionPct?: number;
    agentCommissionAmount?: number;
    agentCommissionIncludesVat?: boolean;
    deductibles?: SaleDeductible[];
    isPrimaryResidence?: boolean;
    marginalTaxRatePct?: number;
    cgtManualOverride?: boolean;
}): SellSuggestion {
    const acquisitionType = resolveAcquisitionType(params);
    const noPurchaseCost =
        acquisitionType === 'inherited' || acquisitionType === 'family_home';
    const boughtCash = acquisitionType === 'bought_cash';
    const underBond = boughtCash ? false : Boolean(params.underBond);
    const bondBalance =
        underBond && typeof params.bondBalance === 'number' && params.bondBalance > 0
            ? Math.round(params.bondBalance)
            : 0;

    const yearsOwned = Math.round(yearsSincePurchase(params.purchaseDate) * 10) / 10;
    const rate = Math.max(0, params.annualAppreciationPct) / 100;
    const purchaseForCompound =
        params.purchasePrice > 0
            ? params.purchasePrice
            : noPurchaseCost
              ? Math.round(params.suburbAverage * 0.7)
              : params.purchasePrice;

    const compoundedPurchaseValue = Math.round(
        purchaseForCompound * Math.pow(1 + rate, yearsOwned)
    );

    const completed = params.improvements.filter((i) =>
        params.completedImprovementIds.includes(i.id)
    );
    const modelledUplift = Math.round(
        completed.reduce((s, i) => s + i.estimatedValueIncrease, 0) * 0.9
    );
    const renovationSpend =
        typeof params.renovationSpend === 'number' && params.renovationSpend > 0
            ? Math.round(params.renovationSpend)
            : 0;

    let improvementContribution = modelledUplift;
    if (renovationSpend > 0 && modelledUplift > 0) {
        improvementContribution = Math.round(modelledUplift * 0.55 + renovationSpend * 0.85 * 0.45);
    } else if (renovationSpend > 0) {
        improvementContribution = Math.round(renovationSpend * 0.85);
    }

    const withImprovements = compoundedPurchaseValue + improvementContribution;
    const sizeBasedAnchor =
        typeof params.sizeBasedValue === 'number' && params.sizeBasedValue > 0
            ? Math.round(params.sizeBasedValue)
            : params.suburbAverage > 0
              ? Math.round(params.suburbAverage)
              : withImprovements;
    const suggestedSellPrice = Math.round(
        params.purchasePrice > 0
            ? withImprovements * 0.78 + sizeBasedAnchor * 0.22
            : sizeBasedAnchor + improvementContribution
    );
    const otherLabels = (params.otherImprovementLabels ?? []).filter(Boolean);

    const acquisitionCost = noPurchaseCost ? 0 : Math.max(0, params.purchasePrice);
    const costBasis = acquisitionCost + renovationSpend;

    // CGT base cost: purchase/inheritance value + improvements (not R0 for inherited when unknown)
    const cgtBaseCostAssumed = noPurchaseCost && !(params.purchasePrice > 0);
    const cgtBaseCost =
        (params.purchasePrice > 0
            ? params.purchasePrice
            : cgtBaseCostAssumed
              ? Math.round(params.suburbAverage * 0.7)
              : 0) + renovationSpend;

    const customSale =
        typeof params.expectedSalePrice === 'number' && params.expectedSalePrice > 0
            ? Math.round(params.expectedSalePrice)
            : undefined;
    const salePriceForProceeds = customSale ?? suggestedSellPrice;

    const proceeds = buildSaleProceedsBreakdown({
        grossSalePrice: salePriceForProceeds,
        purchasePrice: params.purchasePrice,
        renovationSpend,
        costBasis,
        bondBalance,
        underBond,
        salePriceSource: customSale ? 'custom' : 'suggested',
        agentCommissionPct: params.agentCommissionPct,
        agentCommissionAmount: params.agentCommissionAmount,
        agentCommissionIncludesVat: params.agentCommissionIncludesVat,
        deductibles: params.deductibles,
        isPrimaryResidence: params.isPrimaryResidence,
        marginalTaxRatePct: params.marginalTaxRatePct,
        cgtManualOverride: params.cgtManualOverride,
        cgtBaseCost,
        cgtBaseCostAssumed,
    });

    const standToGain = proceeds.netToSeller;
    const gainVsInvestment = proceeds.estimatedProfit;

    const suburb = Math.max(1, params.suburbAverage);
    const renoShare = renovationSpend / suburb;
    const recovery = renovationSpend > 0 ? improvementContribution / renovationSpend : 1;
    const purchasePremium =
        !noPurchaseCost && params.purchasePrice > 0 ? params.purchasePrice / suburb : 1;

    let investmentSignal: SellSuggestion['investmentSignal'] = 'balanced';
    let investmentSignalLabel = 'Spend looks reasonable for this location';
    let investmentSignalDetail =
        'Renovation spend and purchase price sit in a sensible range versus local suburb averages.';

    if (renoShare >= 0.25 || recovery < 0.65 || purchasePremium >= 1.35) {
        investmentSignal = 'over';
        investmentSignalLabel = 'Likely over-invested for this area';
        investmentSignalDetail =
            renoShare >= 0.25
                ? `Renovations are about ${Math.round(renoShare * 100)}% of the suburb average — buyers in this area may not pay that back in full.`
                : purchasePremium >= 1.35
                  ? 'The purchase price sits well above typical suburb values, so recovering the full investment may be harder.'
                  : 'Modelled value uplift is well below what was spent on renovations for this location.';
    } else if (renoShare >= 0.15 || recovery < 0.85 || purchasePremium >= 1.2) {
        investmentSignal = 'caution';
        investmentSignalLabel = 'Renovation spend is high for this location';
        investmentSignalDetail =
            'You may still do well, but further heavy spend is less likely to return full value in this suburb.';
    } else if (
        renovationSpend > 0 &&
        recovery >= 1.1 &&
        renoShare < 0.1 &&
        purchasePremium <= 1.05
    ) {
        investmentSignal = 'under';
        investmentSignalLabel = 'Room for selective further investment';
        investmentSignalDetail =
            'Spend so far looks efficient versus suburb norms — high-ROI upgrades could still add value.';
    }

    return {
        purchasePrice: params.purchasePrice,
        yearsOwned,
        annualAppreciationPct: params.annualAppreciationPct,
        compoundedPurchaseValue,
        improvementContribution,
        renovationSpend,
        suburbAverage: params.suburbAverage,
        suggestedSellPrice,
        completedImprovementNames: [...completed.map((c) => c.name), ...otherLabels],
        acquisitionType,
        acquisitionLabel: ACQUISITION_LABELS[acquisitionType],
        inherited: noPurchaseCost,
        underBond,
        bondBalance,
        costBasis,
        standToGain,
        gainVsInvestment,
        investmentSignal,
        investmentSignalLabel,
        investmentSignalDetail,
        proceeds,
    };
}

export function buildSnapshotForLocation(
    input: LocationInput,
    baseProperty: PropertyProfile = BLANK_PROPERTY
): OptimizerSnapshot {
    const area = resolveAreaProfile(input);
    const market = buildMarketFromArea(area);
    const property = buildPropertyForLocation(baseProperty, input, area);
    const completedIds = input.completedImprovementIds ?? [];
    const allForArea = buildImprovementRecommendations(property, market);
    const sizeBasedValue = computeHybridMarketValue(
        property,
        market,
        DEFAULT_VALUATION_WEIGHTS,
        completedIds,
        allForArea
    );

    const resolvedType =
        input.acquisitionType ??
        (input.inherited ? ('inherited' as const) : ('purchased' as const));
    const noPurchaseRequired =
        resolvedType === 'inherited' || resolvedType === 'family_home';

    const hasPurchase = typeof input.purchasePrice === 'number' && input.purchasePrice > 0;
    const modelAppreciation =
        market.historicalAppreciation > 0
            ? market.historicalAppreciation
            : SA_MODEL_APPRECIATION_PCT;

    const sellSuggestion =
        hasPurchase || noPurchaseRequired
            ? estimateSellSuggestion({
                  purchasePrice: input.purchasePrice ?? 0,
                  purchaseDate: input.purchaseDate || property.purchaseDate,
                  annualAppreciationPct: modelAppreciation,
                  suburbAverage: market.avgPropertyPrice,
                  sizeBasedValue,
                  completedImprovementIds: completedIds,
                  improvements: allForArea,
                  renovationSpend: input.renovationSpend,
                  otherImprovementLabels: (input.otherImprovements ?? []).map((o) => o.label),
                  acquisitionType: resolvedType,
                  inherited: noPurchaseRequired,
                  underBond: resolvedType === 'bought_cash' ? false : input.underBond,
                  bondBalance: resolvedType === 'bought_cash' ? 0 : input.bondBalance,
                  expectedSalePrice: input.expectedSalePrice,
                  agentCommissionPct: input.agentCommissionPct,
                  agentCommissionAmount: input.agentCommissionAmount,
                  agentCommissionIncludesVat: input.agentCommissionIncludesVat,
                  deductibles: input.deductibles,
                  isPrimaryResidence: input.isPrimaryResidence,
                  marginalTaxRatePct: input.marginalTaxRatePct,
                  cgtManualOverride: input.cgtManualOverride,
              })
            : undefined;

    return buildOptimizerSnapshot(property, market, {
        completedImprovementIds: completedIds,
        sellSuggestion,
        sizeBasedValue,
        modelAppreciationPct: modelAppreciation,
        inputCompleteness: {
            hasSuburb: Boolean(input.suburb?.trim()),
            hasPurchase,
            hasSizes: Boolean(
                (input.floorSizeSqm && input.floorSizeSqm > 0) ||
                    (input.landSizeSqm && input.landSizeSqm > 0)
            ),
            hasVerifiedSuburb: market.hasVerifiedSuburbAverage,
        },
    });
}

export function buildOptimizerSnapshot(
    property: PropertyProfile = BLANK_PROPERTY,
    market: MarketContext = NEUTRAL_MARKET,
    options?: {
        completedImprovementIds?: string[];
        sellSuggestion?: SellSuggestion;
        sizeBasedValue?: number;
        modelAppreciationPct?: number;
        inputCompleteness?: {
            hasSuburb: boolean;
            hasPurchase: boolean;
            hasSizes: boolean;
            hasVerifiedSuburb?: boolean;
        };
    }
): OptimizerSnapshot {
    const completedIds = options?.completedImprovementIds ?? [];
    const sellSuggestion = options?.sellSuggestion;
    const appr =
        options?.modelAppreciationPct ??
        (market.historicalAppreciation > 0
            ? market.historicalAppreciation
            : SA_MODEL_APPRECIATION_PCT);

    const hybridValue =
        options?.sizeBasedValue ??
        computeHybridMarketValue(property, market, DEFAULT_VALUATION_WEIGHTS, completedIds);

    let estimatedMarketValue = sellSuggestion?.suggestedSellPrice ?? 0;
    let valuationBasis: ValuationBasis = 'insufficient';
    if (sellSuggestion && property.purchasePrice > 0) {
        valuationBasis = market.hasVerifiedSuburbAverage
            ? 'property24-suburb-average'
            : 'purchase-growth-model';
        estimatedMarketValue = sellSuggestion.suggestedSellPrice;
    } else if (market.hasVerifiedSuburbAverage && hybridValue > 0) {
        // Size / spec model only when anchored to a verified suburb average.
        valuationBasis = 'property24-suburb-average';
        estimatedMarketValue = hybridValue;
    } else if (property.purchasePrice > 0) {
        valuationBasis = 'purchase-growth-model';
        estimatedMarketValue = sellSuggestion?.suggestedSellPrice ?? property.purchasePrice;
    } else {
        estimatedMarketValue = 0;
        valuationBasis = 'insufficient';
    }

    const valuationDisclaimer = (() => {
        const bits: string[] = [];
        if (market.hasVerifiedSuburbAverage) {
            bits.push(
                `Suburb average from Property24${market.priceYear ? ` (${market.priceYear})` : ''}: ${formatZAR(market.avgPropertyPrice)}.`
            );
        } else {
            bits.push('No Property24 suburb average matched for this location.');
        }
        bits.push(
            `Growth / scenario maths use a disclosed SA model rate of ${appr}% p.a. where suburb YoY series are unavailable.`
        );
        bits.push(
            'Improvement cost/uplift figures are illustrative industry models, not deed-office comps.'
        );
        bits.push('Not a formal valuation for lending, insurance, or SARS.');
        return bits.join(' ');
    })();

    const growthSincePurchase =
        property.purchasePrice > 0 && estimatedMarketValue > 0
            ? ((estimatedMarketValue - property.purchasePrice) / property.purchasePrice) * 100
            : 0;
    const equity = estimatedMarketValue - property.bondBalance;
    const categoryScores = buildCategoryScores(property, market);
    const overallAiScore = Math.round(
        categoryScores.reduce((s, c) => s + c.score, 0) / Math.max(1, categoryScores.length)
    );
    const allImprovements = buildImprovementRecommendations(property, market);
    const improvements = completedIds.length
        ? allImprovements.filter((i) => !completedIds.includes(i.id))
        : allImprovements;

    const marketForForecasts: MarketContext = {
        ...market,
        historicalAppreciation: appr,
    };

    const futureValues = {
        1: Math.round(estimatedMarketValue * (1 + appr / 100)),
        3: Math.round(estimatedMarketValue * Math.pow(1 + appr / 100, 3)),
        5: Math.round(estimatedMarketValue * Math.pow(1 + appr / 100, 5)),
        10: Math.round(estimatedMarketValue * Math.pow(1 + appr / 100, 10)),
        20: Math.round(estimatedMarketValue * Math.pow(1 + appr / 100, 20)),
    } as Record<1 | 3 | 5 | 10 | 20, number>;

    const estimatedRentalValue =
        estimatedMarketValue > 0 ? Math.round(estimatedMarketValue * 0.0048) : 0;

    const completeness = options?.inputCompleteness;
    let confidenceScore = 22;
    if (completeness?.hasVerifiedSuburb) confidenceScore += 28;
    else if (completeness?.hasSuburb) confidenceScore += 8;
    if (completeness?.hasPurchase) confidenceScore += 18;
    if (completeness?.hasSizes) confidenceScore += 12;
    if (completedIds.length) confidenceScore += Math.min(10, completedIds.length * 2);
    if (property.address?.trim()) confidenceScore += 4;
    confidenceScore = clamp(confidenceScore, 18, 92);

    const marketStatus = market.hasVerifiedSuburbAverage
        ? `Property24 suburb average${market.priceYear ? ` · ${market.priceYear}` : ''}`
        : 'Insufficient suburb market data';

    const snapshotBase: OptimizerSnapshot = {
        property,
        market,
        estimatedMarketValue,
        estimatedRentalValue,
        confidenceScore,
        growthSincePurchase: Math.round(growthSincePurchase * 10) / 10,
        investmentGrade: gradeFromScore(overallAiScore),
        avgAnnualAppreciation: appr,
        equity,
        netWorthContribution: Math.round(equity * 0.94),
        monthlyAppreciation: Math.round((estimatedMarketValue * (appr / 100)) / 12),
        annualAppreciation: Math.round(estimatedMarketValue * (appr / 100)),
        futureValues,
        breakdown: buildValuationBreakdown(
            property,
            market,
            estimatedMarketValue,
            property.bondBalance
        ),
        categoryScores,
        overallAiScore,
        improvements,
        forecasts: {
            conservative: buildForecasts(estimatedMarketValue, equity, marketForForecasts, 'conservative'),
            expected: buildForecasts(estimatedMarketValue, equity, marketForForecasts, 'expected'),
            optimistic: buildForecasts(estimatedMarketValue, equity, marketForForecasts, 'optimistic'),
        },
        comparisons: {},
        healthItems: buildPropertyHealth(property),
        alerts: buildSmartAlerts(market, property),
        lastUpdated: new Date().toISOString(),
        marketStatus,
        sellSuggestion,
        valuationBasis,
        valuationDisclaimer,
    };

    return {
        ...snapshotBase,
        comparisons: buildComparisons(property, snapshotBase),
    };
}

export {
    BLANK_PROPERTY,
    DEMO_MARKET,
    DEMO_PROPERTY,
    NEUTRAL_MARKET,
};
