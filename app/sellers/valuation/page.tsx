'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Search, Filter, Star, Building2, CheckCircle, TrendingUp, MapPin, Phone, Mail, MessageCircle, X, Users, ChevronRight } from 'lucide-react';

interface Agent {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    rating: number;
    totalSales: number;
    experience: string;
    location: string;
    listingQualityScore: number;
    specialties: string[];
    verified: boolean;
    brandName?: string;
}

interface Agency {
    name: string;
    agents: Agent[];
    averageQualityScore: number;
    totalAgents: number;
    totalSales: number;
    averageRating: number;
    locations: string[];
}

export default function ValuationBookingPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [minQualityScore, setMinQualityScore] = useState<number>(0);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
    const [hasAccount, setHasAccount] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string } | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);

    // Check if user has completed account creation
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('propReady_currentUser');
            const sellerInfo = localStorage.getItem('propReady_sellerInfo');
            if (userData && sellerInfo) {
                setHasAccount(true);
                setCurrentUser(JSON.parse(userData));
            }
        }
    }, []);

    useEffect(() => {
        // Load real registered agents
        if (typeof window !== 'undefined') {
            const storedAgents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const mapped: Agent[] = storedAgents.map((a: any) => ({
                id: a.id,
                name: a.fullName || a.name || 'Agent',
                company: a.company || a.brandName || 'Agency',
                brandName: a.brandName || a.company,
                email: a.email || '',
                phone: a.phone || '',
                rating: typeof a.rating === 'number' ? a.rating : 4.8,
                totalSales: typeof a.totalSales === 'number' ? a.totalSales : 0,
                experience: a.experience || '—',
                location: a.location || 'South Africa',
                listingQualityScore: typeof a.listingQualityScore === 'number' ? a.listingQualityScore : 85,
                specialties: Array.isArray(a.specialties) ? a.specialties : [],
                verified: a.status ? a.status === 'approved' : !!a.verified
            }));
            setAgents(mapped);
        }
    }, []);

    // Group agents by agency
    const agencies = useMemo(() => {
        const agencyMap = new Map<string, Agent[]>();
        
        agents.forEach(agent => {
            const agencyName = agent.brandName || agent.company;
            if (!agencyMap.has(agencyName)) {
                agencyMap.set(agencyName, []);
            }
            agencyMap.get(agencyName)!.push(agent);
        });

        const agencyList: Agency[] = Array.from(agencyMap.entries()).map(([name, agencyAgents]) => {
            const totalSales = agencyAgents.reduce((sum, agent) => sum + agent.totalSales, 0);
            const avgRating = agencyAgents.reduce((sum, agent) => sum + agent.rating, 0) / agencyAgents.length;
            const avgQualityScore = agencyAgents.reduce((sum, agent) => sum + agent.listingQualityScore, 0) / agencyAgents.length;
            const locations = Array.from(new Set(agencyAgents.map(agent => agent.location)));

            return {
                name,
                agents: agencyAgents,
                averageQualityScore: Math.round(avgQualityScore),
                totalAgents: agencyAgents.length,
                totalSales,
                averageRating: Math.round(avgRating * 10) / 10,
                locations
            };
        });

        return agencyList.sort((a, b) => b.averageQualityScore - a.averageQualityScore);
    }, [agents]);

    // Filter agencies
    const filteredAgencies = agencies.filter(agency => {
        const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            agency.locations.some(loc => loc.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesQuality = agency.averageQualityScore >= minQualityScore;
        return matchesSearch && matchesQuality;
    });

    // Get agents for selected agency
    const selectedAgencyData = selectedAgency ? agencies.find(a => a.name === selectedAgency) : null;
    const agencyAgents = selectedAgencyData?.agents.filter(agent => {
        if (!searchTerm) return true;
        return agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               agent.location.toLowerCase().includes(searchTerm.toLowerCase());
    }) || [];

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <Link href="/sellers" className="flex items-center space-x-2 text-charcoal hover:text-charcoal/90 transition">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Sellers Hub</span>
                    </Link>

                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                            <Home className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-charcoal text-xl font-bold">PropReady</span>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-32 pb-16">
                <div className="container mx-auto max-w-7xl relative z-10">
                    {/* Thank You Message (if user has account) */}
                    {hasAccount ? (
                        <div className="max-w-3xl mx-auto">
                            <div className="premium-card rounded-2xl p-12 text-center">
                                <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                                
                                <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
                                    Thank You for Joining PropReady!
                                </h1>
                                
                                <p className="text-xl text-charcoal/70 mb-8 max-w-2xl mx-auto">
                                    A qualified agent will be in contact with you soon to help you with your property valuation and selling journey.
                                </p>

                                <div className="bg-gold/10 rounded-xl p-6 mb-8 border border-gold/20">
                                    <p className="text-charcoal/80 text-lg mb-4">
                                        Alternatively, login to your dashboard to find an agent of choice
                                    </p>
                                    <Link
                                        href="/sellers/dashboard"
                                        className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transform hover:scale-105 transition-all shadow-xl"
                                    >
                                        <Home className="w-5 h-5" />
                                        Go to My Dashboard
                                    </Link>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="/sellers"
                                        className="px-6 py-3 border border-charcoal/20 text-charcoal rounded-lg hover:bg-charcoal/5 transition"
                                    >
                                        Back to Sellers Hub
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="px-6 py-3 border border-charcoal/20 text-charcoal rounded-lg hover:bg-charcoal/5 transition"
                                    >
                                        Buyer Dashboard
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Page Header */}
                            <div className="mb-8">
                                {selectedAgency ? (
                                    <div>
                                        <button
                                            onClick={() => setSelectedAgency(null)}
                                            className="flex items-center gap-2 text-charcoal/60 hover:text-charcoal mb-4 transition"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                            <span>Back to Agencies</span>
                                        </button>
                                        <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-2">
                                            {selectedAgency}
                                        </h1>
                                        <p className="text-xl text-charcoal/60">
                                            Choose an agent from {selectedAgency}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
                                            Book a Free Valuation
                                        </h1>
                                        <p className="text-xl text-charcoal/60">
                                            Choose an agency to see their agents and book a free property valuation
                                        </p>
                                    </div>
                                )}
                            </div>

                    {/* Search and Filters */}
                    <div className="premium-card rounded-xl p-6 mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search Bar */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                <input
                                    type="text"
                                    placeholder={selectedAgency ? "Search agents..." : "Search by agency name or location..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-gold"
                                />
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-6 py-3 rounded-lg border border-charcoal/20 text-charcoal hover:bg-charcoal/5 transition-all flex items-center gap-2"
                            >
                                <Filter className="w-5 h-5" />
                                <span>Filters</span>
                            </button>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && !selectedAgency && (
                            <div className="mt-6 pt-6 border-t border-charcoal/10">
                                {/* Quality Score Filter */}
                                <div>
                                    <label className="block text-charcoal/70 font-semibold text-sm mb-2">
                                        Minimum Average Listing Quality Score: {minQualityScore}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={minQualityScore}
                                        onChange={(e) => setMinQualityScore(Number(e.target.value))}
                                        className="w-full accent-gold"
                                    />
                                    <div className="flex justify-between text-charcoal/50 text-xs mt-1">
                                        <span>0%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="mb-6">
                        <p className="text-charcoal/60">
                            {selectedAgency ? (
                                <>Found <span className="font-semibold text-charcoal">{agencyAgents.length}</span> {agencyAgents.length === 1 ? 'agent' : 'agents'}</>
                            ) : (
                                <>Found <span className="font-semibold text-charcoal">{filteredAgencies.length}</span> {filteredAgencies.length === 1 ? 'agency' : 'agencies'}</>
                            )}
                        </p>
                    </div>

                    {/* Agencies Grid */}
                    {!selectedAgency && filteredAgencies.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAgencies.map((agency) => (
                                <button
                                    key={agency.name}
                                    onClick={() => setSelectedAgency(agency.name)}
                                    className="premium-card rounded-xl p-6 text-left group hover:scale-[1.02] transition-all"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-charcoal font-bold text-lg mb-2">{agency.name}</h3>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="w-4 h-4 text-charcoal/50" />
                                                <span className="text-charcoal/50 text-sm">{agency.totalAgents} {agency.totalAgents === 1 ? 'agent' : 'agents'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Star className="w-4 h-4 text-gold fill-gold" />
                                                <span className="text-charcoal/50 text-sm">{agency.averageRating} average rating</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Average Listing Quality Score */}
                                    <div className="mb-4 p-3 bg-gradient-to-br from-gold/5 to-gold/10 rounded-lg border border-gold/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-charcoal/50 text-xs font-medium">Avg. Listing Quality Score</span>
                                            <span className="text-gold font-bold text-lg">{agency.averageQualityScore}%</span>
                                        </div>
                                        <div className="w-full bg-charcoal/10 rounded-full h-2">
                                            <div
                                                className="bg-gold h-2 rounded-full transition-all"
                                                style={{ width: `${agency.averageQualityScore}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Locations */}
                                    <div className="mb-4">
                                        <p className="text-charcoal/50 text-xs mb-2">Locations</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {agency.locations.slice(0, 2).map((location, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 rounded-full bg-charcoal/5 border border-charcoal/10 text-charcoal/60 text-xs"
                                                >
                                                    {location.split(',')[0]}
                                                </span>
                                            ))}
                                            {agency.locations.length > 2 && (
                                                <span className="px-2 py-1 rounded-full bg-charcoal/5 border border-charcoal/10 text-charcoal/60 text-xs">
                                                    +{agency.locations.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* View Agents Button */}
                                    <div className="flex items-center justify-between text-gold font-semibold group-hover:gap-2 transition-all">
                                        <span>View Agents</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Agents Grid (when agency is selected) */}
                    {selectedAgency && agencyAgents.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agencyAgents.map((agent) => (
                                <div key={agent.id} className="premium-card rounded-xl p-6 group">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-charcoal font-bold text-lg truncate">{agent.name}</h3>
                                                {agent.verified && (
                                                    <span className="px-1.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                                                        <CheckCircle className="w-3 h-3" />
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-charcoal/50 text-sm truncate mb-2">{agent.company}</p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3.5 h-3.5 ${i < Math.floor(agent.rating) ? 'text-gold fill-gold' : 'text-charcoal/30'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-charcoal/50 text-xs">{agent.rating} ({agent.totalSales} sales)</span>
                                            </div>
                                            <p className="text-charcoal/40 text-xs flex items-center gap-1 mb-3">
                                                <MapPin className="w-3 h-3" />
                                                {agent.location}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Listing Quality Score */}
                                    <div className="mb-4 p-3 bg-gradient-to-br from-gold/5 to-gold/10 rounded-lg border border-gold/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-charcoal/50 text-xs font-medium">Listing Quality Score</span>
                                            <span className="text-gold font-bold text-lg">{agent.listingQualityScore}%</span>
                                        </div>
                                        <div className="w-full bg-charcoal/10 rounded-full h-2">
                                            <div
                                                className="bg-gold h-2 rounded-full transition-all"
                                                style={{ width: `${agent.listingQualityScore}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Specialties */}
                                    <div className="mb-4">
                                        <p className="text-charcoal/50 text-xs mb-2">Specialties</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {agent.specialties.slice(0, 2).map((specialty, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold"
                                                >
                                                    {specialty}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => setSelectedAgent(agent)}
                                        className="w-full px-4 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition-all"
                                    >
                                        Book Valuation
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty States */}
                    {!selectedAgency && filteredAgencies.length === 0 && (
                        <div className="premium-card rounded-xl p-12 text-center">
                            <p className="text-charcoal/60 text-lg mb-4">No agencies found matching your criteria</p>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setMinQualityScore(0);
                                }}
                                className="px-6 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition-all"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}

                    {selectedAgency && agencyAgents.length === 0 && (
                        <div className="premium-card rounded-xl p-12 text-center">
                            <p className="text-charcoal/60 text-lg mb-4">No agents found in this agency</p>
                            <button
                                onClick={() => setSelectedAgency(null)}
                                className="px-6 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition-all"
                            >
                                Back to Agencies
                            </button>
                        </div>
                    )}
                </>
            )}
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
                </div>
            </main>

            {/* Booking Modal */}
            {selectedAgent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-8 py-6 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                            <Building2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                                {selectedAgent.name}
                                            </h2>
                                            <p className="text-white/90 text-sm">{selectedAgent.company}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedAgent(null)}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">
                            <div className="text-center mb-6 space-y-4">
                                <div className="bg-white rounded-lg p-4 border border-charcoal/10 shadow-sm">
                                    <p className="text-charcoal/50 text-sm mb-1 font-semibold">Listing Quality Score</p>
                                    <p className="text-3xl font-bold text-gold">{selectedAgent.listingQualityScore}%</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-charcoal/10 shadow-sm">
                                    <p className="text-charcoal/50 text-sm mb-1 font-semibold">Phone Number</p>
                                    <p className="text-xl font-bold text-charcoal">{selectedAgent.phone}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-charcoal/10 shadow-sm overflow-hidden">
                                    <p className="text-charcoal/50 text-sm mb-1 font-semibold">Email Address</p>
                                    <p className="text-base font-semibold text-charcoal truncate" title={selectedAgent.email}>{selectedAgent.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href={`tel:${selectedAgent.phone.replace(/\s/g, '')}`}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-5 h-5" />
                                    Call to Book
                                </a>
                                <a
                                    href={`mailto:${selectedAgent.email}?subject=Free Property Valuation Request`}
                                    className="w-full px-6 py-3 border border-charcoal/20 text-charcoal font-semibold rounded-xl hover:bg-charcoal/5 transition flex items-center justify-center gap-2"
                                >
                                    <Mail className="w-5 h-5" />
                                    Email Request
                                </a>
                                <a
                                    href={`https://wa.me/${selectedAgent.phone.replace(/\s/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full px-6 py-3 border border-charcoal/20 text-charcoal font-semibold rounded-xl hover:bg-charcoal/5 transition flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    WhatsApp
                                </a>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                            <button
                                onClick={() => setSelectedAgent(null)}
                                className="px-8 py-3.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                            >
                                <span>Done</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

