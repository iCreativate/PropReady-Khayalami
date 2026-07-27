'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserPortalLayout from '@/components/UserPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import PortalLoading from '@/components/PortalLoading';
import MessagesWorkspace from '@/components/messages/MessagesWorkspace';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';

export default function BuyerMessagesPage() {
    const router = useRouter();
    const { user, isHydrated } = useHydratedBuyerPortalUser();

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) router.push('/login');
    }, [isHydrated, user, router]);

    if (!isHydrated || !user) {
        return <PortalLoading variant="dashboard" message="Loading messages…" />;
    }

    return (
        <UserPortalLayout
            portal="buyer"
            activePage="messages"
            user={user}
            title="Messages"
            pageHeader={
                <PortalPageHeader
                    title="Messages"
                    description="Chat live with agents and bond originators, share documents, and propose appointments."
                />
            }
        >
            <div className={PORTAL_PAGE_CONTAINER}>
                <MessagesWorkspace
                    role="buyer"
                    profileId={user.id || ''}
                    accountType="user"
                    displayName={user.fullName || user.email || 'You'}
                />
            </div>
        </UserPortalLayout>
    );
}
