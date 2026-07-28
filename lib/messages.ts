import type { AccountType } from '@/lib/auth-enterprise/config';
import type { SessionUser } from '@/lib/auth-enterprise/types';
import { createServiceClient } from '@/lib/supabase-admin';

export const MESSAGE_ATTACHMENT_BUCKET = 'message-attachments';
export const MESSAGE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const MESSAGE_ATTACHMENT_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type MessageContextType =
    | 'general'
    | 'lead'
    | 'listing'
    | 'viewing'
    | 'prequal'
    | 'announcement'
    | 'support';
export type MessageItemKind = 'text' | 'document' | 'appointment' | 'system';
export type AppointmentStatus = 'proposed' | 'accepted' | 'declined' | 'cancelled';

export type MessageParticipantInput = {
    accountType: AccountType;
    profileId: string;
    displayName?: string;
    email?: string;
};

export type ConversationRow = {
    id: string;
    subject: string | null;
    context_type: MessageContextType;
    context_id: string | null;
    created_by_account_type: AccountType;
    created_by_profile_id: string;
    last_message_at: string | null;
    last_message_preview: string | null;
    created_at: string;
    updated_at: string;
};

/** Message hub participants include portal roles plus PropReady admin. */
export type MessageAccountType = AccountType | 'admin';

export type ParticipantRow = {
    id: string;
    conversation_id: string;
    account_type: MessageAccountType;
    profile_id: string;
    display_name: string | null;
    last_read_at: string | null;
    joined_at: string;
};

export type MessageItemRow = {
    id: string;
    conversation_id: string;
    kind: MessageItemKind;
    body: string | null;
    meta: Record<string, unknown>;
    sender_account_type: MessageAccountType | null;
    sender_profile_id: string | null;
    sender_name: string | null;
    created_at: string;
};

export type AppointmentRow = {
    id: string;
    conversation_id: string;
    message_id: string | null;
    proposed_by_account_type: MessageAccountType;
    proposed_by_profile_id: string;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    notes: string | null;
    status: AppointmentStatus;
    viewing_id: string | null;
    responded_by_account_type: MessageAccountType | null;
    responded_by_profile_id: string | null;
    responded_at: string | null;
    created_at: string;
    updated_at: string;
};

export function messagesDb() {
    const client = createServiceClient();
    if (!client) throw new Error('Database not configured');
    return client;
}

export function displayNameForUser(user: SessionUser): string {
    return user.fullName?.trim() || user.email.split('@')[0] || 'User';
}

export async function requireParticipant(
    conversationId: string,
    user: SessionUser
): Promise<ParticipantRow> {
    const { data, error } = await messagesDb()
        .from('message_participants')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('account_type', user.accountType)
        .eq('profile_id', user.profileId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err = new Error('Not a participant in this conversation');
        (err as Error & { status: number }).status = 403;
        throw err;
    }
    return data as ParticipantRow;
}

export async function listConversationIdsForUser(user: SessionUser): Promise<string[]> {
    const { data, error } = await messagesDb()
        .from('message_participants')
        .select('conversation_id')
        .eq('account_type', user.accountType)
        .eq('profile_id', user.profileId);

    if (error) throw error;
    return (data || []).map((r) => r.conversation_id as string);
}

export async function touchConversationPreview(
    conversationId: string,
    preview: string,
    at = new Date().toISOString()
) {
    await messagesDb()
        .from('message_conversations')
        .update({
            last_message_at: at,
            last_message_preview: preview.slice(0, 180),
            updated_at: at,
        })
        .eq('id', conversationId);
}

export async function resolveProfileByEmail(
    email: string,
    accountType: AccountType
): Promise<{ profileId: string; displayName: string; email: string } | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    const table = accountType === 'agent' ? 'agents' : accountType === 'originator' ? 'originators' : 'users';
    const { data } = await messagesDb()
        .from(table)
        .select('id, full_name, email')
        .eq('email', normalized)
        .maybeSingle();

    if (!data?.id) return null;
    return {
        profileId: String(data.id),
        displayName: String(data.full_name || normalized.split('@')[0]),
        email: String(data.email || normalized),
    };
}

export function serializeConversation(
    row: ConversationRow,
    extras?: {
        participants?: ParticipantRow[];
        unreadCount?: number;
        myLastReadAt?: string | null;
    }
) {
    return {
        id: row.id,
        subject: row.subject,
        contextType: row.context_type,
        contextId: row.context_id,
        createdByAccountType: row.created_by_account_type,
        createdByProfileId: row.created_by_profile_id,
        lastMessageAt: row.last_message_at,
        lastMessagePreview: row.last_message_preview,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        participants: (extras?.participants || []).map((p) => ({
            id: p.id,
            accountType: p.account_type,
            profileId: p.profile_id,
            displayName: p.display_name,
            lastReadAt: p.last_read_at,
        })),
        unreadCount: extras?.unreadCount ?? 0,
        myLastReadAt: extras?.myLastReadAt ?? null,
    };
}

export function serializeMessage(row: MessageItemRow) {
    return {
        id: row.id,
        conversationId: row.conversation_id,
        kind: row.kind,
        body: row.body,
        meta: row.meta || {},
        senderAccountType: row.sender_account_type,
        senderProfileId: row.sender_profile_id,
        senderName: row.sender_name,
        createdAt: row.created_at,
    };
}

export function serializeAppointment(row: AppointmentRow) {
    return {
        id: row.id,
        conversationId: row.conversation_id,
        messageId: row.message_id,
        proposedByAccountType: row.proposed_by_account_type,
        proposedByProfileId: row.proposed_by_profile_id,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        location: row.location,
        notes: row.notes,
        status: row.status,
        viewingId: row.viewing_id,
        respondedByAccountType: row.responded_by_account_type,
        respondedByProfileId: row.responded_by_profile_id,
        respondedAt: row.responded_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
