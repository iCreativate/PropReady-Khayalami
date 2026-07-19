'use client';

import { useEffect, useState } from 'react';
import type { UserPortalUser } from '@/components/UserPortalLayout';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import { readBuyerPortalUser } from '@/lib/buyer-portal-session';
import { readSellerPortalUser } from '@/lib/seller-portal-session';

async function resolvePortalUser(
    readLocal: () => UserPortalUser | null,
    accountType: 'user' | 'agent'
): Promise<UserPortalUser | null> {
    const local = readLocal();
    if (local) return local;

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

export function useHydratedBuyerPortalUser() {
    const [user, setUser] = useState<UserPortalUser | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void resolvePortalUser(readBuyerPortalUser, 'user').then((next) => {
            if (cancelled) return;
            setUser(next);
            setIsHydrated(true);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    return { user, isHydrated };
}

export function useHydratedSellerPortalUser() {
    const [user, setUser] = useState<UserPortalUser | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void resolvePortalUser(readSellerPortalUser, 'user').then((next) => {
            if (cancelled) return;
            setUser(next);
            setIsHydrated(true);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    return { user, isHydrated };
}
