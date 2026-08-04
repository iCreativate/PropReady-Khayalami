'use client';

import Link from 'next/link';
import { Award, ArrowRight, Share2, Sparkles } from 'lucide-react';
import {
    LEARN_BTN_GHOST,
    LEARN_BTN_PRIMARY,
    LEARN_CARD,
    LEARN_LABEL,
} from '@/lib/learn-course-ui';

export default function CourseCompletion({
    title,
    badgeLabel,
    xp,
    scorePct,
    nextSlug,
    nextTitle,
    nextDescription,
    hubBasePath,
    onShare,
}: {
    title: string;
    badgeLabel: string;
    xp: number;
    scorePct: number;
    nextSlug: string;
    nextTitle: string;
    nextDescription: string;
    hubBasePath: string;
    onShare: () => void;
}) {
    const href = `${hubBasePath.replace(/\/$/, '')}/${nextSlug}`;

    return (
        <section
            id="learn-section-achievement"
            data-learn-section="achievement"
            className="scroll-mt-28"
        >
            <div
                className={`${LEARN_CARD} relative overflow-hidden p-8 sm:p-12 text-center`}
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-80"
                    style={{
                        background:
                            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(220,38,38,0.12), transparent 60%)',
                    }}
                    aria-hidden
                />
                <div className="relative">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] bg-gradient-to-br from-gold to-gold-600 text-white shadow-[0_12px_40px_rgba(220,38,38,0.35)] learn-animate-in">
                        <Award className="h-10 w-10" strokeWidth={1.75} />
                    </div>
                    <p className={`${LEARN_LABEL} mt-6`}>Lesson complete</p>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#1c1c1c]">
                        {badgeLabel} unlocked
                    </h2>
                    <p className="mt-3 mx-auto max-w-xl text-charcoal/55 leading-relaxed">
                        You finished “{title}”. Here’s your snapshot — keep the momentum with the next
                        lesson.
                    </p>

                    <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-charcoal/[0.06] bg-white px-4 py-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                                Badge
                            </p>
                            <p className="mt-1 font-semibold text-charcoal">{badgeLabel}</p>
                        </div>
                        <div className="rounded-2xl border border-charcoal/[0.06] bg-white px-4 py-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                                XP
                            </p>
                            <p className="mt-1 font-semibold text-gold">+{xp}</p>
                        </div>
                        <div className="rounded-2xl border border-charcoal/[0.06] bg-white px-4 py-4 col-span-2 sm:col-span-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                                Knowledge
                            </p>
                            <p className="mt-1 font-semibold tabular-nums text-charcoal">
                                {Math.round(scorePct)}%
                            </p>
                        </div>
                    </div>

                    <div className="mx-auto mt-8 max-w-md rounded-[20px] border border-dashed border-gold/30 bg-gold/[0.04] px-6 py-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                            Certificate of completion
                        </p>
                        <p className="mt-2 text-sm text-charcoal/60">
                            PropReady Academy · {title}
                        </p>
                        <p className="mt-1 text-xs text-charcoal/40">Educational achievement · not a formal qualification</p>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link href={href} className={LEARN_BTN_PRIMARY}>
                            <Sparkles className="h-4 w-4" />
                            Continue learning
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button type="button" className={LEARN_BTN_GHOST} onClick={onShare}>
                            <Share2 className="h-4 w-4" />
                            Share achievement
                        </button>
                    </div>

                    <p className="mt-6 text-sm text-charcoal/45">
                        Suggested next: <span className="font-semibold text-charcoal">{nextTitle}</span>
                        {' — '}
                        {nextDescription}
                    </p>
                </div>
            </div>
        </section>
    );
}
