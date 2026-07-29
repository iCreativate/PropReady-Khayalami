'use client';

import dynamic from 'next/dynamic';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PortalPageHeader from '@/components/PortalPageHeader';
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

    const pageHeader = (
        <PortalPageHeader
            variant="premium"
            eyebrow="Flagship finance intelligence"
            title="Smart Bond Optimizer"
            description="Plan repayments, equity, refinancing, and property wealth with South African home-loan maths — educational estimates, not advice or approvals."
        />
    );

    return (
        <BuyerPortalShell
            activePage="smart-bond"
            title="Smart Bond Optimizer"
            pageHeader={pageHeader}
            publicChrome={user ? undefined : <PublicSiteHeader />}
        >
            <div className={PORTAL_PAGE_CONTAINER}>
                <SmartBondOptimizerApp />
            </div>
        </BuyerPortalShell>
    );
}
