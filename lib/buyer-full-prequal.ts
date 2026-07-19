import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { BuyerDocument } from '@/lib/buyer-documents';
import { bondOriginatorLabel } from '@/lib/bond-originators';

export type FullPrequalStatus = 'pending' | 'confirmed';

export interface BuyerFullPrequal {
    userId: string;
    status: FullPrequalStatus;
    /** Official amount from originator / bank letter */
    amount: number | null;
    softAmount?: number | null;
    originatorId?: string | null;
    originatorName?: string | null;
    letterUploadedAt?: string | null;
    confirmedAt?: string | null;
    updatedAt: string;
}

function storageKey(userId: string) {
    return `propReady_fullPrequal_${userId}`;
}

export function readBuyerFullPrequal(userId?: string | null): BuyerFullPrequal | null {
    if (typeof window === 'undefined' || !userId) return null;
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as BuyerFullPrequal;
        if (!parsed || parsed.userId !== userId) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function writeBuyerFullPrequal(record: BuyerFullPrequal): BuyerFullPrequal {
    if (typeof window === 'undefined') return record;
    const next = { ...record, updatedAt: new Date().toISOString() };
    localStorage.setItem(storageKey(record.userId), JSON.stringify(next));
    // Alias for dashboards that look at global key
    localStorage.setItem(STORAGE_KEYS.fullPrequal, JSON.stringify(next));
    return next;
}

export function markOriginatorPrequalPending(input: {
    userId: string;
    softAmount?: number | null;
    originatorId?: string | null;
}): BuyerFullPrequal {
    const existing = readBuyerFullPrequal(input.userId);
    if (existing?.status === 'confirmed' && existing.amount) {
        return existing;
    }
    return writeBuyerFullPrequal({
        userId: input.userId,
        status: existing?.status === 'confirmed' ? 'confirmed' : 'pending',
        amount: existing?.amount ?? null,
        softAmount: input.softAmount ?? existing?.softAmount ?? null,
        originatorId: input.originatorId ?? existing?.originatorId ?? null,
        originatorName:
            bondOriginatorLabel(input.originatorId) ?? existing?.originatorName ?? null,
        letterUploadedAt: existing?.letterUploadedAt ?? null,
        confirmedAt: existing?.confirmedAt ?? null,
        updatedAt: new Date().toISOString(),
    });
}

/** Call when a pre-qualification letter document is uploaded. */
export function markOriginatorLetterUploaded(input: {
    userId: string;
    softAmount?: number | null;
    amount?: number | null;
}): BuyerFullPrequal {
    const existing = readBuyerFullPrequal(input.userId);
    const amount = input.amount ?? existing?.amount ?? null;
    const originatorId =
        existing?.originatorId ??
        (typeof window !== 'undefined'
            ? localStorage.getItem(STORAGE_KEYS.selectedOriginator)
            : null);

    return writeBuyerFullPrequal({
        userId: input.userId,
        status: amount && amount > 0 ? 'confirmed' : 'pending',
        amount,
        softAmount: input.softAmount ?? existing?.softAmount ?? null,
        originatorId,
        originatorName: bondOriginatorLabel(originatorId) ?? existing?.originatorName ?? null,
        letterUploadedAt: new Date().toISOString(),
        confirmedAt: amount && amount > 0 ? new Date().toISOString() : existing?.confirmedAt ?? null,
        updatedAt: new Date().toISOString(),
    });
}

export function confirmFullPrequalAmount(input: {
    userId: string;
    amount: number;
    softAmount?: number | null;
    originatorId?: string | null;
}): BuyerFullPrequal {
    const existing = readBuyerFullPrequal(input.userId);
    const originatorId =
        input.originatorId ??
        existing?.originatorId ??
        (typeof window !== 'undefined'
            ? localStorage.getItem(STORAGE_KEYS.selectedOriginator)
            : null);

    return writeBuyerFullPrequal({
        userId: input.userId,
        status: 'confirmed',
        amount: Math.round(input.amount),
        softAmount: input.softAmount ?? existing?.softAmount ?? null,
        originatorId,
        originatorName: bondOriginatorLabel(originatorId) ?? existing?.originatorName ?? null,
        letterUploadedAt: existing?.letterUploadedAt ?? new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
}

export type PrequalMode = 'none' | 'soft' | 'awaiting_full' | 'full';

export interface PrequalModeInfo {
    mode: PrequalMode;
    isSoft: boolean;
    isFull: boolean;
    isAwaitingFull: boolean;
    displayAmount: number;
    softAmount: number;
    fullAmount: number | null;
    originatorName: string | null;
    letterUploaded: boolean;
    hasSentToOriginator: boolean;
    record: BuyerFullPrequal | null;
}

function hasSentDocuments(userId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.documentsSent);
        if (!raw) return false;
        const sent = JSON.parse(raw) as { userId?: string };
        return !sent.userId || sent.userId === userId;
    } catch {
        return false;
    }
}

export function resolvePrequalMode(input: {
    userId?: string | null;
    softAmount?: number | null;
    documents?: BuyerDocument[];
}): PrequalModeInfo {
    const softAmount = Math.max(0, Math.round(input.softAmount ?? 0));
    const docs = input.documents ?? [];
    const letterUploaded = docs.some(
        (d) =>
            d.type === 'pre-qualification' &&
            (d.status === 'uploaded' || d.status === 'verified' || d.status === 'pending')
    );
    const hasSentToOriginator = input.userId ? hasSentDocuments(input.userId) : false;
    const record = input.userId ? readBuyerFullPrequal(input.userId) : null;
    const fullAmount =
        record?.amount && record.amount > 0 ? Math.round(record.amount) : null;

    // Full = official amount confirmed from originator letter / process
    const isFull = Boolean(
        fullAmount &&
            (record?.status === 'confirmed' ||
                letterUploaded ||
                hasSentToOriginator ||
                Boolean(record?.letterUploadedAt))
    );

    const isAwaitingFull =
        !isFull && (hasSentToOriginator || letterUploaded || record?.status === 'pending');

    let mode: PrequalMode = 'none';
    if (isFull) mode = 'full';
    else if (isAwaitingFull) mode = 'awaiting_full';
    else if (softAmount > 0) mode = 'soft';

    const displayAmount = isFull && fullAmount ? fullAmount : softAmount;

    return {
        mode,
        isSoft: mode === 'soft' || mode === 'awaiting_full',
        isFull,
        isAwaitingFull,
        displayAmount,
        softAmount,
        fullAmount,
        originatorName: record?.originatorName ?? null,
        letterUploaded,
        hasSentToOriginator,
        record,
    };
}
