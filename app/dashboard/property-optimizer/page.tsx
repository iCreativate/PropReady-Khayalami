'use client';

import UserPortalLayout from '@/components/UserPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import PropertyValueOptimizerDashboard from '@/components/property-optimizer/PropertyValueOptimizerDashboard';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PropertyValueOptimizerPage() {
    const router = useRouter();
    const { user, isHydrated } = useHydratedBuyerPortalUser();

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) router.push('/login');
    }, [isHydrated, user, router]);

    if (!isHydrated || !user) {
        return null;
    }

    return (
        <UserPortalLayout
            portal="buyer"
            activePage="property-optimizer"
            user={user}
            title="Property Value Optimizer"
            pageHeader={
                <PortalPageHeader
                    variant="premium"
                    eyebrow="PropReady AI · Property Wealth"
                    title="Property Value Optimizer"
                    description="Understand your property's value, model renovations, forecast appreciation and make data-driven wealth decisions."
                />
            }
        >
            <div className={`${PORTAL_PAGE_CONTAINER} relative z-10 -mt-2`}>
                <PropertyValueOptimizerDashboard />
            </div>
        </UserPortalLayout>
    );
}
