'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserPortalLayout from '@/components/UserPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import PortalLoading from '@/components/PortalLoading';
import MessagesWorkspace from '@/components/messages/MessagesWorkspace';
import { useHydratedSellerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';

export default function SellerMessagesPage() {
    const router = useRouter();
    const { user, isHydrated } = useHydratedSellerPortalUser();

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) router.push('/login');
    }, [isHydrated, user, router]);

    if (!isHydrated || !user) {
        return <PortalLoading variant="dashboard" message="Loading messages…" />;
    }

    return (
        <UserPortalLayout
            portal="seller"
            activePage="messages"
            user={user}
            title="Messages"
            pageHeader={
                <PortalPageHeader
                    title="Messages"
                    description="Chat with agents and originators about your listing, documents, and appointments."
                />
            }
        >
            <div className={PORTAL_PAGE_CONTAINER}>
                <MessagesWorkspace
                    role="seller"
                    profileId={user.id || ''}
                    accountType="user"
                    displayName={user.fullName || user.email || 'You'}
                />
            </div>
        </UserPortalLayout>
    );
}
