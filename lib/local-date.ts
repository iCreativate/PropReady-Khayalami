/**
 * Local calendar-date helpers.
 * Avoid Date#toISOString() for Y-M-D — UTC shifts the calendar day (e.g. SAST UTC+2).
 */

/** Format a Date as YYYY-MM-DD in the user's local timezone */
export function formatLocalYmd(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Today's date as YYYY-MM-DD in the user's local timezone */
export function todayLocalYmd(): string {
    return formatLocalYmd(new Date());
}

/** Parse YYYY-MM-DD as local midnight (not UTC midnight) */
export function parseLocalYmd(ymd: string): Date {
    const [y, m, d] = ymd.split('-').map(Number);
    if (!y || !m || !d) return new Date(NaN);
    return new Date(y, m - 1, d);
}

/** Local calendar equality for two Date values */
export function isSameLocalDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
