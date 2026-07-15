'use client';

import UserPortalLayout from '@/components/UserPortalLayout';
import { useHydratedSellerPortalUser } from '@/hooks/useHydratedPortalUser';
import type { SellerPortalPage } from '@/lib/user-portal-nav';

interface SellerPortalShellProps {
    activePage: SellerPortalPage;
    title?: string;
    pageHeader?: React.ReactNode;
    children: React.ReactNode;
    publicChrome?: React.ReactNode;
}

export default function SellerPortalShell({
    activePage,
    title,
    pageHeader,
    children,
    publicChrome,
}: SellerPortalShellProps) {
    const { user, isHydrated } = useHydratedSellerPortalUser();

    if (!isHydrated) {
        return null;
    }

    if (user) {
        return (
            <UserPortalLayout
                portal="seller"
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
