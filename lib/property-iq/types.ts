export type PropertyUse = 'primary' | 'investment' | 'vacant';

/** Physical / legal property kind (not the same as use/occupancy). */
export type PropertyType =
    | 'house'
    | 'apartment'
    | 'townhouse'
    | 'duplex'
    | 'vacant_land'
    | 'self_built'
    | 'smallholding'
    | 'commercial'
    | 'other';

export const PROPERTY_TYPE_OPTIONS: { id: PropertyType; label: string; hint: string }[] = [
    { id: 'house', label: 'House', hint: 'Freehold house' },
    { id: 'apartment', label: 'Apartment / Flat', hint: 'Sectional title unit' },
    { id: 'townhouse', label: 'Townhouse', hint: 'Cluster or complex' },
    { id: 'duplex', label: 'Duplex', hint: 'Semi-detached' },
    { id: 'vacant_land', label: 'Vacant land', hint: 'Stand with no dwelling yet' },
    {
        id: 'self_built',
        label: 'Built on purchased land',
        hint: 'Bought vacant land and built — value land + dwelling',
    },
    { id: 'smallholding', label: 'Smallholding', hint: 'Agricultural / lifestyle plot' },
    { id: 'commercial', label: 'Commercial', hint: 'Retail, office or industrial' },
    { id: 'other', label: 'Other', hint: 'Anything else' },
];

export function propertyTypeLabel(type: PropertyType | string | undefined | null): string {
    const match = PROPERTY_TYPE_OPTIONS.find((o) => o.id === type);
    return match?.label ?? 'House';
}

export function coercePropertyType(value: unknown): PropertyType {
    if (typeof value === 'string' && PROPERTY_TYPE_OPTIONS.some((o) => o.id === value)) {
        return value as PropertyType;
    }
    return 'house';
}

/** Stage spend when a dwelling was built on purchased land. */
export type BuildCostBreakdown = {
    /** Earthworks, foundations, ground slab */
    foundation: number;
    /** Walls, roof, windows, doors, structural shell */
    structure: number;
    /** Kitchen, bathrooms, flooring, paint, cupboards, fittings */
    finishes: number;
};

export const BUILD_COST_STAGE_OPTIONS: {
    id: keyof BuildCostBreakdown;
    label: string;
    hint: string;
}[] = [
    {
        id: 'foundation',
        label: 'Foundation & earthworks',
        hint: 'Excavation, foundations, ground slab',
    },
    {
        id: 'structure',
        label: 'Structure & roof',
        hint: 'Walls, roof structure, windows and doors',
    },
    {
        id: 'finishes',
        label: 'Finishes & fittings',
        hint: 'Kitchen, bathrooms, flooring, paint, cupboards',
    },
];

export function emptyBuildCostBreakdown(): BuildCostBreakdown {
    return { foundation: 0, structure: 0, finishes: 0 };
}

export function coerceBuildCostBreakdown(value: unknown): BuildCostBreakdown {
    const src =
        value && typeof value === 'object' ? (value as Partial<BuildCostBreakdown>) : {};
    const n = (v: unknown) =>
        typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0;
    return {
        foundation: n(src.foundation),
        structure: n(src.structure),
        finishes: n(src.finishes),
    };
}

/** Sum of foundation → finishes, or legacy lump `buildCost` if stages are empty. */
export function totalBuildCostOf(property: {
    buildCost?: number;
    buildCostBreakdown?: Partial<BuildCostBreakdown> | null;
}): number {
    const b = coerceBuildCostBreakdown(property.buildCostBreakdown);
    const staged = b.foundation + b.structure + b.finishes;
    if (staged > 0) return Math.round(staged);
    const lump = property.buildCost;
    return typeof lump === 'number' && Number.isFinite(lump) ? Math.max(0, Math.round(lump)) : 0;
}

/** How construction was paid — bank/building loan vs own cash. */
export type BuildFunding = 'loan' | 'self';

export const BUILD_FUNDING_OPTIONS: { id: BuildFunding; label: string; hint: string }[] = [
    {
        id: 'loan',
        label: 'Bank / loan financed',
        hint: 'Building loan or bond used for construction',
    },
    {
        id: 'self',
        label: 'Self financed',
        hint: 'Paid from own cash or savings — no construction loan',
    },
];

export function buildFundingLabel(funding: BuildFunding | string | undefined | null): string {
    const match = BUILD_FUNDING_OPTIONS.find((o) => o.id === funding);
    return match?.label ?? 'Self financed';
}

export function coerceBuildFunding(value: unknown): BuildFunding {
    if (value === 'loan' || value === 'self') return value;
    return 'self';
}

/** How the purchase was paid — cash or home-loan financed. */
export type PurchaseFunding = 'cash' | 'bond';

export const PURCHASE_FUNDING_OPTIONS: { id: PurchaseFunding; label: string; hint: string }[] = [
    { id: 'cash', label: 'Cash purchase', hint: 'Paid in full — no bond' },
    { id: 'bond', label: 'Bond / financed', hint: 'Home loan from a bank' },
];

export function purchaseFundingLabel(funding: PurchaseFunding | string | undefined | null): string {
    const match = PURCHASE_FUNDING_OPTIONS.find((o) => o.id === funding);
    return match?.label ?? 'Bond / financed';
}

export function coercePurchaseFunding(
    value: unknown,
    hints?: {
        originalBondAmount?: number;
        outstandingBond?: number;
        interestRate?: number;
        monthlyBond?: number;
        purchasePrice?: number;
        depositPaid?: number;
    }
): PurchaseFunding {
    if (value === 'cash' || value === 'bond') return value;
    if (hints) {
        if (
            (hints.originalBondAmount ?? 0) > 0 ||
            (hints.outstandingBond ?? 0) > 0 ||
            (hints.interestRate ?? 0) > 0 ||
            (hints.monthlyBond ?? 0) > 0
        ) {
            return 'bond';
        }
        const price = hints.purchasePrice ?? 0;
        const deposit = hints.depositPaid ?? 0;
        if (price > 0 && deposit >= price) return 'cash';
    }
    return 'bond';
}

/** Physical / market condition of the property. */
export type PropertyCondition = 'excellent' | 'good' | 'average' | 'fair' | 'poor';

export const PROPERTY_CONDITION_OPTIONS: {
    id: PropertyCondition;
    label: string;
    hint: string;
    score: number;
}[] = [
    { id: 'excellent', label: 'Excellent', hint: 'Turnkey / recently renovated', score: 92 },
    { id: 'good', label: 'Good', hint: 'Well maintained, minor wear', score: 78 },
    { id: 'average', label: 'Average', hint: 'Typical for age and area', score: 62 },
    { id: 'fair', label: 'Fair', hint: 'Needs updates soon', score: 48 },
    { id: 'poor', label: 'Needs work', hint: 'Significant repairs or neglect', score: 32 },
];

export function propertyConditionLabel(condition: PropertyCondition | string | undefined | null): string {
    const match = PROPERTY_CONDITION_OPTIONS.find((o) => o.id === condition);
    return match?.label ?? 'Average';
}

export function propertyConditionScore(condition: PropertyCondition | string | undefined | null): number {
    const match = PROPERTY_CONDITION_OPTIONS.find((o) => o.id === condition);
    return match?.score ?? 62;
}

export function coercePropertyCondition(value: unknown): PropertyCondition {
    if (typeof value === 'string' && PROPERTY_CONDITION_OPTIONS.some((o) => o.id === value)) {
        return value as PropertyCondition;
    }
    return 'average';
}

/** Auto = compound from purchase; manual = user override. */
export type CurrentValueMode = 'auto' | 'manual';

export function coerceCurrentValueMode(
    value: unknown,
    hints?: { currentValue?: number }
): CurrentValueMode {
    if (value === 'manual') return 'manual';
    if (value === 'auto') return 'auto';
    // Legacy saves: keep an existing figure until the user opts into auto.
    if ((hints?.currentValue ?? 0) > 0) return 'manual';
    return 'auto';
}

function coerceNonNegNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        if (Number.isFinite(n)) return Math.max(0, n);
    }
    return fallback;
}

/** Property24-style amenity / feature tags. */
export type PropertyAmenityId =
    | 'pool'
    | 'garden'
    | 'patio'
    | 'balcony'
    | 'braai'
    | 'irrigation'
    | 'borehole'
    | 'electric_fence'
    | 'access_control'
    | 'alarm'
    | 'cctv'
    | 'flatlet'
    | 'staff_quarters'
    | 'air_conditioning'
    | 'fireplace'
    | 'solar_geyser'
    | 'solar_panels'
    | 'fibre'
    | 'satellite'
    | 'built_in_cupboards'
    | 'walk_in_closet'
    | 'scullery'
    | 'laundry'
    | 'wheelchair_access'
    | 'pets_allowed'
    | 'furnished'
    | 'generator'
    | 'inverter'
    | 'gas_stove'
    | 'underfloor_heating'
    | 'sea_views'
    | 'mountain_views'
    | 'golf_estate'
    | 'security_estate';

export type PropertyAmenityGroup = 'Outdoor' | 'Security' | 'Building' | 'Energy' | 'Lifestyle';

export const PROPERTY_AMENITY_OPTIONS: {
    id: PropertyAmenityId;
    label: string;
    group: PropertyAmenityGroup;
}[] = [
    { id: 'pool', label: 'Swimming pool', group: 'Outdoor' },
    { id: 'garden', label: 'Garden', group: 'Outdoor' },
    { id: 'patio', label: 'Patio / deck', group: 'Outdoor' },
    { id: 'balcony', label: 'Balcony', group: 'Outdoor' },
    { id: 'braai', label: 'Braai area', group: 'Outdoor' },
    { id: 'irrigation', label: 'Irrigation', group: 'Outdoor' },
    { id: 'borehole', label: 'Borehole', group: 'Outdoor' },
    { id: 'electric_fence', label: 'Electric fence', group: 'Security' },
    { id: 'access_control', label: 'Access control', group: 'Security' },
    { id: 'alarm', label: 'Alarm system', group: 'Security' },
    { id: 'cctv', label: 'CCTV', group: 'Security' },
    { id: 'security_estate', label: 'Security estate', group: 'Security' },
    { id: 'flatlet', label: 'Flatlet / cottage', group: 'Building' },
    { id: 'staff_quarters', label: 'Staff quarters', group: 'Building' },
    { id: 'air_conditioning', label: 'Air conditioning', group: 'Building' },
    { id: 'fireplace', label: 'Fireplace', group: 'Building' },
    { id: 'built_in_cupboards', label: 'Built-in cupboards', group: 'Building' },
    { id: 'walk_in_closet', label: 'Walk-in closet', group: 'Building' },
    { id: 'scullery', label: 'Scullery', group: 'Building' },
    { id: 'laundry', label: 'Laundry', group: 'Building' },
    { id: 'underfloor_heating', label: 'Underfloor heating', group: 'Building' },
    { id: 'gas_stove', label: 'Gas stove', group: 'Building' },
    { id: 'wheelchair_access', label: 'Wheelchair access', group: 'Building' },
    { id: 'furnished', label: 'Furnished', group: 'Building' },
    { id: 'solar_geyser', label: 'Solar geyser', group: 'Energy' },
    { id: 'solar_panels', label: 'Solar panels', group: 'Energy' },
    { id: 'inverter', label: 'Inverter / battery', group: 'Energy' },
    { id: 'generator', label: 'Generator', group: 'Energy' },
    { id: 'fibre', label: 'Fibre ready', group: 'Lifestyle' },
    { id: 'satellite', label: 'Satellite DSTV', group: 'Lifestyle' },
    { id: 'pets_allowed', label: 'Pets allowed', group: 'Lifestyle' },
    { id: 'sea_views', label: 'Sea views', group: 'Lifestyle' },
    { id: 'mountain_views', label: 'Mountain views', group: 'Lifestyle' },
    { id: 'golf_estate', label: 'Golf estate', group: 'Lifestyle' },
];

const AMENITY_ID_SET = new Set(PROPERTY_AMENITY_OPTIONS.map((o) => o.id));

export function coercePropertyAmenities(value: unknown): PropertyAmenityId[] {
    if (!Array.isArray(value)) return [];
    const out: PropertyAmenityId[] = [];
    for (const item of value) {
        if (typeof item === 'string' && AMENITY_ID_SET.has(item as PropertyAmenityId)) {
            out.push(item as PropertyAmenityId);
        }
    }
    return out;
}

export function propertyAmenityLabel(id: PropertyAmenityId | string): string {
    return PROPERTY_AMENITY_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export type PropertySpecs = {
    bedrooms: number;
    bathrooms: number;
    ensuites: number;
    lounges: number;
    diningRooms: number;
    studies: number;
    domesticRooms: number;
    storeRooms: number;
    garages: number;
    openParking: number;
    floorSizeSqm: number;
    landSizeSqm: number;
    amenities: PropertyAmenityId[];
};

/** Normalise Property24-style room/size/amenity fields from stored JSON. */
export function coercePropertySpecs(p: Partial<PropertySpecs>): PropertySpecs {
    return {
        bedrooms: coerceNonNegNumber(p.bedrooms),
        bathrooms: coerceNonNegNumber(p.bathrooms),
        ensuites: coerceNonNegNumber(p.ensuites),
        lounges: coerceNonNegNumber(p.lounges),
        diningRooms: coerceNonNegNumber(p.diningRooms),
        studies: coerceNonNegNumber(p.studies),
        domesticRooms: coerceNonNegNumber(p.domesticRooms),
        storeRooms: coerceNonNegNumber(p.storeRooms),
        garages: coerceNonNegNumber(p.garages),
        openParking: coerceNonNegNumber(p.openParking),
        floorSizeSqm: coerceNonNegNumber(p.floorSizeSqm),
        landSizeSqm: coerceNonNegNumber(p.landSizeSqm),
        amenities: coercePropertyAmenities(p.amenities),
    };
}

/** Compact specs line e.g. "3 bed · 2 bath · 2 garage · 210 m²". */
export function propertySpecsLabel(p: Partial<PropertySpecs>): string {
    const parts: string[] = [];
    if ((p.bedrooms ?? 0) > 0) parts.push(`${p.bedrooms} bed`);
    if ((p.bathrooms ?? 0) > 0) parts.push(`${p.bathrooms} bath`);
    if ((p.ensuites ?? 0) > 0) parts.push(`${p.ensuites} en-suite`);
    if ((p.lounges ?? 0) > 0) parts.push(`${p.lounges} lounge`);
    if ((p.garages ?? 0) > 0) parts.push(`${p.garages} garage`);
    if ((p.openParking ?? 0) > 0) parts.push(`${p.openParking} parking`);
    if ((p.floorSizeSqm ?? 0) > 0) parts.push(`${Math.round(p.floorSizeSqm!)} m²`);
    if ((p.landSizeSqm ?? 0) > 0) {
        parts.push(`erf ${Math.round(p.landSizeSqm!).toLocaleString('en-ZA')} m²`);
    }
    return parts.join(' · ');
}

/** Long-run SA residential model rate when no custom rate is set (same idea as Value Optimizer). */
export const SA_MODEL_APPRECIATION_PCT = 5;

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
    | 'invoice'
    | 'warranty'
    | 'municipal';

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
    | 'document'
    | 'extra_payment'
    | 'rate_change'
    | 'equity'
    | 'milestone'
    | 'predicted';

export type RenovationCategory =
    | 'Kitchen'
    | 'Bathrooms'
    | 'Flooring'
    | 'Roof'
    | 'Painting'
    | 'Solar'
    | 'Security'
    | 'Landscaping'
    | 'Entertainment'
    | 'Pool'
    | 'Garage'
    | 'Extensions'
    | 'Other';

export type GoalKind =
    | 'property_count'
    | 'passive_income'
    | 'payoff'
    | 'portfolio_value'
    | 'custom';

export type AlertKind =
    | 'lease'
    | 'rates'
    | 'bond'
    | 'interest'
    | 'municipal'
    | 'insurance'
    | 'value'
    | 'milestone'
    | 'opportunity'
    | 'ai';

export type IqExpense = {
    category: string;
    amount: number;
    color: string;
};

export type IqRenovation = {
    id: string;
    room: string;
    category: RenovationCategory | string;
    contractor: string;
    cost: number;
    date: string;
    status: RenovationStatus;
    progress: number;
    estimatedValueAdd: number;
    actualValueAdd: number;
    warranty?: string;
    photos: string[];
    beforeImage: string;
    afterImage: string;
    notes?: string;
};

export type IqTimelineEvent = {
    id: string;
    date: string;
    kind: TimelineKind;
    title: string;
    detail: string;
    predicted?: boolean;
};

export type IqDocument = {
    id: string;
    name: string;
    category: DocCategory;
    uploadedAt: string;
    sizeLabel: string;
    propertyId?: string;
};

export type IqHistoryPoint = {
    month: string;
    value: number;
    equity: number;
    rental: number;
    cashFlow: number;
    growth: number;
};

export type IqTenant = {
    name: string;
    email?: string;
    phone?: string;
    status: 'active' | 'notice' | 'former';
};

export type IqProperty = {
    id: string;
    name: string;
    address: string;
    suburb: string;
    city: string;
    image: string;
    images: string[];
    use: PropertyUse;
    /** House, vacant land, self-built on land, etc. */
    propertyType: PropertyType;
    /** Cash purchase vs bond / financed. */
    purchaseFunding: PurchaseFunding;
    /** Condition used when auto-estimating current value. */
    propertyCondition: PropertyCondition;
    /** Auto compounds from purchase; manual locks a user figure. */
    currentValueMode: CurrentValueMode;
    /** Specs — Property24-style rooms, sizes and amenities. */
    bedrooms: number;
    bathrooms: number;
    ensuites: number;
    lounges: number;
    diningRooms: number;
    studies: number;
    domesticRooms: number;
    storeRooms: number;
    garages: number;
    openParking: number;
    floorSizeSqm: number;
    landSizeSqm: number;
    amenities: PropertyAmenityId[];
    notes: string;

    purchasePrice: number;
    purchaseDate: string;
    transferDate: string | null;
    /**
     * Cost to build the dwelling when type is `self_built` (Bought vacant land and built).
     * Kept in sync with the sum of `buildCostBreakdown` stages when those are set.
     */
    buildCost: number;
    /** Spend from foundation through finishes — used to estimate dwelling value. */
    buildCostBreakdown: BuildCostBreakdown;
    /** Whether construction was bank/loan financed or paid from own funds. */
    buildFunding: BuildFunding;
    /** When the dwelling was completed (defaults to purchase date for compounding if empty). */
    buildCompletionDate: string | null;
    /** Cash deposit paid at purchase (if any). */
    depositPaid: number;
    currentValue: number;
    previousMonthValue: number;

    bank: string;
    bondNumber: string;
    interestRate: number;
    bondTermMonths: number;
    originalBondAmount: number;
    outstandingBond: number;
    previousMonthBond: number;
    monthlyBond: number;
    remainingTermMonths: number;
    extraMonthlyPayment: number;
    oneOffPayments: { id: string; date: string; amount: number; note: string }[];

    homeInsurance: number;
    municipalRates: number;
    levies: number;
    maintenanceBudget: number;
    propertyTaxes: number;
    utilities: number;
    propertyManager: string;

    rentalIncome: number;
    previousMonthRental: number;
    monthlyExpenses: number;
    occupancyRate: number;
    vacancyDaysYtd: number;
    latePaymentsYtd: number;
    expectedAnnualIncreasePct: number;
    leaseExpiry: string | null;
    leaseStart: string | null;
    rentalEscalationPct: number;
    depositHeld: number;
    tenantStatus: 'occupied' | 'vacant' | 'notice' | 'owner-occupied';
    tenants: IqTenant[];
    leaseAgreementName: string | null;

    healthScore: number;
    aiScore: number;

    expenses: IqExpense[];
    renovations: IqRenovation[];
    timeline: IqTimelineEvent[];
    documents: IqDocument[];
    history: IqHistoryPoint[];
};

export type PortfolioGoal = {
    id: string;
    kind: GoalKind;
    title: string;
    target: number;
    unit: 'properties' | 'zar' | 'percent' | 'date';
    targetDate?: string;
    notes?: string;
};

export type CompanionAlert = {
    id: string;
    kind: AlertKind;
    title: string;
    body: string;
    date: string;
    propertyId?: string;
    read: boolean;
    priority: 'low' | 'medium' | 'high';
};

export type CompanionState = {
    version: 1;
    properties: IqProperty[];
    goals: PortfolioGoal[];
    alerts: CompanionAlert[];
    activePropertyId: string | null;
};

export type ChartRange = '1m' | '6m' | '1y' | '5y' | 'life';
export type ChartMetric = 'value' | 'equity' | 'rental' | 'cashflow' | 'growth';

export type BondSimInput = {
    extraMonthly: number;
    annualLump: number;
    biWeekly: boolean;
    refinanceRate: number | null;
};

export const RENOVATION_CATEGORIES: RenovationCategory[] = [
    'Kitchen',
    'Bathrooms',
    'Flooring',
    'Roof',
    'Painting',
    'Solar',
    'Security',
    'Landscaping',
    'Entertainment',
    'Pool',
    'Garage',
    'Extensions',
    'Other',
];
