/** Smart Bond Optimizer — shared types (South African home-loan planning). */

export type InterestType = 'variable' | 'fixed';
export type PropertyKind = 'residential' | 'rental' | 'holiday' | 'commercial';
export type AmortisationView = 'monthly' | 'quarterly' | 'yearly';
export type SboTab =
    | 'overview'
    | 'optimizer'
    | 'savings'
    | 'equity'
    | 'investment'
    | 'reports'
    | 'learn'
    // legacy aliases kept for autosaved localStorage
    | 'rates'
    | 'portfolio'
    | 'refinance'
    | 'scenarios'
    | 'goals'
    | 'knowledge'
    | 'calculators';

export type BondProfile = {
    propertyValue: number;
    originalLoanAmount: number;
    outstandingBalance: number;
    annualInterestRate: number;
    interestType: InterestType;
    remainingTermMonths: number;
    originalTermMonths: number;
    monthlyRepayment: number;
    extraMonthly: number;
    annualLumpSum: number;
    depositAmount: number;
    annualAppreciationPct: number;
    monthlyIncome: number;
    monthlyExpenses: number;
};

export type PortfolioProperty = {
    id: string;
    name: string;
    kind: PropertyKind;
    value: number;
    loanBalance: number;
    monthlyRent: number;
    monthlyExpenses: number;
    rate: number;
    remainingMonths: number;
};

export type InvestmentPlanInput = {
    monthlyIncome: number;
    monthlyExpenses: number;
    existingBondRepayment: number;
    rentalIncome: number;
    savings: number;
    depositAmount: number;
    targetPrice: number;
    maintenanceMonthly: number;
    insuranceMonthly: number;
    ratesMonthly: number;
    vacancyMonthsPerYear: number;
    interestRate: number;
    loanTermYears: number;
};

export type GoalKind =
    | 'payoff_target'
    | 'debt_free_retirement'
    | 'reduce_repayment'
    | 'second_property'
    | 'portfolio_five'
    | 'max_equity'
    | 'passive_income';

export type ScenarioOverrides = {
    rateDeltaPct: number;
    extraMonthly: number;
    annualBonus: number;
    lumpSum: number;
    rentalGrowthPct: number;
    inflationPct: number;
    appreciationPct: number;
    unexpectedExpense: number;
    termMonthsDelta: number;
};

export type AmortisationRow = {
    period: number;
    label: string;
    payment: number;
    principal: number;
    interest: number;
    extra: number;
    balance: number;
    cumulativeInterest: number;
    cumulativePrincipal: number;
};

export type InsightKind = 'fact' | 'estimate' | 'assumption' | 'opportunity';

export type FinancialInsight = {
    id: string;
    kind: InsightKind;
    title: string;
    body: string;
};

export type ScoreBreakdown = {
    score: number;
    label: string;
    factors: Array<{ key: string; label: string; score: number; weight: number; note: string }>;
};

export const DEFAULT_BOND_PROFILE: BondProfile = {
    propertyValue: 1_850_000,
    originalLoanAmount: 1_480_000,
    outstandingBalance: 1_265_000,
    annualInterestRate: 11.75,
    interestType: 'variable',
    remainingTermMonths: 216,
    originalTermMonths: 240,
    monthlyRepayment: 0,
    extraMonthly: 1_500,
    annualLumpSum: 10_000,
    depositAmount: 370_000,
    annualAppreciationPct: 4.5,
    monthlyIncome: 55_000,
    monthlyExpenses: 28_000,
};

export const DEFAULT_SCENARIO: ScenarioOverrides = {
    rateDeltaPct: 0,
    extraMonthly: 0,
    annualBonus: 0,
    lumpSum: 0,
    rentalGrowthPct: 3,
    inflationPct: 5,
    appreciationPct: 4.5,
    unexpectedExpense: 0,
    termMonthsDelta: 0,
};

export const SA_PRIME_REFERENCE = 11.75;
export const SA_REPO_REFERENCE = 8.25;
export const DISCLAIMER =
    'Smart Bond Optimizer provides educational estimates and planning tools only. It is not regulated financial advice, a credit assessment, or a guarantee of loan approval, interest savings, property appreciation, or investment returns. Actual outcomes depend on lender policies, affordability assessments, credit history, valuations, fees, and market conditions.';
