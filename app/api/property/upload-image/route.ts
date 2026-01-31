import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'property-images';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MAX_DATA_URL_SIZE_BYTES = 2 * 1024 * 1024; // 2MB max for data URL fallback

/**
 * POST /api/property/upload-image
 * Body: multipart/form-data with one file field "file" (image).
 * Returns public URL (Supabase) or data URL when Storage is not configured.
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const rawFile = formData.get('file');
        const file = rawFile instanceof File ? rawFile : rawFile instanceof Blob ? new File([rawFile], 'image', { type: rawFile.type || 'image/jpeg' }) : null;
        if (!file || !(file.size > 0)) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const fileType = file.type || 'image/jpeg';
        if (!allowedTypes.includes(fileType)) {
            return NextResponse.json(
                { error: `Invalid type: ${fileType}. Use JPEG, PNG, WebP or GIF.` },
                { status: 400 }
            );
        }

        const useStorage = !!(supabaseUrl && supabaseServiceKey);

        if (useStorage) {
            const ext = (file.name && file.name.split('.').pop()?.toLowerCase()) || 'jpg';
            const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
            const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;

            const supabase = createClient(supabaseUrl, supabaseServiceKey, {
                auth: { persistSession: false },
            });

            const { data, error } = await supabase.storage
                .from(BUCKET)
                .upload(path, file, {
                    contentType: fileType,
                    upsert: false,
                });

            if (error) {
                console.error('Supabase storage upload error:', error);
                const isBucketMissing = error.message?.includes('Bucket not found') || error.message?.includes('not found') || error.message?.toLowerCase().includes('bucket');
                if (isBucketMissing) {
                    return await dataUrlFallback(file, fileType);
                }
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
            return NextResponse.json({ url: urlData.publicUrl });
        }

        return await dataUrlFallback(file, fileType);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        console.error('Upload image error:', err);
        return NextResponse.json(
            { error: 'Upload failed', details: message },
            { status: 500 }
        );
    }
}

async function dataUrlFallback(file: File | Blob, fileType: string): Promise<NextResponse> {
    try {
        if (file.size > MAX_DATA_URL_SIZE_BYTES) {
            return NextResponse.json(
                { error: `Image too large for fallback (max ${MAX_DATA_URL_SIZE_BYTES / 1024 / 1024}MB). Set up Supabase Storage or use a smaller image.` },
                { status: 413 }
            );
        }
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${fileType};base64,${base64}`;
        return NextResponse.json({ url: dataUrl });
    } catch (e) {
        console.error('Data URL fallback error:', e);
        return NextResponse.json(
            { error: 'Failed to process image' },
            { status: 500 }
        );
    }
}
