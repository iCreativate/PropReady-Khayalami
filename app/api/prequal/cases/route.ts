import { NextRequest, NextResponse } from 'next/server';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { resolvePrequalActor } from '@/lib/prequal-auth';
import {
    serializePrequalCase,
    type PrequalCaseDocumentRow,
    type PrequalCaseRow,
} from '@/lib/prequal-cases';
import { createServiceClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
    try {
        const actor = await resolvePrequalActor(request);
        if (!actor || actor.role !== 'originator') {
            return NextResponse.json({ success: false, error: 'Originator access required' }, { status: 403 });
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const status = request.nextUrl.searchParams.get('status');
        let query = supabase
            .from('prequal_cases')
            .select('*')
            .eq('organization_id', actor.organizationId)
            .order('updated_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) {
            console.error('prequal cases list:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            cases: ((data ?? []) as PrequalCaseRow[]).map((row) => serializePrequalCase(row)),
        });
    } catch (err) {
        console.error('GET /api/prequal/cases:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const organizationId = String(body.organizationId || '').trim();
        const documentIds = Array.isArray(body.documentIds)
            ? body.documentIds.map((id: unknown) => String(id))
            : [];
        const softAmount =
            body.softAmount != null && body.softAmount !== ''
                ? Number(body.softAmount)
                : null;

        const actor = await resolvePrequalActor(request);
        // Allow cookie session buyer; also accept explicit userId matching profile for portal LS bridge
        let buyerUserId = actor?.role === 'buyer' ? actor.profileId : '';
        if (!buyerUserId && body.userId && actor?.role === 'buyer') {
            buyerUserId = String(body.userId);
        }
        if (!buyerUserId && body.userId && !actor) {
            // Fallback for buyers still using legacy portal session without cookies
            buyerUserId = String(body.userId).trim();
        }

        if (!buyerUserId) {
            return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 });
        }
        if (!BOND_ORIGINATORS.some((o) => o.id === organizationId)) {
            return NextResponse.json({ success: false, error: 'Invalid originator' }, { status: 400 });
        }
        if (documentIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Upload at least one document before sending' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const { data: buyer } = await supabase
            .from('users')
            .select('id, full_name, email, phone')
            .eq('id', buyerUserId)
            .maybeSingle();

        const { data: docs } = await supabase
            .from('documents')
            .select('id, name, type')
            .eq('user_id', buyerUserId)
            .in('id', documentIds);

        if (!docs?.length) {
            return NextResponse.json(
                { success: false, error: 'No matching documents found for this buyer' },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();
        const { data: created, error } = await supabase
            .from('prequal_cases')
            .insert({
                buyer_user_id: buyerUserId,
                organization_id: organizationId,
                status: 'submitted',
                soft_amount: softAmount != null && Number.isFinite(softAmount) ? softAmount : null,
                buyer_name: buyer?.full_name || body.buyerName || null,
                buyer_email: buyer?.email || body.buyerEmail || null,
                buyer_phone: buyer?.phone || body.buyerPhone || null,
                submitted_at: now,
                updated_at: now,
            })
            .select('*')
            .single();

        if (error || !created) {
            console.error('prequal case create:', error);
            return NextResponse.json(
                {
                    success: false,
                    error:
                        error?.message ||
                        'Could not create prequal case. Run supabase/migrations/20260719_originator_portal.sql',
                },
                { status: 500 }
            );
        }

        const caseDocs = docs.map((d) => ({
            case_id: created.id,
            document_id: d.id,
            document_name: d.name,
            document_type: d.type,
        }));

        const { data: linked, error: linkError } = await supabase
            .from('prequal_case_documents')
            .insert(caseDocs)
            .select('*');

        if (linkError) {
            console.error('prequal case docs:', linkError);
        }

        // Best-effort lead flag
        await supabase
            .from('leads')
            .update({
                bond_originator: organizationId,
                prequalified_with_originator: false,
                updated_at: now,
            })
            .eq('user_id', buyerUserId);

        return NextResponse.json({
            success: true,
            case: serializePrequalCase(created as PrequalCaseRow, {
                documents: (linked ?? []) as PrequalCaseDocumentRow[],
            }),
        });
    } catch (err) {
        console.error('POST /api/prequal/cases:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
