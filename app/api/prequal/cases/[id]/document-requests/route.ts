import { NextRequest, NextResponse } from 'next/server';
import { buyerDocumentTypeLabel, BUYER_DOCUMENT_TYPES, type BuyerDocumentType } from '@/lib/buyer-documents';
import { canAccessCase, resolvePrequalActor } from '@/lib/prequal-auth';
import type { PrequalCaseRow, PrequalDocumentRequestRow } from '@/lib/prequal-cases';
import { createServiceClient } from '@/lib/supabase-admin';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const actor = await resolvePrequalActor(request);
        if (!actor || actor.role !== 'originator') {
            return NextResponse.json({ success: false, error: 'Originator access required' }, { status: 403 });
        }

        const body = await request.json();
        const docType = String(body.docType || 'other').trim() as BuyerDocumentType;
        const type = BUYER_DOCUMENT_TYPES.includes(docType) ? docType : 'other';
        const label = String(body.label || buyerDocumentTypeLabel(type)).trim() || buyerDocumentTypeLabel(type);
        const notes = body.notes ? String(body.notes).trim() : null;

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
        if (!canAccessCase(actor, row)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const now = new Date().toISOString();
        const { data: created, error } = await supabase
            .from('prequal_document_requests')
            .insert({
                case_id: id,
                doc_type: type,
                label,
                notes,
                status: 'requested',
                created_at: now,
                updated_at: now,
            })
            .select('*')
            .single();

        if (error || !created) {
            return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
        }

        await supabase
            .from('prequal_cases')
            .update({ status: 'awaiting_documents', updated_at: now })
            .eq('id', id);

        // System-ish message for the buyer
        await supabase.from('prequal_messages').insert({
            case_id: id,
            sender_role: 'originator',
            sender_profile_id: actor.profileId,
            sender_name: actor.fullName || 'Originator',
            body: `Document requested: ${label}${notes ? `\n\n${notes}` : ''}`,
        });

        const r = created as PrequalDocumentRequestRow;
        return NextResponse.json({
            success: true,
            request: {
                id: r.id,
                docType: r.doc_type,
                label: r.label,
                status: r.status,
                notes: r.notes,
                createdAt: r.created_at,
            },
        });
    } catch (err) {
        console.error('POST document-requests:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
