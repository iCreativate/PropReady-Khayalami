'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PortalLoading from '@/components/PortalLoading';

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

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        void (async () => {
            try {
                const res = await fetch('/api/admin/analytics', { credentials: 'include' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load');
                setAnalytics(data.analytics);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <AdminShell title="Analytics">
            {loading ? <PortalLoading variant="inline" message="Loading…" /> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {analytics ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(
                        [
                            ['Registered users', analytics.users],
                            ['Agents', analytics.agents],
                            ['Bond originators', analytics.originators],
                            ['Quiz leads', analytics.leads],
                            ['Pending agent approvals', analytics.pendingAgentApprovals],
                            ['Pending originator approvals', analytics.pendingOriginatorApprovals],
                            ['Message conversations', analytics.conversations],
                            ['Prequal cases', analytics.prequalCases],
                            ['Viewing appointments', analytics.viewings],
                        ] as const
                    ).map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-charcoal/[0.08] bg-white p-5"
                        >
                            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45 mb-2">
                                {label}
                            </p>
                            <p className="text-3xl font-semibold tracking-tight">{value}</p>
                        </div>
                    ))}
                </div>
            ) : null}
        </AdminShell>
    );
}
