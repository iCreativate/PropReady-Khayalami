'use client';

import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentPageHeader from '@/components/AgentPageHeader';
import type { PortalHeroStat } from '@/components/PortalHero';
import MessagesWorkspaceSkeleton from '@/components/messages/MessagesWorkspaceSkeleton';
import {
    hydrateSessionFromCookies,
    readOptimisticSession,
} from '@/lib/auth-session-bridge';
import { AGENT_PAGE_CONTAINER } from '@/lib/agent-portal-ui';

const MessagesWorkspace = dynamic(
    () => import('@/components/messages/MessagesWorkspace'),
    {
        ssr: false,
        loading: () => <MessagesWorkspaceSkeleton />,
    }
);

export default function AgentMessagesPage() {
    const router = useRouter();
    const [agent, setAgent] = useState<AgentPortalAgent | null>(null);
    const [profileId, setProfileId] = useState('');
    const [loading, setLoading] = useState(true);
    const [heroActions, setHeroActions] = useState<ReactNode>(null);
    const [heroStats, setHeroStats] = useState<PortalHeroStat[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        const optimistic = readOptimisticSession('agent');
        if (optimistic) {
            setProfileId(optimistic.id);
            setAgent({
                fullName: optimistic.fullName || 'Agent',
                email: optimistic.email,
                company: optimistic.company,
            });
            setLoading(false);
        }

        void (async () => {
            try {
                const bridged = await hydrateSessionFromCookies();
                if (cancelled) return;
                if (!bridged || bridged.accountType !== 'agent') {
                    router.replace('/agents/login');
                    return;
                }
                setProfileId(bridged.id);
                setAgent({
                    fullName: bridged.fullName || 'Agent',
                    email: bridged.email,
                    company: bridged.company,
                });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    if (loading || !agent || !profileId) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1400px]">
                    <MessagesWorkspaceSkeleton />
                </div>
            </div>
        );
    }

    return (
        <AgentPortalLayout
            activePage="messages"
            agent={agent}
            title="Messages"
            pageHeader={
                <AgentPageHeader
                    eyebrow="Inbox"
                    title="Messages"
                    description="Message buyers, sellers, and PropReady staff from one place."
                    glassLabel="Inbox pulse"
                    stats={heroStats ?? undefined}
                    actions={heroActions}
                />
            }
        >
            <div className={AGENT_PAGE_CONTAINER}>
                <MessagesWorkspace
                    role="agent"
                    profileId={profileId}
                    accountType="agent"
                    displayName={agent.fullName || agent.email || 'Agent'}
                    onHeroActionsChange={setHeroActions}
                    onHeroStatsChange={setHeroStats}
                />
            </div>
        </AgentPortalLayout>
    );
}
