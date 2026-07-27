'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentPageHeader from '@/components/AgentPageHeader';
import PortalLoading from '@/components/PortalLoading';
import MessagesWorkspace from '@/components/messages/MessagesWorkspace';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { AGENT_PAGE_CONTAINER } from '@/lib/agent-portal-ui';

export default function AgentMessagesPage() {
    const router = useRouter();
    const [agent, setAgent] = useState<AgentPortalAgent | null>(null);
    const [profileId, setProfileId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEYS.currentAgent);
                if (raw) {
                    const parsed = JSON.parse(raw) as AgentPortalAgent & { id?: string };
                    if (!cancelled) {
                        setAgent(parsed);
                        if (parsed.id) setProfileId(parsed.id);
                    }
                }
                const bridged = await hydrateSessionFromCookies();
                if (cancelled) return;
                if (!bridged || bridged.accountType !== 'agent') {
                    if (!raw) router.replace('/agents/login');
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
        return <PortalLoading variant="dashboard" message="Loading messages…" />;
    }

    return (
        <AgentPortalLayout
            activePage="messages"
            agent={agent}
            title="Messages"
            pageHeader={
                <AgentPageHeader
                    title="Messages"
                    description="Talk with buyers, sellers, and bond originators — share files and propose viewings."
                />
            }
        >
            <div className={AGENT_PAGE_CONTAINER}>
                <MessagesWorkspace
                    role="agent"
                    profileId={profileId}
                    accountType="agent"
                    displayName={agent.fullName || agent.email || 'Agent'}
                />
            </div>
        </AgentPortalLayout>
    );
}
