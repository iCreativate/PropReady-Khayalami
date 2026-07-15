'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentPageHeader from '@/components/AgentPageHeader';
import AgentViewingsWorkspace from '@/components/AgentViewingsWorkspace';
import { AGENT_PAGE_CONTAINER } from '@/lib/agent-portal-ui';

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
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <p className="text-charcoal/60">Loading…</p>
            </div>
        );
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
