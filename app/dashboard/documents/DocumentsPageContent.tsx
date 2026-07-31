'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertCircle,
    Building2,
    CheckCircle,
    Download,
    Eye,
    FileText,
    Send,
    Upload,
    X,
} from 'lucide-react';
import UserPortalLayout from '@/components/UserPortalLayout';
import PortalPageHeader from '@/components/PortalPageHeader';
import BondOriginatorSlider from '@/components/BondOriginatorSlider';
import BuyerDocumentPreviewModal from '@/components/BuyerDocumentPreviewModal';
import { useToast } from '@/components/providers/ToastProvider';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { logActivity } from '@/lib/activity';
import { bondOriginatorLabel, type BondOriginator } from '@/lib/bond-originators';
import {
    BUYER_DOCUMENT_ACCEPT,
    BUYER_DOCUMENT_SLOTS,
    BUYER_DOCUMENT_TYPES,
    buyerDocumentDisplayFileName,
    buyerDocumentTypeLabel,
    formatFileSize,
    readBuyerDocumentsLocal,
    refreshBuyerDocumentsFromApi,
    validateBuyerDocumentFile,
    type BuyerDocument,
    type BuyerDocumentType,
} from '@/lib/buyer-documents';
import {
    deleteDocumentBlob,
    downloadBlob,
    getDocumentBlob,
    saveDocumentBlob,
} from '@/lib/document-blobs';
import { saveLeadDocumentsLocally } from '@/lib/lead-documents';
import { markOriginatorPrequalPending } from '@/lib/buyer-full-prequal';
import { resolveBuyerQuizResultSync } from '@/lib/quiz-result';
import {
    PORTAL_CALLOUT,
    PORTAL_CARD,
    PORTAL_CARD_HEADER,
    PORTAL_PAGE_CONTAINER,
    PORTAL_PRIMARY_BTN,
    PORTAL_SECONDARY_BTN,
    PORTAL_STAT_ICON,
} from '@/lib/portal-ui';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import PortalLoading from '@/components/PortalLoading';

function parseUploadTypeHint(value: string | null): BuyerDocumentType | undefined {
    if (!value) return undefined;
    return BUYER_DOCUMENT_TYPES.includes(value as BuyerDocumentType)
        ? (value as BuyerDocumentType)
        : undefined;
}

function persistBuyerDocuments(userId: string, docs: BuyerDocument[]) {
    localStorage.setItem(STORAGE_KEYS.documents, JSON.stringify(docs));
    saveLeadDocumentsLocally(userId, docs);
}

function getStatusBadge(status: BuyerDocument['status']) {
    const badges = {
        verified: {
            bg: 'bg-green-500/15',
            text: 'text-green-700',
            icon: CheckCircle,
            label: 'Verified',
        },
        uploaded: {
            bg: 'bg-blue-500/15',
            text: 'text-blue-700',
            icon: Upload,
            label: 'Uploaded',
        },
        pending: {
            bg: 'bg-yellow-500/15',
            text: 'text-yellow-700',
            icon: AlertCircle,
            label: 'Pending Review',
        },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
        >
            <Icon className="w-3 h-3" />
            {badge.label}
        </span>
    );
}

export default function DocumentsPageContent() {
    const router = useRouter();
    const [uploadTypeHint, setUploadTypeHint] = useState<BuyerDocumentType | undefined>();
    const { user, isHydrated } = useHydratedBuyerPortalUser();
    const { success, error: toastError } = useToast();

    const [documents, setDocuments] = useState<BuyerDocument[]>([]);
    const [uploadError, setUploadError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingType, setUploadingType] = useState<BuyerDocumentType | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedOriginator, setSelectedOriginator] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [sendError, setSendError] = useState('');
    const [previewDoc, setPreviewDoc] = useState<BuyerDocument | null>(null);
    const [prequalSkipped, setPrequalSkipped] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setUploadTypeHint(parseUploadTypeHint(params.get('type')));
    }, []);

    useEffect(() => {
        if (!isHydrated) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (!user.id) return;

        const localDocs = readBuyerDocumentsLocal(user.id);
        setDocuments(localDocs);
        void refreshBuyerDocumentsFromApi(user.id, localDocs).then(setDocuments);

        const storedOriginator = localStorage.getItem(STORAGE_KEYS.selectedOriginator);
        if (storedOriginator) {
            setSelectedOriginator(storedOriginator);
        }
        setPrequalSkipped(localStorage.getItem(STORAGE_KEYS.prequalSkipped) === '1');
    }, [isHydrated, user, router]);

    const uploadSingleFile = useCallback(
        async (
            file: File,
            userId: string,
            docType: BuyerDocumentType,
            existing?: BuyerDocument | null
        ): Promise<BuyerDocument> => {
            const validationError = validateBuyerDocumentFile(file);
            if (validationError) {
                throw new Error(validationError);
            }

            const documentId =
                existing?.id ?? `doc-${docType}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const displayName = buyerDocumentTypeLabel(docType);

            const optimisticDoc: BuyerDocument = {
                id: documentId,
                name: displayName,
                type: docType,
                status: 'uploaded',
                uploadedAt: new Date().toISOString(),
                size: formatFileSize(file.size),
            };

            if (existing?.id && existing.id !== documentId) {
                await deleteDocumentBlob(existing.id);
            }
            await saveDocumentBlob(documentId, file);

            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('documentId', documentId);
            formData.append('type', docType);
            formData.append('file', file, buyerDocumentDisplayFileName(docType, file.name));

            const res = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                await deleteDocumentBlob(documentId);
                throw new Error(data.error || 'Upload failed');
            }

            return (data.document as BuyerDocument) ?? optimisticDoc;
        },
        []
    );

    const handleSlotUpload = async (docType: BuyerDocumentType, files: FileList | null) => {
        const file = files?.[0];
        if (!file || !user?.id) return;

        setUploadError('');
        setIsUploading(true);
        setUploadingType(docType);
        setUploadTypeHint(docType);

        try {
            const existing = documents.find((d) => d.type === docType) ?? null;
            const doc = await uploadSingleFile(file, user.id, docType, existing);
            const updatedDocs = [
                ...documents.filter((d) => d.type !== docType && d.id !== doc.id),
                doc,
            ];
            setDocuments(updatedDocs);
            persistBuyerDocuments(user.id, updatedDocs);
            logActivity(`Uploaded ${doc.name}`, user.id);
            success(`${doc.name} uploaded`);
        } catch (err) {
            const message = err instanceof Error ? err.message : `Failed to upload ${file.name}`;
            setUploadError(message);
            toastError(message);
        }

        setUploadingType(null);
        setIsUploading(false);
    };

    const handleSlotFileInput =
        (docType: BuyerDocumentType) => (e: React.ChangeEvent<HTMLInputElement>) => {
            void handleSlotUpload(docType, e.target.files);
            e.target.value = '';
        };

    const handleDelete = async (docId: string) => {
        if (!user?.id || deletingId) return;

        const target = documents.find((doc) => doc.id === docId);
        if (!target) return;

        setDeletingId(docId);
        setUploadError('');

        try {
            const res = await fetch('/api/documents/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, documentId: docId }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to remove document');
            }

            const updatedDocs = documents.filter((doc) => doc.id !== docId);
            setDocuments(updatedDocs);
            persistBuyerDocuments(user.id, updatedDocs);
            await deleteDocumentBlob(docId);
            logActivity(`Removed ${target.name}`, user.id);
            success(`${target.name} removed`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to remove document';
            setUploadError(message);
            toastError(message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = async (doc: BuyerDocument) => {
        const localBlob = await getDocumentBlob(doc.id);
        if (localBlob) {
            downloadBlob(localBlob, doc.name);
            return;
        }

        if (!user?.id) return;

        try {
            const res = await fetch(
                `/api/documents/download?userId=${encodeURIComponent(user.id)}&documentId=${encodeURIComponent(doc.id)}`
            );
            const data = await res.json();
            if (!res.ok || !data.url) {
                toastError(data.error || 'Download unavailable');
                return;
            }

            const fileRes = await fetch(data.url);
            if (!fileRes.ok) {
                toastError('Download unavailable');
                return;
            }

            const blob = await fileRes.blob();
            downloadBlob(blob, data.name || doc.name);
        } catch {
            toastError('Download unavailable');
        }
    };

    const handleOriginatorSelect = (originator: BondOriginator) => {
        setSelectedOriginator(originator.id);
        localStorage.setItem(STORAGE_KEYS.selectedOriginator, originator.id);
        localStorage.removeItem(STORAGE_KEYS.prequalSkipped);
        setPrequalSkipped(false);
    };

    const handleSendToOriginator = async () => {
        if (!selectedOriginator) {
            setSendError('Please select a bond originator first.');
            return;
        }

        if (documents.length === 0) {
            setSendError('Please upload at least one document before sending.');
            return;
        }

        if (!user?.id) return;

        setIsSending(true);
        setSendError('');
        setSendSuccess(false);

        try {
            const originatorName = bondOriginatorLabel(selectedOriginator) || 'bond originator';
            const quiz = resolveBuyerQuizResultSync(user);

            const res = await fetch('/api/prequal/cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    userId: user.id,
                    organizationId: selectedOriginator,
                    documentIds: documents.map((d) => d.id),
                    softAmount: quiz?.preQualAmount ?? null,
                    buyerName: user.fullName,
                    buyerEmail: user.email,
                    buyerPhone: user.phone,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to send documents');
            }

            const sentData = {
                originatorId: selectedOriginator,
                originatorName,
                caseId: data.case?.id,
                documents: documents.map((doc) => ({
                    id: doc.id,
                    name: doc.name,
                    type: doc.type,
                })),
                sentAt: new Date().toISOString(),
                userId: user.id,
            };

            localStorage.setItem(STORAGE_KEYS.documentsSent, JSON.stringify(sentData));
            markOriginatorPrequalPending({
                userId: user.id,
                softAmount: quiz?.preQualAmount ?? null,
                originatorId: selectedOriginator,
            });
            logActivity(`Documents sent to ${originatorName}`, user.id);
            setSendSuccess(true);
success(
                `Documents sent to ${originatorName}. Open My Prequal to message them.`
            );
            router.push('/dashboard/prequal');

            setTimeout(() => {
                setSendSuccess(false);
            }, 5000);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Failed to send documents. Please try again.';
            setSendError(message);
            toastError(message);
        } finally {
            setIsSending(false);
        }
    };

    if (!isHydrated) {
        return <PortalLoading message="Loading documents…" variant="dashboard" />;
    }

    if (!user) {
        return <PortalLoading message="Loading documents…" variant="dashboard" />;
    }

    const selectedOriginatorName = bondOriginatorLabel(selectedOriginator);

    return (
        <>
            <UserPortalLayout
                portal="buyer"
                activePage="documents"
                user={user}
                title="Documents"
                pageHeader={
                    <PortalPageHeader
                        variant="premium"
                        eyebrow="Optional platform prequalification"
                        title="Bond Originators & Documents"
                        description="Upload FICA documents and optionally prequalify with a PropReady bond originator — free for you. You can skip this and use your agent’s originator instead."
                    >
                        <div className="mt-6 flex flex-wrap gap-3">
                            <div className="px-4 py-2 rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
                                    Uploaded
                                </p>
                                <p className="text-lg font-bold text-white tabular-nums">{documents.length}</p>
                            </div>
                            <div className="px-4 py-2 rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
                                    Originator
                                </p>
                                <p className="text-sm font-bold text-white truncate max-w-[12rem]">
                                    {selectedOriginatorName || 'Not selected'}
                                </p>
                            </div>
                        </div>
                    </PortalPageHeader>
                }
            >
                <div className={`${PORTAL_PAGE_CONTAINER} relative z-10`}>
                    <div className={`${PORTAL_CALLOUT} mb-8 sm:mb-10`}>
                        <div className="flex items-start gap-4">
                            <div className={PORTAL_STAT_ICON}>
                                <FileText className="w-6 h-6 text-gold" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-charcoal font-bold text-lg mb-1">
                                    Platform prequalification is optional
                                </h3>
                                <p className="text-charcoal/70 leading-relaxed text-sm sm:text-base">
                                    You can send documents to a PropReady bond originator, use an originator your
                                    agent prefers, or skip for now if you are still learning the process. Viewings
                                    and working with an agent are not blocked.
                                </p>
                                {prequalSkipped ? (
                                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-charcoal/10 bg-white px-3 py-1 text-xs font-semibold text-charcoal/70">
                                        <CheckCircle className="h-3.5 w-3.5 text-gold" />
                                        Skipped for now — you can return anytime
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.setItem(STORAGE_KEYS.prequalSkipped, '1');
                                            setPrequalSkipped(true);
                                            success('Prequalification skipped for now. You can continue browsing and booking viewings.');
                                        }}
                                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-charcoal/[0.03]"
                                    >
                                        Skip for now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7 space-y-6">
                            <div className={PORTAL_CARD}>
                                <div className={`${PORTAL_CARD_HEADER} bg-charcoal/[0.015]`}>
                                    <PortalPageHeader
                                        variant="section"
                                        eyebrow="Compare & select"
                                        title="Choose Your Bond Originator"
                                        description="Optional — select a PropReady bond originator to send documents for prequalification, or skip and use your agent’s preferred originator."
                                    />
                                </div>

                                <div className="p-6 sm:p-8">
                                    <BondOriginatorSlider
                                        mode="select"
                                        selectedId={selectedOriginator}
                                        onSelect={handleOriginatorSelect}
                                    />

                                    {selectedOriginator && selectedOriginatorName && (
                                        <div className={`${PORTAL_CALLOUT} mt-6`}>
                                            <div className="flex items-center gap-2 text-charcoal">
                                                <CheckCircle className="w-5 h-5 text-gold shrink-0" />
                                                <p className="font-semibold">
                                                    Selected:{' '}
                                                    <span className="text-gold">{selectedOriginatorName}</span>
                                                </p>
                                            </div>
                                            <p className="text-charcoal/70 text-sm mt-2 ml-7">
                                                Use the send button after uploading to share documents with your
                                                selected originator.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="premium-card rounded-2xl overflow-hidden border border-charcoal/10">
                                <div className="px-6 py-5 border-b border-charcoal/10">
                                    <h2 className="text-2xl font-extrabold text-charcoal flex items-center gap-3">
                                        <Upload className="w-6 h-6 text-gold" />
                                        Upload FICA Documents
                                    </h2>
                                    <p className="text-charcoal/60 text-sm mt-2">
                                        Upload one file per document type. Files are saved under that document
                                        name (for example, ID Copy).
                                    </p>
                                </div>

                                <div className="p-6">
                                    {uploadError && (
                                        <div className="mb-4 p-3 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 rounded-xl">
                                            <p className="text-red-600 text-sm flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                {uploadError}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {BUYER_DOCUMENT_SLOTS.map(({ type, label, hint }) => {
                                            const uploaded = documents.find((d) => d.type === type);
                                            const isActive = uploadTypeHint === type;
                                            const isThisUploading = uploadingType === type;

                                            return (
                                                <div
                                                    key={type}
                                                    className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border p-4 transition ${
                                                        isActive
                                                            ? 'border-gold/40 bg-gold/[0.04]'
                                                            : 'border-charcoal/[0.08] bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                                        <div
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                                                uploaded
                                                                    ? 'bg-green-500/10 border-green-500/20 text-green-600'
                                                                    : 'bg-charcoal/[0.04] border-charcoal/10 text-charcoal/40'
                                                            }`}
                                                        >
                                                            {uploaded ? (
                                                                <CheckCircle className="w-5 h-5" />
                                                            ) : (
                                                                <FileText className="w-5 h-5" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-charcoal">{label}</p>
                                                            {hint ? (
                                                                <p className="text-sm text-charcoal/55 mt-0.5">
                                                                    {hint}
                                                                </p>
                                                            ) : null}
                                                            {uploaded?.size ? (
                                                                <p className="text-xs text-charcoal/45 mt-1">
                                                                    {uploaded.size} ·{' '}
                                                                    {new Date(
                                                                        uploaded.uploadedAt
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <label
                                                            className={`${
                                                                uploaded
                                                                    ? PORTAL_SECONDARY_BTN
                                                                    : PORTAL_PRIMARY_BTN
                                                            } !h-auto !py-2.5 !px-4 cursor-pointer justify-center ${
                                                                isUploading || deletingId
                                                                    ? 'opacity-60 pointer-events-none'
                                                                    : ''
                                                            }`}
                                                        >
                                                            {isThisUploading
                                                                ? 'Uploading…'
                                                                : uploaded
                                                                  ? 'Replace'
                                                                  : 'Upload'}
                                                            <input
                                                                type="file"
                                                                accept={BUYER_DOCUMENT_ACCEPT}
                                                                onChange={handleSlotFileInput(type)}
                                                                className="hidden"
                                                                disabled={isUploading || !!deletingId}
                                                            />
                                                        </label>
                                                        {uploaded ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleDelete(uploaded.id)}
                                                                disabled={isUploading || !!deletingId}
                                                                className="!h-auto !py-2.5 !px-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] text-red-600 text-sm font-semibold hover:bg-red-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {deletingId === uploaded.id
                                                                    ? 'Removing…'
                                                                    : 'Remove'}
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-charcoal/50 text-sm mt-4">
                                        Supported formats: PDF, JPG, PNG (Max 3MB per file)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 space-y-6">
                            <div className="premium-card rounded-2xl overflow-hidden border border-charcoal/10">
                                <div className="px-6 py-5 border-b border-charcoal/10">
                                    <h2 className="text-2xl font-extrabold text-charcoal flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-gold" />
                                        Your Documents
                                    </h2>
                                </div>

                                <div className="p-6">
                                    {documents.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 rounded-2xl bg-charcoal/5 border border-charcoal/10 flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-8 h-8 text-charcoal/30" />
                                            </div>
                                            <p className="text-charcoal/70 text-lg font-semibold">
                                                No documents uploaded yet
                                            </p>
                                            <p className="text-charcoal/50 text-sm mt-2">
                                                Upload your first document to get started.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4 mb-6">
                                                {BUYER_DOCUMENT_SLOTS.map(({ type }) => {
                                                    const doc = documents.find((d) => d.type === type);
                                                    if (!doc) return null;
                                                    return (
                                                    <div
                                                        key={doc.id}
                                                        className="bg-white rounded-2xl p-5 border border-charcoal/10 hover:border-gold/40 transition-all shadow-sm"
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                                <div className="w-12 h-12 bg-gold/15 rounded-xl flex items-center justify-center flex-shrink-0 border border-gold/20">
                                                                    <FileText className="w-6 h-6 text-gold" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                                        <h3
                                                                            className="text-charcoal font-semibold text-base truncate"
                                                                            title={doc.name}
                                                                        >
                                                                            {doc.name}
                                                                        </h3>
                                                                        {getStatusBadge(doc.status)}
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-charcoal/70 text-sm">
                                                                        {doc.size && <span>{doc.size}</span>}
                                                                        <span>
                                                                            Uploaded{' '}
                                                                            {new Date(doc.uploadedAt).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPreviewDoc(doc)}
                                                                    className="p-2.5 rounded-xl bg-gold/[0.06] hover:bg-gold/10 transition text-gold border border-gold/10"
                                                                    title="Preview"
                                                                >
                                                                    <Eye className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleDownload(doc)}
                                                                    className="p-2.5 rounded-xl bg-charcoal/5 hover:bg-charcoal/10 transition text-charcoal border border-charcoal/10"
                                                                    title="Download"
                                                                >
                                                                    <Download className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleDelete(doc.id)}
                                                                    disabled={!!deletingId}
                                                                    className="p-2.5 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 hover:from-red-500/20 hover:to-red-500/10 transition text-red-600 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Remove"
                                                                    aria-label={`Remove ${doc.name}`}
                                                                >
                                                                    {deletingId === doc.id ? (
                                                                        <div className="w-5 h-5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                                                                    ) : (
                                                                        <X className="w-5 h-5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="pt-6 border-t border-charcoal/10">
                                                {sendSuccess && (
                                                    <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                                                        <p className="text-green-700 text-sm flex items-center gap-2">
                                                            <CheckCircle className="w-5 h-5 shrink-0" />
                                                            Documents successfully sent to {selectedOriginatorName}!
                                                        </p>
                                                    </div>
                                                )}
                                                {sendError && (
                                                    <div className="mb-4 p-4 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 rounded-xl">
                                                        <p className="text-red-600 text-sm flex items-center gap-2">
                                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                                            {sendError}
                                                        </p>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSendToOriginator()}
                                                    disabled={
                                                        isSending ||
                                                        !selectedOriginator ||
                                                        documents.length === 0
                                                    }
                                                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 ${PORTAL_PRIMARY_BTN} !h-auto !rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                                                >
                                                    {isSending ? (
                                                        <>
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            <span>Sending…</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-5 h-5" />
                                                            <span>
                                                                {selectedOriginatorName
                                                                    ? `Send to ${selectedOriginatorName}`
                                                                    : 'Send to Bond Originator'}
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                                <p className="text-charcoal/60 text-xs text-center mt-3">
                                                    Select an originator and upload documents before sending. Your
                                                    files will be securely shared for prequalification.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="premium-card rounded-2xl overflow-hidden border border-charcoal/10">
                                <div className="px-6 py-5 border-b border-charcoal/10 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent">
                                    <div className="flex items-start gap-3">
                                        <Building2 className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="text-charcoal font-extrabold text-xl mb-1">
                                                FICA Document Requirements
                                            </h3>
                                            <p className="text-charcoal/70 text-sm">
                                                These documents are required by law (FICA) and needed by bond
                                                originators for prequalification:
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <ul className="space-y-3 text-charcoal/80">
                                        {BUYER_DOCUMENT_SLOTS.filter((s) =>
                                            ['id', 'residence', 'income', 'bank-statement'].includes(s.type)
                                        ).map(({ type, label, hint }) => (
                                                <li key={type} className="flex items-start gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-semibold text-charcoal">
                                                            {label}
                                                        </span>
                                                        {hint ? (
                                                            <p className="text-sm text-charcoal/60 mt-1">{hint}</p>
                                                        ) : null}
                                                    </div>
                                                </li>
                                        ))}
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-charcoal">
                                                    Additional Documents (if applicable)
                                                </span>
                                                <p className="text-sm text-charcoal/60 mt-1">
                                                    Marriage certificate, divorce decree, or anything else your
                                                    originator requests
                                                </p>
                                            </div>
                                        </li>
                                    </ul>

                                    <div className="mt-6 pt-4 border-t border-blue-500/20">
                                        <p className="text-charcoal/70 text-sm">
                                            <strong className="text-charcoal">Note:</strong> All documents must be
                                            clear, legible, and not older than 3 months (except ID). Once uploaded,
                                            these documents will be securely shared with your chosen bond originator for
                                            prequalification.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UserPortalLayout>

            <BuyerDocumentPreviewModal
                doc={previewDoc}
                userId={user.id}
                onClose={() => setPreviewDoc(null)}
            />
        </>
    );
}
