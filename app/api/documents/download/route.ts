import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';

const BUCKET = 'buyer-documents';
const SIGNED_URL_TTL = 3600;

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId')?.trim();
    const documentId = request.nextUrl.searchParams.get('documentId')?.trim();

    if (!userId || !documentId) {
        return NextResponse.json({ error: 'User and document id required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }

    const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('id, name, storage_path, user_id')
        .eq('id', documentId)
        .eq('user_id', userId)
        .maybeSingle();

    if (docError || !doc?.storage_path) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.storage_path, SIGNED_URL_TTL);

    if (error || !data?.signedUrl) {
        return NextResponse.json({ error: error?.message || 'Download unavailable' }, { status: 500 });
    }

    return NextResponse.json({
        url: data.signedUrl,
        name: doc.name,
    });
}
