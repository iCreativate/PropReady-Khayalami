'use client';

import { useEffect, type ReactNode } from 'react';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { hydrateCcStateFromCloud } from '@/lib/conveyancer-connect/storage';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';

export default function CcPageShell({
    children,
    title = 'Conveyancer Connect',
    pageHeader,
}: {
    children: React.ReactNode;
    title?: string;
    pageHeader?: ReactNode;
}) {
    const { user } = useHydratedBuyerPortalUser();

    useEffect(() => {
        void hydrateCcStateFromCloud();
    }, []);

    return (
        <BuyerPortalShell
            activePage="conveyancer-connect"
            title={title}
            pageHeader={pageHeader}
            publicChrome={user ? undefined : <PublicSiteHeader />}
        >
            <div className={`${PORTAL_PAGE_CONTAINER} pb-24 sm:pb-10`}>{children}</div>
        </BuyerPortalShell>
    );
}
