import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'property-images';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/property/upload-image
 * Body: multipart/form-data with one file field "file" (image).
 * Compressed images should be sent from the client; this route stores and returns the public URL.
 */
export async function POST(request: NextRequest) {
    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json(
            { error: 'Storage not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' },
            { status: 503 }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file || !file.size) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid type: ${file.type}. Use JPEG, PNG, WebP or GIF.` },
                { status: 400 }
            );
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false },
        });

        const { data, error } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error('Supabase storage upload error:', error);
            if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
                return NextResponse.json(
                    { error: `Storage bucket "${BUCKET}" not found. Create a public bucket named "${BUCKET}" in Supabase Dashboard > Storage.` },
                    { status: 503 }
                );
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
        return NextResponse.json({ url: urlData.publicUrl });
    } catch (err) {
        console.error('Upload image error:', err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
