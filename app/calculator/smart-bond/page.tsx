'use client';

import BuyerPortalShell from '@/components/BuyerPortalShell';
import PortalPageHeader from '@/components/PortalPageHeader';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import SmartBondOptimizerApp from '@/components/smart-bond/SmartBondOptimizerApp';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';

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
