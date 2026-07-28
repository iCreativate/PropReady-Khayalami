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

        const { data: signed, error: signErr } = await messagesDb()
            .storage.from(MESSAGE_ATTACHMENT_BUCKET)
            .createSignedUrl(doc.storage_path, 60 * 10);

        if (signErr || !signed?.signedUrl) {
            return NextResponse.json({ error: 'Could not create download link' }, { status: 500 });
        }

        return NextResponse.json({
            url: signed.signedUrl,
            fileName: doc.file_name,
            mimeType: doc.mime_type,
        });
    } catch (err) {
        console.error('admin GET document url:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Server error' },
            { status: 500 }
        );
    }
}
