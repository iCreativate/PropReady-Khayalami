import type { GeoPoint, ProvinceSlug } from '@/lib/conveyancer-connect/types';

/** Approximate centroids for SA cities used when firm lat/lng is not stored yet. */
const CITY_COORDS: Record<string, GeoPoint> = {
    johannesburg: { lat: -26.2041, lng: 28.0473 },
    sandton: { lat: -26.1076, lng: 28.0567 },
    pretoria: { lat: -25.7479, lng: 28.2293 },
    midrand: { lat: -25.9992, lng: 28.1268 },
    'cape town': { lat: -33.9249, lng: 18.4241 },
    stellenbosch: { lat: -33.9321, lng: 18.8602 },
    durban: { lat: -29.8587, lng: 31.0218 },
    umhlanga: { lat: -29.7285, lng: 31.0853 },
    'port elizabeth': { lat: -33.9608, lng: 25.6022 },
    gqeberha: { lat: -33.9608, lng: 25.6022 },
    bloemfontein: { lat: -29.0852, lng: 26.1596 },
    polokwane: { lat: -23.9045, lng: 29.4698 },
    mbombela: { lat: -25.4753, lng: 30.9694 },
    nelspruit: { lat: -25.4753, lng: 30.9694 },
    'east london': { lat: -33.0153, lng: 27.9116 },
    kimberley: { lat: -28.7282, lng: 24.7499 },
    'pietermaritzburg': { lat: -29.6006, lng: 30.3794 },
};

const PROVINCE_COORDS: Record<ProvinceSlug, GeoPoint> = {
    gauteng: { lat: -26.2708, lng: 28.1123 },
    'western-cape': { lat: -33.2278, lng: 21.8569 },
    'kwazulu-natal': { lat: -28.5306, lng: 30.8958 },
    'eastern-cape': { lat: -32.2968, lng: 26.4194 },
    'free-state': { lat: -28.4541, lng: 26.7968 },
    limpopo: { lat: -23.4013, lng: 29.4179 },
    mpumalanga: { lat: -25.5653, lng: 30.5279 },
    'north-west': { lat: -26.6639, lng: 25.2838 },
    'northern-cape': { lat: -29.0467, lng: 21.8569 },
};

export function hasValidCoords(point?: GeoPoint | null): boolean {
    if (!point) return false;
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return false;
    if (point.lat === 0 && point.lng === 0) return false;
    return Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
}

export function coordsForCity(
    city?: string | null,
    province?: ProvinceSlug | string | null
): GeoPoint {
    const key = String(city || '')
        .trim()
        .toLowerCase();
    if (key && CITY_COORDS[key]) return CITY_COORDS[key];
    const provinceKey = String(province || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-') as ProvinceSlug;
    if (provinceKey && PROVINCE_COORDS[provinceKey]) return PROVINCE_COORDS[provinceKey];
    return PROVINCE_COORDS.gauteng;
}

export function resolveOfficeCoords(input: {
    coords?: GeoPoint | null;
    city?: string | null;
    province?: ProvinceSlug | string | null;
}): GeoPoint {
    if (hasValidCoords(input.coords)) return input.coords as GeoPoint;
    return coordsForCity(input.city, input.province);
}

export function googleMapsDirectionsUrl(point: GeoPoint): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
}

export function googleMapsSearchUrl(query: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
