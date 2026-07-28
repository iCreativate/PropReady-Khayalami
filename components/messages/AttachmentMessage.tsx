'use client';

import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';

function isImageMime(mime: string) {
    return mime.startsWith('image/');
}

export default function AttachmentMessage({
    conversationId,
    meta,
    body,
    mine,
    urlBase = '/api/messages/conversations',
}: {
    conversationId: string;
    meta: Record<string, unknown>;
    body: string | null;
    mine: boolean;
    /** Called when download fails; optional so callers can show errors */
    onError?: (message: string) => void;
    /** Base path before `/{conversationId}/documents/{docId}/...` */
    urlBase?: string;
}) {
    const docId = String(meta.documentId || '');
    const fileName = String(meta.fileName || body || 'Attachment');
    const mime = String(meta.mimeType || '');
    const showImage = isImageMime(mime) && Boolean(docId);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFailed, setPreviewFailed] = useState(false);

    const downloadHref = docId
        ? `${urlBase}/${conversationId}/documents/${docId}/download`
        : undefined;

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
                <a
                    href={downloadHref}
                    className="block overflow-hidden rounded-xl max-w-full"
                    title={`Download ${fileName}`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewUrl}
                        alt={fileName}
                        className="max-w-full max-h-64 object-contain bg-black/5"
                    />
                </a>
            ) : null}
            {downloadHref ? (
                <a
                    href={downloadHref}
                    className={`inline-flex items-center gap-2 text-sm font-medium ${
                        mine ? 'text-white underline' : 'text-gold'
                    }`}
                    title={`Download ${fileName}`}
                >
                    {showImage ? (
                        <Download className="w-4 h-4 shrink-0" />
                    ) : (
                        <FileText className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate max-w-[14rem]">
                        {fileName}
                        {showImage && !previewUrl && !previewFailed ? ' · loading…' : ' · Download'}
                    </span>
                </a>
            ) : (
                <span
                    className={`inline-flex items-center gap-2 text-sm font-medium ${
                        mine ? 'text-white/80' : 'text-charcoal/55'
                    }`}
                >
                    <FileText className="w-4 h-4 shrink-0" />
                    {fileName}
                </span>
            )}
        </div>
    );
}
