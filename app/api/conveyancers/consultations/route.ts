import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';
import { ensureConveyancerInquiryMatter } from '@/lib/conveyancer-matters';

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
            propertyLabel: 'Consultation booking',
            source: 'marketplace',
        });

        const { data, error } = await supabase
            .from('conveyancer_consultations')
            .insert({
                conveyancer_id: conveyancerId,
                matter_id: matterId,
                requester_user_id: user?.accountType === 'user' ? user.profileId : null,
                consultation_type: body.type || 'virtual',
                slot_label: body.slot || 'To be confirmed',
                requester_name: body.name || user?.fullName || 'Client',
                requester_email: body.email || user?.email || '',
                requester_phone: body.phone || null,
                notes: body.notes || null,
                status: 'confirmed',
            })
            .select('*')
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, booking: data, matterId });
    } catch (err) {
        console.error('conveyancers/consultations POST:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
