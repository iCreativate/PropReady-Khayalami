'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentAgent, type AgentSession } from '@/lib/auth';

export function useRequireAgent(redirectTo = '/agents/login') {
    const router = useRouter();
    const [agent, setAgent] = useState<AgentSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const session = getCurrentAgent();
        if (!session) {
            router.replace(redirectTo);
            return;
        }
        setAgent(session);
        setIsLoading(false);
    }, [router, redirectTo]);

    return { agent, isLoading, isAuthenticated: !!agent };
}
