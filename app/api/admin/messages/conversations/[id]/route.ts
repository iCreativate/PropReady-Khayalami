import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { ensureAdminParticipant } from '@/lib/admin-messages';
import { messagesDb } from '@/lib/messages';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Ctx) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;

    try {
        const db = messagesDb();
        await ensureAdminParticipant(id, auth.email);

        const { data: conversation, error } = await db
            .from('message_conversations')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error || !conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const [{ data: participants }, { data: messages }] = await Promise.all([
            db
                .from('message_participants')
                .select('id, account_type, profile_id, display_name, last_read_at')
                .eq('conversation_id', id),
            db
                .from('message_items')
                .select('*')
                .eq('conversation_id', id)
                .order('created_at', { ascending: true })
                .limit(500),
        ]);

        return NextResponse.json({
            success: true,
            conversation: {
                id: conversation.id,
                subject: conversation.subject,
                contextType: conversation.context_type,
                contextId: conversation.context_id,
                lastMessageAt: conversation.last_message_at,
                lastMessagePreview: conversation.last_message_preview,
            },
            participants: (participants || []).map((p) => ({
                id: p.id,
                accountType: p.account_type,
                profileId: p.profile_id,
                displayName: p.display_name,
                lastReadAt: p.last_read_at,
            })),
            messages: (messages || []).map((m) => ({
                id: m.id,
                kind: m.kind,
                body: m.body,
                meta: m.meta,
                senderAccountType: m.sender_account_type,
                senderProfileId: m.sender_profile_id,
                senderName: m.sender_name,
                createdAt: m.created_at,
            })),
        });
    } catch (err) {
        console.error('admin messages detail:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
