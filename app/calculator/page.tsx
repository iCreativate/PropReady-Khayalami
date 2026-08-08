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
                        eyebrow="Home finance"
                        title="Bond Calculator"
                        description="Model repayments, compare scenarios and export your plan — in one compact dashboard."
                        glassLabel="Calculator pulse"
                        metrics={[
                            { label: 'Updates', value: 'Live' },
                            { label: 'Market', value: 'South Africa' },
                        ]}
                        stats={[
                            { label: 'Mode', value: 'Repayment' },
                            { label: 'Assumptions', value: 'SA lending' },
                            { label: 'Scenarios', value: 'Compare' },
                            { label: 'Export', value: 'Available', tone: 'success' },
                        ]}
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
