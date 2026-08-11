import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { BuyerLearnStore, LessonProgressState } from '@/lib/buyer-learn/types';
import {
    fetchUserWorkspace,
    reconcileWorkspaceState,
    scheduleWorkspacePush,
} from '@/lib/user-workspace-sync';

const KEY = STORAGE_KEYS.buyerLearn;

export const BUYER_LEARN_CHANGED_EVENT = 'propready-buyer-learn-changed';

function emptyStore(): BuyerLearnStore {
    return {
        lessons: {},
        totalXp: 0,
        streakDays: 0,
        lastActiveDate: null,
        updatedAt: new Date().toISOString(),
    };
}

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export function notifyBuyerLearnStoreChanged(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(BUYER_LEARN_CHANGED_EVENT));
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
            updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
    } catch {
        return emptyStore();
    }
}

export function writeBuyerLearnStore(store: BuyerLearnStore): void {
    if (typeof window === 'undefined') return;
    try {
        const next = { ...store, updatedAt: new Date().toISOString() };
        localStorage.setItem(KEY, JSON.stringify(next));
        notifyBuyerLearnStoreChanged();
        scheduleWorkspacePush('buyer-learn', next);
    } catch {
        /* ignore quota */
    }
}

export async function hydrateBuyerLearnFromCloud(): Promise<BuyerLearnStore> {
    const local = readBuyerLearnStore();
    const cloud = await fetchUserWorkspace<BuyerLearnStore>('buyer-learn');
    if (!cloud?.state) return local;
    const remote: BuyerLearnStore = {
        lessons: cloud.state.lessons || {},
        totalXp: Number(cloud.state.totalXp) || 0,
        streakDays: Number(cloud.state.streakDays) || 0,
        lastActiveDate: cloud.state.lastActiveDate || null,
        updatedAt: cloud.updatedAt || cloud.state.updatedAt || new Date().toISOString(),
    };
    // Prefer union of lesson progress by slug
    const lessonIds = new Set([
        ...Object.keys(local.lessons || {}),
        ...Object.keys(remote.lessons || {}),
    ]);
    const lessons: BuyerLearnStore['lessons'] = {};
    for (const id of lessonIds) {
        const a = local.lessons[id];
        const b = remote.lessons[id];
        if (a && b) {
            const aTs = Date.parse(a.updatedAt || '') || 0;
            const bTs = Date.parse(b.updatedAt || '') || 0;
            lessons[id] = bTs > aTs ? { ...a, ...b } : { ...b, ...a };
        } else {
            lessons[id] = (a || b)!;
        }
    }
    const merged = reconcileWorkspaceState(
        'buyer-learn',
        { ...local, lessons },
        { ...remote, lessons },
    );
    merged.lessons = lessons;
    merged.totalXp = Object.values(lessons).reduce((s, l) => s + (l.xpEarned || 0), 0);
    try {
        localStorage.setItem(KEY, JSON.stringify(merged));
        notifyBuyerLearnStoreChanged();
    } catch {
        /* ignore */
    }
    scheduleWorkspacePush('buyer-learn', merged);
    return merged;
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
