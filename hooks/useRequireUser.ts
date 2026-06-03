'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, type UserSession } from '@/lib/auth';

export function useRequireUser(redirectTo = '/login') {
    const router = useRouter();
    const [user, setUser] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const session = getCurrentUser();
        if (!session) {
            router.replace(redirectTo);
            return;
        }
        setUser(session);
        setIsLoading(false);
    }, [router, redirectTo]);

    return { user, isLoading, isAuthenticated: !!user };
}
