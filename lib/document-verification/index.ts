import type { BuyerDocumentType } from '@/lib/buyer-documents';
import { verifyDocumentHeuristics } from '@/lib/document-verification/heuristics';
import { verifyDocumentVision } from '@/lib/document-verification/vision';
import type { DocumentVerificationMeta, DocumentVerificationResult } from '@/lib/document-verification/types';

export type { DocumentVerificationMeta, DocumentVerificationResult } from '@/lib/document-verification/types';

export function toVerificationMeta(result: DocumentVerificationResult): DocumentVerificationMeta {
    return {
        detectedType: result.detectedType,
        expectedType: result.expectedType,
        confidence: result.confidence,
        issues: result.issues,
        summary: result.summary,
        method: result.method,
    };
}

function mergeResults(
    heuristic: DocumentVerificationResult,
    vision: DocumentVerificationResult | null
): DocumentVerificationResult {
    if (!vision) return heuristic;

    const issues = [...new Set([...heuristic.issues, ...vision.issues])];
    const confidence = Math.round((heuristic.confidence + vision.confidence) / 2);

    let status: DocumentVerificationResult['status'] = vision.status;
    if (vision.status === 'rejected' || heuristic.status === 'rejected') {
        status = 'rejected';
    } else if (vision.status === 'verified') {
        status = confidence >= 65 ? 'verified' : 'uploaded';
    }

    const matchesExpected = status !== 'rejected';

    return {
        detectedType: vision.detectedType !== 'unknown' ? vision.detectedType : heuristic.detectedType,
        expectedType: heuristic.expectedType,
        matchesExpected,
        confidence,
        status,
        issues,
        summary: vision.summary || heuristic.summary,
        method: 'combined',
        verifiedAt: new Date().toISOString(),
    };
}

/** Classify uploaded FICA file against the expected buyer document slot. */
export async function verifyBuyerDocument(input: {
    expectedType: BuyerDocumentType;
    fileName: string;
    buffer: Buffer;
    mime: string;
}): Promise<DocumentVerificationResult> {
    const heuristic = verifyDocumentHeuristics(input);
    const vision = await verifyDocumentVision(input);
    return mergeResults(heuristic, vision);
}
