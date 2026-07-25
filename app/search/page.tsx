'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Home, Search as SearchIcon, SlidersHorizontal, MapPin, Bed, Bath, Square, TrendingUp } from 'lucide-react';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import PropertyFavouriteButton from '@/components/PropertyFavouriteButton';
import {
    PORTAL_CARD,
    PORTAL_PAGE_CONTAINER,
    PORTAL_SEARCH_INPUT,
    PORTAL_SECONDARY_BTN,
} from '@/lib/portal-ui';
import {
    PROPERTY_CARD,
    PROPERTY_CARD_MATCHED,
    PROPERTY_CARD_MEDIA_TALL,
    PROPERTY_CARD_IMG,
    PROPERTY_CARD_PLACEHOLDER,
    PROPERTY_CARD_BODY,
    PROPERTY_CARD_PRICE,
    PROPERTY_CARD_LOCATION,
    PROPERTY_CARD_TITLE,
    PROPERTY_CARD_META,
    PROPERTY_CARD_FOOTER,
    PROPERTY_CARD_BADGE_MATCH,
    PROPERTY_CARD_CHIP_MATCH,
    PROPERTY_CARD_PHOTO_COUNT,
} from '@/lib/property-card-ui';
import { formatCurrency } from '@/lib/currency';
import { getProxiedImageUrl } from '@/lib/image-proxy';

type FilterType = 'all' | 'houses' | 'apartments' | 'townhouses' | 'vacant-land' | 'commercial' | 'under-1m';

interface Property {
    id: string;
    title: string;
    address: string;
    type: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    size: number;
    description?: string;
    agentId?: string;
    timestamp?: string;
    images?: string[];
    features?: string[];
    videoUrl?: string;
    matchScore?: number;
    isMatched?: boolean;
}

const FILTER_CHIP_BASE =
    'px-4 py-2 rounded-full font-semibold shadow-sm transition-all border-2';
const FILTER_CHIP_ACTIVE = 'bg-gold text-white border-gold';
const FILTER_CHIP_IDLE =
    'bg-white border-charcoal/30 text-charcoal hover:border-gold/40 hover:bg-gold/[0.06]';

export default function SearchPage() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [listedProperties, setListedProperties] = useState<Property[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [quizResult, setQuizResult] = useState<{
        preQualAmount: number;
        score: number;
    } | null>(null);

    useEffect(() => {
        // Load quiz result from localStorage
        if (typeof window !== 'undefined') {
            const storedQuizResult = localStorage.getItem('propReady_quizResult');
            if (storedQuizResult) {
                const result = JSON.parse(storedQuizResult);
                setQuizResult({
                    preQualAmount: result.preQualAmount || 0,
                    score: result.score || 0
                });
            }
        }
    }, []);

    useEffect(() => {
        // Load published properties from API and localStorage (so they appear on all browsers)
        async function loadProperties() {
            if (typeof window === 'undefined') return;
            const normalize = (p: any): Property => ({
                id: String(p.id),
                title: String(p.title || 'Listed Property'),
                address: String(p.address || 'iKhayalami, Johannesburg'),
                type: String(p.type || 'Property'),
                price: Number(p.price || 0),
                bedrooms: Number(p.bedrooms || 0),
                bathrooms: Number(p.bathrooms || 0),
                size: Number(p.size || 0),
                description: p.description ? String(p.description) : undefined,
                agentId: p.agentId ? String(p.agentId) : undefined,
                timestamp: p.timestamp ? String(p.timestamp) : undefined,
                images: Array.isArray(p.images) ? p.images : undefined,
                features: Array.isArray(p.features) ? p.features : undefined,
                videoUrl: p.videoUrl ? String(p.videoUrl) : undefined,
            });
            let apiProperties: Property[] = [];
            try {
                const res = await fetch(`/api/properties?_=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
                const data = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(data.properties)) {
                    apiProperties = data.properties
                        .filter((p: any) => p && p.id && p.type && (p.published !== false))
                        .map(normalize);
                }
            } catch (e) {
                console.warn('Failed to load properties from API', e);
            }
            const stored = JSON.parse(localStorage.getItem('propReady_listedProperties') || '[]');
            const localOnly = (Array.isArray(stored) ? stored : [])
                .filter((p: any) => p && p.id && p.type && typeof p.price === 'number' && (p.published !== false))
                .map(normalize);
            const ids = new Set(apiProperties.map(p => p.id));
            const merged = [...apiProperties, ...localOnly.filter(p => !ids.has(p.id))];
            setListedProperties(merged);
        }
        loadProperties();
    }, []);

    useEffect(() => {
        // Ensure filters are visible on desktop, collapsible on mobile
        const update = () => {
            if (typeof window === 'undefined') return;
            setShowFilters(window.innerWidth >= 768); // md breakpoint
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Calculate match score for each property
    const propertiesWithScores = useMemo(() => {
        if (!quizResult || quizResult.preQualAmount === 0) {
            return listedProperties.map(prop => ({ ...prop, matchScore: 0, isMatched: false }));
        }

        const preQualAmount = quizResult.preQualAmount;
        const propReadyScore = quizResult.score || 0;

        return listedProperties.map(property => {
            // Calculate match score based on:
            // 1. How close price is to prequal amount (60% weight)
            // 2. PropReady Score (40% weight)
            const priceDifference = Math.abs(property.price - preQualAmount);
            const maxDifference = preQualAmount * 0.4; // 40% max difference for matching
            const priceMatch = Math.max(0, 100 - (priceDifference / maxDifference) * 60);
            const scoreMatch = propReadyScore * 0.4;
            const matchScore = Math.round(priceMatch + scoreMatch);

            // Property is "matched" if it's within 30% of prequal amount and score is reasonable
            const isMatched = priceDifference <= preQualAmount * 0.3 && matchScore >= 60;

            return {
                ...property,
                matchScore: Math.min(100, Math.max(0, matchScore)),
                isMatched
            };
        });
    }, [quizResult, listedProperties]);

    // Filter and sort properties
    const filteredProperties = useMemo(() => {
        const normalizeType = (t: string) => (t || '').toLowerCase();
        const q = searchQuery.trim().toLowerCase();

        // First filter by active filter
        let filtered = propertiesWithScores.filter(property => {
            switch (activeFilter) {
                case 'houses':
                    return normalizeType(property.type).includes('house');
                case 'apartments':
                    return normalizeType(property.type).includes('apartment');
                case 'townhouses':
                    return normalizeType(property.type).includes('townhouse');
                case 'vacant-land':
                    return normalizeType(property.type).includes('vacant') || normalizeType(property.type).includes('land');
                case 'commercial':
                    return normalizeType(property.type).includes('commercial');
                case 'under-1m':
                    return property.price < 1000000;
                default:
                    return true;
            }
        });

        // Search filter (title, address, type)
        if (q) {
            filtered = filtered.filter((p) => {
                return (
                    (p.title || '').toLowerCase().includes(q) ||
                    (p.address || '').toLowerCase().includes(q) ||
                    (p.type || '').toLowerCase().includes(q)
                );
            });
        }

        // Sort: matched properties first (by match score), then others
        filtered.sort((a, b) => {
            // If both are matched or both are not matched, sort by match score
            if (a.isMatched === b.isMatched) {
                return (b.matchScore || 0) - (a.matchScore || 0);
            }
            // Matched properties come first
            return a.isMatched ? -1 : 1;
        });

        return filtered;
    }, [propertiesWithScores, activeFilter, searchQuery]);

    const filters: { id: FilterType; label: string }[] = [
        { id: 'all', label: 'All Properties' },
        { id: 'houses', label: 'Houses' },
        { id: 'apartments', label: 'Apartments' },
        { id: 'townhouses', label: 'Townhouses' },
        { id: 'vacant-land', label: 'Vacant Land' },
        { id: 'commercial', label: 'Commercial' },
        { id: 'under-1m', label: 'Under R1M' },
    ];

    const searchPublicHeader = (
        <PublicSiteHeader
            backHref="/"
            backLabel="Back to Home"
            showDesktopNav={false}
            ctaHref="/dashboard"
            ctaLabel="My Dashboard"
            mobileLinks={[{ href: '/dashboard', label: 'My Dashboard', isButton: true }]}
        />
    );

    return (
        <BuyerPortalShell activePage="properties" title="Properties" publicChrome={searchPublicHeader}>
            <div className="relative">
                <div className={`${PORTAL_PAGE_CONTAINER} relative z-10`}>
                    {/* Search Bar */}
                    <div className="mb-8">
                        <div className={`${PORTAL_CARD} p-6`}>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/35 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search by location, suburb, or property name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={PORTAL_SEARCH_INPUT}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFilters((v) => !v)}
                                    className={`${PORTAL_SECONDARY_BTN} shrink-0`}
                                >
                                    <SlidersHorizontal className="w-5 h-5" />
                                    <span className="hidden sm:inline">Filters</span>
                                    <span className="sm:hidden">{showFilters ? 'Hide' : 'Filters'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className={`mb-8 ${showFilters ? 'block' : 'hidden'}`}>
                        <div className="flex flex-wrap gap-3">
                            {filters.map((filter) => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`${FILTER_CHIP_BASE} ${
                                        activeFilter === filter.id ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <p className="text-charcoal/90 text-lg">
                                <span className="font-bold text-gold">{filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}</span> found in PropReady
                            </p>
                            {quizResult && quizResult.preQualAmount > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
                                    <TrendingUp className="w-4 h-4 text-gold" />
                                    <span className="text-charcoal/70 text-sm font-medium">
                                        Matched to your profile
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Property Grid */}
                    {filteredProperties.length > 0 ? (
                        <div className="space-y-8">
                            {/* Matched Properties Section */}
                            {quizResult && quizResult.preQualAmount > 0 && filteredProperties.some(p => p.isMatched) && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-5 h-5 text-gold" />
                                        <h3 className="text-xl font-bold text-charcoal">Matched to Your Profile</h3>
                                        <span className="px-2 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold">
                                            Based on {formatCurrency(quizResult.preQualAmount)} prequalification
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredProperties.filter(p => p.isMatched).map((property) => (
                                            <Link key={property.id} href={`/search/${property.id}`} className={PROPERTY_CARD_MATCHED}>
                                                <span className={PROPERTY_CARD_BADGE_MATCH}>Best Match</span>
                                                <PropertyFavouriteButton propertyId={property.id} />

                                                <div className={PROPERTY_CARD_MEDIA_TALL}>
                                                    {property.images?.length && property.images[0] ? (
                                                        <img
                                                            src={getProxiedImageUrl(property.images[0])}
                                                            alt={property.title}
                                                            className={PROPERTY_CARD_IMG}
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                                        />
                                                    ) : null}
                                                    <div className={`${PROPERTY_CARD_PLACEHOLDER} ${property.images?.length && property.images[0] ? 'hidden' : ''}`}>
                                                        <Home className="w-16 h-16 text-gold/40" />
                                                    </div>
                                                    {property.images && property.images.length > 1 && (
                                                        <span className={PROPERTY_CARD_PHOTO_COUNT}>
                                                            {property.images.length} photos
                                                        </span>
                                                    )}
                                                </div>

                                                <div className={PROPERTY_CARD_BODY}>
                                                    <span className={PROPERTY_CARD_PRICE}>{formatCurrency(property.price)}</span>

                                                    <div className={PROPERTY_CARD_LOCATION}>
                                                        <MapPin />
                                                        <span className="truncate">{property.address}</span>
                                                    </div>

                                                    <p className={PROPERTY_CARD_TITLE}>
                                                        {property.title}
                                                    </p>

                                                    <div className={PROPERTY_CARD_META}>
                                                        <div>
                                                            <Bed className="w-4 h-4" />
                                                            <span>{property.bedrooms}</span>
                                                        </div>
                                                        <div>
                                                            <Bath className="w-4 h-4" />
                                                            <span>{property.bathrooms}</span>
                                                        </div>
                                                        <div>
                                                            <Square className="w-4 h-4" />
                                                            <span>{property.size}m²</span>
                                                        </div>
                                                    </div>

                                                    <div className={PROPERTY_CARD_FOOTER}>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-charcoal/45 text-xs font-medium">Match Score</span>
                                                            <span className={PROPERTY_CARD_CHIP_MATCH}>
                                                                {property.matchScore}% Match
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Other Properties Section */}
                            {filteredProperties.filter(p => !p.isMatched || !quizResult || quizResult.preQualAmount === 0).length > 0 && (
                                <div>
                                    {quizResult && quizResult.preQualAmount > 0 && filteredProperties.some(p => p.isMatched) && (
                                        <h3 className="text-xl font-bold text-charcoal mb-4">Other Properties</h3>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredProperties.filter(p => !p.isMatched || !quizResult || quizResult.preQualAmount === 0).map((property) => (
                                            <Link key={property.id} href={`/search/${property.id}`} className={PROPERTY_CARD}>
                                                <PropertyFavouriteButton propertyId={property.id} />

                                                <div className={PROPERTY_CARD_MEDIA_TALL}>
                                                    {property.images?.length && property.images[0] ? (
                                                        <img
                                                            src={getProxiedImageUrl(property.images[0])}
                                                            alt={property.title}
                                                            className={PROPERTY_CARD_IMG}
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                                        />
                                                    ) : null}
                                                    <div className={`${PROPERTY_CARD_PLACEHOLDER} ${property.images?.length && property.images[0] ? 'hidden' : ''}`}>
                                                        <Home className="w-16 h-16 text-gold/40" />
                                                    </div>
                                                    {property.images && property.images.length > 1 && (
                                                        <span className={PROPERTY_CARD_PHOTO_COUNT}>
                                                            {property.images.length} photos
                                                        </span>
                                                    )}
                                                </div>

                                                <div className={PROPERTY_CARD_BODY}>
                                                    <span className={PROPERTY_CARD_PRICE}>{formatCurrency(property.price)}</span>

                                                    <div className={PROPERTY_CARD_LOCATION}>
                                                        <MapPin />
                                                        <span className="truncate">{property.address}</span>
                                                    </div>

                                                    <p className={PROPERTY_CARD_TITLE}>
                                                        {property.title}
                                                    </p>

                                                    <div className={PROPERTY_CARD_META}>
                                                        <div>
                                                            <Bed className="w-4 h-4" />
                                                            <span>{property.bedrooms}</span>
                                                        </div>
                                                        <div>
                                                            <Bath className="w-4 h-4" />
                                                            <span>{property.bathrooms}</span>
                                                        </div>
                                                        <div>
                                                            <Square className="w-4 h-4" />
                                                            <span>{property.size}m²</span>
                                                        </div>
                                                    </div>

                                                    <div className={PROPERTY_CARD_FOOTER}>
                                                        <p className="text-xs text-charcoal/45 leading-relaxed">
                                                            Listed by an agent{property.timestamp ? ` • ${new Date(property.timestamp).toLocaleDateString('en-ZA')}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`${PORTAL_CARD} p-12 text-center`}>
                            <Home className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                            <p className="text-charcoal/70 text-lg mb-2">
                                {listedProperties.length === 0 ? 'No properties have been listed yet' : 'No properties found'}
                            </p>
                            <p className="text-charcoal/50 text-sm">
                                {listedProperties.length === 0
                                    ? 'Once agents list properties in their dashboard, they will appear here.'
                                    : 'Try adjusting your filters or search.'}
                            </p>
                        </div>
                    )}

                    {/* Load More */}
                    <div className="mt-12 text-center">
                        <button type="button" className={PORTAL_SECONDARY_BTN}>
                            Load More Properties
                        </button>
                    </div>
                </div>

                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
                </div>
            </div>
        </BuyerPortalShell>
    );
}
