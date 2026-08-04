import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { BuyerLearnStore, LessonProgressState } from '@/lib/buyer-learn/types';

const KEY = STORAGE_KEYS.buyerLearn;

function emptyStore(): BuyerLearnStore {
    return { lessons: {}, totalXp: 0, streakDays: 0, lastActiveDate: null };
}

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export function readBuyerLearnStore(): BuyerLearnStore {
    if (typeof window === 'undefined') return emptyStore();
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return emptyStore();
        const parsed = JSON.parse(raw) as BuyerLearnStore;
        return {
            lessons: parsed.lessons || {},
            totalXp: Number(parsed.totalXp) || 0,
            streakDays: Number(parsed.streakDays) || 0,
            lastActiveDate: parsed.lastActiveDate || null,
        };
    } catch {
        return emptyStore();
    }
}

export function writeBuyerLearnStore(store: BuyerLearnStore): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(KEY, JSON.stringify(store));
    } catch {
        /* ignore quota */
    }
}

export function getLessonProgress(slug: string): LessonProgressState {
    const store = readBuyerLearnStore();
    return (
        store.lessons[slug] || {
            percent: 0,
            bookmarked: false,
            completed: false,
            quizScore: null,
            xpEarned: 0,
            lastSectionId: null,
            completedChapterIds: [],
            updatedAt: new Date().toISOString(),
        }
    );
}

function touchStreak(store: BuyerLearnStore): BuyerLearnStore {
    const today = todayKey();
    if (store.lastActiveDate === today) return store;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    const streak =
        store.lastActiveDate === yKey ? Math.max(1, store.streakDays) + 1 : 1;
    return { ...store, streakDays: streak, lastActiveDate: today };
}

export function updateLessonProgress(
    slug: string,
    patch: Partial<LessonProgressState>
): BuyerLearnStore {
    const store = touchStreak(readBuyerLearnStore());
    const prev = store.lessons[slug] || getLessonProgress(slug);
    const next: LessonProgressState = {
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
    };
    const lessons = { ...store.lessons, [slug]: next };
    const totalXp = Object.values(lessons).reduce((s, l) => s + (l.xpEarned || 0), 0);
    const updated = { ...store, lessons, totalXp };
    writeBuyerLearnStore(updated);
    return updated;
}

export function toggleLessonBookmark(slug: string): boolean {
    const prev = getLessonProgress(slug);
    const next = !prev.bookmarked;
    updateLessonProgress(slug, { bookmarked: next });
    return next;
}

export function markLessonSection(
    slug: string,
    sectionId: string,
    percent: number
): void {
    const prev = getLessonProgress(slug);
    updateLessonProgress(slug, {
        lastSectionId: sectionId,
        percent: Math.max(prev.percent, Math.min(100, Math.round(percent))),
    });
}

export function completeLessonQuiz(
    slug: string,
    score: number,
    xp: number
): BuyerLearnStore {
    const prev = getLessonProgress(slug);
    const xpEarned = prev.completed ? prev.xpEarned : xp;
    return updateLessonProgress(slug, {
        quizScore: score,
        completed: true,
        percent: 100,
        xpEarned,
    });
}
