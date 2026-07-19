'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentPageHeader from '@/components/AgentPageHeader';
import AgentViewingsWorkspace from '@/components/AgentViewingsWorkspace';
import { AGENT_PAGE_CONTAINER } from '@/lib/agent-portal-ui';
import PortalLoading from '@/components/PortalLoading';

export default function AgentViewingsPage() {
    const router = useRouter();
    const [currentAgent, setCurrentAgent] = useState<(AgentPortalAgent & { id: string }) | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const agentData = localStorage.getItem('propReady_currentAgent');
        if (!agentData) {
            router.replace('/agents/login');
            return;
        }
        const agent = JSON.parse(agentData);
        if (!agent.id) {
            router.replace('/agents/login');
            return;
        }
        setCurrentAgent(agent);
    }, [router]);

    if (!currentAgent) {
        return <PortalLoading />;
    }

    return (
        <AgentPortalLayout
            activePage="viewings"
            agent={currentAgent}
            title="Viewings"
            pageHeader={
                <AgentPageHeader
                    variant="premium"
                    eyebrow="Appointments"
                    title="Viewing Appointments"
                    description="Schedule and manage property viewings with buyers and sellers"
                />
            }
        >
            <div className={AGENT_PAGE_CONTAINER}>
                <AgentViewingsWorkspace agent={currentAgent} showPageHeader={false} />
            </div>
        </AgentPortalLayout>
    );
}
