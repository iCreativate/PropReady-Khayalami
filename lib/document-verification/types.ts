import type { BuyerDocumentType } from '@/lib/buyer-documents';

export type DetectedDocumentType = BuyerDocumentType | 'unknown';

export type DocumentVerificationStatus = 'verified' | 'uploaded' | 'rejected';

export type DocumentVerificationMethod = 'heuristic' | 'vision' | 'combined';

export interface DocumentVerificationResult {
    detectedType: DetectedDocumentType;
    expectedType: BuyerDocumentType;
    matchesExpected: boolean;
    confidence: number;
    status: DocumentVerificationStatus;
    issues: string[];
    summary: string;
    method: DocumentVerificationMethod;
    verifiedAt: string;
}

export interface DocumentVerificationMeta {
    detectedType: DetectedDocumentType;
    expectedType: BuyerDocumentType;
    confidence: number;
    issues: string[];
    summary: string;
    method: DocumentVerificationMethod;
}
