import { readLeadDocumentsLocal } from '@/lib/lead-documents';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export type BuyerDocumentType =
    | 'pre-qualification'
    | 'id'
    | 'residence'
    | 'income'
    | 'bank-statement'
    | 'other';

export interface BuyerDocument {
    id: string;
    name: string;
    type: BuyerDocumentType;
    status: 'uploaded' | 'pending' | 'verified';
    uploadedAt: string;
    size?: string;
    url?: string | null;
}

export const BUYER_DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png';
export const BUYER_DOCUMENT_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
] as const;
export const BUYER_DOCUMENT_MAX_BYTES = 3 * 1024 * 1024;

/** Named FICA upload slots — filename is ignored; display name = label. */
export const BUYER_DOCUMENT_SLOTS: { type: BuyerDocumentType; label: string; hint?: string }[] = [
    { type: 'id', label: 'ID Copy', hint: 'ID book or smart ID card (both sides if needed)' },
    {
        type: 'residence',
        label: 'Proof of Residence',
        hint: 'Utility bill or bank letter ≤ 3 months',
    },
    { type: 'income', label: 'Proof of Income', hint: 'Latest payslips or income confirmation' },
    { type: 'bank-statement', label: 'Bank Statements', hint: 'Latest 3 months primary account' },
    { type: 'other', label: 'Additional Document', hint: 'Marriage certificate or other requests' },
];

/** Types buyers can upload (excludes originator-issued pre-qualification letters). */
export const BUYER_DOCUMENT_TYPES: BuyerDocumentType[] = BUYER_DOCUMENT_SLOTS.map((s) => s.type);

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

export function inferBuyerDocumentType(fileName: string, hint?: BuyerDocumentType): BuyerDocumentType {
    if (hint) return hint;
    const lower = fileName.toLowerCase();
    if (lower.includes('id') || lower.includes('passport') || lower.includes('identity')) return 'id';
    if (
        lower.includes('residence') ||
        lower.includes('address') ||
        lower.includes('utility') ||
        lower.includes('rates')
    ) {
        return 'residence';
    }
    if (lower.includes('payslip') || lower.includes('salary') || lower.includes('income')) return 'income';
    if (lower.includes('bank') || lower.includes('statement')) return 'bank-statement';
    return 'other';
}

export function buyerDocumentTypeLabel(type: BuyerDocumentType): string {
    const slot = BUYER_DOCUMENT_SLOTS.find((s) => s.type === type);
    if (slot) return slot.label;
    const labels: Record<BuyerDocumentType, string> = {
        'pre-qualification': 'Pre-Qualification Letter',
        id: 'ID Copy',
        residence: 'Proof of Residence',
        income: 'Proof of Income',
        'bank-statement': 'Bank Statements',
        other: 'Additional Document',
    };
    return labels[type];
}

/** Stable download/display filename for a slot + original file extension. */
export function buyerDocumentDisplayFileName(
    type: BuyerDocumentType,
    originalFileName?: string
): string {
    const label = buyerDocumentTypeLabel(type);
    const extMatch = originalFileName?.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch?.[1]?.toLowerCase() || 'pdf';
    return `${label}.${ext}`;
}

function sortBuyerDocuments(docs: BuyerDocument[]): BuyerDocument[] {
    return docs.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
}

function mergeBuyerDocuments(
    local: BuyerDocument[],
    remote: BuyerDocument[]
): BuyerDocument[] {
    if (remote.length === 0) return sortBuyerDocuments(local);
    const byId = new Map<string, BuyerDocument>();
    for (const doc of local) byId.set(doc.id, doc);
    for (const doc of remote) byId.set(doc.id, doc);
    return sortBuyerDocuments(Array.from(byId.values()));
}

export function readBuyerDocumentsLocal(userId: string): BuyerDocument[] {
    if (typeof window === 'undefined') return [];

    let docs: BuyerDocument[] = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.documents);
        if (stored) {
            docs = JSON.parse(stored) as BuyerDocument[];
        }
    } catch {
        docs = [];
    }

    const leadDocs = readLeadDocumentsLocal(userId) as BuyerDocument[];
    if (leadDocs.length > 0) {
        docs = mergeBuyerDocuments(docs, leadDocs);
    }

    return docs;
}

export async function refreshBuyerDocumentsFromApi(
    userId: string,
    current: BuyerDocument[] = []
): Promise<BuyerDocument[]> {
    try {
        const res = await fetch(`/api/leads/${encodeURIComponent(userId)}/documents`, {
            cache: 'no-store',
        });
        if (!res.ok) return current;

        const data = await res.json();
        if (!Array.isArray(data.documents) || data.documents.length === 0) {
            return current;
        }

        return mergeBuyerDocuments(current, data.documents as BuyerDocument[]);
    } catch {
        return current;
    }
}

export async function loadBuyerDocuments(userId: string): Promise<BuyerDocument[]> {
    const local = readBuyerDocumentsLocal(userId);
    return refreshBuyerDocumentsFromApi(userId, local);
}

export function validateBuyerDocumentFile(file: File): string | null {
    if (!BUYER_DOCUMENT_MIME_TYPES.includes(file.type as (typeof BUYER_DOCUMENT_MIME_TYPES)[number])) {
        return `Invalid file type: ${file.name}. Please upload PDF, JPG, or PNG files only.`;
    }
    if (file.size > BUYER_DOCUMENT_MAX_BYTES) {
        return `File too large: ${file.name}. Maximum size is 3MB.`;
    }
    return null;
}
