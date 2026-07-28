'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Building2,
    Calendar,
    FileText,
    MessageSquare,
    Shield,
    Users,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import PortalLoading from '@/components/PortalLoading';
import { PORTAL_CARD, PORTAL_CARD_HEADER } from '@/lib/portal-ui';

type Analytics = {
    users: number;
    agents: number;
    originators: number;
    leads: number;
    pendingAgentApprovals: number;
    pendingOriginatorApprovals: number;
    conversations: number;
    prequalCases: number;
    viewings: number;
};

export default function AdminOverviewPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [recentLeads, setRecentLeads] = useState<
        Array<{ id: string; full_name: string; email: string; lead_type: string; status: string }>
    >([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void (async () => {
            try {
                const res = await fetch('/api/admin/analytics', { credentials: 'include' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load');
                setAnalytics(data.analytics);
                setRecentLeads(data.recentLeads || []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <AdminShell title="Overview">
            {loading ? <PortalLoading variant="inline" message="Loading analytics…" /> : null}
            {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

            {analytics ? (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                        {[
                            { label: 'Users', value: analytics.users, icon: Users },
                            { label: 'Agents', value: analytics.agents, icon: Shield },
                            { label: 'Originators', value: analytics.originators, icon: Building2 },
                            { label: 'Quiz leads', value: analytics.leads, icon: FileText },
                            {
                                label: 'Pending agents',
                                value: analytics.pendingAgentApprovals,
                                icon: Shield,
                                href: '/admin/ppra',
                            },
                            {
                                label: 'Pending originators',
                                value: analytics.pendingOriginatorApprovals,
                                icon: Building2,
                                href: '/admin/originators',
                            },
                            { label: 'Conversations', value: analytics.conversations, icon: MessageSquare },
                            { label: 'Viewings', value: analytics.viewings, icon: Calendar },
                        ].map((card) => {
                            const Icon = card.icon;
                            const inner = (
                                <div className={`${PORTAL_CARD} p-5 sm:p-6 h-full`}>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
                                            {card.label}
                                        </p>
                                        <Icon className="w-4 h-4 text-gold/80" />
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-semibold tracking-tight">
                                        {card.value}
                                    </p>
                                </div>
                            );
                            return card.href ? (
                                <Link key={card.label} href={card.href} className="block hover:opacity-95">
                                    {inner}
                                </Link>
                            ) : (
                                <div key={card.label}>{inner}</div>
                            );
                        })}
                    </div>

                    <div className={PORTAL_CARD}>
                        <div className={`${PORTAL_CARD_HEADER} flex items-center justify-between`}>
                            <h2 className="font-semibold">Recent quiz leads</h2>
                            <Link href="/admin/analytics" className="text-sm text-gold hover:underline">
                                Full analytics
                            </Link>
                        </div>
                        <div className="divide-y divide-charcoal/[0.05]">
                            {recentLeads.length === 0 ? (
                                <p className="px-5 py-8 text-sm text-charcoal/50 text-center">No leads yet</p>
                            ) : (
                                recentLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        className="px-5 py-3 flex items-center justify-between gap-3 text-sm"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{lead.full_name || '—'}</p>
                                            <p className="text-charcoal/45 truncate">{lead.email}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="capitalize text-charcoal/70">{lead.lead_type}</p>
                                            <p className="text-xs text-charcoal/40 capitalize">{lead.status}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : null}
        </AdminShell>
    );
}
