'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    AlertCircle,
    BarChart3,
    Building2,
    Calendar,
    CheckCircle2,
    Clock3,
    CreditCard,
    FileText,
    MessageSquare,
    RefreshCw,
    ShieldCheck,
    UserCheck,
    Users,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

type Analytics = {
    users: number;
    agents: number;
    originators: number;
    leads: number;
    pendingAgentApprovals: number;
    pendingOriginatorApprovals: number;
    conversations: number;
    prequalCases: number;
    viewings: number;
    activePlans?: number;
    trialingAgents?: number;
    paymentPendingAgents?: number;
};

function KpiCard({
    label,
    value,
    description,
    icon: Icon,
    href,
}: {
    label: string;
    value: number;
    description: string;
    icon: typeof Users;
    href?: string;
}) {
    const inner = (
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

    if (href) {
        return (
            <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 rounded-2xl">
                {inner}
            </Link>
        );
    }

    return inner;
}

function KpiSkeleton() {
    return (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 animate-pulse">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                    <div className="h-8 w-1/4 rounded bg-slate-100" />
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>
                <div className="h-11 w-11 rounded-xl bg-slate-100" />
            </div>
        </div>
    );
}

function SectionSkeleton({ count }: { count: number }) {
    return (
        <section className="space-y-4">
            <div className="h-5 w-32 rounded bg-slate-100 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: count }).map((_, i) => (
                    <KpiSkeleton key={i} />
                ))}
            </div>
        </section>
    );
}

function MetricSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
                {description ? (
                    <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
                ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
        </section>
    );
}

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/analytics', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setAnalytics(data.analytics);
        } catch (e) {
            setAnalytics(null);
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const hasPlanMetrics =
        analytics &&
        (analytics.activePlans != null ||
            analytics.trialingAgents != null ||
            analytics.paymentPendingAgents != null);

    return (
        <AdminShell title="Analytics">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
                            Analytics
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#6B7280]">
                            Platform-wide metrics across accounts, approvals, engagement, and
                            subscriptions.
                        </p>
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

                {loading ? (
                    <div className="space-y-8">
                        <SectionSkeleton count={4} />
                        <SectionSkeleton count={2} />
                        <SectionSkeleton count={3} />
                        <SectionSkeleton count={3} />
                    </div>
                ) : analytics ? (
                    <div className="space-y-8">
                        <MetricSection
                            title="Accounts"
                            description="Registered users across the platform"
                        >
                            <KpiCard
                                label="Registered Users"
                                value={analytics.users}
                                description="Buyers and sellers"
                                icon={Users}
                                href="/admin/accounts"
                            />
                            <KpiCard
                                label="Agents"
                                value={analytics.agents}
                                description="Estate agent accounts"
                                icon={UserCheck}
                                href="/admin/accounts"
                            />
                            <KpiCard
                                label="Bond Originators"
                                value={analytics.originators}
                                description="Originator staff accounts"
                                icon={Building2}
                                href="/admin/accounts"
                            />
                            <KpiCard
                                label="Quiz Leads"
                                value={analytics.leads}
                                description="Captured from affordability quiz"
                                icon={BarChart3}
                            />
                        </MetricSection>

                        <MetricSection
                            title="Approvals"
                            description="Pending staff review queues"
                        >
                            <KpiCard
                                label="Pending Agent Approvals"
                                value={analytics.pendingAgentApprovals}
                                description="Awaiting PPRA verification"
                                icon={ShieldCheck}
                                href="/admin/ppra"
                            />
                            <KpiCard
                                label="Pending Originator Approvals"
                                value={analytics.pendingOriginatorApprovals}
                                description="Awaiting staff onboarding"
                                icon={Clock3}
                                href="/admin/originators"
                            />
                        </MetricSection>

                        <MetricSection
                            title="Engagement"
                            description="Activity across messaging and property workflows"
                        >
                            <KpiCard
                                label="Conversations"
                                value={analytics.conversations}
                                description="Message threads on platform"
                                icon={MessageSquare}
                                href="/admin/messages"
                            />
                            <KpiCard
                                label="Prequal Cases"
                                value={analytics.prequalCases}
                                description="Bond prequalification cases"
                                icon={FileText}
                            />
                            <KpiCard
                                label="Viewing Appointments"
                                value={analytics.viewings}
                                description="Scheduled property viewings"
                                icon={Calendar}
                            />
                        </MetricSection>

                        {hasPlanMetrics ? (
                            <MetricSection
                                title="Plans"
                                description="Agent subscription and billing status"
                            >
                                {analytics.activePlans != null ? (
                                    <KpiCard
                                        label="Active Plans"
                                        value={analytics.activePlans}
                                        description="Agents on paid plans"
                                        icon={CheckCircle2}
                                        href="/admin/accounts"
                                    />
                                ) : null}
                                {analytics.trialingAgents != null ? (
                                    <KpiCard
                                        label="Trialing Agents"
                                        value={analytics.trialingAgents}
                                        description="Agents currently on trial"
                                        icon={Clock3}
                                        href="/admin/accounts"
                                    />
                                ) : null}
                                {analytics.paymentPendingAgents != null ? (
                                    <KpiCard
                                        label="Payment Pending"
                                        value={analytics.paymentPendingAgents}
                                        description="Agents awaiting payment"
                                        icon={CreditCard}
                                        href="/admin/accounts"
                                    />
                                ) : null}
                            </MetricSection>
                        ) : null}
                    </div>
                ) : !error ? (
                    <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-16 text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E52323]/[0.08] text-[#E52323]">
                            <BarChart3 className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#111827]">
                            No analytics data
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
                            Analytics could not be displayed. Try refreshing to load the latest
                            metrics.
                        </p>
                        <button
                            type="button"
                            onClick={() => void load()}
                            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827] hover:bg-[#F8FAFC]"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                ) : null}
            </div>
        </AdminShell>
    );
}
