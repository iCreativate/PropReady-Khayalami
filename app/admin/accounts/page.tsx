'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PortalLoading from '@/components/PortalLoading';

type Account = {
    id: string;
    accountType: 'user' | 'agent' | 'originator';
    fullName: string;
    email: string;
    status: string;
    createdAt: string | null;
    meta?: string;
};

export default function AdminAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [type, setType] = useState('all');
    const [status, setStatus] = useState('all');
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ type, status });
            if (q.trim()) params.set('q', q.trim());
            const res = await fetch(`/api/admin/accounts?${params}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setAccounts(data.accounts || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [type, status, q]);

    useEffect(() => {
        void load();
    }, [load]);

    async function setAccountStatus(account: Account, nextStatus: string) {
        if (account.accountType === 'user') return;
        setActionLoading(account.id);
        setError('');
        try {
            const res = await fetch('/api/admin/accounts', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: account.id,
                    accountType: account.accountType,
                    status: nextStatus,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Update failed');
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <AdminShell title="Account management">
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search name or email…"
                    className="flex-1 h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                />
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                >
                    <option value="all">All types</option>
                    <option value="user">Buyers / sellers</option>
                    <option value="agent">Agents</option>
                    <option value="originator">Originators</option>
                </select>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
            {loading ? <PortalLoading variant="inline" message="Loading accounts…" /> : null}

            <div className="rounded-2xl border border-charcoal/[0.08] bg-white overflow-hidden">
                <div className="divide-y divide-charcoal/[0.05]">
                    {!loading && accounts.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-charcoal/50">No accounts found</p>
                    ) : null}
                    {accounts.map((account) => (
                        <div
                            key={`${account.accountType}:${account.id}`}
                            className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-charcoal truncate">
                                    {account.fullName || '—'}
                                </p>
                                <p className="text-sm text-charcoal/50 truncate">{account.email}</p>
                                {account.meta ? (
                                    <p className="text-xs text-charcoal/40 mt-0.5">{account.meta}</p>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45 px-2 py-1 rounded-lg bg-charcoal/[0.04]">
                                    {account.accountType}
                                </span>
                                <span className="text-xs capitalize text-charcoal/60">{account.status}</span>
                                {account.accountType !== 'user' ? (
                                    <>
                                        <button
                                            type="button"
                                            disabled={actionLoading === account.id}
                                            onClick={() => void setAccountStatus(account, 'approved')}
                                            className="text-xs font-medium text-emerald-700 hover:underline disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            disabled={actionLoading === account.id}
                                            onClick={() => void setAccountStatus(account, 'rejected')}
                                            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminShell>
    );
}
