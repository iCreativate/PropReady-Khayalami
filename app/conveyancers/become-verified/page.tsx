'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Become-verified CTA now registers a real conveyancer account. */
export default function BecomeVerifiedRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/conveyancers/register');
    }, [router]);
    return (
        <div className="min-h-screen bg-[#F8FAFC] px-4 py-16 text-center text-sm text-charcoal/55">
            Redirecting to conveyancer registration…
        </div>
    );
}
