'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import {
    dashboardPathForAccountType,
    loginPathForAccountType,
    parseAccountType,
} from '@/lib/auth-enterprise/account-profile';

function AuthCompleteInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState('Finishing sign-in…');

    useEffect(() => {
        let cancelled = false;

        async function run() {
            const type = parseAccountType(searchParams.get('type'));
            const next = searchParams.get('next');

            const user = await hydrateSessionFromCookies();
            if (cancelled) return;

            if (!user) {
                setMessage('Session expired. Redirecting to sign in…');
                router.replace(loginPathForAccountType(type));
                return;
            }

            try {
                const res = await fetch('/api/auth/session', { credentials: 'include' });
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;

                const u = data?.user;
                const resolvedType = parseAccountType(u?.accountType || type);
                if (u?.passwordOk === false) {
                    setMessage('Confirming your password…');
                    router.replace(
                        u.hasPassword === false
                            ? `/auth/complete-profile?type=${resolvedType}`
                            : `/auth/confirm-password?type=${resolvedType}`
                    );
                    return;
                }

                if (u && u.profileComplete === false) {
                    setMessage('Confirming your identity…');
                    router.replace(`/auth/complete-profile?type=${resolvedType}`);
                    return;
                }
            } catch {
                /* fall through */
            }

            const destination =
                next || dashboardPathForAccountType(user.accountType || type);
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
