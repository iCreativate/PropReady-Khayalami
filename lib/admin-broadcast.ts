import type { AccountType } from '@/lib/auth-enterprise/config';
import { profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';
import { createServiceClient } from '@/lib/supabase-admin';
import { adminDisplayName, adminProfileId } from '@/lib/admin-messages';
import { messagesDb } from '@/lib/messages';

export type BroadcastAudience = 'all' | 'user' | 'agent' | 'originator';

export async function listAudienceProfiles(audience: BroadcastAudience) {
    const supabase = createServiceClient();
    if (!supabase) return [];

    const types: AccountType[] =
        audience === 'all' ? ['user', 'agent', 'originator'] : [audience];

    const out: Array<{
        accountType: AccountType;
        profileId: string;
        displayName: string;
        email: string;
    }> = [];

    for (const accountType of types) {
        const table = profileTableForAccountType(accountType);
        const { data } = await supabase
            .from(table)
            .select('id, full_name, email')
            .order('created_at', { ascending: false })
            .limit(2000);
        for (const row of data || []) {
            out.push({
                accountType,
                profileId: String(row.id),
                displayName: String(row.full_name || row.email || 'User'),
                email: String(row.email || ''),
            });
        }
    }
    return out;
}

export async function broadcastAdminMessage(input: {
    adminEmail: string;
    audience: BroadcastAudience;
    subject: string;
    body: string;
}): Promise<{ recipientCount: number; sent: number; errors: string[] }> {
    const recipients = await listAudienceProfiles(input.audience);
    if (recipients.length === 0) {
        return { recipientCount: 0, sent: 0, errors: ['No recipients found'] };
    }

    const db = messagesDb();
    const adminId = adminProfileId(input.adminEmail);
    const adminName = adminDisplayName(input.adminEmail);
    const now = new Date().toISOString();
    const subject = input.subject.trim() || 'PropReady update';
    const text = input.body.trim();

    let sent = 0;
    const errors: string[] = [];
    const batchSize = 25;

    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await Promise.all(
            batch.map(async (r) => {
                try {
                    const { data: conversation, error } = await db
                        .from('message_conversations')
                        .insert({
                            subject,
                            context_type: 'announcement',
                            created_by_account_type: 'admin',
                            created_by_profile_id: adminId,
                            last_message_at: now,
                            last_message_preview: text.slice(0, 140),
                            updated_at: now,
                        })
                        .select('id')
                        .single();

                    if (error || !conversation) {
                        errors.push(`${r.email}: ${error?.message || 'create failed'}`);
                        return;
                    }

                    await db.from('message_participants').insert([
                        {
                            conversation_id: conversation.id,
                            account_type: 'admin',
                            profile_id: adminId,
                            display_name: adminName,
                        },
                        {
                            conversation_id: conversation.id,
                            account_type: r.accountType,
                            profile_id: r.profileId,
                            display_name: r.displayName,
                        },
                    ]);

                    await db.from('message_items').insert({
                        conversation_id: conversation.id,
                        kind: 'text',
                        body: text,
                        sender_account_type: 'admin',
                        sender_profile_id: adminId,
                        sender_name: adminName,
                    });

                    sent += 1;
                } catch (e) {
                    errors.push(`${r.email}: ${e instanceof Error ? e.message : 'failed'}`);
                }
            })
        );
    }

    return { recipientCount: recipients.length, sent, errors };
}
