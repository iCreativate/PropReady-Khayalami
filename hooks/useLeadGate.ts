'use client';

import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/storage-keys';

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

/**
 * Compulsory quiz gate: signed-in consumers without buyer/seller lead (and without
 * local quiz data) must complete Get Started before using the portal.
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
