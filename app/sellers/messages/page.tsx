'use client';

import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import UserPortalLayout from '@/components/UserPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import type { PortalHeroStat } from '@/components/PortalHero';
import MessagesWorkspaceSkeleton from '@/components/messages/MessagesWorkspaceSkeleton';
import { useHydratedSellerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER } from '@/lib/portal-ui';

const MessagesWorkspace = dynamic(
    () => import('@/components/messages/MessagesWorkspace'),
    {
        ssr: false,
        loading: () => <MessagesWorkspaceSkeleton />,
    }
);

export default function SellerMessagesPage() {
    const router = useRouter();
    const { user, isHydrated } = useHydratedSellerPortalUser();
    const [heroActions, setHeroActions] = useState<ReactNode>(null);
    const [heroStats, setHeroStats] = useState<PortalHeroStat[] | null>(null);

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) router.push('/auth/login');
    }, [isHydrated, user, router]);

    if (!isHydrated || !user) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1400px]">
                    <MessagesWorkspaceSkeleton />
                </div>
            </div>
        );
    }

    return (
        <UserPortalLayout
            portal="seller"
            activePage="messages"
            user={user}
            title="Messages"
            pageHeader={
                <PortalPageHeader
                    eyebrow="Inbox"
                    title="Messages"
                    description="Stay in touch with your agent and PropReady support while you sell."
                    glassLabel="Inbox pulse"
                    stats={heroStats ?? undefined}
                    actions={heroActions}
                />
            }
        >
            <div className={PORTAL_PAGE_CONTAINER}>
                <MessagesWorkspace
                    role="seller"
                    profileId={user.id || ''}
                    accountType="user"
                    displayName={user.fullName || user.email || 'You'}
                    onHeroActionsChange={setHeroActions}
                    onHeroStatsChange={setHeroStats}
                />
            </div>
        </UserPortalLayout>
    );
}
