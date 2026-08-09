'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
    ANONYMOUS_COMPLETED_LESSON_LIMIT,
    countGuestLessonSlotsUsed,
} from '@/lib/buyer-learn/anonymous-lesson-limit';
import { BUYER_LEARN_CHANGED_EVENT } from '@/lib/buyer-learn/progress';
import { fetchAuthSession } from '@/lib/auth-session-bridge';
import { useCallback, useEffect, useState } from 'react';

/** Banner on public learning hubs explaining the 3-lesson guest limit. */
export default function GuestLearningHubBanner() {
    const [visible, setVisible] = useState(false);
    const [slotsUsed, setSlotsUsed] = useState(0);

    const refresh = useCallback(async () => {
        const session = await fetchAuthSession();
        if (session?.authenticated) {
            setVisible(false);
            return;
        }
        const used = countGuestLessonSlotsUsed();
        setSlotsUsed(used);
        setVisible(true);
    }, []);

    useEffect(() => {
        void refresh();
        const onChange = () => void refresh();
        window.addEventListener(BUYER_LEARN_CHANGED_EVENT, onChange);
        window.addEventListener('focus', onChange);
        window.addEventListener('storage', onChange);
        return () => {
            window.removeEventListener(BUYER_LEARN_CHANGED_EVENT, onChange);
            window.removeEventListener('focus', onChange);
            window.removeEventListener('storage', onChange);
        };
    }, [refresh]);

    if (!visible) return null;

    const remaining = Math.max(0, ANONYMOUS_COMPLETED_LESSON_LIMIT - slotsUsed);
    const atLimit = remaining === 0;

    return (
        <div
            className={`mb-6 rounded-2xl border px-4 py-4 sm:px-5 sm:py-4 ${
                atLimit
                    ? 'border-gold/30 bg-gold/[0.08]'
                    : 'border-charcoal/10 bg-white/80'
            }`}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                        Free guest access
                    </p>
                    <p className="mt-1 text-sm text-charcoal/75 leading-relaxed">
                        {atLimit ? (
                            <>
                                You have used all {ANONYMOUS_COMPLETED_LESSON_LIMIT} guest lessons.
                                Choose buyer or seller, take the free quiz, and create your account to
                                unlock every module.
                            </>
                        ) : (
                            <>
                                {remaining} of {ANONYMOUS_COMPLETED_LESSON_LIMIT} free guest lessons
                                remaining — registration and platform access are free.
                            </>
                        )}
                    </p>
                </div>
                {atLimit ? (
                    <Link
                        href="/get-started?resume=1"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gold/90"
                    >
                        <Sparkles className="h-4 w-4" />
                        Get started free
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
