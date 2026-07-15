'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, FileText, Building2, Calendar, Phone, Mail, MapPin, DollarSign, Users, CheckCircle, X, Search, Star, Clock } from 'lucide-react';
import UserPortalLayout from '@/components/UserPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import { formatCurrency, parseAmountForDisplay } from '@/lib/currency';
import AppointmentConfirmPanel from '@/components/AppointmentConfirmPanel';
import PpraTrustSection from '@/components/PpraTrustSection';
import { mapAgentRecord, filterPublicAgents } from '@/lib/map-agent';
import { PORTAL_PAGE_CONTAINER, PORTAL_PRIMARY_BTN, PORTAL_STAT_ICON } from '@/lib/portal-ui';

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
    ppraNumber?: string;
    ffcNumber?: string;
    ffcDocumentUrl?: string;
    verificationStatus?: string;
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
    const [showSyncFailedBanner, setShowSyncFailedBanner] = useState(false);
    const [confirmRefreshKey, setConfirmRefreshKey] = useState(0);

    useEffect(() => {
        async function load() {
            if (typeof window === 'undefined') return;
            const userData = localStorage.getItem('propReady_currentUser');
            if (!userData) {
                router.push('/login');
                return;
            }
            const user = JSON.parse(userData);
            setCurrentUser(user);

            const storedSellerInfo = localStorage.getItem('propReady_sellerInfo');
            if (storedSellerInfo) {
                setSellerInfo(JSON.parse(storedSellerInfo));
            }

            const storedSelectedAgent = localStorage.getItem(`propReady_selectedAgent_${user.id}`);
            if (storedSelectedAgent) {
                setSelectedAgent(JSON.parse(storedSelectedAgent));
            }

            const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
            const parsedSeller = storedSellerInfo ? JSON.parse(storedSellerInfo) : null;
            const sellerPhone = parsedSeller?.phone?.replace(/\s/g, '') || '';
            const userEmail = user.email?.toLowerCase() || '';
            const matchSeller = (v: any) => {
                if (v.sellerEmail && v.sellerEmail.toLowerCase() === userEmail) return true;
                return v.contactType === 'seller' && (
                    (v.contactName && user.fullName && v.contactName.toLowerCase() === user.fullName.toLowerCase()) ||
                    (v.contactEmail && userEmail && v.contactEmail.toLowerCase() === userEmail) ||
                    (sellerPhone && v.contactPhone && v.contactPhone.replace(/\s/g, '') === sellerPhone)
                );
            };
            let apiViewings: any[] = [];
            try {
                const res = await fetch(`/api/viewings?contactEmail=${encodeURIComponent(user.email)}`, { cache: 'no-store' });
                const data = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(data.viewings)) {
                    apiViewings = (data.viewings || []).filter(matchSeller);
                }
            } catch (e) {
                console.warn('Failed to load viewings from API', e);
            }
            const ids = new Set(apiViewings.map((v: any) => v.id));
            const localOnly = storedViewings.filter((v: any) => matchSeller(v) && !ids.has(v.id));
            const userViewings = [...apiViewings, ...localOnly].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
            setViewingAppointments(userViewings);

            if (sessionStorage.getItem('propReady_sellerLeadSyncFailed')) {
                setShowSyncFailedBanner(true);
            }
            setIsLoading(false);
        }
        load();
    }, [router, confirmRefreshKey]);

    useEffect(() => {
        // Load real registered agents
        if (typeof window !== 'undefined') {
            const storedAgents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
            const mapped: Agent[] = filterPublicAgents(
                storedAgents.map((a: Record<string, unknown>) => {
                    const m = mapAgentRecord(a);
                    return {
                        id: m.id,
                        name: m.fullName || 'Agent',
                        company: m.company || 'Agency',
                        email: m.email || '',
                        phone: m.phone || '',
                        rating: typeof a.rating === 'number' ? (a.rating as number) : 4.8,
                        totalSales: typeof a.totalSales === 'number' ? (a.totalSales as number) : 0,
                        experience: (a.experience as string) || '—',
                        location: (a.location as string) || m.city || 'South Africa',
                        listingQualityScore:
                            typeof a.listingQualityScore === 'number'
                                ? (a.listingQualityScore as number)
                                : 85,
                        specialties: Array.isArray(a.specialties) ? (a.specialties as string[]) : [],
                        verified: m.verified,
                        ppraNumber: m.ppraNumber,
                        ffcNumber: m.ffcNumber,
                        ffcDocumentUrl: m.ffcDocumentUrl,
                        verificationStatus: m.verificationStatus,
                    };
                })
            ) as Agent[];
            setAvailableAgents(mapped);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-charcoal/60">Loading...</p>
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
        <>
            <UserPortalLayout
                portal="seller"
                activePage="dashboard"
                user={currentUser}
                title="Dashboard"
                pageHeader={
                    <PortalPageHeader
                        variant="premium"
                        eyebrow={`Welcome back${currentUser?.fullName ? `, ${currentUser.fullName.split(' ')[0]}` : ''}`}
                        title={<>Seller Dashboard <span aria-hidden="true">👋</span></>}
                        description="Manage your property listing and connect with agents"
                    />
                }
            >
                <div className={`${PORTAL_PAGE_CONTAINER} relative z-10`}>
                    {currentUser && (
                        <AppointmentConfirmPanel
                            viewings={viewingAppointments}
                            userEmail={currentUser.email}
                            party="seller"
                            onConfirmed={() => setConfirmRefreshKey((k) => k + 1)}
                        />
                    )}

                    {showSyncFailedBanner && (
                        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-900">
                            <p className="text-sm">
                                Your info was saved locally. We couldn&apos;t sync to agent dashboards—your agent may need to run a database update (see setup docs).
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('propReady_sellerLeadSyncFailed');
                                    setShowSyncFailedBanner(false);
                                }}
                                className="shrink-0 rounded p-1 hover:bg-amber-100 transition"
                                aria-label="Dismiss"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    {/* Property Summary Card */}
                    {sellerInfo && (
                        <div className="premium-card p-8 mb-8 sm:mb-10 overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-charcoal mb-2">Your Property</h2>
                                        <p className="text-charcoal/60 text-sm">Property listing details</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-gold mb-1">
                                            {formatCurrency(parseAmountForDisplay(sellerInfo.currentValue))}
                                        </div>
                                        <p className="text-charcoal/50 text-sm font-medium">Estimated Value</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                    <div className="portal-stat-inner">
                                        <p className="text-charcoal/45 text-xs font-medium mb-2 uppercase tracking-[0.08em]">Property Type</p>
                                        <p className="text-charcoal font-bold text-xl capitalize">
                                            {sellerInfo.propertyType || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="portal-stat-inner">
                                        <p className="text-charcoal/45 text-xs font-medium mb-2 uppercase tracking-[0.08em]">Timeline</p>
                                        <p className="text-charcoal font-bold text-xl capitalize">
                                            {sellerInfo.timeline ? sellerInfo.timeline.replace('-', ' to ') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6 mb-8 sm:mb-10">
                        <Link href="/sellers" className="premium-card p-6 text-center group">
                            <div className={`${PORTAL_STAT_ICON} mx-auto mb-4`}>
                                <FileText className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Learning Center</h3>
                        </Link>

                        <Link href="/sellers/valuation" className="premium-card p-6 text-center group">
                            <div className={`${PORTAL_STAT_ICON} mx-auto mb-4`}>
                                <Calendar className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Book Valuation</h3>
                        </Link>

                        <button
                            onClick={() => setShowAgentModal(true)}
                            className="premium-card p-6 text-center group"
                        >
                            <div className={`${PORTAL_STAT_ICON} mx-auto mb-4`}>
                                <Users className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">
                                {selectedAgent ? 'My Agent' : 'Select Agent'}
                            </h3>
                        </button>

                        <Link href="/dashboard" className="premium-card p-6 text-center group">
                            <div className={`${PORTAL_STAT_ICON} mx-auto mb-4`}>
                                <Home className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Buyer Dashboard</h3>
                        </Link>

                        <Link href="/dashboard/viewings" className="premium-card p-6 text-center group">
                            <div className={`${PORTAL_STAT_ICON} mx-auto mb-4`}>
                                <Calendar className="w-6 h-6 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Viewings</h3>
                            {viewingAppointments.length > 0 && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-semibold">
                                    {viewingAppointments.length}
                                </span>
                            )}
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
                                <Link
                                    href="/dashboard/viewings"
                                    className="px-4 py-2 text-gold hover:underline text-sm font-semibold"
                                >
                                    View All
                                </Link>
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
                                                {(viewing.propertyPrice ?? 0) > 0 && (
                                                    <p className="text-gold font-bold text-lg mb-2">{formatCurrency(viewing.propertyPrice)}</p>
                                                )}
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
                                            PPRA Verified
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <PpraTrustSection agent={selectedAgent} />
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
                                <div className="md:col-span-2">
                                    <p className="text-charcoal/60 text-sm mb-1">Property Address</p>
                                    <p className="text-charcoal font-semibold">
                                        {sellerInfo.propertyAddress
                                            ? sellerInfo.propertyAddress.split(',').map((s: string) => s.trim()).filter(Boolean).join(', ')
                                            : 'N/A'}
                                    </p>
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
                                    <p className="text-charcoal/60 text-sm mb-1">Land size</p>
                                    <p className="text-charcoal font-semibold">{sellerInfo.landSize ? `${sellerInfo.landSize} m²` : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-charcoal/60 text-sm mb-1">Building / structure size</p>
                                    <p className="text-charcoal font-semibold">{sellerInfo.buildingSize ? `${sellerInfo.buildingSize} m²` : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-charcoal/60 text-sm mb-1">Estimated Value</p>
                                    <p className="text-gold font-bold text-xl">
                                        {formatCurrency(parseAmountForDisplay(sellerInfo.currentValue))}
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
                                            {formatCurrency(parseAmountForDisplay(sellerInfo.bondBalance))}
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
            </UserPortalLayout>

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
        </>
    );
}
