'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search } from 'lucide-react';
import { useGoogleMapsConfig } from '@/hooks/useGoogleMapsConfig';
import {
    parseSaPlaceFromDetails,
    type ParsedSaPlace,
} from '@/lib/google-places/parse-sa-address';

export type PvoPlaceSelection = ParsedSaPlace;

type Suggestion = {
    placeId: string;
    primary: string;
    secondary: string;
};

type LocationBlockProps = {
    suburb: string;
    onSuburbChange: (value: string) => void;
    onPlaceSelect: (place: PvoPlaceSelection) => void;
    inputClassName: string;
    placeholder?: string;
};

function PlacesAutocompleteField({
    value,
    onChange,
    onPlaceSelect,
    inputClassName,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    onPlaceSelect: (place: PvoPlaceSelection) => void;
    inputClassName: string;
    placeholder?: string;
}) {
    const places = useMapsLibrary('places');
    const listId = useId();
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
    const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const detailsRef = useRef<google.maps.places.PlacesService | null>(null);
    const detailsHostRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!places) return;
        serviceRef.current = new places.AutocompleteService();
        if (!detailsHostRef.current) {
            detailsHostRef.current = document.createElement('div');
        }
        detailsRef.current = new places.PlacesService(detailsHostRef.current);
        sessionTokenRef.current = new places.AutocompleteSessionToken();
    }, [places]);

    useEffect(() => {
        const q = value.trim();
        if (!places || !serviceRef.current || q.length < 2) {
            setSuggestions([]);
            return;
        }

        const t = window.setTimeout(() => {
            serviceRef.current?.getPlacePredictions(
                {
                    input: q,
                    componentRestrictions: { country: 'za' },
                    types: ['geocode'],
                    sessionToken: sessionTokenRef.current ?? undefined,
                },
                (preds, status) => {
                    if (
                        status !== google.maps.places.PlacesServiceStatus.OK ||
                        !preds?.length
                    ) {
                        setSuggestions([]);
                        return;
                    }
                    setSuggestions(
                        preds.slice(0, 8).map((p) => ({
                            placeId: p.place_id,
                            primary: p.structured_formatting?.main_text || p.description,
                            secondary:
                                p.structured_formatting?.secondary_text ||
                                p.description.replace(
                                    `${p.structured_formatting?.main_text || ''}, `,
                                    ''
                                ),
                        }))
                    );
                }
            );
        }, 220);

        return () => window.clearTimeout(t);
    }, [value, places]);

    const pick = (suggestion: Suggestion) => {
        if (!detailsRef.current || !places) return;
        setLoadingDetails(true);
        detailsRef.current.getDetails(
            {
                placeId: suggestion.placeId,
                fields: ['address_components', 'formatted_address', 'geometry', 'name'],
                sessionToken: sessionTokenRef.current ?? undefined,
            },
            (place, status) => {
                setLoadingDetails(false);
                sessionTokenRef.current = new places.AutocompleteSessionToken();
                if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
                    return;
                }
                const parsed = parseSaPlaceFromDetails(place);
                if (!parsed) return;
                onChange(parsed.suburb);
                onPlaceSelect(parsed);
                setOpen(false);
                setSuggestions([]);
            }
        );
    };

    return (
        <div className="relative">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                <input
                    className={`${inputClassName} !pl-10`}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => {
                        window.setTimeout(() => setOpen(false), 160);
                    }}
                    placeholder={placeholder || 'Search suburb or street address'}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={open && suggestions.length > 0}
                    aria-controls={listId}
                    aria-autocomplete="list"
                />
                {loadingDetails ? (
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-black/40">
                        Locating…
                    </span>
                ) : null}
            </div>
            {open && suggestions.length > 0 ? (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-black/[0.08] bg-white py-1 shadow-lg"
                >
                    {suggestions.map((s) => (
                        <li key={s.placeId} role="option">
                            <button
                                type="button"
                                className="flex w-full flex-col px-3.5 py-2 text-left text-sm hover:bg-[#f7f8fa]"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pick(s)}
                            >
                                <span className="font-semibold text-[#1b1b1b]">{s.primary}</span>
                                <span className="text-xs text-black/45">{s.secondary}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
            <p className="mt-1.5 text-[11px] text-black/40">Powered by Google Maps</p>
        </div>
    );
}

function LocalSuburbFallback({
    value,
    onChange,
    onPlaceSelect,
    inputClassName,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    onPlaceSelect: (place: PvoPlaceSelection) => void;
    inputClassName: string;
    placeholder?: string;
}) {
    const [suggestions, setSuggestions] = useState<
        { suburb: string; municipality: string; province: string }[]
    >([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const q = value.trim();
        if (q.length < 2) {
            setSuggestions([]);
            return;
        }
        const ctrl = new AbortController();
        const t = window.setTimeout(() => {
            void fetch(`/api/property-optimizer/suburbs?q=${encodeURIComponent(q)}&limit=8`, {
                signal: ctrl.signal,
            })
                .then((r) => r.json())
                .then((data) => {
                    const list = Array.isArray(data?.results)
                        ? data.results
                        : Array.isArray(data)
                          ? data
                          : [];
                    setSuggestions(
                        list
                            .map(
                                (s: {
                                    suburb?: string;
                                    municipality?: string;
                                    province?: string;
                                }) => ({
                                    suburb: String(s.suburb || ''),
                                    municipality: String(s.municipality || ''),
                                    province: String(s.province || ''),
                                })
                            )
                            .filter((s: { suburb: string }) => s.suburb)
                    );
                })
                .catch(() => {});
        }, 280);
        return () => {
            ctrl.abort();
            window.clearTimeout(t);
        };
    }, [value]);

    return (
        <div className="relative">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                <input
                    className={`${inputClassName} !pl-10`}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => window.setTimeout(() => setOpen(false), 160)}
                    placeholder={placeholder || 'e.g. Bryanston, Sandton'}
                    autoComplete="off"
                />
            </div>
            {open && suggestions.length > 0 ? (
                <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-black/[0.08] bg-white py-1 shadow-lg">
                    {suggestions.map((s) => (
                        <li key={`${s.suburb}-${s.municipality}`}>
                            <button
                                type="button"
                                className="flex w-full flex-col px-3.5 py-2 text-left text-sm hover:bg-[#f7f8fa]"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onChange(s.suburb);
                                    onPlaceSelect({
                                        label: s.suburb,
                                        suburb: s.suburb,
                                        municipality: s.municipality,
                                        province: s.province,
                                    });
                                    setOpen(false);
                                }}
                            >
                                <span className="font-semibold">{s.suburb}</span>
                                <span className="text-xs text-black/45">
                                    {s.municipality}
                                    {s.province ? ` · ${s.province}` : ''}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <span className="pvo-kpi-label mb-1.5 block">{children}</span>;
}

const MAPS_AUTH_FAIL_KEY = 'pvo-gmaps-auth-failed';

function rememberMapsAuthFailure() {
    try {
        sessionStorage.setItem(MAPS_AUTH_FAIL_KEY, '1');
    } catch {
        /* ignore */
    }
}

function hadMapsAuthFailure() {
    try {
        return sessionStorage.getItem(MAPS_AUTH_FAIL_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Google Places suburb/address search for the Property Value Optimizer.
 * Falls back to the local suburb index when Maps is missing or the key is rejected.
 */
export function PvoLocationSearchBlock({
    suburb,
    onSuburbChange,
    onPlaceSelect,
    inputClassName,
    placeholder,
}: LocationBlockProps) {
    const { apiKey, loading } = useGoogleMapsConfig();
    const [mapsFailed, setMapsFailed] = useState(hadMapsAuthFailure);

    useEffect(() => {
        if (!apiKey || mapsFailed) return;

        const previous = (window as Window & { gm_authFailure?: () => void }).gm_authFailure;
        (window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
            rememberMapsAuthFailure();
            setMapsFailed(true);
            previous?.();
        };

        return () => {
            (window as Window & { gm_authFailure?: () => void }).gm_authFailure = previous;
        };
    }, [apiKey, mapsFailed]);

    const searchField =
        loading ? (
            <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                <input
                    className={`${inputClassName} !pl-10`}
                    value={suburb}
                    disabled
                    placeholder="Loading Google Maps…"
                />
            </div>
        ) : !apiKey || mapsFailed ? (
            <LocalSuburbFallback
                value={suburb}
                onChange={onSuburbChange}
                onPlaceSelect={onPlaceSelect}
                inputClassName={inputClassName}
                placeholder={placeholder}
            />
        ) : (
            <APIProvider
                apiKey={apiKey}
                libraries={['places']}
                onError={() => {
                    rememberMapsAuthFailure();
                    setMapsFailed(true);
                }}
            >
                <PlacesAutocompleteField
                    value={suburb}
                    onChange={onSuburbChange}
                    onPlaceSelect={onPlaceSelect}
                    inputClassName={inputClassName}
                    placeholder={placeholder}
                />
            </APIProvider>
        );

    return (
        <label className="block">
            <FieldLabel>Search suburb or address</FieldLabel>
            {searchField}
        </label>
    );
}
