'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OriginatorPortalLayout from '@/components/OriginatorPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import PortalLoading from '@/components/PortalLoading';
import MessagesWorkspace from '@/components/messages/MessagesWorkspace';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { ORIGINATOR_PAGE_CONTAINER } from '@/lib/originator-portal-ui';

type OriginatorUser = {
    id: string;
    fullName: string;
    email: string;
    organizationId?: string;
};

export default function OriginatorMessagesPage() {
    const router = useRouter();
    const [user, setUser] = useState<OriginatorUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
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
        return <PortalLoading variant="dashboard" message="Loading messages…" />;
    }

    return (
        <OriginatorPortalLayout
            activePage="messages"
            user={user}
            title="Messages"
            pageHeader={
                <PortalPageHeader
                    title="Messages"
                    description="Message buyers, sellers, and agents. Share documents and schedule appointments in-thread."
                />
            }
        >
            <div className={ORIGINATOR_PAGE_CONTAINER}>
                <MessagesWorkspace
                    role="originator"
                    profileId={user.id}
                    accountType="originator"
                    displayName={user.fullName || user.email}
                />
            </div>
        </OriginatorPortalLayout>
    );
}
