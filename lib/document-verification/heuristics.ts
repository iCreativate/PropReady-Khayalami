import type { BuyerDocumentType } from '@/lib/buyer-documents';
import { buyerDocumentTypeLabel } from '@/lib/buyer-documents';
import type { DetectedDocumentType, DocumentVerificationResult } from '@/lib/document-verification/types';

const KEYWORDS: Record<BuyerDocumentType, string[]> = {
    id: [
        'identity',
        'identification',
        'smart card',
        'id book',
        'id number',
        'id no',
        'passport',
        'home affairs',
        'department of home affairs',
        'rsa id',
        ' republic of south africa',
        'citizen',
        'date of birth',
        'surname',
        'given name',
    ],
    residence: [
        'proof of residence',
        'proof of address',
        'utility',
        'municipal',
        'municipality',
        'rates account',
        'eskom',
        'water account',
        'telkom',
        'vodacom',
        'mtn',
        'cell c',
        'billing address',
        'service address',
        'account holder',
    ],
    income: [
        'payslip',
        'pay slip',
        'salary',
        'remuneration',
        'employer',
        'employee',
        'gross pay',
        'net pay',
        'pay advice',
        'irp5',
        'tax certificate',
        'cost to company',
        'monthly earnings',
        'employment',
    ],
    'bank-statement': [
        'bank statement',
        'account statement',
        'statement period',
        'opening balance',
        'closing balance',
        'transaction',
        'debit order',
        'account number',
        'fnb',
        'absa',
        'nedbank',
        'standard bank',
        'capitec',
        'investec',
        'tymebank',
        'discovery bank',
        'african bank',
    ],
    'pre-qualification': ['pre-qualification', 'prequalification', 'bond originator', 'approval in principle'],
    other: [],
};

const FILENAME_HINTS: Record<BuyerDocumentType, RegExp[]> = {
    id: [/id/i, /identity/i, /passport/i, /smart.?id/i],
    residence: [/residence/i, /address/i, /utility/i, /rates/i, /proof/i],
    income: [/payslip/i, /pay.?slip/i, /salary/i, /income/i, /irp5/i],
    'bank-statement': [/bank/i, /statement/i, /stmt/i],
    'pre-qualification': [/pre.?qual/i, /aip/i],
    other: [],
};

function extractSearchText(fileName: string, buffer: Buffer, mime: string): string {
    const parts = [fileName.toLowerCase()];
    if (mime === 'application/pdf' || mime.startsWith('image/')) {
        const sample = buffer.subarray(0, Math.min(buffer.length, 64_000)).toString('latin1').toLowerCase();
        parts.push(sample);
    }
    return parts.join('\n');
}

function scoreType(text: string, type: BuyerDocumentType): number {
    let score = 0;
    for (const kw of KEYWORDS[type]) {
        if (text.includes(kw)) score += kw.includes(' ') ? 3 : 2;
    }
    for (const re of FILENAME_HINTS[type]) {
        if (re.test(text)) score += 4;
    }
    return score;
}

function detectBestType(text: string): { type: DetectedDocumentType; score: number } {
    const scores = (Object.keys(KEYWORDS) as BuyerDocumentType[])
        .filter((t) => t !== 'pre-qualification')
        .map((type) => ({ type, score: scoreType(text, type) }));

    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    if (!best || best.score < 3) return { type: 'unknown', score: 0 };
    return best;
}

export function verifyDocumentHeuristics(input: {
    expectedType: BuyerDocumentType;
    fileName: string;
    buffer: Buffer;
    mime: string;
}): DocumentVerificationResult {
    const { expectedType, fileName, buffer, mime } = input;
    const now = new Date().toISOString();
    const text = extractSearchText(fileName, buffer, mime);
    const expectedScore = scoreType(text, expectedType);
    const { type: detectedType, score: detectedScore } = detectBestType(text);

    if (expectedType === 'other') {
        return {
            detectedType: detectedType === 'unknown' ? 'other' : detectedType,
            expectedType,
            matchesExpected: true,
            confidence: Math.min(92, 55 + Math.max(expectedScore, detectedScore) * 4),
            status: 'verified',
            issues: [],
            summary: 'Additional document accepted for review.',
            method: 'heuristic',
            verifiedAt: now,
        };
    }

    const expectedLabel = buyerDocumentTypeLabel(expectedType);
    const detectedLabel =
        detectedType === 'unknown' ? 'an unclassified document' : buyerDocumentTypeLabel(detectedType);

    const matchesExpected =
        detectedType === expectedType ||
        (detectedType === 'unknown' && expectedScore >= 4) ||
        (expectedScore >= detectedScore && expectedScore >= 4);

    let confidence = Math.min(
        95,
        Math.max(expectedScore, detectedType === expectedType ? detectedScore : 0) * 8 + 20
    );

    const issues: string[] = [];

    if (
        detectedType !== 'unknown' &&
        detectedType !== expectedType &&
        detectedScore >= expectedScore + 3 &&
        detectedScore >= 6
    ) {
        issues.push(
            `Content looks like ${detectedLabel}, not ${expectedLabel}.`
        );
        confidence = Math.min(confidence, 35);
    }

    if (expectedType === 'bank-statement' && !text.includes('statement') && expectedScore < 4) {
        issues.push('Could not find typical bank statement wording (transactions, balances, or statement period).');
        confidence = Math.min(confidence, 45);
    }

    if (expectedType === 'id' && (text.includes('bank statement') || text.includes('payslip'))) {
        issues.push('This file mentions bank or payslip content — upload your ID document instead.');
        confidence = Math.min(confidence, 25);
    }

    const matches = matchesExpected && issues.length === 0 && confidence >= 55;
    const clearMismatch = issues.length > 0 && confidence < 50;

    let status: DocumentVerificationResult['status'] = 'uploaded';
    if (clearMismatch) status = 'rejected';
    else if (matches && confidence >= 65) status = 'verified';
    else if (issues.length > 0) status = 'uploaded';

    const summary = clearMismatch
        ? `This looks like ${detectedLabel}. Please upload ${expectedLabel}.`
        : status === 'verified'
          ? `${expectedLabel} checks passed.`
          : `${expectedLabel} uploaded — please confirm it is the correct document.`;

    return {
        detectedType: detectedType === 'unknown' ? expectedType : detectedType,
        expectedType,
        matchesExpected: status !== 'rejected',
        confidence,
        status,
        issues,
        summary,
        method: 'heuristic',
        verifiedAt: now,
    };
}
