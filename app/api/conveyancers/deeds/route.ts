import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';
import {
    ensureDeedsMatter,
    listDeedsForConveyancer,
    syncDeedsMatter,
} from '@/lib/deeds-office';

export async function GET(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session || session.user.accountType !== 'conveyancer') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user;
        const deeds = await listDeedsForConveyancer(user.profileId);
        return NextResponse.json({ success: true, deeds });
    } catch (err) {
        console.error('conveyancers/deeds GET:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session || session.user.accountType !== 'conveyancer') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user;
        const body = await request.json();
        const matterId = String(body.matterId || '').trim();
        if (!matterId) {
            return NextResponse.json({ success: false, error: 'matterId required' }, { status: 400 });
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }
        const { data: matter } = await supabase
            .from('conveyancer_matters')
            .select('id, conveyancer_id')
            .eq('id', matterId)
            .eq('conveyancer_id', user.profileId)
            .maybeSingle();
        if (!matter) {
            return NextResponse.json({ success: false, error: 'Matter not found' }, { status: 404 });
        }

        const deeds = await ensureDeedsMatter(matterId, user.profileId);
        if (body.lodgementRef) {
            await supabase
                .from('deeds_office_matters')
                .update({
                    lodgement_ref: body.lodgementRef,
                    deeds_office: body.deedsOffice || 'johannesburg',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', deeds.id);
        }
        const synced = body.advance
            ? await syncDeedsMatter(String(deeds.id), { advance: true })
            : deeds;
        return NextResponse.json({ success: true, deeds: synced });
    } catch (err) {
        console.error('conveyancers/deeds POST:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session || session.user.accountType !== 'conveyancer') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user;
        const body = await request.json();
        const deedsId = String(body.deedsId || '').trim();
        if (!deedsId) {
            return NextResponse.json({ success: false, error: 'deedsId required' }, { status: 400 });
        }
        const synced = await syncDeedsMatter(deedsId, { advance: Boolean(body.advance) });
        return NextResponse.json({ success: true, deeds: synced });
    } catch (err) {
        console.error('conveyancers/deeds PATCH:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
