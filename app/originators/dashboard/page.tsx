'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, RefreshCw } from 'lucide-react';
import OriginatorPortalLayout from '@/components/OriginatorPortalLayout';
import PortalLoading from '@/components/PortalLoading';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { bondOriginatorLabel } from '@/lib/bond-originators';
import { PREQUAL_STATUS_LABELS, type PrequalCaseStatus } from '@/lib/prequal-cases';
import {
    ORIGINATOR_CARD,
    ORIGINATOR_EMPTY,
    ORIGINATOR_EMPTY_DESC,
    ORIGINATOR_EMPTY_ICON,
    ORIGINATOR_EMPTY_TITLE,
    ORIGINATOR_PRIMARY_BTN,
    ORIGINATOR_SECONDARY_BTN,
    ORIGINATOR_TEXT_SECONDARY,
} from '@/lib/originator-portal-ui';

type CaseSummary = {
    id: string;
    buyerName: string | null;
    buyerEmail: string | null;
    status: PrequalCaseStatus;
    softAmount: number | null;
    officialAmount: number | null;
    submittedAt: string;
    updatedAt: string;
};

type OriginatorUser = {
    id: string;
    fullName: string;
    email: string;
    organizationId?: string;
};

export default function OriginatorDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<OriginatorUser | null>(null);
    const [cases, setCases] = useState<CaseSummary[]>([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

            const res = await fetch(
                `/api/prequal/cases${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`,
                { credentials: 'include', cache: 'no-store' }
            );
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
    }, [router, statusFilter]);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <OriginatorPortalLayout
            activePage="dashboard"
            user={user}
            title="Prequal inbox"
            pageHeader={
                <div>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-charcoal tracking-tight">
                        Buyer prequalification cases
                    </h2>
                    <p className={`mt-2 ${ORIGINATOR_TEXT_SECONDARY}`}>
                        {bondOriginatorLabel(user?.organizationId) || 'Your organisation'} · respond to
                        buyers, request documents, and upload results
                    </p>
                </div>
            }
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-control max-w-xs"
                >
                    <option value="all">All statuses</option>
                    {(Object.keys(PREQUAL_STATUS_LABELS) as PrequalCaseStatus[]).map((s) => (
                        <option key={s} value={s}>
                            {PREQUAL_STATUS_LABELS[s]}
                        </option>
                    ))}
                </select>
                <button type="button" onClick={() => void load()} className={ORIGINATOR_SECONDARY_BTN}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-700 text-sm">
                    {error}
                    {error.includes('migration') ? null : (
                        <p className="mt-1 text-red-600/80">
                            If tables are missing, run{' '}
                            <code className="text-xs">supabase/migrations/20260719_originator_portal.sql</code>
                        </p>
                    )}
                </div>
            )}

            {loading && cases.length === 0 ? (
                <PortalLoading variant="inline" message="Loading cases…" />
            ) : cases.length === 0 ? (
                <div className={`${ORIGINATOR_CARD} p-10`}>
                    <div className={ORIGINATOR_EMPTY}>
                        <div className={ORIGINATOR_EMPTY_ICON}>
                            <ChevronRight className="w-6 h-6 text-charcoal/30" />
                        </div>
                        <p className={ORIGINATOR_EMPTY_TITLE}>No cases yet</p>
                        <p className={ORIGINATOR_EMPTY_DESC}>
                            When buyers send FICA documents to{' '}
                            {bondOriginatorLabel(user?.organizationId) || 'your brand'}, they appear here.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {cases.map((c) => (
                        <Link
                            key={c.id}
                            href={`/originators/cases/${c.id}`}
                            className={`${ORIGINATOR_CARD} p-5 flex items-center justify-between gap-4 hover:border-gold/30 transition`}
                        >
                            <div className="min-w-0">
                                <p className="font-semibold text-charcoal truncate">
                                    {c.buyerName || c.buyerEmail || 'Buyer'}
                                </p>
                                <p className={`text-sm mt-1 ${ORIGINATOR_TEXT_SECONDARY}`}>
                                    {PREQUAL_STATUS_LABELS[c.status]}
                                    {c.softAmount != null
                                        ? ` · Soft R${Number(c.softAmount).toLocaleString('en-ZA')}`
                                        : ''}
                                    {c.officialAmount != null
                                        ? ` · Official R${Number(c.officialAmount).toLocaleString('en-ZA')}`
                                        : ''}
                                </p>
                                <p className="text-xs text-charcoal/40 mt-1">
                                    Updated {new Date(c.updatedAt).toLocaleString()}
                                </p>
                            </div>
                            <span className={`${ORIGINATOR_PRIMARY_BTN} !h-auto !py-2 !px-3 shrink-0`}>
                                Open
                                <ChevronRight className="w-4 h-4" />
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </OriginatorPortalLayout>
    );
}
