import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';
import { agentHasDocumentAccess } from '@/lib/document-grants-server';

const BUCKET = 'buyer-documents';
const SIGNED_URL_TTL = 3600;

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId')?.trim();
    const documentId = request.nextUrl.searchParams.get('documentId')?.trim();
    const requesterRole = request.nextUrl.searchParams.get('role')?.trim() || 'buyer';
    const agentId = request.nextUrl.searchParams.get('agentId')?.trim();

    if (!userId || !documentId) {
        return NextResponse.json({ error: 'User and document id required' }, { status: 400 });
    }

    if (requesterRole === 'agent') {
        if (!agentId) {
            return NextResponse.json({ error: 'agentId required for agent downloads' }, { status: 400 });
        }
        const allowed = await agentHasDocumentAccess(userId, agentId);
        if (!allowed) {
            return NextResponse.json(
                {
                    error:
                        'Buyer has not shared documents with you. A viewing and explicit consent are required.',
                },
                { status: 403 }
            );
        }
    } else if (requesterRole !== 'buyer' && requesterRole !== 'owner') {
        return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
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
