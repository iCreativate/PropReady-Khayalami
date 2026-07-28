'use client';

import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Download,
    Filter,
    LogIn,
    MoreHorizontal,
    Plus,
    RefreshCcw,
    Search,
    Trash2,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { getPasswordRequirementsText } from '@/lib/password';
import { dashboardPathForAccountType } from '@/lib/auth-enterprise/account-profile';

type Account = {
    id: string;
    accountType: 'user' | 'agent' | 'originator';
    fullName: string;
    email: string;
    status: string;
    createdAt: string | null;
    meta?: string;
    plan?: string;
    planStatus?: string;
    trialEndsAt?: string | null;
    planActivatedAt?: string | null;
};

type SortKey = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'email-asc';
type SubscriptionFilter = 'all' | 'trialing' | 'active' | 'unpaid' | 'none';

const PAGE_SIZE = 12;

const TYPE_LABEL: Record<Account['accountType'], string> = {
    user: 'Buyer / Seller',
    agent: 'Agent',
    originator: 'Originator',
};

function initials(name: string, email: string) {
    const source = (name || email || '?').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
}

function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function trialExpired(account: Account) {
    if (!account.trialEndsAt) return false;
    return new Date(account.trialEndsAt).getTime() < Date.now();
}

function statusTone(status: string) {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'active') {
        return 'bg-emerald-50 text-[#16A34A] border-emerald-200';
    }
    if (s === 'pending') {
        return 'bg-amber-50 text-[#F59E0B] border-amber-200';
    }
    if (s === 'rejected' || s === 'suspended') {
        return 'bg-red-50 text-[#DC2626] border-red-200';
    }
    return 'bg-slate-50 text-[#6B7280] border-[#E5E7EB]';
}

function StatusBadge({ label }: { label: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusTone(label)}`}
        >
            {label}
        </span>
    );
}

function PlanBadge({ account }: { account: Account }) {
    if (account.accountType !== 'agent') return null;
    const planStatus = (account.planStatus || 'trialing').toLowerCase();
    const expired = trialExpired(account);
    const label = expired && planStatus === 'trialing' ? 'Expired' : planStatus === 'trialing' ? 'Trial' : planStatus;
    const tone =
        label === 'Expired'
            ? 'bg-red-50 text-[#DC2626] border-red-200'
            : label === 'Trial'
              ? 'bg-amber-50 text-[#F59E0B] border-amber-200'
              : label === 'active'
                ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                : 'bg-slate-50 text-[#6B7280] border-[#E5E7EB]';
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${tone}`}>
            {account.plan || 'free'} · {label}
        </span>
    );
}

function KpiCard({
    label,
    value,
    description,
    icon: Icon,
}: {
    label: string;
    value: number;
    description: string;
    icon: typeof Users;
}) {
    return (
        <div className="group rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                        {label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] tabular-nums">
                        {value}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E52323]/[0.08] text-[#E52323] transition group-hover:bg-[#E52323] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 animate-pulse">
            <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-3">
                    <div className="h-4 w-1/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                    <div className="h-3 w-2/5 rounded bg-slate-100" />
                </div>
            </div>
        </div>
    );
}

function OverflowMenu({
    account,
    busy,
    onApprove,
    onReject,
    onActivatePlan,
    onMarkUnpaid,
    onDelete,
}: {
    account: Account;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
    onActivatePlan: () => void;
    onMarkUnpaid: () => void;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const menuId = useId();

    useEffect(() => {
        if (!open) return;
        const onPointer = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                disabled={busy}
                onClick={() => setOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] text-[#6B7280] transition hover:bg-[#F8FAFC] hover:text-[#111827] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
            >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More actions for {account.fullName || account.email}</span>
            </button>
            {open ? (
                <div
                    id={menuId}
                    role="menu"
                    className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-[0_16px_40px_rgba(17,24,39,0.12)]"
                >
                    {account.accountType !== 'user' ? (
                        <>
                            <MenuItem
                                onClick={() => {
                                    setOpen(false);
                                    onApprove();
                                }}
                            >
                                Approve account
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    setOpen(false);
                                    onReject();
                                }}
                            >
                                Reject account
                            </MenuItem>
                        </>
                    ) : null}
                    {account.accountType === 'agent' ? (
                        <>
                            <MenuItem
                                onClick={() => {
                                    setOpen(false);
                                    onActivatePlan();
                                }}
                            >
                                Activate plan
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    setOpen(false);
                                    onMarkUnpaid();
                                }}
                            >
                                Mark unpaid
                            </MenuItem>
                        </>
                    ) : null}
                    <div className="my-1 border-t border-[#E5E7EB]" />
                    <MenuItem
                        danger
                        onClick={() => {
                            setOpen(false);
                            onDelete();
                        }}
                    >
                        Delete account
                    </MenuItem>
                </div>
            ) : null}
        </div>
    );
}

function MenuItem({
    children,
    onClick,
    danger = false,
}: {
    children: ReactNode;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className={`flex w-full px-3 py-2.5 text-left text-sm transition hover:bg-[#F8FAFC] ${
                danger ? 'text-[#DC2626]' : 'text-[#111827]'
            }`}
        >
            {children}
        </button>
    );
}

export default function AdminAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [type, setType] = useState('all');
    const [status, setStatus] = useState('all');
    const [q, setQ] = useState('');
    const [qDraft, setQDraft] = useState('');
    const [subscription, setSubscription] = useState<SubscriptionFilter>('all');
    const [sort, setSort] = useState<SortKey>('newest');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [drawerAccount, setDrawerAccount] = useState<Account | null>(null);
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

    useEffect(() => {
        const t = window.setTimeout(() => setQ(qDraft.trim()), 300);
        return () => window.clearTimeout(t);
    }, [qDraft]);

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
            setSelectedIds(new Set());
            setPage(1);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [type, status, q]);

    useEffect(() => {
        void load();
    }, [load]);

    const kpis = useMemo(() => {
        const total = accounts.length;
        const active = accounts.filter((a) =>
            ['approved', 'active'].includes(a.status.toLowerCase())
        ).length;
        const pending = accounts.filter((a) => a.status.toLowerCase() === 'pending').length;
        const trial = accounts.filter(
            (a) =>
                a.accountType === 'agent' &&
                (a.planStatus || 'trialing').toLowerCase() === 'trialing' &&
                !trialExpired(a)
        ).length;
        return { total, active, pending, trial };
    }, [accounts]);

    const filtered = useMemo(() => {
        let list = [...accounts];

        if (subscription !== 'all') {
            list = list.filter((a) => {
                if (subscription === 'none') return a.accountType !== 'agent';
                if (a.accountType !== 'agent') return false;
                const planStatus = (a.planStatus || 'trialing').toLowerCase();
                if (subscription === 'trialing') {
                    return planStatus === 'trialing' && !trialExpired(a);
                }
                if (subscription === 'active') return planStatus === 'active';
                if (subscription === 'unpaid') {
                    return planStatus === 'unpaid' || (planStatus === 'trialing' && trialExpired(a));
                }
                return true;
            });
        }

        list.sort((a, b) => {
            if (sort === 'newest') {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            }
            if (sort === 'oldest') {
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            }
            if (sort === 'name-asc') {
                return (a.fullName || a.email).localeCompare(b.fullName || b.email);
            }
            if (sort === 'name-desc') {
                return (b.fullName || b.email).localeCompare(a.fullName || a.email);
            }
            return a.email.localeCompare(b.email);
        });

        return list;
    }, [accounts, subscription, sort]);

    useEffect(() => {
        setPage(1);
    }, [subscription, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const pageEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    function accountKey(account: Account) {
        return `${account.accountType}:${account.id}`;
    }

    function resetFilters() {
        setType('all');
        setStatus('all');
        setSubscription('all');
        setSort('newest');
        setQDraft('');
        setQ('');
        setPage(1);
    }

    function exportCsv() {
        const rows = [
            ['Type', 'Name', 'Email', 'Company', 'Status', 'Plan', 'Plan Status', 'Trial Ends', 'Created'],
            ...filtered.map((a) => [
                a.accountType,
                a.fullName,
                a.email,
                a.meta || '',
                a.status,
                a.plan || '',
                a.planStatus || '',
                a.trialEndsAt || '',
                a.createdAt || '',
            ]),
        ];
        const csv = rows
            .map((row) =>
                row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            )
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `propready-accounts-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

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
            if (drawerAccount && drawerAccount.id === account.id) setDrawerAccount(null);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setActionLoading(null);
        }
    }

    async function accessAccount(account: Account) {
        const ok = window.confirm(
            `Open ${account.fullName || account.email}'s portal as PropReady staff?\n\nYou will see their real account. Use “Exit to admin” when done.`
        );
        if (!ok) return;
        setActionLoading(account.id);
        setError('');
        try {
            const res = await fetch('/api/admin/accounts/impersonate', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: account.id,
                    accountType: account.accountType,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `Access failed (${res.status})`);
            window.location.href =
                data.redirectTo || dashboardPathForAccountType(account.accountType);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Access failed');
            setActionLoading(null);
        }
    }

    async function setPlanActivation(account: Account, active: boolean) {
        if (account.accountType !== 'agent') return;
        setActionLoading(account.id);
        setError('');
        try {
            const res = await fetch('/api/admin/accounts', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: active ? 'activate-plan' : 'deactivate-plan',
                    id: account.id,
                    accountType: 'agent',
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `Plan update failed (${res.status})`);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Plan update failed');
        } finally {
            setActionLoading(null);
        }
    }

    async function runBulk(action: 'approve' | 'reject' | 'delete') {
        const selected = filtered.filter((a) => selectedIds.has(accountKey(a)));
        if (selected.length === 0) return;
        if (action === 'delete') {
            const ok = window.confirm(
                `Delete ${selected.length} selected account(s)? This cannot be undone.`
            );
            if (!ok) return;
        }
        setError('');
        setActionLoading('bulk');
        try {
            for (const account of selected) {
                if (action === 'approve' || action === 'reject') {
                    if (account.accountType === 'user') continue;
                    const res = await fetch('/api/admin/accounts', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: action === 'approve' ? 'approve' : 'reject',
                            id: account.id,
                            accountType: account.accountType,
                        }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        throw new Error(data.error || `Update failed (${res.status})`);
                    }
                } else {
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
                    if (!res.ok) {
                        throw new Error(data.error || `Delete failed (${res.status})`);
                    }
                }
            }
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Bulk action failed');
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

    const allPageSelected =
        pageItems.length > 0 && pageItems.every((a) => selectedIds.has(accountKey(a)));

    return (
        <AdminShell title="Account Management">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
                            Account Management
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#6B7280]">
                            Manage all accounts from one place.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={exportCsv}
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                        <div className="relative">
                            <details className="group">
                                <summary className="list-none inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 [&::-webkit-details-marker]:hidden">
                                    Bulk Actions
                                    <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5 text-xs text-[#6B7280]">
                                        {selectedIds.size}
                                    </span>
                                </summary>
                                <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-xl">
                                    <MenuItem onClick={() => void runBulk('approve')}>
                                        Approve selected
                                    </MenuItem>
                                    <MenuItem onClick={() => void runBulk('reject')}>
                                        Reject selected
                                    </MenuItem>
                                    <MenuItem danger onClick={() => void runBulk('delete')}>
                                        Delete selected
                                    </MenuItem>
                                </div>
                            </details>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#E52323] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c91d1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/50"
                        >
                            <Plus className="h-4 w-4" />
                            Add account
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Total Accounts"
                        value={kpis.total}
                        description="Across buyers, agents, originators"
                        icon={Users}
                    />
                    <KpiCard
                        label="Active Accounts"
                        value={kpis.active}
                        description="Approved or active status"
                        icon={CheckCircle2}
                    />
                    <KpiCard
                        label="Pending Approvals"
                        value={kpis.pending}
                        description="Awaiting staff review"
                        icon={Clock3}
                    />
                    <KpiCard
                        label="Trial Accounts"
                        value={kpis.trial}
                        description="Agents currently on trial"
                        icon={UserPlus}
                    />
                </div>

                {error ? (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#DC2626]"
                    >
                        {error}
                    </div>
                ) : null}

                {/* Toolbar */}
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                            <input
                                value={qDraft}
                                onChange={(e) => setQDraft(e.target.value)}
                                placeholder="Search name or email…"
                                aria-label="Search accounts"
                                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] pl-10 pr-3 text-sm text-[#111827] placeholder:text-[#6B7280] focus:border-[#E52323]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E52323]/20"
                            />
                        </div>
                        <button
                            type="button"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827] lg:hidden"
                            onClick={() => setFiltersOpen((v) => !v)}
                            aria-expanded={filtersOpen}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                        <div
                            className={`${
                                filtersOpen ? 'grid' : 'hidden'
                            } grid-cols-1 gap-2 sm:grid-cols-2 lg:!flex lg:items-center lg:gap-2`}
                        >
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                aria-label="Account type"
                                className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm"
                            >
                                <option value="all">All types</option>
                                <option value="user">Buyers / sellers</option>
                                <option value="agent">Agents</option>
                                <option value="originator">Originators</option>
                            </select>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                aria-label="Status"
                                className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm"
                            >
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <select
                                value={subscription}
                                onChange={(e) =>
                                    setSubscription(e.target.value as SubscriptionFilter)
                                }
                                aria-label="Subscription"
                                className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm"
                            >
                                <option value="all">All subscriptions</option>
                                <option value="trialing">Trial</option>
                                <option value="active">Active plan</option>
                                <option value="unpaid">Unpaid / expired</option>
                                <option value="none">No subscription</option>
                            </select>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortKey)}
                                aria-label="Sort accounts"
                                className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm"
                            >
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="name-asc">Name A–Z</option>
                                <option value="name-desc">Name Z–A</option>
                                <option value="email-asc">Email A–Z</option>
                            </select>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-4 text-sm font-medium text-[#6B7280] transition hover:text-[#111827]"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Create modal */}
                {showCreate ? (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-[1px]">
                        <form
                            onSubmit={createAccount}
                            className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl p-6 sm:p-8 space-y-4 max-h-[92vh] overflow-y-auto"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="create-account-title"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3
                                        id="create-account-title"
                                        className="text-xl font-semibold text-[#111827]"
                                    >
                                        Add account
                                    </h3>
                                    <p className="mt-1 text-sm text-[#6B7280]">
                                        Create a buyer, agent, or originator account.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="rounded-xl p-2 text-[#6B7280] hover:bg-[#F8FAFC]"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <label className="text-sm space-y-1.5">
                                    <span className="font-medium text-[#6B7280]">Type</span>
                                    <select
                                        value={form.accountType}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                accountType: e.target.value as Account['accountType'],
                                            }))
                                        }
                                        className="w-full h-11 rounded-xl border border-[#E5E7EB] px-3"
                                    >
                                        <option value="user">Buyer / seller</option>
                                        <option value="agent">Agent</option>
                                        <option value="originator">Originator</option>
                                    </select>
                                </label>
                                <label className="text-sm space-y-1.5">
                                    <span className="font-medium text-[#6B7280]">Full name</span>
                                    <input
                                        required
                                        value={form.fullName}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, fullName: e.target.value }))
                                        }
                                        className="w-full h-11 rounded-xl border border-[#E5E7EB] px-3"
                                    />
                                </label>
                                <label className="text-sm space-y-1.5">
                                    <span className="font-medium text-[#6B7280]">Email</span>
                                    <input
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, email: e.target.value }))
                                        }
                                        className="w-full h-11 rounded-xl border border-[#E5E7EB] px-3"
                                    />
                                </label>
                                <label className="text-sm space-y-1.5">
                                    <span className="font-medium text-[#6B7280]">Password</span>
                                    <input
                                        type="password"
                                        required
                                        value={form.password}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, password: e.target.value }))
                                        }
                                        className="w-full h-11 rounded-xl border border-[#E5E7EB] px-3"
                                    />
                                    <span className="text-xs text-[#6B7280]">
                                        {getPasswordRequirementsText()}
                                    </span>
                                </label>
                                <label className="text-sm space-y-1.5">
                                    <span className="font-medium text-[#6B7280]">
                                        Phone (optional)
                                    </span>
                                    <input
                                        value={form.phone}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, phone: e.target.value }))
                                        }
                                        className="w-full h-11 rounded-xl border border-[#E5E7EB] px-3"
                                    />
                                </label>
                                {form.accountType === 'agent' ? (
                                    <label className="text-sm space-y-1.5">
                                        <span className="font-medium text-[#6B7280]">
                                            Company (optional)
                                        </span>
                                        <input
                                            value={form.company}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, company: e.target.value }))
                                            }
                                            className="w-full h-11 rounded-xl border border-[#E5E7EB] px-3"
                                        />
                                    </label>
                                ) : null}
                                {form.accountType === 'originator' ? (
                                    <label className="text-sm space-y-1.5">
                                        <span className="font-medium text-[#6B7280]">
                                            Organisation
                                        </span>
                                        <select
                                            value={form.organizationId}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    organizationId: e.target.value,
                                                }))
                                            }
                                            className="w-full h-11 rounded-xl border border-[#E5E7EB] px-3"
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
                                    <label className="flex items-center gap-2 text-sm sm:col-span-2 mt-1 text-[#111827]">
                                        <input
                                            type="checkbox"
                                            checked={form.approve}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    approve: e.target.checked,
                                                }))
                                            }
                                            className="rounded border-[#E5E7EB]"
                                        />
                                        Approve immediately (skip pending review)
                                    </label>
                                ) : null}
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="h-11 rounded-xl bg-[#E52323] px-5 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    {creating ? 'Creating…' : 'Create account'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : null}

                {/* List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 px-1">
                        <label className="inline-flex items-center gap-2 text-sm text-[#6B7280]">
                            <input
                                type="checkbox"
                                checked={allPageSelected}
                                onChange={(e) => {
                                    const next = new Set(selectedIds);
                                    if (e.target.checked) {
                                        pageItems.forEach((a) => next.add(accountKey(a)));
                                    } else {
                                        pageItems.forEach((a) => next.delete(accountKey(a)));
                                    }
                                    setSelectedIds(next);
                                }}
                                className="rounded border-[#E5E7EB]"
                            />
                            Select page
                        </label>
                        <p className="text-sm text-[#6B7280]">
                            {filtered.length} result{filtered.length === 1 ? '' : 's'}
                        </p>
                    </div>

                    {loading ? (
                        <div className="grid gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-16 text-center">
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E52323]/[0.08] text-[#E52323]">
                                <Users className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-[#111827]">No accounts found</h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
                                Try adjusting your filters, or create a new account to get started.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowCreate(true)}
                                className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-[#E52323] px-5 text-sm font-semibold text-white"
                            >
                                <Plus className="h-4 w-4" />
                                Add account
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {pageItems.map((account) => {
                                const key = accountKey(account);
                                const busy = actionLoading === account.id;
                                const selected = selectedIds.has(key);
                                return (
                                    <article
                                        key={key}
                                        className={`rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(17,24,39,0.08)] ${
                                            selected
                                                ? 'border-[#E52323]/40 ring-2 ring-[#E52323]/15'
                                                : 'border-[#E5E7EB]'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                            <div className="flex min-w-0 flex-1 items-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={(e) => {
                                                        const next = new Set(selectedIds);
                                                        if (e.target.checked) next.add(key);
                                                        else next.delete(key);
                                                        setSelectedIds(next);
                                                    }}
                                                    className="mt-3 rounded border-[#E5E7EB]"
                                                    aria-label={`Select ${account.fullName || account.email}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setDrawerAccount(account)}
                                                    className="flex min-w-0 flex-1 items-start gap-4 text-left"
                                                >
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm font-semibold text-white">
                                                        {initials(account.fullName, account.email)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="truncate text-base font-semibold text-[#111827]">
                                                                {account.fullName || 'Unnamed account'}
                                                            </h3>
                                                            <StatusBadge label={account.status} />
                                                            <PlanBadge account={account} />
                                                        </div>
                                                        <p className="mt-1 truncate text-sm text-[#6B7280]">
                                                            {account.email}
                                                        </p>
                                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B7280]">
                                                            <span className="font-medium text-[#111827]">
                                                                {TYPE_LABEL[account.accountType]}
                                                            </span>
                                                            {account.meta ? (
                                                                <span>Company · {account.meta}</span>
                                                            ) : null}
                                                            {account.trialEndsAt ? (
                                                                <span>
                                                                    Trial ends{' '}
                                                                    {formatDate(account.trialEndsAt)}
                                                                </span>
                                                            ) : null}
                                                            <span>
                                                                Created {formatDate(account.createdAt)}
                                                            </span>
                                                            <span>Last login · Not available</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2 lg:shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => void accessAccount(account)}
                                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#E52323] px-4 text-sm font-semibold text-white transition hover:bg-[#c91d1d] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
                                                >
                                                    <LogIn className="h-4 w-4" />
                                                    Access
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDrawerAccount(account)}
                                                    className="inline-flex h-10 items-center rounded-xl border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC]"
                                                >
                                                    Details
                                                </button>
                                                <OverflowMenu
                                                    account={account}
                                                    busy={busy}
                                                    onApprove={() =>
                                                        void setAccountStatus(account, 'approved')
                                                    }
                                                    onReject={() =>
                                                        void setAccountStatus(account, 'rejected')
                                                    }
                                                    onActivatePlan={() =>
                                                        void setPlanActivation(account, true)
                                                    }
                                                    onMarkUnpaid={() =>
                                                        void setPlanActivation(account, false)
                                                    }
                                                    onDelete={() => void deleteAccount(account)}
                                                />
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!loading && filtered.length > 0 ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
                        <p className="text-sm text-[#6B7280]">
                            Showing {pageStart}–{pageEnd} of {filtered.length} Accounts
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#E5E7EB] px-3 text-sm font-medium disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((n) => {
                                        if (totalPages <= 5) return true;
                                        return (
                                            n === 1 ||
                                            n === totalPages ||
                                            Math.abs(n - currentPage) <= 1
                                        );
                                    })
                                    .map((n, idx, arr) => {
                                        const prev = arr[idx - 1];
                                        const showEllipsis = prev && n - prev > 1;
                                        return (
                                            <span key={n} className="contents">
                                                {showEllipsis ? (
                                                    <span className="px-1 text-[#6B7280]">…</span>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => setPage(n)}
                                                    aria-current={n === currentPage ? 'page' : undefined}
                                                    className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition ${
                                                        n === currentPage
                                                            ? 'bg-[#E52323] text-white'
                                                            : 'border border-[#E5E7EB] text-[#111827] hover:bg-[#F8FAFC]'
                                                    }`}
                                                >
                                                    {n}
                                                </button>
                                            </span>
                                        );
                                    })}
                            </div>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#E5E7EB] px-3 text-sm font-medium disabled:opacity-40"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Details drawer */}
            {drawerAccount ? (
                <div className="fixed inset-0 z-[70]">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
                        aria-label="Close account details"
                        onClick={() => setDrawerAccount(null)}
                    />
                    <aside
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="account-drawer-title"
                        className="absolute right-0 top-0 bottom-0 flex w-full max-w-md flex-col border-l border-[#E5E7EB] bg-white shadow-2xl transition"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-6 py-5">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                                    Account details
                                </p>
                                <h3
                                    id="account-drawer-title"
                                    className="mt-1 truncate text-xl font-semibold text-[#111827]"
                                >
                                    {drawerAccount.fullName || 'Unnamed account'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDrawerAccount(null)}
                                className="rounded-xl p-2 text-[#6B7280] hover:bg-[#F8FAFC]"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111827] text-base font-semibold text-white">
                                    {initials(drawerAccount.fullName, drawerAccount.email)}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm text-[#6B7280]">
                                        {drawerAccount.email}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <StatusBadge label={drawerAccount.status} />
                                        <PlanBadge account={drawerAccount} />
                                    </div>
                                </div>
                            </div>

                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold text-[#111827]">Profile</h4>
                                <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm">
                                    <div>
                                        <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
                                            Account type
                                        </dt>
                                        <dd className="mt-1 font-medium">
                                            {TYPE_LABEL[drawerAccount.accountType]}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
                                            Company / org
                                        </dt>
                                        <dd className="mt-1 font-medium">
                                            {drawerAccount.meta || '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
                                            Created
                                        </dt>
                                        <dd className="mt-1 font-medium">
                                            {formatDate(drawerAccount.createdAt)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
                                            Last login
                                        </dt>
                                        <dd className="mt-1 font-medium">Not available</dd>
                                    </div>
                                </dl>
                            </section>

                            {drawerAccount.accountType === 'agent' ? (
                                <section className="space-y-3">
                                    <h4 className="text-sm font-semibold text-[#111827]">
                                        Subscription
                                    </h4>
                                    <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm">
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
                                                Plan
                                            </dt>
                                            <dd className="mt-1 font-medium capitalize">
                                                {drawerAccount.plan || 'free'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
                                                Plan status
                                            </dt>
                                            <dd className="mt-1 font-medium capitalize">
                                                {drawerAccount.planStatus || 'trialing'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
                                                Trial ends
                                            </dt>
                                            <dd className="mt-1 font-medium">
                                                {formatDate(drawerAccount.trialEndsAt)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">
                                                Activated
                                            </dt>
                                            <dd className="mt-1 font-medium">
                                                {formatDate(drawerAccount.planActivatedAt)}
                                            </dd>
                                        </div>
                                    </dl>
                                </section>
                            ) : null}
                        </div>
                        <div className="border-t border-[#E5E7EB] p-4 space-y-2">
                            <button
                                type="button"
                                disabled={actionLoading === drawerAccount.id}
                                onClick={() => void accessAccount(drawerAccount)}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#E52323] text-sm font-semibold text-white disabled:opacity-50"
                            >
                                <LogIn className="h-4 w-4" />
                                Access account
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading === drawerAccount.id}
                                onClick={() => void deleteAccount(drawerAccount)}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-semibold text-[#DC2626] hover:bg-red-50 disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete account
                            </button>
                        </div>
                    </aside>
                </div>
            ) : null}
        </AdminShell>
    );
}
