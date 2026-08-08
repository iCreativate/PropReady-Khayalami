import type { SupabaseClient } from '@supabase/supabase-js';

const DOCUMENTS_BASE_SELECT =
    'id, name, type, status, size, uploaded_at, storage_path';

export function missingDocumentsColumnName(message: string): string | null {
    const patterns = [
        /Could not find the '([^']+)' column/i,
        /column documents\.(\w+) does not exist/i,
        /column "(\w+)" of relation "documents" does not exist/i,
    ];
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
}

export async function upsertDocumentRow(
    supabase: SupabaseClient,
    row: Record<string, unknown>
): Promise<{ ok: true; stripped: string[] } | { ok: false; error: string }> {
    const stripped: string[] = [];
    let attempt = { ...row };

    for (let i = 0; i < 6; i++) {
        const { error } = await supabase.from('documents').upsert(attempt, { onConflict: 'id' });
        if (!error) {
            return { ok: true, stripped };
        }

        const col = missingDocumentsColumnName(error.message || '');
        if (!col || !(col in attempt)) {
            return { ok: false, error: error.message };
        }

        delete attempt[col];
        stripped.push(col);
    }

    return { ok: false, error: 'Too many schema mismatches while saving document metadata' };
}

export async function fetchDocumentsForUser(
    supabase: SupabaseClient,
    userId: string
): Promise<{ data: Record<string, unknown>[]; error: string | null }> {
    const primary = await supabase
        .from('documents')
        .select(`${DOCUMENTS_BASE_SELECT}, verification_meta`)
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

    if (
        !primary.error ||
        !/verification_meta|verified_at/i.test(primary.error.message || '')
    ) {
        return {
            data: (primary.data ?? []) as Record<string, unknown>[],
            error: primary.error?.message ?? null,
        };
    }

    const fallback = await supabase
        .from('documents')
        .select(DOCUMENTS_BASE_SELECT)
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

    return {
        data: (fallback.data ?? []) as Record<string, unknown>[],
        error: fallback.error?.message ?? null,
    };
}
