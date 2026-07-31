'use client';

import dynamic from 'next/dynamic';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PortalLoading from '@/components/PortalLoading';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';

const SmartBondOptimizerApp = dynamic(
    () => import('@/components/smart-bond/SmartBondOptimizerApp'),
    {
        ssr: false,
        loading: () => (
            <PortalLoading variant="inline" message="Loading Smart Bond Optimizer…" className="min-h-[420px]" />
        ),
    }
);

export default function SmartBondOptimizerPage() {
    const { user } = useHydratedBuyerPortalUser();

    return (
        <BuyerPortalShell
            activePage="smart-bond"
            title="Smart Bond Optimizer"
            publicChrome={user ? undefined : <PublicSiteHeader />}
        >
            <div className={PORTAL_PAGE_CONTAINER}>
                <SmartBondOptimizerApp />
            </div>
        </BuyerPortalShell>
    );
}
