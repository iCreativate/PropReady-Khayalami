'use client';

import Link from 'next/link';
import {
    ArrowRight,
    Bookmark,
    BookmarkCheck,
    Share2,
    Sparkles,
} from 'lucide-react';
import type { LessonDifficulty, LessonMeta } from '@/lib/buyer-learn/types';
import { LearningHubHero } from '@/components/marketing/learn/LearningLandingShell';

function journeyHref(hubBasePath?: string): string {
    if (hubBasePath === '/sellers') return '/sellers/property-quiz';
    if (hubBasePath === '/learn/investors') return '/get-started';
    return '/get-started';
}

function journeyLabel(hubBasePath?: string): string {
    if (hubBasePath === '/sellers') return 'Book a Free Valuation';
    return 'Start your journey';
}

function hubBackLabel(hubBasePath?: string): string {
    if (hubBasePath === '/sellers') return '← Sellers hub';
    if (hubBasePath === '/learn/investors') return '← Investors hub';
    return '← Buyers hub';
}

const DIFFICULTY_LABEL: Record<LessonDifficulty, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
};

export default function CourseHero({
    meta,
    progressPct,
    bookmarked,
    chapterCount,
    onBookmark,
    onShare,
    onContinue,
    compact = false,
}: {
    meta: LessonMeta;
    progressPct: number;
    bookmarked: boolean;
    chapterCount: number;
    onBookmark: () => void;
    onShare: () => void;
    onContinue: () => void;
    compact?: boolean;
}) {
    const course = meta.courseLabel || 'Property Education';
    const total = meta.chapterCount || chapterCount;
    const hubBasePath = meta.hubBasePath || '/learn';

    return (
        <LearningHubHero
            compact={compact}
            showHubsLink={!compact}
            hubLinkHref={hubBasePath}
            hubLinkLabel={hubBackLabel(hubBasePath)}
            eyebrow={`${course} · ${total} chapters · ${meta.minutes} min · ${DIFFICULTY_LABEL[meta.difficulty]}`}
            title={meta.title}
            description={meta.subtitle}
            actions={
                <>
                    <button type="button" className="hl-btn hl-btn--primary" onClick={onContinue}>
                        <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                        <span>{progressPct > 5 ? 'Continue learning' : 'Start learning'}</span>
                    </button>
                    <Link href={journeyHref(hubBasePath)} className="hl-btn hl-btn--ghost">
                        <span>{journeyLabel(hubBasePath)}</span>
                        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                    <button
                        type="button"
                        onClick={onBookmark}
                        aria-pressed={bookmarked}
                        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                        className="hl-btn hl-btn--ghost !h-12 !w-12 !px-0"
                    >
                        {bookmarked ? (
                            <BookmarkCheck className="h-4 w-4 text-[#FECACA]" strokeWidth={1.75} />
                        ) : (
                            <Bookmark className="h-4 w-4" strokeWidth={1.75} />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onShare}
                        aria-label="Share lesson"
                        className="hl-btn hl-btn--ghost !h-12 !w-12 !px-0"
                    >
                        <Share2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                </>
            }
        />
    );
}
