/** PropReady demo conveyancers — excluded from public directory (JHB/CPT seed accounts). */
export const DEMO_CONVEYANCER_EMAILS = [
    'demo.conveyancer@prop-ready.co.za',
    'demo.conveyancer.cpt@prop-ready.co.za',
] as const;

export const DEMO_CONVEYANCER_SLUGS = [
    'propready-demo-conveyancers-jhb',
    'propready-demo-conveyancers-cpt',
] as const;

type DirectoryRow = {
    email?: string | null;
    firm_slug?: string | null;
    firm_name?: string | null;
};

export function isDemoDirectoryConveyancer(row: DirectoryRow): boolean {
    const email = String(row.email || '').trim().toLowerCase();
    if (email && (DEMO_CONVEYANCER_EMAILS as readonly string[]).includes(email)) {
        return true;
    }

    const slug = String(row.firm_slug || '')
        .trim()
        .toLowerCase();
    if (slug && (DEMO_CONVEYANCER_SLUGS as readonly string[]).includes(slug)) {
        return true;
    }

    const firmName = String(row.firm_name || '').trim().toLowerCase();
    return firmName.startsWith('propready demo conveyancers');
}

export function filterDirectoryConveyancers<T extends DirectoryRow>(rows: T[]): T[] {
    return rows.filter((row) => !isDemoDirectoryConveyancer(row));
}
