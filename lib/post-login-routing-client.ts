import { readBuyerLearnStore } from '@/lib/buyer-learn/progress';
import { STORAGE_KEYS } from '@/lib/storage-keys';

/** Map stored progress id → public lesson URL. */
export function lessonPathFromProgressId(progressId: string): string {
    if (progressId.startsWith('seller-')) {
        return `/sellers/${progressId.slice('seller-'.length)}`;
    }
    if (progressId.startsWith('investor-')) {
        return `/learn/investors/${progressId.slice('investor-'.length)}`;
    }
    return `/learn/${progressId}`;
}

/** Most recently touched in-progress lesson, if any. */
export function getLearningResumePath(): string | null {
    if (typeof window === 'undefined') return null;

    const store = readBuyerLearnStore();
    let best: { id: string; updatedAt: string } | null = null;

    for (const [id, lesson] of Object.entries(store.lessons)) {
        if (lesson.completed) continue;
        if (lesson.percent <= 0 && !lesson.lastSectionId) continue;
        if (!best || lesson.updatedAt > best.updatedAt) {
            best = { id, updatedAt: lesson.updatedAt };
        }
    }

    return best ? lessonPathFromProgressId(best.id) : null;
}

export type LearningResumeInfo = {
    href: string;
    progressId: string;
    percent: number;
};

export function getLearningResumeInfo(): LearningResumeInfo | null {
    if (typeof window === 'undefined') return null;

    const store = readBuyerLearnStore();
    let best: { id: string; updatedAt: string; percent: number } | null = null;

    for (const [id, lesson] of Object.entries(store.lessons)) {
        if (lesson.completed) continue;
        if (lesson.percent <= 0 && !lesson.lastSectionId) continue;
        if (!best || lesson.updatedAt > best.updatedAt) {
            best = { id, updatedAt: lesson.updatedAt, percent: lesson.percent };
        }
    }

    if (!best) return null;
    return {
        href: lessonPathFromProgressId(best.id),
        progressId: best.id,
        percent: best.percent,
    };
}

/** Reject open redirects — internal paths only. */
export function isSafePostLoginPath(path: string): boolean {
    const trimmed = path.trim();
    if (!trimmed.startsWith('/')) return false;
    if (trimmed.startsWith('//')) return false;
    if (trimmed.includes('://')) return false;
    if (trimmed.includes('\\')) return false;
    return true;
}

export function readStoredPostLoginNext(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const value = sessionStorage.getItem(STORAGE_KEYS.postQuizNext);
        return value && isSafePostLoginPath(value) ? value : null;
    } catch {
        return null;
    }
}

export function storePostLoginNext(path: string): void {
    if (typeof window === 'undefined' || !isSafePostLoginPath(path)) return;
    try {
        sessionStorage.setItem(STORAGE_KEYS.postQuizNext, path);
    } catch {
        /* ignore */
    }
}

export function consumeStoredPostLoginNext(): string | null {
    const value = readStoredPostLoginNext();
    if (!value || typeof window === 'undefined') return value;
    try {
        sessionStorage.removeItem(STORAGE_KEYS.postQuizNext);
    } catch {
        /* ignore */
    }
    return value;
}

function pathBase(path: string): string {
    return path.split('?')[0]?.split('#')[0] || path;
}

/** Hub/dashboard paths where an in-progress lesson resume should win when no explicit lesson URL. */
function isHubLikeDestination(base: string): boolean {
    if (base === '/dashboard' || base === '/learning-center') return true;
    if (base === '/learn' || base.startsWith('/learn/')) return true;
    if (base === '/sellers') return true;
    if (base.startsWith('/sellers/')) {
        if (base.includes('/quiz') || base.endsWith('/dashboard')) return false;
        return true;
    }
    return false;
}

function isSpecificLessonPath(base: string): boolean {
    if (base.startsWith('/learn/investors/') && base !== '/learn/investors') return true;
    if (base.startsWith('/learn/') && base !== '/learn') return true;
    if (base.startsWith('/sellers/') && !base.includes('/quiz') && base !== '/sellers/dashboard') {
        return true;
    }
    return false;
}

/**
 * Resolve final client redirect after auth.
 * Priority: explicit next (URL) → stored postQuizNext → server path (+ lesson resume on hub paths).
 */
export function applyClientPostLoginDestination(
    serverPath: string,
    options?: { explicitNext?: string | null; consumeStored?: boolean }
): string {
    const explicit =
        options?.explicitNext && isSafePostLoginPath(options.explicitNext)
            ? options.explicitNext
            : null;
    const stored = readStoredPostLoginNext();
    const candidate = explicit || stored;

    if (candidate) {
        const base = pathBase(candidate);
        if (isSpecificLessonPath(base)) {
            if (options?.consumeStored !== false) consumeStoredPostLoginNext();
            return candidate;
        }
        if (options?.consumeStored !== false) consumeStoredPostLoginNext();
        const resume = getLearningResumePath();
        return resume || candidate;
    }

    const serverBase = pathBase(serverPath);
    if (isHubLikeDestination(serverBase)) {
        return getLearningResumePath() || serverPath;
    }
    return serverPath;
}

/** Persist `next` from the current page query string (quiz entry from learning gate). */
export function capturePostLoginNextFromLocation(): void {
    if (typeof window === 'undefined') return;
    const next = new URLSearchParams(window.location.search).get('next');
    if (next) storePostLoginNext(next);
}
