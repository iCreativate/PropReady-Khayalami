import { STORAGE_KEYS } from '@/lib/storage-keys';

export type LeadDocumentType =
    | 'pre-qualification'
    | 'id'
    | 'residence'
    | 'income'
    | 'bank-statement'
    | 'title-deed'
    | 'rates'
    | 'other';

export interface LeadDocument {
    id: string;
    name: string;
    type: LeadDocumentType;
    status: 'uploaded' | 'pending' | 'verified';
    uploadedAt: string;
    size?: string;
    url?: string | null;
}

const DEMO_LEAD_DOCUMENTS: Record<string, LeadDocument[]> = {
    'demo-buyer-lerato': [
        {
            id: 'demo-doc-lerato-id',
            name: 'Lerato_Naidoo_ID.pdf',
            type: 'id',
            status: 'verified',
            uploadedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
            size: '980 KB',
        },
        {
            id: 'demo-doc-lerato-prequal',
            name: 'BetterBond_PreApproval.pdf',
            type: 'pre-qualification',
            status: 'verified',
            uploadedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
            size: '620 KB',
        },
    ],
    'demo-buyer-james': [
        {
            id: 'demo-doc-james-id',
            name: 'James_van_Wyk_ID.pdf',
            type: 'id',
            status: 'uploaded',
            uploadedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
            size: '1.1 MB',
        },
    ],
    'demo-seller-john': [
        {
            id: 'demo-doc-john-title',
            name: 'Title_Deed_Maple_Street.pdf',
            type: 'title-deed',
            status: 'uploaded',
            uploadedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
            size: '3.4 MB',
        },
        {
            id: 'demo-doc-john-rates',
            name: 'Rates_Clearance_Certificate.pdf',
            type: 'rates',
            status: 'pending',
            uploadedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
            size: '420 KB',
        },
    ],
    'demo-seller-sipho': [
        {
            id: 'demo-doc-sipho-title',
            name: 'Title_Deed_Oak_Avenue.pdf',
            type: 'title-deed',
            status: 'verified',
            uploadedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
            size: '2.8 MB',
        },
    ],
};

function normalizeDocument(doc: Record<string, unknown>): LeadDocument {
    return {
        id: String(doc.id ?? ''),
        name: String(doc.name ?? 'Document'),
        type: (doc.type as LeadDocumentType) || 'other',
        status: (doc.status as LeadDocument['status']) || 'uploaded',
        uploadedAt: String(doc.uploadedAt ?? doc.uploaded_at ?? new Date().toISOString()),
        size: doc.size ? String(doc.size) : undefined,
        url: doc.url ? String(doc.url) : null,
    };
}

export function readLeadDocumentsLocal(leadId: string): LeadDocument[] {
    if (DEMO_LEAD_DOCUMENTS[leadId]) {
        return DEMO_LEAD_DOCUMENTS[leadId];
    }
    return readLocalLeadDocuments(leadId);
}

function readLocalLeadDocuments(leadId: string): LeadDocument[] {
    if (typeof window === 'undefined') return [];

    try {
        const byUserRaw = localStorage.getItem(STORAGE_KEYS.leadDocuments);
        if (byUserRaw) {
            const byUser = JSON.parse(byUserRaw) as Record<string, LeadDocument[]>;
            if (Array.isArray(byUser[leadId])) {
                return byUser[leadId].map((d) => normalizeDocument(d as unknown as Record<string, unknown>));
            }
        }
    } catch {
        /* ignore */
    }

    try {
        const sentRaw = localStorage.getItem(STORAGE_KEYS.documentsSent);
        if (sentRaw) {
            const sent = JSON.parse(sentRaw) as {
                userId?: string;
                documents?: LeadDocument[];
            };
            if (sent.userId === leadId && Array.isArray(sent.documents)) {
                return sent.documents.map((d) => normalizeDocument(d as unknown as Record<string, unknown>));
            }
        }
    } catch {
        /* ignore */
    }

    return [];
}

export function saveLeadDocumentsLocally(leadId: string, documents: LeadDocument[]): void {
    if (typeof window === 'undefined') return;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.leadDocuments);
        const map = raw ? (JSON.parse(raw) as Record<string, LeadDocument[]>) : {};
        map[leadId] = documents;
        localStorage.setItem(STORAGE_KEYS.leadDocuments, JSON.stringify(map));
    } catch {
        /* ignore */
    }
}

export function leadDocumentTypeLabel(type: LeadDocumentType): string {
    const labels: Record<LeadDocumentType, string> = {
        'pre-qualification': 'Pre-qualification',
        id: 'ID Copy',
        residence: 'Proof of Residence',
        income: 'Proof of Income',
        'bank-statement': 'Bank Statements',
        'title-deed': 'Title deed',
        rates: 'Rates & taxes',
        other: 'Additional Document',
    };
    return labels[type] ?? 'Document';
}

export async function fetchLeadDocuments(leadId: string): Promise<LeadDocument[]> {
    const local = readLeadDocumentsLocal(leadId);
    if (local.length > 0) return local;

    try {
        const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/documents`, {
            cache: 'no-store',
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.documents) && data.documents.length > 0) {
                return data.documents.map((d: Record<string, unknown>) => normalizeDocument(d));
            }
        }
    } catch {
        /* fall through */
    }

    return local;
}
