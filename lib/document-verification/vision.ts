import { buyerDocumentTypeLabel, type BuyerDocumentType } from '@/lib/buyer-documents';
import type { DocumentVerificationResult, DetectedDocumentType } from '@/lib/document-verification/types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();

const TYPE_ALIASES: Record<string, DetectedDocumentType> = {
    id: 'id',
    identity: 'id',
    'id document': 'id',
    passport: 'id',
    'proof of residence': 'residence',
    residence: 'residence',
    'proof of address': 'residence',
    address: 'residence',
    utility: 'residence',
    income: 'income',
    payslip: 'income',
    'proof of income': 'income',
    salary: 'income',
    'bank statement': 'bank-statement',
    'bank-statement': 'bank-statement',
    statement: 'bank-statement',
    other: 'other',
    unknown: 'unknown',
};

function normalizeDetectedType(raw: string | undefined): DetectedDocumentType {
    if (!raw) return 'unknown';
    const key = raw.toLowerCase().trim();
    return TYPE_ALIASES[key] ?? 'unknown';
}

export async function verifyDocumentVision(input: {
    expectedType: BuyerDocumentType;
    buffer: Buffer;
    mime: string;
}): Promise<DocumentVerificationResult | null> {
    if (!OPENAI_API_KEY) return null;
    if (!input.mime.startsWith('image/')) return null;

    const expectedLabel = buyerDocumentTypeLabel(input.expectedType);
    const base64 = input.buffer.toString('base64');
    const dataUrl = `data:${input.mime};base64,${base64}`;

    const system = `You verify South African home-loan FICA documents. Respond with JSON only.
Expected categories: id (SA ID/passport), residence (utility/address proof ≤3 months), income (payslip/employment letter), bank-statement (multi-month bank statement), other.
Be strict: a bank statement uploaded as ID must fail. Educational checks only — not legal advice.`;

    const userText = `Expected slot: "${input.expectedType}" (${expectedLabel}).
Return JSON: {"detectedType":"id|residence|income|bank-statement|other|unknown","matchesExpected":boolean,"confidence":0-100,"issues":["..."],"summary":"one sentence"}`;

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                temperature: 0.1,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: system },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: userText },
                            { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
                        ],
                    },
                ],
                max_tokens: 400,
            }),
        });

        if (!res.ok) {
            console.warn('[document-verification] Vision API error:', res.status);
            return null;
        }

        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (!raw || typeof raw !== 'string') return null;

        const parsed = JSON.parse(raw) as {
            detectedType?: string;
            matchesExpected?: boolean;
            confidence?: number;
            issues?: string[];
            summary?: string;
        };

        const detectedType = normalizeDetectedType(parsed.detectedType);
        const confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0));
        const issues = Array.isArray(parsed.issues)
            ? parsed.issues.filter((i) => typeof i === 'string').slice(0, 5)
            : [];

        const matchesExpected =
            parsed.matchesExpected === true ||
            (detectedType === input.expectedType && confidence >= 60) ||
            (input.expectedType === 'other' && confidence >= 50);

        let status: DocumentVerificationResult['status'] = 'uploaded';
        if (!matchesExpected && confidence >= 55) status = 'rejected';
        else if (matchesExpected && confidence >= 70) status = 'verified';
        else if (matchesExpected) status = 'uploaded';

        if (input.expectedType === 'other' && confidence >= 45) {
            status = 'verified';
        }

        return {
            detectedType,
            expectedType: input.expectedType,
            matchesExpected: status !== 'rejected',
            confidence,
            status,
            issues,
            summary:
                typeof parsed.summary === 'string' && parsed.summary.trim()
                    ? parsed.summary.trim()
                    : matchesExpected
                      ? `${expectedLabel} looks correct.`
                      : `Please upload ${expectedLabel}.`,
            method: 'vision',
            verifiedAt: new Date().toISOString(),
        };
    } catch (err) {
        console.warn('[document-verification] Vision failed:', err);
        return null;
    }
}
