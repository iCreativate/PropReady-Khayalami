/**
 * PPRA practitioner verification — validation, status, backwards-compatible access.
 */

export type PpraVerificationStatus = 'pending' | 'verified' | 'rejected';

export const PPRA_NUMBER_REGEX = /^\d{7}$/;
export const FFC_NUMBER_REGEX = /^20\d{13}$/;

export const PPRA_NUMBER_ERROR = 'Please enter a valid 7-digit PPRA Practitioner Number.';
export const FFC_NUMBER_ERROR = 'Please enter a valid 15-digit Fidelity Fund Certificate Number.';

export const PPRA_ACCESS_MESSAGE =
    'Complete your PPRA verification to access leads and appear on PropReady.';

export const FFC_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const FFC_DOCUMENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
] as const;

export interface AgentPpraFields {
    ppraNumber?: string | null;
    ffcNumber?: string | null;
    ffcDocumentUrl?: string | null;
    verificationStatus?: PpraVerificationStatus | string | null;
    verificationDate?: string | null;
    verifiedBy?: string | null;
    verificationNotes?: string | null;
    /** Legacy account approval */
    status?: string | null;
    eaabNumber?: string | null;
}

export function normalizePpraNumber(value: string): string {
    return value.replace(/\D/g, '').slice(0, 7);
}

export function normalizeFfcNumber(value: string): string {
    return value.replace(/\D/g, '').slice(0, 15);
}

export function validatePpraNumber(value: string): boolean {
    return PPRA_NUMBER_REGEX.test(normalizePpraNumber(value));
}

export function validateFfcNumber(value: string): boolean {
    if (!value.trim()) return true;
    return FFC_NUMBER_REGEX.test(normalizeFfcNumber(value));
}

/** Existing agents without new fields remain verified (grandfathered). */
export function isAgentPpraVerified(agent: AgentPpraFields | null | undefined): boolean {
    if (!agent) return false;
    const status = (agent.verificationStatus || '').toLowerCase();
    if (status === 'verified') return true;
    if (status === 'rejected') return false;
    if (status === 'pending') return false;
    // Legacy: approved before PPRA system, or no ppra_number yet
    if (!agent.ppraNumber && !agent.verificationStatus) {
        return agent.status === 'approved';
    }
    return false;
}

export function hasFfcDocumentUploaded(agent: AgentPpraFields | null | undefined): boolean {
    return !!(agent?.ffcDocumentUrl && String(agent.ffcDocumentUrl).length > 0);
}

export function getPublicPpraNumber(agent: AgentPpraFields): string | null {
    const n = agent.ppraNumber || agent.eaabNumber;
    if (!n) return null;
    const cleaned = normalizePpraNumber(String(n));
    return PPRA_NUMBER_REGEX.test(cleaned) ? cleaned : null;
}

export function verificationStatusLabel(status: PpraVerificationStatus | string): string {
    switch (status) {
        case 'verified':
            return 'PPRA Verified';
        case 'rejected':
            return 'Verification Failed';
        default:
            return 'Verification Pending';
    }
}
