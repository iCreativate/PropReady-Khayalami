'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseAccountType } from '@/lib/auth-enterprise/account-profile';

/**
 * Consumer registration is quiz-first.
 * Agents/originators keep their dedicated register portals.
 */
export default function AuthRegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedType = parseAccountType(searchParams.get('type'));

    useEffect(() => {
        if (requestedType === 'agent') {
            router.replace('/agents/register');
            return;
        }
        if (requestedType === 'originator') {
            router.replace('/originators/register');
            return;
        }
        router.replace('/get-started');
    }, [requestedType, router]);

    if (requestedType === 'agent' || requestedType === 'originator') {
        return (
            <div className="min-h-screen flex items-center justify-center text-charcoal/55 text-sm">
                Redirecting to professional registration…
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-charcoal/55 text-sm">Starting with a short quiz…</p>
            <Link href="/get-started" className="text-gold font-medium text-sm hover:underline">
                Continue to Get Started
            </Link>
        </div>
    );
}
