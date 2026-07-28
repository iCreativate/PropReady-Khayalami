'use client';

import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useState,
} from 'react';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Clock3,
    Filter,
    RefreshCw,
    Search,
    UserCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

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

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type ConfirmAction = 'reject' | null;

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

function normalizedStatus(status: string) {
    const s = (status || 'pending').toLowerCase();
    if (s === 'approved') return 'approved';
    if (s === 'rejected') return 'rejected';
    return 'pending';
}

function statusLabel(status: string) {
    const s = normalizedStatus(status);
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    return 'Pending';
}

function statusTone(status: string) {
    const s = normalizedStatus(status);
    if (s === 'approved') return 'bg-emerald-50 text-[#16A34A] border-emerald-200';
    if (s === 'rejected') return 'bg-red-50 text-[#DC2626] border-red-200';
    return 'bg-amber-50 text-[#F59E0B] border-amber-200';
}

function StatusPill({ status }: { status: string }) {
    const label = statusLabel(status);
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusTone(status)}`}
        >
            {label}
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
    value: string | number;
    description: string;
    icon: typeof Clock3;
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
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 animate-pulse">
            <div className="flex gap-3">
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

function DetailSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
                <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/2 rounded bg-slate-100" />
                        <div className="h-3 w-1/3 rounded bg-slate-100" />
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-14 rounded-xl bg-slate-100" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function AdminOriginatorsPage() {
    const [allApplications, setAllApplications] = useState<OriginatorApplication[]>([]);
    const [selected, setSelected] = useState<OriginatorApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchDraft, setSearchDraft] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
    const [error, setError] = useState('');
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const confirmTitleId = useId();

    useEffect(() => {
        const t = window.setTimeout(() => setSearch(searchDraft.trim()), 300);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    const loadApplications = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ status: 'all' });
            const res = await fetch(`/api/admin/originators?${params}`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load');
            }
            const apps: OriginatorApplication[] = data.applications || [];
            setAllApplications(apps);
            setSelected((prev) => {
                if (!prev) return null;
                return apps.find((a) => a.id === prev.id) || null;
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadApplications();
    }, [loadApplications]);

    const kpis = useMemo(() => {
        const pending = allApplications.filter(
            (a) => normalizedStatus(a.status) === 'pending'
        ).length;
        const approved = allApplications.filter(
            (a) => normalizedStatus(a.status) === 'approved'
        ).length;
        const rejected = allApplications.filter(
            (a) => normalizedStatus(a.status) === 'rejected'
        ).length;
        return {
            pending,
            approved,
            rejected,
            total: allApplications.length,
        };
    }, [allApplications]);

    const filtered = useMemo(() => {
        let list = [...allApplications];
        const q = search.toLowerCase();

        if (q) {
            list = list.filter(
                (a) =>
                    a.fullName?.toLowerCase().includes(q) ||
                    a.email?.toLowerCase().includes(q) ||
                    a.organizationName?.toLowerCase().includes(q) ||
                    String(a.staffNumber || '').toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'all') {
            list = list.filter((a) => normalizedStatus(a.status) === statusFilter);
        }

        list.sort(
            (a, b) =>
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        return list;
    }, [allApplications, search, statusFilter]);

    function resetFilters() {
        setSearchDraft('');
        setSearch('');
        setStatusFilter('pending');
    }

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
                alert(`Approved.${mailNote}`);
            }
            setSelected(null);
            setConfirmAction(null);
            await loadApplications();
        } catch {
            setError('Action failed');
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <AdminShell title="Originator Approvals">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
                            Originator Approvals
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#6B7280]">
                            Review staff registrations, assign access, and keep organisation teams
                            clean before they enter the originator portal.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadApplications()}
                        disabled={loading}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Pending"
                        value={kpis.pending}
                        description="Awaiting staff review"
                        icon={Clock3}
                    />
                    <KpiCard
                        label="Approved"
                        value={kpis.approved}
                        description="Active originator staff"
                        icon={CheckCircle2}
                    />
                    <KpiCard
                        label="Rejected"
                        value={kpis.rejected}
                        description="Applications declined"
                        icon={XCircle}
                    />
                    <KpiCard
                        label="Total"
                        value={kpis.total}
                        description="All staff applications"
                        icon={Users}
                    />
                </div>

                {error ? (
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#DC2626]"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {error}
                    </div>
                ) : null}

                {/* Toolbar */}
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                            <input
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e.target.value)}
                                placeholder="Search name, email, staff number…"
                                aria-label="Search applications"
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
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value as StatusFilter)
                                }
                                aria-label="Status filter"
                                className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm"
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="all">All</option>
                            </select>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-4 text-sm font-medium text-[#6B7280] transition hover:text-[#111827]"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main split layout */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    {/* Left — application list */}
                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-center justify-end gap-3 px-1">
                            <p className="text-sm text-[#6B7280]">
                                {filtered.length} result{filtered.length === 1 ? '' : 's'}
                            </p>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-16 text-center">
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E52323]/[0.08] text-[#E52323]">
                                    <UserCheck className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-[#111827]">
                                    No applications found
                                </h3>
                                <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
                                    Try adjusting your filters or refresh to load the latest
                                    registrations.
                                </p>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827] hover:bg-[#F8FAFC]"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="max-h-[calc(100vh-22rem)] space-y-3 overflow-y-auto pr-1">
                                {filtered.map((app) => {
                                    const isSelected = selected?.id === app.id;
                                    return (
                                        <article
                                            key={app.id}
                                            className={`rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(17,24,39,0.08)] ${
                                                isSelected
                                                    ? 'border-[#E52323]/40 ring-2 ring-[#E52323]/15'
                                                    : 'border-[#E5E7EB]'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setSelected(app)}
                                                className="flex w-full items-start gap-3 text-left"
                                            >
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm font-semibold text-white">
                                                    {initials(app.fullName, app.email)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="truncate text-base font-semibold text-[#111827]">
                                                            {app.fullName || 'Unnamed applicant'}
                                                        </h3>
                                                        <StatusPill status={app.status} />
                                                    </div>
                                                    <p className="mt-1 truncate text-sm text-[#6B7280]">
                                                        {app.organizationName || 'No organisation listed'}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6B7280]">
                                                        <span className="font-mono text-[#111827]">
                                                            {app.staffNumber || 'No staff number'}
                                                        </span>
                                                        <span>
                                                            Submitted {formatDate(app.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right — compact detail panel */}
                    <div className="w-full lg:sticky lg:top-24 lg:w-[28rem] xl:w-[32rem] shrink-0">
                        {loading && !selected ? (
                            <DetailSkeleton />
                        ) : selected ? (
                            <div className="flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                                {/* Applicant summary */}
                                <div className="shrink-0 border-b border-[#E5E7EB] px-4 py-3.5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm font-semibold text-white">
                                            {initials(selected.fullName, selected.email)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="truncate text-lg font-semibold text-[#111827]">
                                                    {selected.fullName}
                                                </h2>
                                                <StatusPill status={selected.status} />
                                            </div>
                                            <p className="mt-0.5 truncate text-sm text-[#6B7280]">
                                                {selected.organizationName || 'No organisation listed'}
                                            </p>
                                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#6B7280]">
                                                <span className="font-mono text-[#111827]">
                                                    {selected.staffNumber ||
                                                        (normalizedStatus(selected.status) === 'pending'
                                                            ? 'Assigned on approval'
                                                            : '—')}
                                                </span>
                                                <span>
                                                    Submitted {formatDate(selected.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info grid */}
                                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                Email
                                            </p>
                                            <p className="mt-1 break-all text-[#111827]">
                                                {selected.email || '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                Phone
                                            </p>
                                            <p className="mt-1 text-[#111827]">
                                                {selected.phone || '—'}
                                            </p>
                                        </div>
                                        <div className="col-span-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                Organisation
                                            </p>
                                            <p className="mt-1 text-[#111827]">
                                                {selected.organizationName || '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                Staff number
                                            </p>
                                            <p className="mt-1 font-mono text-[#111827]">
                                                {selected.staffNumber ||
                                                    (normalizedStatus(selected.status) === 'pending'
                                                        ? 'Assigned automatically on approval'
                                                        : '—')}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                Status
                                            </p>
                                            <p className="mt-1 capitalize text-[#111827]">
                                                {selected.status || 'pending'}
                                            </p>
                                        </div>
                                        <div className="col-span-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                Submitted
                                            </p>
                                            <p className="mt-1 text-[#111827]">
                                                {formatDate(selected.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky decision bar */}
                                <div className="shrink-0 border-t border-[#E5E7EB] bg-white px-4 py-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => void review('approve')}
                                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#16A34A] px-2 text-xs font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-50 sm:text-sm"
                                        >
                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            <span className="truncate">
                                                {normalizedStatus(selected.status) === 'approved'
                                                    ? 'Re-approve'
                                                    : 'Approve'}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => setConfirmAction('reject')}
                                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#DC2626] px-2 text-xs font-semibold text-white transition hover:bg-[#b91c1c] disabled:opacity-50 sm:text-sm"
                                        >
                                            <XCircle className="h-4 w-4 shrink-0" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-16 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E52323]/[0.08] text-[#E52323]">
                                    <Building2 className="h-7 w-7" />
                                </div>
                                <h3 className="text-lg font-semibold text-[#111827]">
                                    Select an application
                                </h3>
                                <p className="mt-2 text-sm text-[#6B7280]">
                                    Choose a staff registration from the list to review details and
                                    make a decision.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation modal */}
            {confirmAction === 'reject' ? (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-[1px]">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={confirmTitleId}
                        className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3
                                    id={confirmTitleId}
                                    className="text-lg font-semibold text-[#111827]"
                                >
                                    Confirm rejection
                                </h3>
                                <p className="mt-1 text-sm text-[#6B7280]">
                                    Reject {selected?.fullName}&apos;s staff registration? They will
                                    not gain originator portal access.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="rounded-xl p-2 text-[#6B7280] hover:bg-[#F8FAFC]"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => void review('reject')}
                                className="h-11 rounded-xl bg-[#DC2626] px-5 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50"
                            >
                                {actionLoading ? 'Processing…' : 'Reject application'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </AdminShell>
    );
}
