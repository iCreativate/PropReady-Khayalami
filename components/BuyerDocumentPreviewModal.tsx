'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Download, ExternalLink, Eye, FileText, X } from 'lucide-react';
import type { BuyerDocument } from '@/lib/buyer-documents';
import { buyerDocumentTypeLabel } from '@/lib/buyer-documents';
import {
    resolveBuyerDocumentPreview,
    type BuyerDocumentPreviewKind,
} from '@/lib/buyer-document-preview';
import { getDocumentBlob, downloadBlob } from '@/lib/document-blobs';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

interface BuyerDocumentPreviewModalProps {
    doc: BuyerDocument | null;
    userId?: string | null;
    onClose: () => void;
}

export default function BuyerDocumentPreviewModal({
    doc,
    userId,
    onClose,
}: BuyerDocumentPreviewModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewKind, setPreviewKind] = useState<BuyerDocumentPreviewKind>('other');
    const revokeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!doc) {
            setPreviewUrl(null);
            setPreviewKind('other');
            setError('');
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        async function loadPreview() {
            setIsLoading(true);
            setError('');
            setPreviewUrl(null);
            revokeRef.current?.();
            revokeRef.current = null;

            const source = await resolveBuyerDocumentPreview(doc!, userId);
            if (cancelled) {
                source?.revoke?.();
                return;
            }

            if (!source) {
                setError('Preview unavailable for this document.');
                setIsLoading(false);
                return;
            }

            revokeRef.current = source.revoke ?? null;
            setPreviewUrl(source.url);
            setPreviewKind(source.kind);
            setIsLoading(false);
        }

        void loadPreview();

        return () => {
            cancelled = true;
            revokeRef.current?.();
            revokeRef.current = null;
        };
    }, [doc, userId]);

    const handleClose = () => {
        revokeRef.current?.();
        revokeRef.current = null;
        setPreviewUrl(null);
        onClose();
    };

    const handleDownload = async () => {
        if (!doc) return;

        const localBlob = await getDocumentBlob(doc.id);
        if (localBlob) {
            downloadBlob(localBlob, doc.name);
            return;
        }

        if (previewUrl) {
            window.open(previewUrl, '_blank', 'noopener,noreferrer');
        }
    };

    if (!doc) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-charcoal/[0.08]">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Eye className="w-5 h-5 text-gold shrink-0" />
                            <h2 className="text-lg font-semibold text-charcoal truncate" title={doc.name}>
                                {doc.name}
                            </h2>
                        </div>
                        <p className="text-sm text-charcoal/55">
                            {buyerDocumentTypeLabel(doc.type)}
                            {doc.size ? ` • ${doc.size}` : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 rounded-xl hover:bg-charcoal/5 transition text-charcoal"
                        aria-label="Close preview"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 min-h-[320px] bg-charcoal/[0.02] overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full min-h-[320px]">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-charcoal/60 text-sm">Loading preview…</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full min-h-[320px] px-6">
                            <div className="text-center max-w-sm">
                                <AlertCircle className="w-10 h-10 text-charcoal/30 mx-auto mb-3" />
                                <p className="text-charcoal font-medium mb-1">Preview unavailable</p>
                                <p className="text-charcoal/55 text-sm">{error}</p>
                            </div>
                        </div>
                    ) : previewKind === 'pdf' && previewUrl ? (
                        <iframe
                            src={previewUrl}
                            title={`Preview ${doc.name}`}
                            className="w-full h-[70vh] min-h-[320px] bg-white"
                        />
                    ) : previewKind === 'image' && previewUrl ? (
                        <div className="flex items-center justify-center p-6 min-h-[320px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewUrl}
                                alt={doc.name}
                                className="max-h-[70vh] max-w-full rounded-2xl border border-charcoal/10 shadow-sm object-contain"
                            />
                        </div>
                    ) : previewUrl ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[320px] px-6 text-center">
                            <FileText className="w-12 h-12 text-charcoal/30 mb-3" />
                            <p className="text-charcoal font-medium mb-1">Inline preview not supported</p>
                            <p className="text-charcoal/55 text-sm mb-4">
                                Open or download this file to view it.
                            </p>
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={PORTAL_PRIMARY_BTN}
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open file
                            </a>
                        </div>
                    ) : null}
                </div>

                <div className="px-6 py-4 border-t border-charcoal/[0.08] flex items-center justify-end gap-3">
                    <button type="button" onClick={handleClose} className={PORTAL_SECONDARY_BTN}>
                        Close
                    </button>
                    <button type="button" onClick={() => void handleDownload()} className={PORTAL_PRIMARY_BTN}>
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
}
