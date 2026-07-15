import type { MarketContext, PropertyProfile } from './types';

export const DEMO_PROPERTY: PropertyProfile = {
    id: 'pvo-demo-001',
    address: '42 Jacaranda Crescent, Bryanston',
    suburb: 'Bryanston',
    municipality: 'City of Johannesburg',
    province: 'Gauteng',
    propertyType: 'Freehold House',
    bedrooms: 4,
    bathrooms: 3,
    garages: 2,
    landSizeSqm: 850,
    floorSizeSqm: 320,
    yearBuilt: 2008,
    municipalValuation: 3_850_000,
    purchasePrice: 2_950_000,
    purchaseDate: '2019-03-15',
    bondBalance: 1_680_000,
    existingFeatures: [
        'Solar geyser',
        'Electric fence',
        'Borehole',
        'Pool',
        'Staff quarters',
        'Fibre ready',
    ],
    conditionScore: 72,
};

export const DEMO_MARKET: MarketContext = {
    avgPropertyPrice: 4_200_000,
    avgSellingPrice: 4_050_000,
    avgAskingPrice: 4_280_000,
    avgDaysOnMarket: 47,
    buyerDemand: 78,
    sellerCompetition: 62,
    rentalDemand: 74,
    luxuryDemand: 81,
    investorDemand: 69,
    marketTemperature: 'warm',
    propertiesSold90d: 186,
    activeListings: 412,
    priceGrowthYoY: 6.8,
    inventoryMonths: 3.2,
    pricePerSqm: 13_125,
    inflationRate: 5.2,
    primeInterestRate: 11.75,
    populationGrowth: 2.4,
    employmentGrowth: 1.8,
    historicalAppreciation: 7.1,
    supplyDemandRatio: 0.82,
    crimeIndex: 42,
    schoolScore: 86,
    transportScore: 71,
    plannedDevelopments: [
        'Sandton Gateway mixed-use precinct (2027)',
        'William Nicol BRT lane expansion',
        'Bryanston business node upgrade',
    ],
    infrastructureProjects: [
        'PWV 14 highway improvements',
        'Johannesburg Water bulk supply upgrade',
        'City Power grid stabilisation — northern corridor',
    ],
};

export const SUBURB_INSIGHTS = {
    schools: [
        { name: 'Bryanston High School', rating: 4.2, distance: '1.2 km' },
        { name: 'St Stithians College', rating: 4.8, distance: '2.8 km' },
        { name: 'Redhill School', rating: 4.6, distance: '3.5 km' },
    ],
    universities: [
        { name: 'Wits University', distance: '12 km' },
        { name: 'University of Johannesburg', distance: '14 km' },
    ],
    hospitals: [
        { name: 'Mediclinic Sandton', distance: '4.2 km' },
        { name: 'Netcare Sunninghill', distance: '3.1 km' },
    ],
    shoppingCentres: [
        { name: 'Nicolway Bryanston', distance: '1.8 km' },
        { name: 'Sandton City', distance: '5.5 km' },
    ],
    parks: [
        { name: 'Bryanston Country Club', distance: '2.1 km' },
        { name: 'Delta Park', distance: '4.8 km' },
    ],
    publicTransport: [
        { name: 'Sandton Gautrain', distance: '6 km' },
        { name: 'Rosebank BRT', distance: '7.5 km' },
    ],
    crimeTrend: 'Improving — residential patrols expanded 2024–2025',
    lifestyleScore: 88,
    walkabilityScore: 54,
    investmentScore: 82,
};

export const COMPARABLE_BENCHMARKS = {
    streetAverage: 4_180_000,
    suburbAverage: 4_200_000,
    municipalityAverage: 3_650_000,
    provinceAverage: 3_420_000,
    topPerforming: 5_850_000,
    similarHomes: 4_350_000,
    recentlySold: 4_290_000,
};
