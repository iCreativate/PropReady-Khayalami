import type { ConveyancerProfile, ProvinceSlug, Specialty } from '@/lib/conveyancer-connect/types';

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
};

/** Map an approved DB conveyancer row into marketplace ConveyancerProfile shape. */
export function mapDbConveyancerToProfile(row: DbConveyancerRow): ConveyancerProfile {
    const firmName = row.firm_name || 'Conveyancing firm';
    const attorneyName = row.full_name || firmName;
    const slug = row.firm_slug || row.id;
    const specialty = (row.specialisations || ['residential']).filter(Boolean) as Specialty[];
    const city = row.city || 'Johannesburg';
    const province = toProvinceSlug(row.province);

    return {
        id: row.id,
        slug,
        firmName,
        attorneyName,
        title: 'Conveyancing attorney',
        verified: Boolean(row.verified_at),
        featured: true,
        logoInitials: initials(firmName),
        photoInitials: initials(attorneyName),
        accent: '#B8860B',
        rating: 4.8,
        reviewCount: 0,
        completedTransfers: 0,
        yearsInPractice: 5,
        province,
        city,
        suburb: row.suburb || city,
        languages: row.languages?.length ? row.languages : ['English'],
        avgResponseHours: 4,
        avgTransferDays: 70,
        priceBand: 2,
        acceptingNewClients: true,
        openToday: true,
        onlineConsultation: true,
        availability: 'available',
        specialisations: specialty.length ? specialty : ['residential'],
        bio: row.bio || `${firmName} is a PropReady-verified conveyancing practice ready to assist with property transfers.`,
        firmHistory: '',
        qualifications: [],
        education: [],
        memberships: ['LPC'],
        awards: [],
        licences: [],
        offices: [
            {
                label: 'Main office',
                address: [row.suburb, city, row.province].filter(Boolean).join(', '),
                suburb: row.suburb || city,
                city,
                province,
                coords: { lat: -26.2041, lng: 28.0473 },
            },
        ],
        services: specialty.length ? specialty : ['residential'],
        performance: {
            avgTransferDays: 70,
            avgResponseHours: 4,
            clientSatisfactionPct: 96,
            repeatClientPct: 40,
            transfersCompleted: 0,
            successRatePct: 98,
            currentWorkload: 4,
            monthlyCases: 6,
            avgReview: 4.8,
            yearsActive: 5,
            responseRatePct: 95,
        },
        reviews: [],
        documents: [],
        phone: row.phone || '',
        email: row.email || '',
        website: row.website || '',
        lastActiveAt: new Date().toISOString(),
        coords: { lat: -26.2041, lng: 28.0473 },
    };
}

/** Merge live DB firms ahead of demo catalog (DB wins on slug/id collision). */
export function mergeLiveConveyancers(
    live: ConveyancerProfile[],
    catalog: ConveyancerProfile[]
): ConveyancerProfile[] {
    const seen = new Set(live.map((c) => c.id));
    const catalogFiltered = catalog.filter((c) => !seen.has(c.id) && !live.some((l) => l.slug === c.slug));
    return [...live, ...catalogFiltered];
}
