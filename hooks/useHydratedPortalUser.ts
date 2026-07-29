'use client';

import { useEffect, useState } from 'react';
import type { UserPortalUser } from '@/components/UserPortalLayout';
import {
    hydrateSessionFromCookies,
    readOptimisticSession,
} from '@/lib/auth-session-bridge';

/**
 * Resolve portal user from the live cookie session.
 * Seeds immediately from localStorage after mount so navigations do not flash white,
 * then verifies against `/api/auth/session` (cached / deduped).
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

function optimisticUser(accountType: 'user' | 'agent'): UserPortalUser | null {
    const bridged = readOptimisticSession(accountType);
    if (!bridged) return null;
    return {
        id: bridged.id,
        fullName: bridged.fullName || (accountType === 'agent' ? 'Agent' : 'Buyer'),
        email: bridged.email,
    };
}

function useHydratedPortalUser(accountType: 'user' | 'agent') {
    const [user, setUser] = useState<UserPortalUser | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const optimistic = optimisticUser(accountType);
        if (optimistic) {
            setUser(optimistic);
            setIsHydrated(true);
        }

        void resolvePortalUser(accountType).then((next) => {
            if (cancelled) return;
            setUser(next);
            setIsHydrated(true);
        });

        return () => {
            cancelled = true;
        };
    }, [accountType]);

    return { user, isHydrated };
}

export function useHydratedBuyerPortalUser() {
    return useHydratedPortalUser('user');
}

export function useHydratedSellerPortalUser() {
    return useHydratedPortalUser('user');
}
