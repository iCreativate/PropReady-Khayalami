/**
 * Location-based Companion valuation helpers.
 * Anchors auto current value to Property24 suburb averages (same dataset as Property Value Optimizer).
 */
import {
    findSuburbMarketRecord,
    searchSuburbMarket,
    suburbMarketToAreaProfile,
    type SuburbMarketRecord,
} from '@/lib/property-optimizer/suburb-market';
import type { IqProperty, PropertyType } from './types';
import { SA_MODEL_APPRECIATION_PCT } from './types';

export type CompanionSuburbMatch = {
    record: SuburbMarketRecord;
    avgPropertyPrice: number;
    priceYear: number;
    province: string;
    city: string;
    suburb: string;
    source: string;
    typicalFloorSqm: number;
    typicalLandSqm: number;
};

/** Search SA suburbs for the Companion address picker. */
export function searchCompanionSuburbs(query: string, limit = 8): SuburbMarketRecord[] {
    return searchSuburbMarket(query, limit);
}

/** Resolve the best Property24 suburb row for this property’s suburb + city. */
export function resolveCompanionSuburb(
    property: Pick<IqProperty, 'suburb' | 'city' | 'address'>
): CompanionSuburbMatch | null {
    const suburb = (property.suburb || '').trim();
    const city = (property.city || '').trim();
    if (suburb.length < 2) {
        // Try last segment of a free-text address (e.g. "12 Main Rd, Parkhurst, Johannesburg")
        const fromAddress = (property.address || '')
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);
        const guess = fromAddress.length >= 2 ? fromAddress[fromAddress.length - 2] : '';
        if (guess.length < 2) return null;
        return resolveCompanionSuburb({ suburb: guess, city: fromAddress[fromAddress.length - 1] || city, address: '' });
    }

    const record = findSuburbMarketRecord({ suburb, city: city || undefined });
    if (!record || !(record.avgPropertyPrice > 0)) return null;

    const profile = suburbMarketToAreaProfile(record);
    return {
        record,
        avgPropertyPrice: record.avgPropertyPrice,
        priceYear: record.priceYear,
        province: record.province,
        city: record.city,
        suburb: record.suburb,
        source: record.source || 'Property24 suburb average',
        typicalFloorSqm: profile.typicalFloorSqm || 180,
        typicalLandSqm: profile.typicalLandSqm || 500,
    };
}

/**
 * Disclosed long-run appreciation by province when growing a purchase price forward.
 * Not a Property24 YoY series — used only for the purchase-compound leg of the blend.
 */
export function locationAppreciationPct(
    match: CompanionSuburbMatch | null,
    propertyType: PropertyType | string | undefined | null
): number {
    const typeFactor = locationTypeAppreciationFactor(propertyType);
    if (!match) return SA_MODEL_APPRECIATION_PCT * typeFactor;

    const byProvince =
        match.province === 'Western Cape'
            ? 6.2
            : match.province === 'Gauteng'
              ? 5.4
              : match.province === 'KwaZulu-Natal'
                ? 5.0
                : match.province === 'Eastern Cape'
                  ? 4.6
                  : 4.8;

    return Math.round(byProvince * typeFactor * 100) / 100;
}

function locationTypeAppreciationFactor(type: PropertyType | string | undefined | null): number {
    switch (type) {
        case 'vacant_land':
            return 0.92;
        case 'apartment':
            return 0.96;
        case 'townhouse':
        case 'duplex':
            return 0.98;
        case 'smallholding':
            return 1.04;
        case 'commercial':
            return 0.94;
        case 'self_built':
            return 1.02;
        case 'house':
        default:
            return 1;
    }
}

/** How this property type typically sits vs the suburb freestanding average. */
export function locationTypePriceFactor(type: PropertyType | string | undefined | null): number {
    switch (type) {
        case 'vacant_land':
            return 0.4;
        case 'apartment':
            return 0.86;
        case 'townhouse':
        case 'duplex':
            return 0.92;
        case 'smallholding':
            return 1.18;
        case 'commercial':
            return 1.08;
        case 'self_built':
            return 1.02;
        case 'house':
        default:
            return 1;
    }
}

/**
 * Scale suburb average to this home’s size (floor m², else bedrooms, else land m²).
 */
export function locationSizeFactor(
    property: Pick<IqProperty, 'floorSizeSqm' | 'landSizeSqm' | 'bedrooms' | 'propertyType'>,
    match: CompanionSuburbMatch
): number {
    const floor = Math.max(0, property.floorSizeSqm || 0);
    const land = Math.max(0, property.landSizeSqm || 0);
    const beds = Math.max(0, property.bedrooms || 0);

    if (property.propertyType === 'vacant_land' && land > 0 && match.typicalLandSqm > 0) {
        return clamp(land / match.typicalLandSqm, 0.55, 1.6);
    }
    if (floor > 0 && match.typicalFloorSqm > 0) {
        return clamp(floor / match.typicalFloorSqm, 0.65, 1.45);
    }
    if (beds > 0) {
        return clamp(beds / 3, 0.7, 1.35);
    }
    if (land > 0 && match.typicalLandSqm > 0) {
        return clamp(0.85 + (land / match.typicalLandSqm - 1) * 0.25, 0.7, 1.3);
    }
    return 1;
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

/**
 * Property24-anchored location value before condition / renovations.
 */
export function locationAnchorValue(
    property: Pick<
        IqProperty,
        'floorSizeSqm' | 'landSizeSqm' | 'bedrooms' | 'propertyType' | 'suburb' | 'city' | 'address'
    >,
    match: CompanionSuburbMatch | null = resolveCompanionSuburb(property)
): number {
    if (!match) return 0;
    const size = locationSizeFactor(property, match);
    const type = locationTypePriceFactor(property.propertyType);
    return Math.round(match.avgPropertyPrice * size * type);
}
