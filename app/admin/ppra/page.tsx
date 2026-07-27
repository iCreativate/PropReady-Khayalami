'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    CheckCircle,
    XCircle,
    Eye,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import PpraVerificationBadge from '@/components/PpraVerificationBadge';
import PortalLoading from '@/components/PortalLoading';
import {
    PORTAL_CARD,
    PORTAL_SECONDARY_BTN,
    PORTAL_DANGER_BTN,
    PORTAL_SUCCESS_BTN,
    PORTAL_INPUT,
    PORTAL_SEARCH_INPUT,
    PORTAL_REFRESH_BTN,
    PORTAL_SELECT,
    PORTAL_TEXT_SECONDARY,
} from '@/lib/portal-ui';

interface Application {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    company: string;
    ppraNumber: string;
    ffcNumber?: string;
    ffcDocumentUrl?: string;
    verificationStatus: string;
    verificationNotes?: string;
    createdAt: string;
}

export default function AdminPpraPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [applications, setApplications] = useState<Application[]>([]);
    const [selected, setSelected] = useState<Application | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const loadApplications = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ status: statusFilter });
            if (search) params.set('q', search);
            const res = await fetch(`/api/admin/ppra?${params}`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setApplications(data.applications || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Load failed');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search]);

    useEffect(() => {
        void loadApplications();
    }, [loadApplications]);

    const openPreview = async (app: Application) => {
        if (!app.ffcDocumentUrl) return;
        const res = await fetch(
            `/api/agents/ppra/document?path=${encodeURIComponent(app.ffcDocumentUrl)}`,
            { credentials: 'include' }
        );
        const data = await res.json();
        if (data.signedUrl) setPreviewUrl(data.signedUrl);
        else setError(data.error || 'Could not load document');
    };

    const review = async (action: 'approve' | 'reject') => {
        if (!selected) return;
        if (action === 'reject' && !rejectionReason.trim()) {
            setError('Enter a rejection reason');
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/ppra/review', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: selected.id,
                    action,
                    rejectionReason,
                    verificationNotes: notes,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Action failed');
            setSelected(null);
            setNotes('');
            setRejectionReason('');
            setPreviewUrl(null);
            await loadApplications();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminShell title="Agent approvals">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-charcoal tracking-tight">
                        Agent registration approvals
                    </h2>
                    <p className={PORTAL_TEXT_SECONDARY}>
                        PropReady review of agent applications, including FFC and practitioner details
                    </p>
                </div>
                <button type="button" onClick={loadApplications} className={PORTAL_REFRESH_BTN}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <p className="mb-4 text-red-600 flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </p>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && loadApplications()}
                                placeholder="Search name, agency, PPRA number…"
                                className={PORTAL_SEARCH_INPUT}
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={PORTAL_SELECT}
                        >
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
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
                                onClick={() => {
                                    setSelected(app);
                                    setPreviewUrl(null);
                                    setNotes(app.verificationNotes || '');
                                }}
                                className={`w-full text-left p-4 rounded-2xl border transition ${
                                    selected?.id === app.id
                                        ? 'border-gold/30 bg-gold/[0.04]'
                                        : 'border-charcoal/[0.08] bg-white hover:border-charcoal/15'
                                }`}
                            >
                                <div className="flex justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-charcoal">{app.fullName}</p>
                                        <p className={`text-sm ${PORTAL_TEXT_SECONDARY}`}>{app.company}</p>
                                        <p className="text-xs text-charcoal/45 font-mono mt-1">
                                            PPRA {app.ppraNumber}
                                        </p>
                                    </div>
                                    <PpraVerificationBadge
                                        agent={{ verificationStatus: app.verificationStatus }}
                                    />
                                </div>
                            </button>
                        ))}
                        {!loading && applications.length === 0 && (
                            <p className={`text-center py-8 ${PORTAL_TEXT_SECONDARY}`}>
                                No applications found
                            </p>
                        )}
                    </div>
                </div>

                <div className={`${PORTAL_CARD} lg:w-96 p-6 h-fit sticky top-24`}>
                    {selected ? (
                        <>
                            <h2 className="text-xl font-semibold text-charcoal mb-2">
                                {selected.fullName}
                            </h2>
                            <PpraVerificationBadge
                                agent={{ verificationStatus: selected.verificationStatus }}
                            />
                            <dl className={`mt-4 space-y-2 text-sm ${PORTAL_TEXT_SECONDARY}`}>
                                <div>
                                    <dt className="text-charcoal/45">Email</dt>
                                    <dd className="text-charcoal">{selected.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-charcoal/45">Phone</dt>
                                    <dd className="text-charcoal">{selected.phone}</dd>
                                </div>
                                <div>
                                    <dt className="text-charcoal/45">FFC number</dt>
                                    <dd className="font-mono text-charcoal">
                                        {selected.ffcNumber || '—'}
                                    </dd>
                                </div>
                            </dl>
                            {selected.ffcDocumentUrl && (
                                <button
                                    type="button"
                                    onClick={() => openPreview(selected)}
                                    className={`${PORTAL_SECONDARY_BTN} mt-4 w-full`}
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview FFC document
                                </button>
                            )}
                            {previewUrl && (
                                <a
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block mt-2 text-gold text-sm hover:underline"
                                >
                                    Open document in new tab
                                </a>
                            )}
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Internal verification notes (optional)"
                                rows={2}
                                className={`${PORTAL_INPUT} mt-4 text-sm`}
                            />
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Rejection reason (required if rejecting)"
                                rows={2}
                                className={`${PORTAL_INPUT} mt-2 text-sm`}
                            />
                            <div className="flex gap-2 mt-4">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => review('approve')}
                                    className={`${PORTAL_SUCCESS_BTN} flex-1`}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {selected.verificationStatus === 'verified' ? 'Re-approve' : 'Approve'}
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
