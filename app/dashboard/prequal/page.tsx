'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, Upload } from 'lucide-react';
import UserPortalLayout from '@/components/UserPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import { useToast } from '@/components/providers/ToastProvider';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { bondOriginatorLabel } from '@/lib/bond-originators';
import {
    BUYER_DOCUMENT_ACCEPT,
    buyerDocumentTypeLabel,
    validateBuyerDocumentFile,
    type BuyerDocumentType,
} from '@/lib/buyer-documents';
import { confirmFullPrequalAmount } from '@/lib/buyer-full-prequal';
import {
    deleteDocumentBlob,
    saveDocumentBlob,
} from '@/lib/document-blobs';
import {
    PORTAL_CARD,
    PORTAL_CARD_BODY,
    PORTAL_CARD_HEADER,
    PORTAL_PAGE_CONTAINER,
    PORTAL_PRIMARY_BTN,
    PORTAL_SECONDARY_BTN,
    PORTAL_TEXT_SECONDARY,
} from '@/lib/portal-ui';
import { PREQUAL_STATUS_LABELS, type PrequalCaseStatus } from '@/lib/prequal-cases';

type CaseListItem = {
    id: string;
    organizationId: string;
    status: PrequalCaseStatus;
    softAmount: number | null;
    officialAmount: number | null;
    updatedAt: string;
};

type CaseDetail = {
    id: string;
    organizationId: string;
    status: PrequalCaseStatus;
    softAmount: number | null;
    officialAmount: number | null;
    messages: {
        id: string;
        senderRole: 'buyer' | 'originator';
        senderName: string | null;
        body: string;
        createdAt: string;
    }[];
    documentRequests: {
        id: string;
        label: string;
        status: string;
        docType: string;
    }[];
};

export default function BuyerPrequalPage() {
    const router = useRouter();
    const { user, isHydrated } = useHydratedBuyerPortalUser();
    const { success, error: toastError } = useToast();
    const [cases, setCases] = useState<CaseListItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [detail, setDetail] = useState<CaseDetail | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [fulfillingId, setFulfillingId] = useState<string | null>(null);

    const loadList = useCallback(async () => {
        if (!user?.id) return;
        const res = await fetch(`/api/prequal/cases/mine?userId=${encodeURIComponent(user.id)}`, {
            credentials: 'include',
            cache: 'no-store',
        });
        const data = await res.json();
        if (res.ok && data.success) {
            setCases(data.cases || []);
            if (!activeId && data.cases?.[0]?.id) setActiveId(data.cases[0].id);

            // Sync full prequal when originator posted a result
            for (const c of data.cases || []) {
                if (c.status === 'result_ready' && c.officialAmount) {
                    confirmFullPrequalAmount({
                        userId: user.id,
                        amount: Number(c.officialAmount),
                        originatorId: c.organizationId,
                    });
                }
            }
        }
    }, [user?.id, activeId]);

    const loadDetail = useCallback(async (caseId: string) => {
        if (!user?.id) return;
        const res = await fetch(
            `/api/prequal/cases/${caseId}?userId=${encodeURIComponent(user.id)}`,
            { credentials: 'include', cache: 'no-store' }
        );
        const data = await res.json();
        if (res.ok && data.success) {
            setDetail(data.case);
            if (data.case.status === 'result_ready' && data.case.officialAmount) {
                confirmFullPrequalAmount({
                    userId: user.id,
                    amount: Number(data.case.officialAmount),
                    originatorId: data.case.organizationId,
                });
            }
        }
    }, [user?.id]);

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) {
            router.push('/login');
            return;
        }
        setLoading(true);
        void loadList().finally(() => setLoading(false));
    }, [isHydrated, user, router, loadList]);

    useEffect(() => {
        if (activeId) void loadDetail(activeId);
    }, [activeId, loadDetail]);

    useEffect(() => {
        if (!activeId) return;
        const t = setInterval(() => void loadDetail(activeId), 15000);
        return () => clearInterval(t);
    }, [activeId, loadDetail]);

    async function sendMessage() {
        if (!user?.id || !activeId || !message.trim()) return;
        const res = await fetch(`/api/prequal/cases/${activeId}/messages`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                body: message.trim(),
                userId: user.id,
                senderName: user.fullName,
            }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            toastError(data.error || 'Could not send');
            return;
        }
        setMessage('');
        await loadDetail(activeId);
    }

    async function fulfillRequest(requestId: string, docType: string, file: File) {
        if (!user?.id || !activeId) return;
        const validationError = validateBuyerDocumentFile(file);
        if (validationError) {
            toastError(validationError);
            return;
        }
        setFulfillingId(requestId);
        try {
            const documentId = `doc-${docType}-${Date.now()}`;
            await saveDocumentBlob(documentId, file);
            const form = new FormData();
            form.append('userId', user.id);
            form.append('documentId', documentId);
            form.append('type', docType);
            form.append('file', file);
            const up = await fetch('/api/documents/upload', { method: 'POST', body: form });
            const upData = await up.json();
            if (!up.ok || !upData.success) {
                await deleteDocumentBlob(documentId);
                throw new Error(upData.error || 'Upload failed');
            }

            const res = await fetch(`/api/prequal/cases/${activeId}/fulfill-request`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId,
                    documentId,
                    userId: user.id,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Could not fulfill request');
            success('Document uploaded for the originator');
            await loadDetail(activeId);
            await loadList();
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setFulfillingId(null);
        }
    }

    return (
        <UserPortalLayout
            portal="buyer"
            activePage="prequal"
            user={user}
            pageHeader={
                <PortalPageHeader
                    eyebrow="Bond originator"
                    title="Your prequalification"
                    description="Message your originator, respond to document requests, and see when your full prequal result is ready."
                />
            }
        >
            <div className={`${PORTAL_PAGE_CONTAINER} px-4 py-8 space-y-6`}>
                <div className="flex flex-wrap gap-3">
                    <Link href="/dashboard/documents" className={PORTAL_SECONDARY_BTN}>
                        Upload / send FICA docs
                    </Link>
                </div>

                {loading ? (
                    <p className={PORTAL_TEXT_SECONDARY}>Loading…</p>
                ) : cases.length === 0 ? (
                    <div className={`${PORTAL_CARD} p-8`}>
                        <p className="font-semibold text-charcoal">No prequal cases yet</p>
                        <p className={`mt-2 ${PORTAL_TEXT_SECONDARY}`}>
                            Choose a bond originator and send your FICA documents to start a case.
                        </p>
                        <Link href="/dashboard/documents" className={`${PORTAL_PRIMARY_BTN} mt-4 inline-flex`}>
                            Go to documents
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            {cases.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setActiveId(c.id)}
                                    className={`${PORTAL_CARD} w-full p-4 text-left ${
                                        activeId === c.id ? 'border-gold/40' : ''
                                    }`}
                                >
                                    <p className="font-semibold text-charcoal">
                                        {bondOriginatorLabel(c.organizationId)}
                                    </p>
                                    <p className={`text-sm mt-1 ${PORTAL_TEXT_SECONDARY}`}>
                                        {PREQUAL_STATUS_LABELS[c.status]}
                                        {c.officialAmount
                                            ? ` · R${Number(c.officialAmount).toLocaleString('en-ZA')}`
                                            : ''}
                                    </p>
                                </button>
                            ))}
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            {detail && (
                                <>
                                    {detail.documentRequests.filter((r) => r.status === 'requested').length >
                                        0 && (
                                        <div className={PORTAL_CARD}>
                                            <div className={PORTAL_CARD_HEADER}>
                                                <h2 className="font-semibold text-charcoal flex items-center gap-2">
                                                    <Upload className="w-5 h-5 text-gold" />
                                                    Documents requested
                                                </h2>
                                            </div>
                                            <div className={`${PORTAL_CARD_BODY} space-y-3`}>
                                                {detail.documentRequests
                                                    .filter((r) => r.status === 'requested')
                                                    .map((r) => (
                                                        <div
                                                            key={r.id}
                                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-charcoal/[0.08]"
                                                        >
                                                            <div>
                                                                <p className="font-medium text-charcoal">
                                                                    {r.label}
                                                                </p>
                                                                <p className={`text-xs ${PORTAL_TEXT_SECONDARY}`}>
                                                                    {buyerDocumentTypeLabel(
                                                                        r.docType as BuyerDocumentType
                                                                    )}{' '}
                                                                    · Max 3MB PDF/JPG/PNG
                                                                </p>
                                                            </div>
                                                            <label
                                                                className={`${PORTAL_PRIMARY_BTN} !h-auto !py-2 cursor-pointer ${
                                                                    fulfillingId === r.id
                                                                        ? 'opacity-60 pointer-events-none'
                                                                        : ''
                                                                }`}
                                                            >
                                                                {fulfillingId === r.id
                                                                    ? 'Uploading…'
                                                                    : 'Upload'}
                                                                <input
                                                                    type="file"
                                                                    accept={BUYER_DOCUMENT_ACCEPT}
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const f = e.target.files?.[0];
                                                                        if (f) {
                                                                            void fulfillRequest(
                                                                                r.id,
                                                                                r.docType,
                                                                                f
                                                                            );
                                                                        }
                                                                        e.target.value = '';
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className={`${PORTAL_CARD} flex flex-col min-h-[420px]`}>
                                        <div className={PORTAL_CARD_HEADER}>
                                            <h2 className="font-semibold text-charcoal flex items-center gap-2">
                                                <MessageSquare className="w-5 h-5 text-gold" />
                                                Messages with{' '}
                                                {bondOriginatorLabel(detail.organizationId)}
                                            </h2>
                                        </div>
                                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[360px]">
                                            {detail.messages.length === 0 ? (
                                                <p className={PORTAL_TEXT_SECONDARY}>No messages yet</p>
                                            ) : (
                                                detail.messages.map((m) => (
                                                    <div
                                                        key={m.id}
                                                        className={`rounded-2xl px-4 py-3 text-sm max-w-[90%] ${
                                                            m.senderRole === 'buyer'
                                                                ? 'ml-auto bg-gold/10 border border-gold/20'
                                                                : 'bg-charcoal/[0.04] border border-charcoal/[0.06]'
                                                        }`}
                                                    >
                                                        <p className="text-xs text-charcoal/45 mb-1">
                                                            {m.senderName || m.senderRole} ·{' '}
                                                            {new Date(m.createdAt).toLocaleString()}
                                                        </p>
                                                        <p className="whitespace-pre-wrap text-charcoal">
                                                            {m.body}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="p-4 border-t border-charcoal/[0.06] flex gap-2">
                                            <input
                                                className="form-control flex-1"
                                                placeholder="Write a message…"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        void sendMessage();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className={PORTAL_PRIMARY_BTN}
                                                onClick={() => void sendMessage()}
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </UserPortalLayout>
    );
}
