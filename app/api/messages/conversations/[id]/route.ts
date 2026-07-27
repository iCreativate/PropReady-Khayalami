import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import {
    messagesDb,
    requireParticipant,
    serializeConversation,
    type ConversationRow,
    type ParticipantRow,
} from '@/lib/messages';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        await requireParticipant(id, session.user);

        const { data: conversation, error } = await messagesDb()
            .from('message_conversations')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const { data: participants } = await messagesDb()
            .from('message_participants')
            .select('*')
            .eq('conversation_id', id);

        return jsonWithSession(
            {
                conversation: serializeConversation(conversation as ConversationRow, {
                    participants: (participants || []) as ParticipantRow[],
                }),
            },
            session
        );
    } catch (err) {
        const status = (err as { status?: number })?.status || 500;
        const message = err instanceof Error ? err.message : 'Server error';
        if (status !== 403) console.error('GET conversation:', err);
        return NextResponse.json({ error: message }, { status });
    }
}
