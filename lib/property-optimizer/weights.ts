import type { ValuationEngineWeights } from './types';

/** Configurable factor weights — tune as more SA transaction data becomes available. */
export const DEFAULT_VALUATION_WEIGHTS: ValuationEngineWeights = {
    comparableSales: 0.28,
    landValue: 0.12,
    replacementCost: 0.08,
    locationPremium: 0.1,
    marketPremium: 0.06,
    demandPremium: 0.07,
    conditionFactor: 0.05,
    ageDepreciation: 0.03,
    securityPremium: 0.04,
    energyEfficiency: 0.03,
    smartHome: 0.02,
    schoolProximity: 0.04,
    transportAccess: 0.03,
    crimeAdjustment: 0.04,
    infrastructure: 0.04,
    populationGrowth: 0.03,
    inflation: 0.02,
    interestRate: 0.02,
    historicalAppreciation: 0.04,
    supplyDemand: 0.05,
    renovationQuality: 0.06,
    buyerPreferences: 0.05,
};

export function mergeWeights(overrides: Partial<ValuationEngineWeights>): ValuationEngineWeights {
    return { ...DEFAULT_VALUATION_WEIGHTS, ...overrides };
}
