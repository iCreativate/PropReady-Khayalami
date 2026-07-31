'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import ConveyancerPortalLayout from '@/components/conveyancer-connect/ConveyancerPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import MessagesWorkspaceSkeleton from '@/components/messages/MessagesWorkspaceSkeleton';
import {
    hydrateSessionFromCookies,
    readOptimisticSession,
} from '@/lib/auth-session-bridge';

const MessagesWorkspace = dynamic(
    () => import('@/components/messages/MessagesWorkspace'),
    {
        ssr: false,
        loading: () => <MessagesWorkspaceSkeleton />,
    }
);

export default function ConveyancerMessagesPage() {
    const router = useRouter();
    const [user, setUser] = useState<{
        id: string;
        fullName: string;
        email: string;
        firmName?: string;
    } | null>(null);

    useEffect(() => {
        let cancelled = false;
        const optimistic = readOptimisticSession('conveyancer');
        if (optimistic) {
            setUser({
                id: optimistic.id,
                fullName: optimistic.fullName || 'Conveyancer',
                email: optimistic.email,
                firmName: optimistic.company,
            });
        }
        void (async () => {
            const bridged = await hydrateSessionFromCookies({ force: true });
            if (cancelled) return;
            if (!bridged || bridged.accountType !== 'conveyancer') {
                router.replace('/conveyancers/login');
                return;
            }
            setUser({
                id: bridged.id,
                fullName: bridged.fullName || 'Conveyancer',
                email: bridged.email,
                firmName: bridged.company,
            });
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    if (!user) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
                <MessagesWorkspaceSkeleton />
            </div>
        );
    }

    return (
        <ConveyancerPortalLayout
            activePage="messages"
            user={user}
            title="Messages"
            pageHeader={
                <PortalPageHeader
                    size="compact"
                    eyebrow="Live inbox"
                    title="Client & agent messages"
                    description="Secure PropReady messaging with buyers, sellers and referring estate agents on your matters."
                />
            }
        >
            <MessagesWorkspace
                role="conveyancer"
                profileId={user.id}
                accountType="conveyancer"
                displayName={user.firmName || user.fullName}
            />
        </ConveyancerPortalLayout>
    );
}
