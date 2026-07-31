'use client';

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ComponentType,
    type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Clock3,
    CreditCard,
    FileText,
    MessageSquare,
    Minus,
    RefreshCw,
    Scale,
    ShieldCheck,
    TrendingUp,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

const Sparkline = dynamic(
    () => import('@/components/admin/AnalyticsCharts').then((m) => m.Sparkline),
    { ssr: false, loading: () => <div className="h-10 w-full animate-pulse rounded bg-slate-50" /> }
);
const GrowthLineChart = dynamic(
    () => import('@/components/admin/AnalyticsCharts').then((m) => m.GrowthLineChart),
    { ssr: false, loading: () => <ChartSkeleton /> }
);
const RegistrationsBarChart = dynamic(
    () => import('@/components/admin/AnalyticsCharts').then((m) => m.RegistrationsBarChart),
    { ssr: false, loading: () => <ChartSkeleton /> }
);
const MessagesAreaChart = dynamic(
    () => import('@/components/admin/AnalyticsCharts').then((m) => m.MessagesAreaChart),
    { ssr: false, loading: () => <ChartSkeleton /> }
);
const ViewingsBarChart = dynamic(
    () => import('@/components/admin/AnalyticsCharts').then((m) => m.ViewingsBarChart),
    { ssr: false, loading: () => <ChartSkeleton /> }
);
const SubscriptionDonut = dynamic(
    () => import('@/components/admin/AnalyticsCharts').then((m) => m.SubscriptionDonut),
    { ssr: false, loading: () => <ChartSkeleton /> }
);

const CHART_COLORS = ['#E52323', '#111827', '#F59E0B', '#16A34A', '#2563EB', '#6B7280'];

type DayPoint = { date: string; count: number };

type Analytics = {
    users: number;
    agents: number;
    originators: number;
    conveyancers?: number;
    leads: number;
    pendingAgentApprovals: number;
    pendingOriginatorApprovals: number;
    pendingConveyancerApprovals?: number;
    conversations: number;
    prequalCases: number;
    viewings: number;
    activePlans?: number;
    trialingAgents?: number;
    paymentPendingAgents?: number;
};

type SeriesBundle = {
    days: number;
    users: DayPoint[];
    agents: DayPoint[];
    leads: DayPoint[];
    conversations: DayPoint[];
    viewings: DayPoint[];
};

type RecentLead = {
    id: string;
    full_name: string;
    email: string;
    lead_type: string;
    status: string;
    score?: number | null;
    created_at?: string | null;
};

type RecentAgent = {
    id: string;
    full_name: string;
    email: string;
    status: string;
    verification_status?: string | null;
    created_at?: string | null;
};

type RangePreset = '1' | '7' | '30' | '90' | 'custom';

const RANGE_OPTIONS: Array<{ key: RangePreset; label: string }> = [
    { key: '1', label: 'Today' },
    { key: '7', label: 'Last 7 Days' },
    { key: '30', label: 'Last 30 Days' },
    { key: '90', label: 'Last Quarter' },
    { key: 'custom', label: 'Custom' },
];

function ChartSkeleton() {
    return <div className="h-full min-h-[12rem] w-full animate-pulse rounded-xl bg-slate-50" />;
}

function sumSeries(points: DayPoint[] | undefined) {
    return (points || []).reduce((s, p) => s + (p.count || 0), 0);
}

function splitTrend(points: DayPoint[] | undefined) {
    const list = points || [];
    if (list.length < 2) {
        return { change: 0, up: true, flat: true, current: sumSeries(list), previous: 0 };
    }
    const mid = Math.floor(list.length / 2);
    const previous = sumSeries(list.slice(0, mid));
    const current = sumSeries(list.slice(mid));
    if (previous === 0) {
        return {
            change: current > 0 ? 100 : 0,
            up: current >= previous,
            flat: current === previous,
            current,
            previous,
        };
    }
    const change = Math.round(((current - previous) / previous) * 100);
    return { change: Math.abs(change), up: change >= 0, flat: change === 0, current, previous };
}

function formatShortDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function formatRelative(iso: string | null | undefined) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function daysBetween(from: string, to: string) {
    const a = new Date(from);
    const b = new Date(to);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 30;
    const diff = Math.ceil((b.getTime() - a.getTime()) / 86400000) + 1;
    return Math.min(90, Math.max(1, diff));
}

function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let frame = 0;
        const start = performance.now();
        const duration = 700;
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(value * eased));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value]);
    return <>{display.toLocaleString('en-ZA')}</>;
}

function TrendBadge({
    change,
    up,
    flat,
    period,
}: {
    change: number;
    up: boolean;
    flat: boolean;
    period: string;
}) {
    const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
    const tone = flat
        ? 'bg-slate-50 text-[#6B7280] border-[#E5E7EB]'
        : up
          ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
          : 'bg-red-50 text-[#DC2626] border-red-200';
    return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
                className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}
            >
                <Icon className="h-3.5 w-3.5" />
                {flat ? '0%' : `${change}%`}
            </span>
            <span className="text-[11px] text-[#9CA3AF]">vs prior {period}</span>
        </div>
    );
}

function ExecKpi({
    label,
    value,
    series,
    icon: Icon,
    href,
    periodLabel,
    accent = '#E52323',
    large = false,
}: {
    label: string;
    value: number;
    series: DayPoint[];
    icon: ComponentType<{ className?: string }>;
    href?: string;
    periodLabel: string;
    accent?: string;
    large?: boolean;
}) {
    const trend = splitTrend(series);
    const card = (
        <div
            className={`group h-full rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)] ${
                large ? 'p-6 sm:p-7' : 'p-5'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                        {label}
                    </p>
                    <p
                        className={`mt-2 font-semibold tracking-tight text-[#111827] tabular-nums ${
                            large ? 'text-4xl' : 'text-3xl'
                        }`}
                    >
                        <AnimatedNumber value={value} />
                    </p>
                    <TrendBadge
                        change={trend.change}
                        up={trend.up}
                        flat={trend.flat}
                        period={periodLabel}
                    />
                </div>
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${accent}14`, color: accent }}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-4">
                <Sparkline data={series} color={accent} />
            </div>
        </div>
    );
    if (href) {
        return (
            <Link
                href={href}
                className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
            >
                {card}
            </Link>
        );
    }
    return card;
}

function ChartCard({
    title,
    subtitle,
    children,
    className = '',
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] ${className}`}
        >
            <div className="mb-4">
                <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
                {subtitle ? <p className="mt-0.5 text-sm text-[#6B7280]">{subtitle}</p> : null}
            </div>
            {children}
        </div>
    );
}

function DashboardSection({
    id,
    title,
    description,
    children,
    defaultOpen = true,
}: {
    id: string;
    title: string;
    description?: string;
    children: ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <section aria-labelledby={id}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mb-4 flex w-full items-start justify-between gap-3 text-left md:pointer-events-none"
                aria-expanded={open}
            >
                <div>
                    <h3 id={id} className="text-xl font-semibold tracking-tight text-[#111827]">
                        {title}
                    </h3>
                    {description ? (
                        <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
                    ) : null}
                </div>
                <ChevronDown
                    className={`mt-1 h-5 w-5 shrink-0 text-[#6B7280] transition md:hidden ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>
            <div className={open ? 'block' : 'hidden md:block'}>{children}</div>
        </section>
    );
}

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [series, setSeries] = useState<SeriesBundle | null>(null);
    const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
    const [recentAgents, setRecentAgents] = useState<RecentAgent[]>([]);
    const [preset, setPreset] = useState<RangePreset>('30');
    const [customFrom, setCustomFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString().slice(0, 10);
    });
    const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const queryUrl = useMemo(() => {
        if (preset === 'custom') {
            return `/api/admin/analytics?since=${encodeURIComponent(customFrom)}&until=${encodeURIComponent(customTo)}`;
        }
        return `/api/admin/analytics?days=${Number(preset) || 30}`;
    }, [preset, customFrom, customTo]);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(queryUrl, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setAnalytics(data.analytics);
            setSeries(data.series || null);
            setRecentLeads(data.recentLeads || []);
            setRecentAgents(data.recentAgents || []);
        } catch (e) {
            setAnalytics(null);
            setSeries(null);
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [queryUrl]);

    useEffect(() => {
        void load();
    }, [load]);

    const queryDays = useMemo(() => {
        if (preset === 'custom') return daysBetween(customFrom, customTo);
        return Number(preset) || 30;
    }, [preset, customFrom, customTo]);

    const periodLabel =
        queryDays <= 1 ? 'day' : queryDays <= 7 ? 'half-week' : queryDays <= 30 ? 'half-month' : 'half-quarter';

    const growthChart = useMemo(() => {
        if (!series) return [];
        return series.users.map((u, i) => ({
            date: formatShortDate(u.date),
            users: u.count,
            agents: series.agents[i]?.count ?? 0,
            leads: series.leads[i]?.count ?? 0,
        }));
    }, [series]);

    const messagesChart = useMemo(() => {
        if (!series) return [];
        return series.conversations.map((c) => ({
            date: formatShortDate(c.date),
            conversations: c.count,
        }));
    }, [series]);

    const viewingsChart = useMemo(() => {
        if (!series) return [];
        return series.viewings.map((v) => ({
            date: formatShortDate(v.date),
            viewings: v.count,
        }));
    }, [series]);

    const registrationBars = useMemo(() => {
        if (!series) return [];
        return series.users.map((u, i) => ({
            date: formatShortDate(u.date),
            registrations: u.count + (series.agents[i]?.count ?? 0),
        }));
    }, [series]);

    const subscriptionPie = useMemo(() => {
        if (!analytics) return [];
        return [
            { name: 'Active', value: analytics.activePlans ?? 0 },
            { name: 'Trialing', value: analytics.trialingAgents ?? 0 },
            { name: 'Payment pending', value: analytics.paymentPendingAgents ?? 0 },
        ].filter((d) => d.value > 0);
    }, [analytics]);

    const insights = useMemo(() => {
        if (!analytics || !series) return [];
        const userTrend = splitTrend(series.users);
        const pending =
            analytics.pendingAgentApprovals +
            analytics.pendingOriginatorApprovals +
            (analytics.pendingConveyancerApprovals ?? 0);
        const items: Array<{ tone: 'up' | 'down' | 'ok' | 'warn'; text: string }> = [];
        if (userTrend.current > 0 || series.users.length > 0) {
            items.push({
                tone: userTrend.up ? 'up' : 'down',
                text: userTrend.flat
                    ? 'User registrations held steady across the selected range.'
                    : userTrend.up
                      ? `User registrations increased ${userTrend.change}% versus the prior half of the range.`
                      : `User registrations decreased ${userTrend.change}% versus the prior half of the range.`,
            });
        }
        if (pending === 0) {
            items.push({ tone: 'ok', text: 'No pending agent or originator approvals in queue.' });
        } else {
            items.push({
                tone: 'warn',
                text: `${pending} registration${pending === 1 ? '' : 's'} awaiting compliance review.`,
            });
        }
        if ((analytics.trialingAgents ?? 0) > 0) {
            items.push({
                tone: 'ok',
                text: `${analytics.trialingAgents} agent${analytics.trialingAgents === 1 ? '' : 's'} currently on trial — watch conversion.`,
            });
        }
        if ((analytics.paymentPendingAgents ?? 0) > 0) {
            items.push({
                tone: 'warn',
                text: `${analytics.paymentPendingAgents} subscription${analytics.paymentPendingAgents === 1 ? '' : 's'} pending payment.`,
            });
        }
        const msgTrend = splitTrend(series.conversations);
        if (msgTrend.current > 0) {
            items.push({
                tone: msgTrend.up ? 'up' : 'down',
                text: msgTrend.up
                    ? 'Messaging activity is trending up in the latest period.'
                    : 'Messaging activity softened versus the prior period.',
            });
        }
        return items.slice(0, 5);
    }, [analytics, series]);

    const actions = useMemo(() => {
        if (!analytics) return [];
        const list: Array<{
            label: string;
            detail: string;
            urgency: 'high' | 'medium' | 'low';
            href: string;
        }> = [];
        if (analytics.pendingAgentApprovals > 0) {
            list.push({
                label: 'Pending agent approvals',
                detail: `${analytics.pendingAgentApprovals} awaiting PPRA review`,
                urgency: 'high',
                href: '/admin/ppra',
            });
        }
        if (analytics.pendingOriginatorApprovals > 0) {
            list.push({
                label: 'Pending originator approvals',
                detail: `${analytics.pendingOriginatorApprovals} staff onboarding reviews`,
                urgency: 'high',
                href: '/admin/originators',
            });
        }
        if ((analytics.pendingConveyancerApprovals ?? 0) > 0) {
            list.push({
                label: 'Pending conveyancer approvals',
                detail: `${analytics.pendingConveyancerApprovals} firm onboarding reviews`,
                urgency: 'high',
                href: '/admin/conveyancers',
            });
        }
        if ((analytics.paymentPendingAgents ?? 0) > 0) {
            list.push({
                label: 'Failed / pending payments',
                detail: `${analytics.paymentPendingAgents} agents awaiting payment`,
                urgency: 'medium',
                href: '/admin/accounts',
            });
        }
        if ((analytics.trialingAgents ?? 0) > 0) {
            list.push({
                label: 'Trial accounts',
                detail: `${analytics.trialingAgents} agents currently trialing`,
                urgency: 'low',
                href: '/admin/accounts',
            });
        }
        list.push({
            label: 'Message inbox',
            detail: `${analytics.conversations} conversations — review staff threads`,
            urgency: 'medium',
            href: '/admin/messages',
        });
        return list;
    }, [analytics]);

    const activity = useMemo(() => {
        const events: Array<{
            id: string;
            icon: ComponentType<{ className?: string }>;
            title: string;
            detail: string;
            at: string | null | undefined;
            href?: string;
        }> = [];
        for (const a of recentAgents) {
            events.push({
                id: `agent-${a.id}`,
                icon: UserCheck,
                title:
                    a.verification_status === 'verified' || a.status === 'approved'
                        ? 'Agent approved / registered'
                        : 'New agent registration',
                detail: a.full_name || a.email,
                at: a.created_at,
                href: '/admin/ppra',
            });
        }
        for (const l of recentLeads) {
            events.push({
                id: `lead-${l.id}`,
                icon: FileText,
                title: 'Quiz lead captured',
                detail: `${l.full_name || l.email} · ${l.lead_type || 'lead'}`,
                at: l.created_at,
            });
        }
        return events
            .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
            .slice(0, 10);
    }, [recentAgents, recentLeads]);

    const platformHealth = useMemo(() => {
        if (!analytics) return 0;
        const pending =
            analytics.pendingAgentApprovals +
            analytics.pendingOriginatorApprovals +
            (analytics.pendingConveyancerApprovals ?? 0);
        const payment = analytics.paymentPendingAgents ?? 0;
        let score = 100;
        score -= Math.min(40, pending * 4);
        score -= Math.min(30, payment * 5);
        return Math.max(55, score);
    }, [analytics]);

    return (
        <AdminShell title="Analytics">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
                            Analytics
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#6B7280]">
                            Executive view of growth, engagement, compliance, and subscription
                            health across PropReady.
                        </p>
                    </div>
                    <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        <div className="flex flex-wrap items-center gap-2">
                            <div
                                role="tablist"
                                aria-label="Date range"
                                className="inline-flex flex-wrap rounded-xl border border-[#E5E7EB] bg-white p-1"
                            >
                                {RANGE_OPTIONS.map((opt) => {
                                    const active = preset === opt.key;
                                    return (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setPreset(opt.key)}
                                            className={`h-9 rounded-lg px-3 text-xs font-semibold transition sm:text-sm ${
                                                active
                                                    ? 'bg-[#E52323] text-white shadow-sm'
                                                    : 'text-[#6B7280] hover:text-[#111827]'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => void load()}
                                disabled={loading}
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                        {preset === 'custom' ? (
                            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2">
                                <label className="flex items-center gap-2 text-xs text-[#6B7280]">
                                    From
                                    <input
                                        type="date"
                                        value={customFrom}
                                        max={customTo}
                                        onChange={(e) => setCustomFrom(e.target.value)}
                                        className="h-9 rounded-lg border border-[#E5E7EB] px-2 text-sm text-[#111827]"
                                    />
                                </label>
                                <label className="flex items-center gap-2 text-xs text-[#6B7280]">
                                    To
                                    <input
                                        type="date"
                                        value={customTo}
                                        min={customFrom}
                                        max={new Date().toISOString().slice(0, 10)}
                                        onChange={(e) => setCustomTo(e.target.value)}
                                        className="h-9 rounded-lg border border-[#E5E7EB] px-2 text-sm text-[#111827]"
                                    />
                                </label>
                                <span className="px-1 text-xs text-[#9CA3AF]">
                                    {queryDays} day{queryDays === 1 ? '' : 's'}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>

                {error ? (
                    <div
                        role="alert"
                        className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="flex items-start gap-2 text-sm text-[#DC2626]">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                                <p className="font-semibold">Could not load analytics</p>
                                <p className="mt-0.5">{error}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => void load()}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-[#DC2626] hover:bg-red-50"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry
                        </button>
                    </div>
                ) : null}

                {loading && !analytics ? (
                    <div className="grid gap-4 lg:grid-cols-12">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-40 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white lg:col-span-4"
                            />
                        ))}
                    </div>
                ) : analytics ? (
                    <>
                        <DashboardSection
                            id="exec-overview"
                            title="Executive Overview"
                            description="Headline platform health for the selected range"
                        >
                            <div className="grid gap-4 lg:grid-cols-12">
                                <div className="lg:col-span-4">
                                    <ExecKpi
                                        large
                                        label="Registered Users"
                                        value={analytics.users}
                                        series={series?.users || []}
                                        icon={Users}
                                        href="/admin/accounts"
                                        periodLabel={periodLabel}
                                    />
                                </div>
                                <div className="lg:col-span-4">
                                    <ExecKpi
                                        large
                                        label="Agents"
                                        value={analytics.agents}
                                        series={series?.agents || []}
                                        icon={UserCheck}
                                        href="/admin/accounts"
                                        periodLabel={periodLabel}
                                        accent="#111827"
                                    />
                                </div>
                                <div className="lg:col-span-4">
                                    <ExecKpi
                                        large
                                        label="Platform Health"
                                        value={platformHealth}
                                        series={series?.leads || []}
                                        icon={Activity}
                                        periodLabel={periodLabel}
                                        accent="#16A34A"
                                    />
                                </div>
                                <div className="lg:col-span-3">
                                    <ExecKpi
                                        label="Originators"
                                        value={analytics.originators}
                                        series={series?.agents || []}
                                        icon={Building2}
                                        href="/admin/originators"
                                        periodLabel={periodLabel}
                                    />
                                </div>
                                <div className="lg:col-span-3">
                                    <ExecKpi
                                        label="Active Plans"
                                        value={analytics.activePlans ?? 0}
                                        series={series?.agents || []}
                                        icon={CheckCircle2}
                                        href="/admin/accounts"
                                        periodLabel={periodLabel}
                                        accent="#16A34A"
                                    />
                                </div>
                                <div className="lg:col-span-3">
                                    <ExecKpi
                                        label="Pending Reviews"
                                        value={
                                            analytics.pendingAgentApprovals +
                                            analytics.pendingOriginatorApprovals +
                                            (analytics.pendingConveyancerApprovals ?? 0)
                                        }
                                        series={series?.agents || []}
                                        icon={ShieldCheck}
                                        href="/admin/ppra"
                                        periodLabel={periodLabel}
                                        accent="#F59E0B"
                                    />
                                </div>
                                <div className="lg:col-span-3">
                                    <ExecKpi
                                        label="Quiz Leads"
                                        value={analytics.leads}
                                        series={series?.leads || []}
                                        icon={BarChart3}
                                        periodLabel={periodLabel}
                                    />
                                </div>
                            </div>
                        </DashboardSection>

                        <DashboardSection
                            id="user-growth"
                            title="User Growth"
                            description="Registrations and acquisition over time"
                        >
                            <div className="grid gap-4 lg:grid-cols-12">
                                <ChartCard
                                    title="User & agent growth"
                                    subtitle="Daily new users and agents"
                                    className="min-h-[320px] lg:col-span-8"
                                >
                                    <div className="h-64">
                                        <GrowthLineChart data={growthChart} />
                                    </div>
                                </ChartCard>
                                <ChartCard
                                    title="Daily registrations"
                                    subtitle="Users + agents per day"
                                    className="min-h-[320px] lg:col-span-4"
                                >
                                    <div className="h-64">
                                        <RegistrationsBarChart data={registrationBars} />
                                    </div>
                                </ChartCard>
                            </div>
                        </DashboardSection>

                        <DashboardSection
                            id="platform-activity"
                            title="Platform Activity"
                            description="Viewings and operational volume"
                        >
                            <div className="grid gap-4 lg:grid-cols-12">
                                <ChartCard
                                    title="Appointments by day"
                                    subtitle="Viewing appointments created"
                                    className="min-h-[300px] lg:col-span-8"
                                >
                                    <div className="h-56">
                                        <ViewingsBarChart data={viewingsChart} />
                                    </div>
                                </ChartCard>
                                <div className="grid gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
                                    <ExecKpi
                                        label="Prequal Cases"
                                        value={analytics.prequalCases}
                                        series={series?.leads || []}
                                        icon={FileText}
                                        periodLabel={periodLabel}
                                        accent="#2563EB"
                                    />
                                    <ExecKpi
                                        label="Viewings"
                                        value={analytics.viewings}
                                        series={series?.viewings || []}
                                        icon={Calendar}
                                        periodLabel={periodLabel}
                                        accent="#111827"
                                    />
                                </div>
                            </div>
                        </DashboardSection>

                        <DashboardSection
                            id="communication"
                            title="Communication"
                            description="Messaging engagement across the platform"
                        >
                            <div className="grid gap-4 lg:grid-cols-12">
                                <ChartCard
                                    title="Conversations started"
                                    subtitle="New message threads by day"
                                    className="min-h-[300px] lg:col-span-8"
                                >
                                    <div className="h-56">
                                        <MessagesAreaChart data={messagesChart} />
                                    </div>
                                </ChartCard>
                                <div className="lg:col-span-4">
                                    <ExecKpi
                                        large
                                        label="Conversations"
                                        value={analytics.conversations}
                                        series={series?.conversations || []}
                                        icon={MessageSquare}
                                        href="/admin/messages"
                                        periodLabel={periodLabel}
                                    />
                                </div>
                            </div>
                        </DashboardSection>

                        <DashboardSection
                            id="compliance"
                            title="Compliance"
                            description="Approvals queue and review load"
                        >
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <ExecKpi
                                    label="Pending agent approvals"
                                    value={analytics.pendingAgentApprovals}
                                    series={series?.agents || []}
                                    icon={ShieldCheck}
                                    href="/admin/ppra"
                                    periodLabel={periodLabel}
                                    accent="#F59E0B"
                                />
                                <ExecKpi
                                    label="Pending originators"
                                    value={analytics.pendingOriginatorApprovals}
                                    series={series?.agents || []}
                                    icon={Clock3}
                                    href="/admin/originators"
                                    periodLabel={periodLabel}
                                    accent="#F59E0B"
                                />
                                <ExecKpi
                                    label="Pending conveyancers"
                                    value={analytics.pendingConveyancerApprovals ?? 0}
                                    series={series?.agents || []}
                                    icon={Scale}
                                    href="/admin/conveyancers"
                                    periodLabel={periodLabel}
                                    accent="#F59E0B"
                                />
                            </div>
                        </DashboardSection>

                        <DashboardSection
                            id="subscriptions"
                            title="Subscription Performance"
                            description="Plan mix and billing status"
                        >
                            <div className="grid gap-4 lg:grid-cols-12">
                                <ChartCard
                                    title="Subscription distribution"
                                    subtitle="Active · Trialing · Payment pending"
                                    className="min-h-[280px] lg:col-span-8"
                                >
                                    {subscriptionPie.length === 0 ? (
                                        <p className="flex h-52 items-center justify-center text-sm text-[#6B7280]">
                                            No subscription data yet
                                        </p>
                                    ) : (
                                        <div className="flex h-52 flex-col items-center gap-4 sm:flex-row">
                                            <div className="h-48 w-full sm:w-1/2">
                                                <SubscriptionDonut data={subscriptionPie} />
                                            </div>
                                            <ul className="w-full space-y-2 sm:w-1/2">
                                                {subscriptionPie.map((row, i) => (
                                                    <li
                                                        key={row.name}
                                                        className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm"
                                                    >
                                                        <span className="inline-flex items-center gap-2 text-[#111827]">
                                                            <span
                                                                className="h-2.5 w-2.5 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        CHART_COLORS[i % CHART_COLORS.length],
                                                                }}
                                                            />
                                                            {row.name}
                                                        </span>
                                                        <span className="font-semibold tabular-nums">
                                                            {row.value}
                                                        </span>
                                                    </li>
                                                ))}
                                                <li className="flex items-center gap-2 px-1 pt-1 text-xs text-[#6B7280]">
                                                    <CreditCard className="h-3.5 w-3.5" />
                                                    Trialing: {analytics.trialingAgents ?? 0}
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </ChartCard>
                                <div className="lg:col-span-4">
                                    <ExecKpi
                                        large
                                        label="Active Plans"
                                        value={analytics.activePlans ?? 0}
                                        series={series?.agents || []}
                                        icon={CheckCircle2}
                                        href="/admin/accounts"
                                        periodLabel={periodLabel}
                                        accent="#16A34A"
                                    />
                                </div>
                            </div>
                        </DashboardSection>

                        <DashboardSection
                            id="insights-ops"
                            title="Insights, Activity & Action Centre"
                            description="What changed, what happened, and what needs attention"
                        >
                            <div className="grid gap-4 lg:grid-cols-12">
                                <ChartCard title="Insights" className="lg:col-span-4">
                                    <ul className="space-y-3">
                                        {insights.map((item, i) => {
                                            const Icon =
                                                item.tone === 'up'
                                                    ? TrendingUp
                                                    : item.tone === 'down'
                                                      ? ArrowDownRight
                                                      : item.tone === 'warn'
                                                        ? AlertTriangle
                                                        : CheckCircle2;
                                            const tone =
                                                item.tone === 'up'
                                                    ? 'bg-emerald-50 text-[#16A34A]'
                                                    : item.tone === 'down'
                                                      ? 'bg-red-50 text-[#DC2626]'
                                                      : item.tone === 'warn'
                                                        ? 'bg-amber-50 text-[#F59E0B]'
                                                        : 'bg-emerald-50 text-[#16A34A]';
                                            return (
                                                <li
                                                    key={i}
                                                    className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3"
                                                >
                                                    <span
                                                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                    </span>
                                                    <p className="text-sm leading-relaxed text-[#111827]">
                                                        {item.text}
                                                    </p>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </ChartCard>

                                <ChartCard title="Recent Activity" className="lg:col-span-4">
                                    <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                        {activity.length === 0 ? (
                                            <li className="py-10 text-center text-sm text-[#6B7280]">
                                                No recent events
                                            </li>
                                        ) : (
                                            activity.map((ev) => {
                                                const Icon = ev.icon;
                                                const row = (
                                                    <div className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5 transition hover:bg-white">
                                                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#E52323]">
                                                            <Icon className="h-4 w-4" />
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-[#111827]">
                                                                {ev.title}
                                                            </p>
                                                            <p className="truncate text-xs text-[#6B7280]">
                                                                {ev.detail}
                                                            </p>
                                                            <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                                                                {formatRelative(ev.at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                                return (
                                                    <li key={ev.id}>
                                                        {ev.href ? (
                                                            <Link href={ev.href}>{row}</Link>
                                                        ) : (
                                                            row
                                                        )}
                                                    </li>
                                                );
                                            })
                                        )}
                                    </ul>
                                </ChartCard>

                                <ChartCard title="Action Centre" className="lg:col-span-4">
                                    <ul className="space-y-2">
                                        {actions.map((a) => {
                                            const badge =
                                                a.urgency === 'high'
                                                    ? 'bg-red-50 text-[#DC2626] border-red-200'
                                                    : a.urgency === 'medium'
                                                      ? 'bg-amber-50 text-[#F59E0B] border-amber-200'
                                                      : 'bg-slate-50 text-[#6B7280] border-[#E5E7EB]';
                                            return (
                                                <li key={a.label}>
                                                    <Link
                                                        href={a.href}
                                                        className="flex items-start justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 transition hover:border-[#E52323]/25 hover:bg-white"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-[#111827]">
                                                                {a.label}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-[#6B7280]">
                                                                {a.detail}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge}`}
                                                        >
                                                            {a.urgency}
                                                        </span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    <Link
                                        href="/admin/messages"
                                        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#E52323] text-sm font-semibold text-white transition hover:bg-[#c91d1d]"
                                    >
                                        <Zap className="h-4 w-4" />
                                        Open staff inbox
                                    </Link>
                                </ChartCard>
                            </div>
                        </DashboardSection>
                    </>
                ) : !error ? (
                    <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-16 text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E52323]/[0.08] text-[#E52323]">
                            <BarChart3 className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#111827]">No analytics data</h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
                            Analytics could not be displayed. Try refreshing to load the latest
                            metrics.
                        </p>
                    </div>
                ) : null}
            </div>
        </AdminShell>
    );
}
