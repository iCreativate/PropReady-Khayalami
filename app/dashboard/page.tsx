'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import UserPortalLayout from '@/components/UserPortalLayout';
import {
    readBuyerDocumentsLocal,
    refreshBuyerDocumentsFromApi,
    type BuyerDocument,
} from '@/lib/buyer-documents';
import { readLocalViewingsForUser, refreshViewingsFromApi } from '@/lib/buyer-viewings';
import { resolveBuyerQuizResultSync, type BuyerQuizResult } from '@/lib/quiz-result';
import { resolvePrequalMode } from '@/lib/buyer-full-prequal';
import type { ListedProperty } from '@/lib/listed-property';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import OnboardingGateModal from '@/components/onboarding/OnboardingGateModal';
import BuyerPrequalOnboardingForm from '@/components/onboarding/BuyerPrequalOnboardingForm';
import PortalLoading from '@/components/PortalLoading';
import { PUBLIC_PROPERTIES_ENABLED } from '@/lib/public-properties';

const BuyerIntelligenceWorkspace = dynamic(
    () => import('@/components/buyer-dashboard/BuyerIntelligenceWorkspace'),
    {
        ssr: false,
        loading: () => <PortalLoading message="Loading dashboard…" variant="dashboard" />,
    }
);

type MatchedListing = ListedProperty & { matchScore: number };

type ViewingRow = {
    id: string;
    propertyTitle?: string;
    propertyAddress?: string;
    propertyPrice?: number;
    date: string;
    time?: string;
    status: string;
    notes?: string;
};

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
        const res = await fetch('/api/properties', { cache: 'force-cache' });
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
    const [quizResult, setQuizResult] = useState<ReturnType<typeof readQuizSummary> | null>(null);
    const [sellerInfo, setSellerInfo] = useState<{
        currentValue?: string | number;
        propertyType?: string;
        timeline?: string;
    } | null>(null);
    const [viewingAppointments, setViewingAppointments] = useState<ViewingRow[]>([]);
    const [buyerDocuments, setBuyerDocuments] = useState<BuyerDocument[]>([]);
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
        setSellerInfo(readSellerInfoForUser(currentUser));
        setViewingAppointments(
            readLocalViewingsForUser(currentUser, { includeSeller: false }) as ViewingRow[]
        );
        if (currentUser.id) {
            setBuyerDocuments(readBuyerDocumentsLocal(currentUser.id));
        }

        void Promise.all([
            refreshViewingsFromApi(currentUser, { includeSeller: false }).then((rows) =>
                setViewingAppointments(rows as ViewingRow[])
            ),
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

    const suggestedProperties = useMemo(
        () =>
            matchListingsToPrequal(
                agentListings,
                quizResult?.preQualAmount ?? 0,
                quizResult?.score ?? 0
            ),
        [agentListings, quizResult?.preQualAmount, quizResult?.score]
    );

    const showSuggested =
        PUBLIC_PROPERTIES_ENABLED && agentListings.length > 0 && suggestedProperties.length > 0;

    if (!isHydrated || !currentUser) {
        return <PortalLoading message="Loading dashboard…" variant="dashboard" />;
    }

    return (
        <>
            <UserPortalLayout portal="buyer" activePage="dashboard" user={currentUser} title="Dashboard">
                <BuyerIntelligenceWorkspace
                    user={currentUser}
                    quizResult={quizResult}
                    documents={buyerDocuments}
                    viewings={viewingAppointments}
                    suggestedProperties={showSuggested ? suggestedProperties : []}
                    sellerInfo={sellerInfo}
                    onFullPrequalUpdated={() => {
                        if (currentUser) setQuizResult(readQuizSummary(currentUser));
                    }}
                />
            </UserPortalLayout>

            <OnboardingGateModal
                open={!onboardingLoading && onboardingRequired && onboardingIntent !== 'seller'}
                title="Finish buyer prequalification"
                subtitle="A few details unlock your PropReady score, affordability estimate, and document checklist."
            >
                <BuyerPrequalOnboardingForm
                    user={{
                        id: (onboardingUser || currentUser).id || currentUser.email || 'buyer',
                        fullName: (onboardingUser || currentUser).fullName,
                        email: (onboardingUser || currentUser).email || '',
                        phone: (onboardingUser || currentUser).phone,
                    }}
                    onComplete={handleBuyerOnboardingComplete}
                />
            </OnboardingGateModal>
        </>
    );
}
