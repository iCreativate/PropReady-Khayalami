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
        loading: () => <PortalLoading message="Loading Property IQ™…" variant="dashboard" />,
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

    if (!isHydrated || !user) {
        return <PortalLoading message="Loading Property IQ™…" variant="dashboard" />;
    }

    return (
        <BuyerPortalShell
            activePage="property-iq"
            title="Property IQ™"
            pageHeader={
                <PortalPageHeader
                    variant="premium"
                    eyebrow="Wealth intelligence"
                    title="Property IQ™"
                    description="Build. Track. Grow your property wealth — on one premium dashboard."
                />
            }
        >
            <div className={PORTAL_PAGE_CONTAINER}>
                <PropertyIQDashboard embedded />
            </div>
        </BuyerPortalShell>
    );
}
