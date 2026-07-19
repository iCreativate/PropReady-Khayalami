'use client';

import { useCallback, useEffect, useState } from 'react';

export type OnboardingIntent = 'buyer' | 'seller';

type GateState = {
    loading: boolean;
    required: boolean;
    intent: OnboardingIntent | null;
    user: { id: string; fullName?: string; email: string; phone?: string } | null;
};

/**
 * Gates dashboards only for first-time magic-link/OAuth users who chose buy/sell.
 * Learner-hub / existing password users never get onboarding_intent set → never gated.
 */
export function useOnboardingGate(expectedIntent?: OnboardingIntent) {
    const [state, setState] = useState<GateState>({
        loading: true,
        required: false,
        intent: null,
        user: null,
    });

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/session', { credentials: 'include' });
            if (!res.ok) {
                setState({ loading: false, required: false, intent: null, user: null });
                return;
            }
            const data = await res.json();
            const intent =
                data.user?.onboardingIntent === 'seller' || data.user?.onboardingIntent === 'buyer'
                    ? (data.user.onboardingIntent as OnboardingIntent)
                    : null;
            const required = Boolean(data.user?.onboardingRequired) && Boolean(intent);
            const matches = !expectedIntent || intent === expectedIntent;

            setState({
                loading: false,
                required: required && matches,
                intent,
                user: data.user
                    ? {
                          id: data.user.profileId || data.user.accountId,
                          fullName: data.user.fullName,
                          email: data.user.email,
                          phone: data.user.phone,
                      }
                    : null,
            });
        } catch {
            setState({ loading: false, required: false, intent: null, user: null });
        }
    }, [expectedIntent]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const completeOnboarding = useCallback(async () => {
        await fetch('/api/auth/complete-onboarding', {
            method: 'POST',
            credentials: 'include',
        });
        setState((prev) => ({ ...prev, required: false }));
    }, []);

    return { ...state, refresh, completeOnboarding };
}
