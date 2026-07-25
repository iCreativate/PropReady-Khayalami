import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';

const BUCKET = 'buyer-documents';

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json().catch(() => null)) as {
            userId?: string;
            documentId?: string;
        } | null;

        const userId = String(body?.userId || '').trim();
        const documentId = String(body?.documentId || '').trim();

        if (!userId || !documentId) {
            return NextResponse.json(
                { success: false, error: 'User and document id required' },
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

        const folder = `${userId}/${documentId}`;
        const pathsToRemove: string[] = [];

        // Prefer DB path when available; fall back to listing the storage folder.
        const { data: withPath } = await supabase
            .from('documents')
            .select('storage_path')
            .eq('id', documentId)
            .eq('user_id', userId)
            .maybeSingle();

        const storagePath =
            withPath && typeof (withPath as { storage_path?: unknown }).storage_path === 'string'
                ? String((withPath as { storage_path: string }).storage_path)
                : '';

        if (storagePath) {
            pathsToRemove.push(storagePath);
        } else {
            const { data: listed } = await supabase.storage.from(BUCKET).list(folder);
            for (const file of listed ?? []) {
                if (file.name) pathsToRemove.push(`${folder}/${file.name}`);
            }
        }

        if (pathsToRemove.length > 0) {
            const { error: storageError } = await supabase.storage.from(BUCKET).remove(pathsToRemove);
            if (storageError) {
                console.error('Buyer document storage delete error:', storageError);
                return NextResponse.json(
                    { success: false, error: storageError.message },
                    { status: 500 }
                );
            }
        }

        const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Buyer document row delete error:', deleteError);
            // Allow local-only cleanup to succeed even if remote row delete fails.
            if (pathsToRemove.length === 0) {
                return NextResponse.json(
                    { success: false, error: deleteError.message },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Document delete error:', err);
        return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
    }
}
