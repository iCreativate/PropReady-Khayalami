import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { markConversationReadForUser, requireParticipant } from '@/lib/messages';

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
        const { marked } = await markConversationReadForUser(id, session.user, now);

        return jsonWithSession(
            {
                success: true,
                lastReadAt: marked ? now : null,
                skipped: !marked,
            },
            session
        );
    } catch (err) {
        const status = (err as { status?: number })?.status || 500;
        const message = err instanceof Error ? err.message : 'Server error';
        if (status !== 403) console.error('POST read:', err);
        return NextResponse.json({ error: message }, { status });
    }
}
