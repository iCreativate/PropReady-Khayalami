import { getLessonProgress, readBuyerLearnStore } from '@/lib/buyer-learn/progress';
import type { BuyerLearnStore, LessonProgressState } from '@/lib/buyer-learn/types';

/** Free guest lesson slots before sign-in is required. */
export const ANONYMOUS_COMPLETED_LESSON_LIMIT = 3;

function lessonHasProgressState(lesson: LessonProgressState): boolean {
    return (
        lesson.completed ||
        lesson.percent > 0 ||
        Boolean(lesson.lastSectionId) ||
        (lesson.completedChapterIds?.length ?? 0) > 0
    );
}

/** Distinct lessons a guest has opened or finished (each uses one slot). */
export function countGuestLessonSlotsUsed(store?: BuyerLearnStore): number {
    const s = store ?? readBuyerLearnStore();
    return Object.values(s.lessons).filter(lessonHasProgressState).length;
}

export function countCompletedLessons(store?: BuyerLearnStore): number {
    const s = store ?? readBuyerLearnStore();
    return Object.values(s.lessons).filter((lesson) => lesson.completed).length;
}

export function lessonHasStarted(progressId: string, store?: BuyerLearnStore): boolean {
    const s = store ?? readBuyerLearnStore();
    const progress = s.lessons[progressId] ?? getLessonProgress(progressId);
    return lessonHasProgressState(progress);
}

/** Anonymous users may open lessons they already started or while under the slot cap. */
export function canAccessLessonAnonymously(progressId: string): boolean {
    if (lessonHasStarted(progressId)) return true;
    return countGuestLessonSlotsUsed() < ANONYMOUS_COMPLETED_LESSON_LIMIT;
}

/** Anonymous users may finish a lesson if it already uses a slot or a slot remains. */
export function canCompleteLessonAnonymously(progressId: string): boolean {
    const progress = getLessonProgress(progressId);
    if (progress.completed) return true;
    if (lessonHasStarted(progressId)) return true;
    return countGuestLessonSlotsUsed() < ANONYMOUS_COMPLETED_LESSON_LIMIT;
}

export function anonymousLessonsRemaining(): number {
    return Math.max(0, ANONYMOUS_COMPLETED_LESSON_LIMIT - countGuestLessonSlotsUsed());
}

export function isLessonLockedForGuest(
    progressSlug: string | undefined,
    isAuthenticated: boolean
): boolean {
    if (isAuthenticated || !progressSlug) return false;
    return !canAccessLessonAnonymously(progressSlug);
}
