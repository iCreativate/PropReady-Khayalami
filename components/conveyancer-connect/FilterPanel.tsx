'use client';

import { useMemo } from 'react';
import {
    CC_CHIP,
    CC_CHIP_ACTIVE,
    CC_INPUT,
    CC_LABEL,
    CC_CARD_FLAT,
} from '@/components/conveyancer-connect/cc-ui';
import {
    listCities,
    listSuburbs,
    PROVINCE_LABELS,
    SORT_LABELS,
    SPECIALTY_LABELS,
    type BrowseFilters,
    type ProvinceSlug,
    type SortMode,
    type Specialty,
} from '@/lib/conveyancer-connect';

const QUICK: Specialty[] = [
    'residential',
    'commercial',
    'bond-registration',
    'bond-cancellation',
    'estate-transfers',
    'developments',
    'sectional-title',
    'deceased-estates',
    'investment-property',
    'family-transfers',
];

export default function FilterPanel({
    filters,
    onChange,
    compact = false,
}: {
    filters: BrowseFilters;
    onChange: (next: BrowseFilters) => void;
    compact?: boolean;
}) {
    const cities = useMemo(() => listCities(filters.province || undefined), [filters.province]);
    const suburbs = useMemo(
        () => listSuburbs(filters.province || undefined, filters.city || undefined),
        [filters.province, filters.city]
    );

    function patch(partial: Partial<BrowseFilters>) {
        onChange({ ...filters, ...partial });
    }

    function toggleSpecialty(s: Specialty) {
        const has = filters.specialities.includes(s);
        patch({
            specialities: has
                ? filters.specialities.filter((x) => x !== s)
                : [...filters.specialities, s],
        });
    }

    return (
        <aside className={`${CC_CARD_FLAT} p-5 ${compact ? '' : 'sticky top-24'}`}>
            <h2 className="text-sm font-semibold text-charcoal">Filters</h2>
            <p className="mt-1 text-xs text-charcoal/45">Refine by location, performance and fees.</p>

            <div className="mt-5 space-y-4">
                <div>
                    <label className={CC_LABEL} htmlFor="cc-search">
                        Search
                    </label>
                    <input
                        id="cc-search"
                        className={CC_INPUT}
                        placeholder="Firm, attorney, suburb…"
                        value={filters.query}
                        onChange={(e) => patch({ query: e.target.value })}
                    />
                </div>

                <div>
                    <label className={CC_LABEL} htmlFor="cc-province">
                        Province
                    </label>
                    <select
                        id="cc-province"
                        className={CC_INPUT}
                        value={filters.province}
                        onChange={(e) =>
                            patch({
                                province: e.target.value as ProvinceSlug | '',
                                city: '',
                                suburb: '',
                            })
                        }
                    >
                        <option value="">All provinces</option>
                        {Object.entries(PROVINCE_LABELS).map(([slug, label]) => (
                            <option key={slug} value={slug}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={CC_LABEL} htmlFor="cc-city">
                        City
                    </label>
                    <select
                        id="cc-city"
                        className={CC_INPUT}
                        value={filters.city}
                        onChange={(e) => patch({ city: e.target.value, suburb: '' })}
                    >
                        <option value="">All cities</option>
                        {cities.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={CC_LABEL} htmlFor="cc-suburb">
                        Suburb
                    </label>
                    <select
                        id="cc-suburb"
                        className={CC_INPUT}
                        value={filters.suburb}
                        onChange={(e) => patch({ suburb: e.target.value })}
                    >
                        <option value="">All suburbs</option>
                        {suburbs.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={CC_LABEL} htmlFor="cc-rating">
                        Min rating ({filters.minRating || 'Any'})
                    </label>
                    <input
                        id="cc-rating"
                        type="range"
                        min={0}
                        max={5}
                        step={0.5}
                        value={filters.minRating}
                        onChange={(e) => patch({ minRating: Number(e.target.value) })}
                        className="w-full accent-gold"
                    />
                </div>

                <div>
                    <label className={CC_LABEL} htmlFor="cc-exp">
                        Min experience ({filters.minExperience || 0}+ yrs)
                    </label>
                    <input
                        id="cc-exp"
                        type="range"
                        min={0}
                        max={20}
                        step={1}
                        value={filters.minExperience}
                        onChange={(e) => patch({ minExperience: Number(e.target.value) })}
                        className="w-full accent-gold"
                    />
                </div>

                <div>
                    <label className={CC_LABEL} htmlFor="cc-transfers">
                        Min transfers ({filters.minTransfers || 0}+)
                    </label>
                    <input
                        id="cc-transfers"
                        type="range"
                        min={0}
                        max={1500}
                        step={50}
                        value={filters.minTransfers}
                        onChange={(e) => patch({ minTransfers: Number(e.target.value) })}
                        className="w-full accent-gold"
                    />
                </div>

                <div>
                    <label className={CC_LABEL} htmlFor="cc-price">
                        Max fee band
                    </label>
                    <select
                        id="cc-price"
                        className={CC_INPUT}
                        value={filters.maxPriceBand || ''}
                        onChange={(e) =>
                            patch({
                                maxPriceBand: e.target.value
                                    ? (Number(e.target.value) as 1 | 2 | 3 | 4)
                                    : 0,
                            })
                        }
                    >
                        <option value="">Any</option>
                        <option value="1">R</option>
                        <option value="2">RR</option>
                        <option value="3">RRR</option>
                        <option value="4">RRRR</option>
                    </select>
                </div>

                <div>
                    <label className={CC_LABEL} htmlFor="cc-sort">
                        Sort
                    </label>
                    <select
                        id="cc-sort"
                        className={CC_INPUT}
                        value={filters.sort}
                        onChange={(e) => patch({ sort: e.target.value as SortMode })}
                    >
                        {Object.entries(SORT_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-charcoal/70">
                        <input
                            type="checkbox"
                            checked={filters.verifiedOnly}
                            onChange={(e) => patch({ verifiedOnly: e.target.checked })}
                            className="accent-gold"
                        />
                        Verified only
                    </label>
                    <label className="flex items-center gap-2 text-sm text-charcoal/70">
                        <input
                            type="checkbox"
                            checked={filters.openToday}
                            onChange={(e) => patch({ openToday: e.target.checked })}
                            className="accent-gold"
                        />
                        Open today
                    </label>
                    <label className="flex items-center gap-2 text-sm text-charcoal/70">
                        <input
                            type="checkbox"
                            checked={filters.acceptingNewClients}
                            onChange={(e) => patch({ acceptingNewClients: e.target.checked })}
                            className="accent-gold"
                        />
                        Accepting new clients
                    </label>
                    <label className="flex items-center gap-2 text-sm text-charcoal/70">
                        <input
                            type="checkbox"
                            checked={filters.consultationTypes.includes('virtual')}
                            onChange={(e) =>
                                patch({
                                    consultationTypes: e.target.checked ? ['virtual'] : [],
                                })
                            }
                            className="accent-gold"
                        />
                        Online consultation
                    </label>
                </div>

                <div>
                    <p className={CC_LABEL}>Specialisations</p>
                    <div className="flex flex-wrap gap-1.5">
                        {QUICK.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={
                                    filters.specialities.includes(s) ? CC_CHIP_ACTIVE : CC_CHIP
                                }
                                onClick={() => toggleSpecialty(s)}
                            >
                                {SPECIALTY_LABELS[s]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}

export { QUICK as QUICK_SPECIALTIES };
