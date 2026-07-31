'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy demo firm dashboard → live conveyancer portal. */
export default function FirmDashboardRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/conveyancers/portal');
    }, [router]);
    return (
        <div className="min-h-screen bg-[#F8FAFC] px-4 py-16 text-center text-sm text-charcoal/55">
            Opening conveyancer portal…
        </div>
    );
}
