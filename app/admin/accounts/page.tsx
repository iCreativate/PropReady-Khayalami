'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import PortalLoading from '@/components/PortalLoading';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { getPasswordRequirementsText } from '@/lib/password';

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
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        accountType: 'user' as Account['accountType'],
        fullName: '',
        email: '',
        password: '',
        phone: '',
        company: '',
        organizationId: (BOND_ORIGINATORS[0]?.id || '') as string,
        approve: true,
    });

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

    async function setAccountStatus(account: Account, nextStatus: 'approved' | 'rejected') {
        if (account.accountType === 'user') return;
        setActionLoading(account.id);
        setError('');
        try {
            const res = await fetch('/api/admin/accounts', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: nextStatus === 'approved' ? 'approve' : 'reject',
                    id: account.id,
                    accountType: account.accountType,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `Update failed (${res.status})`);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Update failed');
        } finally {
            setActionLoading(null);
        }
    }

    async function deleteAccount(account: Account) {
        const ok = window.confirm(
            `Delete ${account.fullName || account.email} (${account.accountType}) permanently? This cannot be undone.`
        );
        if (!ok) return;
        setActionLoading(account.id);
        setError('');
        try {
            const res = await fetch('/api/admin/accounts', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    id: account.id,
                    accountType: account.accountType,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `Delete failed (${res.status})`);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setActionLoading(null);
        }
    }

    async function createAccount(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        setError('');
        try {
            const res = await fetch('/api/admin/accounts', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Create failed');
            setShowCreate(false);
            setForm({
                accountType: 'user',
                fullName: '',
                email: '',
                password: '',
                phone: '',
                company: '',
                organizationId: BOND_ORIGINATORS[0]?.id || '',
                approve: true,
            });
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Create failed');
        } finally {
            setCreating(false);
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
                <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="h-11 px-4 rounded-xl bg-gold text-white text-sm font-semibold inline-flex items-center gap-2 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Add account
                </button>
            </div>

            {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
            {loading ? <PortalLoading variant="inline" message="Loading accounts…" /> : null}

            {showCreate ? (
                <div className="mb-6 rounded-2xl border border-charcoal/[0.08] bg-white p-5">
                    <h2 className="text-lg font-semibold text-charcoal mb-4">Add account</h2>
                    <form onSubmit={createAccount} className="grid sm:grid-cols-2 gap-3">
                        <label className="text-sm space-y-1">
                            <span className="text-charcoal/50">Type</span>
                            <select
                                value={form.accountType}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        accountType: e.target.value as Account['accountType'],
                                    }))
                                }
                                className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3"
                            >
                                <option value="user">Buyer / seller</option>
                                <option value="agent">Agent</option>
                                <option value="originator">Originator</option>
                            </select>
                        </label>
                        <label className="text-sm space-y-1">
                            <span className="text-charcoal/50">Full name</span>
                            <input
                                required
                                value={form.fullName}
                                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                                className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3"
                            />
                        </label>
                        <label className="text-sm space-y-1">
                            <span className="text-charcoal/50">Email</span>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3"
                            />
                        </label>
                        <label className="text-sm space-y-1">
                            <span className="text-charcoal/50">Password</span>
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3"
                            />
                            <span className="text-xs text-charcoal/40">{getPasswordRequirementsText()}</span>
                        </label>
                        <label className="text-sm space-y-1">
                            <span className="text-charcoal/50">Phone (optional)</span>
                            <input
                                value={form.phone}
                                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3"
                            />
                        </label>
                        {form.accountType === 'agent' ? (
                            <label className="text-sm space-y-1">
                                <span className="text-charcoal/50">Company (optional)</span>
                                <input
                                    value={form.company}
                                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                                    className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3"
                                />
                            </label>
                        ) : null}
                        {form.accountType === 'originator' ? (
                            <label className="text-sm space-y-1">
                                <span className="text-charcoal/50">Organisation</span>
                                <select
                                    value={form.organizationId}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, organizationId: e.target.value }))
                                    }
                                    className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3"
                                >
                                    {BOND_ORIGINATORS.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}
                        {form.accountType !== 'user' ? (
                            <label className="flex items-center gap-2 text-sm sm:col-span-2 mt-1">
                                <input
                                    type="checkbox"
                                    checked={form.approve}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, approve: e.target.checked }))
                                    }
                                />
                                Approve immediately (skip pending review)
                            </label>
                        ) : null}
                        <div className="sm:col-span-2 flex gap-2 mt-2">
                            <button
                                type="submit"
                                disabled={creating}
                                className="h-10 px-4 rounded-xl bg-gold text-white text-sm font-semibold disabled:opacity-60"
                            >
                                {creating ? 'Creating…' : 'Create account'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="h-10 px-4 rounded-xl border border-charcoal/[0.12] text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

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
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
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
                                <button
                                    type="button"
                                    disabled={actionLoading === account.id}
                                    onClick={() => void deleteAccount(account)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-charcoal/50 hover:text-red-600 disabled:opacity-50"
                                    title="Delete account"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminShell>
    );
}
