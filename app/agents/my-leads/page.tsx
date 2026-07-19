'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentPageHeader from '@/components/AgentPageHeader';
import AgentMyLeadsPanel from '@/components/AgentMyLeadsPanel';
import { AGENT_PAGE_CONTAINER } from '@/lib/agent-portal-ui';
import PpraVerificationGate from '@/components/PpraVerificationGate';
import PortalLoading from '@/components/PortalLoading';

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
        return <PortalLoading />;
    }

    const firstName = currentAgent.fullName?.split(' ')[0];

    return (
        <AgentPortalLayout
            activePage="my-leads"
            agent={currentAgent}
            title="My Leads"
            pageHeader={
                <AgentPageHeader
                    variant="premium"
                    eyebrow={firstName ? `Active pipeline, ${firstName}` : 'Active pipeline'}
                    title="My Leads"
                    description="Leads you have contacted with a scheduled viewing appointment"
                >
                    <p className="text-charcoal/45 text-sm mt-3 max-w-2xl">
                        New prequalified leads stay on the{' '}
                        <Link href="/agents/dashboard" className="text-gold font-medium hover:underline">
                            dashboard
                        </Link>
                        . They appear here after you make contact and schedule a viewing.
                    </p>
                </AgentPageHeader>
            }
        >
            <div className={AGENT_PAGE_CONTAINER}>
                <PpraVerificationGate agent={currentAgent} />
                <AgentMyLeadsPanel
                    agentId={currentAgent.id}
                    agentFirstName={firstName}
                    showPageHeader={false}
                />
            </div>
        </AgentPortalLayout>
    );
}
