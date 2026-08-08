export type ParsedSaPlace = {
    label: string;
    suburb: string;
    municipality: string;
    province: string;
    streetAddress?: string;
    lat?: number;
    lng?: number;
};

function component(
    components: google.maps.GeocoderAddressComponent[],
    type: string,
    short = false
): string {
    const match = components.find((c) => c.types.includes(type));
    if (!match) return '';
    return short ? match.short_name : match.long_name;
}

/**
 * Map Google Places address_components into SA suburb / municipality / province fields
 * used by the Property Value Optimizer.
 */
export function parseSaPlaceFromDetails(place: {
    formatted_address?: string;
    name?: string;
    address_components?: google.maps.GeocoderAddressComponent[];
    geometry?: { location?: google.maps.LatLng | null } | null;
}): ParsedSaPlace | null {
    const location = place.geometry?.location;
    if (!location) return null;

    const components = place.address_components || [];
    const streetNumber = component(components, 'street_number');
    const route = component(components, 'route');
    const street = [streetNumber, route].filter(Boolean).join(' ').trim();

    const sublocality =
        component(components, 'sublocality_level_1') ||
        component(components, 'sublocality') ||
        component(components, 'neighborhood');
    const locality = component(components, 'locality');
    const admin2 = component(components, 'administrative_area_level_2');
    const province = component(components, 'administrative_area_level_1');

    // Prefer neighbourhood / suburb; fall back to locality or place name.
    const suburb = sublocality || locality || place.name || '';
    const municipality =
        admin2 ||
        (sublocality && locality && sublocality !== locality ? locality : '') ||
        locality ||
        '';

    const lat = typeof location.lat === 'function' ? location.lat() : Number(location.lat);
    const lng = typeof location.lng === 'function' ? location.lng() : Number(location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return {
        label: place.formatted_address || place.name || suburb,
        suburb: suburb || 'Unknown',
        municipality,
        province,
        streetAddress: street || undefined,
        lat,
        lng,
    };
}
