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

interface AgentMyLeadsPanelProps {
    agentId?: string;
    showPageHeader?: boolean;
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
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-charcoal mb-2">My Leads</h1>
                    <p className="text-charcoal/80 text-lg">
                        Leads you have contacted with a scheduled viewing appointment
                    </p>
                    <p className="text-charcoal/50 text-sm mt-2">
                        New prequalified leads stay on the{' '}
                        <Link href="/agents/dashboard" className="text-gold hover:underline">
                            dashboard
                        </Link>
                        . They appear here after you make contact and schedule a viewing.
                    </p>
                </div>
            )}

            {loading ? (
                <p className="text-charcoal/60">Loading leads…</p>
            ) : allMyLeads.length === 0 ? (
                <div className="glass-effect rounded-xl p-12 text-center">
                    <User className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                    <p className="text-charcoal/70 text-lg font-medium">No active leads yet</p>
                    <p className="text-charcoal/50 text-sm mt-2 max-w-md mx-auto">
                        Contact a prequalified lead from your dashboard, then schedule a viewing.
                        They will show up here automatically.
                    </p>
                    <Link
                        href="/agents/dashboard"
                        className="inline-block mt-6 px-5 py-2.5 bg-gold text-white font-semibold rounded-xl hover:bg-gold-600 transition"
                    >
                        Go to Prequalified Leads
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
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
                                className="rounded-xl border border-charcoal/10 bg-white shadow-sm p-5 md:p-6 hover:border-gold/25 transition"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    <div className="flex gap-4 min-w-0">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                isSeller ? 'bg-charcoal/8' : 'bg-gold/10'
                                            }`}
                                        >
                                            {isSeller ? (
                                                <Building2 className="w-6 h-6 text-charcoal/60" />
                                            ) : (
                                                <User className="w-6 h-6 text-gold" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-charcoal">
                                                    {lead.fullName}
                                                </h3>
                                                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">
                                                    {isSeller ? 'Seller' : 'Buyer'}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${verificationStatusClasses(verification)}`}
                                                >
                                                    {verification === 'verified' && (
                                                        <CheckCircle className="w-3 h-3" />
                                                    )}
                                                    {verificationStatusLabel(verification)}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-charcoal/70">
                                                <span className="inline-flex items-center gap-1">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    {lead.email}
                                                </span>
                                                {lead.phone && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {lead.phone}
                                                    </span>
                                                )}
                                                {lead.city && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {lead.city}
                                                    </span>
                                                )}
                                            </div>
                                            {!isSeller && lead.score != null && (
                                                <p className="text-sm text-charcoal/60 mt-2 inline-flex items-center gap-1">
                                                    <TrendingUp className="w-4 h-4 text-gold" />
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
                                                    <BadgeCheck className="w-4 h-4" />
                                                    Pre-qualified with {originator}
                                                </p>
                                            )}
                                            {isSeller && lead.propertyAddress && (
                                                <p className="text-sm text-charcoal/60 mt-2">
                                                    {lead.propertyAddress}
                                                    {lead.currentValue && (
                                                        <> · {lead.currentValue}</>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {nextAppt && (
                                        <div className="lg:text-right shrink-0 rounded-lg bg-gold/5 border border-gold/20 px-4 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50 mb-1">
                                                Next appointment
                                            </p>
                                            <p className="text-charcoal font-semibold inline-flex items-center gap-1.5 lg:justify-end">
                                                <Calendar className="w-4 h-4 text-gold" />
                                                {nextAppt.date} at {nextAppt.time}
                                            </p>
                                            {nextAppt.propertyTitle && (
                                                <p className="text-charcoal/60 text-sm mt-1">
                                                    {nextAppt.propertyTitle}
                                                </p>
                                            )}
                                            <p className="text-charcoal/50 text-xs mt-1 capitalize">
                                                {nextAppt.status || 'scheduled'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
