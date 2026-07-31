import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';

/** Buyer/seller (or agent) activity: quotes, consultations, open matters. */
export async function GET(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user;
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const email = String(user.email || '').toLowerCase();

        let mattersQuery = supabase
            .from('conveyancer_matters')
            .select(
                'id, conveyancer_id, property_label, status, source, updated_at, client_name, client_email, conveyancers(id, firm_name, firm_slug, full_name)'
            )
            .neq('status', 'closed')
            .order('updated_at', { ascending: false })
            .limit(40);

        if (user.accountType === 'user') {
            const quoted = `"${email.replace(/"/g, '')}"`;
            mattersQuery = mattersQuery.or(
                `client_user_id.eq.${user.profileId},client_email.ilike.${quoted}`
            );
        } else if (user.accountType === 'agent') {
            mattersQuery = mattersQuery.eq('agent_id', user.profileId);
        } else {
            return NextResponse.json({
                success: true,
                quotes: [],
                consultations: [],
                matters: [],
            });
        }

        const quotedEmail = `"${email.replace(/"/g, '')}"`;
        const [mattersRes, quotesRes, consultRes] = await Promise.all([
            mattersQuery,
            user.accountType === 'user'
                ? supabase
                      .from('conveyancer_quote_requests')
                      .select(
                          'id, conveyancer_id, property_type, location, status, created_at, purchase_price, timeline, conveyancers(firm_name, firm_slug)'
                      )
                      .or(
                          `requester_user_id.eq.${user.profileId},requester_email.ilike.${quotedEmail}`
                      )
                      .order('created_at', { ascending: false })
                      .limit(30)
                : Promise.resolve({ data: [], error: null }),
            user.accountType === 'user'
                ? supabase
                      .from('conveyancer_consultations')
                      .select(
                          'id, conveyancer_id, consultation_type, slot_label, status, created_at, conveyancers(firm_name, firm_slug)'
                      )
                      .or(
                          `requester_user_id.eq.${user.profileId},requester_email.ilike.${quotedEmail}`
                      )
                      .order('created_at', { ascending: false })
                      .limit(30)
                : Promise.resolve({ data: [], error: null }),
        ]);

        if (mattersRes.error) {
            return NextResponse.json({ success: false, error: mattersRes.error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            matters: mattersRes.data || [],
            quotes: quotesRes.data || [],
            consultations: consultRes.data || [],
        });
    } catch (err) {
        console.error('conveyancers/my/activity:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
