/** Client idle session timeout helpers. */

export const IDLE_SESSION_MS = 15 * 60 * 1000;
export const IDLE_ACTIVITY_STORAGE_KEY = 'propReady_lastActivityAt';
export const IDLE_TIMEOUT_QUERY = 'timeout';

export function readLastActivityAt(): number {
    if (typeof window === 'undefined') return Date.now();
    const raw = localStorage.getItem(IDLE_ACTIVITY_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
}

export function markSessionActivity(at = Date.now()): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(IDLE_ACTIVITY_STORAGE_KEY, String(at));
    } catch {
        /* ignore quota */
    }
}

export function clearSessionActivity(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(IDLE_ACTIVITY_STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

export function isIdlePastTimeout(now = Date.now()): boolean {
    return now - readLastActivityAt() >= IDLE_SESSION_MS;
}

export function withIdleTimeoutQuery(path: string): string {
    try {
        const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'https://propready.local');
        url.searchParams.set(IDLE_TIMEOUT_QUERY, '1');
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        const join = path.includes('?') ? '&' : '?';
        return `${path}${join}${IDLE_TIMEOUT_QUERY}=1`;
    }
}
