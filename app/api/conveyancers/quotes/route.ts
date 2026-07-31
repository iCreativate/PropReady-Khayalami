import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';
import { ensureConveyancerInquiryMatter } from '@/lib/conveyancer-matters';

export async function GET(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session || session.user.accountType !== 'conveyancer') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user;
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }
        const { data, error } = await supabase
            .from('conveyancer_quote_requests')
            .select('*')
            .eq('conveyancer_id', user.profileId)
            .order('created_at', { ascending: false });
        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, quotes: data || [] });
    } catch (err) {
        console.error('conveyancers/quotes GET:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        const user = session?.user || null;
        const body = await request.json();
        const conveyancerId = String(body.conveyancerId || '').trim();
        if (!conveyancerId) {
            return NextResponse.json({ success: false, error: 'conveyancerId required' }, { status: 400 });
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const matterId = await ensureConveyancerInquiryMatter({
            conveyancerId,
            clientUserId: user?.accountType === 'user' ? user.profileId : undefined,
            clientName: body.name || user?.fullName,
            clientEmail: body.email || user?.email,
            agentId: user?.accountType === 'agent' ? user.profileId : undefined,
            propertyLabel: body.location || 'Quote request',
            source: 'quote',
        });

        if (matterId) {
            await supabase
                .from('conveyancer_matters')
                .update({ status: 'quote_requested', updated_at: new Date().toISOString() })
                .eq('id', matterId);
        }

        const { data, error } = await supabase
            .from('conveyancer_quote_requests')
            .insert({
                conveyancer_id: conveyancerId,
                matter_id: matterId,
                requester_user_id: user?.accountType === 'user' ? user.profileId : null,
                requester_name: body.name || user?.fullName || null,
                requester_email: body.email || user?.email || null,
                property_type: body.propertyType || null,
                location: body.location || null,
                purchase_price: body.purchasePrice ?? null,
                bond_amount: body.bondAmount ?? null,
                timeline: body.timeline || null,
                notes: body.notes || null,
                status: 'submitted',
            })
            .select('*')
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, quote: data, matterId });
    } catch (err) {
        console.error('conveyancers/quotes POST:', err);
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
        const quoteId = String(body.quoteId || '').trim();
        if (!quoteId || !body.status) {
            return NextResponse.json({ success: false, error: 'quoteId and status required' }, { status: 400 });
        }
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }
        const { data, error } = await supabase
            .from('conveyancer_quote_requests')
            .update({ status: body.status, updated_at: new Date().toISOString() })
            .eq('id', quoteId)
            .eq('conveyancer_id', user.profileId)
            .select('*')
            .maybeSingle();
        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, quote: data });
    } catch (err) {
        console.error('conveyancers/quotes PATCH:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
