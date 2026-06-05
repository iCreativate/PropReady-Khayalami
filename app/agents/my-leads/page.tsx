'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentMyLeadsPanel from '@/components/AgentMyLeadsPanel';
import PpraVerificationGate from '@/components/PpraVerificationGate';

export default function AgentMyLeadsPage() {
    const router = useRouter();
    const [currentAgent, setCurrentAgent] = useState<(AgentPortalAgent & { id: string }) | null>(
        null
    );

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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-charcoal/60">Loading…</p>
            </div>
        );
    }

    return (
        <AgentPortalLayout activePage="my-leads" agent={currentAgent} title="My Leads">
            <div className="max-w-5xl mx-auto">
                <PpraVerificationGate agent={currentAgent} />
                <AgentMyLeadsPanel agentId={currentAgent.id} />
            </div>
        </AgentPortalLayout>
    );
}
