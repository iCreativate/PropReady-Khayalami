import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { MESSAGE_ATTACHMENT_BUCKET, messagesDb, requireParticipant } from '@/lib/messages';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; docId: string }> }
) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: conversationId, docId } = await params;
        await requireParticipant(conversationId, session.user);

        const { data: doc, error } = await messagesDb()
            .from('message_documents')
            .select('*')
            .eq('id', docId)
            .eq('conversation_id', conversationId)
            .maybeSingle();

        if (error) throw error;
        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const { data: signed, error: signErr } = await messagesDb()
            .storage.from(MESSAGE_ATTACHMENT_BUCKET)
            .createSignedUrl(doc.storage_path, 60 * 10);

        if (signErr || !signed?.signedUrl) {
            return NextResponse.json({ error: 'Could not create download link' }, { status: 500 });
        }

        return jsonWithSession(
            {
                url: signed.signedUrl,
                fileName: doc.file_name,
                mimeType: doc.mime_type,
            },
            session
        );
    } catch (err) {
        const status = (err as { status?: number })?.status || 500;
        const message = err instanceof Error ? err.message : 'Server error';
        if (status !== 403) console.error('GET document url:', err);
        return NextResponse.json({ error: message }, { status });
    }
}
