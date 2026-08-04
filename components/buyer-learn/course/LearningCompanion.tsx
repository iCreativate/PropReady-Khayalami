'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    BookMarked,
    Calculator,
    Flame,
    GraduationCap,
    NotebookPen,
    Sparkles,
    Stars,
} from 'lucide-react';
import type { LessonMeta } from '@/lib/buyer-learn/types';
import {
    LEARN_BTN_PRIMARY,
    LEARN_CARD,
    LEARN_LABEL,
    LEARN_STICKY,
} from '@/lib/learn-course-ui';

export default function LearningCompanion({
    meta,
    progressPct,
    bookmarked,
    streakDays,
    totalXp,
    hubBasePath,
    onOpenAi,
    onOpenLab,
}: {
    meta: LessonMeta;
    progressPct: number;
    bookmarked: boolean;
    streakDays: number;
    totalXp: number;
    hubBasePath: string;
    onOpenAi: () => void;
    onOpenLab?: () => void;
}) {
    const [note, setNote] = useState('');

    return (
        <aside className={LEARN_STICKY} aria-label="Learning companion">
            <div className="space-y-4">
                <div className={`${LEARN_CARD} p-5`}>
                    <p className={LEARN_LABEL}>Progress</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                        <p className="text-3xl font-semibold tracking-tight tabular-nums text-[#1c1c1c]">
                            {Math.round(progressPct)}%
                        </p>
                        <p className="text-xs text-charcoal/45 pb-1">of lesson complete</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-charcoal/[0.06]">
                        <div
                            className="h-full rounded-full bg-gold transition-[width] duration-500"
                            style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-charcoal/[0.03] px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                                Streak
                            </p>
                            <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-charcoal">
                                <Flame className="h-3.5 w-3.5 text-orange-500" />
                                {streakDays}d
                            </p>
                        </div>
                        <div className="rounded-2xl bg-charcoal/[0.03] px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                                XP
                            </p>
                            <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-charcoal">
                                <Stars className="h-3.5 w-3.5 text-gold" />
                                {totalXp}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`${LEARN_CARD} p-5`}>
                    <p className={LEARN_LABEL}>Quick tools</p>
                    <div className="mt-3 space-y-2">
                        <button
                            type="button"
                            onClick={onOpenAi}
                            className="flex w-full items-center gap-3 rounded-2xl border border-[rgba(220,38,38,0.2)] bg-gradient-to-br from-[rgba(220,38,38,0.08)] to-white px-3.5 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-white">
                                <Sparkles className="h-4 w-4" />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold text-charcoal">AI Tutor</span>
                                <span className="block text-xs text-charcoal/45">Ask anything</span>
                            </span>
                        </button>
                        {onOpenLab ? (
                            <button
                                type="button"
                                onClick={onOpenLab}
                                className="flex w-full items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 px-3.5 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white">
                                    <Calculator className="h-4 w-4" />
                                </span>
                                <span>
                                    <span className="block text-sm font-semibold text-charcoal">
                                        Calculator
                                    </span>
                                    <span className="block text-xs text-charcoal/45">Try the numbers</span>
                                </span>
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className={`${LEARN_CARD} p-5`}>
                    <div className="flex items-center justify-between">
                        <p className={LEARN_LABEL}>Your notes</p>
                        <NotebookPen className="h-3.5 w-3.5 text-charcoal/30" />
                    </div>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Jot a takeaway…"
                        rows={4}
                        className="mt-3 w-full resize-none rounded-2xl border border-charcoal/[0.08] bg-charcoal/[0.02] px-3.5 py-3 text-sm leading-relaxed text-charcoal placeholder:text-charcoal/35 outline-none focus:border-gold/30 focus:ring-2 focus:ring-gold/15"
                    />
                </div>

                <div className={`${LEARN_CARD} p-5`}>
                    <p className={LEARN_LABEL}>Related</p>
                    <Link
                        href={`${hubBasePath.replace(/\/$/, '')}/${meta.nextSlug}`}
                        className="mt-3 block rounded-2xl border border-charcoal/[0.06] bg-gradient-to-br from-white to-charcoal/[0.02] p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm"
                    >
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                            <GraduationCap className="h-3 w-3" />
                            Up next
                        </span>
                        <span className="mt-1.5 block text-sm font-semibold text-charcoal leading-snug">
                            {meta.nextTitle}
                        </span>
                        <span className="mt-1 block text-xs text-charcoal/45 line-clamp-2">
                            {meta.nextDescription}
                        </span>
                    </Link>
                    <div className="mt-3 flex items-center gap-2 text-xs text-charcoal/45">
                        <BookMarked className="h-3.5 w-3.5" />
                        {bookmarked ? 'Bookmarked for later' : 'Not bookmarked yet'}
                    </div>
                </div>

                <button type="button" className={`${LEARN_BTN_PRIMARY} w-full`} onClick={onOpenAi}>
                    <Sparkles className="h-4 w-4" />
                    Ask AI Tutor
                </button>
            </div>
        </aside>
    );
}
