'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Home,
    Search,
    CheckCircle,
    XCircle,
    Eye,
    Shield,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import PpraVerificationBadge from '@/components/PpraVerificationBadge';

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
    const [adminEmail, setAdminEmail] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [applications, setApplications] = useState<Application[]>([]);
    const [selected, setSelected] = useState<Application | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const loadApplications = useCallback(async () => {
        if (!adminEmail) return;
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ adminEmail, status: statusFilter });
            if (search) params.set('q', search);
            const res = await fetch(`/api/admin/ppra?${params}`, {
                headers: { 'x-admin-email': adminEmail },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setApplications(data.applications || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Load failed');
        } finally {
            setLoading(false);
        }
    }, [adminEmail, statusFilter, search]);

    useEffect(() => {
        if (authenticated) loadApplications();
    }, [authenticated, loadApplications]);

    const openPreview = async (app: Application) => {
        if (!app.ffcDocumentUrl) return;
        const res = await fetch(
            `/api/agents/ppra/document?path=${encodeURIComponent(app.ffcDocumentUrl)}&adminEmail=${encodeURIComponent(adminEmail)}`
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminEmail,
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

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="max-w-md w-full premium-card p-8 rounded-2xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="w-8 h-8 text-gold" />
                        <h1 className="text-2xl font-bold text-charcoal">PPRA Admin</h1>
                    </div>
                    <p className="text-charcoal/70 text-sm mb-4">
                        Sign in with an email listed in <code className="text-xs">ADMIN_EMAILS</code> on the
                        server.
                    </p>
                    <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@propready.co.za"
                        className="w-full px-4 py-3 rounded-lg border border-charcoal/20 mb-4"
                    />
                    <button
                        type="button"
                        onClick={() => setAuthenticated(!!adminEmail.trim())}
                        className="w-full py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600"
                    >
                        Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-charcoal/10 px-4 py-4">
                <div className="container mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-charcoal font-bold">
                        <Home className="w-5 h-5 text-gold" />
                        PropReady Admin
                    </Link>
                    <span className="text-sm text-charcoal/60">{adminEmail}</span>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal">PPRA verification queue</h1>
                        <p className="text-charcoal/70">Review practitioner applications</p>
                    </div>
                    <button
                        type="button"
                        onClick={loadApplications}
                        className="flex items-center gap-2 px-4 py-2 border border-charcoal/20 rounded-lg hover:bg-charcoal/5"
                    >
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
                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && loadApplications()}
                                    placeholder="Search name, agency, PPRA number…"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-charcoal/20"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-charcoal/20"
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="verified">Verified</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                            {applications.map((app) => (
                                <button
                                    key={app.id}
                                    type="button"
                                    onClick={() => {
                                        setSelected(app);
                                        setPreviewUrl(null);
                                        setNotes(app.verificationNotes || '');
                                    }}
                                    className={`w-full text-left p-4 rounded-xl border transition ${
                                        selected?.id === app.id
                                            ? 'border-gold bg-gold/5'
                                            : 'border-charcoal/10 hover:border-gold/30'
                                    }`}
                                >
                                    <div className="flex justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-charcoal">{app.fullName}</p>
                                            <p className="text-sm text-charcoal/60">{app.company}</p>
                                            <p className="text-xs text-charcoal/50 font-mono mt-1">
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
                                <p className="text-center text-charcoal/50 py-8">No applications found</p>
                            )}
                        </div>
                    </div>

                    <div className="lg:w-96 premium-card p-6 rounded-xl border border-charcoal/10 h-fit sticky top-24">
                        {selected ? (
                            <>
                                <h2 className="text-xl font-bold text-charcoal mb-2">{selected.fullName}</h2>
                                <PpraVerificationBadge
                                    agent={{ verificationStatus: selected.verificationStatus }}
                                />
                                <dl className="mt-4 space-y-2 text-sm text-charcoal/80">
                                    <div>
                                        <dt className="text-charcoal/50">Email</dt>
                                        <dd>{selected.email}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-charcoal/50">Phone</dt>
                                        <dd>{selected.phone}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-charcoal/50">FFC number</dt>
                                        <dd className="font-mono">{selected.ffcNumber || '—'}</dd>
                                    </div>
                                </dl>
                                {selected.ffcDocumentUrl && (
                                    <button
                                        type="button"
                                        onClick={() => openPreview(selected)}
                                        className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-charcoal/20 rounded-lg hover:bg-charcoal/5 text-sm"
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
                                    className="w-full mt-4 px-3 py-2 rounded-lg border border-charcoal/20 text-sm"
                                />
                                {selected.verificationStatus === 'pending' && (
                                    <>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Rejection reason (required if rejecting)"
                                            rows={2}
                                            className="w-full mt-2 px-3 py-2 rounded-lg border border-charcoal/20 text-sm"
                                        />
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                type="button"
                                                disabled={actionLoading}
                                                onClick={() => review('approve')}
                                                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1 hover:bg-green-700 disabled:opacity-50"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                disabled={actionLoading}
                                                onClick={() => review('reject')}
                                                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1 hover:bg-red-700 disabled:opacity-50"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <p className="text-charcoal/50 text-sm">Select an application to review</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
