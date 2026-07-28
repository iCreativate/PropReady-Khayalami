'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import {
    Building2,
    Calendar,
    CreditCard,
    FileText,
    MessageSquare,
    RefreshCw,
    Shield,
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

type Lead = {
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

function initials(name: string, email: string) {
    const source = (name || email || '?').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
}

function statusTone(status: string) {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'verified' || s === 'active' || s === 'qualified') {
        return 'bg-emerald-50 text-[#16A34A] border-emerald-200';
    }
    if (s === 'pending' || s === 'new') {
        return 'bg-amber-50 text-[#F59E0B] border-amber-200';
    }
    if (s === 'rejected' || s === 'not-interested') {
        return 'bg-red-50 text-[#DC2626] border-red-200';
    }
    return 'bg-slate-50 text-[#6B7280] border-[#E5E7EB]';
}

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
    icon: ComponentType<{ className?: string }>;
    href?: string;
}) {
    const card = (
        <div className="group h-full rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)]">
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
                {card}
            </Link>
        );
    }
    return card;
}

function SkeletonGrid() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="h-32 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white"
                />
            ))}
        </div>
    );
}

export default function AdminOverviewPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
    const [recentAgents, setRecentAgents] = useState<RecentAgent[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/analytics', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setAnalytics(data.analytics);
            setRecentLeads(data.recentLeads || []);
            setRecentAgents(data.recentAgents || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    return (
        <AdminShell title="Overview">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
                            Overview
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#6B7280]">
                            Platform health at a glance — accounts, approvals, messaging, and leads.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void load()}
                            disabled={loading}
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <Link
                            href="/admin/analytics"
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#E52323] px-4 text-sm font-semibold text-white transition hover:bg-[#c91d1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
                        >
                            Full analytics
                        </Link>
                    </div>
                </div>

                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {loading && !analytics ? (
                    <SkeletonGrid />
                ) : analytics ? (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <KpiCard
                                label="Users"
                                value={analytics.users}
                                description="Registered buyers & sellers"
                                icon={Users}
                                href="/admin/accounts"
                            />
                            <KpiCard
                                label="Agents"
                                value={analytics.agents}
                                description="Estate agent accounts"
                                icon={Shield}
                                href="/admin/accounts"
                            />
                            <KpiCard
                                label="Originators"
                                value={analytics.originators}
                                description="Bond originator staff"
                                icon={Building2}
                                href="/admin/originators"
                            />
                            <KpiCard
                                label="Quiz leads"
                                value={analytics.leads}
                                description="Captured lead profiles"
                                icon={FileText}
                            />
                            <KpiCard
                                label="Pending agents"
                                value={analytics.pendingAgentApprovals}
                                description="Awaiting PPRA review"
                                icon={Shield}
                                href="/admin/ppra"
                            />
                            <KpiCard
                                label="Pending originators"
                                value={analytics.pendingOriginatorApprovals}
                                description="Awaiting staff approval"
                                icon={Building2}
                                href="/admin/originators"
                            />
                            <KpiCard
                                label="Conversations"
                                value={analytics.conversations}
                                description="Message hub threads"
                                icon={MessageSquare}
                                href="/admin/messages"
                            />
                            <KpiCard
                                label="Viewings"
                                value={analytics.viewings}
                                description="Scheduled appointments"
                                icon={Calendar}
                            />
                        </div>

                        {(analytics.activePlans != null ||
                            analytics.trialingAgents != null ||
                            analytics.paymentPendingAgents != null ||
                            analytics.prequalCases != null) && (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <KpiCard
                                    label="Active plans"
                                    value={analytics.activePlans ?? 0}
                                    description="Agents on paid plans"
                                    icon={CreditCard}
                                />
                                <KpiCard
                                    label="Trialing"
                                    value={analytics.trialingAgents ?? 0}
                                    description="Agents on trial"
                                    icon={Shield}
                                />
                                <KpiCard
                                    label="Payment pending"
                                    value={analytics.paymentPendingAgents ?? 0}
                                    description="Awaiting payment"
                                    icon={CreditCard}
                                />
                                <KpiCard
                                    label="Prequal cases"
                                    value={analytics.prequalCases}
                                    description="Open prequalification files"
                                    icon={FileText}
                                />
                            </div>
                        )}

                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                                <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-[#111827]">
                                            Recent quiz leads
                                        </h3>
                                        <p className="mt-0.5 text-xs text-[#6B7280]">
                                            Latest captures from the buyer quiz
                                        </p>
                                    </div>
                                    <Link
                                        href="/admin/analytics"
                                        className="text-xs font-semibold text-[#E52323] hover:underline"
                                    >
                                        View all
                                    </Link>
                                </div>
                                <div className="divide-y divide-[#F3F4F6]">
                                    {recentLeads.length === 0 ? (
                                        <p className="px-5 py-10 text-center text-sm text-[#6B7280]">
                                            No leads yet
                                        </p>
                                    ) : (
                                        recentLeads.map((lead) => (
                                            <div
                                                key={lead.id}
                                                className="flex items-center gap-3 px-5 py-3.5"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-semibold text-white">
                                                    {initials(lead.full_name, lead.email)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-[#111827]">
                                                        {lead.full_name || '—'}
                                                    </p>
                                                    <p className="truncate text-xs text-[#6B7280]">
                                                        {lead.email}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusTone(lead.status)}`}
                                                    >
                                                        {lead.status || lead.lead_type}
                                                    </span>
                                                    <p className="mt-1 text-[11px] text-[#9CA3AF]">
                                                        {formatDate(lead.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                                <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-[#111827]">
                                            Recent agents
                                        </h3>
                                        <p className="mt-0.5 text-xs text-[#6B7280]">
                                            Newest agent registrations
                                        </p>
                                    </div>
                                    <Link
                                        href="/admin/ppra"
                                        className="text-xs font-semibold text-[#E52323] hover:underline"
                                    >
                                        Approvals
                                    </Link>
                                </div>
                                <div className="divide-y divide-[#F3F4F6]">
                                    {recentAgents.length === 0 ? (
                                        <p className="px-5 py-10 text-center text-sm text-[#6B7280]">
                                            No recent agents
                                        </p>
                                    ) : (
                                        recentAgents.map((agent) => (
                                            <div
                                                key={agent.id}
                                                className="flex items-center gap-3 px-5 py-3.5"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E52323] text-xs font-semibold text-white">
                                                    {initials(agent.full_name, agent.email)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-[#111827]">
                                                        {agent.full_name || '—'}
                                                    </p>
                                                    <p className="truncate text-xs text-[#6B7280]">
                                                        {agent.email}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusTone(agent.verification_status || agent.status)}`}
                                                    >
                                                        {agent.verification_status || agent.status}
                                                    </span>
                                                    <p className="mt-1 text-[11px] text-[#9CA3AF]">
                                                        {formatDate(agent.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </AdminShell>
    );
}
