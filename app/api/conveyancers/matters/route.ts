import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';
import { ensureConveyancerInquiryMatter, listMattersForConveyancer } from '@/lib/conveyancer-matters';
import { ensureDeedsMatter } from '@/lib/deeds-office';

export async function GET(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session || session.user.accountType !== 'conveyancer') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user;
        const matters = await listMattersForConveyancer(user.profileId);
        return NextResponse.json({ success: true, matters });
    } catch (err) {
        console.error('conveyancers/matters GET:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user;

        const body = await request.json();
        const conveyancerId = String(body.conveyancerId || '').trim();
        if (!conveyancerId) {
            return NextResponse.json({ success: false, error: 'conveyancerId required' }, { status: 400 });
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const { data: firm } = await supabase
            .from('conveyancers')
            .select('id, status')
            .eq('id', conveyancerId)
            .maybeSingle();
        if (!firm || firm.status !== 'approved') {
            return NextResponse.json({ success: false, error: 'Conveyancer not available' }, { status: 404 });
        }

        const matterId = await ensureConveyancerInquiryMatter({
            conveyancerId,
            clientUserId: user.accountType === 'user' ? user.profileId : undefined,
            clientName: user.fullName,
            clientEmail: user.email,
            agentId: user.accountType === 'agent' ? user.profileId : undefined,
            agentName: user.accountType === 'agent' ? user.fullName : undefined,
            propertyLabel: String(body.propertyLabel || 'New matter'),
            source: body.source || 'marketplace',
        });

        if (matterId && body.createDeeds) {
            await ensureDeedsMatter(matterId, conveyancerId);
        }

        if (matterId && body.status) {
            await supabase
                .from('conveyancer_matters')
                .update({
                    status: body.status,
                    property_type: body.propertyType || null,
                    property_value: body.propertyValue ?? null,
                    bond_amount: body.bondAmount ?? null,
                    city: body.city || null,
                    province: body.province || null,
                    notes: body.notes || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', matterId);
        }

        return NextResponse.json({ success: true, matterId });
    } catch (err) {
        console.error('conveyancers/matters POST:', err);
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
        const matterId = String(body.matterId || '').trim();
        if (!matterId) {
            return NextResponse.json({ success: false, error: 'matterId required' }, { status: 400 });
        }
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (body.status) updates.status = body.status;
        if (body.notes !== undefined) updates.notes = body.notes;
        if (body.propertyLabel) updates.property_label = body.propertyLabel;

        const { data, error } = await supabase
            .from('conveyancer_matters')
            .update(updates)
            .eq('id', matterId)
            .eq('conveyancer_id', user.profileId)
            .select('*')
            .maybeSingle();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, matter: data });
    } catch (err) {
        console.error('conveyancers/matters PATCH:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
