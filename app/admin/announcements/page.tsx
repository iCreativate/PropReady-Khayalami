'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CheckCircle2,
    Inbox,
    Megaphone,
    PauseCircle,
    RefreshCcw,
    Send,
    Users,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

type Announcement = {
    id: string;
    title: string;
    body: string;
    audience: string;
    active: boolean;
    publishedAt: string;
    createdByEmail?: string;
};

type AudienceKey = 'all' | 'user' | 'agent' | 'originator';

const AUDIENCE_LABEL: Record<AudienceKey, string> = {
    all: 'Everyone',
    user: 'Buyers / sellers',
    agent: 'Agents',
    originator: 'Originators',
};

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

function audienceTone(audience: string) {
    switch (audience) {
        case 'all':
            return 'bg-[#E52323]/[0.08] text-[#E52323] border-[#E52323]/20';
        case 'user':
            return 'bg-blue-50 text-[#2563EB] border-blue-200';
        case 'agent':
            return 'bg-violet-50 text-[#7C3AED] border-violet-200';
        case 'originator':
            return 'bg-amber-50 text-[#D97706] border-amber-200';
        default:
            return 'bg-slate-50 text-[#6B7280] border-[#E5E7EB]';
    }
}

function AudiencePill({ audience }: { audience: string }) {
    const label =
        AUDIENCE_LABEL[audience as AudienceKey] ||
        audience.charAt(0).toUpperCase() + audience.slice(1);
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${audienceTone(audience)}`}
        >
            {label}
        </span>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    if (active) {
        return (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                Active
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#DC2626]">
            Inactive
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
    value: number | string;
    description: string;
    icon: typeof Users;
}) {
    return (
        <div className="group rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                        {label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] tabular-nums">
                        {value}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E52323]/[0.08] text-[#E52323] transition group-hover:bg-[#E52323] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function SkeletonKpi() {
    return (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 animate-pulse">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                    <div className="h-3 w-24 rounded bg-slate-100" />
                    <div className="h-8 w-16 rounded bg-slate-100" />
                    <div className="h-3 w-32 rounded bg-slate-100" />
                </div>
                <div className="h-11 w-11 rounded-xl bg-slate-100" />
            </div>
        </div>
    );
}

function SkeletonAnnouncementCard() {
    return (
        <article className="rounded-2xl border border-[#E5E7EB] bg-white p-5 animate-pulse">
            <div className="space-y-3">
                <div className="flex gap-2">
                    <div className="h-5 w-1/2 rounded bg-slate-100" />
                    <div className="h-5 w-16 rounded-full bg-slate-100" />
                </div>
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-4/5 rounded bg-slate-100" />
                <div className="h-3 w-1/3 rounded bg-slate-100" />
            </div>
        </article>
    );
}

export default function AdminAnnouncementsPage() {
    const [items, setItems] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [audience, setAudience] = useState<AudienceKey>('all');
    const [alsoMessage, setAlsoMessage] = useState(false);

    const load = useCallback(async (opts?: { silent?: boolean }) => {
        if (opts?.silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError('');
        try {
            const res = await fetch('/api/admin/announcements', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setItems(data.announcements || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const kpis = useMemo(() => {
        const total = items.length;
        const active = items.filter((i) => i.active).length;
        const inactive = items.filter((i) => !i.active).length;
        const activeByAudience = items
            .filter((i) => i.active)
            .reduce(
                (acc, item) => {
                    const key = item.audience as AudienceKey;
                    if (key in acc) acc[key] += 1;
                    return acc;
                },
                { all: 0, user: 0, agent: 0, originator: 0 }
            );
        const audienceSegments = Object.values(activeByAudience).filter((n) => n > 0).length;
        return { total, active, inactive, activeByAudience, audienceSegments };
    }, [items]);

    const audienceBreakdown = useMemo(() => {
        const parts = (['all', 'user', 'agent', 'originator'] as AudienceKey[])
            .filter((key) => kpis.activeByAudience[key] > 0)
            .map((key) => `${AUDIENCE_LABEL[key].split(' ')[0]} ${kpis.activeByAudience[key]}`);
        return parts.length > 0 ? parts.join(' · ') : 'No active segments';
    }, [kpis.activeByAudience]);

    async function publish(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body, audience, alsoMessage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Publish failed');
            setTitle('');
            setBody('');
            if (data.broadcast?.sent != null) {
                alert(
                    `Published.${alsoMessage ? ` Also messaged ${data.broadcast.sent}/${data.broadcast.recipientCount} accounts.` : ''}`
                );
            }
            await load({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Publish failed');
        } finally {
            setSaving(false);
        }
    }

    async function setActive(id: string, active: boolean) {
        setActionLoading(id);
        setError('');
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, active }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Update failed');
                return;
            }
            await load({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <AdminShell title="Announcements">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
                            Announcements
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#6B7280]">
                            Publish latest updates for the platform. Announcements appear in portal
                            banners. Optionally also deliver them as inbox messages to every matching
                            account.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void load({ silent: true })}
                        disabled={loading || refreshing}
                        className="inline-flex h-11 items-center gap-2 self-start rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 disabled:opacity-50"
                    >
                        <RefreshCcw
                            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)
                    ) : (
                        <>
                            <KpiCard
                                label="Active"
                                value={kpis.active}
                                description="Currently visible in portals"
                                icon={CheckCircle2}
                            />
                            <KpiCard
                                label="Total"
                                value={kpis.total}
                                description="All published announcements"
                                icon={Megaphone}
                            />
                            <KpiCard
                                label="Active by audience"
                                value={kpis.audienceSegments}
                                description={audienceBreakdown}
                                icon={Users}
                            />
                            <KpiCard
                                label="Inactive"
                                value={kpis.inactive}
                                description="Deactivated or archived"
                                icon={PauseCircle}
                            />
                        </>
                    )}
                </div>

                {error ? (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#DC2626]"
                    >
                        {error}
                    </div>
                ) : null}

                {/* Two-column layout */}
                <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
                    {/* Publish form */}
                    <form
                        onSubmit={publish}
                        className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] lg:sticky lg:top-6"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E52323]/[0.08] text-[#E52323]">
                                <Megaphone className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[#111827]">
                                    New announcement
                                </h3>
                                <p className="mt-1 text-sm text-[#6B7280]">
                                    Broadcast to portal banners and optionally inbox.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <label className="block space-y-1.5">
                                <span className="text-sm font-medium text-[#6B7280]">Title</span>
                                <input
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Announcement title"
                                    className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 text-sm text-[#111827] placeholder:text-[#6B7280] focus:border-[#E52323]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E52323]/20"
                                />
                            </label>

                            <label className="block space-y-1.5">
                                <span className="text-sm font-medium text-[#6B7280]">Body</span>
                                <textarea
                                    required
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Latest update / announcement body…"
                                    rows={5}
                                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#6B7280] focus:border-[#E52323]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E52323]/20"
                                />
                            </label>

                            <label className="block space-y-1.5">
                                <span className="text-sm font-medium text-[#6B7280]">Audience</span>
                                <select
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value as AudienceKey)}
                                    className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] focus:border-[#E52323]/40 focus:outline-none focus:ring-2 focus:ring-[#E52323]/20"
                                >
                                    <option value="all">Everyone</option>
                                    <option value="user">Buyers / sellers</option>
                                    <option value="agent">Agents</option>
                                    <option value="originator">Originators</option>
                                </select>
                            </label>

                            <label className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 cursor-pointer transition hover:bg-white">
                                <input
                                    type="checkbox"
                                    checked={alsoMessage}
                                    onChange={(e) => setAlsoMessage(e.target.checked)}
                                    className="mt-0.5 rounded border-[#E5E7EB]"
                                />
                                <span className="min-w-0">
                                    <span className="flex items-center gap-2 text-sm font-medium text-[#111827]">
                                        <Inbox className="h-4 w-4 text-[#6B7280]" />
                                        Also send as inbox message
                                    </span>
                                    <span className="mt-1 block text-xs text-[#6B7280]">
                                        Optional. Creates an inbox thread per account (can clutter
                                        staff Messages). Leave off for banner-only updates like Welcome.
                                    </span>
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#E52323] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c91d1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/50 disabled:opacity-60"
                            >
                                <Send className="h-4 w-4" />
                                {saving ? 'Publishing…' : 'Publish'}
                            </button>
                        </div>
                    </form>

                    {/* Announcements list */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 px-1">
                            <h3 className="text-sm font-semibold text-[#111827]">
                                Published announcements
                            </h3>
                            {!loading ? (
                                <p className="text-sm text-[#6B7280]">
                                    {items.length} item{items.length === 1 ? '' : 's'}
                                </p>
                            ) : null}
                        </div>

                        {loading ? (
                            <div className="grid gap-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <SkeletonAnnouncementCard key={i} />
                                ))}
                            </div>
                        ) : items.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-16 text-center">
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E52323]/[0.08] text-[#E52323]">
                                    <Megaphone className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-[#111827]">
                                    No announcements yet
                                </h3>
                                <p className="mx-auto mt-2 max-w-md text-sm text-[#6B7280]">
                                    Publish your first update using the form. It will appear in portal
                                    banners for the selected audience.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {items.map((item) => {
                                    const busy = actionLoading === item.id;
                                    return (
                                        <article
                                            key={item.id}
                                            className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(17,24,39,0.08)]"
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-base font-semibold text-[#111827]">
                                                            {item.title}
                                                        </h4>
                                                        <AudiencePill audience={item.audience} />
                                                        <StatusBadge active={item.active} />
                                                    </div>
                                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#6B7280]">
                                                        {item.body}
                                                    </p>
                                                    <p className="mt-3 text-xs text-[#6B7280]">
                                                        {formatDateTime(item.publishedAt)}
                                                        {item.createdByEmail
                                                            ? ` · ${item.createdByEmail}`
                                                            : ''}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
                                                    {item.active ? (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                void setActive(item.id, false)
                                                            }
                                                            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
                                                        >
                                                            {busy ? 'Updating…' : 'Deactivate'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                void setActive(item.id, true)
                                                            }
                                                            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#E52323] px-4 text-sm font-semibold text-white transition hover:bg-[#c91d1d] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40"
                                                        >
                                                            {busy ? 'Updating…' : 'Reactivate'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
