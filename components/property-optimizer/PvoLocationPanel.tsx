'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, MapPin, Search } from 'lucide-react';
import {
    buildMarketFromArea,
    formatZAR,
    getAreaValuationSummary,
    resolveAreaProfile,
    SA_PROVINCES,
    type LocationInput,
} from '@/lib/property-optimizer';
import { PvoBadge, PvoGlassCard } from './pvo-ui';

interface SuburbSuggestion {
    suburb: string;
    municipality: string;
    province: string;
    city?: string;
    avgPropertyPrice?: number;
    priceYear?: number;
    dataQuality?: string;
    dataSource?: string;
}

interface PvoLocationPanelProps {
    onApply: (input: LocationInput) => void;
    initial?: LocationInput;
}

function qualityLabel(quality?: string, year?: number, source?: string) {
    if (quality === 'verified') {
        return `Verified avg · Property24${year ? ` ${year}` : ''}`;
    }
    if (quality === 'reported') return 'Curated estimate';
    return source === 'province-model' ? 'Province estimate' : 'Estimated';
}

export default function PvoLocationPanel({ onApply, initial }: PvoLocationPanelProps) {
    const [suburb, setSuburb] = useState(initial?.suburb ?? '');
    const [municipality, setMunicipality] = useState(initial?.municipality ?? '');
    const [province, setProvince] = useState(initial?.province ?? 'Gauteng');
    const [streetAddress, setStreetAddress] = useState(initial?.streetAddress ?? '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [preview, setPreview] = useState<ReturnType<typeof getAreaValuationSummary> | null>(null);
    const [suggestions, setSuggestions] = useState<SuburbSuggestion[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const q = suburb.trim();
        if (q.length < 2) {
            setSuggestions([]);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `/api/property-optimizer/suburbs?q=${encodeURIComponent(q)}&limit=8`,
                    { signal: controller.signal }
                );
                if (!res.ok) return;
                const data = await res.json();
                setSuggestions(data.results ?? []);
            } catch {
                /* aborted or network */
            } finally {
                setSearching(false);
            }
        }, 280);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [suburb]);

    const visibleSuggestions = useMemo(() => suggestions.slice(0, 8), [suggestions]);

    const handlePreview = () => {
        if (!suburb.trim()) return;
        const area = resolveAreaProfile({ suburb, municipality, province, streetAddress });
        const market = buildMarketFromArea(area);
        setPreview(getAreaValuationSummary(area, market));
    };

    const handleApply = () => {
        if (!suburb.trim()) return;
        onApply({ suburb: suburb.trim(), municipality: municipality.trim(), province, streetAddress: streetAddress.trim() });
        handlePreview();
    };

    const pickSuggestion = (s: SuburbSuggestion) => {
        setSuburb(s.suburb);
        setMunicipality(s.municipality);
        setProvince(s.province);
        setShowSuggestions(false);
    };

    return (
        <PvoGlassCard className="p-6 sm:p-8 mb-8" glow>
            <div className="flex items-start gap-3 mb-6">
                <div className="pvo-icon-hero shrink-0">
                    <MapPin className="w-5 h-5" />
                </div>
                <div>
                    <PvoBadge tone="gold">Your location</PvoBadge>
                    <h3 className="pvo-heading text-xl font-semibold mt-2">Set property location</h3>
                    <p className="pvo-muted text-sm mt-1">
                        Search any South African suburb — values use verified Property24 average sale prices where
                        available.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative md:col-span-2">
                    <label className="text-xs font-medium pvo-muted uppercase tracking-wider">Suburb *</label>
                    <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pvo-muted" />
                        <input
                            value={suburb}
                            onChange={(e) => {
                                setSuburb(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            placeholder="e.g. Bryanston, Sea Point, Umhlanga"
                            className="pvo-input w-full pl-10 pr-4 py-3 rounded-2xl text-sm"
                        />
                    </div>
                    {showSuggestions && visibleSuggestions.length > 0 && (
                        <ul className="absolute z-20 mt-1 w-full pvo-glass rounded-2xl border overflow-hidden shadow-lg max-h-72 overflow-y-auto">
                            {visibleSuggestions.map((s) => (
                                <li key={`${s.suburb}-${s.city ?? s.municipality}-${s.province}`}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-2.5 text-sm pvo-heading hover:bg-charcoal/5 transition"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => pickSuggestion(s)}
                                    >
                                        <span className="font-medium">{s.suburb}</span>
                                        <span className="pvo-muted text-xs ml-2">
                                            {s.city ?? s.municipality}, {s.province}
                                        </span>
                                        {s.avgPropertyPrice ? (
                                            <span className="block text-xs text-gold mt-0.5">
                                                Avg {formatZAR(s.avgPropertyPrice)}
                                                {s.priceYear ? ` · ${s.priceYear}` : ''}
                                            </span>
                                        ) : null}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {searching && suburb.trim().length >= 2 && (
                        <p className="text-xs pvo-muted mt-1">Searching suburbs…</p>
                    )}
                </div>

                <div>
                    <label className="text-xs font-medium pvo-muted uppercase tracking-wider">Street address</label>
                    <input
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="Optional — e.g. 42 Jacaranda Crescent"
                        className="pvo-input w-full mt-1 px-4 py-3 rounded-2xl text-sm"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium pvo-muted uppercase tracking-wider">Municipality / city</label>
                    <input
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                        placeholder="e.g. Sandton, City of Cape Town"
                        className="pvo-input w-full mt-1 px-4 py-3 rounded-2xl text-sm"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium pvo-muted uppercase tracking-wider">Province</label>
                    <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="pvo-input w-full mt-1 px-4 py-3 rounded-2xl text-sm"
                    >
                        {SA_PROVINCES.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end">
                    <button type="button" onClick={handleApply} className="pvo-primary-btn w-full py-3 rounded-2xl">
                        Update area valuation
                    </button>
                </div>
            </div>

            {preview && (
                <div className="mt-6 p-4 rounded-2xl pvo-stat-inner border border-gold/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Area property values — {suburb}
                    </p>
                    <p className="text-xs pvo-muted mb-3">
                        {qualityLabel(preview.dataQuality, preview.priceYear, preview.dataSource)}
                        {preview.city ? ` · ${preview.city}` : ''}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                            <p className="pvo-muted text-xs">Suburb average</p>
                            <p className="font-bold pvo-heading">{formatZAR(preview.suburbAverage)}</p>
                        </div>
                        <div>
                            <p className="pvo-muted text-xs">Price / m²</p>
                            <p className="font-bold pvo-heading">{formatZAR(preview.pricePerSqm)}</p>
                        </div>
                        <div>
                            <p className="pvo-muted text-xs">Est. rental</p>
                            <p className="font-bold pvo-heading">{formatZAR(preview.avgRentalMonthly)}/mo</p>
                        </div>
                        <div>
                            <p className="pvo-muted text-xs">Annual appreciation</p>
                            <p className="font-bold text-gold">{preview.appreciation}%</p>
                        </div>
                        <div>
                            <p className="pvo-muted text-xs">Buyer demand</p>
                            <p className="font-bold pvo-heading">{preview.buyerDemand}/100</p>
                        </div>
                        <div>
                            <p className="pvo-muted text-xs">Market</p>
                            <p className="font-bold pvo-heading capitalize">{preview.marketTemperature}</p>
                        </div>
                    </div>
                </div>
            )}
        </PvoGlassCard>
    );
}
