'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import OriginatorPortalLayout from '@/components/OriginatorPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import MessagesWorkspaceSkeleton from '@/components/messages/MessagesWorkspaceSkeleton';
import {
    hydrateSessionFromCookies,
    readOptimisticSession,
} from '@/lib/auth-session-bridge';

type OriginatorUser = {
    id: string;
    fullName: string;
    email: string;
    organizationId?: string;
};

const MessagesWorkspace = dynamic(
    () => import('@/components/messages/MessagesWorkspace'),
    {
        ssr: false,
        loading: () => <MessagesWorkspaceSkeleton />,
    }
);

export default function OriginatorMessagesPage() {
    const router = useRouter();
    const [user, setUser] = useState<OriginatorUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const optimistic = readOptimisticSession('originator');
        if (optimistic) {
            setUser({
                id: optimistic.id,
                fullName: optimistic.fullName || 'Originator',
                email: optimistic.email,
                organizationId: optimistic.organizationId,
            });
            setLoading(false);
        }

        void (async () => {
            const bridged = await hydrateSessionFromCookies();
            if (cancelled) return;
            if (!bridged || bridged.accountType !== 'originator') {
                router.replace('/originators/login');
                return;
            }
            setUser({
                id: bridged.id,
                fullName: bridged.fullName || 'Originator',
                email: bridged.email,
                organizationId: bridged.organizationId,
            });
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1400px]">
                    <MessagesWorkspaceSkeleton />
                </div>
            </div>
        );
    }

    return (
        <OriginatorPortalLayout
            activePage="messages"
            user={user}
            title="Messages"
            pageHeader={
                <PortalPageHeader
                    size="compact"
                    eyebrow="Inbox"
                    title="Messages"
                    description="Coordinate with buyers and PropReady staff on prequalification cases."
                />
            }
        >
            <MessagesWorkspace
                role="originator"
                profileId={user.id}
                accountType="originator"
                displayName={user.fullName || user.email}
            />
        </OriginatorPortalLayout>
    );
}
