import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import {
    displayNameForUser,
    messagesDb,
    requireParticipant,
    serializeMessage,
    touchConversationPreview,
    type MessageItemRow,
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

        const after = request.nextUrl.searchParams.get('after');
        let query = messagesDb()
            .from('message_items')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true })
            .limit(500);

        if (after) {
            query = query.gt('created_at', after);
        }

        const { data, error } = await query;
        if (error) throw error;

        return jsonWithSession(
            { messages: ((data || []) as MessageItemRow[]).map(serializeMessage) },
            session
        );
    } catch (err) {
        const status = (err as { status?: number })?.status || 500;
        const message = err instanceof Error ? err.message : 'Server error';
        if (status !== 403) console.error('GET messages:', err);
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(
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

        const body = await request.json();
        const text = String(body.body || body.text || '').trim();
        if (!text) {
            return NextResponse.json({ error: 'Message body required' }, { status: 400 });
        }

        const now = new Date().toISOString();
        const { data, error } = await messagesDb()
            .from('message_items')
            .insert({
                conversation_id: id,
                kind: 'text',
                body: text,
                meta: {},
                sender_account_type: session.user.accountType,
                sender_profile_id: session.user.profileId,
                sender_name: displayNameForUser(session.user),
                created_at: now,
            })
            .select('*')
            .single();

        if (error || !data) throw error || new Error('Could not send message');

        await touchConversationPreview(id, text, now);
        await messagesDb()
            .from('message_participants')
            .update({ last_read_at: now })
            .eq('conversation_id', id)
            .eq('account_type', session.user.accountType)
            .eq('profile_id', session.user.profileId);

        return jsonWithSession({ success: true, message: serializeMessage(data as MessageItemRow) }, session);
    } catch (err) {
        const status = (err as { status?: number })?.status || 500;
        const message = err instanceof Error ? err.message : 'Server error';
        if (status !== 403) console.error('POST messages:', err);
        return NextResponse.json({ error: message }, { status });
    }
}
