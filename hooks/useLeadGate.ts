'use client';

import { useCallback, useEffect, useState } from 'react';
import { resolveBuyerQuizResultSync } from '@/lib/quiz-result';

type LeadGateState = {
    loading: boolean;
    /** True when consumer has neither buyer nor seller lead (and no local quiz/seller info). */
    needsQuiz: boolean;
    hasBuyerLead: boolean;
    hasSellerLead: boolean;
};

function hasLocalBuyerQuiz(): boolean {
    if (typeof window === 'undefined') return false;
    const result = resolveBuyerQuizResultSync();
    return Boolean(result?.preQualAmount || result?.score);
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

/**
 * Soft gate: after login, consumers without any lead (and without local quiz data)
 * should finish Get Started. Skips when onboarding intent quiz forms already handle it.
 */
export function useLeadGate(options?: { skip?: boolean }) {
    const skip = Boolean(options?.skip);
    const [state, setState] = useState<LeadGateState>({
        loading: true,
        needsQuiz: false,
        hasBuyerLead: false,
        hasSellerLead: false,
    });

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

        try {
            const res = await fetch('/api/leads/mine', { credentials: 'include' });
            if (!res.ok) {
                const localBuyer = hasLocalBuyerQuiz();
                const localSeller = hasLocalSellerInfo();
                setState({
                    loading: false,
                    needsQuiz: !localBuyer && !localSeller,
                    hasBuyerLead: localBuyer,
                    hasSellerLead: localSeller,
                });
                return;
            }
            const data = await res.json();
            const apiBuyer = Boolean(data.hasBuyerLead);
            const apiSeller = Boolean(data.hasSellerLead);
            const localBuyer = hasLocalBuyerQuiz();
            const localSeller = hasLocalSellerInfo();
            const hasBuyerLead = apiBuyer || localBuyer;
            const hasSellerLead = apiSeller || localSeller;
            setState({
                loading: false,
                needsQuiz: !hasBuyerLead && !hasSellerLead,
                hasBuyerLead,
                hasSellerLead,
            });
        } catch {
            const localBuyer = hasLocalBuyerQuiz();
            const localSeller = hasLocalSellerInfo();
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
