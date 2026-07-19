'use client';

import UserPortalLayout from '@/components/UserPortalLayout';
import PortalLoading from '@/components/PortalLoading';
import type { BuyerPortalPage } from '@/lib/user-portal-nav';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';

interface BuyerPortalShellProps {
    activePage: BuyerPortalPage;
    title?: string;
    pageHeader?: React.ReactNode;
    children: React.ReactNode;
    publicChrome?: React.ReactNode;
}

export default function BuyerPortalShell({
    activePage,
    title,
    pageHeader,
    children,
    publicChrome,
}: BuyerPortalShellProps) {
    const { user, isHydrated } = useHydratedBuyerPortalUser();

    if (!isHydrated) {
        return <PortalLoading message="Loading portal…" />;
    }

    if (user) {
        return (
            <UserPortalLayout
                portal="buyer"
                activePage={activePage}
                user={user}
                title={title}
                pageHeader={pageHeader}
            >
                {children}
            </UserPortalLayout>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {publicChrome}
            <main className="relative px-4 pt-24 pb-8 min-h-screen">{children}</main>
        </div>
    );
}
