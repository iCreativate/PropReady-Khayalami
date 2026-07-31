import type { ConveyancerProfile, ProvinceSlug, Specialty } from '@/lib/conveyancer-connect/types';
import { coordsForCity } from '@/lib/conveyancer-connect/geo';

const PROVINCE_SLUGS: ProvinceSlug[] = [
    'gauteng',
    'western-cape',
    'kwazulu-natal',
    'eastern-cape',
    'free-state',
    'limpopo',
    'mpumalanga',
    'north-west',
    'northern-cape',
];

function toProvinceSlug(value: string | null | undefined): ProvinceSlug {
    const raw = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
    if ((PROVINCE_SLUGS as string[]).includes(raw)) return raw as ProvinceSlug;
    const aliases: Record<string, ProvinceSlug> = {
        gp: 'gauteng',
        wc: 'western-cape',
        kzn: 'kwazulu-natal',
        ec: 'eastern-cape',
        fs: 'free-state',
        lp: 'limpopo',
        mp: 'mpumalanga',
        nw: 'north-west',
        nc: 'northern-cape',
    };
    return aliases[raw] || 'gauteng';
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'CC';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export type DbConveyancerRow = {
    id: string;
    full_name: string;
    email: string;
    firm_name: string;
    firm_slug?: string | null;
    phone?: string | null;
    province?: string | null;
    city?: string | null;
    suburb?: string | null;
    bio?: string | null;
    website?: string | null;
    languages?: string[] | null;
    specialisations?: string[] | null;
    verified_at?: string | null;
    profile_completion?: number | null;
};

/** Map an approved DB conveyancer into marketplace shape — no invented ratings/reviews. */
export function mapDbConveyancerToProfile(row: DbConveyancerRow): ConveyancerProfile {
    const firmName = row.firm_name || 'Conveyancing firm';
    const attorneyName = row.full_name || firmName;
    const slug = row.firm_slug || row.id;
    const specialty = (row.specialisations || ['residential']).filter(Boolean) as Specialty[];
    const city = row.city || '';
    const province = toProvinceSlug(row.province);
    const suburb = row.suburb || city || '';
    const coords = coordsForCity(city || suburb, province);

    return {
        id: row.id,
        slug,
        firmName,
        attorneyName,
        title: 'Conveyancing attorney',
        verified: Boolean(row.verified_at),
        featured: Boolean(row.verified_at),
        logoInitials: initials(firmName),
        photoInitials: initials(attorneyName),
        accent: '#B8860B',
        rating: 0,
        reviewCount: 0,
        completedTransfers: 0,
        yearsInPractice: 0,
        province,
        city: city || 'South Africa',
        suburb: suburb || '—',
        languages: row.languages?.length ? row.languages : ['English'],
        avgResponseHours: 0,
        avgTransferDays: 0,
        priceBand: 2,
        acceptingNewClients: true,
        openToday: true,
        onlineConsultation: true,
        availability: 'available',
        specialisations: specialty.length ? specialty : ['residential'],
        bio:
            row.bio ||
            `${firmName} is a PropReady-verified conveyancing practice. Contact them for timelines, fees and instruction.`,
        firmHistory: '',
        qualifications: [],
        education: [],
        memberships: [],
        awards: [],
        licences: [],
        offices: city
            ? [
                  {
                      label: 'Practice location',
                      address: [row.suburb, city, row.province].filter(Boolean).join(', '),
                      suburb: suburb || city,
                      city,
                      province,
                      coords,
                  },
              ]
            : [],
        services: specialty.length ? specialty : ['residential'],
        performance: {
            avgTransferDays: 0,
            avgResponseHours: 0,
            clientSatisfactionPct: 0,
            repeatClientPct: 0,
            transfersCompleted: 0,
            successRatePct: 0,
            currentWorkload: 0,
            monthlyCases: 0,
            avgReview: 0,
            yearsActive: 0,
            responseRatePct: 0,
        },
        reviews: [],
        documents: [],
        phone: row.phone || '',
        email: row.email || '',
        website: row.website || '',
        lastActiveAt: new Date().toISOString(),
        coords,
    };
}

/** Merge live DB firms ahead of optional demo catalog. */
export function mergeLiveConveyancers(
    live: ConveyancerProfile[],
    catalog: ConveyancerProfile[]
): ConveyancerProfile[] {
    const seen = new Set(live.map((c) => c.id));
    const catalogFiltered = catalog.filter(
        (c) => !seen.has(c.id) && !live.some((l) => l.slug === c.slug)
    );
    return [...live, ...catalogFiltered];
}
