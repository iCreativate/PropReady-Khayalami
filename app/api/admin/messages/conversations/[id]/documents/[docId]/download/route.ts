import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { ensureAdminParticipant } from '@/lib/admin-messages';
import { MESSAGE_ATTACHMENT_BUCKET, messagesDb } from '@/lib/messages';

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function GET(request: NextRequest, context: Ctx) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { id: conversationId, docId } = await context.params;
        await ensureAdminParticipant(conversationId, auth.email);

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
        console.error('admin GET document download:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Server error' },
            { status: 500 }
        );
    }
}
