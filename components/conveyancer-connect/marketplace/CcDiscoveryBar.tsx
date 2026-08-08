'use client';

import { Search } from 'lucide-react';
import type { BrowseFilters, Specialty } from '@/lib/conveyancer-connect';

const DISCOVERY_CHIPS: Array<{
    id: string;
    label: string;
    apply: (filters: BrowseFilters) => Partial<BrowseFilters>;
    isActive: (filters: BrowseFilters) => boolean;
}> = [
    {
        id: 'location',
        label: 'Location',
        apply: (f) => ({ province: f.province || 'gauteng' }),
        isActive: (f) => Boolean(f.province || f.city),
    },
    {
        id: 'transfer',
        label: 'Transfer type',
        apply: (f) => ({
            specialities: f.specialities.includes('family-transfers')
                ? f.specialities
                : [...f.specialities, 'family-transfers'],
        }),
        isActive: (f) =>
            f.specialities.some((s) =>
                ['family-transfers', 'estate-transfers', 'deceased-estates'].includes(s)
            ),
    },
    {
        id: 'property',
        label: 'Property type',
        apply: (f) => ({
            specialities: f.specialities.includes('residential')
                ? f.specialities
                : [...f.specialities, 'residential'],
        }),
        isActive: (f) =>
            f.specialities.includes('residential') || f.specialities.includes('commercial'),
    },
    {
        id: 'rating',
        label: 'Rating',
        apply: () => ({ minRating: 4.5 }),
        isActive: (f) => f.minRating >= 4.5,
    },
    {
        id: 'experience',
        label: 'Experience',
        apply: () => ({ minExperience: 5 }),
        isActive: (f) => f.minExperience >= 5,
    },
    {
        id: 'availability',
        label: 'Availability',
        apply: () => ({ acceptingNewClients: true, openToday: false }),
        isActive: (f) => f.acceptingNewClients || f.openToday,
    },
    {
        id: 'fees',
        label: 'Fee range',
        apply: () => ({ maxPriceBand: 3 }),
        isActive: (f) => f.maxPriceBand > 0,
    },
];

export default function CcDiscoveryBar({
    filters,
    onChange,
    onSearch,
    onAdvanced,
}: {
    filters: BrowseFilters;
    onChange: (next: BrowseFilters) => void;
    onSearch: (e: React.FormEvent) => void;
    onAdvanced: () => void;
}) {
    function toggleChip(chipId: string) {
        const chip = DISCOVERY_CHIPS.find((c) => c.id === chipId);
        if (!chip) return;

        if (chip.isActive(filters)) {
            if (chipId === 'location') {
                onChange({ ...filters, province: '', city: '', suburb: '' });
            } else if (chipId === 'rating') {
                onChange({ ...filters, minRating: 0 });
            } else if (chipId === 'experience') {
                onChange({ ...filters, minExperience: 0 });
            } else if (chipId === 'availability') {
                onChange({ ...filters, acceptingNewClients: false, openToday: false });
            } else if (chipId === 'fees') {
                onChange({ ...filters, maxPriceBand: 0 });
            } else if (chipId === 'property') {
                onChange({
                    ...filters,
                    specialities: filters.specialities.filter(
                        (s) => s !== 'residential' && s !== 'commercial'
                    ) as Specialty[],
                });
            } else {
                onChange({
                    ...filters,
                    specialities: filters.specialities.filter(
                        (s) =>
                            !['family-transfers', 'estate-transfers', 'deceased-estates'].includes(s)
                    ) as Specialty[],
                });
            }
            return;
        }

        onChange({ ...filters, ...chip.apply(filters) });
    }

    return (
        <section className="cc-mp-discovery" aria-labelledby="cc-discovery-heading">
            <div className="cc-mp-discovery-head">
                <h2 id="cc-discovery-heading">Who can help with your property transfer?</h2>
                <p>
                    Search verified conveyancers by location, service, experience and client
                    feedback.
                </p>
            </div>

            <form onSubmit={onSearch} className="cc-mp-search">
                <label className="cc-mp-search-field">
                    <Search aria-hidden />
                    <input
                        placeholder="Search by city, suburb, firm or service"
                        value={filters.query}
                        onChange={(e) => onChange({ ...filters, query: e.target.value })}
                        aria-label="Search conveyancers"
                    />
                </label>
                <button type="submit" className="cc-mp-search-btn">
                    Search
                </button>
            </form>

            <div className="cc-mp-chips">
                {DISCOVERY_CHIPS.map((chip) => (
                    <button
                        key={chip.id}
                        type="button"
                        className={`cc-mp-chip${chip.isActive(filters) ? ' is-active' : ''}`}
                        onClick={() => toggleChip(chip.id)}
                    >
                        {chip.label}
                    </button>
                ))}
                <button type="button" className="cc-mp-advanced" onClick={onAdvanced}>
                    Advanced filters
                </button>
            </div>
        </section>
    );
}
