import type { MarketContext, PropertyProfile } from './types';
import { DEMO_MARKET, DEMO_PROPERTY } from './demo-data';
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
    dataQuality?: 'verified' | 'reported' | 'estimated';
    priceYear?: number;
    city?: string;
    pricePerSqm: number;
    avgPropertyPrice: number;
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
    /** Typical 4-bed house floor size for this area */
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
    const market = findSuburbMarketRecord({
        suburb: input.suburb,
        city: input.municipality,
        province: input.province,
    });

    if (market) {
        const curated = AREA_PROFILES.find((a) => normalizeKey(a.suburb) === normalizeKey(market.suburb));
        const base = curated ? mergeCuratedProfile(curated, market) : suburbMarketToAreaProfile(market);
        return {
            ...base,
            municipality: input.municipality?.trim() || market.municipality,
            province: input.province?.trim() || market.province,
            dataSource: market.source,
            dataQuality: market.dataQuality,
            priceYear: market.priceYear,
            city: market.city,
        };
    }

    const matched = AREA_PROFILES.find(
        (a) =>
            normalizeKey(a.suburb) === normalizeKey(input.suburb) ||
            normalizeKey(a.suburb).includes(normalizeKey(input.suburb)) ||
            normalizeKey(input.suburb).includes(normalizeKey(a.suburb))
    );
    if (matched) {
        return {
            ...matched,
            municipality: input.municipality?.trim() || matched.municipality,
            province: input.province?.trim() || matched.province,
            dataQuality: 'reported',
            dataSource: 'propready-curated',
        };
    }

    const province = input.province?.trim() || 'Gauteng';
    const provDefaults = PROVINCE_DEFAULTS[province] ?? PROVINCE_DEFAULTS.Gauteng;
    const pricePerSqm = provDefaults.pricePerSqm ?? 8_500;
    const avgPrice = Math.round(pricePerSqm * 280);

    return {
        key: normalizeKey(input.suburb),
        suburb: input.suburb.trim(),
        municipality: input.municipality?.trim() || 'Local Municipality',
        province,
        pricePerSqm,
        avgPropertyPrice: avgPrice,
        historicalAppreciation: provDefaults.historicalAppreciation ?? 5.5,
        buyerDemand: provDefaults.buyerDemand ?? 65,
        rentalDemand: 68,
        luxuryDemand: 60,
        schoolScore: 70,
        transportScore: 58,
        crimeIndex: 50,
        marketTemperature: 'balanced',
        lifestyleScore: 68,
        walkabilityScore: 45,
        investmentScore: 65,
        plannedDevelopments: [`${input.suburb} municipal development framework`],
        infrastructureProjects: [`Provincial infrastructure investment — ${province}`],
        typicalFloorSqm: 280,
        typicalLandSqm: 800,
        dataQuality: 'estimated',
        dataSource: 'province-model',
    };
}

export function buildMarketFromArea(area: AreaProfile): MarketContext {
    const ratio = 0.82 + (area.buyerDemand - 65) / 200;
    return {
        avgPropertyPrice: area.avgPropertyPrice,
        avgSellingPrice: Math.round(area.avgPropertyPrice * 0.96),
        avgAskingPrice: Math.round(area.avgPropertyPrice * 1.04),
        avgDaysOnMarket: area.marketTemperature === 'hot' ? 35 : area.marketTemperature === 'warm' ? 47 : 62,
        buyerDemand: area.buyerDemand,
        sellerCompetition: Math.max(40, 100 - area.buyerDemand + 20),
        rentalDemand: area.rentalDemand,
        luxuryDemand: area.luxuryDemand,
        investorDemand: Math.round((area.rentalDemand + area.investmentScore) / 2),
        marketTemperature: area.marketTemperature,
        propertiesSold90d: Math.round(area.avgPropertyPrice / 25_000),
        activeListings: Math.round(area.avgPropertyPrice / 12_000),
        priceGrowthYoY: area.historicalAppreciation * 0.95,
        inventoryMonths: area.marketTemperature === 'hot' ? 2.4 : 3.5,
        pricePerSqm: area.pricePerSqm,
        inflationRate: 5.2,
        primeInterestRate: 11.75,
        populationGrowth: 2.1,
        employmentGrowth: 1.6,
        historicalAppreciation: area.historicalAppreciation,
        supplyDemandRatio: ratio,
        crimeIndex: area.crimeIndex,
        schoolScore: area.schoolScore,
        transportScore: area.transportScore,
        plannedDevelopments: area.plannedDevelopments,
        infrastructureProjects: area.infrastructureProjects,
    };
}

export function buildPropertyForLocation(
    base: PropertyProfile,
    input: LocationInput,
    area: AreaProfile
): PropertyProfile {
    const street = input.streetAddress?.trim();
    const address = street
        ? `${street}, ${area.suburb}`
        : `Your property, ${area.suburb}`;

    const scale = area.avgPropertyPrice / (DEMO_PROPERTY.purchasePrice * 1.35);
    const municipalValuation = Math.round(area.avgPropertyPrice * 0.92);
    const scaledDefault = Math.round(base.purchasePrice * scale * 0.85);
    const purchasePrice =
        typeof input.purchasePrice === 'number' && input.purchasePrice > 0
            ? Math.round(input.purchasePrice)
            : scaledDefault > 0
              ? scaledDefault
              : Math.round(area.avgPropertyPrice * 0.7);

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
        suburb: area.suburb,
        municipality: area.municipality,
        province: area.province,
        landSizeSqm: area.typicalLandSqm,
        floorSizeSqm: area.typicalFloorSqm,
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
    const matched = AREA_PROFILES.find((a) => a.key === area.key);
    if (matched?.suburb === 'Bryanston') {
        return {
            schools: [
                { name: 'Bryanston High School', rating: 4.2, distance: '1.2 km' },
                { name: 'St Stithians College', rating: 4.8, distance: '2.8 km' },
            ],
            universities: [{ name: 'Wits University', distance: '12 km' }],
            hospitals: [{ name: 'Mediclinic Sandton', distance: '4.2 km' }],
            shoppingCentres: [{ name: 'Nicolway Bryanston', distance: '1.8 km' }],
            parks: [{ name: 'Bryanston Country Club', distance: '2.1 km' }],
            publicTransport: [{ name: 'Sandton Gautrain', distance: '6 km' }],
            crimeTrend: 'Improving — residential patrols expanded',
            lifestyleScore: area.lifestyleScore,
            walkabilityScore: area.walkabilityScore,
            investmentScore: area.investmentScore,
        };
    }

    return {
        schools: [
            { name: `${area.suburb} Primary`, rating: 3.8, distance: '2 km' },
            { name: `${area.municipality} High School`, rating: 3.6, distance: '4 km' },
        ],
        universities: [{ name: `Nearest university — ${area.province}`, distance: '15–25 km' }],
        hospitals: [{ name: `${area.municipality} Hospital`, distance: '5–8 km' }],
        shoppingCentres: [{ name: `${area.suburb} retail node`, distance: '2–4 km' }],
        parks: [{ name: 'Municipal parks & recreation', distance: '3 km' }],
        publicTransport: [{ name: 'Public transport — check MyCiTi / Gautrain / BRT', distance: 'Varies' }],
        crimeTrend: area.crimeIndex < 45 ? 'Stable to improving' : 'Monitor SAPS sector statistics',
        lifestyleScore: area.lifestyleScore,
        walkabilityScore: area.walkabilityScore,
        investmentScore: area.investmentScore,
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
