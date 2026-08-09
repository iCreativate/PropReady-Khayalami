'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    anonymousLessonsRemaining,
    isLessonLockedForGuest,
} from '@/lib/buyer-learn/anonymous-lesson-limit';
import { getLessonProgress, readBuyerLearnStore, BUYER_LEARN_CHANGED_EVENT } from '@/lib/buyer-learn/progress';
import { fetchAuthSession } from '@/lib/auth-session-bridge';

export function useGuestLessonAccess(
    progressSlug?: string,
    options?: { authenticated?: boolean }
) {
    const [authenticated, setAuthenticated] = useState(Boolean(options?.authenticated));
    const [authReady, setAuthReady] = useState(Boolean(options?.authenticated));
    const [storeVersion, setStoreVersion] = useState(0);

    const bumpStore = useCallback(() => {
        setStoreVersion((v) => v + 1);
    }, []);

    useEffect(() => {
        if (options?.authenticated) {
            setAuthenticated(true);
            setAuthReady(true);
            return;
        }

        let cancelled = false;
        void fetchAuthSession().then((data) => {
            if (cancelled) return;
            setAuthenticated(Boolean(data?.authenticated));
            setAuthReady(true);
        });

        return () => {
            cancelled = true;
        };
    }, [options?.authenticated]);

    useEffect(() => {
        bumpStore();
        window.addEventListener(BUYER_LEARN_CHANGED_EVENT, bumpStore);
        window.addEventListener('focus', bumpStore);
        window.addEventListener('storage', bumpStore);
        return () => {
            window.removeEventListener(BUYER_LEARN_CHANGED_EVENT, bumpStore);
            window.removeEventListener('focus', bumpStore);
            window.removeEventListener('storage', bumpStore);
        };
    }, [bumpStore]);

    const locked = useMemo(
        () => isLessonLockedForGuest(progressSlug, authenticated),
        [progressSlug, authenticated, storeVersion]
    );

    const progress = useMemo(() => {
        void storeVersion;
        return progressSlug ? getLessonProgress(progressSlug).percent : 0;
    }, [progressSlug, storeVersion]);

    const guestSlotsRemaining = useMemo(() => {
        void storeVersion;
        return anonymousLessonsRemaining();
    }, [storeVersion]);

    return {
        locked,
        progress,
        authenticated,
        authReady,
        guestSlotsRemaining,
        isGuest: authReady && !authenticated,
    };
}
