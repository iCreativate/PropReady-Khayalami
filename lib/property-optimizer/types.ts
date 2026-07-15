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
