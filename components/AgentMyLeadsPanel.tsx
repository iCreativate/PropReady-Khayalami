'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    User,
    Building2,
    Calendar,
    CheckCircle,
    MapPin,
    TrendingUp,
    BadgeCheck,
    Phone,
    Mail,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { bondOriginatorLabel } from '@/lib/bond-originators';
import {
    filterMyLeads,
    getLeadAppointments,
    myLeadVerificationStatus,
    type AgentLeadRecord,
    type ScheduledViewing,
} from '@/lib/my-leads';
import {
    verificationStatusLabel,
    verificationStatusClasses,
} from '@/lib/lead-verification';
import { mergeDemoLeadsIntoStorage } from '@/lib/demo-leads';
import { DEMO_AGENT } from '@/lib/demo-agent';
import AgentPageHeader from '@/components/AgentPageHeader';
import {
    AGENT_CARD,
    AGENT_CARD_HEADER,
    AGENT_CARD_BODY,
    AGENT_BADGE,
    AGENT_EMPTY_ICON,
    AGENT_INNER_CARD,
    AGENT_PRIMARY_BTN,
    AGENT_CARD_SOFT,
} from '@/lib/agent-portal-ui';
import PortalLoading from '@/components/PortalLoading';

interface AgentMyLeadsPanelProps {
    agentId?: string;
    showPageHeader?: boolean;
    agentFirstName?: string;
}

async function loadAllLeads(): Promise<{
    buyers: AgentLeadRecord[];
    sellers: AgentLeadRecord[];
    viewings: ScheduledViewing[];
}> {
    let apiLeads: AgentLeadRecord[] = [];
    let apiViewings: ScheduledViewing[] = [];

    try {
        const [leadsRes, viewingsRes] = await Promise.all([
            fetch(`/api/leads?_=${Date.now()}`, { cache: 'no-store' }),
            fetch(`/api/viewings?_=${Date.now()}`, { cache: 'no-store' }),
        ]);
        const leadsData = await leadsRes.json().catch(() => ({}));
        const viewingsData = await viewingsRes.json().catch(() => ({}));
        if (Array.isArray(leadsData.leads)) apiLeads = leadsData.leads;
        if (Array.isArray(viewingsData.viewings)) apiViewings = viewingsData.viewings;
    } catch {
        /* use local only */
    }

    const storedBuyers: AgentLeadRecord[] = JSON.parse(
        localStorage.getItem('propReady_leads') || '[]'
    );
    const storedSellers: AgentLeadRecord[] = JSON.parse(
        localStorage.getItem('propReady_sellers') || '[]'
    );
    const storedViewings: ScheduledViewing[] = JSON.parse(
        localStorage.getItem('propReady_viewingAppointments') || '[]'
    );

    const leadIds = new Set(apiLeads.map((l) => l.id));
    const viewingIds = new Set(apiViewings.map((v) => v.id));

    const buyers = [
        ...apiLeads.filter((l) => l.leadType !== 'seller' && l.leadType !== 'investor'),
        ...storedBuyers.filter((l) => !leadIds.has(l.id)),
    ];
    const sellers = [
        ...apiLeads.filter((l) => l.leadType === 'seller' || l.leadType === 'investor'),
        ...storedSellers.filter((l) => !leadIds.has(l.id)),
    ];
    const viewings = [...apiViewings, ...storedViewings.filter((v) => !viewingIds.has(v.id))];

    return { buyers, sellers, viewings };
}

export default function AgentMyLeadsPanel({
    agentId,
    showPageHeader = true,
    agentFirstName,
}: AgentMyLeadsPanelProps) {
    const [buyers, setBuyers] = useState<AgentLeadRecord[]>([]);
    const [sellers, setSellers] = useState<AgentLeadRecord[]>([]);
    const [viewings, setViewings] = useState<ScheduledViewing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (agentId === DEMO_AGENT.id) {
            mergeDemoLeadsIntoStorage(agentId);
        }
        loadAllLeads().then((data) => {
            setBuyers(data.buyers);
            setSellers(data.sellers);
            setViewings(data.viewings);
            setLoading(false);
        });
    }, [agentId]);

    const myBuyers = useMemo(() => filterMyLeads(buyers, viewings), [buyers, viewings]);
    const mySellers = useMemo(() => filterMyLeads(sellers, viewings), [sellers, viewings]);
    const allMyLeads = useMemo(
        () =>
            [...myBuyers, ...mySellers].sort(
                (a, b) =>
                    new Date(b.contactedAt || b.timestamp || 0).getTime() -
                    new Date(a.contactedAt || a.timestamp || 0).getTime()
            ),
        [myBuyers, mySellers]
    );

    return (
        <div>
            {showPageHeader && (
                <AgentPageHeader
                    variant="premium"
                    eyebrow={agentFirstName ? `Active pipeline, ${agentFirstName}` : 'Active pipeline'}
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
            )}

            {loading ? (
                <PortalLoading variant="inline" message="Loading leads…" />
            ) : allMyLeads.length === 0 ? (
                <div className={`${AGENT_CARD_SOFT} p-12 sm:p-16 text-center`}>
                    <div className={AGENT_EMPTY_ICON}>
                        <User className="w-8 h-8 text-charcoal/25" />
                    </div>
                    <p className="text-charcoal font-semibold text-lg tracking-tight">No active leads yet</p>
                    <p className="text-charcoal/45 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                        Contact a prequalified lead from your dashboard, then schedule a viewing.
                        They will show up here automatically.
                    </p>
                    <Link href="/agents/dashboard" className={`${AGENT_PRIMARY_BTN} mt-8`}>
                        Go to Prequalified Leads
                    </Link>
                </div>
            ) : (
                <div className={AGENT_CARD}>
                    <div className={AGENT_CARD_HEADER}>
                        <p className="text-sm text-charcoal/45 leading-relaxed">
                            <span className="font-semibold text-charcoal">{allMyLeads.length}</span> active lead
                            {allMyLeads.length === 1 ? '' : 's'} with scheduled viewings
                        </p>
                    </div>
                    <div className={`${AGENT_CARD_BODY} space-y-4 sm:space-y-5`}>
                    {allMyLeads.map((lead) => {
                        const isSeller =
                            lead.leadType === 'seller' || lead.leadType === 'investor';
                        const appointments = getLeadAppointments(lead, viewings);
                        const nextAppt = appointments[0];
                        const verification = myLeadVerificationStatus(lead, viewings);
                        const originator = bondOriginatorLabel(lead.bondOriginator);

                        return (
                            <div
                                key={lead.id}
                                className={AGENT_INNER_CARD}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    <div className="flex gap-4 min-w-0">
                                        <div
                                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                                isSeller ? 'bg-charcoal/8' : 'bg-gold/10'
                                            }`}
                                        >
                                            {isSeller ? (
                                                <Building2 className="w-5 h-5 text-charcoal/60" />
                                            ) : (
                                                <User className="w-5 h-5 text-gold" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <h3 className="text-base font-bold text-charcoal">
                                                    {lead.fullName}
                                                </h3>
                                                <span className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45 px-2 py-0.5 rounded-md bg-charcoal/5">
                                                    {isSeller ? 'Seller' : 'Buyer'}
                                                </span>
                                                <span
                                                    className={`${AGENT_BADGE} border ${verificationStatusClasses(verification)}`}
                                                >
                                                    {verification === 'verified' && (
                                                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                                    )}
                                                    {verificationStatusLabel(verification)}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                                                <span className="inline-flex items-center gap-1.5 text-charcoal/70 min-w-0">
                                                    <Mail className="w-3.5 h-3.5 shrink-0 text-charcoal/40" />
                                                    <span className="truncate">{lead.email}</span>
                                                </span>
                                                {lead.phone && (
                                                    <span className="inline-flex items-center gap-1.5 text-charcoal/55 tabular-nums">
                                                        <Phone className="w-3.5 h-3.5 shrink-0 text-charcoal/40" />
                                                        {lead.phone}
                                                    </span>
                                                )}
                                                {lead.city && (
                                                    <span className="inline-flex items-center gap-1.5 text-charcoal/55">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0 text-charcoal/40" />
                                                        {lead.city}
                                                    </span>
                                                )}
                                            </div>
                                            {!isSeller && lead.score != null && (
                                                <p className="text-sm text-charcoal/55 mt-2 inline-flex items-center gap-1.5">
                                                    <TrendingUp className="w-3.5 h-3.5 text-gold" />
                                                    Score {lead.score}%
                                                    {lead.preQualAmount != null && (
                                                        <>
                                                            {' '}
                                                            · Pre-qualified{' '}
                                                            {formatCurrency(lead.preQualAmount)}
                                                        </>
                                                    )}
                                                </p>
                                            )}
                                            {originator && lead.prequalifiedWithOriginator && (
                                                <p className="text-sm mt-2 inline-flex items-center gap-1.5 text-gold font-medium">
                                                    <BadgeCheck className="w-4 h-4 shrink-0" />
                                                    Pre-qualified with {originator}
                                                </p>
                                            )}
                                            {isSeller && lead.propertyAddress && (
                                                <p className="text-sm text-charcoal/55 mt-2 leading-relaxed">
                                                    {lead.propertyAddress}
                                                    {lead.currentValue && (
                                                        <> · {lead.currentValue}</>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {nextAppt && (
                                        <div className="lg:text-right shrink-0 rounded-xl bg-gold/5 border border-gold/15 px-4 py-3">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45 mb-1">
                                                Next appointment
                                            </p>
                                            <p className="text-charcoal font-semibold text-sm inline-flex items-center gap-1.5 lg:justify-end">
                                                <Calendar className="w-4 h-4 text-gold shrink-0" />
                                                {nextAppt.date} at {nextAppt.time}
                                            </p>
                                            {nextAppt.propertyTitle && (
                                                <p className="text-charcoal/55 text-sm mt-1">
                                                    {nextAppt.propertyTitle}
                                                </p>
                                            )}
                                            <p className="text-charcoal/45 text-xs mt-1 capitalize">
                                                {nextAppt.status || 'scheduled'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
            )}
        </div>
    );
}
