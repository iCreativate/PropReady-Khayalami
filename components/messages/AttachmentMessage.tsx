'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

function isImageMime(mime: string) {
    return mime.startsWith('image/');
}

export default function AttachmentMessage({
    conversationId,
    meta,
    body,
    mine,
    onOpen,
    urlBase = '/api/messages/conversations',
}: {
    conversationId: string;
    meta: Record<string, unknown>;
    body: string | null;
    mine: boolean;
    onOpen: (docId: string) => void;
    /** Base path before `/{conversationId}/documents/{docId}/url` */
    urlBase?: string;
}) {
    const docId = String(meta.documentId || '');
    const fileName = String(meta.fileName || body || 'Attachment');
    const mime = String(meta.mimeType || '');
    const showImage = isImageMime(mime) && Boolean(docId);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFailed, setPreviewFailed] = useState(false);

    useEffect(() => {
        if (!showImage) return;
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch(
                    `${urlBase}/${conversationId}/documents/${docId}/url`,
                    { credentials: 'include' }
                );
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (res.ok && data.url) setPreviewUrl(String(data.url));
                else setPreviewFailed(true);
            } catch {
                if (!cancelled) setPreviewFailed(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [showImage, conversationId, docId, urlBase]);

    return (
        <div className="space-y-2">
            {showImage && previewUrl ? (
                <button
                    type="button"
                    onClick={() => {
                        if (docId) onOpen(docId);
                    }}
                    className="block overflow-hidden rounded-xl max-w-full"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewUrl}
                        alt={fileName}
                        className="max-w-full max-h-64 object-contain bg-black/5"
                    />
                </button>
            ) : null}
            <button
                type="button"
                onClick={() => {
                    if (docId) onOpen(docId);
                }}
                className={`inline-flex items-center gap-2 text-sm font-medium ${
                    mine ? 'text-white underline' : 'text-gold'
                }`}
            >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[14rem]">
                    {fileName}
                    {showImage && !previewUrl && !previewFailed ? ' · loading…' : ''}
                </span>
            </button>
        </div>
    );
}
