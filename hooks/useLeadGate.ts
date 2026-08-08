'use client';

import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { fetchLeadsMine } from '@/lib/leads-mine-client';

type LeadGateState = {
    loading: boolean;
    /** True when consumer has neither buyer nor seller lead (and no local quiz/seller info). */
    needsQuiz: boolean;
    hasBuyerLead: boolean;
    hasSellerLead: boolean;
};

function hasLocalBuyerQuiz(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.quizResult);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as { preQualAmount?: number; score?: number };
        return parsed?.preQualAmount != null || parsed?.score != null;
    } catch {
        return false;
    }
}

function hasLocalSellerInfo(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const raw = localStorage.getItem('propReady_sellerInfo');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return Boolean(parsed?.email || parsed?.propertyAddress || parsed?.fullName);
    } catch {
        return false;
    }
}

function initialLeadGateState(skip: boolean): LeadGateState {
    if (skip) {
        return {
            loading: false,
            needsQuiz: false,
            hasBuyerLead: true,
            hasSellerLead: true,
        };
    }
    const localBuyer = hasLocalBuyerQuiz();
    const localSeller = hasLocalSellerInfo();
    return {
        loading: !localBuyer && !localSeller,
        needsQuiz: !localBuyer && !localSeller,
        hasBuyerLead: localBuyer,
        hasSellerLead: localSeller,
    };
}

/**
 * Compulsory quiz gate: signed-in consumers without buyer/seller lead (and without
 * local quiz data) must complete Get Started before using the portal.
 */
export function useLeadGate(options?: { skip?: boolean }) {
    const skip = Boolean(options?.skip);
    const [state, setState] = useState<LeadGateState>(() => initialLeadGateState(skip));

    const refresh = useCallback(async () => {
        if (skip) {
            setState({
                loading: false,
                needsQuiz: false,
                hasBuyerLead: true,
                hasSellerLead: true,
            });
            return;
        }

        const localBuyer = hasLocalBuyerQuiz();
        const localSeller = hasLocalSellerInfo();

        try {
            const data = await fetchLeadsMine();
            if (!data) {
                setState({
                    loading: false,
                    needsQuiz: !localBuyer && !localSeller,
                    hasBuyerLead: localBuyer,
                    hasSellerLead: localSeller,
                });
                return;
            }
            const apiBuyer = Boolean(data.hasBuyerLead);
            const apiSeller = Boolean(data.hasSellerLead);
            const apiBuyerQuiz = Boolean(data.hasBuyerQuiz || data.buyerPrequalComplete);
            const hasBuyerLead = apiBuyer || localBuyer || apiBuyerQuiz;
            const hasSellerLead = apiSeller || localSeller;
            setState({
                loading: false,
                needsQuiz: !hasBuyerLead && !hasSellerLead,
                hasBuyerLead,
                hasSellerLead,
            });
        } catch {
            setState({
                loading: false,
                needsQuiz: !localBuyer && !localSeller,
                hasBuyerLead: localBuyer,
                hasSellerLead: localSeller,
            });
        }
    }, [skip]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { ...state, refresh };
}
