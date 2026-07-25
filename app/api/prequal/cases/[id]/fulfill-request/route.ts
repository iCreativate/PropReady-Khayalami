import { NextRequest, NextResponse } from 'next/server';
import { canAccessCase, resolvePrequalActor } from '@/lib/prequal-auth';
import type { PrequalCaseRow } from '@/lib/prequal-cases';
import { createServiceClient } from '@/lib/supabase-admin';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const requestId = String(body.requestId || '').trim();
        const documentId = String(body.documentId || '').trim();
        const userIdParam = String(body.userId || '').trim();

        if (!requestId || !documentId) {
            return NextResponse.json(
                { success: false, error: 'requestId and documentId required' },
                { status: 400 }
            );
        }

        const actor = await resolvePrequalActor(request);
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const { data: caseRow } = await supabase
            .from('prequal_cases')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (!caseRow) {
            return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
        }
        const row = caseRow as PrequalCaseRow;

        const isBuyer =
            (actor?.role === 'buyer' && canAccessCase(actor, row)) ||
            (userIdParam && row.buyer_user_id === userIdParam);

        if (!isBuyer) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const buyerId = actor?.role === 'buyer' ? actor.profileId : userIdParam;

        const { data: doc } = await supabase
            .from('documents')
            .select('id, name, type')
            .eq('id', documentId)
            .eq('user_id', buyerId)
            .maybeSingle();

        if (!doc) {
            return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
        }

        const now = new Date().toISOString();
        const { error } = await supabase
            .from('prequal_document_requests')
            .update({
                status: 'uploaded',
                fulfilled_document_id: documentId,
                updated_at: now,
            })
            .eq('id', requestId)
            .eq('case_id', id);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        await supabase.from('prequal_case_documents').upsert(
            {
                case_id: id,
                document_id: doc.id,
                document_name: doc.name,
                document_type: doc.type,
            },
            { onConflict: 'case_id,document_id' }
        );

        await supabase
            .from('prequal_cases')
            .update({ status: 'in_review', updated_at: now })
            .eq('id', id);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('POST fulfill-request:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
