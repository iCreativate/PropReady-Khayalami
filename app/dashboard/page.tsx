'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, FileText, Heart, Users, TrendingUp, Download, Calendar, Building2, Phone, ExternalLink, CheckCircle, X, MapPin, Clock, Upload, Eye } from 'lucide-react';
import UserPortalLayout from '@/components/UserPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import BondOriginatorSlider from '@/components/BondOriginatorSlider';
import BuyerDocumentPreviewModal from '@/components/BuyerDocumentPreviewModal';
import { formatCurrency, parseAmountForDisplay } from '@/lib/currency';
import type { BondOriginator } from '@/lib/bond-originators';
import { BUYER_DOCUMENT_SLOTS, readBuyerDocumentsLocal, refreshBuyerDocumentsFromApi, type BuyerDocument } from '@/lib/buyer-documents';
import { readLocalViewingsForUser, refreshViewingsFromApi } from '@/lib/buyer-viewings';
import { resolveBuyerQuizResultSync, type BuyerQuizResult } from '@/lib/quiz-result';
import { resolvePrequalMode } from '@/lib/buyer-full-prequal';
import type { ListedProperty } from '@/lib/listed-property';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import { PORTAL_PAGE_CONTAINER, PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN, PORTAL_STAT_ICON, PORTAL_CARD } from '@/lib/portal-ui';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import OnboardingGateModal from '@/components/onboarding/OnboardingGateModal';
import BuyerPrequalOnboardingForm from '@/components/onboarding/BuyerPrequalOnboardingForm';
import PortalLoading from '@/components/PortalLoading';
import PropReadyScoreCard from '@/components/PropReadyScoreCard';

type MatchedListing = ListedProperty & { matchScore: number };

function normalizeListedProperty(p: Record<string, unknown>): ListedProperty | null {
    if (!p?.id || !p?.type) return null;
    if (p.published === false) return null;
    return {
        id: String(p.id),
        title: String(p.title || 'Listed Property'),
        address: String(p.address || ''),
        type: String(p.type || 'Property'),
        price: Number(p.price || 0),
        bedrooms: Number(p.bedrooms || 0),
        bathrooms: Number(p.bathrooms || 0),
        size: Number(p.size || 0),
        description: String(p.description || ''),
        agentId: String(p.agentId || ''),
        timestamp: String(p.timestamp || ''),
        images: Array.isArray(p.images) ? (p.images as string[]) : undefined,
        features: Array.isArray(p.features) ? (p.features as string[]) : undefined,
        videoUrl: p.videoUrl ? String(p.videoUrl) : undefined,
        published: p.published !== false,
    };
}

async function loadPublishedListings(): Promise<ListedProperty[]> {
    let apiProperties: ListedProperty[] = [];
    try {
        const res = await fetch(`/api/properties?_=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.properties)) {
            apiProperties = data.properties
                .map((p: Record<string, unknown>) => normalizeListedProperty(p))
                .filter(Boolean) as ListedProperty[];
        }
    } catch {
        /* fall back to local */
    }

    let localOnly: ListedProperty[] = [];
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.listedProperties) || '[]');
        localOnly = (Array.isArray(stored) ? stored : [])
            .map((p: Record<string, unknown>) => normalizeListedProperty(p))
            .filter(Boolean) as ListedProperty[];
    } catch {
        localOnly = [];
    }

    const ids = new Set(apiProperties.map((p) => p.id));
    return [...apiProperties, ...localOnly.filter((p) => !ids.has(p.id))];
}

function matchListingsToPrequal(
    listings: ListedProperty[],
    preQualAmount: number,
    score: number
): MatchedListing[] {
    if (!listings.length) return [];

    if (preQualAmount <= 0) {
        return [...listings]
            .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
            .slice(0, 3)
            .map((p) => ({ ...p, matchScore: 0 }));
    }

    const scored = listings.map((property) => {
        const priceDifference = Math.abs(property.price - preQualAmount);
        const maxDifference = Math.max(preQualAmount * 0.4, 1);
        const priceMatch = Math.max(0, 100 - (priceDifference / maxDifference) * 60);
        const scoreMatch = score * 0.4;
        const matchScore = Math.min(100, Math.max(0, Math.round(priceMatch + scoreMatch)));
        const withinBand = priceDifference <= preQualAmount * 0.35;
        return { ...property, matchScore, withinBand };
    });

    const matched = scored
        .filter((p) => p.withinBand)
        .sort((a, b) => b.matchScore - a.matchScore);

    const pool = matched.length > 0 ? matched : scored.sort((a, b) => b.matchScore - a.matchScore);

    return pool.slice(0, 3).map(({ withinBand: _w, ...rest }) => rest);
}

function readSellerInfoForUser(user: { id?: string; email?: string }) {
    if (typeof window === 'undefined') return null;
    try {
        const storedSellerInfo = localStorage.getItem(STORAGE_KEYS.sellerInfo);
        if (!storedSellerInfo) return null;
        const seller = JSON.parse(storedSellerInfo);
        if (seller.id === user.id || seller.email === user.email) {
            return seller;
        }
    } catch {
        /* ignore */
    }
    return null;
}

function readQuizSummary(user: { id?: string; email?: string }) {
    const result = resolveBuyerQuizResultSync(user);
    if (!result) return null;
    // Deposit must never fall back to debt/expenses — those are separate fields.
    const depositRaw = result.depositSaved;
    const depositSaved =
        depositRaw != null && String(depositRaw).trim() !== '' ? String(depositRaw) : '0';
    const debtRaw = result.hasDebt ? result.expenses : null;
    const softAmount = result.preQualAmount || 0;
    const prequal = resolvePrequalMode({
        userId: user.id,
        softAmount,
    });
    return {
        ...result,
        score: result.score || 0,
        preQualAmount: prequal.displayAmount || softAmount,
        monthlyIncome: result.monthlyIncome || '0',
        depositSaved,
        monthlyDebt: debtRaw != null && String(debtRaw).trim() !== '' ? String(debtRaw) : null,
        hasDebt: result.hasDebt === true,
        fullName: result.fullName || 'User',
    } satisfies BuyerQuizResult & {
        monthlyDebt: string | null;
        hasDebt: boolean;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const { user: currentUser, isHydrated } = useHydratedBuyerPortalUser();
    const {
        loading: onboardingLoading,
        required: onboardingRequired,
        intent: onboardingIntent,
        user: onboardingUser,
        completeOnboarding,
    } = useOnboardingGate();
    const [selectedOriginator, setSelectedOriginator] = useState<BondOriginator | null>(null);
    const [quizResult, setQuizResult] = useState<ReturnType<typeof readQuizSummary> | null>(null);
    const [sellerInfo, setSellerInfo] = useState<any>(null);
    const [isSeller, setIsSeller] = useState(false);
    const [viewingAppointments, setViewingAppointments] = useState<any[]>([]);
    const [buyerDocuments, setBuyerDocuments] = useState<BuyerDocument[]>([]);
    const [previewDoc, setPreviewDoc] = useState<BuyerDocument | null>(null);
    const [agentListings, setAgentListings] = useState<ListedProperty[]>([]);

    useEffect(() => {
        if (!isHydrated) return;

        if (!currentUser) {
            router.push('/login');
            return;
        }

        if (!onboardingLoading && onboardingIntent === 'seller' && onboardingRequired) {
            router.replace('/sellers/dashboard');
            return;
        }

        setQuizResult(readQuizSummary(currentUser));

        const seller = readSellerInfoForUser(currentUser);
        setSellerInfo(seller);
        setIsSeller(Boolean(seller));

        setViewingAppointments(readLocalViewingsForUser(currentUser, { includeSeller: false }));
        if (currentUser.id) {
            setBuyerDocuments(readBuyerDocumentsLocal(currentUser.id));
        }

        void Promise.all([
            refreshViewingsFromApi(currentUser, { includeSeller: false }).then(setViewingAppointments),
            currentUser.id
                ? refreshBuyerDocumentsFromApi(
                      currentUser.id,
                      readBuyerDocumentsLocal(currentUser.id)
                  ).then(setBuyerDocuments)
                : Promise.resolve(),
            loadPublishedListings().then(setAgentListings),
        ]);
    }, [router, isHydrated, currentUser, onboardingLoading, onboardingIntent, onboardingRequired]);

    const handleBuyerOnboardingComplete = async () => {
        await completeOnboarding();
        if (currentUser) {
            setQuizResult(readQuizSummary(currentUser));
        }
    };

    // Parse number from comma-formatted string (e.g., "250,000" -> 250000)
    const parseNumberFromString = (value: string): number => {
        if (!value) return 0;
        const digitsOnly = value.replace(/[^\d]/g, '');
        return digitsOnly ? Number(digitsOnly) : 0;
    };

    const suggestedProperties = useMemo(
        () =>
            matchListingsToPrequal(
                agentListings,
                quizResult?.preQualAmount ?? 0,
                quizResult?.score ?? 0
            ),
        [agentListings, quizResult?.preQualAmount, quizResult?.score]
    );

    const showSuggestedProperties = agentListings.length > 0 && suggestedProperties.length > 0;

    if (!isHydrated || !currentUser) {
        return <PortalLoading message="Loading dashboard…" />;
    }

    return (
        <>
            <UserPortalLayout
                portal="buyer"
                activePage="dashboard"
                user={currentUser}
                title="Dashboard"
                pageHeader={
                    <PortalPageHeader
                        variant="premium"
                        eyebrow={`Welcome back${currentUser?.fullName ? `, ${currentUser.fullName.split(' ')[0]}` : ''}`}
                        title={<>Buyer Dashboard <span aria-hidden="true">👋</span></>}
                        description={
                            isSeller && quizResult
                                ? "Your home buying and selling journey at a glance"
                                : "Your home buying journey at a glance"
                        }
                    />
                }
            >
                <div className={`${PORTAL_PAGE_CONTAINER} relative z-10`}>
                    {/* Seller Information Section (if user is also a seller) */}
                    {isSeller && sellerInfo && (
                        <div className={`${PORTAL_CARD} p-8 mb-8 sm:mb-10 overflow-hidden`}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={PORTAL_STAT_ICON}>
                                        <Building2 className="w-5 h-5 text-gold" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-charcoal mb-1">Your Property Listing</h2>
                                        <p className="text-charcoal/50 text-sm">Selling your property</p>
                                    </div>
                                </div>
                                <Link href="/sellers/dashboard" className={PORTAL_PRIMARY_BTN}>
                                    Go to Seller Dashboard
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                                    <div className="portal-stat-inner">
                                        <p className="text-charcoal/45 text-xs font-medium mb-2 uppercase tracking-[0.08em]">Property Value</p>
                                        <p className="text-charcoal font-bold text-xl">
                                            {formatCurrency(parseAmountForDisplay(sellerInfo.currentValue))}
                                        </p>
                                    </div>
                                    <div className="portal-stat-inner">
                                        <p className="text-charcoal/45 text-xs font-medium mb-2 uppercase tracking-[0.08em]">Property Type</p>
                                        <p className="text-charcoal font-bold text-xl capitalize">
                                            {sellerInfo.propertyType || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="portal-stat-inner">
                                        <p className="text-charcoal/45 text-xs font-medium mb-2 uppercase tracking-[0.08em]">Selling Timeline</p>
                                        <p className="text-charcoal font-bold text-sm capitalize">
                                            {sellerInfo.timeline ? sellerInfo.timeline.replace('-', ' to ') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                        </div>
                    )}

                    {/* PropReady Score Card */}
                    <PropReadyScoreCard
                        result={quizResult}
                        userId={currentUser.id}
                        documents={buyerDocuments}
                        viewingCount={viewingAppointments.length}
                        preQualAmount={quizResult?.preQualAmount ?? 0}
                        depositSavedLabel={formatCurrency(
                            quizResult
                                ? parseNumberFromString(quizResult.depositSaved || '0')
                                : 0
                        )}
                        monthlyDebtLabel={
                            quizResult?.monthlyDebt
                                ? formatCurrency(parseNumberFromString(quizResult.monthlyDebt))
                                : null
                        }
                        showDebtNote={Boolean(quizResult?.hasDebt && quizResult.monthlyDebt)}
                        onFullPrequalUpdated={() => {
                            if (currentUser) setQuizResult(readQuizSummary(currentUser));
                        }}
                    />

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 sm:gap-6 mb-8 sm:mb-10">
                        <Link href="/search" className={`${PORTAL_CARD} p-6 text-center group`}>
                            <div className={`${PORTAL_STAT_ICON} mx-auto mb-4`}>
                                <Home className="w-5 h-5 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Browse Properties</h3>
                        </Link>

                        <Link href="/dashboard/documents" className={`${PORTAL_CARD} p-6 text-center group border-red-200 ring-1 ring-red-100`}>
                            <div className={`${PORTAL_STAT_ICON} mx-auto mb-4 bg-red-50 border-red-100`}>
                                <FileText className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-red-700 font-semibold text-sm">Bond Originators</h3>
                            <p className="text-[11px] text-red-600/80 mt-1 font-medium">Full prequal</p>
                        </Link>

                        <Link href="/dashboard/agent" className={`${PORTAL_CARD} p-6 text-center group`}>
                            <div className={`${PORTAL_STAT_ICON} mx-auto mb-4`}>
                                <Users className="w-5 h-5 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">My Agent</h3>
                        </Link>

                        <Link href="/dashboard/viewings" className={`${PORTAL_CARD} p-6 text-center group`}>
                            <div className={`${PORTAL_STAT_ICON} mx-auto mb-4`}>
                                <Calendar className="w-5 h-5 text-gold" />
                            </div>
                            <h3 className="text-charcoal font-semibold text-sm">Viewings</h3>
                        </Link>
                    </div>

                    {/* Viewing Appointments Section */}
                    {viewingAppointments.length > 0 && (
                        <div className={`${PORTAL_CARD} p-8 mb-8 sm:mb-10`}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={PORTAL_STAT_ICON}>
                                        <Calendar className="w-5 h-5 text-gold" />
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
                                {viewingAppointments.slice(0, 3).map((viewing) => (
                                    <div
                                        key={viewing.id}
                                        className={`${PORTAL_CARD} p-6 border border-charcoal/20 hover:border-gold/50 transition`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-charcoal mb-2">{viewing.propertyTitle}</h3>
                                                <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{viewing.propertyAddress}</span>
                                                </div>
                                                {(viewing.propertyPrice ?? 0) > 0 && (
                                                    <p className="text-gold font-bold text-lg mb-2">{formatCurrency(viewing.propertyPrice!)}</p>
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

                    {/* Bond Originators Section */}
                    <div className={`${PORTAL_CARD} p-6 sm:p-8 mb-8 sm:mb-10 border-red-200 ring-1 ring-red-100`}>
                        <PortalPageHeader
                            variant="premium"
                            eyebrow="Extensive pre-qualification"
                            title="Recommended Bond Originators"
                            description="You’re signed in — choose an originator and upload documents to prequalify more thoroughly."
                            className="mb-6 sm:mb-8"
                        />

                        <BondOriginatorSlider
                            className="mb-4"
                            onContact={setSelectedOriginator}
                        />

                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-red-800 text-sm">
                                Ready for a full bond prequal? Send your FICA pack to an originator.
                            </p>
                            <Link
                                href="/dashboard/documents"
                                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition shrink-0"
                            >
                                Open Bond Originators
                            </Link>
                        </div>
                    </div>

                    {/* Main Dashboard Grid */}
                    <div
                        className={`grid grid-cols-1 gap-8 ${
                            showSuggestedProperties ? 'lg:grid-cols-3' : 'lg:grid-cols-1 lg:max-w-md'
                        }`}
                    >
                        {showSuggestedProperties ? (
                            <div className="lg:col-span-2">
                                <div className={`${PORTAL_CARD} p-6`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-charcoal flex items-center mb-1">
                                                <Heart className="w-6 h-6 mr-2 text-gold" />
                                                Suggested Properties
                                            </h2>
                                            <p className="text-charcoal/60 text-sm ml-8">
                                                From agent listings
                                                {quizResult && quizResult.preQualAmount > 0
                                                    ? ` · matched to your ${formatCurrency(quizResult.preQualAmount)} prequalification`
                                                    : ''}
                                            </p>
                                        </div>
                                        <Link
                                            href="/search"
                                            className="text-gold hover:text-gold-600 font-semibold text-sm transition-colors"
                                        >
                                            View All
                                        </Link>
                                    </div>

                                    <div className="space-y-3">
                                        {suggestedProperties.map((property) => {
                                            const thumb = property.images?.[0];
                                            return (
                                                <Link
                                                    key={property.id}
                                                    href={`/search?property=${encodeURIComponent(property.id)}`}
                                                    className={`${PORTAL_CARD} p-4 flex items-center space-x-4 group transition-all cursor-pointer`}
                                                >
                                                    <div className="w-20 h-20 bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-gold/20 group-hover:border-gold/40 transition-colors overflow-hidden">
                                                        {thumb ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={getProxiedImageUrl(thumb)}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Home className="w-8 h-8 text-gold/70" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-charcoal font-semibold mb-1 truncate">
                                                            {property.title}
                                                        </h3>
                                                        <p className="text-charcoal/50 text-sm mb-2 truncate">
                                                            {property.address || property.type}
                                                        </p>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className="text-gold font-bold text-lg">
                                                                {formatCurrency(property.price)}
                                                            </span>
                                                            {property.matchScore > 0 ? (
                                                                <span className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold shrink-0">
                                                                    {property.matchScore}% Match
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Activity & Documents */}
                        <div className="space-y-6">
                            {/* Recent Activity */}
                            <div className={`${PORTAL_CARD} p-6`}>
                                <h2 className="text-xl font-bold text-charcoal mb-5 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2 text-gold" />
                                    Recent Activity
                                </h2>
                                <div className="space-y-4">
                                    {showSuggestedProperties ? (
                                        <div className="text-sm pb-3 border-b border-charcoal/10 last:border-0">
                                            <p className="text-charcoal font-medium mb-1">
                                                {suggestedProperties.length} agent listing
                                                {suggestedProperties.length === 1 ? '' : 's'} matched for you
                                            </p>
                                            <p className="text-charcoal/40 text-xs">Just now</p>
                                        </div>
                                    ) : null}
                                    {quizResult ? (
                                        <div className="text-sm pb-3 border-b border-charcoal/10 last:border-0">
                                            <p className="text-charcoal font-medium mb-1">
                                                Completed qualification quiz
                                            </p>
                                            <p className="text-charcoal/40 text-xs">On file</p>
                                        </div>
                                    ) : null}
                                    {buyerDocuments.length > 0 ? (
                                        <div className="text-sm">
                                            <p className="text-charcoal font-medium mb-1">
                                                {buyerDocuments.length} document
                                                {buyerDocuments.length === 1 ? '' : 's'} uploaded
                                            </p>
                                            <p className="text-charcoal/40 text-xs">Documents</p>
                                        </div>
                                    ) : (
                                        <div className="text-sm">
                                            <p className="text-charcoal font-medium mb-1">
                                                No recent activity yet
                                            </p>
                                            <p className="text-charcoal/40 text-xs">
                                                Suggested homes appear when agents publish listings
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Documents */}
                            <div className={`${PORTAL_CARD} p-6`}>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-xl font-bold text-charcoal flex items-center">
                                        <Download className="w-5 h-5 mr-2 text-gold" />
                                        My Documents
                                    </h2>
                                    <Link
                                        href="/dashboard/documents"
                                        className="text-sm font-semibold text-gold hover:text-gold-600 transition"
                                    >
                                        Manage
                                    </Link>
                                </div>
                                <div className="space-y-2">
                                    {BUYER_DOCUMENT_SLOTS.map(({ type, label }) => {
                                        const uploaded = buyerDocuments.find((doc) => doc.type === type);
                                        return (
                                            <div
                                                key={type}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-charcoal/5 hover:bg-charcoal/10 transition text-charcoal text-sm group"
                                            >
                                                <Link
                                                    href={`/dashboard/documents?type=${type}`}
                                                    className="flex items-center justify-between flex-1 min-w-0"
                                                >
                                                    <span className="flex items-center gap-2 min-w-0">
                                                        {uploaded ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                                        ) : (
                                                            <Upload className="w-4 h-4 text-charcoal/40 group-hover:text-gold shrink-0" />
                                                        )}
                                                        <span className="truncate">{label}</span>
                                                    </span>
                                                    <span className="text-xs font-medium text-charcoal/50 group-hover:text-gold shrink-0 ml-2">
                                                        {uploaded ? 'Uploaded' : 'Upload'}
                                                    </span>
                                                </Link>
                                                {uploaded && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewDoc(uploaded)}
                                                        className="p-1.5 rounded-lg bg-gold/[0.06] hover:bg-gold/10 text-gold border border-gold/10 shrink-0"
                                                        title="Preview"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UserPortalLayout>

            <BuyerDocumentPreviewModal
                doc={previewDoc}
                userId={currentUser?.id}
                onClose={() => setPreviewDoc(null)}
            />

            {/* Contact Modal */}
            {selectedOriginator && (
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
                                            <Phone className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                                {selectedOriginator.name}
                                            </h2>
                                            <p className="text-white/90 text-sm">{selectedOriginator.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedOriginator(null)}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center group"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-charcoal/5">
                            <div className="text-center mb-6">
                                <div className="bg-white rounded-lg p-4 border border-charcoal/10 shadow-sm">
                                    <p className="text-charcoal/70 text-sm mb-1 font-semibold">Contact Number</p>
                                    <p className="text-2xl font-bold text-gold">
                                        {selectedOriginator.phone.length === 10 
                                            ? selectedOriginator.phone.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')
                                            : selectedOriginator.phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3')
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href={`tel:${selectedOriginator.phone}`}
                                    className={`w-full ${PORTAL_PRIMARY_BTN}`}
                                >
                                    <Phone className="w-5 h-5" />
                                    Call Now
                                </a>
                                <a
                                    href={selectedOriginator.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-full ${PORTAL_SECONDARY_BTN}`}
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    Visit Website
                                </a>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-white border-t border-charcoal/10 flex items-center justify-end gap-4">
                            <button
                                onClick={() => setSelectedOriginator(null)}
                                className={PORTAL_PRIMARY_BTN}
                            >
                                <span>Done</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <OnboardingGateModal
                open={Boolean(onboardingRequired && onboardingIntent === 'buyer' && onboardingUser)}
                title="Complete your pre-qualification"
                subtitle="Finish this once so we can personalise your buyer dashboard. You can’t continue until it’s done."
            >
                {onboardingUser && (
                    <BuyerPrequalOnboardingForm
                        user={onboardingUser}
                        onComplete={handleBuyerOnboardingComplete}
                    />
                )}
            </OnboardingGateModal>
        </>
    );
}
