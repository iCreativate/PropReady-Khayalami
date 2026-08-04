'use client';

import { Check, Lock } from 'lucide-react';
import type { LessonChapter } from '@/lib/buyer-learn/types';
import { LEARN_LABEL, LEARN_STICKY } from '@/lib/learn-course-ui';

export default function CourseSidebarNav({
    chapters,
    activeId,
    completedIds,
    openChapterId,
    showLab,
    courseComplete,
    onSelectChapter,
}: {
    chapters: LessonChapter[];
    activeId: string | null;
    completedIds: string[];
    openChapterId: string | null;
    showLab?: boolean;
    courseComplete?: boolean;
    onSelectChapter?: (chapterId: string) => void;
}) {
    const completed = new Set(completedIds);

    return (
        <aside className={LEARN_STICKY} aria-label="Lesson navigation">
            <p className={LEARN_LABEL}>On this lesson</p>
            <nav className="mt-4 space-y-0.5">
                <a
                    href="#learn-overview"
                    className={`group flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[13px] leading-snug transition-all duration-200 ${
                        activeId === 'overview' || !activeId
                            ? 'bg-charcoal text-white shadow-sm'
                            : 'text-charcoal/55 hover:bg-charcoal/[0.04] hover:text-charcoal'
                    }`}
                >
                    <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            activeId === 'overview' || !activeId ? 'bg-gold' : 'bg-charcoal/20'
                        }`}
                    />
                    <span className="font-medium">Introduction</span>
                </a>

                {chapters.map((ch, i) => {
                    const isDone = completed.has(ch.id);
                    const isOpen = openChapterId === ch.id;
                    const isLocked = !isDone && !isOpen;
                    const active = activeId === ch.id || isOpen;

                    return (
                        <button
                            key={ch.id}
                            type="button"
                            disabled={isLocked}
                            onClick={() => {
                                if (isLocked) return;
                                onSelectChapter?.(ch.id);
                                document
                                    .getElementById(`learn-chapter-${ch.id}`)
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`group flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] leading-snug transition-all duration-200 ${
                                active
                                    ? 'bg-charcoal text-white shadow-sm'
                                    : isLocked
                                      ? 'cursor-not-allowed text-charcoal/30'
                                      : 'text-charcoal/55 hover:bg-charcoal/[0.04] hover:text-charcoal'
                            }`}
                        >
                            <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                    isDone
                                        ? active
                                            ? 'bg-emerald-400/30 text-emerald-200'
                                            : 'bg-emerald-500/15 text-emerald-700'
                                        : active
                                          ? 'text-gold'
                                          : 'text-charcoal/30'
                                }`}
                            >
                                {isDone ? (
                                    <Check className="h-3 w-3" strokeWidth={2.5} />
                                ) : isLocked ? (
                                    <Lock className="h-3 w-3" strokeWidth={2} />
                                ) : (
                                    String(i + 1).padStart(2, '0')
                                )}
                            </span>
                            <span className="font-medium line-clamp-2">{ch.title}</span>
                        </button>
                    );
                })}

                {showLab ? (
                    <a
                        href="#learn-section-lab"
                        className={`group flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[13px] leading-snug transition-all duration-200 ${
                            activeId === 'lab'
                                ? 'bg-charcoal text-white shadow-sm'
                                : courseComplete
                                  ? 'text-charcoal/55 hover:bg-charcoal/[0.04] hover:text-charcoal'
                                  : 'pointer-events-none text-charcoal/30'
                        }`}
                    >
                        <span
                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                activeId === 'lab' ? 'bg-gold' : 'bg-charcoal/20'
                            }`}
                        />
                        <span className="font-medium">Calculator</span>
                    </a>
                ) : null}

                <a
                    href="#learn-section-achievement"
                    className={`group flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[13px] leading-snug transition-all duration-200 ${
                        activeId === 'achievement'
                            ? 'bg-charcoal text-white shadow-sm'
                            : courseComplete
                              ? 'text-charcoal/55 hover:bg-charcoal/[0.04] hover:text-charcoal'
                              : 'pointer-events-none text-charcoal/30'
                    }`}
                >
                    <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            activeId === 'achievement' ? 'bg-gold' : 'bg-charcoal/20'
                        }`}
                    />
                    <span className="font-medium">Summary</span>
                </a>
            </nav>

            <p className="mt-5 text-[11px] leading-relaxed text-charcoal/40">
                {completed.size}/{chapters.length} chapters complete
            </p>
        </aside>
    );
}
