import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
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

        const { data: fileData, error: downloadErr } = await messagesDb()
            .storage.from(MESSAGE_ATTACHMENT_BUCKET)
            .download(doc.storage_path);

        if (downloadErr || !fileData) {
            return NextResponse.json({ error: 'Could not download file' }, { status: 500 });
        }

        const bytes = Buffer.from(await fileData.arrayBuffer());
        const fileName = String(doc.file_name || 'attachment').replace(/"/g, '');
        const mime = doc.mime_type || 'application/octet-stream';

        return new NextResponse(bytes, {
            status: 200,
            headers: {
                'Content-Type': mime,
                'Content-Length': String(bytes.length),
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (err) {
        const status = (err as { status?: number })?.status || 500;
        const message = err instanceof Error ? err.message : 'Server error';
        if (status !== 403) console.error('GET document download:', err);
        return NextResponse.json({ error: message }, { status });
    }
}
