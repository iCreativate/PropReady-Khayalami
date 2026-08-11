'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import UserPortalLayout from '@/components/UserPortalLayout';
import SellerDashboardWorkspace, {
    type SellerDashboardAgent,
} from '@/components/seller-dashboard/SellerDashboardWorkspace';
import { mapAgentRecord, filterPublicAgents } from '@/lib/map-agent';
import PortalLoading from '@/components/PortalLoading';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import OnboardingGateModal from '@/components/onboarding/OnboardingGateModal';
import SellerPropertyOnboardingForm from '@/components/onboarding/SellerPropertyOnboardingForm';
import {
    deleteSellerProperty,
    getActiveSellerProperty,
    hydrateSellerPropertiesFromCloud,
    listSellerProperties,
    setActiveSellerProperty,
    type SellerProperty,
} from '@/lib/seller-properties';

export default function SellerDashboardPage() {
    const router = useRouter();
    const {
        loading: onboardingLoading,
        required: onboardingRequired,
        intent: onboardingIntent,
        user: onboardingUser,
        completeOnboarding,
    } = useOnboardingGate();
    const [currentUser, setCurrentUser] = useState<{
        fullName: string;
        email: string;
        id: string;
        phone?: string;
    } | null>(null);
    const [sellerInfo, setSellerInfo] = useState<SellerProperty | null>(null);
    const [sellerProperties, setSellerProperties] = useState<SellerProperty[]>([]);
    const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
    const [propertyFormMode, setPropertyFormMode] = useState<'add' | 'edit' | null>(null);
    const [editingProperty, setEditingProperty] = useState<SellerProperty | null>(null);
    const [selectedAgent, setSelectedAgent] = useState<SellerDashboardAgent | null>(null);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingAppointments, setViewingAppointments] = useState<
        Array<{
            id: string;
            propertyTitle?: string;
            propertyAddress?: string;
            propertyPrice?: number;
            date: string;
            time?: string;
            status: string;
            notes?: string;
            timestamp?: string;
            sellerEmail?: string;
            contactType?: string;
            contactName?: string;
            contactEmail?: string;
            contactPhone?: string;
        }>
    >([]);
    const [availableAgents, setAvailableAgents] = useState<SellerDashboardAgent[]>([]);
    const [showSyncFailedBanner, setShowSyncFailedBanner] = useState(false);
    const [confirmRefreshKey, setConfirmRefreshKey] = useState(0);

    useEffect(() => {
        async function load() {
            if (typeof window === 'undefined') return;

            if (!onboardingLoading && onboardingIntent === 'buyer' && onboardingRequired) {
                router.replace('/dashboard');
                return;
            }

            const userData = localStorage.getItem('propReady_currentUser');
            if (!userData) {
                router.push('/login');
                return;
            }
            const user = JSON.parse(userData);
            setCurrentUser(user);

            await hydrateSellerPropertiesFromCloud(user.id);
            const properties = listSellerProperties(user.id);
            setSellerProperties(properties);
            const active = getActiveSellerProperty(user.id);
            setActivePropertyId(active?.id || null);
            setSellerInfo(active);

            const storedSelectedAgent = localStorage.getItem(`propReady_selectedAgent_${user.id}`);
            if (storedSelectedAgent) {
                setSelectedAgent(JSON.parse(storedSelectedAgent));
            }

            const storedViewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
            const sellerPhone = active?.phone?.replace(/\s/g, '') || '';
            const userEmail = user.email?.toLowerCase() || '';
            const matchSeller = (v: {
                sellerEmail?: string;
                contactType?: string;
                contactName?: string;
                contactEmail?: string;
                contactPhone?: string;
            }) => {
                if (v.sellerEmail && v.sellerEmail.toLowerCase() === userEmail) return true;
                return (
                    v.contactType === 'seller' &&
                    ((v.contactName &&
                        user.fullName &&
                        v.contactName.toLowerCase() === user.fullName.toLowerCase()) ||
                        (v.contactEmail && userEmail && v.contactEmail.toLowerCase() === userEmail) ||
                        (sellerPhone &&
                            v.contactPhone &&
                            v.contactPhone.replace(/\s/g, '') === sellerPhone))
                );
            };
            let apiViewings: typeof viewingAppointments = [];
            try {
                const res = await fetch(`/api/viewings?contactEmail=${encodeURIComponent(user.email)}`, {
                    cache: 'no-store',
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(data.viewings)) {
                    apiViewings = (data.viewings || []).filter(matchSeller);
                }
            } catch (e) {
                console.warn('Failed to load viewings from API', e);
            }
            const ids = new Set(apiViewings.map((v) => v.id));
            const localOnly = (storedViewings as typeof viewingAppointments).filter(
                (v) => matchSeller(v) && !ids.has(v.id)
            );
            const userViewings = [...apiViewings, ...localOnly].sort(
                (a, b) =>
                    new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
            setViewingAppointments(userViewings);

            if (sessionStorage.getItem('propReady_sellerLeadSyncFailed')) {
                setShowSyncFailedBanner(true);
            }
            setIsLoading(false);
        }
        load();
    }, [router, confirmRefreshKey, onboardingLoading, onboardingIntent, onboardingRequired]);

    const handleSellerOnboardingComplete = async () => {
        await completeOnboarding();
        setPropertyFormMode(null);
        setEditingProperty(null);
        setConfirmRefreshKey((k) => k + 1);
    };

    const refreshProperties = (userId: string) => {
        const properties = listSellerProperties(userId);
        setSellerProperties(properties);
        const active = getActiveSellerProperty(userId);
        setActivePropertyId(active?.id || null);
        setSellerInfo(active);
    };

    const handlePropertyFormComplete = async () => {
        if (currentUser) refreshProperties(currentUser.id);
        setPropertyFormMode(null);
        setEditingProperty(null);
        setConfirmRefreshKey((k) => k + 1);
    };

    const handleDeleteProperty = (property: SellerProperty) => {
        if (!currentUser) return;
        const ok = window.confirm(
            `Remove “${property.propertyAddress}” from your seller dashboard? This does not delete a public marketplace listing.`
        );
        if (!ok) return;
        deleteSellerProperty(currentUser.id, property.id);
        refreshProperties(currentUser.id);
    };

    const handleSetActiveProperty = (property: SellerProperty) => {
        if (!currentUser) return;
        setActiveSellerProperty(currentUser.id, property.id);
        refreshProperties(currentUser.id);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedAgents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
        const mapped: SellerDashboardAgent[] = filterPublicAgents(
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
        ) as SellerDashboardAgent[];
        setAvailableAgents(mapped);
    }, []);

    if (isLoading && !(onboardingRequired && onboardingIntent === 'seller')) {
        return <PortalLoading message="Loading dashboard…" variant="dashboard" />;
    }

    const portalUser =
        currentUser ||
        (onboardingUser
            ? {
                  id: onboardingUser.id,
                  fullName: onboardingUser.fullName || 'Seller',
                  email: onboardingUser.email,
              }
            : null);

    if (!portalUser) {
        return <PortalLoading message="Loading dashboard…" variant="dashboard" />;
    }

    const filteredAgents = availableAgents.filter(
        (agent) =>
            agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAgent = (agent: SellerDashboardAgent) => {
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
            <UserPortalLayout portal="seller" activePage="dashboard" user={portalUser} title="Dashboard">
                <SellerDashboardWorkspace
                    userName={portalUser.fullName}
                    userEmail={currentUser?.email}
                    sellerProperties={sellerProperties}
                    activePropertyId={activePropertyId}
                    sellerInfo={sellerInfo}
                    selectedAgent={selectedAgent}
                    viewingAppointments={viewingAppointments}
                    showSyncFailedBanner={showSyncFailedBanner}
                    onDismissSyncBanner={() => {
                        if (typeof sessionStorage !== 'undefined') {
                            sessionStorage.removeItem('propReady_sellerLeadSyncFailed');
                        }
                        setShowSyncFailedBanner(false);
                    }}
                    onAddProperty={() => {
                        setEditingProperty(null);
                        setPropertyFormMode('add');
                    }}
                    onEditProperty={(property) => {
                        setEditingProperty(property);
                        setPropertyFormMode('edit');
                    }}
                    onDeleteProperty={handleDeleteProperty}
                    onSetActiveProperty={handleSetActiveProperty}
                    onOpenAgentModal={() => setShowAgentModal(true)}
                    onRemoveAgent={handleRemoveAgent}
                    onConfirmRefresh={() => setConfirmRefreshKey((k) => k + 1)}
                    showAgentModal={showAgentModal}
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    filteredAgents={filteredAgents}
                    onSelectAgent={handleSelectAgent}
                    onCloseAgentModal={() => setShowAgentModal(false)}
                />
            </UserPortalLayout>

            <OnboardingGateModal
                open={Boolean(onboardingRequired && onboardingIntent === 'seller' && onboardingUser)}
                title="Add the property you want to sell"
                subtitle="Add your property details once so we can set up your seller dashboard. You can add more properties later."
            >
                {onboardingUser && (
                    <SellerPropertyOnboardingForm
                        user={onboardingUser}
                        onComplete={handleSellerOnboardingComplete}
                    />
                )}
            </OnboardingGateModal>

            {propertyFormMode && currentUser ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight text-[#1b1b1b]">
                                    {propertyFormMode === 'edit' ? 'Edit property' : 'Add another property'}
                                </h2>
                                <p className="mt-1 text-sm text-black/55">
                                    Seller property record only — not a public marketplace listing.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setPropertyFormMode(null);
                                    setEditingProperty(null);
                                }}
                                className="rounded-xl border border-black/[0.08] p-2 text-black/50 transition hover:bg-black/[0.03]"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <SellerPropertyOnboardingForm
                            key={editingProperty?.id || 'new-property'}
                            user={currentUser}
                            mode={propertyFormMode}
                            editingProperty={editingProperty}
                            onComplete={handlePropertyFormComplete}
                        />
                    </div>
                </div>
            ) : null}
        </>
    );
}
