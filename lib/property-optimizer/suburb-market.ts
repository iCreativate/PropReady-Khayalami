import suburbMarketData from '@/data/sa-suburb-market.json';
import type { AreaProfile } from './locations';
import { fetchProperty24SuburbPrice } from './property24-fetcher';

export type SuburbDataQuality = 'verified' | 'reported' | 'estimated';

export interface SuburbMarketRecord {
    key: string;
    suburb: string;
    city: string;
    municipality: string;
    province: string;
    provinceSlug?: string;
    suburbSlug?: string;
    citySlug?: string;
    suburbId: number;
    avgPropertyPrice: number;
    priceYear: number;
    source: string;
    dataQuality: SuburbDataQuality;
    p24Path: string;
}

interface SuburbMarketFile {
    suburbs: SuburbMarketRecord[];
    scrapedAt: string | null;
    source: string;
    count?: number;
}

const marketFile = suburbMarketData as SuburbMarketFile;
const SUBURB_INDEX: SuburbMarketRecord[] = (marketFile.suburbs ?? []).filter(
    (s) => s.avgPropertyPrice > 0
);

const byNormalizedSuburb = new Map<string, SuburbMarketRecord[]>();

for (const record of SUBURB_INDEX) {
    const norm = normalizeKey(record.suburb);
    const list = byNormalizedSuburb.get(norm) ?? [];
    list.push(record);
    byNormalizedSuburb.set(norm, list);
}

function normalizeKey(...parts: string[]) {
    return parts.join('-').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function titleCaseSlug(slug: string) {
    return slug
        .split('-')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ');
}

function typicalFloorSqm(avgPrice: number) {
    if (avgPrice >= 8_000_000) return 380;
    if (avgPrice >= 5_000_000) return 320;
    if (avgPrice >= 3_000_000) return 280;
    if (avgPrice >= 1_500_000) return 240;
    if (avgPrice >= 800_000) return 180;
    return 150;
}

function typicalLandSqm(avgPrice: number, province: string) {
    if (province === 'Western Cape' && avgPrice >= 3_000_000) return 400;
    if (avgPrice >= 5_000_000) return 900;
    if (avgPrice >= 2_500_000) return 750;
    if (avgPrice >= 1_200_000) return 600;
    return 450;
}

function marketTemperature(avgPrice: number): AreaProfile['marketTemperature'] {
    if (avgPrice >= 6_000_000) return 'hot';
    if (avgPrice >= 3_000_000) return 'warm';
    if (avgPrice >= 1_200_000) return 'balanced';
    if (avgPrice >= 600_000) return 'cool';
    return 'cold';
}

function deriveScores(avgPrice: number, province: string) {
    const temp = marketTemperature(avgPrice);
    const buyerDemand =
        temp === 'hot' ? 84 : temp === 'warm' ? 78 : temp === 'balanced' ? 70 : temp === 'cool' ? 62 : 55;
    const provinceBoost =
        province === 'Western Cape' ? 4 : province === 'Gauteng' ? 2 : province === 'KwaZulu-Natal' ? 1 : 0;

    return {
        buyerDemand: Math.min(92, buyerDemand + provinceBoost),
        rentalDemand: Math.min(90, buyerDemand - 2),
        luxuryDemand: avgPrice >= 5_000_000 ? 88 : avgPrice >= 3_000_000 ? 74 : avgPrice >= 1_500_000 ? 58 : 42,
        schoolScore: avgPrice >= 4_000_000 ? 82 : avgPrice >= 2_000_000 ? 74 : 66,
        transportScore: province === 'Gauteng' && avgPrice >= 2_000_000 ? 72 : 58,
        crimeIndex: avgPrice >= 4_000_000 ? 42 : avgPrice >= 2_000_000 ? 48 : 54,
        lifestyleScore: Math.min(95, 62 + Math.round(Math.log10(Math.max(avgPrice, 500_000)) * 8)),
        walkabilityScore: province === 'Western Cape' && avgPrice >= 2_500_000 ? 72 : 46,
        investmentScore: Math.min(90, buyerDemand + (temp === 'hot' ? 6 : 0)),
        historicalAppreciation:
            province === 'Western Cape' ? 7.6 : province === 'Gauteng' ? 6.8 : province === 'KwaZulu-Natal' ? 6.0 : 4.8,
        marketTemperature: temp,
    };
}

export function getSuburbMarketMeta() {
    return {
        count: SUBURB_INDEX.length,
        scrapedAt: marketFile.scrapedAt,
        source: marketFile.source,
    };
}

export function searchSuburbMarket(query: string, limit = 12): SuburbMarketRecord[] {
    const q = query.trim().toLowerCase();
    if (!q) return SUBURB_INDEX.slice(0, limit);

    const scored: { record: SuburbMarketRecord; score: number }[] = [];

    for (const record of SUBURB_INDEX) {
        const suburb = record.suburb.toLowerCase();
        const city = record.city.toLowerCase();
        const province = record.province.toLowerCase();
        let score = 0;

        if (suburb === q) score += 100;
        else if (suburb.startsWith(q)) score += 80;
        else if (suburb.includes(q)) score += 50;
        else if (city.includes(q) || province.includes(q)) score += 20;
        else continue;

        scored.push({ record, score });
    }

    return scored
        .sort((a, b) => b.score - a.score || a.record.suburb.localeCompare(b.record.suburb))
        .slice(0, limit)
        .map((s) => s.record);
}

export function findSuburbMarketRecord(input: {
    suburb: string;
    city?: string;
    province?: string;
}): SuburbMarketRecord | null {
    const suburbKey = normalizeKey(input.suburb);
    const candidates = byNormalizedSuburb.get(suburbKey) ?? [];

    if (!candidates.length) {
        const partial = SUBURB_INDEX.filter(
            (r) =>
                normalizeKey(r.suburb).includes(suburbKey) ||
                suburbKey.includes(normalizeKey(r.suburb))
        );
        if (!partial.length) return null;
        return pickBestCandidate(partial, input);
    }

    return pickBestCandidate(candidates, input);
}

function pickBestCandidate(
    candidates: SuburbMarketRecord[],
    input: { city?: string; province?: string }
) {
    if (candidates.length === 1) return candidates[0];

    const cityKey = input.city ? normalizeKey(input.city) : '';
    const provinceKey = input.province ? normalizeKey(input.province) : '';

    const ranked = candidates
        .map((c) => {
            let score = 0;
            if (cityKey && normalizeKey(c.city) === cityKey) score += 10;
            if (cityKey && normalizeKey(c.city).includes(cityKey)) score += 5;
            if (provinceKey && normalizeKey(c.province) === provinceKey) score += 8;
            return { c, score };
        })
        .sort((a, b) => b.score - a.score);

    return ranked[0]?.c ?? candidates[0];
}

export function suburbMarketToAreaProfile(record: SuburbMarketRecord): AreaProfile {
    const floor = typicalFloorSqm(record.avgPropertyPrice);
    const land = typicalLandSqm(record.avgPropertyPrice, record.province);
    const scores = deriveScores(record.avgPropertyPrice, record.province);

    return {
        key: record.key,
        suburb: record.suburb,
        municipality: record.municipality,
        province: record.province,
        pricePerSqm: Math.round(record.avgPropertyPrice / floor),
        avgPropertyPrice: record.avgPropertyPrice,
        historicalAppreciation: scores.historicalAppreciation,
        buyerDemand: scores.buyerDemand,
        rentalDemand: scores.rentalDemand,
        luxuryDemand: scores.luxuryDemand,
        schoolScore: scores.schoolScore,
        transportScore: scores.transportScore,
        crimeIndex: scores.crimeIndex,
        marketTemperature: scores.marketTemperature,
        lifestyleScore: scores.lifestyleScore,
        walkabilityScore: scores.walkabilityScore,
        investmentScore: scores.investmentScore,
        plannedDevelopments: [`${record.suburb} — ${record.city} municipal development framework`],
        infrastructureProjects: [`Provincial infrastructure investment — ${record.province}`],
        typicalFloorSqm: floor,
        typicalLandSqm: land,
    };
}

export async function resolveSuburbMarketRecord(input: {
    suburb: string;
    city?: string;
    province?: string;
    municipality?: string;
}): Promise<SuburbMarketRecord | null> {
    const local =
        findSuburbMarketRecord({
            suburb: input.suburb,
            city: input.city ?? input.municipality,
            province: input.province,
        }) ?? null;

    if (local) return local;

    if (process.env.PVO_LIVE_SUBURB_FETCH !== 'true') return null;

    const slug = input.suburb.trim().toLowerCase().replace(/\s+/g, '-');
    const citySlug = (input.city ?? input.municipality ?? '').trim().toLowerCase().replace(/\s+/g, '-');
    const provinceSlug = (input.province ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace('kwazulu-natal', 'kwazulu-natal');

    if (!slug || !citySlug || !provinceSlug) return null;

    const searchResults = searchSuburbMarket(input.suburb, 5);
    for (const candidate of searchResults) {
        if (candidate.p24Path) {
            const live = await fetchProperty24SuburbPrice(candidate.p24Path);
            if (live) {
                return {
                    ...candidate,
                    avgPropertyPrice: live.avgPropertyPrice,
                    priceYear: live.year,
                    dataQuality: 'verified',
                };
            }
        }
    }

    const guessedPath = `/property-values/${slug}/${citySlug}/${provinceSlug}`;
    const live = await fetchProperty24SuburbPrice(guessedPath);
    if (!live) return null;

    return {
        key: normalizeKey(input.suburb, citySlug, provinceSlug),
        suburb: titleCaseSlug(slug),
        city: titleCaseSlug(citySlug),
        municipality: titleCaseSlug(citySlug),
        province: input.province ?? titleCaseSlug(provinceSlug),
        suburbId: 0,
        avgPropertyPrice: live.avgPropertyPrice,
        priceYear: live.year,
        source: 'property24-live',
        dataQuality: 'verified',
        p24Path: guessedPath,
    };
}

export function getLocationSuggestions(limit = 500) {
    return SUBURB_INDEX.slice(0, limit).map((r) => ({
        suburb: r.suburb,
        municipality: r.municipality,
        province: r.province,
        city: r.city,
        avgPropertyPrice: r.avgPropertyPrice,
        priceYear: r.priceYear,
        dataQuality: r.dataQuality,
        source: r.source,
    }));
}
