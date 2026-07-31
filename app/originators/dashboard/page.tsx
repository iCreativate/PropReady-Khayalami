'use client';

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ComponentType,
    type ReactNode,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowUpRight,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    Filter,
    FolderOpen,
    HelpCircle,
    Inbox,
    RefreshCw,
    Search,
    User,
    X,
} from 'lucide-react';
import OriginatorPortalLayout from '@/components/OriginatorPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { bondOriginatorLabel } from '@/lib/bond-originators';
import { PREQUAL_STATUS_LABELS, type PrequalCaseStatus } from '@/lib/prequal-cases';

type CaseSummary = {
    id: string;
    buyerName: string | null;
    buyerEmail: string | null;
    status: PrequalCaseStatus;
    softAmount: number | null;
    officialAmount: number | null;
    assignedOriginatorId: string | null;
    submittedAt: string;
    updatedAt: string;
};

type OriginatorUser = {
    id: string;
    fullName: string;
    email: string;
    organizationId?: string;
};

type SortKey = 'updated-desc' | 'updated-asc' | 'name-asc' | 'status';

const STATUS_PROGRESS: Record<PrequalCaseStatus, number> = {
    submitted: 20,
    in_review: 45,
    awaiting_documents: 60,
    result_ready: 90,
    closed: 100,
};

function isToday(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
}

function formatRelative(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function formatMoney(n: number | null) {
    if (n == null) return null;
    return `R${Number(n).toLocaleString('en-ZA')}`;
}

function initials(name: string, email: string) {
    const source = (name || email || '?').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
}

function statusTone(status: PrequalCaseStatus) {
    if (status === 'result_ready' || status === 'closed') {
        return 'bg-emerald-50 text-[#16A34A] border-emerald-200';
    }
    if (status === 'awaiting_documents') {
        return 'bg-amber-50 text-[#F59E0B] border-amber-200';
    }
    if (status === 'in_review') {
        return 'bg-blue-50 text-[#2563EB] border-blue-200';
    }
    return 'bg-slate-50 text-[#6B7280] border-[#E5E7EB]';
}

function PageHeader({
    title,
    subtitle,
}: {
    title: string;
    subtitle: string;
}) {
    return (
        <PortalPageHeader
            size="compact"
            eyebrow="Bond originator workspace"
            title={title}
            description={subtitle}
        />
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
    icon: ComponentType<{ className?: string }>;
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

function SearchInput({
    value,
    onChange,
    onClear,
}: {
    value: string;
    onChange: (v: string) => void;
    onClear: () => void;
}) {
    return (
        <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search cases…"
                aria-label="Search cases"
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white pl-10 pr-10 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition hover:border-[#D1D5DB] focus:border-[#E52323]/50 focus:outline-none focus:ring-2 focus:ring-[#E52323]/20"
            />
            {value ? (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F8FAFC] hover:text-[#111827]"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            ) : null}
        </div>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    children,
    minWidth = 'min-w-[220px]',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    children: ReactNode;
    minWidth?: string;
}) {
    return (
        <label className={`block ${minWidth}`}>
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={label}
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] transition hover:border-[#D1D5DB] focus:border-[#E52323]/50 focus:outline-none focus:ring-2 focus:ring-[#E52323]/20"
            >
                {children}
            </select>
        </label>
    );
}

function EmptyState({
    onRefresh,
    orgLabel,
}: {
    onRefresh: () => void;
    orgLabel: string;
}) {
    return (
        <div className="mx-auto flex max-h-[360px] max-w-xl flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E52323]/[0.08] text-[#E52323]">
                <Inbox className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-[#111827]">
                No prequalification cases yet
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#6B7280]">
                Buyer submissions and document requests will appear here once a case has been
                created for {orgLabel}.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                    type="button"
                    onClick={onRefresh}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#E52323] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c91d1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
                <a
                    href="https://propready.co.za"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
                >
                    <HelpCircle className="h-4 w-4" />
                    View Help
                </a>
            </div>
        </div>
    );
}

function CaseCard({ c }: { c: CaseSummary }) {
    const name = c.buyerName || c.buyerEmail || 'Buyer';
    const progress = STATUS_PROGRESS[c.status] ?? 0;
    const soft = formatMoney(c.softAmount);
    const official = formatMoney(c.officialAmount);

    return (
        <Link
            href={`/originators/cases/${c.id}`}
            className="group block rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#E52323]/25 hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm font-semibold text-white">
                        {initials(c.buyerName || '', c.buyerEmail || '')}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-[#111827]">
                                {name}
                            </h3>
                            <span
                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusTone(c.status)}`}
                            >
                                {PREQUAL_STATUS_LABELS[c.status]}
                            </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-[#6B7280]">
                            {c.buyerEmail || 'No email on file'}
                            {soft ? ` · Soft ${soft}` : ''}
                            {official ? ` · Official ${official}` : ''}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B7280]">
                            <span className="inline-flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {c.assignedOriginatorId ? 'Assigned' : 'Unassigned'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                Updated {formatRelative(c.updatedAt)}
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-[#6B7280]">
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
                                <div
                                    className="h-full rounded-full bg-[#E52323] transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <span className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 self-stretch rounded-xl bg-[#E52323] px-4 text-sm font-semibold text-white transition group-hover:bg-[#c91d1d] sm:self-center">
                    Open
                    <ChevronRight className="h-4 w-4" />
                </span>
            </div>
        </Link>
    );
}

function SkeletonList() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="h-28 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white"
                />
            ))}
        </div>
    );
}

export default function OriginatorDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<OriginatorUser | null>(null);
    const [cases, setCases] = useState<CaseSummary[]>([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [assignedFilter, setAssignedFilter] = useState('all');
    const [sort, setSort] = useState<SortKey>('updated-desc');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const orgLabel = bondOriginatorLabel(user?.organizationId) || 'Your organisation';

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const bridged = await hydrateSessionFromCookies();
            if (!bridged || bridged.accountType !== 'originator') {
                router.replace('/originators/login');
                return;
            }
            setUser({
                id: bridged.id,
                fullName: bridged.fullName || bridged.email,
                email: bridged.email,
                organizationId: bridged.organizationId || bridged.company,
            });

            const res = await fetch('/api/prequal/cases', {
                credentials: 'include',
                cache: 'no-store',
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Could not load cases');
            }
            setCases(data.cases || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void load();
    }, [load]);

    const kpis = useMemo(() => {
        const open = cases.filter(
            (c) => c.status !== 'closed' && c.status !== 'result_ready'
        ).length;
        const awaitingBuyer = cases.filter((c) => c.status === 'awaiting_documents').length;
        const docsReceived = cases.filter(
            (c) => c.status === 'submitted' || c.status === 'in_review'
        ).length;
        const completedToday = cases.filter(
            (c) =>
                (c.status === 'result_ready' || c.status === 'closed') && isToday(c.updatedAt)
        ).length;

        const closed = cases.filter(
            (c) => c.status === 'result_ready' || c.status === 'closed'
        );
        let avgHours: string = '—';
        if (closed.length > 0) {
            const hours = closed
                .map((c) => {
                    const a = new Date(c.submittedAt).getTime();
                    const b = new Date(c.updatedAt).getTime();
                    if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return null;
                    return (b - a) / (1000 * 60 * 60);
                })
                .filter((n): n is number => n != null);
            if (hours.length) {
                const avg = hours.reduce((s, n) => s + n, 0) / hours.length;
                avgHours = avg < 24 ? `${avg.toFixed(1)}h` : `${(avg / 24).toFixed(1)}d`;
            }
        }

        return { open, awaitingBuyer, docsReceived, completedToday, avgHours };
    }, [cases]);

    const filtered = useMemo(() => {
        let list = [...cases];
        if (statusFilter !== 'all') {
            list = list.filter((c) => c.status === statusFilter);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((c) =>
                [c.buyerName, c.buyerEmail, c.id, PREQUAL_STATUS_LABELS[c.status]]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(q)
            );
        }
        if (assignedFilter === 'assigned') {
            list = list.filter((c) => Boolean(c.assignedOriginatorId));
        } else if (assignedFilter === 'unassigned') {
            list = list.filter((c) => !c.assignedOriginatorId);
        } else if (assignedFilter === 'me' && user?.id) {
            list = list.filter((c) => c.assignedOriginatorId === user.id);
        }

        list.sort((a, b) => {
            if (sort === 'name-asc') {
                return (a.buyerName || a.buyerEmail || '').localeCompare(
                    b.buyerName || b.buyerEmail || ''
                );
            }
            if (sort === 'status') {
                return PREQUAL_STATUS_LABELS[a.status].localeCompare(
                    PREQUAL_STATUS_LABELS[b.status]
                );
            }
            const at = new Date(a.updatedAt).getTime();
            const bt = new Date(b.updatedAt).getTime();
            return sort === 'updated-asc' ? at - bt : bt - at;
        });
        return list;
    }, [cases, statusFilter, search, assignedFilter, sort, user?.id]);

    function resetFilters() {
        setSearch('');
        setStatusFilter('all');
        setAssignedFilter('all');
        setSort('updated-desc');
    }

    const filterControls = (
        <>
            <SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} />
            <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
            >
                <option value="all">All statuses</option>
                {(Object.keys(PREQUAL_STATUS_LABELS) as PrequalCaseStatus[]).map((s) => (
                    <option key={s} value={s}>
                        {PREQUAL_STATUS_LABELS[s]}
                    </option>
                ))}
            </FilterSelect>
            <FilterSelect label="Agency" value="mine" onChange={() => undefined} minWidth="min-w-[180px]">
                <option value="mine">{orgLabel}</option>
            </FilterSelect>
            <FilterSelect
                label="Assigned to"
                value={assignedFilter}
                onChange={setAssignedFilter}
                minWidth="min-w-[180px]"
            >
                <option value="all">Anyone</option>
                <option value="me">Assigned to me</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
            </FilterSelect>
            <FilterSelect
                label="Sort"
                value={sort}
                onChange={(v) => setSort(v as SortKey)}
                minWidth="min-w-[160px]"
            >
                <option value="updated-desc">Newest updated</option>
                <option value="updated-asc">Oldest updated</option>
                <option value="name-asc">Buyer name</option>
                <option value="status">Status</option>
            </FilterSelect>
            <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
            >
                Reset Filters
            </button>
            <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 disabled:opacity-50"
            >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </button>
        </>
    );

    return (
        <OriginatorPortalLayout
            activePage="dashboard"
            user={user}
            title="Prequal inbox"
            pageHeader={
                <PageHeader
                    title="Buyer Prequalification Cases"
                    subtitle="Respond to buyers, request supporting documents, upload results, and track case progress."
                />
            }
        >
            <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <KpiCard
                        label="Open Cases"
                        value={kpis.open}
                        description="Active cases in progress"
                        icon={FolderOpen}
                    />
                    <KpiCard
                        label="Awaiting Buyer"
                        value={kpis.awaitingBuyer}
                        description="Documents requested"
                        icon={User}
                    />
                    <KpiCard
                        label="Documents Received"
                        value={kpis.docsReceived}
                        description="Ready for review"
                        icon={FileText}
                    />
                    <KpiCard
                        label="Completed Today"
                        value={kpis.completedToday}
                        description="Results closed today"
                        icon={CheckCircle2}
                    />
                    <KpiCard
                        label="Avg Response Time"
                        value={kpis.avgHours}
                        description="Submit → decision"
                        icon={Clock3}
                    />
                </div>

                {/* Desktop / tablet toolbar */}
                <div className="hidden sm:flex flex-wrap items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                    {filterControls}
                </div>

                {/* Mobile filter toggle */}
                <div className="sm:hidden space-y-2">
                    <div className="flex gap-2">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            onClear={() => setSearch('')}
                        />
                        <button
                            type="button"
                            onClick={() => setFiltersOpen(true)}
                            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827]"
                            aria-label="Open filters"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                    </div>
                </div>

                {filtersOpen ? (
                    <div className="fixed inset-0 z-50 sm:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/40"
                            aria-label="Close filters"
                            onClick={() => setFiltersOpen(false)}
                        />
                        <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-[#E5E7EB] bg-white p-4 shadow-2xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-[#111827]">Filters</h3>
                                <button
                                    type="button"
                                    onClick={() => setFiltersOpen(false)}
                                    className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F8FAFC]"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">{filterControls}</div>
                            <button
                                type="button"
                                onClick={() => setFiltersOpen(false)}
                                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E52323] text-sm font-semibold text-white"
                            >
                                Apply filters
                            </button>
                        </div>
                    </div>
                ) : null}

                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                        {!error.includes('migration') ? (
                            <p className="mt-1 text-red-600/80">
                                If tables are missing, run{' '}
                                <code className="text-xs">
                                    supabase/migrations/20260719_originator_portal.sql
                                </code>
                            </p>
                        ) : null}
                    </div>
                ) : null}

                <div className="flex items-center justify-between gap-3 px-0.5">
                    <p className="text-sm text-[#6B7280]">
                        <span className="font-semibold text-[#111827]">{filtered.length}</span>{' '}
                        case{filtered.length === 1 ? '' : 's'}
                        {filtered.length !== cases.length ? ` of ${cases.length}` : ''}
                    </p>
                    <Link
                        href="/originators/messages"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#E52323] hover:underline"
                    >
                        Messages
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {loading && cases.length === 0 ? (
                    <SkeletonList />
                ) : filtered.length === 0 ? (
                    <EmptyState onRefresh={() => void load()} orgLabel={orgLabel} />
                ) : (
                    <div className="space-y-3">
                        {filtered.map((c) => (
                            <CaseCard key={c.id} c={c} />
                        ))}
                    </div>
                )}
            </div>
        </OriginatorPortalLayout>
    );
}
