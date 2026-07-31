'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Download,
    FileText,
    MessageSquare,
    Send,
    Upload,
} from 'lucide-react';
import OriginatorPortalLayout from '@/components/OriginatorPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { BUYER_DOCUMENT_ACCEPT, BUYER_DOCUMENT_SLOTS } from '@/lib/buyer-documents';
import { PREQUAL_STATUS_LABELS, type PrequalCaseStatus } from '@/lib/prequal-cases';

type Message = {
    id: string;
    senderRole: 'buyer' | 'originator';
    senderName: string | null;
    body: string;
    createdAt: string;
};

type CaseDetail = {
    id: string;
    buyerName: string | null;
    buyerEmail: string | null;
    buyerPhone: string | null;
    buyerUserId: string;
    status: PrequalCaseStatus;
    softAmount: number | null;
    officialAmount: number | null;
    documents: { documentId: string; name: string | null; type: string | null }[];
    messages: Message[];
    documentRequests: {
        id: string;
        label: string;
        status: string;
        docType: string;
    }[];
};

const CARD =
    'rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]';
const CARD_HEADER = 'border-b border-[#E5E7EB] px-5 py-3.5';
const CARD_BODY = 'px-5 py-4';
const INPUT =
    'h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition hover:border-[#D1D5DB] focus:border-[#E52323]/50 focus:outline-none focus:ring-2 focus:ring-[#E52323]/20';
const TEXTAREA =
    'w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition hover:border-[#D1D5DB] focus:border-[#E52323]/50 focus:outline-none focus:ring-2 focus:ring-[#E52323]/20 resize-y';
const PRIMARY_BTN =
    'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E52323] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c91d1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 disabled:opacity-50 disabled:pointer-events-none';
const SECONDARY_BTN =
    'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/40 disabled:opacity-50 disabled:pointer-events-none';

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

function initials(name: string | null, email: string | null) {
    const source = (name || email || '?').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                {label}
            </p>
            <p className="mt-1 text-sm font-medium text-[#111827]">{value}</p>
        </div>
    );
}

function CaseSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-9 w-24 animate-pulse rounded-xl bg-[#E5E7EB]" />
                <div className="h-8 flex-1 max-w-xs animate-pulse rounded-lg bg-[#E5E7EB]" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div className="space-y-4 lg:col-span-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className={`${CARD} h-36 animate-pulse`}
                        />
                    ))}
                </div>
                <div className={`${CARD} lg:col-span-2 h-[480px] animate-pulse`} />
            </div>
        </div>
    );
}

export default function OriginatorCasePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [user, setUser] = useState<{
        fullName: string;
        email: string;
        organizationId?: string;
    } | null>(null);
    const [caseData, setCaseData] = useState<CaseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [reqType, setReqType] = useState('id');
    const [reqNotes, setReqNotes] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [amount, setAmount] = useState('');
    const [resultNotes, setResultNotes] = useState('');
    const [resultFile, setResultFile] = useState<File | null>(null);
    const [uploadingResult, setUploadingResult] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

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
                fullName: bridged.fullName || bridged.email,
                email: bridged.email,
                organizationId: bridged.organizationId || bridged.company,
            });

            const res = await fetch(`/api/prequal/cases/${id}`, {
                credentials: 'include',
                cache: 'no-store',
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Case not found');
            setCaseData(data.case);
            if (data.case.officialAmount) setAmount(String(data.case.officialAmount));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load case');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        void load();
        const t = setInterval(() => void load(), 20000);
        return () => clearInterval(t);
    }, [load]);

    async function sendMessage() {
        if (!message.trim()) return;
        setSending(true);
        setError('');
        try {
            const res = await fetch(`/api/prequal/cases/${id}/messages`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: message.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Send failed');
            setMessage('');
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Send failed');
        } finally {
            setSending(false);
        }
    }

    async function requestDocument() {
        setRequesting(true);
        setError('');
        setInfo('');
        try {
            const res = await fetch(`/api/prequal/cases/${id}/document-requests`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docType: reqType, notes: reqNotes }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Request failed');
            setReqNotes('');
            setInfo('Document request sent to buyer');
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Request failed');
        } finally {
            setRequesting(false);
        }
    }

    async function uploadResult() {
        if (!resultFile) {
            setError('Attach the prequal letter file');
            return;
        }
        setUploadingResult(true);
        setError('');
        setInfo('');
        try {
            const form = new FormData();
            form.append('officialAmount', amount);
            form.append('notes', resultNotes);
            form.append('file', resultFile);
            const res = await fetch(`/api/prequal/cases/${id}/result`, {
                method: 'POST',
                credentials: 'include',
                body: form,
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed');
            setInfo('Prequal result uploaded — buyer can see the official amount');
            setResultFile(null);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploadingResult(false);
        }
    }

    async function downloadDoc(documentId: string, name: string | null) {
        if (!caseData) return;
        const res = await fetch(
            `/api/documents/download?userId=${encodeURIComponent(caseData.buyerUserId)}&documentId=${encodeURIComponent(documentId)}`
        );
        const data = await res.json();
        if (!res.ok || !data.url) {
            setError(data.error || 'Download unavailable');
            return;
        }
        window.open(data.url, '_blank', 'noopener,noreferrer');
        void name;
    }

    const buyerDisplayName = caseData?.buyerName || caseData?.buyerEmail || 'Buyer case';

    if (loading && !caseData) {
        return (
            <OriginatorPortalLayout activePage="cases" user={user} title="Case">
                <CaseSkeleton />
            </OriginatorPortalLayout>
        );
    }

    if (!caseData) {
        return (
            <OriginatorPortalLayout activePage="cases" user={user} title="Case">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error || 'Case not found'}
                </div>
            </OriginatorPortalLayout>
        );
    }

    return (
        <OriginatorPortalLayout
            activePage="cases"
            user={user}
            title={buyerDisplayName}
            pageHeader={
                <PortalPageHeader
                    size="compact"
                    eyebrow="Prequalification case"
                    title={buyerDisplayName}
                    description={
                        caseData.buyerEmail
                            ? `Manage documents, messages, and status for ${caseData.buyerEmail}.`
                            : 'Manage documents, messages, and case progress.'
                    }
                />
            }
        >
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/originators/dashboard"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-[#6B7280] transition hover:bg-white hover:text-[#111827]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <span className="hidden sm:inline text-[#E5E7EB]">|</span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-semibold text-white">
                            {initials(caseData.buyerName, caseData.buyerEmail)}
                        </div>
                        <span
                            className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusTone(caseData.status)}`}
                        >
                            {PREQUAL_STATUS_LABELS[caseData.status]}
                        </span>
                    </div>
                </div>

                {(error || info) && (
                    <div
                        className={`rounded-xl border px-4 py-2.5 text-sm ${
                            error
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                    >
                        {error || info}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-start">
                    {/* Left column — case info, docs, requests, result */}
                    <div className="space-y-4 lg:col-span-3">
                        <div className={CARD}>
                            <div className={CARD_HEADER}>
                                <h3 className="text-sm font-semibold text-[#111827]">Buyer details</h3>
                            </div>
                            <div className={`${CARD_BODY} grid grid-cols-1 gap-4 sm:grid-cols-2`}>
                                <InfoRow label="Name" value={caseData.buyerName || '—'} />
                                <InfoRow label="Email" value={caseData.buyerEmail || '—'} />
                                <InfoRow label="Phone" value={caseData.buyerPhone || '—'} />
                                <InfoRow
                                    label="Status"
                                    value={PREQUAL_STATUS_LABELS[caseData.status]}
                                />
                                {caseData.softAmount != null ? (
                                    <InfoRow
                                        label="Soft amount"
                                        value={`R${Number(caseData.softAmount).toLocaleString('en-ZA')}`}
                                    />
                                ) : null}
                                {caseData.officialAmount != null ? (
                                    <InfoRow
                                        label="Official amount"
                                        value={`R${Number(caseData.officialAmount).toLocaleString('en-ZA')}`}
                                    />
                                ) : null}
                            </div>
                        </div>

                        <div className={CARD}>
                            <div className={CARD_HEADER}>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                                    <FileText className="h-4 w-4 text-[#E52323]" />
                                    Documents
                                </h3>
                            </div>
                            <div className={`${CARD_BODY} space-y-2`}>
                                {caseData.documents.length === 0 ? (
                                    <p className="text-sm text-[#6B7280]">No documents attached</p>
                                ) : (
                                    caseData.documents.map((d) => (
                                        <button
                                            key={d.documentId}
                                            type="button"
                                            onClick={() => void downloadDoc(d.documentId, d.name)}
                                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-left transition hover:border-[#E52323]/30 hover:bg-[#F8FAFC]"
                                        >
                                            <span className="truncate text-sm font-medium text-[#111827]">
                                                {d.name || d.type || 'Document'}
                                            </span>
                                            <Download className="h-4 w-4 shrink-0 text-[#E52323]" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className={CARD}>
                            <div className={CARD_HEADER}>
                                <h3 className="text-sm font-semibold text-[#111827]">
                                    Request a document
                                </h3>
                            </div>
                            <div className={`${CARD_BODY} space-y-3`}>
                                <select
                                    className={INPUT}
                                    value={reqType}
                                    onChange={(e) => setReqType(e.target.value)}
                                >
                                    {BUYER_DOCUMENT_SLOTS.map((s) => (
                                        <option key={s.type} value={s.type}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                                <textarea
                                    className={TEXTAREA}
                                    rows={2}
                                    placeholder="Optional notes for the buyer"
                                    value={reqNotes}
                                    onChange={(e) => setReqNotes(e.target.value)}
                                />
                                <button
                                    type="button"
                                    disabled={requesting}
                                    onClick={() => void requestDocument()}
                                    className={SECONDARY_BTN}
                                >
                                    {requesting ? 'Sending…' : 'Request from buyer'}
                                </button>
                                {caseData.documentRequests.length > 0 ? (
                                    <ul className="space-y-1.5 border-t border-[#E5E7EB] pt-3">
                                        {caseData.documentRequests.map((r) => (
                                            <li
                                                key={r.id}
                                                className="flex items-center justify-between gap-2 text-sm text-[#6B7280]"
                                            >
                                                <span className="font-medium text-[#111827]">
                                                    {r.label}
                                                </span>
                                                <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5 text-xs">
                                                    {r.status}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        </div>

                        <div className={CARD}>
                            <div className={CARD_HEADER}>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                                    <Upload className="h-4 w-4 text-[#E52323]" />
                                    Upload prequal result
                                </h3>
                            </div>
                            <div className={`${CARD_BODY} space-y-3`}>
                                <input
                                    type="number"
                                    className={INPUT}
                                    placeholder="Official amount (ZAR)"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <textarea
                                    className={TEXTAREA}
                                    rows={2}
                                    placeholder="Notes (optional)"
                                    value={resultNotes}
                                    onChange={(e) => setResultNotes(e.target.value)}
                                />
                                <input
                                    type="file"
                                    accept={BUYER_DOCUMENT_ACCEPT}
                                    onChange={(e) => setResultFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-[#6B7280] file:mr-3 file:rounded-lg file:border-0 file:bg-[#F8FAFC] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111827] hover:file:bg-[#E5E7EB]"
                                />
                                <button
                                    type="button"
                                    disabled={uploadingResult}
                                    onClick={() => void uploadResult()}
                                    className={`${PRIMARY_BTN} w-full sm:w-auto`}
                                >
                                    {uploadingResult ? 'Uploading…' : 'Submit result to buyer'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right column — sticky chat */}
                    <div className="lg:col-span-2 lg:sticky lg:top-4">
                        <div className={`${CARD} flex flex-col min-h-[420px] lg:min-h-[calc(100dvh-8rem)]`}>
                            <div className={CARD_HEADER}>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                                    <MessageSquare className="h-4 w-4 text-[#E52323]" />
                                    Messages
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 max-h-[360px] lg:max-h-none">
                                {caseData.messages.length === 0 ? (
                                    <p className="text-sm text-[#6B7280]">No messages yet</p>
                                ) : (
                                    caseData.messages.map((m) => (
                                        <div
                                            key={m.id}
                                            className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[92%] ${
                                                m.senderRole === 'originator'
                                                    ? 'ml-auto bg-[#E52323]/[0.08] border border-[#E52323]/20'
                                                    : 'bg-[#F8FAFC] border border-[#E5E7EB]'
                                            }`}
                                        >
                                            <p className="mb-1 text-[11px] text-[#6B7280]">
                                                {m.senderName || m.senderRole} ·{' '}
                                                {new Date(m.createdAt).toLocaleString()}
                                            </p>
                                            <p className="whitespace-pre-wrap text-[#111827]">
                                                {m.body}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="border-t border-[#E5E7EB] p-3 flex gap-2">
                                <input
                                    className={`${INPUT} flex-1`}
                                    placeholder="Write a message…"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            void sendMessage();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    disabled={sending || !message.trim()}
                                    onClick={() => void sendMessage()}
                                    className={`${PRIMARY_BTN} !px-3.5 shrink-0`}
                                    aria-label="Send message"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OriginatorPortalLayout>
    );
}
