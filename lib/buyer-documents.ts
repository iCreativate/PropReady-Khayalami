import { readLeadDocumentsLocal } from '@/lib/lead-documents';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export type BuyerDocumentType =
    | 'pre-qualification'
    | 'id'
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
export const BUYER_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const BUYER_DOCUMENT_SLOTS: { type: BuyerDocumentType; label: string }[] = [
    { type: 'pre-qualification', label: 'Pre-Qualification Letter' },
    { type: 'id', label: 'ID Document' },
    { type: 'income', label: 'Proof of Income' },
];

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

export function inferBuyerDocumentType(fileName: string, hint?: BuyerDocumentType): BuyerDocumentType {
    if (hint && hint !== 'other') return hint;
    const lower = fileName.toLowerCase();
    if (lower.includes('id') || lower.includes('passport') || lower.includes('identity')) return 'id';
    if (lower.includes('payslip') || lower.includes('salary') || lower.includes('income')) return 'income';
    if (lower.includes('bank') || lower.includes('statement')) return 'bank-statement';
    if (lower.includes('pre-qual') || lower.includes('prequal')) return 'pre-qualification';
    return hint ?? 'other';
}

export function buyerDocumentTypeLabel(type: BuyerDocumentType): string {
    const labels: Record<BuyerDocumentType, string> = {
        'pre-qualification': 'Pre-Qualification',
        id: 'ID Document',
        income: 'Proof of Income',
        'bank-statement': 'Bank Statement',
        other: 'Other',
    };
    return labels[type];
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
        return `File too large: ${file.name}. Maximum size is 10MB.`;
    }
    return null;
}
