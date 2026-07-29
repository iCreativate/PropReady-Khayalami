'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OriginatorPortalLayout from '@/components/OriginatorPortalLayout';
import MessagesWorkspace from '@/components/messages/MessagesWorkspace';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';

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
        return (
            <div className="flex min-h-dvh items-center justify-center bg-[#F8FAFC]">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#E52323]" />
            </div>
        );
    }

    return (
        <OriginatorPortalLayout
            activePage="messages"
            user={user}
            title="Messages"
            pageHeader={
                <div className="min-w-0">
                    <h2 className="text-[32px] leading-tight font-semibold tracking-tight text-[#111827]">
                        Messages
                    </h2>
                    <p className="mt-3 max-w-2xl text-base text-[#6B7280] leading-relaxed">
                        Message buyers, sellers, and agents. Share documents and schedule
                        appointments in-thread.
                    </p>
                </div>
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
