import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { adminDisplayName, adminProfileId, ensureAdminParticipant } from '@/lib/admin-messages';
import { messagesDb } from '@/lib/messages';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;

    try {
        const body = await request.json();
        const text = String(body.body || '').trim();
        if (!text) {
            return NextResponse.json({ error: 'Message body required' }, { status: 400 });
        }

        const db = messagesDb();
        await ensureAdminParticipant(id, auth.email);

        const adminId = adminProfileId(auth.email);
        const adminName = adminDisplayName(auth.email);
        const now = new Date().toISOString();

        const { data: message, error } = await db
            .from('message_items')
            .insert({
                conversation_id: id,
                kind: 'text',
                body: text,
                meta: {},
                sender_account_type: 'admin',
                sender_profile_id: adminId,
                sender_name: adminName,
                created_at: now,
            })
            .select('*')
            .single();

        if (error || !message) {
            return NextResponse.json(
                {
                    error:
                        error?.message ||
                        'Could not send. Apply supabase/migrations/20260727_admin_messages.sql if missing.',
                },
                { status: 500 }
            );
        }

        await db
            .from('message_conversations')
            .update({
                last_message_at: now,
                last_message_preview: text.slice(0, 140),
                updated_at: now,
            })
            .eq('id', id);

        await db
            .from('message_participants')
            .update({ last_read_at: now })
            .eq('conversation_id', id)
            .eq('account_type', 'admin')
            .eq('profile_id', adminId);

        return NextResponse.json({
            success: true,
            message: {
                id: message.id,
                kind: message.kind,
                body: message.body,
                senderAccountType: message.sender_account_type,
                senderProfileId: message.sender_profile_id,
                senderName: message.sender_name,
                createdAt: message.created_at,
            },
        });
    } catch (err) {
        console.error('admin messages send:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
