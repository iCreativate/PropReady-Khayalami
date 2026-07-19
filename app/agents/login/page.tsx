'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PortalLoading from '@/components/PortalLoading';

/** Agent login lives on the unified auth surface. */
export default function AgentLoginPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/auth/login?type=agent');
    }, [router]);

    return <PortalLoading message="Redirecting to agent sign-in…" />;
}
