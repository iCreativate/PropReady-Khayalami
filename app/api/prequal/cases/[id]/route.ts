import { NextRequest, NextResponse } from 'next/server';
import { canAccessCase, resolvePrequalActor } from '@/lib/prequal-auth';
import {
    serializePrequalCase,
    type PrequalCaseDocumentRow,
    type PrequalCaseRow,
    type PrequalDocumentRequestRow,
    type PrequalMessageRow,
} from '@/lib/prequal-cases';
import { createServiceClient } from '@/lib/supabase-admin';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const actor = await resolvePrequalActor(request);
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const { data: caseRow, error } = await supabase
            .from('prequal_cases')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error || !caseRow) {
            return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
        }

        const row = caseRow as PrequalCaseRow;

        // Allow buyer via userId query when cookies missing
        const userIdParam = request.nextUrl.searchParams.get('userId')?.trim();
        const allowed =
            (actor && canAccessCase(actor, row)) ||
            (userIdParam && row.buyer_user_id === userIdParam);

        if (!allowed) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const [{ data: documents }, { data: messages }, { data: requests }] = await Promise.all([
            supabase
                .from('prequal_case_documents')
                .select('*')
                .eq('case_id', id)
                .order('created_at', { ascending: true }),
            supabase
                .from('prequal_messages')
                .select('*')
                .eq('case_id', id)
                .order('created_at', { ascending: true }),
            supabase
                .from('prequal_document_requests')
                .select('*')
                .eq('case_id', id)
                .order('created_at', { ascending: false }),
        ]);

        // Auto-claim in_review when originator opens
        if (actor?.role === 'originator' && row.status === 'submitted') {
            await supabase
                .from('prequal_cases')
                .update({
                    status: 'in_review',
                    assigned_originator_id: actor.profileId,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);
            row.status = 'in_review';
            row.assigned_originator_id = actor.profileId;
        }

        return NextResponse.json({
            success: true,
            case: serializePrequalCase(row, {
                documents: (documents ?? []) as PrequalCaseDocumentRow[],
                messages: (messages ?? []) as PrequalMessageRow[],
                documentRequests: (requests ?? []) as PrequalDocumentRequestRow[],
            }),
        });
    } catch (err) {
        console.error('GET /api/prequal/cases/[id]:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
