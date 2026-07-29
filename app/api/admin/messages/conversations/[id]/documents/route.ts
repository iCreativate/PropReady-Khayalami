import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { adminDisplayName, adminProfileId, ensureAdminParticipant } from '@/lib/admin-messages';
import {
    MESSAGE_ATTACHMENT_BUCKET,
    MESSAGE_ATTACHMENT_MAX_BYTES,
    MESSAGE_ATTACHMENT_MIME_TYPES,
    isMessageAudioMime,
    messagesDb,
} from '@/lib/messages';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: conversationId } = await context.params;

    try {
        const db = messagesDb();
        await ensureAdminParticipant(conversationId, auth.email);

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
            return NextResponse.json({ error: 'File must be 15MB or smaller' }, { status: 400 });
        }

        const mime = file.type || 'application/pdf';
        if (
            !MESSAGE_ATTACHMENT_MIME_TYPES.includes(
                mime as (typeof MESSAGE_ATTACHMENT_MIME_TYPES)[number]
            )
        ) {
            return NextResponse.json(
                { error: 'Use PDF, Word, JPG, PNG, WebP, or audio (voice note)' },
                { status: 400 }
            );
        }

        const isVoice =
            formData.get('isVoiceNote') === '1' ||
            formData.get('isVoiceNote') === 'true' ||
            isMessageAudioMime(mime);
        const durationRaw = formData.get('durationMs');
        const durationMs =
            typeof durationRaw === 'string' && Number.isFinite(Number(durationRaw))
                ? Math.max(0, Math.round(Number(durationRaw)))
                : undefined;

        const adminId = adminProfileId(auth.email);
        const adminName = adminDisplayName(auth.email);
        const docId = crypto.randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9._\- ]/g, '_').slice(0, 120) || 'file';
        const storagePath = `${conversationId}/${docId}/${safeName}`;

        const { error: uploadError } = await db.storage
            .from(MESSAGE_ATTACHMENT_BUCKET)
            .upload(storagePath, file, { contentType: mime, upsert: true });

        if (uploadError) {
            console.error('admin message document upload:', uploadError);
            const hint = uploadError.message?.includes('Bucket not found')
                ? ' Run supabase/migrations/20260727_messages_hub.sql'
                : '';
            return NextResponse.json({ error: uploadError.message + hint }, { status: 500 });
        }

        const now = new Date().toISOString();
        const preview = isVoice ? 'Sent a voice note' : `Shared a file: ${safeName}`;

        const { data: message, error: msgErr } = await db
            .from('message_items')
            .insert({
                conversation_id: conversationId,
                kind: 'document',
                body: preview,
                meta: {
                    documentId: docId,
                    fileName: safeName,
                    mimeType: mime,
                    sizeBytes: file.size,
                    ...(isVoice ? { isVoiceNote: true } : {}),
                    ...(durationMs != null ? { durationMs } : {}),
                },
                sender_account_type: 'admin',
                sender_profile_id: adminId,
                sender_name: adminName,
                created_at: now,
            })
            .select('*')
            .single();

        if (msgErr || !message) throw msgErr || new Error('Could not create document message');

        const { data: document, error: docErr } = await db
            .from('message_documents')
            .insert({
                id: docId,
                conversation_id: conversationId,
                message_id: message.id,
                storage_path: storagePath,
                file_name: safeName,
                mime_type: mime,
                size_bytes: file.size,
                uploaded_by_account_type: 'admin',
                uploaded_by_profile_id: adminId,
                created_at: now,
            })
            .select('*')
            .single();

        if (docErr) throw docErr;

        await db
            .from('message_conversations')
            .update({
                last_message_at: now,
                last_message_preview: preview.slice(0, 140),
                updated_at: now,
            })
            .eq('id', conversationId);

        await db
            .from('message_participants')
            .update({ last_read_at: now })
            .eq('conversation_id', conversationId)
            .eq('account_type', 'admin')
            .eq('profile_id', adminId);

        return NextResponse.json({
            success: true,
            message: {
                id: message.id,
                kind: message.kind,
                body: message.body,
                meta: message.meta || {},
                senderAccountType: message.sender_account_type,
                senderProfileId: message.sender_profile_id,
                senderName: message.sender_name,
                createdAt: message.created_at,
            },
            document: {
                id: document.id,
                fileName: document.file_name,
                mimeType: document.mime_type,
                sizeBytes: document.size_bytes,
            },
        });
    } catch (err) {
        console.error('admin POST documents:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Server error' },
            { status: 500 }
        );
    }
}
