import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import {
    MESSAGE_ATTACHMENT_BUCKET,
    MESSAGE_ATTACHMENT_MAX_BYTES,
    MESSAGE_ATTACHMENT_MIME_TYPES,
    displayNameForUser,
    messagesDb,
    requireParticipant,
    serializeMessage,
    touchConversationPreview,
    type MessageItemRow,
} from '@/lib/messages';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: conversationId } = await params;
        await requireParticipant(conversationId, session.user);

        const formData = await request.formData();
        const rawFile = formData.get('file');
        const file: File | null =
            rawFile instanceof File
                ? rawFile
                : rawFile && typeof rawFile === 'object' && 'size' in rawFile
                  ? new File([rawFile as Blob], 'attachment', {
                        type: (rawFile as Blob).type || 'application/pdf',
                    })
                  : null;

        if (!file || file.size === 0) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        if (file.size > MESSAGE_ATTACHMENT_MAX_BYTES) {
            return NextResponse.json({ error: 'File must be 5MB or smaller' }, { status: 400 });
        }

        const mime = file.type || 'application/pdf';
        if (
            !MESSAGE_ATTACHMENT_MIME_TYPES.includes(
                mime as (typeof MESSAGE_ATTACHMENT_MIME_TYPES)[number]
            )
        ) {
            return NextResponse.json(
                { error: 'Use PDF, Word, JPG, PNG, or WebP' },
                { status: 400 }
            );
        }

        const docId = crypto.randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9._\- ]/g, '_').slice(0, 120) || 'file';
        const storagePath = `${conversationId}/${docId}/${safeName}`;

        const { error: uploadError } = await messagesDb()
            .storage.from(MESSAGE_ATTACHMENT_BUCKET)
            .upload(storagePath, file, { contentType: mime, upsert: true });

        if (uploadError) {
            console.error('message document upload:', uploadError);
            const hint = uploadError.message?.includes('Bucket not found')
                ? ' Run supabase/migrations/20260727_messages_hub.sql'
                : '';
            return NextResponse.json({ error: uploadError.message + hint }, { status: 500 });
        }

        const now = new Date().toISOString();
        const preview = `Shared a file: ${safeName}`;

        const { data: message, error: msgErr } = await messagesDb()
            .from('message_items')
            .insert({
                conversation_id: conversationId,
                kind: 'document',
                body: preview,
                meta: { documentId: docId, fileName: safeName, mimeType: mime, sizeBytes: file.size },
                sender_account_type: session.user.accountType,
                sender_profile_id: session.user.profileId,
                sender_name: displayNameForUser(session.user),
                created_at: now,
            })
            .select('*')
            .single();

        if (msgErr || !message) throw msgErr || new Error('Could not create document message');

        const { data: document, error: docErr } = await messagesDb()
            .from('message_documents')
            .insert({
                id: docId,
                conversation_id: conversationId,
                message_id: message.id,
                storage_path: storagePath,
                file_name: safeName,
                mime_type: mime,
                size_bytes: file.size,
                uploaded_by_account_type: session.user.accountType,
                uploaded_by_profile_id: session.user.profileId,
                created_at: now,
            })
            .select('*')
            .single();

        if (docErr) throw docErr;

        await touchConversationPreview(conversationId, preview, now);

        return jsonWithSession(
            {
                success: true,
                message: serializeMessage(message as MessageItemRow),
                document: {
                    id: document.id,
                    fileName: document.file_name,
                    mimeType: document.mime_type,
                    sizeBytes: document.size_bytes,
                },
            },
            session
        );
    } catch (err) {
        const status = (err as { status?: number })?.status || 500;
        const message = err instanceof Error ? err.message : 'Server error';
        if (status !== 403) console.error('POST documents:', err);
        return NextResponse.json({ error: message }, { status });
    }
}
