import { createServiceClient } from '@/lib/supabase-admin';

/**
 * Generate a unique PropReady staff number for an originator organisation.
 * Format: PR-{ORG}-{6 alphanumerics} e.g. PR-BB-A7K2M9
 */
export function buildStaffNumberCandidate(organizationId: string): string {
    const parts = String(organizationId || 'org')
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean);
    const short =
        parts
            .map((p) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 3) || 'ORG';
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    for (let i = 0; i < 6; i++) {
        suffix += alphabet[bytes[i]! % alphabet.length];
    }
    return `PR-${short}-${suffix}`;
}

export async function generateUniqueOriginatorStaffNumber(
    organizationId: string,
    excludeOriginatorId?: string
): Promise<string> {
    const supabase = createServiceClient();
    if (!supabase) {
        return buildStaffNumberCandidate(organizationId);
    }

    for (let attempt = 0; attempt < 12; attempt++) {
        const candidate = buildStaffNumberCandidate(organizationId);
        let query = supabase
            .from('originators')
            .select('id')
            .eq('organization_id', organizationId)
            .ilike('staff_number', candidate)
            .limit(1);

        if (excludeOriginatorId) {
            query = query.neq('id', excludeOriginatorId);
        }

        const { data } = await query.maybeSingle();
        if (!data) return candidate;
    }

    // Extremely unlikely fallback
    return `PR-${Date.now().toString(36).toUpperCase()}`;
}
