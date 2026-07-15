'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentPageHeader from '@/components/AgentPageHeader';
import AgentListedPropertiesWorkspace from '@/components/AgentListedPropertiesWorkspace';
import { AGENT_PAGE_CONTAINER } from '@/lib/agent-portal-ui';

export default function AgentPropertiesPage() {
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
            activePage="properties"
            agent={currentAgent}
            title="Properties"
            pageHeader={
                <AgentPageHeader
                    variant="premium"
                    eyebrow="Listings"
                    title="My Listed Properties"
                    description="Manage listings, publish to buyers, and schedule viewings"
                />
            }
        >
            <div className={AGENT_PAGE_CONTAINER}>
                <AgentListedPropertiesWorkspace agent={currentAgent} showPageHeader={false} />
            </div>
        </AgentPortalLayout>
    );
}
