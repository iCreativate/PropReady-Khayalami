'use client';

import { useEffect, useRef } from 'react';
import { loginPathForAccountType, parseAccountType } from '@/lib/auth-enterprise/account-profile';
import type { AccountType } from '@/lib/auth-enterprise/config';
import { clearLegacyAuthStorage, fetchAuthSession } from '@/lib/auth-session-bridge';
import { signOutClient } from '@/lib/auth-signout';
import {
    clearSessionActivity,
    IDLE_ACTIVITY_STORAGE_KEY,
    isIdlePastTimeout,
    markSessionActivity,
    withIdleTimeoutQuery,
} from '@/lib/idle-session';

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart',
    'scroll',
    'wheel',
];

const AUTH_REFRESH_MS = 60_000;
const IDLE_CHECK_MS = 15_000;
const ACTIVITY_THROTTLE_MS = 1_000;

type WatchedAccount = AccountType | 'admin';

function isAuthPublicPath(pathname: string): boolean {
    return (
        pathname.startsWith('/auth/login') ||
        pathname.startsWith('/auth/register') ||
        pathname.startsWith('/auth/forgot-password') ||
        pathname.startsWith('/auth/reset-password') ||
        pathname.startsWith('/auth/magic-link') ||
        pathname.startsWith('/agents/login') ||
        pathname.startsWith('/originators/login') ||
        pathname.startsWith('/conveyancers/login') ||
        pathname.startsWith('/admin/login')
    );
}

/**
 * Automatically signs out authenticated users after 15 minutes of inactivity.
 * Mounted once from AppProviders.
 */
export default function IdleSessionTimeout() {
    const accountRef = useRef<WatchedAccount | null>(null);
    const loggingOutRef = useRef(false);
    const lastMarkRef = useRef(0);

    useEffect(() => {
        let cancelled = false;
        let authTimer: number | undefined;
        let checkTimer: number | undefined;

        const bumpActivity = () => {
            if (!accountRef.current) return;
            const now = Date.now();
            if (now - lastMarkRef.current < ACTIVITY_THROTTLE_MS) return;
            lastMarkRef.current = now;
            markSessionActivity(now);
        };

        const resolveAuth = async (): Promise<WatchedAccount | null> => {
            const pathname = window.location.pathname;

            if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
                try {
                    const res = await fetch('/api/admin/auth/session', {
                        credentials: 'include',
                        cache: 'no-store',
                    });
                    if (res.ok) return 'admin';
                } catch {
                    /* fall through to consumer/professional session */
                }
            }

            const session = await fetchAuthSession();
            if (!session?.authenticated || !session.user) return null;
            return parseAccountType(session.user.accountType);
        };

        const logoutForIdle = async () => {
            if (cancelled || loggingOutRef.current) return;
            const account = accountRef.current;
            if (!account) return;
            if (!isIdlePastTimeout()) return;

            loggingOutRef.current = true;
            clearSessionActivity();

            try {
                if (account === 'admin') {
                    try {
                        await fetch('/api/admin/auth/session', {
                            method: 'DELETE',
                            credentials: 'include',
                        });
                    } catch {
                        /* still clear client */
                    }
                    clearLegacyAuthStorage();
                    window.location.href = withIdleTimeoutQuery('/admin/login');
                    return;
                }

                await signOutClient({
                    accountType: account,
                    redirectTo: withIdleTimeoutQuery(loginPathForAccountType(account)),
                });
            } catch {
                loggingOutRef.current = false;
            }
        };

        const refreshAuthState = async () => {
            if (cancelled || loggingOutRef.current) return;
            const next = await resolveAuth();
            if (cancelled) return;

            const prev = accountRef.current;
            accountRef.current = next;

            if (next && !prev) {
                if (!localStorage.getItem(IDLE_ACTIVITY_STORAGE_KEY)) {
                    markSessionActivity();
                } else if (isIdlePastTimeout()) {
                    await logoutForIdle();
                    return;
                }
            }
            if (!next) {
                if (prev) clearSessionActivity();
                return;
            }

            if (isIdlePastTimeout()) {
                await logoutForIdle();
            }
        };

        const onVisibility = () => {
            if (document.visibilityState !== 'visible') return;
            void logoutForIdle();
        };

        const onStorage = (event: StorageEvent) => {
            if (event.key !== IDLE_ACTIVITY_STORAGE_KEY) return;
            if (!event.newValue) return;
            lastMarkRef.current = Date.now();
        };

        void refreshAuthState();

        for (const eventName of ACTIVITY_EVENTS) {
            window.addEventListener(eventName, bumpActivity, { passive: true });
        }
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('storage', onStorage);

        authTimer = window.setInterval(() => {
            void refreshAuthState();
        }, AUTH_REFRESH_MS);

        checkTimer = window.setInterval(() => {
            if (!accountRef.current) return;
            if (isAuthPublicPath(window.location.pathname)) return;
            void logoutForIdle();
        }, IDLE_CHECK_MS);

        return () => {
            cancelled = true;
            for (const eventName of ACTIVITY_EVENTS) {
                window.removeEventListener(eventName, bumpActivity);
            }
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('storage', onStorage);
            if (authTimer) window.clearInterval(authTimer);
            if (checkTimer) window.clearInterval(checkTimer);
        };
    }, []);

    return null;
}
