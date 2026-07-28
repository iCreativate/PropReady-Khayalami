'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Search, XCircle } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import PortalLoading from '@/components/PortalLoading';
import {
    PORTAL_CARD,
    PORTAL_DANGER_BTN,
    PORTAL_REFRESH_BTN,
    PORTAL_SEARCH_INPUT,
    PORTAL_SELECT,
    PORTAL_SUCCESS_BTN,
    PORTAL_TEXT_SECONDARY,
} from '@/lib/portal-ui';

interface OriginatorApplication {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    organizationId: string;
    organizationName: string;
    staffNumber: string | null;
    status: string;
    createdAt: string;
}

export default function AdminOriginatorsPage() {
    const [applications, setApplications] = useState<OriginatorApplication[]>([]);
    const [selected, setSelected] = useState<OriginatorApplication | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [error, setError] = useState('');

    const loadApplications = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ status: statusFilter });
            if (search.trim()) params.set('q', search.trim());
            const res = await fetch(`/api/admin/originators?${params}`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to load');
                setApplications([]);
                return;
            }
            setApplications(data.applications || []);
        } catch {
            setError('Failed to load applications');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        void loadApplications();
    }, [loadApplications]);

    async function review(action: 'approve' | 'reject') {
        if (!selected) return;
        setActionLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/originators/review', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originatorId: selected.id,
                    action,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || `Action failed (${res.status})`);
                return;
            }
            if (action === 'approve' && data.originator?.staffNumber) {
                const mailNote = data.emailSent
                    ? ` Staff number ${data.originator.staffNumber} emailed to ${data.originator.email}.`
                    : data.emailWarning
                      ? ` Staff number ${data.originator.staffNumber} assigned (email not sent: ${data.emailWarning}).`
                      : ` Staff number ${data.originator.staffNumber} assigned.`;
                setError('');
                alert(`Approved.${mailNote}`);
            }
            setSelected(null);
            await loadApplications();
        } catch {
            setError('Action failed');
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <AdminShell title="Originator approvals">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-charcoal tracking-tight">
                        Originator staff approvals
                    </h2>
                    <p className={PORTAL_TEXT_SECONDARY}>
                        PropReady must approve staff before they can access the originator portal
                    </p>
                </div>
                <button type="button" onClick={loadApplications} className={PORTAL_REFRESH_BTN}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error ? (
                <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            ) : null}

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && loadApplications()}
                                placeholder="Search name, email, staff number…"
                                className={PORTAL_SEARCH_INPUT}
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={PORTAL_SELECT}
                        >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="all">All</option>
                        </select>
                    </div>

                    <div className="relative space-y-2 max-h-[70vh] overflow-y-auto min-h-[120px]">
                        {loading && applications.length === 0 ? (
                            <PortalLoading variant="inline" message="Loading applications…" />
                        ) : null}
                        {applications.map((app) => (
                            <button
                                key={app.id}
                                type="button"
                                onClick={() => setSelected(app)}
                                className={`w-full text-left p-4 rounded-2xl border transition ${
                                    selected?.id === app.id
                                        ? 'border-gold/30 bg-gold/[0.04]'
                                        : 'border-charcoal/[0.08] bg-white hover:border-charcoal/15'
                                }`}
                            >
                                <p className="font-semibold text-charcoal">{app.fullName}</p>
                                <p className={`text-sm ${PORTAL_TEXT_SECONDARY}`}>
                                    {app.organizationName}
                                </p>
                                <p className="text-xs text-charcoal/45 font-mono mt-1">
                                    {app.staffNumber || 'No staff number'} · {app.status}
                                </p>
                            </button>
                        ))}
                        {!loading && applications.length === 0 ? (
                            <p className={`text-center py-8 ${PORTAL_TEXT_SECONDARY}`}>
                                No applications found
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className={`${PORTAL_CARD} lg:w-96 p-6 h-fit sticky top-24`}>
                    {selected ? (
                        <>
                            <h2 className="text-xl font-semibold text-charcoal mb-2">
                                {selected.fullName}
                            </h2>
                            <p className={`text-sm mb-4 ${PORTAL_TEXT_SECONDARY}`}>
                                Status: <span className="text-charcoal font-medium">{selected.status}</span>
                            </p>
                            <dl className={`space-y-2 text-sm ${PORTAL_TEXT_SECONDARY}`}>
                                <div>
                                    <dt className="text-charcoal/45">Email</dt>
                                    <dd className="text-charcoal">{selected.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-charcoal/45">Organisation</dt>
                                    <dd className="text-charcoal">{selected.organizationName}</dd>
                                </div>
                                <div>
                                    <dt className="text-charcoal/45">Staff number</dt>
                                    <dd className="font-mono text-charcoal">
                                        {selected.staffNumber ||
                                            (selected.status === 'pending'
                                                ? 'Assigned automatically on approval'
                                                : '—')}
                                    </dd>
                                </div>
                            </dl>
                            <div className="flex gap-2 mt-6">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => review('approve')}
                                    className={`${PORTAL_SUCCESS_BTN} flex-1`}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {selected.status === 'approved' ? 'Re-approve' : 'Approve'}
                                </button>
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => review('reject')}
                                    className={`${PORTAL_DANGER_BTN} flex-1`}
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className={`text-sm ${PORTAL_TEXT_SECONDARY}`}>
                            Select an application to review
                        </p>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}
