/** PropReady demo bond originator — excluded from admin lists and messaging. */
export const DEMO_ORIGINATOR_EMAILS = ['demo.originator@prop-ready.co.za'] as const;

export const DEMO_ORIGINATOR_IDS = ['a0000000-0000-4000-8000-0000000000d1'] as const;

type OriginatorRow = {
    email?: string | null;
    id?: string | null;
};

export function isDemoOriginator(row: OriginatorRow): boolean {
    const email = String(row.email || '')
        .trim()
        .toLowerCase();
    if (email && (DEMO_ORIGINATOR_EMAILS as readonly string[]).includes(email)) {
        return true;
    }

    const id = String(row.id || '').trim();
    return Boolean(id && (DEMO_ORIGINATOR_IDS as readonly string[]).includes(id));
}

export function filterDemoOriginators<T extends OriginatorRow>(rows: T[]): T[] {
    return rows.filter((row) => !isDemoOriginator(row));
}
