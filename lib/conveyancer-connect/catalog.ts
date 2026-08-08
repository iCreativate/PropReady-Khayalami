import type { ConveyancerProfile, ProvinceSlug } from '@/lib/conveyancer-connect/types';

/** Static SA cities for province/city routing — not demo firm data. */
export const PROVINCE_CITIES: Record<ProvinceSlug, string[]> = {
    gauteng: ['Johannesburg', 'Pretoria', 'Midrand', 'Sandton', 'Roodepoort'],
    'western-cape': ['Cape Town', 'Stellenbosch'],
    'kwazulu-natal': ['Durban', 'Ballito', 'Pietermaritzburg', 'Umhlanga'],
    'eastern-cape': ['East London', 'Gqeberha', 'Port Elizabeth'],
    'free-state': ['Bloemfontein'],
    limpopo: ['Polokwane'],
    mpumalanga: ['Mbombela', 'Nelspruit'],
    'north-west': ['Mahikeng', 'Rustenburg'],
    'northern-cape': ['Kimberley'],
};

export function listProvinces(): ProvinceSlug[] {
    return Object.keys(PROVINCE_CITIES) as ProvinceSlug[];
}

export function listCities(
    province?: ProvinceSlug | '',
    catalog: ConveyancerProfile[] = []
): string[] {
    const fromCatalog = (
        province ? catalog.filter((c) => c.province === province) : catalog
    )
        .map((c) => c.city)
        .filter(Boolean);
    const fromStatic = province ? PROVINCE_CITIES[province] || [] : listProvinces().flatMap((p) => PROVINCE_CITIES[p]);
    return Array.from(new Set([...fromCatalog, ...fromStatic])).sort();
}

export function listSuburbs(
    province?: ProvinceSlug | '',
    city?: string,
    catalog: ConveyancerProfile[] = []
): string[] {
    let rows = catalog;
    if (province) rows = rows.filter((c) => c.province === province);
    if (city) rows = rows.filter((c) => c.city.toLowerCase() === city.toLowerCase());
    return Array.from(new Set(rows.map((c) => c.suburb).filter(Boolean))).sort();
}

export function cityToSlug(city: string): string {
    return city
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export function findCityBySlug(province: ProvinceSlug, citySlug: string): string | undefined {
    return listCities(province).find((c) => cityToSlug(c) === citySlug);
}

export function computePlatformStats(catalog: ConveyancerProfile[]) {
    if (!catalog.length) {
        return {
            verifiedConveyancers: 0,
            completedTransfers: 0,
            averageClientRating: 0,
            averageTransferTime: 0,
            citiesCovered: 0,
            averageResponseHours: 0,
            repeatClientPct: 0,
            clientSatisfactionPct: 0,
        };
    }

    const verified = catalog.filter((c) => c.verified);
    const rated = catalog.filter((c) => c.reviewCount > 0);

    return {
        verifiedConveyancers: verified.length,
        completedTransfers: catalog.reduce((s, c) => s + c.completedTransfers, 0),
        averageClientRating: rated.length
            ? Math.round((rated.reduce((s, c) => s + c.rating, 0) / rated.length) * 10) / 10
            : 0,
        averageTransferTime: Math.round(
            catalog.reduce((s, c) => s + c.avgTransferDays, 0) / catalog.length
        ),
        citiesCovered: new Set(catalog.map((c) => c.city).filter(Boolean)).size,
        averageResponseHours:
            Math.round(
                (catalog.reduce((s, c) => s + c.avgResponseHours, 0) / catalog.length) * 10
            ) / 10,
        repeatClientPct: Math.round(
            catalog.reduce((s, c) => s + c.performance.repeatClientPct, 0) / catalog.length
        ),
        clientSatisfactionPct: Math.round(
            catalog.reduce((s, c) => s + c.performance.clientSatisfactionPct, 0) / catalog.length
        ),
    };
}

/** @deprecated Use computePlatformStats(catalog) with live directory data. */
export const PLATFORM_STATS = computePlatformStats([]);
