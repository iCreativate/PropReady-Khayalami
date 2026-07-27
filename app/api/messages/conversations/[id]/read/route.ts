import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { messagesDb, requireParticipant } from '@/lib/messages';

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

        const now = new Date().toISOString();
        const { error } = await messagesDb()
            .from('message_participants')
            .update({ last_read_at: now })
            .eq('conversation_id', id)
            .eq('account_type', session.user.accountType)
            .eq('profile_id', session.user.profileId);

        if (error) throw error;

        return jsonWithSession({ success: true, lastReadAt: now }, session);
    } catch (err) {
        const status = (err as { status?: number })?.status || 500;
        const message = err instanceof Error ? err.message : 'Server error';
        if (status !== 403) console.error('POST read:', err);
        return NextResponse.json({ error: message }, { status });
    }
}
