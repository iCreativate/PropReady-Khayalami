import type { MarketContext, PropertyProfile } from './types';
import { IMPROVEMENT_TEMPLATES } from './improvements';
import {
    findSuburbMarketRecord,
    getLocationSuggestions as getSuburbLocationSuggestions,
    suburbMarketToAreaProfile,
    type SuburbMarketRecord,
} from './suburb-market';

export interface LocationInput {
    suburb: string;
    municipality?: string;
    province?: string;
    streetAddress?: string;
    /** Freehold / sectional title / cluster, etc. */
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    garages?: number;
    floorSizeSqm?: number;
    landSizeSqm?: number;
    /** What the owner paid (ZAR) */
    purchasePrice?: number;
    /** ISO date YYYY-MM-DD */
    purchaseDate?: string;
    /** Improvement template IDs already completed on the property */
    completedImprovementIds?: string[];
    /** Rough spend per selected improvement template id (ZAR) */
    improvementSpendById?: Record<string, number>;
    /** Custom “other” improvements the owner added */
    otherImprovements?: { id: string; label: string; spend: number }[];
    /** Total renovation spend (sum of per-card amounts) — preferred for engine */
    renovationSpend?: number;
    /** @deprecated Prefer otherImprovements — kept for older callers */
    otherImprovementsNote?: string;
    /**
     * How the owner acquired the property.
     * - purchased: standard purchase (default) — may still have a bond
     * - bought_cash: paid in full, no bond
     * - inherited: received via inheritance
     * - family_home: family / generational home
     */
    acquisitionType?: 'purchased' | 'bought_cash' | 'inherited' | 'family_home';
    /** @deprecated Prefer acquisitionType === 'inherited' | 'family_home' */
    inherited?: boolean;
    /** Property currently has a bond / mortgage (ignored when bought_cash) */
    underBond?: boolean;
    /** Outstanding bond balance (ZAR) */
    bondBalance?: number;
    /**
     * Target / expected sale price for proceeds (ZAR).
     * When set, deductions use this instead of the model suggestion.
     */
    expectedSalePrice?: number;
    /** Agent commission % before VAT (typical 5–7.5). Default 6.5 */
    agentCommissionPct?: number;
    /**
     * Fixed commission amount in ZAR (overrides %).
     * Enter the total the agent will receive (as agreed on the mandate).
     */
    agentCommissionAmount?: number;
    /**
     * When using %, if false (default) add 15% VAT on commission.
     * Set true if your mandate rate already includes VAT.
     */
    agentCommissionIncludesVat?: boolean;
    /**
     * Seller deductibles: rates/taxes owed, CGT, clearance fees, custom costs.
     * When provided, these replace the engine’s illustrative fee estimates.
     * The `cgt` line is normally auto-calculated unless cgtManualOverride is true.
     */
    deductibles?: { id: string; label: string; amount: number; note?: string }[];
    /** Ordinarily occupied as your main home — unlocks primary residence CGT exclusion */
    isPrimaryResidence?: boolean;
    /** Your top marginal income tax rate % (used for CGT). Default 45 */
    marginalTaxRatePct?: number;
    /** When true, keep the cgt deductible amount as entered (do not auto-replace) */
    cgtManualOverride?: boolean;
}

/** Alias used by the property-details form */
export type PropertyDetailsInput = LocationInput;

export interface AreaProfile {
    key: string;
    suburb: string;
    municipality: string;
    province: string;
    /** Verified suburb average from Property24 when available */
    dataSource?: string;
    dataQuality?: 'verified' | 'reported' | 'estimated' | 'insufficient';
    priceYear?: number;
    city?: string;
    pricePerSqm: number;
    avgPropertyPrice: number;
    /** Model assumption only — Property24 JSON has no YoY series yet. */
    historicalAppreciation: number;
    buyerDemand: number;
    rentalDemand: number;
    luxuryDemand: number;
    schoolScore: number;
    transportScore: number;
    crimeIndex: number;
    marketTemperature: MarketContext['marketTemperature'];
    lifestyleScore: number;
    walkabilityScore: number;
    investmentScore: number;
    plannedDevelopments: string[];
    infrastructureProjects: string[];
    /** Typical floor size heuristic for deriving R/m² from suburb average */
    typicalFloorSqm: number;
    typicalLandSqm: number;
}

export interface SuburbInsightsData {
    schools: { name: string; rating?: number; distance: string }[];
    universities: { name: string; distance: string }[];
    hospitals: { name: string; distance: string }[];
    shoppingCentres: { name: string; distance: string }[];
    parks: { name: string; distance: string }[];
    publicTransport: { name: string; distance: string }[];
    crimeTrend: string;
    lifestyleScore: number;
    walkabilityScore: number;
    investmentScore: number;
}

const PROVINCE_DEFAULTS: Record<string, Partial<AreaProfile>> = {
    Gauteng: { pricePerSqm: 11_500, historicalAppreciation: 6.5, buyerDemand: 72 },
    'Western Cape': { pricePerSqm: 14_200, historicalAppreciation: 7.8, buyerDemand: 80 },
    KwaZulu: { pricePerSqm: 9_800, historicalAppreciation: 5.9, buyerDemand: 68 },
    'KwaZulu-Natal': { pricePerSqm: 9_800, historicalAppreciation: 5.9, buyerDemand: 68 },
    'Eastern Cape': { pricePerSqm: 6_200, historicalAppreciation: 4.2, buyerDemand: 58 },
    'Free State': { pricePerSqm: 5_800, historicalAppreciation: 3.8, buyerDemand: 55 },
    Limpopo: { pricePerSqm: 5_200, historicalAppreciation: 4.0, buyerDemand: 52 },
    Mpumalanga: { pricePerSqm: 6_800, historicalAppreciation: 4.5, buyerDemand: 56 },
    'North West': { pricePerSqm: 5_500, historicalAppreciation: 3.5, buyerDemand: 50 },
    'Northern Cape': { pricePerSqm: 5_000, historicalAppreciation: 3.2, buyerDemand: 48 },
};

export const AREA_PROFILES: AreaProfile[] = [
    {
        key: 'bryanston',
        suburb: 'Bryanston',
        municipality: 'City of Johannesburg',
        province: 'Gauteng',
        pricePerSqm: 13_125,
        avgPropertyPrice: 4_200_000,
        historicalAppreciation: 7.1,
        buyerDemand: 78,
        rentalDemand: 74,
        luxuryDemand: 81,
        schoolScore: 86,
        transportScore: 71,
        crimeIndex: 42,
        marketTemperature: 'warm',
        lifestyleScore: 88,
        walkabilityScore: 54,
        investmentScore: 82,
        plannedDevelopments: ['Sandton Gateway mixed-use precinct (2027)', 'William Nicol BRT expansion'],
        infrastructureProjects: ['PWV 14 improvements', 'Johannesburg Water bulk upgrade'],
        typicalFloorSqm: 320,
        typicalLandSqm: 850,
    },
    {
        key: 'sandton',
        suburb: 'Sandton',
        municipality: 'City of Johannesburg',
        province: 'Gauteng',
        pricePerSqm: 16_800,
        avgPropertyPrice: 5_400_000,
        historicalAppreciation: 7.4,
        buyerDemand: 85,
        rentalDemand: 80,
        luxuryDemand: 92,
        schoolScore: 84,
        transportScore: 88,
        crimeIndex: 38,
        marketTemperature: 'hot',
        lifestyleScore: 94,
        walkabilityScore: 72,
        investmentScore: 88,
        plannedDevelopments: ['Sandton CBD densification', 'Grayston Drive upgrade'],
        infrastructureProjects: ['Gautrain station upgrades', 'Smart city fibre ring'],
        typicalFloorSqm: 280,
        typicalLandSqm: 650,
    },
    {
        key: 'centurion',
        suburb: 'Centurion',
        municipality: 'City of Tshwane',
        province: 'Gauteng',
        pricePerSqm: 9_200,
        avgPropertyPrice: 2_850_000,
        historicalAppreciation: 6.2,
        buyerDemand: 76,
        rentalDemand: 78,
        luxuryDemand: 65,
        schoolScore: 79,
        transportScore: 75,
        crimeIndex: 48,
        marketTemperature: 'warm',
        lifestyleScore: 80,
        walkabilityScore: 48,
        investmentScore: 76,
        plannedDevelopments: ['Centurion lake precinct', 'Irene link road'],
        infrastructureProjects: ['Gautrain bus expansion', 'Water reservoir upgrade'],
        typicalFloorSqm: 300,
        typicalLandSqm: 900,
    },
    {
        key: 'cape-town-sea-point',
        suburb: 'Sea Point',
        municipality: 'City of Cape Town',
        province: 'Western Cape',
        pricePerSqm: 22_500,
        avgPropertyPrice: 4_800_000,
        historicalAppreciation: 8.2,
        buyerDemand: 82,
        rentalDemand: 88,
        luxuryDemand: 90,
        schoolScore: 78,
        transportScore: 82,
        crimeIndex: 52,
        marketTemperature: 'hot',
        lifestyleScore: 96,
        walkabilityScore: 88,
        investmentScore: 85,
        plannedDevelopments: ['Sea Point promenade upgrade', 'Atlantic Seaboard densification'],
        infrastructureProjects: ['Coastal road stabilisation', 'Water resilience project'],
        typicalFloorSqm: 180,
        typicalLandSqm: 0,
    },
    {
        key: 'umhlanga',
        suburb: 'Umhlanga',
        municipality: 'eThekwini',
        province: 'KwaZulu-Natal',
        pricePerSqm: 15_400,
        avgPropertyPrice: 3_950_000,
        historicalAppreciation: 6.8,
        buyerDemand: 79,
        rentalDemand: 82,
        luxuryDemand: 86,
        schoolScore: 82,
        transportScore: 68,
        crimeIndex: 45,
        marketTemperature: 'warm',
        lifestyleScore: 91,
        walkabilityScore: 58,
        investmentScore: 84,
        plannedDevelopments: ['Umhlanga Ridge expansion', 'Coastal link road'],
        infrastructureProjects: ['King Shaka airport corridor', 'Municipal fibre rollout'],
        typicalFloorSqm: 250,
        typicalLandSqm: 600,
    },
    {
        key: 'pretoria-east',
        suburb: 'Faerie Glen',
        municipality: 'City of Tshwane',
        province: 'Gauteng',
        pricePerSqm: 8_600,
        avgPropertyPrice: 2_650_000,
        historicalAppreciation: 5.8,
        buyerDemand: 74,
        rentalDemand: 72,
        luxuryDemand: 58,
        schoolScore: 81,
        transportScore: 62,
        crimeIndex: 44,
        marketTemperature: 'balanced',
        lifestyleScore: 78,
        walkabilityScore: 42,
        investmentScore: 72,
        plannedDevelopments: ['Woodhill mixed-use node', 'N1 corridor retail'],
        infrastructureProjects: ['Pretoria east water mains', 'Electricity substation upgrade'],
        typicalFloorSqm: 310,
        typicalLandSqm: 950,
    },
    {
        key: 'fourways',
        suburb: 'Fourways',
        municipality: 'City of Johannesburg',
        province: 'Gauteng',
        pricePerSqm: 11_800,
        avgPropertyPrice: 3_600_000,
        historicalAppreciation: 6.9,
        buyerDemand: 77,
        rentalDemand: 75,
        luxuryDemand: 74,
        schoolScore: 83,
        transportScore: 65,
        crimeIndex: 46,
        marketTemperature: 'warm',
        lifestyleScore: 84,
        walkabilityScore: 46,
        investmentScore: 79,
        plannedDevelopments: ['Fourways Mall expansion', 'William Nicol upgrade'],
        infrastructureProjects: ['Lonehill bulk services', 'Traffic interchange improvements'],
        typicalFloorSqm: 290,
        typicalLandSqm: 800,
    },
    {
        key: 'stellenbosch',
        suburb: 'Stellenbosch',
        municipality: 'Stellenbosch Local Municipality',
        province: 'Western Cape',
        pricePerSqm: 12_400,
        avgPropertyPrice: 3_400_000,
        historicalAppreciation: 7.5,
        buyerDemand: 75,
        rentalDemand: 70,
        luxuryDemand: 72,
        schoolScore: 88,
        transportScore: 55,
        crimeIndex: 35,
        marketTemperature: 'warm',
        lifestyleScore: 86,
        walkabilityScore: 62,
        investmentScore: 80,
        plannedDevelopments: ['Technopark expansion', 'University precinct growth'],
        infrastructureProjects: ['R44 corridor upgrade', 'Municipal fibre'],
        typicalFloorSqm: 260,
        typicalLandSqm: 700,
    },
];

function normalizeKey(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function mergeCuratedProfile(curated: AreaProfile, record: SuburbMarketRecord): AreaProfile {
    const verified = suburbMarketToAreaProfile(record);
    return {
        ...curated,
        avgPropertyPrice: record.avgPropertyPrice,
        pricePerSqm: verified.pricePerSqm,
        dataSource: record.source,
        dataQuality: record.dataQuality,
        priceYear: record.priceYear,
        city: record.city,
        typicalFloorSqm: verified.typicalFloorSqm,
        typicalLandSqm: verified.typicalLandSqm,
    };
}

export function findAreaProfile(input: LocationInput): AreaProfile | null {
    const market = findSuburbMarketRecord({
        suburb: input.suburb,
        city: input.municipality,
        province: input.province,
    });
    if (market) return suburbMarketToAreaProfile(market);

    const suburbKey = normalizeKey(input.suburb);
    const exact = AREA_PROFILES.find((a) => normalizeKey(a.suburb) === suburbKey);
    if (exact) return exact;

    const partial = AREA_PROFILES.find(
        (a) =>
            normalizeKey(a.suburb).includes(suburbKey) ||
            suburbKey.includes(normalizeKey(a.suburb))
    );
    return partial ?? null;
}

export function resolveAreaProfile(input: LocationInput): AreaProfile {
    const suburbName = input.suburb?.trim() || '';
    const market = suburbName
        ? findSuburbMarketRecord({
              suburb: suburbName,
              city: input.municipality,
              province: input.province,
          })
        : null;

    // Verified SA data path — Property24 suburb average only.
    if (market && market.avgPropertyPrice > 0) {
        const base = suburbMarketToAreaProfile(market);
        return {
            ...base,
            municipality: input.municipality?.trim() || market.municipality,
            province: input.province?.trim() || market.province,
            dataSource: market.source || 'property24',
            dataQuality: 'verified',
            priceYear: market.priceYear,
            city: market.city,
            // Never invent project lists — we have no infrastructure feed.
            plannedDevelopments: [],
            infrastructureProjects: [],
        };
    }

    const province = input.province?.trim() || '';
    const floorForAvg =
        input.floorSizeSqm && input.floorSizeSqm > 0 ? input.floorSizeSqm : 0;

    // No Property24 match — do not invent a suburb average.
    return {
        key: normalizeKey(suburbName) || 'unspecified',
        suburb: suburbName,
        municipality: input.municipality?.trim() || '',
        province,
        pricePerSqm: 0,
        avgPropertyPrice: 0,
        historicalAppreciation: 0,
        buyerDemand: 0,
        rentalDemand: 0,
        luxuryDemand: 0,
        schoolScore: 0,
        transportScore: 0,
        crimeIndex: 0,
        marketTemperature: 'balanced',
        lifestyleScore: 0,
        walkabilityScore: 0,
        investmentScore: 0,
        plannedDevelopments: [],
        infrastructureProjects: [],
        typicalFloorSqm: floorForAvg,
        typicalLandSqm: input.landSizeSqm && input.landSizeSqm > 0 ? input.landSizeSqm : 0,
        dataQuality: suburbName ? 'insufficient' : 'insufficient',
        dataSource: suburbName ? 'unmatched-suburb' : 'none',
    };
}

export function buildMarketFromArea(area: AreaProfile): MarketContext {
    const verified = area.dataQuality === 'verified' && area.avgPropertyPrice > 0;
    const avg = verified ? area.avgPropertyPrice : 0;
    const floor = area.typicalFloorSqm > 0 ? area.typicalFloorSqm : 0;
    const pricePerSqm =
        verified && floor > 0
            ? Math.round(avg / floor)
            : verified
              ? area.pricePerSqm
              : 0;

    return {
        avgPropertyPrice: avg,
        // Asking/selling spreads are not in our Property24 extract — leave unset (0).
        avgSellingPrice: 0,
        avgAskingPrice: 0,
        avgDaysOnMarket: 0,
        buyerDemand: 0,
        sellerCompetition: 0,
        rentalDemand: 0,
        luxuryDemand: 0,
        investorDemand: 0,
        marketTemperature: 'balanced',
        propertiesSold90d: 0,
        activeListings: 0,
        priceGrowthYoY: 0,
        inventoryMonths: 0,
        pricePerSqm,
        // Macro assumptions used only in model maths — not suburb facts.
        inflationRate: 5.2,
        primeInterestRate: 11.75,
        populationGrowth: 0,
        employmentGrowth: 0,
        historicalAppreciation: 0,
        supplyDemandRatio: 1,
        crimeIndex: 0,
        schoolScore: 0,
        transportScore: 0,
        plannedDevelopments: [],
        infrastructureProjects: [],
        dataQuality: verified ? 'verified' : 'insufficient',
        dataSource: area.dataSource || (verified ? 'property24' : 'none'),
        priceYear: area.priceYear,
        hasVerifiedSuburbAverage: verified,
    };
}

export function buildPropertyForLocation(
    base: PropertyProfile,
    input: LocationInput,
    area: AreaProfile
): PropertyProfile {
    const street = input.streetAddress?.trim();
    const address = street
        ? `${street}, ${area.suburb || 'South Africa'}`
        : area.suburb
          ? `Your property, ${area.suburb}`
          : 'Your property';

    const municipalValuation =
        area.avgPropertyPrice > 0 ? Math.round(area.avgPropertyPrice * 0.92) : 0;
    const purchasePrice =
        typeof input.purchasePrice === 'number' && input.purchasePrice > 0
            ? Math.round(input.purchasePrice)
            : 0;

    const completedIds = input.completedImprovementIds ?? [];
    const namedFeatures = completedIds.map((id) => {
        const tpl = IMPROVEMENT_TEMPLATES.find((t) => t.id === id);
        return tpl?.name ?? id;
    });
    const otherItems = input.otherImprovements ?? [];
    const otherLabels = otherItems.map((o) => o.label.trim()).filter(Boolean);
    const legacyOther = input.otherImprovementsNote?.trim();
    const existingFeatures =
        completedIds.length || otherLabels.length || legacyOther
            ? [
                  ...namedFeatures,
                  ...otherLabels,
                  ...(legacyOther && !otherLabels.includes(legacyOther) ? [legacyOther] : []),
              ]
            : base.existingFeatures;

    return {
        ...base,
        address,
        suburb: area.suburb || input.suburb?.trim() || '',
        municipality: area.municipality || input.municipality?.trim() || '',
        province: area.province || input.province?.trim() || '',
        propertyType: input.propertyType?.trim() || base.propertyType,
        bedrooms:
            typeof input.bedrooms === 'number' && input.bedrooms > 0
                ? Math.round(input.bedrooms)
                : base.bedrooms,
        bathrooms:
            typeof input.bathrooms === 'number' && input.bathrooms > 0
                ? Math.round(input.bathrooms)
                : base.bathrooms,
        garages:
            typeof input.garages === 'number' && input.garages >= 0
                ? Math.round(input.garages)
                : base.garages,
        landSizeSqm:
            typeof input.landSizeSqm === 'number' && input.landSizeSqm > 0
                ? Math.round(input.landSizeSqm)
                : typeof input.landSizeSqm === 'number'
                  ? 0
                  : area.typicalLandSqm || 0,
        floorSizeSqm:
            typeof input.floorSizeSqm === 'number' && input.floorSizeSqm > 0
                ? Math.round(input.floorSizeSqm)
                : typeof input.floorSizeSqm === 'number'
                  ? 0
                  : area.typicalFloorSqm || 0,
        municipalValuation,
        purchasePrice,
        purchaseDate: input.purchaseDate?.trim() || base.purchaseDate,
        bondBalance:
            input.underBond && typeof input.bondBalance === 'number' && input.bondBalance > 0
                ? Math.round(input.bondBalance)
                : 0,
        existingFeatures,
        conditionScore: Math.min(95, base.conditionScore + Math.min(18, completedIds.length * 3)),
    };
}

export function buildSuburbInsightsForArea(area: AreaProfile): SuburbInsightsData {
    // No schools / amenities / crime feed is connected — return empty rather than invent names.
    return {
        schools: [],
        universities: [],
        hospitals: [],
        shoppingCentres: [],
        parks: [],
        publicTransport: [],
        crimeTrend:
            area.dataQuality === 'verified'
                ? 'No SAPS / crime index feed connected for this suburb.'
                : 'Select a Property24-matched suburb for market pricing. Amenity and crime data are not available.',
        lifestyleScore: 0,
        walkabilityScore: 0,
        investmentScore: 0,
    };
}

export function getAreaValuationSummary(area: AreaProfile, market: MarketContext) {
    return {
        suburbAverage: area.avgPropertyPrice,
        pricePerSqm: area.pricePerSqm,
        avgRentalMonthly: Math.round(area.avgPropertyPrice * 0.0048),
        appreciation: area.historicalAppreciation,
        buyerDemand: area.buyerDemand,
        marketTemperature: area.marketTemperature,
        priceGrowthYoY: market.priceGrowthYoY,
        dataQuality: area.dataQuality ?? 'estimated',
        dataSource: area.dataSource ?? 'province-model',
        priceYear: area.priceYear,
        city: area.city,
    };
}

export const SA_PROVINCES = [
    'Gauteng',
    'Western Cape',
    'KwaZulu-Natal',
    'Eastern Cape',
    'Free State',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Northern Cape',
] as const;

export const LOCATION_SUGGESTIONS = getSuburbLocationSuggestions(800).map((s) => ({
    suburb: s.suburb,
    municipality: s.municipality,
    province: s.province,
    city: s.city,
    avgPropertyPrice: s.avgPropertyPrice,
    priceYear: s.priceYear,
    dataQuality: s.dataQuality,
}));
