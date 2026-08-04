export type PropertyUse = 'primary' | 'investment' | 'vacant';

export type RenovationStatus = 'planned' | 'in_progress' | 'completed';

export type DocCategory =
    | 'title'
    | 'bond'
    | 'transfer'
    | 'insurance'
    | 'compliance'
    | 'valuation'
    | 'lease'
    | 'inspection'
    | 'renovation'
    | 'invoice';

export type TimelineKind =
    | 'purchase'
    | 'transfer'
    | 'bond'
    | 'renovation'
    | 'tenant'
    | 'rent'
    | 'maintenance'
    | 'refinance'
    | 'valuation'
    | 'document';

export type IqProperty = {
    id: string;
    name: string;
    address: string;
    suburb: string;
    city: string;
    image: string;
    use: PropertyUse;
    purchasePrice: number;
    purchaseDate: string;
    currentValue: number;
    outstandingBond: number;
    interestRate: number;
    monthlyBond: number;
    remainingTermMonths: number;
    rentalIncome: number;
    monthlyExpenses: number;
    occupancyRate: number;
    leaseExpiry: string | null;
    tenantStatus: 'occupied' | 'vacant' | 'notice' | 'owner-occupied';
    aiScore: number;
    expenses: { category: string; amount: number; color: string }[];
    renovations: {
        id: string;
        room: string;
        category: string;
        contractor: string;
        cost: number;
        status: RenovationStatus;
        progress: number;
        estimatedValueAdd: number;
        actualValueAdd: number;
        beforeImage: string;
        afterImage: string;
    }[];
    timeline: {
        id: string;
        date: string;
        kind: TimelineKind;
        title: string;
        detail: string;
    }[];
    documents: {
        id: string;
        name: string;
        category: DocCategory;
        uploadedAt: string;
        sizeLabel: string;
    }[];
    /** Monthly series for charts — last 24 points approx */
    history: {
        month: string;
        value: number;
        equity: number;
        rental: number;
        cashFlow: number;
        growth: number;
    }[];
};

export type ChartRange = '1m' | '6m' | '1y' | '5y' | 'life';
export type ChartMetric = 'value' | 'equity' | 'rental' | 'cashflow' | 'growth';

export type BondSimInput = {
    extraMonthly: number;
    annualLump: number;
    biWeekly: boolean;
    refinanceRate: number | null;
};
