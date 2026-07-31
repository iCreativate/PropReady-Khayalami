'use client';

import BuyerPortalShell from '@/components/BuyerPortalShell';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';

export default function CcPageShell({
    children,
    title = 'Conveyancer Connect',
}: {
    children: React.ReactNode;
    title?: string;
}) {
    const { user } = useHydratedBuyerPortalUser();

    return (
        <BuyerPortalShell
            activePage="conveyancer-connect"
            title={title}
            publicChrome={user ? undefined : <PublicSiteHeader />}
        >
            <div className={`${PORTAL_PAGE_CONTAINER} pb-24 sm:pb-10`}>{children}</div>
        </BuyerPortalShell>
    );
}
