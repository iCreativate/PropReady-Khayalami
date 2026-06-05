/**
 * Admin access for PPRA review dashboard (email allowlist from env).
 */
export function getAdminEmails(): string[] {
    return (process.env.ADMIN_EMAILS || process.env.PROPREADY_ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    return getAdminEmails().includes(normalized);
}

export function assertAdmin(email: string | null | undefined): { ok: true } | { ok: false; error: string } {
    if (!getAdminEmails().length) {
        return { ok: false, error: 'Admin access not configured. Set ADMIN_EMAILS in environment.' };
    }
    if (!isAdminEmail(email)) {
        return { ok: false, error: 'Unauthorized admin access' };
    }
    return { ok: true };
}
