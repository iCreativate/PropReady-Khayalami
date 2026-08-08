'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import PortalPageHeader from '@/components/PortalPageHeader';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PortalLoading from '@/components/PortalLoading';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';

const PropertyIQDashboard = dynamic(
    () => import('@/components/property-iq/PropertyIQDashboard'),
    {
        ssr: false,
        loading: () => <PortalLoading message="Loading Property Companion™…" variant="dashboard" />,
    }
);

export default function PropertyIqPage() {
    const router = useRouter();
    const { user, isHydrated } = useHydratedBuyerPortalUser();

    useEffect(() => {
        if (isHydrated && !user) {
            router.replace('/auth/login?next=/property-iq');
        }
    }, [isHydrated, user, router]);

    // Wait for session check. Keep showing loader only until we know auth state.
    if (!isHydrated) {
        return <PortalLoading message="Loading Property Companion™…" variant="dashboard" />;
    }

    if (!user) {
        return <PortalLoading message="Redirecting to sign in…" variant="dashboard" />;
    }

    return (
        <BuyerPortalShell
            activePage="property-iq"
            title="Property Companion™"
            pageHeader={
                <PortalPageHeader
                    variant="premium"
                    eyebrow="Wealth intelligence"
                    title="Property Companion™"
                    description="Your personal property portfolio companion — understand, grow wealth, reduce debt, and know what to do next."
                    glassLabel="Wealth pulse"
                    metrics={[
                        { label: 'Focus', value: 'Portfolio' },
                        { label: 'Horizon', value: '10-year view' },
                    ]}
                    stats={[
                        { label: 'Track', value: 'Equity & cash flow' },
                        { label: 'Model', value: 'LTV · ROI' },
                        { label: 'Projections', value: 'Educational' },
                        { label: 'Status', value: 'Live workspace', tone: 'success' },
                    ]}
                />
            }
        >
            <div className={PORTAL_PAGE_CONTAINER}>
                <PropertyIQDashboard embedded />
            </div>
        </BuyerPortalShell>
    );
}
