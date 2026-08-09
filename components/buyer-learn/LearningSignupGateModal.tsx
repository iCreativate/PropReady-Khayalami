'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    Home,
    KeyRound,
    Sparkles,
} from 'lucide-react';
import {
    ANONYMOUS_COMPLETED_LESSON_LIMIT,
    countGuestLessonSlotsUsed,
} from '@/lib/buyer-learn/anonymous-lesson-limit';
import { BUYER_LEARN_CHANGED_EVENT } from '@/lib/buyer-learn/progress';
import { persistLoginRole, type ConsumerMode } from '@/lib/auth-login-roles';
import { storePostLoginNext } from '@/lib/post-login-routing-client';
import '@/app/learning-gate.css';

interface LearningSignupGateModalProps {
    open: boolean;
    /** True when the user hit the cap while trying to finish a lesson. */
    completing?: boolean;
}

function storeReturnPath(pathname: string | null) {
    if (pathname) storePostLoginNext(pathname);
}

function primeConsumerRole(role: ConsumerMode) {
    persistLoginRole(role);
    try {
        if (role !== 'learner') {
            localStorage.removeItem('propReady_consumerMode');
        }
    } catch {
        /* ignore */
    }
}

export default function LearningSignupGateModal({
    open,
    completing = false,
}: LearningSignupGateModalProps) {
    const pathname = usePathname();
    const nextQs = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
    const signInHref = pathname
        ? `/auth/login?next=${encodeURIComponent(pathname)}`
        : '/auth/login';

    const [slotsUsed, setSlotsUsed] = useState(0);

    useEffect(() => {
        if (!open) return;
        const refresh = () => setSlotsUsed(countGuestLessonSlotsUsed());
        refresh();
        window.addEventListener(BUYER_LEARN_CHANGED_EVENT, refresh);
        return () => window.removeEventListener(BUYER_LEARN_CHANGED_EVENT, refresh);
    }, [open]);

    if (!open) return null;

    function handleQuizStart(role: 'buyer' | 'seller') {
        storeReturnPath(pathname);
        primeConsumerRole(role);
    }

    const title = completing
        ? 'Create your free account to keep learning'
        : 'Sign in or register to keep learning';

    const subtitle = completing
        ? `You have used all ${ANONYMOUS_COMPLETED_LESSON_LIMIT} guest lessons. Pick a path below — the quiz takes a few minutes, then your free account unlocks every module.`
        : 'Choose buyer or seller, complete the short quiz, then create your free PropReady account. Platform access is always free.';

    return (
        <div
            className="learn-gate-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="learn-gate-title"
        >
            <div className="learn-gate-modal">
                <div className="learn-gate-hero">
                    <div className="learn-gate-hero-glow" aria-hidden />
                    <span className="learn-gate-badge">
                        <Sparkles className="h-3 w-3" strokeWidth={2} />
                        100% free
                    </span>
                    <div className="learn-gate-icon" aria-hidden>
                        <BookOpen className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <p className="learn-gate-kicker">Required to continue</p>
                    <h2 id="learn-gate-title" className="learn-gate-title">
                        {title}
                    </h2>
                    <p className="learn-gate-lede">{subtitle}</p>

                    <div className="learn-gate-slots" aria-label="Guest lesson usage">
                        {Array.from({ length: ANONYMOUS_COMPLETED_LESSON_LIMIT }).map((_, i) => (
                            <span
                                key={i}
                                className={`learn-gate-slot ${
                                    i < slotsUsed ? 'learn-gate-slot--used' : ''
                                }`}
                            />
                        ))}
                        <span className="learn-gate-slots-label">
                            {Math.min(slotsUsed, ANONYMOUS_COMPLETED_LESSON_LIMIT)} of{' '}
                            {ANONYMOUS_COMPLETED_LESSON_LIMIT} guest lessons
                        </span>
                    </div>
                </div>

                <div className="learn-gate-body">
                    <p className="learn-gate-prompt">Choose your path</p>

                    <div className="learn-gate-paths">
                        <Link
                            href={`/quiz${nextQs}`}
                            onClick={() => handleQuizStart('buyer')}
                            className="learn-gate-path learn-gate-path--buyer group"
                        >
                            <span className="learn-gate-path-icon">
                                <KeyRound className="h-5 w-5" strokeWidth={1.75} />
                            </span>
                            <span className="learn-gate-path-copy">
                                <span className="learn-gate-path-label">I&apos;m buying</span>
                                <span className="learn-gate-path-desc">
                                    Pre-qual quiz → free account → unlock all learning
                                </span>
                            </span>
                            <ArrowUpRight
                                className="learn-gate-path-arrow h-4 w-4"
                                strokeWidth={1.75}
                            />
                        </Link>

                        <Link
                            href={`/sellers/quiz${nextQs}`}
                            onClick={() => handleQuizStart('seller')}
                            className="learn-gate-path learn-gate-path--seller group"
                        >
                            <span className="learn-gate-path-icon">
                                <Home className="h-5 w-5" strokeWidth={1.75} />
                            </span>
                            <span className="learn-gate-path-copy">
                                <span className="learn-gate-path-label">I&apos;m selling</span>
                                <span className="learn-gate-path-desc">
                                    Property quiz → free account → unlock all learning
                                </span>
                            </span>
                            <ArrowUpRight
                                className="learn-gate-path-arrow h-4 w-4"
                                strokeWidth={1.75}
                            />
                        </Link>
                    </div>

                    <div className="learn-gate-foot">
                        <p className="learn-gate-signin">
                            Already have an account?{' '}
                            <Link
                                href={signInHref}
                                className="learn-gate-signin-link"
                                onClick={() => storeReturnPath(pathname)}
                            >
                                Sign in
                            </Link>
                        </p>
                        <Link href="/learning-center" className="learn-gate-back">
                            <ArrowRight className="h-3.5 w-3.5 rotate-180" strokeWidth={1.75} />
                            Back to Learning Center
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
