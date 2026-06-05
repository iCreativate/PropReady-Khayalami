export function getAgentInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'A';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatVerificationLabel(status?: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'verified') return 'PPRA Verified';
    if (s === 'rejected') return 'Verification Rejected';
    if (s === 'pending') return 'Verification Pending';
    return 'Agent';
}
