import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';
import {
    BUYER_DOCUMENT_MAX_BYTES,
    BUYER_DOCUMENT_MIME_TYPES,
    type BuyerDocumentType,
} from '@/lib/buyer-documents';

const BUCKET = 'buyer-documents';

const VALID_TYPES: BuyerDocumentType[] = [
    'pre-qualification',
    'id',
    'income',
    'bank-statement',
    'other',
];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const userId = String(formData.get('userId') || '').trim();
        const documentId = String(formData.get('documentId') || '').trim();
        const docType = String(formData.get('type') || 'other').trim() as BuyerDocumentType;
        const rawFile = formData.get('file');

        if (!userId || !documentId) {
            return NextResponse.json({ success: false, error: 'User and document id required' }, { status: 400 });
        }

        const file: File | null =
            rawFile instanceof File
                ? rawFile
                : rawFile && typeof rawFile === 'object' && 'size' in rawFile
                  ? new File([rawFile as Blob], 'document', {
                        type: (rawFile as Blob).type || 'application/pdf',
                    })
                  : null;

        if (!file || file.size === 0) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        if (file.size > BUYER_DOCUMENT_MAX_BYTES) {
            return NextResponse.json({ success: false, error: 'File must be 10MB or smaller' }, { status: 400 });
        }

        const mime = file.type || 'application/pdf';
        if (!BUYER_DOCUMENT_MIME_TYPES.includes(mime as (typeof BUYER_DOCUMENT_MIME_TYPES)[number])) {
            return NextResponse.json({ success: false, error: 'Use PDF, JPG, JPEG, or PNG format' }, { status: 400 });
        }

        const type = VALID_TYPES.includes(docType) ? docType : 'other';
        const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg';
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
        const storagePath = `${userId}/${documentId}/${safeName || `document.${ext}`}`;

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY.' },
                { status: 503 }
            );
        }

        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
            contentType: mime,
            upsert: true,
        });

        if (uploadError) {
            console.error('Buyer document upload error:', uploadError);
            const hint = uploadError.message?.includes('Bucket not found')
                ? ' Run supabase/migrations/20260611_buyer_documents_storage.sql'
                : '';
            return NextResponse.json(
                { success: false, error: uploadError.message + hint },
                { status: 500 }
            );
        }

        const row = {
            id: documentId,
            user_id: userId,
            name: file.name,
            type,
            status: 'uploaded',
            size: `${Math.round((file.size / 1024) * 10) / 10} KB`,
            storage_path: storagePath,
            uploaded_at: new Date().toISOString(),
        };

        const { error: dbError } = await supabase.from('documents').upsert(row, { onConflict: 'id' });

        if (dbError) {
            console.error('Buyer document metadata save error:', dbError);
            return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            document: {
                id: documentId,
                name: file.name,
                type,
                status: 'uploaded',
                size: row.size,
                uploadedAt: row.uploaded_at,
                url: storagePath,
            },
        });
    } catch (err) {
        console.error('Document upload error:', err);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
