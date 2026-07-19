export type ForecastScenario = 'conservative' | 'expected' | 'optimistic';
export type MarketTemperature = 'cold' | 'cool' | 'balanced' | 'warm' | 'hot';
export type InvestmentGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
export type DifficultyLevel = 'Easy' | 'Moderate' | 'Complex' | 'Major Project';
export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Optional';

export interface PropertyProfile {
    id: string;
    address: string;
    suburb: string;
    municipality: string;
    province: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    garages: number;
    landSizeSqm: number;
    floorSizeSqm: number;
    yearBuilt: number;
    municipalValuation: number;
    purchasePrice: number;
    purchaseDate: string;
    bondBalance: number;
    existingFeatures: string[];
    conditionScore: number;
}

export interface MarketContext {
    avgPropertyPrice: number;
    avgSellingPrice: number;
    avgAskingPrice: number;
    avgDaysOnMarket: number;
    buyerDemand: number;
    sellerCompetition: number;
    rentalDemand: number;
    luxuryDemand: number;
    investorDemand: number;
    marketTemperature: MarketTemperature;
    propertiesSold90d: number;
    activeListings: number;
    priceGrowthYoY: number;
    inventoryMonths: number;
    pricePerSqm: number;
    inflationRate: number;
    primeInterestRate: number;
    populationGrowth: number;
    employmentGrowth: number;
    historicalAppreciation: number;
    supplyDemandRatio: number;
    crimeIndex: number;
    schoolScore: number;
    transportScore: number;
    plannedDevelopments: string[];
    infrastructureProjects: string[];
}

export interface ValuationBreakdownItem {
    id: string;
    label: string;
    amount: number;
    percentage: number;
    explanation: string;
    color: string;
}

export interface CategoryScore {
    id: string;
    label: string;
    score: number;
    benchmark: number;
    explanation: string;
    suggestions: string[];
}

export interface ImprovementRecommendation {
    id: string;
    name: string;
    category: string;
    estimatedCost: number;
    estimatedValueIncrease: number;
    estimatedRoi: number;
    expectedProfit: number;
    timeWeeks: number;
    difficulty: DifficultyLevel;
    popularity: number;
    buyerDemandScore: number;
    sustainabilityRating: number;
    marketImpact: number;
    priority: PriorityLevel;
    confidence: number;
    explanation: string;
    factors: string[];
}

export interface SimulatorMetrics {
    currentValue: number;
    potentialValue: number;
    totalRenovationCost: number;
    totalEstimatedProfit: number;
    roi: number;
    equity: number;
    futureAppreciation: number;
    estimatedSellingPrice: number;
    estimatedRentalIncrease: number;
    estimatedDaysOnMarket: number;
}

export interface BudgetPlan {
    budget: number;
    budgetUsed: number;
    remainingBudget: number;
    expectedValueIncrease: number;
    expectedRoi: number;
    suggestedOrder: string[];
    estimatedCompletionWeeks: number;
    selectedImprovementIds: string[];
}

export interface ForecastPoint {
    year: number;
    value: number;
    equity: number;
    appreciation: number;
}

export interface ComparisonRow {
    label: string;
    subject: number | string;
    benchmark: number | string;
    unit?: string;
    higherIsBetter?: boolean;
}

export interface PropertyHealthItem {
    id: string;
    label: string;
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    annualMaintenanceCost: number;
    recommendation: string;
}

export interface SmartAlert {
    id: string;
    type: string;
    title: string;
    message: string;
    severity: 'info' | 'opportunity' | 'warning';
    timestamp: string;
}

/** Sell estimate from purchase price, compound growth, location & completed upgrades */
export type InvestmentSignal = 'under' | 'balanced' | 'caution' | 'over';
export type AcquisitionType = 'purchased' | 'bought_cash' | 'inherited' | 'family_home';

export interface SaleProceedsLine {
    id: string;
    label: string;
    amount: number;
    note?: string;
}

/** Extra seller cost / tax line deducted from sale proceeds */
export interface SaleDeductible {
    id: string;
    label: string;
    amount: number;
    note?: string;
}

/** Illustrative SARS CGT estimate for an individual disposing of SA residential property */
export interface CgtEstimate {
    proceeds: number;
    baseCost: number;
    /** True when base cost was assumed (e.g. inherited with no value entered) */
    baseCostAssumed: boolean;
    sellingCosts: number;
    capitalGain: number;
    isPrimaryResidence: boolean;
    primaryResidenceExclusion: number;
    primaryResidenceExclusionApplied: number;
    annualExclusion: number;
    netCapitalGain: number;
    inclusionRatePct: number;
    taxableCapitalGain: number;
    marginalTaxRatePct: number;
    /** Estimated amount payable to SARS */
    estimatedCgt: number;
    maxEffectiveRatePct: number;
}

/** Typical SA seller proceeds after bank, agent & selling costs */
export interface SaleProceedsBreakdown {
    grossSalePrice: number;
    /** Whether gross came from user target sale or the model suggestion */
    salePriceSource: 'suggested' | 'custom';
    purchasePrice: number;
    renovationSpend: number;
    costBasis: number;
    toBank: number;
    toAgent: number;
    /** Commission % before VAT (0 when fixed amount used) */
    agentCommissionRatePct: number;
    /** True when commission was entered as a fixed rand amount */
    agentCommissionIsFixed: boolean;
    /** Whether VAT was added on top of the % commission */
    agentCommissionIncludesVat: boolean;
    /** All non-bank, non-agent deductions (fees, rates, taxes, custom) */
    deductibles: SaleDeductible[];
    ratesAndTaxesOwed: number;
    capitalGainsTax: number;
    /** Auto SARS CGT working (null if manually overridden with no calc) */
    cgtEstimate: CgtEstimate | null;
    otherSellerCosts: number;
    totalDeductions: number;
    /** Cash left after bond, agent commission and typical seller costs */
    netToSeller: number;
    /** Economic profit vs cost basis (sale − agent − other costs − cost basis) */
    estimatedProfit: number;
    lines: SaleProceedsLine[];
}

export interface SellSuggestion {
    purchasePrice: number;
    yearsOwned: number;
    annualAppreciationPct: number;
    compoundedPurchaseValue: number;
    improvementContribution: number;
    /** Rough amount the owner spent on renovations (ZAR), if provided */
    renovationSpend: number;
    suburbAverage: number;
    suggestedSellPrice: number;
    completedImprovementNames: string[];
    acquisitionType: AcquisitionType;
    acquisitionLabel: string;
    /** True when inherited or family home (no / optional purchase cost) */
    inherited: boolean;
    underBond: boolean;
    bondBalance: number;
    /** Purchase (if any) + renovation spend */
    costBasis: number;
    /** Cash left after settling the bond, agent fees and typical selling costs */
    standToGain: number;
    /** Profit vs cost basis after selling costs (excludes bond as it settles liability) */
    gainVsInvestment: number;
    investmentSignal: InvestmentSignal;
    investmentSignalLabel: string;
    investmentSignalDetail: string;
    proceeds: SaleProceedsBreakdown;
}

export interface OptimizerSnapshot {
    property: PropertyProfile;
    market: MarketContext;
    estimatedMarketValue: number;
    estimatedRentalValue: number;
    confidenceScore: number;
    growthSincePurchase: number;
    investmentGrade: InvestmentGrade;
    avgAnnualAppreciation: number;
    equity: number;
    netWorthContribution: number;
    monthlyAppreciation: number;
    annualAppreciation: number;
    futureValues: Record<1 | 3 | 5 | 10 | 20, number>;
    breakdown: ValuationBreakdownItem[];
    categoryScores: CategoryScore[];
    overallAiScore: number;
    improvements: ImprovementRecommendation[];
    forecasts: Record<ForecastScenario, ForecastPoint[]>;
    comparisons: Record<string, ComparisonRow[]>;
    healthItems: PropertyHealthItem[];
    alerts: SmartAlert[];
    lastUpdated: string;
    marketStatus: string;
    /** Present when user entered purchase price / completed upgrades */
    sellSuggestion?: SellSuggestion;
}

export interface ValuationEngineWeights {
    comparableSales: number;
    landValue: number;
    replacementCost: number;
    locationPremium: number;
    marketPremium: number;
    demandPremium: number;
    conditionFactor: number;
    ageDepreciation: number;
    securityPremium: number;
    energyEfficiency: number;
    smartHome: number;
    schoolProximity: number;
    transportAccess: number;
    crimeAdjustment: number;
    infrastructure: number;
    populationGrowth: number;
    inflation: number;
    interestRate: number;
    historicalAppreciation: number;
    supplyDemand: number;
    renovationQuality: number;
    buyerPreferences: number;
}
