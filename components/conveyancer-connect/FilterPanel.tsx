'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
    listCities,
    listSuburbs,
    PROVINCE_LABELS,
    SPECIALTY_LABELS,
    DEFAULT_FILTERS,
    type BrowseFilters,
    type ConveyancerProfile,
    type ProvinceSlug,
    type Specialty,
} from '@/lib/conveyancer-connect';

const SERVICE_OPTIONS: Specialty[] = [
    'residential',
    'bond-registration',
    'bond-cancellation',
    'estate-transfers',
    'sectional-title',
    'commercial',
    'deceased-estates',
    'family-transfers',
];

const RATING_PRESETS = [
    { label: '4.5+', value: 4.5 },
    { label: '4.0+', value: 4 },
    { label: 'Any rating', value: 0 },
];

export default function FilterPanel({
    filters,
    onChange,
    compact = false,
    variant = 'marketplace',
    catalog = [],
}: {
    filters: BrowseFilters;
    onChange: (next: BrowseFilters) => void;
    compact?: boolean;
    variant?: 'marketplace' | 'legacy';
    catalog?: ConveyancerProfile[];
}) {
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        location: true,
        experience: true,
        rating: false,
        availability: false,
        services: false,
        fees: false,
    });

    const cities = useMemo(
        () => listCities(filters.province || undefined, catalog),
        [filters.province, catalog]
    );
    const suburbs = useMemo(
        () => listSuburbs(filters.province || undefined, filters.city || undefined, catalog),
        [filters.province, filters.city, catalog]
    );

    function patch(partial: Partial<BrowseFilters>) {
        onChange({ ...filters, ...partial });
    }

    function toggleGroup(id: string) {
        setOpenGroups((g) => ({ ...g, [id]: !g[id] }));
    }

    function toggleSpecialty(s: Specialty) {
        const has = filters.specialities.includes(s);
        patch({
            specialities: has
                ? filters.specialities.filter((x) => x !== s)
                : [...filters.specialities, s],
        });
    }

    const shellClass =
        variant === 'marketplace'
            ? `cc-mp-filters${compact ? '' : ''}`
            : 'rounded-[1.25rem] border border-charcoal/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]';

    return (
        <aside className={shellClass}>
            <h2 className={variant === 'marketplace' ? 'cc-mp-filters-title' : 'text-sm font-semibold text-charcoal'}>
                Filters
            </h2>
            {variant === 'marketplace' ? (
                <button
                    type="button"
                    className="cc-mp-filters-clear"
                    onClick={() => onChange({ ...DEFAULT_FILTERS, verifiedOnly: false })}
                >
                    Clear filters
                </button>
            ) : (
                <p className="mt-1 text-xs text-charcoal/45">Refine by location, performance and fees.</p>
            )}

            <FilterGroup
                id="location"
                label="Location"
                open={openGroups.location}
                onToggle={() => toggleGroup('location')}
                variant={variant}
            >
                <label htmlFor="cc-province">Province</label>
                <select
                    id="cc-province"
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
                <label htmlFor="cc-city">City</label>
                <select
                    id="cc-city"
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
                <label htmlFor="cc-suburb">Suburb</label>
                <select
                    id="cc-suburb"
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
            </FilterGroup>

            <FilterGroup
                id="experience"
                label="Experience"
                open={openGroups.experience}
                onToggle={() => toggleGroup('experience')}
                variant={variant}
            >
                <label htmlFor="cc-exp">Years practising ({filters.minExperience || 0}+)</label>
                <input
                    id="cc-exp"
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={filters.minExperience}
                    onChange={(e) => patch({ minExperience: Number(e.target.value) })}
                />
                <label htmlFor="cc-transfers">
                    Transfers completed ({filters.minTransfers || 0}+)
                </label>
                <input
                    id="cc-transfers"
                    type="range"
                    min={0}
                    max={1500}
                    step={50}
                    value={filters.minTransfers}
                    onChange={(e) => patch({ minTransfers: Number(e.target.value) })}
                />
            </FilterGroup>

            <FilterGroup
                id="rating"
                label="Rating"
                open={openGroups.rating}
                onToggle={() => toggleGroup('rating')}
                variant={variant}
            >
                <div className={variant === 'marketplace' ? 'cc-mp-filter-chip-row' : 'flex flex-wrap gap-1.5'}>
                    {RATING_PRESETS.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            className={
                                variant === 'marketplace'
                                    ? `cc-mp-filter-chip${filters.minRating === p.value ? ' is-active' : ''}`
                                    : ''
                            }
                            onClick={() => patch({ minRating: p.value })}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </FilterGroup>

            <FilterGroup
                id="availability"
                label="Availability"
                open={openGroups.availability}
                onToggle={() => toggleGroup('availability')}
                variant={variant}
            >
                <label>
                    <input
                        type="checkbox"
                        checked={filters.openToday}
                        onChange={(e) => patch({ openToday: e.target.checked })}
                    />
                    Open today
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={filters.acceptingNewClients}
                        onChange={(e) => patch({ acceptingNewClients: e.target.checked })}
                    />
                    Accepting clients
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={filters.consultationTypes.includes('virtual')}
                        onChange={(e) =>
                            patch({
                                consultationTypes: e.target.checked ? ['virtual'] : [],
                            })
                        }
                    />
                    Online consultation
                </label>
            </FilterGroup>

            <FilterGroup
                id="services"
                label="Services"
                open={openGroups.services}
                onToggle={() => toggleGroup('services')}
                variant={variant}
            >
                <div className={variant === 'marketplace' ? 'cc-mp-filter-chip-row' : 'flex flex-wrap gap-1.5'}>
                    {SERVICE_OPTIONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className={
                                variant === 'marketplace'
                                    ? `cc-mp-filter-chip${filters.specialities.includes(s) ? ' is-active' : ''}`
                                    : ''
                            }
                            onClick={() => toggleSpecialty(s)}
                        >
                            {SPECIALTY_LABELS[s]}
                        </button>
                    ))}
                </div>
            </FilterGroup>

            <FilterGroup
                id="fees"
                label="Fees"
                open={openGroups.fees}
                onToggle={() => toggleGroup('fees')}
                variant={variant}
            >
                <label htmlFor="cc-price">Fee range</label>
                <select
                    id="cc-price"
                    value={filters.maxPriceBand || ''}
                    onChange={(e) =>
                        patch({
                            maxPriceBand: e.target.value
                                ? (Number(e.target.value) as 1 | 2 | 3 | 4)
                                : 0,
                        })
                    }
                >
                    <option value="">Any fee band</option>
                    <option value="1">R — Budget</option>
                    <option value="2">RR — Moderate</option>
                    <option value="3">RRR — Premium</option>
                    <option value="4">RRRR — Top tier</option>
                </select>
            </FilterGroup>
        </aside>
    );
}

function FilterGroup({
    id,
    label,
    open,
    onToggle,
    children,
    variant,
}: {
    id: string;
    label: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    variant: 'marketplace' | 'legacy';
}) {
    if (variant !== 'marketplace') {
        return (
            <div className="mt-5 space-y-4">
                <p className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal/45">
                    {label}
                </p>
                <div className="space-y-3">{children}</div>
            </div>
        );
    }

    return (
        <div className={`cc-mp-filter-group${open ? ' is-open' : ''}`}>
            <button
                type="button"
                className="cc-mp-filter-toggle"
                aria-expanded={open}
                aria-controls={`filter-${id}`}
                onClick={onToggle}
            >
                {label}
                <ChevronDown aria-hidden />
            </button>
            <div id={`filter-${id}`} className="cc-mp-filter-body">
                {children}
            </div>
        </div>
    );
}

export { SERVICE_OPTIONS as QUICK_SPECIALTIES };
