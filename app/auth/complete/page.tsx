'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hydrateSessionFromCookies } from '@/lib/auth-session-bridge';
import {
    dashboardPathForAccountType,
    loginPathForAccountType,
    parseAccountType,
} from '@/lib/auth-enterprise/account-profile';
import { readPersistedLoginRole } from '@/lib/auth-login-roles';
import {
    applyClientPostLoginDestination,
    readStoredPostLoginNext,
} from '@/lib/post-login-routing-client';

function appendNextQuery(path: string, next: string | null): string {
    if (!next) return path;
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}next=${encodeURIComponent(next)}`;
}

function AuthCompleteInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState('Finishing sign-in…');

    useEffect(() => {
        let cancelled = false;

        async function run() {
            const type = parseAccountType(searchParams.get('type'));
            const next = searchParams.get('next') || readStoredPostLoginNext();

            const user = await hydrateSessionFromCookies();
            if (cancelled) return;

            if (!user) {
                setMessage('Session expired. Redirecting to sign in…');
                router.replace(loginPathForAccountType(type));
                return;
            }

            const resolvedType = parseAccountType(user.accountType || type);

            try {
                const res = await fetch('/api/auth/session', { credentials: 'include' });
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;

                const u = data?.user;
                if (u?.passwordOk === false) {
                    setMessage('Confirming your password…');
                    const returnNext = next || readStoredPostLoginNext();
                    router.replace(
                        appendNextQuery(
                            u.hasPassword === false
                                ? `/auth/complete-profile?type=${resolvedType}`
                                : `/auth/confirm-password?type=${resolvedType}`,
                            returnNext
                        )
                    );
                    return;
                }

                if (u && u.profileComplete === false) {
                    setMessage('Confirming your identity…');
                    router.replace(
                        appendNextQuery(
                            `/auth/complete-profile?type=${resolvedType}`,
                            next || readStoredPostLoginNext()
                        )
                    );
                    return;
                }
            } catch {
                /* fall through */
            }

            if (next) {
                router.replace(applyClientPostLoginDestination(next, { explicitNext: next }));
                return;
            }

            setMessage('Finding your workspace…');
            const role = readPersistedLoginRole();
            const roleQ = role ? `?role=${encodeURIComponent(role)}` : '';
            try {
                const destRes = await fetch(`/api/auth/post-login-destination${roleQ}`, {
                    credentials: 'include',
                });
                const destData = await destRes.json().catch(() => ({}));
                if (cancelled) return;
                const serverPath =
                    destData?.redirectTo || dashboardPathForAccountType(resolvedType);
                router.replace(
                    applyClientPostLoginDestination(serverPath, {
                        explicitNext: readStoredPostLoginNext(),
                    })
                );
            } catch {
                if (!cancelled) {
                    router.replace(
                        applyClientPostLoginDestination(
                            dashboardPathForAccountType(resolvedType)
                        )
                    );
                }
            }
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
