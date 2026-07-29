'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Mic } from 'lucide-react';

function isImageMime(mime: string) {
    return mime.startsWith('image/');
}

function isAudioMime(mime: string, meta: Record<string, unknown>) {
    return Boolean(meta.isVoiceNote) || mime.startsWith('audio/');
}

function formatDuration(ms: unknown) {
    const n = typeof ms === 'number' ? ms : Number(ms);
    if (!Number.isFinite(n) || n <= 0) return '';
    const seconds = Math.round(n / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
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
    onError?: (message: string) => void;
    urlBase?: string;
}) {
    const docId = String(meta.documentId || '');
    const fileName = String(meta.fileName || body || 'Attachment');
    const mime = String(meta.mimeType || '');
    const showImage = isImageMime(mime) && Boolean(docId);
    const showAudio = isAudioMime(mime, meta) && Boolean(docId);
    const durationLabel = formatDuration(meta.durationMs);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFailed, setPreviewFailed] = useState(false);

    const downloadHref = docId
        ? `${urlBase}/${conversationId}/documents/${docId}/download`
        : undefined;

    useEffect(() => {
        if (!showImage && !showAudio) return;
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
    }, [showImage, showAudio, conversationId, docId, urlBase]);

    if (showAudio) {
        return (
            <div className="space-y-2 min-w-[200px] max-w-[280px]">
                <div
                    className={`inline-flex items-center gap-2 text-xs font-semibold ${
                        mine ? 'text-white/90' : 'text-[#111827]'
                    }`}
                >
                    <Mic className="h-3.5 w-3.5 shrink-0" />
                    Voice note{durationLabel ? ` · ${durationLabel}` : ''}
                </div>
                {previewUrl ? (
                    <audio
                        controls
                        preload="metadata"
                        src={previewUrl}
                        className="w-full max-w-full"
                    >
                        Your browser does not support audio playback.
                    </audio>
                ) : (
                    <p
                        className={`text-xs ${
                            mine ? 'text-white/70' : 'text-[#6B7280]'
                        }`}
                    >
                        {previewFailed ? 'Could not load audio' : 'Loading voice note…'}
                    </p>
                )}
                {downloadHref ? (
                    <a
                        href={downloadHref}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            mine ? 'text-white/80 underline' : 'text-[#E52323]'
                        }`}
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download
                    </a>
                ) : null}
            </div>
        );
    }

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
