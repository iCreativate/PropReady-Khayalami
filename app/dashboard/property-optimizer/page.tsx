'use client';

import dynamic from 'next/dynamic';
import UserPortalLayout from '@/components/UserPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PortalLoading from '@/components/PortalLoading';

const PropertyValueOptimizerDashboard = dynamic(
    () => import('@/components/property-optimizer/PropertyValueOptimizerDashboard'),
    {
        ssr: false,
        loading: () => (
            <PortalLoading
                variant="inline"
                message="Loading optimizer…"
                className="min-h-[420px]"
            />
        ),
    }
);

function readIsSeller(user: { id?: string; email?: string } | null) {
    if (typeof window === 'undefined' || !user) return false;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.sellerInfo);
        if (!raw) return false;
        const seller = JSON.parse(raw) as { id?: string; email?: string };
        return seller.id === user.id || seller.email === user.email;
    } catch {
        return false;
    }
}

export default function PropertyValueOptimizerPage() {
    const router = useRouter();
    const { user, isHydrated } = useHydratedBuyerPortalUser();
    const [isSeller, setIsSeller] = useState(false);

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) {
            router.push('/login');
            return;
        }
        setIsSeller(readIsSeller(user));
    }, [isHydrated, user, router]);

    if (!isHydrated || !user) {
        return <PortalLoading message="Loading property optimizer…" variant="dashboard" />;
    }

    return (
        <UserPortalLayout
            portal={isSeller ? 'seller' : 'buyer'}
            activePage="property-optimizer"
            user={user}
            title="Value Optimizer"
            pageHeader={
                <PortalPageHeader
                    variant="premium"
                    eyebrow="Seller planning"
                    title="Property Value Optimizer"
                    description="Enter location, purchase price, and improvements already made — then see a rough estimate of what the property could sell for, after typical deductions. Always confirm with a professional valuation."
                />
            }
        >
            <div className={`${PORTAL_PAGE_CONTAINER} relative z-10`}>
                <PropertyValueOptimizerDashboard />
            </div>
        </UserPortalLayout>
    );
}
