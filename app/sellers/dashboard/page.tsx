'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, FileText, Building2, Calendar, ArrowLeft, Phone, Mail, MapPin, DollarSign, Users, CheckCircle, X, Search, Star, Clock } from 'lucide-react';

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
}

export default function SellerDashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string; id: string } | null>(null);
    const [sellerInfo, setSellerInfo] = useState<any>(null);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingAppointments, setViewingAppointments] = useState<any[]>([]);
    const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);

    useEffect(() => {
        // Check if user is logged in
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('propReady_currentUser');
            if (userData) {
                const user = JSON.parse(userData);
                setCurrentUser(user);
                
                // Load seller info
                const storedSellerInfo = localStorage.getItem('propReady_sellerInfo');
                if (storedSellerInfo) {
                    setSellerInfo(JSON.parse(storedSellerInfo));
                }

                // Load selected agent
                const storedSelectedAgent = localStorage.getItem(`propReady_selectedAgent_${user.id}`);
                if (storedSelectedAgent) {
                    setSelectedAgent(JSON.parse(storedSelectedAgent));
                }

                // Load viewing appointments for this user (seller)
                const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
                const userViewings = storedViewings.filter((v: any) => 
                    v.contactType === 'seller' && (
                        v.contactName.toLowerCase() === user.fullName.toLowerCase() ||
                        v.contactEmail.toLowerCase() === user.email.toLowerCase() ||
                        (sellerInfo && v.contactPhone.replace(/\s/g, '') === sellerInfo.phone?.replace(/\s/g, ''))
                    )
                );
                setViewingAppointments(userViewings);
                
                setIsLoading(false);
            } else {
                // Redirect to login if not authenticated
                router.push('/login');
            }
        }
    }, [router]);

    useEffect(() => {
        // Load real registered agents
        if (typeof window !== 'undefined') {
            const storedAgents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const mapped: Agent[] = storedAgents.map((a: any) => ({
                id: a.id,
                name: a.fullName || a.name || 'Agent',
                company: a.company || a.brandName || 'Agency',
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
            setAvailableAgents(mapped);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-charcoal/70">Loading...</p>
                </div>
            </div>
        );
    }

    const filteredAgents = availableAgents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAgent = (agent: Agent) => {
        setSelectedAgent(agent);
        if (currentUser) {
            localStorage.setItem(`propReady_selectedAgent_${currentUser.id}`, JSON.stringify(agent));
        }
        setShowAgentModal(false);
    };

    const handleRemoveAgent = () => {
        setSelectedAgent(null);
        if (currentUser) {
            localStorage.removeItem(`propReady_selectedAgent_${currentUser.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-charcoal text-xl font-bold">PropReady</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/sellers/dashboard" className="text-gold font-semibold">
                                Dashboard
                            </Link>
                            <Link href="/sellers" className="text-charcoal/90 hover:text-charcoal transition">
                                Learning Center
                            </Link>
                            <Link href="/dashboard" className="text-charcoal/90 hover:text-charcoal transition">
                                Buyer Dashboard
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-charcoal/70 text-sm">Seller</p>
                            <p className="text-charcoal font-semibold">
                                {currentUser?.fullName || 'User'}
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    localStorage.removeItem('propReady_currentUser');
                                    window.location.href = '/login';
                                }
                            }}
                            className="px-4 py-2 rounded-lg border border-charcoal/30 text-charcoal hover:bg-charcoal/10 transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-24 pb-8">
                <div className="container mx-auto max-w-7xl relative z-10">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-charcoal mb-2">
                            Welcome back, {currentUser?.fullName || 'User'}! 👋
                        </h1>
                        <p className="text-charcoal/80 text-lg">
                            Manage your property listing and connect with agents
                        </p>
                    </div>

                    {/* Property Summary Card */}
                    {sellerInfo && (
                        <div className="premium-card rounded-2xl p-8 mb-8 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-charcoal mb-2">Your Property</h2>
                                        <p className="text-charcoal/60 text-sm">Property listing details</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-gold mb-1">
                                            R {sellerInfo.currentValue ? parseFloat(sellerInfo.currentValue).toLocaleString('en-ZA') : '0'}
                                        </div>
                                        <p className="text-charcoal/50 text-sm font-medium">Estimated Value</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-5 border border-gold/20 shadow-sm">
                                        <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Property Type</p>
                                        <p className="text-charcoal font-bold text-xl capitalize">
                                            {sellerInfo.propertyType || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-5 border border-gold/20 shadow-sm">
                                        <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Timeline</p>
                                        <p className="text-charcoal font-bold text-xl capitalize">
                                            {sellerInfo.timeline ? sellerInfo.timeline.replace('-', ' to ') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-5 border border-gold/20 shadow-sm">
                                        <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Location</p>
                                        <p className="text-charcoal font-bold text-sm">
                                            {sellerInfo.propertyAddress ? sellerInfo.propertyAddress.split(',')[0] : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl opacity-50"></div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Link href="/sellers" className="premium-card rounded-xl p-6 text-center group">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                                <FileText className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Learning Center</h3>
                        </Link>

                        <Link href="/sellers/valuation" className="premium-card rounded-xl p-6 text-center group">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                                <Calendar className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Book Valuation</h3>
                        </Link>

                        <button
                            onClick={() => setShowAgentModal(true)}
                            className="premium-card rounded-xl p-6 text-center group"
                        >
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                                <Users className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">
                                {selectedAgent ? 'My Agent' : 'Select Agent'}
                            </h3>
                        </button>

                        <Link href="/dashboard" className="premium-card rounded-xl p-6 text-center group">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                                <Home className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Buyer Dashboard</h3>
                        </Link>
                    </div>

                    {/* Viewing Appointments Section */}
                    {viewingAppointments.length > 0 && (
                        <div className="premium-card rounded-2xl p-8 mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-gold" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-charcoal mb-1">Your Viewing Appointments</h2>
                                        <p className="text-charcoal/50 text-sm">Appointments scheduled by agents</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {viewingAppointments.map((viewing) => (
                                    <div
                                        key={viewing.id}
                                        className="premium-card rounded-xl p-6 border border-charcoal/20 hover:border-gold/50 transition"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-charcoal mb-2">{viewing.propertyTitle}</h3>
                                                <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{viewing.propertyAddress}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-charcoal/70">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{new Date(viewing.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{viewing.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                viewing.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                viewing.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                                                viewing.status === 'cancelled' ? 'bg-gradient-to-r from-red-500/20 to-red-500/10 text-red-600 border border-red-500/30' :
                                                'bg-gold/20 text-gold'
                                            }`}>
                                                {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                                            </span>
                                        </div>
                                        {viewing.notes && (
                                            <div className="mt-4 pt-4 border-t border-charcoal/10">
                                                <p className="text-charcoal/60 text-sm">{viewing.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected Agent Card */}
                    {selectedAgent && (
                        <div className="premium-card rounded-2xl p-8 mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center">
                                        <Users className="w-8 h-8 text-gold" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-charcoal mb-1">Your Selected Agent</h2>
                                        <p className="text-charcoal/50 text-sm">Agent assigned to help sell your property</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemoveAgent}
                                    className="px-4 py-2 border border-red-500/30 text-red-600 rounded-xl hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/10 transition"
                                >
                                    Remove Agent
                                </button>
                            </div>

                            <div className="premium-card rounded-xl p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-charcoal mb-1">{selectedAgent.name}</h3>
                                        <p className="text-charcoal/60 text-sm mb-2">{selectedAgent.company}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-gold fill-gold" />
                                                <span className="text-charcoal font-semibold">{selectedAgent.rating}</span>
                                            </div>
                                            <span className="text-charcoal/40">•</span>
                                            <span className="text-charcoal/60 text-sm">{selectedAgent.totalSales} sales</span>
                                            <span className="text-charcoal/40">•</span>
                                            <span className="text-charcoal/60 text-sm">{selectedAgent.experience}</span>
                                        </div>
                                    </div>
                                    {selectedAgent.verified && (
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Verified
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-2 text-charcoal/70 text-sm">
                                        <MapPin className="w-4 h-4" />
                                        <span>{selectedAgent.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-charcoal/70 text-sm">
                                        <Phone className="w-4 h-4" />
                                        <span>{selectedAgent.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-charcoal/70 text-sm">
                                        <Mail className="w-4 h-4" />
                                        <span>{selectedAgent.email}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-charcoal/60 text-sm mb-2">Specialties:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAgent.specialties.map((specialty, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 rounded-full bg-gold/20 text-gold text-xs"
                                            >
                                                {specialty}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <a
                                        href={`tel:${selectedAgent.phone}`}
                                        className="flex-1 px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition flex items-center justify-center gap-2"
                                    >
                                        <Phone className="w-4 h-4" />
                                        Call Agent
                                    </a>
                                    <a
                                        href={`mailto:${selectedAgent.email}`}
                                        className="px-4 py-2 border border-charcoal/20 text-charcoal font-semibold rounded-lg hover:bg-charcoal/5 transition flex items-center gap-2"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Property Details */}
                    {sellerInfo && (
                        <div className="premium-card rounded-2xl p-8 mb-8">
                            <h2 className="text-2xl font-bold text-charcoal mb-6">Property Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-charcoal/60 text-sm mb-1">Property Address</p>
                                    <p className="text-charcoal font-semibold">{sellerInfo.propertyAddress || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-charcoal/60 text-sm mb-1">Property Type</p>
                                    <p className="text-charcoal font-semibold capitalize">{sellerInfo.propertyType || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-charcoal/60 text-sm mb-1">Bedrooms</p>
                                    <p className="text-charcoal font-semibold">{sellerInfo.bedrooms || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-charcoal/60 text-sm mb-1">Bathrooms</p>
                                    <p className="text-charcoal font-semibold">{sellerInfo.bathrooms || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-charcoal/60 text-sm mb-1">Property Size</p>
                                    <p className="text-charcoal font-semibold">{sellerInfo.propertySize ? `${sellerInfo.propertySize} m²` : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-charcoal/60 text-sm mb-1">Estimated Value</p>
                                    <p className="text-gold font-bold text-xl">
                                        R {sellerInfo.currentValue ? parseFloat(sellerInfo.currentValue).toLocaleString() : '0'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-charcoal/60 text-sm mb-1">Reason for Selling</p>
                                    <p className="text-charcoal font-semibold capitalize">{sellerInfo.reasonForSelling || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-charcoal/60 text-sm mb-1">Selling Timeline</p>
                                    <p className="text-charcoal font-semibold capitalize">
                                        {sellerInfo.timeline ? sellerInfo.timeline.replace('-', ' to ') : 'N/A'}
                                    </p>
                                </div>
                                {sellerInfo.hasBond && (
                                    <div>
                                        <p className="text-charcoal/60 text-sm mb-1">Bond Balance</p>
                                        <p className="text-charcoal font-semibold">
                                            R {sellerInfo.bondBalance ? parseFloat(sellerInfo.bondBalance).toLocaleString() : '0'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
                </div>
            </main>

            {/* Agent Selection Modal */}
            {showAgentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-8 py-6 border-b border-gold/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                        Select an Agent
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowAgentModal(false)}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group hover:scale-110"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">

                        {/* Search */}
                        <div className="mb-6 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
                            <input
                                type="text"
                                placeholder="Search agents by name, company, or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
                            />
                        </div>

                        {/* Agents List */}
                        <div className="space-y-4">
                            {filteredAgents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                                    <p className="text-charcoal/70 text-lg">No agents found</p>
                                </div>
                            ) : (
                                filteredAgents.map((agent) => (
                                    <div
                                        key={agent.id}
                                        className={`premium-card rounded-xl p-6 cursor-pointer transition ${
                                            selectedAgent?.id === agent.id
                                                ? 'border-2 border-gold bg-gold/5'
                                                : 'border border-charcoal/20 hover:border-gold/50'
                                        }`}
                                        onClick={() => handleSelectAgent(agent)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-xl font-bold text-charcoal">{agent.name}</h4>
                                                    {agent.verified && (
                                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-charcoal/60 text-sm mb-3">{agent.company}</p>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-gold fill-gold" />
                                                        <span className="text-charcoal font-semibold">{agent.rating}</span>
                                                    </div>
                                                    <span className="text-charcoal/60 text-sm">{agent.totalSales} sales</span>
                                                    <span className="text-charcoal/60 text-sm">{agent.experience}</span>
                                                    <span className="text-charcoal/60 text-sm">{agent.location}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {agent.specialties.map((specialty, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-1 rounded-full bg-gold/20 text-gold text-xs"
                                                        >
                                                            {specialty}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectAgent(agent);
                                                }}
                                                className={`px-6 py-2 rounded-lg font-semibold transition ${
                                                    selectedAgent?.id === agent.id
                                                        ? 'bg-gold text-white'
                                                        : 'bg-gold/10 text-gold hover:bg-gold hover:text-white'
                                                }`}
                                            >
                                                {selectedAgent?.id === agent.id ? 'Selected' : 'Select'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                            <button
                                onClick={() => setShowAgentModal(false)}
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
