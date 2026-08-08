import { readBuyerFullPrequal, resolvePrequalMode } from '@/lib/buyer-full-prequal';
import type { BuyerDocument } from '@/lib/buyer-documents';
import { resolveBuyerQuizResultSync, type PortalUser } from '@/lib/quiz-result';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export type BuyerPrequalStatusSnapshot = {
    softPrequalified: boolean;
    hasPrequalCase: boolean;
    fullPrequalified: boolean;
    /** Do not force quiz / onboarding prequal again */
    buyerPrequalComplete: boolean;
    /** Do not prompt to start a new originator prequal */
    originatorPrequalComplete: boolean;
};

export function readLocalBuyerPrequalStatus(user?: PortalUser | null): BuyerPrequalStatusSnapshot {
    const quiz = user ? resolveBuyerQuizResultSync(user) : null;
    const softPrequalified = Boolean(
        quiz && (quiz.preQualAmount != null || quiz.score != null)
    );

    const record = user?.id ? readBuyerFullPrequal(user.id) : null;
    const prequalMode = resolvePrequalMode({
        userId: user?.id,
        softAmount: quiz?.preQualAmount ?? null,
    });

    const documentsSent = (() => {
        if (!user?.id || typeof window === 'undefined') return false;
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.documentsSent);
            if (!raw) return false;
            const sent = JSON.parse(raw) as { userId?: string };
            return !sent.userId || sent.userId === user.id;
        } catch {
            return false;
        }
    })();

    const fullPrequalified = Boolean(
        prequalMode.isFull ||
            (record?.status === 'confirmed' && record.amount && record.amount > 0)
    );
    const originatorPrequalComplete = Boolean(
        fullPrequalified || prequalMode.isAwaitingFull || documentsSent
    );
    const buyerPrequalComplete = softPrequalified || originatorPrequalComplete;

    return {
        softPrequalified,
        hasPrequalCase: false,
        fullPrequalified,
        buyerPrequalComplete,
        originatorPrequalComplete,
    };
}

export function mergeBuyerPrequalStatus(
    local: BuyerPrequalStatusSnapshot,
    remote?: Partial<BuyerPrequalStatusSnapshot> | null
): BuyerPrequalStatusSnapshot {
    if (!remote) return local;

    const hasPrequalCase = Boolean(remote.hasPrequalCase);
    const fullPrequalified = Boolean(local.fullPrequalified || remote.fullPrequalified);
    const softPrequalified = Boolean(local.softPrequalified || remote.softPrequalified);
    const originatorPrequalComplete = Boolean(
        local.originatorPrequalComplete || remote.originatorPrequalComplete || hasPrequalCase || fullPrequalified
    );
    const buyerPrequalComplete = Boolean(
        local.buyerPrequalComplete || remote.buyerPrequalComplete || softPrequalified || hasPrequalCase
    );

    return {
        softPrequalified,
        hasPrequalCase,
        fullPrequalified,
        buyerPrequalComplete,
        originatorPrequalComplete,
    };
}

export function resolveLocalOriginatorPrequalComplete(input: {
    userId?: string | null;
    softAmount?: number | null;
    documents?: BuyerDocument[];
}): boolean {
    const mode = resolvePrequalMode(input);
    return mode.isFull || mode.isAwaitingFull;
}
