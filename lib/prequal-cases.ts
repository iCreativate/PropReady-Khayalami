import type { BuyerDocumentType } from '@/lib/buyer-documents';

export type PrequalCaseStatus =
    | 'submitted'
    | 'in_review'
    | 'awaiting_documents'
    | 'result_ready'
    | 'closed';

export type PrequalMessageRole = 'buyer' | 'originator';

export type PrequalDocRequestStatus = 'requested' | 'uploaded' | 'waived';

export interface PrequalCaseRow {
    id: string;
    buyer_user_id: string;
    organization_id: string;
    assigned_originator_id: string | null;
    status: PrequalCaseStatus;
    soft_amount: number | null;
    official_amount: number | null;
    result_letter_path: string | null;
    result_notes: string | null;
    buyer_name: string | null;
    buyer_email: string | null;
    buyer_phone: string | null;
    submitted_at: string;
    updated_at: string;
}

export interface PrequalCaseDocumentRow {
    id: string;
    case_id: string;
    document_id: string;
    document_name: string | null;
    document_type: string | null;
    created_at: string;
}

export interface PrequalMessageRow {
    id: string;
    case_id: string;
    sender_role: PrequalMessageRole;
    sender_profile_id: string;
    sender_name: string | null;
    body: string;
    created_at: string;
}

export interface PrequalDocumentRequestRow {
    id: string;
    case_id: string;
    doc_type: string;
    label: string;
    status: PrequalDocRequestStatus;
    fulfilled_document_id: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export function serializePrequalCase(
    row: PrequalCaseRow,
    extras?: {
        documents?: PrequalCaseDocumentRow[];
        messages?: PrequalMessageRow[];
        documentRequests?: PrequalDocumentRequestRow[];
    }
) {
    return {
        id: row.id,
        buyerUserId: row.buyer_user_id,
        organizationId: row.organization_id,
        assignedOriginatorId: row.assigned_originator_id,
        status: row.status,
        softAmount: row.soft_amount != null ? Number(row.soft_amount) : null,
        officialAmount: row.official_amount != null ? Number(row.official_amount) : null,
        resultLetterPath: row.result_letter_path,
        resultNotes: row.result_notes,
        buyerName: row.buyer_name,
        buyerEmail: row.buyer_email,
        buyerPhone: row.buyer_phone,
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at,
        documents: (extras?.documents ?? []).map((d) => ({
            id: d.id,
            documentId: d.document_id,
            name: d.document_name,
            type: d.document_type as BuyerDocumentType | string | null,
            createdAt: d.created_at,
        })),
        messages: (extras?.messages ?? []).map((m) => ({
            id: m.id,
            senderRole: m.sender_role,
            senderProfileId: m.sender_profile_id,
            senderName: m.sender_name,
            body: m.body,
            createdAt: m.created_at,
        })),
        documentRequests: (extras?.documentRequests ?? []).map((r) => ({
            id: r.id,
            docType: r.doc_type,
            label: r.label,
            status: r.status,
            fulfilledDocumentId: r.fulfilled_document_id,
            notes: r.notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        })),
    };
}

export const PREQUAL_STATUS_LABELS: Record<PrequalCaseStatus, string> = {
    submitted: 'Submitted',
    in_review: 'In review',
    awaiting_documents: 'Awaiting documents',
    result_ready: 'Result ready',
    closed: 'Closed',
};
