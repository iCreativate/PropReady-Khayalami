'use client';

import PublicSiteHeader from '@/components/PublicSiteHeader';
import PortalPageHeader from '@/components/PortalPageHeader';
import UserPortalLayout from '@/components/UserPortalLayout';
import PortalLoading from '@/components/PortalLoading';
import BondCalculatorStudio from '@/components/marketing/calculator/BondCalculatorStudio';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';

export default function BondCalculatorPage() {
    const { user, isHydrated } = useHydratedBuyerPortalUser();

    if (!isHydrated) {
        return <PortalLoading message="Loading calculator…" variant="dashboard" />;
    }

    if (user) {
        return (
            <UserPortalLayout
                portal="buyer"
                activePage="calculator"
                user={user}
                title="Bond Calculator"
                pageHeader={
                    <PortalPageHeader
                        variant="premium"
                        size="compact"
                        eyebrow="Home finance"
                        title="Bond Calculator"
                        description="Model repayments, compare scenarios and export your plan — in one compact dashboard."
                    />
                }
            >
                <div className={PORTAL_PAGE_CONTAINER}>
                    <BondCalculatorStudio embedded />
                </div>
            </UserPortalLayout>
        );
    }

    return (
        <>
            <PublicSiteHeader />
            <main>
                <BondCalculatorStudio />
            </main>
        </>
    );
}
