'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Users, Phone, Mail, MessageCircle, MapPin, Building2, CheckCircle, Star, Calendar, X } from 'lucide-react';
import LearningCenterDropdown from '@/components/LearningCenterDropdown';

export default function MyAgentPage() {
    const router = useRouter();
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedOtherAgent, setSelectedOtherAgent] = useState<any>(null);
    const [showAgentDetails, setShowAgentDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string; email: string } | null>(null);
    const [agent, setAgent] = useState<any>(null);
    const [otherAgents, setOtherAgents] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [showFindAgent, setShowFindAgent] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('propReady_currentUser');
            if (!userData) {
                router.push('/login');
            } else {
                const user = JSON.parse(userData);
                setCurrentUser(user);

                const storedSelectedAgent = localStorage.getItem(`propReady_selectedAgent_${user.id}`);
                const selected = storedSelectedAgent ? JSON.parse(storedSelectedAgent) : null;
                setAgent(selected);

                const storedAgents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
                const mappedAgents = storedAgents.map((a: any) => ({
                    id: a.id,
                    name: a.fullName || a.name || 'Agent',
                    company: a.company || a.brandName || 'Agency',
                    email: a.email || '',
                    phone: a.phone || '',
                    rating: typeof a.rating === 'number' ? a.rating : 4.8,
                    totalSales: typeof a.totalSales === 'number' ? a.totalSales : 0,
                    experience: a.experience || '—',
                    specialties: Array.isArray(a.specialties) ? a.specialties : [],
                    bio: a.bio,
                    location: a.location || 'South Africa',
                    eaabNumber: a.eaabNumber,
                    verified: a.status ? a.status === 'approved' : !!a.verified
                }));
                setOtherAgents(mappedAgents.filter((a: any) => !selected || a.id !== selected.id));
                setRecentActivity([]);
                setIsLoading(false);
            }
        }
    }, [router]);

    useEffect(() => {
        fetch('/api/agents/count')
            .then((res) => res.ok ? res.json() : { count: 0 })
            .then((data) => setShowFindAgent((data?.count ?? 0) > 10))
            .catch(() => setShowFindAgent(false));
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
    
    // All agent data is loaded from real registered agents (localStorage: propReady_agents)

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
                            <Link href="/search" className="text-charcoal/90 hover:text-charcoal transition">
                                Properties
                            </Link>
                            <LearningCenterDropdown />
                            <Link
                                href="/sellers"
                                className="px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                            >
                                For Sellers
                            </Link>
                            <Link href="/calculator" className="text-charcoal/90 hover:text-charcoal transition">
                                Bond Calculator
                            </Link>
                            <Link href="/dashboard" className="text-charcoal/90 hover:text-charcoal transition">
                                Dashboard
                            </Link>
                        </div>
                    </div>

                    <Link
                        href="/dashboard"
                        className="flex items-center space-x-2 text-charcoal/90 hover:text-white transition"
                    >
                        <span>Back to Dashboard</span>
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-24 pb-8">
                <div className="container mx-auto max-w-5xl relative z-10">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-charcoal mb-2">
                            My Agent
                        </h1>
                        <p className="text-charcoal/60 text-lg">
                            Connect with your assigned real estate agent
                        </p>
                    </div>

                    {!agent ? (
                        <div className="premium-card rounded-2xl p-10 text-center">
                            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gold/20">
                                <Users className="w-8 h-8 text-gold" />
                            </div>
                            <h2 className="text-2xl font-bold text-charcoal mb-2">No agent selected yet</h2>
                            <p className="text-charcoal/70 mb-6 max-w-xl mx-auto">
                                Once you choose an agent, their details will appear here.
                            </p>
                            <Link
                                href="/search"
                                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gold text-charcoal font-semibold hover:bg-gold/90 transition"
                            >
                                Browse Properties
                            </Link>
                        </div>
                    ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Agent Profile Card */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Agent Info Card */}
                            <div className="premium-card rounded-2xl p-8">
                                <div className="flex items-start gap-6 mb-6">
                                    <div className="w-24 h-24 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                                        <Users className="w-12 h-12 text-charcoal" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-3xl font-bold text-charcoal">{agent.name}</h2>
                                            {agent.verified && (
                                                <span className="px-2 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-charcoal/60 text-lg mb-1">{agent.company}</p>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < Math.floor(agent.rating) ? 'text-gold fill-gold' : 'text-charcoal/30'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-charcoal/50 text-sm">{agent.rating} ({agent.totalSales} sales)</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-charcoal/50 text-sm">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {agent.location}
                                            </span>
                                            <span>{agent.experience} experience</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-charcoal/10 pt-6">
                                    <h3 className="text-charcoal font-semibold mb-3">About</h3>
                                    <p className="text-charcoal/70 leading-relaxed">{agent.bio}</p>
                                </div>

                                <div className="border-t border-charcoal/10 pt-6 mt-6">
                                    <h3 className="text-charcoal font-semibold mb-3">Specialties</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {agent.specialties.map((specialty: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-semibold"
                                            >
                                                {specialty}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Card */}
                            <button
                                onClick={() => setShowContactModal(true)}
                                className="premium-card rounded-2xl p-6 w-full text-left hover:scale-[1.02] transition-transform"
                            >
                                <h3 className="text-xl font-bold text-charcoal mb-4">Contact Your Agent</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gold/5 to-gold/10 rounded-lg border border-gold/20">
                                        <Phone className="w-5 h-5 text-gold flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-charcoal/50 text-xs">Phone</p>
                                            <p className="text-charcoal font-semibold truncate">{agent.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gold/5 to-gold/10 rounded-lg border border-gold/20">
                                        <Mail className="w-5 h-5 text-gold flex-shrink-0" />
                                        <div className="min-w-0 flex-1 overflow-hidden">
                                            <p className="text-charcoal/50 text-xs">Email</p>
                                            <p className="text-charcoal font-semibold text-sm truncate" title={agent.email}>{agent.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gold/5 to-gold/10 rounded-lg border border-gold/20">
                                        <MessageCircle className="w-5 h-5 text-gold flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-charcoal/50 text-xs">WhatsApp</p>
                                            <p className="text-charcoal font-semibold">Message</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-charcoal/50 text-sm mt-4 text-center">Click to contact your agent</p>
                            </button>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Agent Credentials */}
                            <div className="premium-card rounded-xl p-6">
                                <h3 className="text-charcoal font-bold mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-gold" />
                                    Credentials
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-charcoal/50 text-sm mb-1">EAAB Number</p>
                                        <p className="text-charcoal font-semibold">{agent.eaabNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-charcoal/50 text-sm mb-1">Company</p>
                                        <p className="text-charcoal font-semibold">{agent.company}</p>
                                    </div>
                                    <div>
                                        <p className="text-charcoal/50 text-sm mb-1">Experience</p>
                                        <p className="text-charcoal font-semibold">{agent.experience}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="premium-card rounded-xl p-6">
                                <h3 className="text-charcoal font-bold mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gold" />
                                    Recent Activity
                                </h3>
                                <div className="space-y-3">
                                    {recentActivity.map((activity, index) => (
                                        <div key={index} className="text-sm pb-3 border-b border-charcoal/10 last:border-0">
                                            <p className="text-charcoal font-medium mb-1">{activity.action}</p>
                                            <p className="text-charcoal/40 text-xs">{activity.date}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* No Agent Assigned State (if needed) */}
                            {!agent && (
                                <div className="premium-card rounded-xl p-6 text-center">
                                    <Users className="w-12 h-12 text-charcoal/30 mx-auto mb-4" />
                                    <p className="text-charcoal/60 mb-4">No agent assigned yet</p>
                                    {showFindAgent && (
                                        <Link href="/agents/login" className="inline-block px-6 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition">
                                            Find an Agent
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Other Agents Section - only when more than 10 agents on platform */}
                    {showFindAgent && (
                    <div className="mt-8">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-charcoal mb-2">Other Available Agents</h2>
                            <p className="text-charcoal/60">Connect with other verified agents in our network</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {otherAgents.map((otherAgent) => (
                                <button
                                    key={otherAgent.id}
                                    onClick={() => setShowAgentDetails(otherAgent)}
                                    className="premium-card rounded-2xl p-6 text-left w-full group"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                                            <Users className="w-10 h-10 text-charcoal" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-charcoal font-bold text-lg truncate">{otherAgent.name}</h3>
                                                {otherAgent.verified && (
                                                    <span className="px-1.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                                                        <CheckCircle className="w-3 h-3" />
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-charcoal/50 text-sm truncate mb-2">{otherAgent.company}</p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3.5 h-3.5 ${i < Math.floor(otherAgent.rating) ? 'text-gold fill-gold' : 'text-charcoal/30'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-charcoal/50 text-xs">{otherAgent.rating} ({otherAgent.totalSales} sales)</span>
                                            </div>
                                            <p className="text-charcoal/40 text-xs flex items-center gap-1 mb-3">
                                                <MapPin className="w-3 h-3" />
                                                {otherAgent.location}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-charcoal/10 pt-4 mb-4">
                                        <p className="text-charcoal/50 text-xs mb-2">Specialties</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {otherAgent.specialties.map((specialty: string, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold"
                                                >
                                                    {specialty}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOtherAgent(otherAgent);
                                        }}
                                        className="w-full px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition text-center"
                                    >
                                        Contact Agent
                                    </div>
                                </button>
                            ))}
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

            {/* Contact Modal */}
            {showContactModal && (
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
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                                {agent.name}
                                            </h2>
                                            <p className="text-white/90 text-sm">{agent.company}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowContactModal(false)}
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
                                    <p className="text-charcoal/50 text-sm mb-1 font-semibold">Phone Number</p>
                                    <p className="text-2xl font-bold text-gold">{agent.phone}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-charcoal/10 shadow-sm overflow-hidden">
                                    <p className="text-charcoal/50 text-sm mb-1 font-semibold">Email Address</p>
                                    <p className="text-base font-semibold text-charcoal truncate min-w-0" title={agent.email}>{agent.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href={`tel:${agent.phone.replace(/\s/g, '')}`}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-5 h-5" />
                                    Call Now
                                </a>
                                <a
                                    href={`mailto:${agent.email}`}
                                    className="w-full px-6 py-3 border border-charcoal/20 text-charcoal font-semibold rounded-xl hover:bg-charcoal/5 transition flex items-center justify-center gap-2"
                                >
                                    <Mail className="w-5 h-5" />
                                    Send Email
                                </a>
                                <a
                                    href={`https://wa.me/${agent.phone.replace(/\s/g, '')}`}
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
                                onClick={() => setShowContactModal(false)}
                                className="px-8 py-3.5 bg-gradient-to-r from-gold to-gold/90 text-white font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                            >
                                <span>Done</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Agent Contact Modal */}
            {selectedOtherAgent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="premium-card rounded-2xl p-8 max-w-md w-full relative">
                        <button
                            onClick={() => setSelectedOtherAgent(null)}
                            className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal transition"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-charcoal" />
                            </div>
                            <h3 className="text-2xl font-bold text-charcoal mb-2">{selectedOtherAgent.name}</h3>
                            <p className="text-charcoal/60 text-sm mb-4">{selectedOtherAgent.company}</p>
                            <div className="premium-card rounded-lg p-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20 mb-4">
                                <p className="text-charcoal/50 text-sm mb-1">Phone Number</p>
                                <p className="text-2xl font-bold text-gold">{selectedOtherAgent.phone}</p>
                            </div>
                            <div className="premium-card rounded-lg p-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20 overflow-hidden">
                                <p className="text-charcoal/50 text-sm mb-1">Email Address</p>
                                <p className="text-base font-semibold text-charcoal truncate min-w-0" title={selectedOtherAgent.email}>{selectedOtherAgent.email}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <a
                                href={`tel:${selectedOtherAgent.phone.replace(/\s/g, '')}`}
                                className="w-full px-6 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition flex items-center justify-center gap-2"
                            >
                                <Phone className="w-5 h-5" />
                                Call Now
                            </a>
                            <a
                                href={`mailto:${selectedOtherAgent.email}`}
                                className="w-full px-6 py-3 border border-charcoal/20 text-charcoal font-semibold rounded-lg hover:bg-charcoal/5 transition flex items-center justify-center gap-2"
                            >
                                <Mail className="w-5 h-5" />
                                Send Email
                            </a>
                            <a
                                href={`https://wa.me/${selectedOtherAgent.phone.replace(/\s/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full px-6 py-3 border border-charcoal/20 text-charcoal font-semibold rounded-lg hover:bg-charcoal/5 transition flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-5 h-5" />
                                WhatsApp
                            </a>
                            <button
                                onClick={() => setSelectedOtherAgent(null)}
                                className="w-full px-6 py-3 text-charcoal/60 hover:text-charcoal transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Agent Details Modal */}
            {showAgentDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="premium-card rounded-2xl p-8 max-w-3xl w-full relative my-8">
                        <button
                            onClick={() => setShowAgentDetails(null)}
                            className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal transition"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="mb-6">
                            <div className="flex items-start gap-6 mb-6">
                                <div className="w-24 h-24 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                                    <Users className="w-12 h-12 text-charcoal" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-bold text-charcoal">{showAgentDetails.name}</h2>
                                        {showAgentDetails.verified && (
                                            <span className="px-2 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-charcoal/60 text-lg mb-1">{showAgentDetails.company}</p>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i < Math.floor(showAgentDetails.rating) ? 'text-gold fill-gold' : 'text-charcoal/30'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-charcoal/50 text-sm">{showAgentDetails.rating} ({showAgentDetails.totalSales} sales)</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-charcoal/50 text-sm">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {showAgentDetails.location}
                                        </span>
                                        <span>{showAgentDetails.experience} experience</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-charcoal/10 pt-6 mb-6">
                                <h3 className="text-charcoal font-semibold mb-3">About</h3>
                                <p className="text-charcoal/70 leading-relaxed">
                                    Experienced real estate agent specializing in {showAgentDetails.specialties.join(', ')}. 
                                    With {showAgentDetails.experience} of experience and {showAgentDetails.totalSales} successful sales, 
                                    I&apos;m committed to helping you find your perfect property in {showAgentDetails.location}.
                                </p>
                            </div>

                            <div className="border-t border-charcoal/10 pt-6 mb-6">
                                <h3 className="text-charcoal font-semibold mb-3">Specialties</h3>
                                <div className="flex flex-wrap gap-2">
                                    {showAgentDetails.specialties.map((specialty: string, index: number) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-semibold"
                                        >
                                            {specialty}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-charcoal/10 pt-6">
                                <h3 className="text-charcoal font-semibold mb-4">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="premium-card rounded-lg p-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
                                        <p className="text-charcoal/50 text-sm mb-1">Phone Number</p>
                                        <p className="text-xl font-bold text-gold">{showAgentDetails.phone}</p>
                                    </div>
                                    <div className="premium-card rounded-lg p-4 bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20 overflow-hidden">
                                        <p className="text-charcoal/50 text-sm mb-1">Email Address</p>
                                        <p className="text-base font-semibold text-charcoal truncate min-w-0" title={showAgentDetails.email}>{showAgentDetails.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <a
                                        href={`tel:${showAgentDetails.phone.replace(/\s/g, '')}`}
                                        className="flex-1 px-6 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition flex items-center justify-center gap-2"
                                    >
                                        <Phone className="w-5 h-5" />
                                        Call Now
                                    </a>
                                    <a
                                        href={`mailto:${showAgentDetails.email}`}
                                        className="flex-1 px-6 py-3 border border-charcoal/20 text-charcoal font-semibold rounded-lg hover:bg-charcoal/5 transition flex items-center justify-center gap-2"
                                    >
                                        <Mail className="w-5 h-5" />
                                        Send Email
                                    </a>
                                    <a
                                        href={`https://wa.me/${showAgentDetails.phone.replace(/\s/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 px-6 py-3 border border-charcoal/20 text-charcoal font-semibold rounded-lg hover:bg-charcoal/5 transition flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        WhatsApp
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

