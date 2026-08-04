'use client';

import type { LessonChapter } from '@/lib/buyer-learn/types';

export default function ChapterRail({
    chapters,
    activeId,
}: {
    chapters: LessonChapter[];
    activeId: string | null;
}) {
    return (
        <nav
            className="sticky top-20 z-30 -mx-1 mb-8 overflow-x-auto px-1 py-1"
            aria-label="Course chapters"
        >
            <ol className="flex min-w-max gap-2 rounded-2xl border border-charcoal/10 bg-white/90 p-1.5 shadow-sm backdrop-blur-md">
                {chapters.map((ch, i) => {
                    const active = activeId === ch.id;
                    return (
                        <li key={ch.id}>
                            <a
                                href={`#learn-chapter-${ch.id}`}
                                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                    active
                                        ? 'bg-charcoal text-white shadow-sm'
                                        : 'text-charcoal/55 hover:bg-charcoal/[0.04] hover:text-charcoal'
                                }`}
                            >
                                <span
                                    className={`tabular-nums ${active ? 'text-gold' : 'text-charcoal/35'}`}
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className="max-w-[9rem] truncate sm:max-w-none">{ch.title}</span>
                            </a>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
