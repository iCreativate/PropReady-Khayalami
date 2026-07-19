'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';

function AuthCompleteInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState('Finishing sign-in…');

    useEffect(() => {
        let cancelled = false;

        async function run() {
            const type = searchParams.get('type') === 'agent' ? 'agent' : 'user';
            const next = searchParams.get('next');

            const user = await hydrateSessionFromCookies();
            if (cancelled) return;

            if (!user) {
                setMessage('Session expired. Redirecting to sign in…');
                router.replace(type === 'agent' ? '/auth/login?type=agent' : '/auth/login');
                return;
            }

            try {
                const res = await fetch('/api/auth/session', { credentials: 'include' });
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;

                const u = data?.user;
                if (u?.passwordOk === false) {
                    setMessage('Confirming your password…');
                    router.replace(
                        u.hasPassword === false
                            ? type === 'agent' || u.accountType === 'agent'
                                ? '/auth/complete-profile?type=agent'
                                : '/auth/complete-profile'
                            : type === 'agent' || u.accountType === 'agent'
                              ? '/auth/confirm-password?type=agent'
                              : '/auth/confirm-password'
                    );
                    return;
                }

                if (u && u.profileComplete === false) {
                    setMessage('Confirming your identity…');
                    router.replace(
                        type === 'agent' || u.accountType === 'agent'
                            ? '/auth/complete-profile?type=agent'
                            : '/auth/complete-profile'
                    );
                    return;
                }
            } catch {
                /* fall through */
            }

            const destination =
                next ||
                (user.accountType === 'agent' || type === 'agent'
                    ? '/agents/dashboard'
                    : '/dashboard');
            router.replace(destination);
        }

        void run();
        return () => {
            cancelled = true;
        };
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-cream text-charcoal/70 text-sm">
            {message}
        </div>
    );
}

export default function AuthCompletePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-cream text-charcoal/70 text-sm">
                    Finishing sign-in…
                </div>
            }
        >
            <AuthCompleteInner />
        </Suspense>
    );
}
