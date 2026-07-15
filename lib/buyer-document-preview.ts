import type { BuyerDocument } from '@/lib/buyer-documents';
import { getDocumentBlob } from '@/lib/document-blobs';

export type BuyerDocumentPreviewKind = 'pdf' | 'image' | 'other';

export interface BuyerDocumentPreviewSource {
    url: string;
    kind: BuyerDocumentPreviewKind;
    revoke?: () => void;
}

function inferPreviewKind(name: string, mimeType?: string): BuyerDocumentPreviewKind {
    const lower = name.toLowerCase();
    if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) return 'pdf';
    if (
        mimeType?.startsWith('image/') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png')
    ) {
        return 'image';
    }
    return 'other';
}

export async function resolveBuyerDocumentPreview(
    doc: BuyerDocument,
    userId?: string | null
): Promise<BuyerDocumentPreviewSource | null> {
    const localBlob = await getDocumentBlob(doc.id);
    if (localBlob) {
        const url = URL.createObjectURL(localBlob);
        return {
            url,
            kind: inferPreviewKind(doc.name, localBlob.type),
            revoke: () => URL.revokeObjectURL(url),
        };
    }

    if (userId) {
        try {
            const res = await fetch(
                `/api/documents/download?userId=${encodeURIComponent(userId)}&documentId=${encodeURIComponent(doc.id)}`
            );
            const data = await res.json();
            if (res.ok && data.url) {
                return {
                    url: String(data.url),
                    kind: inferPreviewKind(doc.name),
                };
            }
        } catch {
            /* fall through */
        }
    }

    if (doc.url) {
        return {
            url: doc.url,
            kind: inferPreviewKind(doc.name),
        };
    }

    return null;
}
