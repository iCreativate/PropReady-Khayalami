'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentPortalLayout, { type AgentPortalAgent } from '@/components/AgentPortalLayout';
import AgentPlanPanel from '@/components/AgentPlanPanel';
import AgentPageHeader from '@/components/AgentPageHeader';
import PpraVerificationGate from '@/components/PpraVerificationGate';
import { isAgentPpraVerified } from '@/lib/ppra';
import { countVerifiedLeads } from '@/lib/lead-verification';
import { AGENT_PAGE_CONTAINER } from '@/lib/agent-portal-ui';

export default function AgentPlanPage() {
    const router = useRouter();
    const [currentAgent, setCurrentAgent] = useState<AgentPortalAgent | null>(null);
    const [verifiedBuyerCount, setVerifiedBuyerCount] = useState(0);
    const [verifiedSellerCount, setVerifiedSellerCount] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const agentData = localStorage.getItem('propReady_currentAgent');
        if (!agentData) {
            router.replace('/agents/login');
            return;
        }
        setCurrentAgent(JSON.parse(agentData));
    }, [router]);

    useEffect(() => {
        async function loadVerifiedCounts() {
            try {
                const [leadsRes, viewingsRes] = await Promise.all([
                    fetch(`/api/leads?_=${Date.now()}`, { cache: 'no-store' }),
                    fetch(`/api/viewings?_=${Date.now()}`, { cache: 'no-store' }),
                ]);
                const leadsData = await leadsRes.json().catch(() => ({}));
                const viewingsData = await viewingsRes.json().catch(() => ({}));
                const leads = Array.isArray(leadsData.leads) ? leadsData.leads : [];
                const viewings = Array.isArray(viewingsData.viewings) ? viewingsData.viewings : [];
                const buyers = leads.filter(
                    (l: { leadType?: string }) => l.leadType !== 'seller' && l.leadType !== 'investor'
                );
                const sellers = leads.filter(
                    (l: { leadType?: string }) => l.leadType === 'seller' || l.leadType === 'investor'
                );
                setVerifiedBuyerCount(
                    countVerifiedLeads(
                        buyers.map((l: { id: string; email: string; appointmentVerified?: boolean }) => ({
                            id: l.id,
                            email: l.email,
                            leadType: 'buyer' as const,
                            appointmentVerified: l.appointmentVerified,
                        })),
                        viewings
                    )
                );
                setVerifiedSellerCount(
                    countVerifiedLeads(
                        sellers.map((l: { id: string; email: string; appointmentVerified?: boolean }) => ({
                            id: l.id,
                            email: l.email,
                            leadType: 'seller' as const,
                            appointmentVerified: l.appointmentVerified,
                        })),
                        viewings
                    )
                );
            } catch {
                /* keep zero counts */
            }
        }
        if (currentAgent) loadVerifiedCounts();
    }, [currentAgent]);

    const ppraVerified = useMemo(() => isAgentPpraVerified(currentAgent), [currentAgent]);

    if (!currentAgent) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <p className="text-charcoal/60">Loading…</p>
            </div>
        );
    }

    return (
        <AgentPortalLayout
            activePage="plan"
            agent={currentAgent}
            title="Your Plan"
            pageHeader={
                <AgentPageHeader
                    variant="premium"
                    eyebrow="Subscription"
                    title="Your Plan"
                    description="View your current package and upgrade options"
                />
            }
        >
            <div className={AGENT_PAGE_CONTAINER}>
                <PpraVerificationGate agent={currentAgent} />

                {ppraVerified ? (
                    <AgentPlanPanel
                        agent={{
                            fullName: currentAgent.fullName,
                            email: currentAgent.email || '',
                            plan: currentAgent.plan,
                            sellerPlan: currentAgent.sellerPlan,
                        }}
                        verifiedBuyerCount={verifiedBuyerCount}
                        verifiedSellerCount={verifiedSellerCount}
                    />
                ) : (
                    <p className="text-charcoal/70 text-sm">
                        Complete PPRA verification to view and upgrade your lead plan.
                    </p>
                )}
            </div>
        </AgentPortalLayout>
    );
}
