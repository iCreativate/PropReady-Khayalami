'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    mergeBuyerPrequalStatus,
    readLocalBuyerPrequalStatus,
    type BuyerPrequalStatusSnapshot,
} from '@/lib/buyer-prequal-status';
import type { PortalUser } from '@/lib/quiz-result';

type RemotePrequalPayload = {
    hasBuyerQuiz?: boolean;
    hasPrequalCase?: boolean;
    fullPrequalified?: boolean;
    buyerPrequalComplete?: boolean;
};

function mapRemote(payload: RemotePrequalPayload): Partial<BuyerPrequalStatusSnapshot> {
    const hasPrequalCase = Boolean(payload.hasPrequalCase);
    const fullPrequalified = Boolean(payload.fullPrequalified);
    const softPrequalified = Boolean(payload.hasBuyerQuiz);
    const originatorPrequalComplete = hasPrequalCase || fullPrequalified;
    const buyerPrequalComplete = Boolean(
        payload.buyerPrequalComplete || softPrequalified || originatorPrequalComplete
    );

    return {
        softPrequalified,
        hasPrequalCase,
        fullPrequalified,
        buyerPrequalComplete,
        originatorPrequalComplete,
    };
}

export function useBuyerPrequalStatus(user?: PortalUser | null) {
    const [status, setStatus] = useState<BuyerPrequalStatusSnapshot>(() =>
        readLocalBuyerPrequalStatus(user)
    );
    const [loading, setLoading] = useState(Boolean(user));

    const refresh = useCallback(async () => {
        const local = readLocalBuyerPrequalStatus(user);
        if (!user) {
            setStatus(local);
            setLoading(false);
            return local;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/leads/mine', { credentials: 'include' });
            if (!res.ok) {
                setStatus(local);
                return local;
            }
            const data = (await res.json()) as RemotePrequalPayload;
            const merged = mergeBuyerPrequalStatus(local, mapRemote(data));
            setStatus(merged);
            return merged;
        } catch {
            setStatus(local);
            return local;
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { ...status, loading, refresh };
}
