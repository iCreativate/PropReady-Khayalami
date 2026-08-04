'use client';

import {
    Bookmark,
    BookmarkCheck,
    Share2,
    Sparkles,
} from 'lucide-react';
import type { LessonDifficulty, LessonMeta } from '@/lib/buyer-learn/types';
import { LearningHubHero } from '@/components/marketing/learn/LearningLandingShell';

const DIFFICULTY_LABEL: Record<LessonDifficulty, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
};

function hubBackLabel(hubBasePath?: string): string {
    if (hubBasePath === '/sellers') return '← Sellers hub';
    if (hubBasePath === '/learn/investors') return '← Investors hub';
    return '← Buyers hub';
}

export default function LessonHero({
    meta,
    progressPct,
    bookmarked,
    onBookmark,
    onShare,
    onContinue,
    compact = false,
}: {
    meta: LessonMeta;
    progressPct: number;
    bookmarked: boolean;
    onBookmark: () => void;
    onShare: () => void;
    onContinue: () => void;
    compact?: boolean;
}) {
    const hubBasePath = meta.hubBasePath || '/learn';

    return (
        <LearningHubHero
            compact={compact}
            showHubsLink={!compact}
            hubLinkHref={hubBasePath}
            hubLinkLabel={hubBackLabel(hubBasePath)}
            eyebrow={`${DIFFICULTY_LABEL[meta.difficulty]} · ${meta.minutes} min · ${meta.xp} XP`}
            title={meta.title}
            description={meta.subtitle}
            actions={
                <>
                    <button type="button" className="hl-btn hl-btn--primary" onClick={onContinue}>
                        <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                        <span>{progressPct > 5 ? 'Continue' : 'Start lesson'}</span>
                    </button>
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
