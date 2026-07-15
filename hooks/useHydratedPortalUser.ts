'use client';

import { useEffect, useState } from 'react';
import type { UserPortalUser } from '@/components/UserPortalLayout';
import { readBuyerPortalUser } from '@/lib/buyer-portal-session';
import { readSellerPortalUser } from '@/lib/seller-portal-session';

function useHydratedPortalUser(readUser: () => UserPortalUser | null) {
    const [user, setUser] = useState<UserPortalUser | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setUser(readUser());
        setIsHydrated(true);
    }, []);

    return { user, isHydrated };
}

export function useHydratedBuyerPortalUser() {
    return useHydratedPortalUser(readBuyerPortalUser);
}

export function useHydratedSellerPortalUser() {
    return useHydratedPortalUser(readSellerPortalUser);
}
