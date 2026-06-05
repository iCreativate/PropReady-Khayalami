import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';
import { FFC_DOCUMENT_MAX_BYTES, FFC_DOCUMENT_TYPES } from '@/lib/ppra';

const BUCKET = 'ppra-documents';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const agentId = String(formData.get('agentId') || '').trim();
        const rawFile = formData.get('file');

        if (!agentId) {
            return NextResponse.json({ success: false, error: 'Agent id required' }, { status: 400 });
        }

        const file: File | null =
            rawFile instanceof File
                ? rawFile
                : rawFile && typeof rawFile === 'object' && 'size' in rawFile
                  ? new File([rawFile as Blob], 'ffc-document', {
                        type: (rawFile as Blob).type || 'application/pdf',
                    })
                  : null;

        if (!file || file.size === 0) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        if (file.size > FFC_DOCUMENT_MAX_BYTES) {
            return NextResponse.json(
                { success: false, error: 'File must be 10MB or smaller' },
                { status: 400 }
            );
        }

        const mime = file.type || 'application/pdf';
        if (!FFC_DOCUMENT_TYPES.includes(mime as (typeof FFC_DOCUMENT_TYPES)[number])) {
            return NextResponse.json(
                { success: false, error: 'Use PDF, JPG, JPEG, or PNG format' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY.' },
                { status: 503 }
            );
        }

        const ext =
            mime === 'application/pdf'
                ? 'pdf'
                : mime === 'image/png'
                  ? 'png'
                  : 'jpg';
        const storagePath = `${agentId}/ffc-document.${ext}`;

        const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
            contentType: mime,
            upsert: true,
        });

        if (error) {
            console.error('PPRA document upload error:', error);
            const hint = error.message?.includes('Bucket not found')
                ? ' Create bucket ppra-documents in Supabase Storage or run supabase/migrations/20260603_ppra_verification.sql'
                : '';
            return NextResponse.json(
                { success: false, error: error.message + hint },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            storagePath,
            hasDocument: true,
        });
    } catch (err) {
        console.error('PPRA upload error:', err);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
