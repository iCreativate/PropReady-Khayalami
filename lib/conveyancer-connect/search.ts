import type {
    BrowseFilters,
    ConveyancerProfile,
    GeoPoint,
    SortMode,
} from '@/lib/conveyancer-connect/types';

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function filterConveyancers(
    catalog: ConveyancerProfile[],
    filters: BrowseFilters,
    origin?: GeoPoint | null
): ConveyancerProfile[] {
    const q = filters.query.trim().toLowerCase();
    let rows = catalog.filter((c) => {
        if (filters.verifiedOnly && !c.verified) return false;
        if (filters.openToday && !c.openToday) return false;
        if (filters.acceptingNewClients && !c.acceptingNewClients) return false;
        if (filters.province && c.province !== filters.province) return false;
        if (filters.city && c.city.toLowerCase() !== filters.city.toLowerCase()) return false;
        if (filters.suburb && c.suburb.toLowerCase() !== filters.suburb.toLowerCase()) return false;
        if (filters.minRating && c.rating < filters.minRating) return false;
        if (filters.minExperience && c.yearsInPractice < filters.minExperience) return false;
        if (filters.minTransfers && c.completedTransfers < filters.minTransfers) return false;
        if (filters.maxPriceBand && c.priceBand > filters.maxPriceBand) return false;
        if (
            filters.languages.length &&
            !filters.languages.every((l) =>
                c.languages.some((cl) => cl.toLowerCase() === l.toLowerCase())
            )
        ) {
            return false;
        }
        if (
            filters.specialities.length &&
            !filters.specialities.every((s) => c.specialisations.includes(s) || c.services.includes(s))
        ) {
            return false;
        }
        if (filters.consultationTypes.includes('virtual') && !c.onlineConsultation) return false;
        if (filters.consultationTypes.includes('office') && c.offices.length === 0) return false;
        if (q) {
            const hay = [
                c.firmName,
                c.attorneyName,
                c.city,
                c.suburb,
                c.province,
                ...c.specialisations,
                ...c.languages,
            ]
                .join(' ')
                .toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    rows = sortConveyancers(rows, filters.sort, origin);
    return rows;
}

export function sortConveyancers(
    rows: ConveyancerProfile[],
    sort: SortMode,
    origin?: GeoPoint | null
): ConveyancerProfile[] {
    const copy = [...rows];
    switch (sort) {
        case 'best-rated':
            return copy.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        case 'fastest-transfer':
            return copy.sort((a, b) => a.avgTransferDays - b.avgTransferDays);
        case 'most-experienced':
            return copy.sort((a, b) => b.yearsInPractice - a.yearsInPractice);
        case 'most-reviews':
            return copy.sort((a, b) => b.reviewCount - a.reviewCount);
        case 'lowest-fees':
            return copy.sort((a, b) => a.priceBand - b.priceBand || b.rating - a.rating);
        case 'nearest':
            if (!origin) return copy;
            return copy.sort(
                (a, b) => haversineKm(origin, a.coords) - haversineKm(origin, b.coords)
            );
        case 'recently-active':
            return copy.sort(
                (a, b) =>
                    new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
            );
        default:
            return copy;
    }
}
