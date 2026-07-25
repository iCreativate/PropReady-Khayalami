'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Download,
    FileText,
    MessageSquare,
    Send,
    Upload,
} from 'lucide-react';
import OriginatorPortalLayout from '@/components/OriginatorPortalLayout';
import PortalLoading from '@/components/PortalLoading';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { BUYER_DOCUMENT_ACCEPT, BUYER_DOCUMENT_SLOTS } from '@/lib/buyer-documents';
import { PREQUAL_STATUS_LABELS, type PrequalCaseStatus } from '@/lib/prequal-cases';
import {
    ORIGINATOR_CARD,
    ORIGINATOR_CARD_BODY,
    ORIGINATOR_CARD_HEADER,
    ORIGINATOR_INPUT,
    ORIGINATOR_PRIMARY_BTN,
    ORIGINATOR_SECONDARY_BTN,
    ORIGINATOR_TEXT_SECONDARY,
} from '@/lib/originator-portal-ui';

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

    if (loading && !caseData) {
        return (
            <OriginatorPortalLayout activePage="cases" user={user} title="Case">
                <PortalLoading variant="inline" message="Loading case…" />
            </OriginatorPortalLayout>
        );
    }

    if (!caseData) {
        return (
            <OriginatorPortalLayout activePage="cases" user={user} title="Case">
                <p className="text-red-600">{error || 'Case not found'}</p>
            </OriginatorPortalLayout>
        );
    }

    return (
        <OriginatorPortalLayout
            activePage="cases"
            user={user}
            title={caseData.buyerName || 'Buyer case'}
        >
            {(error || info) && (
                <div
                    className={`mb-4 p-3 rounded-2xl text-sm border ${
                        error
                            ? 'border-red-500/30 bg-red-500/5 text-red-700'
                            : 'border-green-500/30 bg-green-500/5 text-green-700'
                    }`}
                >
                    {error || info}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className={ORIGINATOR_CARD}>
                        <div className={ORIGINATOR_CARD_HEADER}>
                            <h2 className="text-lg font-semibold text-charcoal">Buyer</h2>
                        </div>
                        <div className={`${ORIGINATOR_CARD_BODY} space-y-2 text-sm`}>
                            <p>
                                <span className={ORIGINATOR_TEXT_SECONDARY}>Name · </span>
                                {caseData.buyerName || '—'}
                            </p>
                            <p>
                                <span className={ORIGINATOR_TEXT_SECONDARY}>Email · </span>
                                {caseData.buyerEmail || '—'}
                            </p>
                            <p>
                                <span className={ORIGINATOR_TEXT_SECONDARY}>Phone · </span>
                                {caseData.buyerPhone || '—'}
                            </p>
                            <p>
                                <span className={ORIGINATOR_TEXT_SECONDARY}>Status · </span>
                                {PREQUAL_STATUS_LABELS[caseData.status]}
                            </p>
                            {caseData.softAmount != null && (
                                <p>
                                    <span className={ORIGINATOR_TEXT_SECONDARY}>Soft amount · </span>
                                    R{Number(caseData.softAmount).toLocaleString('en-ZA')}
                                </p>
                            )}
                            {caseData.officialAmount != null && (
                                <p>
                                    <span className={ORIGINATOR_TEXT_SECONDARY}>Official · </span>
                                    R{Number(caseData.officialAmount).toLocaleString('en-ZA')}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={ORIGINATOR_CARD}>
                        <div className={ORIGINATOR_CARD_HEADER}>
                            <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gold" />
                                Documents
                            </h2>
                        </div>
                        <div className={`${ORIGINATOR_CARD_BODY} space-y-2`}>
                            {caseData.documents.length === 0 ? (
                                <p className={ORIGINATOR_TEXT_SECONDARY}>No documents attached</p>
                            ) : (
                                caseData.documents.map((d) => (
                                    <button
                                        key={d.documentId}
                                        type="button"
                                        onClick={() => void downloadDoc(d.documentId, d.name)}
                                        className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl border border-charcoal/[0.08] hover:border-gold/30 text-left"
                                    >
                                        <span className="font-medium text-charcoal truncate">
                                            {d.name || d.type || 'Document'}
                                        </span>
                                        <Download className="w-4 h-4 text-gold shrink-0" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className={ORIGINATOR_CARD}>
                        <div className={ORIGINATOR_CARD_HEADER}>
                            <h2 className="text-lg font-semibold text-charcoal">Request a document</h2>
                        </div>
                        <div className={`${ORIGINATOR_CARD_BODY} space-y-3`}>
                            <select
                                className={ORIGINATOR_INPUT}
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
                                className={ORIGINATOR_INPUT}
                                rows={2}
                                placeholder="Optional notes for the buyer"
                                value={reqNotes}
                                onChange={(e) => setReqNotes(e.target.value)}
                            />
                            <button
                                type="button"
                                disabled={requesting}
                                onClick={() => void requestDocument()}
                                className={ORIGINATOR_SECONDARY_BTN}
                            >
                                Request from buyer
                            </button>
                            {caseData.documentRequests.length > 0 && (
                                <ul className="mt-2 space-y-1 text-sm">
                                    {caseData.documentRequests.map((r) => (
                                        <li key={r.id} className={ORIGINATOR_TEXT_SECONDARY}>
                                            {r.label} · {r.status}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className={ORIGINATOR_CARD}>
                        <div className={ORIGINATOR_CARD_HEADER}>
                            <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                                <Upload className="w-5 h-5 text-gold" />
                                Upload prequal result
                            </h2>
                        </div>
                        <div className={`${ORIGINATOR_CARD_BODY} space-y-3`}>
                            <input
                                type="number"
                                className={ORIGINATOR_INPUT}
                                placeholder="Official amount (ZAR)"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <textarea
                                className={ORIGINATOR_INPUT}
                                rows={2}
                                placeholder="Notes (optional)"
                                value={resultNotes}
                                onChange={(e) => setResultNotes(e.target.value)}
                            />
                            <input
                                type="file"
                                accept={BUYER_DOCUMENT_ACCEPT}
                                onChange={(e) => setResultFile(e.target.files?.[0] || null)}
                            />
                            <button
                                type="button"
                                disabled={uploadingResult}
                                onClick={() => void uploadResult()}
                                className={ORIGINATOR_PRIMARY_BTN}
                            >
                                {uploadingResult ? 'Uploading…' : 'Submit result to buyer'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-3">
                    <div className={`${ORIGINATOR_CARD} flex flex-col min-h-[520px]`}>
                        <div className={ORIGINATOR_CARD_HEADER}>
                            <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-gold" />
                                Messages
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[420px]">
                            {caseData.messages.length === 0 ? (
                                <p className={ORIGINATOR_TEXT_SECONDARY}>No messages yet</p>
                            ) : (
                                caseData.messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`rounded-2xl px-4 py-3 text-sm max-w-[90%] ${
                                            m.senderRole === 'originator'
                                                ? 'ml-auto bg-gold/10 border border-gold/20'
                                                : 'bg-charcoal/[0.04] border border-charcoal/[0.06]'
                                        }`}
                                    >
                                        <p className="text-xs text-charcoal/45 mb-1">
                                            {m.senderName || m.senderRole} ·{' '}
                                            {new Date(m.createdAt).toLocaleString()}
                                        </p>
                                        <p className="text-charcoal whitespace-pre-wrap">{m.body}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t border-charcoal/[0.06] flex gap-2">
                            <input
                                className={`${ORIGINATOR_INPUT} flex-1`}
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
                                className={ORIGINATOR_PRIMARY_BTN}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </OriginatorPortalLayout>
    );
}
