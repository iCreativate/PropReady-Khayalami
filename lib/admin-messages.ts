import { createHash } from 'crypto';
import { messagesDb } from '@/lib/messages';

/** Stable profile id for a staff email in the messages hub. */
export function adminProfileId(email: string): string {
    const hash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 24);
    return `admin_${hash}`;
}

export function adminDisplayName(email: string): string {
    return `PropReady · ${email.split('@')[0]}`;
}

export async function ensureAdminParticipant(
    conversationId: string,
    email: string
): Promise<void> {
    const profileId = adminProfileId(email);
    const displayName = adminDisplayName(email);
    const db = messagesDb();

    const { data: existing } = await db
        .from('message_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('account_type', 'admin')
        .eq('profile_id', profileId)
        .maybeSingle();

    if (existing) return;

    await db.from('message_participants').insert({
        conversation_id: conversationId,
        account_type: 'admin',
        profile_id: profileId,
        display_name: displayName,
    });
}
