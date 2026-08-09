'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLearningResumeInfo, type LearningResumeInfo } from '@/lib/post-login-routing-client';
import { PORTAL_CARD, PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';

export default function LearningContinueCard() {
    const [resume, setResume] = useState<LearningResumeInfo | null>(null);

    useEffect(() => {
        setResume(getLearningResumeInfo());
    }, []);

    if (!resume) return null;

    return (
        <div className={`${PORTAL_CARD} mb-6 p-5 sm:p-6 border-gold/20 bg-gold/[0.04]`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                        <BookOpen className="h-5 w-5 text-gold" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                            Continue learning
                        </p>
                        <p className="mt-1 text-sm font-semibold text-charcoal">
                            Pick up where you left off
                        </p>
                        <p className="mt-1 text-xs text-charcoal/55">
                            {resume.percent}% complete in your last lesson
                        </p>
                    </div>
                </div>
                <Link
                    href={resume.href}
                    className={`${PORTAL_PRIMARY_BTN} shrink-0 inline-flex items-center gap-2`}
                >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}
