'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { UserPortalUser } from '@/components/UserPortalLayout';
import {
    hydrateSessionFromCookies,
    readOptimisticSession,
} from '@/lib/auth-session-bridge';

/**
 * Resolve portal user from the live cookie session.
 * Optimistic localStorage is read via useSyncExternalStore so SSR/hydration
 * both see `null` (getServerSnapshot), avoiding HTML mismatches, then the
 * client snapshot applies immediately after hydrate.
 */
async function resolvePortalUser(
    accountType: 'user' | 'agent'
): Promise<UserPortalUser | null> {
    const bridged = await hydrateSessionFromCookies();
    if (!bridged) return null;

    const bridgedType = bridged.accountType || accountType;
    if (bridgedType !== accountType) return null;

    return {
        id: bridged.id,
        fullName: bridged.fullName || (accountType === 'agent' ? 'Agent' : 'Buyer'),
        email: bridged.email,
    };
}

function readOptimisticUser(accountType: 'user' | 'agent'): UserPortalUser | null {
    const bridged = readOptimisticSession(accountType);
    if (!bridged) return null;
    return {
        id: bridged.id,
        fullName: bridged.fullName || (accountType === 'agent' ? 'Agent' : 'Buyer'),
        email: bridged.email,
    };
}

/** Cache so getSnapshot returns a stable reference (required by useSyncExternalStore). */
const optimisticCache = new Map<'user' | 'agent', UserPortalUser | null>();

function getOptimisticSnapshot(accountType: 'user' | 'agent'): UserPortalUser | null {
    if (typeof window === 'undefined') return null;
    if (!optimisticCache.has(accountType)) {
        optimisticCache.set(accountType, readOptimisticUser(accountType));
    }
    return optimisticCache.get(accountType) ?? null;
}

/** No-op subscribe — optimistic session is snapshotted once per page load. */
function subscribeNoop() {
    return () => {};
}

function useOptimisticPortalUser(accountType: 'user' | 'agent') {
    return useSyncExternalStore(
        subscribeNoop,
        () => getOptimisticSnapshot(accountType),
        () => null
    );
}

function useHydratedPortalUser(accountType: 'user' | 'agent') {
    const optimistic = useOptimisticPortalUser(accountType);
    const [user, setUser] = useState<UserPortalUser | null>(null);
    const [sessionChecked, setSessionChecked] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void resolvePortalUser(accountType)
            .then((next) => {
                if (cancelled) return;
                setUser(next);
                setSessionChecked(true);
            })
            .catch(() => {
                if (cancelled) return;
                setUser(null);
                setSessionChecked(true);
            });

        return () => {
            cancelled = true;
        };
    }, [accountType]);

    return {
        user: user ?? optimistic,
        // Hydrated once we have an optimistic client session or API result.
        // Server + hydration pass: both null → isHydrated false (matches PortalLoading).
        isHydrated: sessionChecked || optimistic !== null,
    };
}

export function useHydratedBuyerPortalUser() {
    return useHydratedPortalUser('user');
}

export function useHydratedSellerPortalUser() {
    return useHydratedPortalUser('user');
}
