'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Ban, ShieldCheck } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { CC_CARD_FLAT } from '@/components/conveyancer-connect/cc-ui';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

type Row = {
    id: string;
    full_name: string;
    email: string;
    firm_name: string;
    firm_slug?: string | null;
    lpc_number?: string | null;
    province?: string | null;
    city?: string | null;
    status: string;
    profile_completion?: number;
    created_at?: string;
};

export default function AdminConveyancersPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/conveyancers', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(String(data.error || 'Failed to load'));
                return;
            }
            setRows(data.conveyancers || []);
            setPendingCount(data.pendingCount || 0);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function review(conveyancerId: string, action: 'approve' | 'reject' | 'suspend') {
        const res = await fetch('/api/admin/conveyancers/review', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conveyancerId, action }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setError(String(data.error || 'Review failed'));
            return;
        }
        await load();
    }

    const pending = rows.filter((r) => r.status === 'pending');

    return (
        <AdminShell title="Conveyancer Approvals">
            <div className="space-y-6">
                {error ? (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Pending applications', value: pendingCount },
                        {
                            label: 'Approved firms',
                            value: rows.filter((r) => r.status === 'approved').length,
                        },
                        {
                            label: 'Suspended',
                            value: rows.filter((r) => r.status === 'suspended').length,
                        },
                        { label: 'Total registered', value: rows.length },
                    ].map((k) => (
                        <div key={k.label} className={`${CC_CARD_FLAT} p-4`}>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                {k.label}
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-[#111827]">
                                {loading ? '…' : k.value}
                            </p>
                        </div>
                    ))}
                </div>

                <section className={`${CC_CARD_FLAT} p-5`}>
                    <h2 className="text-lg font-semibold text-[#111827]">Pending verification</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                        Review LPC / practice details before approving portal access and marketplace listing.
                    </p>
                    <ul className="mt-4 space-y-3">
                        {pending.length ? (
                            pending.map((p) => (
                                <li
                                    key={p.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] px-4 py-3"
                                >
                                    <div>
                                        <p className="font-semibold text-[#111827]">{p.firm_name}</p>
                                        <p className="text-sm text-[#6B7280]">
                                            {p.full_name} · {p.email}
                                            {p.lpc_number ? ` · LPC ${p.lpc_number}` : ''}
                                            {p.city ? ` · ${p.city}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className={PORTAL_PRIMARY_BTN}
                                            onClick={() => void review(p.id, 'approve')}
                                        >
                                            <ShieldCheck className="h-4 w-4" />
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            className={PORTAL_SECONDARY_BTN}
                                            onClick={() => void review(p.id, 'reject')}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <p className="text-sm text-[#6B7280]">No pending applications.</p>
                        )}
                    </ul>
                </section>

                <section className={`${CC_CARD_FLAT} overflow-hidden`}>
                    <div className="border-b border-[#E5E7EB] px-5 py-4">
                        <h2 className="text-lg font-semibold text-[#111827]">All conveyancer accounts</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-[#F8FAFC] text-[#6B7280]">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Firm</th>
                                    <th className="px-4 py-3 font-semibold">City</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((c) => (
                                    <tr key={c.id} className="border-t border-[#E5E7EB]">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[#111827]">{c.firm_name}</p>
                                            <p className="text-xs text-[#6B7280]">
                                                {c.full_name} · {c.email}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-[#6B7280]">{c.city || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                    c.status === 'approved'
                                                        ? 'bg-emerald-50 text-emerald-800'
                                                        : c.status === 'suspended' || c.status === 'rejected'
                                                          ? 'bg-red-50 text-red-700'
                                                          : 'bg-amber-50 text-amber-800'
                                                }`}
                                            >
                                                {c.status === 'approved' ? (
                                                    <BadgeCheck className="h-3.5 w-3.5" />
                                                ) : null}
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                {c.firm_slug ? (
                                                    <Link
                                                        href={`/conveyancers/firm/${c.firm_slug}`}
                                                        className={`${PORTAL_SECONDARY_BTN} !h-8 !px-3 !text-xs`}
                                                    >
                                                        Profile
                                                    </Link>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    className={`${PORTAL_SECONDARY_BTN} !h-8 !px-3 !text-xs`}
                                                    onClick={() => void review(c.id, 'approve')}
                                                >
                                                    Verify
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${PORTAL_SECONDARY_BTN} !h-8 !px-3 !text-xs`}
                                                    onClick={() => void review(c.id, 'suspend')}
                                                >
                                                    <Ban className="h-3.5 w-3.5" />
                                                    Suspend
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminShell>
    );
}
