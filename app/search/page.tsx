'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, Search, SlidersHorizontal, MapPin, Bed, Bath, Square, TrendingUp } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2 text-charcoal hover:text-charcoal/90 transition">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>

                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                            <Home className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-charcoal text-xl font-bold">PropReady</span>
                    </div>

                    <Link
                        href="/dashboard"
                        className="px-4 py-2 rounded-lg bg-gold text-white font-semibold hover:bg-gold-600 transition"
                    >
                        My Dashboard
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-24 pb-8">
                <div className="container mx-auto max-w-7xl relative z-10">
                    {/* Search Bar */}
                    <div className="mb-8">
                        <div className="glass-effect rounded-xl p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                                    <input
                                        type="text"
                                        placeholder="Search by location, suburb, or property name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFilters((v) => !v)}
                                    className="px-6 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal hover:bg-gold hover:text-white hover:border-gold transition-all font-semibold flex items-center space-x-2"
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
                        <button 
                            onClick={() => setActiveFilter('all')}
                            className={`px-4 py-2 rounded-full font-semibold shadow-md transition-all ${
                                activeFilter === 'all'
                                    ? 'bg-gold text-white'
                                    : 'bg-white border-2 border-charcoal/30 text-charcoal hover:bg-gold hover:text-white hover:border-gold shadow-sm'
                            }`}
                        >
                            All Properties
                        </button>
                        <button 
                            onClick={() => setActiveFilter('houses')}
                            className={`px-4 py-2 rounded-full font-semibold shadow-sm transition-all ${
                                activeFilter === 'houses'
                                    ? 'bg-gold text-white border-2 border-gold'
                                    : 'bg-white border-2 border-charcoal/30 text-charcoal hover:bg-gold hover:text-white hover:border-gold'
                            }`}
                        >
                            Houses
                        </button>
                        <button 
                            onClick={() => setActiveFilter('apartments')}
                            className={`px-4 py-2 rounded-full font-semibold shadow-sm transition-all ${
                                activeFilter === 'apartments'
                                    ? 'bg-gold text-white border-2 border-gold'
                                    : 'bg-white border-2 border-charcoal/30 text-charcoal hover:bg-gold hover:text-white hover:border-gold'
                            }`}
                        >
                            Apartments
                        </button>
                        <button 
                            onClick={() => setActiveFilter('townhouses')}
                            className={`px-4 py-2 rounded-full font-semibold shadow-sm transition-all ${
                                activeFilter === 'townhouses'
                                    ? 'bg-gold text-white border-2 border-gold'
                                    : 'bg-white border-2 border-charcoal/30 text-charcoal hover:bg-gold hover:text-white hover:border-gold'
                            }`}
                        >
                            Townhouses
                        </button>
                        <button 
                            onClick={() => setActiveFilter('vacant-land')}
                            className={`px-4 py-2 rounded-full font-semibold shadow-sm transition-all ${
                                activeFilter === 'vacant-land'
                                    ? 'bg-gold text-white border-2 border-gold'
                                    : 'bg-white border-2 border-charcoal/30 text-charcoal hover:bg-gold hover:text-white hover:border-gold'
                            }`}
                        >
                            Vacant Land
                        </button>
                        <button 
                            onClick={() => setActiveFilter('commercial')}
                            className={`px-4 py-2 rounded-full font-semibold shadow-sm transition-all ${
                                activeFilter === 'commercial'
                                    ? 'bg-gold text-white border-2 border-gold'
                                    : 'bg-white border-2 border-charcoal/30 text-charcoal hover:bg-gold hover:text-white hover:border-gold'
                            }`}
                        >
                            Commercial
                        </button>
                        <button 
                            onClick={() => setActiveFilter('under-1m')}
                            className={`px-4 py-2 rounded-full font-semibold shadow-sm transition-all ${
                                activeFilter === 'under-1m'
                                    ? 'bg-gold text-white border-2 border-gold'
                                    : 'bg-white border-2 border-charcoal/30 text-charcoal hover:bg-gold hover:text-white hover:border-gold'
                            }`}
                        >
                            Under R1M
                        </button>
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
                                            <Link key={property.id} href={`/search/${property.id}`} className="block premium-card rounded-xl overflow-hidden cursor-pointer group border-2 border-gold/30 relative hover:shadow-xl transition-shadow">
                                                {/* Matched Badge */}
                                                <div className="absolute top-3 right-3 z-10">
                                                    <span className="px-2 py-1 rounded-full bg-gold text-white text-xs font-semibold shadow-md">
                                                        Best Match
                                                    </span>
                                                </div>
                                                
                                                {/* Property Image */}
                                                <div className="h-48 bg-charcoal/10 relative overflow-hidden">
                                                    {property.images?.length && property.images[0] ? (
                                                        <img
                                                            src={getProxiedImageUrl(property.images[0])}
                                                            alt={property.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/20 to-gold/10 ${property.images?.length && property.images[0] ? 'hidden' : ''}`}>
                                                        <Home className="w-16 h-16 text-gold/40" />
                                                    </div>
                                                    {property.images && property.images.length > 1 && (
                                                        <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">
                                                            {property.images.length} photos
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Property Details */}
                                                <div className="p-6">
                                                    {/* Price */}
                                                    <div className="mb-4">
                                                        <span className="text-2xl font-bold text-gold">{formatCurrency(property.price)}</span>
                                                    </div>

                                                    {/* Location */}
                                                    <div className="flex items-center text-charcoal/50 mb-3 text-sm">
                                                        <MapPin className="w-4 h-4 mr-2" />
                                                        <span className="truncate">{property.address}</span>
                                                    </div>

                                                    {/* Property Type */}
                                                    <p className="text-charcoal font-semibold mb-4 text-base">
                                                        {property.title}
                                                    </p>

                                                    {/* Features */}
                                                    <div className="flex items-center space-x-4 text-charcoal/50 mb-4 text-sm">
                                                        <div className="flex items-center space-x-1.5">
                                                            <Bed className="w-4 h-4" />
                                                            <span>{property.bedrooms}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <Bath className="w-4 h-4" />
                                                            <span>{property.bathrooms}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <Square className="w-4 h-4" />
                                                            <span>{property.size}m²</span>
                                                        </div>
                                                    </div>

                                                    {/* Match Score & PropReady Score */}
                                                    <div className="pt-4 border-t border-charcoal/10 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-charcoal/50 text-xs font-medium">Match Score</span>
                                                            <span className="px-3 py-1.5 rounded-full bg-gold/20 border border-gold/30 text-gold font-semibold text-sm">
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
                                            <Link key={property.id} href={`/search/${property.id}`} className="block premium-card rounded-xl overflow-hidden cursor-pointer group hover:shadow-xl transition-shadow">
                                                {/* Property Image */}
                                                <div className="h-48 bg-charcoal/10 relative overflow-hidden">
                                                    {property.images?.length && property.images[0] ? (
                                                        <img
                                                            src={getProxiedImageUrl(property.images[0])}
                                                            alt={property.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/20 to-gold/10 border-b border-charcoal/10 ${property.images?.length && property.images[0] ? 'hidden' : ''}`}>
                                                        <Home className="w-16 h-16 text-gold/40" />
                                                    </div>
                                                    {property.images && property.images.length > 1 && (
                                                        <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">
                                                            {property.images.length} photos
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Property Details */}
                                                <div className="p-6">
                                                    {/* Price */}
                                                    <div className="mb-4">
                                                        <span className="text-2xl font-bold text-gold">{formatCurrency(property.price)}</span>
                                                    </div>

                                                    {/* Location */}
                                                    <div className="flex items-center text-charcoal/50 mb-3 text-sm">
                                                        <MapPin className="w-4 h-4 mr-2" />
                                                        <span className="truncate">{property.address}</span>
                                                    </div>

                                                    {/* Property Type */}
                                                    <p className="text-charcoal font-semibold mb-4 text-base">
                                                        {property.title}
                                                    </p>

                                                    {/* Features */}
                                                    <div className="flex items-center space-x-4 text-charcoal/50 mb-4 text-sm">
                                                        <div className="flex items-center space-x-1.5">
                                                            <Bed className="w-4 h-4" />
                                                            <span>{property.bedrooms}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <Bath className="w-4 h-4" />
                                                            <span>{property.bathrooms}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <Square className="w-4 h-4" />
                                                            <span>{property.size}m²</span>
                                                        </div>
                                                    </div>

                                                    {/* Listed by agent */}
                                                    <div className="pt-4 border-t border-charcoal/10">
                                                        <p className="text-xs text-charcoal/50">
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
                        <div className="premium-card rounded-xl p-12 text-center">
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
                        <button className="px-8 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal hover:bg-gold hover:text-white hover:border-gold transition-all font-semibold">
                            Load More Properties
                        </button>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
                </div>
            </main>
        </div>
    );
}
