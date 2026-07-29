import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';
import type { DocumentGrant } from '@/lib/document-grants';
import {
    findSharedViewing,
    getActiveGrantFromDb,
} from '@/lib/document-grants-server';

function mapGrant(row: Record<string, unknown>): DocumentGrant {
    return {
        id: String(row.id),
        buyerUserId: String(row.buyer_user_id),
        agentId: String(row.agent_id),
        viewingId: row.viewing_id ? String(row.viewing_id) : null,
        status: (row.status as DocumentGrant['status']) || 'active',
        grantedAt: String(row.granted_at || new Date().toISOString()),
        revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    };
}

export async function GET(request: NextRequest) {
    const buyerId = request.nextUrl.searchParams.get('buyerId')?.trim();
    const agentId = request.nextUrl.searchParams.get('agentId')?.trim();

    if (!buyerId || !agentId) {
        return NextResponse.json({ error: 'buyerId and agentId required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ grant: null, offline: true });
    }

    const grant = await getActiveGrantFromDb(buyerId, agentId);
    return NextResponse.json({ grant });
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const buyerUserId = String(body.buyerUserId || '').trim();
    const buyerEmail = String(body.buyerEmail || '').trim();
    const agentId = String(body.agentId || '').trim();
    const viewingIdHint = body.viewingId ? String(body.viewingId) : null;

    if (!buyerUserId || !agentId) {
        return NextResponse.json({ error: 'buyerUserId and agentId required' }, { status: 400 });
    }

    const viewing = await findSharedViewing(buyerUserId, buyerEmail, agentId);
    if (!viewing) {
        return NextResponse.json(
            {
                error:
                    'A viewing appointment with this agent is required before you can share documents.',
            },
            { status: 403 }
        );
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Revoke any prior active grant then insert a fresh one (unique partial index).
    await supabase
        .from('agent_document_grants')
        .update({ status: 'revoked', revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('buyer_user_id', buyerUserId)
        .eq('agent_id', agentId)
        .eq('status', 'active');

    const { data, error } = await supabase
        .from('agent_document_grants')
        .insert({
            buyer_user_id: buyerUserId,
            agent_id: agentId,
            viewing_id: viewingIdHint || String(viewing.id),
            status: 'active',
        })
        .select('*')
        .single();

    if (error || !data) {
        console.error('document grant insert:', error);
        return NextResponse.json({ error: 'Could not save document grant' }, { status: 500 });
    }

    return NextResponse.json({ success: true, grant: mapGrant(data as Record<string, unknown>) });
}

export async function DELETE(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const buyerUserId = String(body.buyerUserId || '').trim();
    const agentId = String(body.agentId || '').trim();

    if (!buyerUserId || !agentId) {
        return NextResponse.json({ error: 'buyerUserId and agentId required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { error } = await supabase
        .from('agent_document_grants')
        .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('buyer_user_id', buyerUserId)
        .eq('agent_id', agentId)
        .eq('status', 'active');

    if (error) {
        console.error('document grant revoke:', error);
        return NextResponse.json({ error: 'Could not revoke access' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
