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
    AlertCircle,
    Building2,
    CheckCircle2,
    Clock3,
    Download,
    Eye,
    FileText,
    Filter,
    RefreshCw,
    Search,
    ShieldCheck,
    Timer,
    UserCheck,
    X,
    XCircle,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { isAgentPpraVerified } from '@/lib/ppra';

interface Application {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    company: string;
    city: string | null;
    ppraNumber: string;
    ffcNumber: string | null;
    ffcDocumentUrl: string | null;
    verificationStatus: string;
    verificationDate: string | null;
    verifiedBy: string | null;
    verificationNotes: string | null;
    createdAt: string;
    status: string;
}

type SortKey = 'newest' | 'oldest' | 'name';
type StatusFilter = 'all' | 'pending' | 'verified' | 'rejected';
type ConfirmAction = 'approve' | 'reject' | null;

const NOTES_DRAFT_PREFIX = 'ppra-notes-draft:';
const CHECKLIST_ITEMS = [
    { key: 'identity', label: 'Identity', test: (a: Application) => !!a.fullName?.trim() },
    { key: 'agency', label: 'Agency', test: (a: Application) => !!a.company?.trim() },
    { key: 'registration', label: 'Registration', test: (a: Application) => !!a.ppraNumber?.trim() },
    { key: 'phone', label: 'Phone', test: (a: Application) => !!a.phone?.trim() },
    { key: 'email', label: 'Email', test: (a: Application) => !!a.email?.trim() },
    { key: 'documents', label: 'Documents', test: (a: Application) => !!a.ffcDocumentUrl },
] as const;

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

function formatDateTime(value: string | null | undefined) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function isToday(value: string | null | undefined) {
    if (!value) return false;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
}

function normalizedVerificationStatus(app: Application) {
    const s = (app.verificationStatus || '').toLowerCase();
    if (s === 'verified' || isAgentPpraVerified(app)) return 'verified';
    if (s === 'rejected') return 'rejected';
    return 'pending';
}

function displayStatusLabel(app: Application) {
    const vs = normalizedVerificationStatus(app);
    if (vs === 'verified') return 'Approved';
    if (vs === 'rejected') return 'Rejected';
    if (!app.ffcDocumentUrl) return 'Requires Documents';
    if (vs === 'pending' && app.verificationNotes?.trim()) return 'Under Review';
    return 'Pending';
}

function statusTone(label: string) {
    const s = label.toLowerCase();
    if (s === 'approved') return 'bg-emerald-50 text-[#16A34A] border-emerald-200';
    if (s === 'rejected') return 'bg-red-50 text-[#DC2626] border-red-200';
    if (s === 'under review') return 'bg-blue-50 text-[#2563EB] border-blue-200';
    if (s.includes('requires')) return 'bg-orange-50 text-[#EA580C] border-orange-200';
    return 'bg-amber-50 text-[#F59E0B] border-amber-200';
}

function StatusPill({ label }: { label: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusTone(label)}`}
        >
            {label}
        </span>
    );
}

function checklistProgress(app: Application) {
    const completed = CHECKLIST_ITEMS.filter((item) => item.test(app)).length;
    return { completed, total: CHECKLIST_ITEMS.length };
}

function reviewHours(app: Application) {
    if (!app.createdAt || !app.verificationDate) return null;
    const start = new Date(app.createdAt).getTime();
    const end = new Date(app.verificationDate).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
    return (end - start) / (1000 * 60 * 60);
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
    icon: typeof ShieldCheck;
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
                    <div className="h-2 w-full rounded bg-slate-100" />
                </div>
            </div>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
                    <div className="h-4 w-1/3 rounded bg-slate-100 mb-4" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-10 rounded bg-slate-100" />
                        <div className="h-10 rounded bg-slate-100" />
                        <div className="h-10 rounded bg-slate-100" />
                        <div className="h-10 rounded bg-slate-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function MenuItem({
    children,
    onClick,
    danger = false,
    disabled = false,
}: {
    children: ReactNode;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={onClick}
            className={`flex w-full px-3 py-2.5 text-left text-sm transition hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed ${
                danger ? 'text-[#DC2626]' : 'text-[#111827]'
            }`}
        >
            {children}
        </button>
    );
}

export default function AdminPpraPage() {
    const [allApplications, setAllApplications] = useState<Application[]>([]);
    const [searchDraft, setSearchDraft] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [agencyFilter, setAgencyFilter] = useState('');
    const [sort, setSort] = useState<SortKey>('newest');
    const [selected, setSelected] = useState<Application | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [detailTab, setDetailTab] = useState<
        'overview' | 'verification' | 'documents' | 'notes' | 'activity'
    >('overview');
    const bulkMenuRef = useRef<HTMLDetailsElement>(null);
    const notesDraftSaveRef = useRef<number | null>(null);
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
            const res = await fetch(`/api/admin/ppra?${params}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            const apps: Application[] = data.applications || [];
            setAllApplications(apps);
            setSelectedIds(new Set());
            setSelected((prev) => {
                if (!prev) return null;
                return apps.find((a) => a.id === prev.id) || null;
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Load failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadApplications();
    }, [loadApplications]);

    useEffect(() => {
        if (!selected) {
            setNotes('');
            setPreviewUrl(null);
            return;
        }
        try {
            const draft = localStorage.getItem(`${NOTES_DRAFT_PREFIX}${selected.id}`);
            setNotes(draft ?? selected.verificationNotes ?? '');
        } catch {
            setNotes(selected.verificationNotes || '');
        }
        setPreviewUrl(null);
        setRejectionReason('');
        setDetailTab('overview');
    }, [selected?.id]);

    useEffect(() => {
        if (!selected?.id) return;
        if (notesDraftSaveRef.current) window.clearTimeout(notesDraftSaveRef.current);
        notesDraftSaveRef.current = window.setTimeout(() => {
            try {
                localStorage.setItem(`${NOTES_DRAFT_PREFIX}${selected.id}`, notes);
            } catch {
                /* ignore quota errors */
            }
        }, 400);
        return () => {
            if (notesDraftSaveRef.current) window.clearTimeout(notesDraftSaveRef.current);
        };
    }, [notes, selected?.id]);

    const kpis = useMemo(() => {
        const pending = allApplications.filter(
            (a) => normalizedVerificationStatus(a) === 'pending'
        ).length;
        const approvedToday = allApplications.filter(
            (a) =>
                normalizedVerificationStatus(a) === 'verified' && isToday(a.verificationDate)
        ).length;
        const rejected = allApplications.filter(
            (a) => normalizedVerificationStatus(a) === 'rejected'
        ).length;
        const verified = allApplications.filter(
            (a) => normalizedVerificationStatus(a) === 'verified'
        ).length;
        const hours = allApplications
            .map(reviewHours)
            .filter((h): h is number => h != null);
        const avgReviewTime =
            hours.length > 0
                ? `${(hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1)} hrs`
                : '—';
        return { pending, approvedToday, rejected, verified, avgReviewTime };
    }, [allApplications]);

    const filtered = useMemo(() => {
        let list = [...allApplications];
        const q = search.toLowerCase();

        if (q) {
            list = list.filter(
                (a) =>
                    a.fullName?.toLowerCase().includes(q) ||
                    a.company?.toLowerCase().includes(q) ||
                    String(a.ppraNumber || '').includes(q) ||
                    a.email?.toLowerCase().includes(q) ||
                    (a.ffcNumber || '').toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'all') {
            list = list.filter((a) => normalizedVerificationStatus(a) === statusFilter);
        }

        const agency = agencyFilter.trim().toLowerCase();
        if (agency) {
            list = list.filter((a) => a.company?.toLowerCase().includes(agency));
        }

        list.sort((a, b) => {
            if (sort === 'newest') {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            }
            if (sort === 'oldest') {
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            }
            return (a.fullName || a.email).localeCompare(b.fullName || b.email);
        });

        return list;
    }, [allApplications, search, statusFilter, agencyFilter, sort]);

    function resetFilters() {
        setSearchDraft('');
        setSearch('');
        setStatusFilter('all');
        setAgencyFilter('');
        setSort('newest');
    }

    function exportCsv() {
        const rows = [
            [
                'Full Name',
                'Email',
                'Phone',
                'Company',
                'City',
                'PPRA',
                'FFC',
                'Verification Status',
                'Account Status',
                'Verification Date',
                'Verified By',
                'Created',
                'Notes',
            ],
            ...filtered.map((a) => [
                a.fullName,
                a.email,
                a.phone,
                a.company,
                a.city || '',
                a.ppraNumber,
                a.ffcNumber || '',
                a.verificationStatus,
                a.status,
                a.verificationDate || '',
                a.verifiedBy || '',
                a.createdAt,
                a.verificationNotes || '',
            ]),
        ];
        const csv = rows
            .map((row) =>
                row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            )
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `propready-agent-approvals-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    const openPreview = async (app: Application) => {
        if (!app.ffcDocumentUrl) return;
        setPreviewLoading(true);
        setError('');
        try {
            const res = await fetch(
                `/api/agents/ppra/document?path=${encodeURIComponent(app.ffcDocumentUrl)}`,
                { credentials: 'include' }
            );
            const data = await res.json();
            if (data.signedUrl) setPreviewUrl(data.signedUrl);
            else setError(data.error || 'Could not load document');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load document');
        } finally {
            setPreviewLoading(false);
        }
    };

    async function reviewOne(
        app: Application,
        action: 'approve' | 'reject',
        opts?: { rejectionReason?: string; verificationNotes?: string }
    ) {
        const reason = opts?.rejectionReason ?? rejectionReason;
        const verificationNotes = opts?.verificationNotes ?? notes;
        if (action === 'reject' && !reason.trim()) {
            throw new Error('Enter a rejection reason');
        }
        const res = await fetch('/api/admin/ppra/review', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentId: app.id,
                action,
                rejectionReason: reason,
                verificationNotes,
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Action failed (${res.status})`);
    }

    async function executeReview(action: 'approve' | 'reject') {
        if (!selected) return;
        if (action === 'reject' && !rejectionReason.trim()) {
            setError('Enter a rejection reason');
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            await reviewOne(selected, action);
            try {
                localStorage.removeItem(`${NOTES_DRAFT_PREFIX}${selected.id}`);
            } catch {
                /* ignore */
            }
            setSelected(null);
            setNotes('');
            setRejectionReason('');
            setPreviewUrl(null);
            setConfirmAction(null);
            await loadApplications();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Action failed');
        } finally {
            setActionLoading(false);
        }
    }

    async function runBulk(action: 'approve' | 'reject') {
        const targets = filtered.filter((a) => selectedIds.has(a.id));
        if (targets.length === 0) return;

        let bulkRejectionReason = '';
        if (action === 'reject') {
            bulkRejectionReason =
                window.prompt(
                    `Enter a rejection reason for ${targets.length} selected application(s):`
                )?.trim() || '';
            if (!bulkRejectionReason) {
                setError('Rejection reason is required for bulk reject');
                return;
            }
        }

        if (bulkMenuRef.current) bulkMenuRef.current.open = false;
        setActionLoading(true);
        setError('');
        try {
            for (const app of targets) {
                await reviewOne(app, action, {
                    rejectionReason: bulkRejectionReason,
                    verificationNotes: notes,
                });
                try {
                    localStorage.removeItem(`${NOTES_DRAFT_PREFIX}${app.id}`);
                } catch {
                    /* ignore */
                }
            }
            setSelected(null);
            setNotes('');
            setRejectionReason('');
            setPreviewUrl(null);
            await loadApplications();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Bulk action failed');
        } finally {
            setActionLoading(false);
        }
    }

    function appendNotesTemplate(template: string) {
        setNotes((prev) => (prev.trim() ? `${prev.trim()}\n\n${template}` : template));
    }

    const allFilteredSelected =
        filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));

    return (
        <AdminShell title="Agent Approvals">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
                            Agent Approvals
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#6B7280]">
                            Review and verify new agent registrations.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void loadApplications()}
                            disabled={loading}
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={exportCsv}
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                        <details ref={bulkMenuRef} className="group relative">
                            <summary className="list-none inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 [&::-webkit-details-marker]:hidden">
                                Bulk Actions
                                <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5 text-xs text-[#6B7280]">
                                    {selectedIds.size}
                                </span>
                            </summary>
                            <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-[0_16px_40px_rgba(17,24,39,0.12)]">
                                <MenuItem
                                    disabled={actionLoading || selectedIds.size === 0}
                                    onClick={() => void runBulk('approve')}
                                >
                                    Approve selected
                                </MenuItem>
                                <MenuItem
                                    danger
                                    disabled={actionLoading || selectedIds.size === 0}
                                    onClick={() => void runBulk('reject')}
                                >
                                    Reject selected
                                </MenuItem>
                            </div>
                        </details>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <KpiCard
                        label="Pending Reviews"
                        value={kpis.pending}
                        description="Awaiting verification decision"
                        icon={Clock3}
                    />
                    <KpiCard
                        label="Approved Today"
                        value={kpis.approvedToday}
                        description="Verified since midnight"
                        icon={CheckCircle2}
                    />
                    <KpiCard
                        label="Rejected"
                        value={kpis.rejected}
                        description="Applications declined"
                        icon={XCircle}
                    />
                    <KpiCard
                        label="Avg Review Time"
                        value={kpis.avgReviewTime}
                        description="From submission to decision"
                        icon={Timer}
                    />
                    <KpiCard
                        label="Verified Agents"
                        value={kpis.verified}
                        description="Total approved registrations"
                        icon={UserCheck}
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
                                placeholder="Search name, agency, PPRA number…"
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
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                aria-label="Verification status"
                                className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm"
                            >
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="verified">Verified</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <input
                                value={agencyFilter}
                                onChange={(e) => setAgencyFilter(e.target.value)}
                                placeholder="Filter by agency…"
                                aria-label="Agency filter"
                                className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm"
                            />
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortKey)}
                                aria-label="Sort applications"
                                className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm"
                            >
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="name">Name A–Z</option>
                            </select>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-4 text-sm font-medium text-[#6B7280] transition hover:text-[#111827]"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main split layout */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    {/* Left — application list */}
                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-center justify-between gap-3 px-1">
                            <label className="inline-flex items-center gap-2 text-sm text-[#6B7280]">
                                <input
                                    type="checkbox"
                                    checked={allFilteredSelected}
                                    onChange={(e) => {
                                        const next = new Set(selectedIds);
                                        if (e.target.checked) {
                                            filtered.forEach((a) => next.add(a.id));
                                        } else {
                                            filtered.forEach((a) => next.delete(a.id));
                                        }
                                        setSelectedIds(next);
                                    }}
                                    className="rounded border-[#E5E7EB]"
                                />
                                Select all
                            </label>
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
                                    <ShieldCheck className="h-8 w-8" />
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
                                    const progress = checklistProgress(app);
                                    const isSelected = selected?.id === app.id;
                                    const isChecked = selectedIds.has(app.id);
                                    const statusLabel = displayStatusLabel(app);
                                    return (
                                        <article
                                            key={app.id}
                                            className={`rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(17,24,39,0.08)] ${
                                                isSelected
                                                    ? 'border-[#E52323]/40 ring-2 ring-[#E52323]/15'
                                                    : 'border-[#E5E7EB]'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        const next = new Set(selectedIds);
                                                        if (e.target.checked) next.add(app.id);
                                                        else next.delete(app.id);
                                                        setSelectedIds(next);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="mt-3 rounded border-[#E5E7EB]"
                                                    aria-label={`Select ${app.fullName}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setSelected(app)}
                                                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                                                >
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm font-semibold text-white">
                                                        {initials(app.fullName, app.email)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="truncate text-base font-semibold text-[#111827]">
                                                                {app.fullName || 'Unnamed agent'}
                                                            </h3>
                                                            <StatusPill label={statusLabel} />
                                                        </div>
                                                        <p className="mt-1 truncate text-sm text-[#6B7280]">
                                                            {app.company || 'No agency listed'}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6B7280]">
                                                            <span className="font-mono text-[#111827]">
                                                                PPRA {app.ppraNumber || '—'}
                                                            </span>
                                                            <span>
                                                                Submitted {formatDate(app.createdAt)}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3">
                                                            <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                                                                <span>Checklist</span>
                                                                <span>
                                                                    {progress.completed}/
                                                                    {progress.total}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
                                                                <div
                                                                    className="h-full rounded-full bg-[#E52323] transition-all"
                                                                    style={{
                                                                        width: `${(progress.completed / progress.total) * 100}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
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
                                                <StatusPill label={displayStatusLabel(selected)} />
                                            </div>
                                            <p className="mt-0.5 truncate text-sm text-[#6B7280]">
                                                {selected.company || 'No agency listed'}
                                            </p>
                                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#6B7280]">
                                                <span className="font-mono text-[#111827]">
                                                    PPRA {selected.ppraNumber || '—'}
                                                </span>
                                                <span>Submitted {formatDate(selected.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div
                                        role="tablist"
                                        aria-label="Application review sections"
                                        className="mt-3 flex gap-1 overflow-x-auto rounded-xl bg-[#F8FAFC] p-1"
                                    >
                                        {(
                                            [
                                                ['overview', 'Overview'],
                                                ['verification', 'Verification'],
                                                ['documents', 'Documents'],
                                                ['notes', 'Notes'],
                                                ['activity', 'Activity'],
                                            ] as const
                                        ).map(([id, label]) => {
                                            const active = detailTab === id;
                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={active}
                                                    onClick={() => setDetailTab(id)}
                                                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                                        active
                                                            ? 'bg-white text-[#111827] shadow-sm'
                                                            : 'text-[#6B7280] hover:text-[#111827]'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Tab content */}
                                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                                    {detailTab === 'overview' ? (
                                        <div className="space-y-3">
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
                                                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                        City
                                                    </p>
                                                    <p className="mt-1 text-[#111827]">
                                                        {selected.city || '—'}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                        Account
                                                    </p>
                                                    <p className="mt-1 capitalize text-[#111827]">
                                                        {selected.status || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="mb-2 flex items-center justify-between text-[11px] text-[#6B7280]">
                                                    <span className="font-semibold uppercase tracking-wide">
                                                        Checklist
                                                    </span>
                                                    <span>
                                                        {checklistProgress(selected).completed}/
                                                        {checklistProgress(selected).total}
                                                    </span>
                                                </div>
                                                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
                                                    <div
                                                        className="h-full rounded-full bg-[#E52323]"
                                                        style={{
                                                            width: `${(checklistProgress(selected).completed / checklistProgress(selected).total) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <ul className="grid grid-cols-2 gap-1.5">
                                                    {CHECKLIST_ITEMS.map((item) => {
                                                        const done = item.test(selected);
                                                        return (
                                                            <li
                                                                key={item.key}
                                                                className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-xs"
                                                            >
                                                                <span
                                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                                        done
                                                                            ? 'bg-[#16A34A]'
                                                                            : 'bg-[#D1D5DB]'
                                                                    }`}
                                                                />
                                                                <span
                                                                    className={
                                                                        done
                                                                            ? 'font-medium text-[#111827]'
                                                                            : 'text-[#6B7280]'
                                                                    }
                                                                >
                                                                    {item.label}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : null}

                                    {detailTab === 'verification' ? (
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                    PPRA
                                                </p>
                                                <p className="mt-1 font-mono text-[#111827]">
                                                    {selected.ppraNumber || '—'}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                    FFC
                                                </p>
                                                <p className="mt-1 font-mono text-[#111827]">
                                                    {selected.ffcNumber || '—'}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                    Status
                                                </p>
                                                <p className="mt-1 capitalize text-[#111827]">
                                                    {selected.verificationStatus || 'pending'}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                    Verified by
                                                </p>
                                                <p className="mt-1 text-[#111827]">
                                                    {selected.verifiedBy || '—'}
                                                </p>
                                            </div>
                                            <div className="col-span-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                    Verification date
                                                </p>
                                                <p className="mt-1 text-[#111827]">
                                                    {formatDateTime(selected.verificationDate)}
                                                </p>
                                            </div>
                                            <div className="col-span-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                                    Agency
                                                </p>
                                                <p className="mt-1 text-[#111827]">
                                                    {selected.company || '—'}
                                                    {selected.city ? ` · ${selected.city}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ) : null}

                                    {detailTab === 'documents' ? (
                                        selected.ffcDocumentUrl ? (
                                            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#E52323]">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-[#111827]">
                                                            FFC Document
                                                        </p>
                                                        <p className="truncate text-xs text-[#6B7280]">
                                                            {selected.ffcDocumentUrl.split('/').pop()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={previewLoading}
                                                        onClick={() => void openPreview(selected)}
                                                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] transition hover:bg-white disabled:opacity-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        {previewLoading ? 'Loading…' : 'Preview'}
                                                    </button>
                                                    {previewUrl ? (
                                                        <a
                                                            href={previewUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#E52323] px-3 text-sm font-semibold text-white transition hover:bg-[#c91d1d]"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Open
                                                        </a>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="rounded-xl border border-dashed border-[#E5E7EB] px-4 py-8 text-center text-sm text-[#6B7280]">
                                                No FFC document uploaded yet.
                                            </p>
                                        )
                                    ) : null}

                                    {detailTab === 'notes' ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Internal verification notes (optional)"
                                                rows={5}
                                                maxLength={2000}
                                                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#6B7280] focus:border-[#E52323]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E52323]/20"
                                            />
                                            <div className="flex items-center justify-between text-xs text-[#6B7280]">
                                                <span>Draft saved locally</span>
                                                <span>{notes.length}/2000</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        appendNotesTemplate(
                                                            'Please provide additional documentation: '
                                                        )
                                                    }
                                                    className="rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#111827] hover:bg-[#F8FAFC]"
                                                >
                                                    Request info
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        appendNotesTemplate(
                                                            'Application returned for corrections: '
                                                        )
                                                    }
                                                    className="rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#111827] hover:bg-[#F8FAFC]"
                                                >
                                                    Return
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        appendNotesTemplate(
                                                            'Review suspended pending: '
                                                        )
                                                    }
                                                    className="rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#111827] hover:bg-[#F8FAFC]"
                                                >
                                                    Suspend
                                                </button>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-[#6B7280]">
                                                    Rejection reason
                                                </label>
                                                <textarea
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    placeholder="Required when rejecting"
                                                    rows={2}
                                                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#6B7280] focus:border-[#E52323]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E52323]/20"
                                                />
                                            </div>
                                        </div>
                                    ) : null}

                                    {detailTab === 'activity' ? (
                                        <ol className="relative space-y-3 border-l border-[#E5E7EB] pl-4 ml-1.5">
                                            <li className="relative">
                                                <span className="absolute -left-[1.16rem] top-1 h-2 w-2 rounded-full bg-[#E52323]" />
                                                <p className="text-sm font-medium text-[#111827]">
                                                    Application Submitted
                                                </p>
                                                <p className="text-xs text-[#6B7280]">
                                                    {formatDateTime(selected.createdAt)}
                                                </p>
                                            </li>
                                            {selected.ffcDocumentUrl ? (
                                                <li className="relative">
                                                    <span className="absolute -left-[1.16rem] top-1 h-2 w-2 rounded-full bg-[#2563EB]" />
                                                    <p className="text-sm font-medium text-[#111827]">
                                                        Documents Uploaded
                                                    </p>
                                                    <p className="text-xs text-[#6B7280]">
                                                        FFC document on file
                                                    </p>
                                                </li>
                                            ) : null}
                                            {(selected.verificationNotes ||
                                                normalizedVerificationStatus(selected) ===
                                                    'pending') && (
                                                <li className="relative">
                                                    <span className="absolute -left-[1.16rem] top-1 h-2 w-2 rounded-full bg-[#F59E0B]" />
                                                    <p className="text-sm font-medium text-[#111827]">
                                                        Verification Started
                                                    </p>
                                                    <p className="text-xs text-[#6B7280]">
                                                        {selected.verificationNotes
                                                            ? 'Notes added by reviewer'
                                                            : 'Pending staff review'}
                                                    </p>
                                                </li>
                                            )}
                                            {selected.verificationDate ? (
                                                <li className="relative">
                                                    <span className="absolute -left-[1.16rem] top-1 h-2 w-2 rounded-full bg-[#16A34A]" />
                                                    <p className="text-sm font-medium text-[#111827]">
                                                        Decision Made
                                                    </p>
                                                    <p className="text-xs text-[#6B7280]">
                                                        {formatDateTime(selected.verificationDate)}
                                                        {selected.verifiedBy
                                                            ? ` · ${selected.verifiedBy}`
                                                            : ''}
                                                    </p>
                                                </li>
                                            ) : null}
                                        </ol>
                                    ) : null}
                                </div>

                                {/* Sticky decision bar */}
                                <div className="shrink-0 border-t border-[#E5E7EB] bg-white px-4 py-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => setConfirmAction('approve')}
                                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#16A34A] px-2 text-xs font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-50 sm:text-sm"
                                        >
                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            <span className="truncate">
                                                {normalizedVerificationStatus(selected) === 'verified'
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
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDetailTab('notes');
                                                appendNotesTemplate(
                                                    'Please provide additional documentation: '
                                                );
                                            }}
                                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] px-2 text-xs font-medium text-[#111827] transition hover:bg-[#F8FAFC] sm:text-sm"
                                        >
                                            Request info
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
                                    Choose a registration from the list to review details, documents,
                                    and make a decision.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation modal */}
            {confirmAction ? (
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
                                    {confirmAction === 'approve'
                                        ? 'Confirm approval'
                                        : 'Confirm rejection'}
                                </h3>
                                <p className="mt-1 text-sm text-[#6B7280]">
                                    {confirmAction === 'approve'
                                        ? `Approve ${selected?.fullName}'s registration? They will gain verified agent access.`
                                        : `Reject ${selected?.fullName}'s registration? This requires a rejection reason.`}
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
                        {confirmAction === 'reject' && !rejectionReason.trim() ? (
                            <p className="mt-4 text-sm text-[#DC2626]">
                                Add a rejection reason in the Decision section before confirming.
                            </p>
                        ) : null}
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
                                disabled={
                                    actionLoading ||
                                    (confirmAction === 'reject' && !rejectionReason.trim())
                                }
                                onClick={() => void executeReview(confirmAction)}
                                className={`h-11 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-50 ${
                                    confirmAction === 'approve'
                                        ? 'bg-[#16A34A] hover:bg-[#15803d]'
                                        : 'bg-[#DC2626] hover:bg-[#b91c1c]'
                                }`}
                            >
                                {actionLoading
                                    ? 'Processing…'
                                    : confirmAction === 'approve'
                                      ? 'Approve application'
                                      : 'Reject application'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </AdminShell>
    );
}
