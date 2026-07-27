import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';

/**
 * Returns buyer/seller lead presence for the signed-in consumer.
 */
export async function GET(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    if (session.user.accountType !== 'user') {
        return jsonWithSession(
            {
                authenticated: true,
                hasBuyerLead: true,
                hasSellerLead: true,
                hasAnyLead: true,
            },
            session
        );
    }

    const email = session.user.email?.toLowerCase().trim();
    let hasBuyerLead = false;
    let hasSellerLead = false;

    const supabase = createServiceClient();
    if (supabase && email) {
        const { data, error } = await supabase
            .from('leads')
            .select('id, lead_type')
            .eq('email', email)
            .limit(20);
        if (!error && Array.isArray(data)) {
            hasBuyerLead = data.some((row) => (row.lead_type || 'buyer') === 'buyer');
            hasSellerLead = data.some(
                (row) => row.lead_type === 'seller' || row.lead_type === 'investor'
            );
        }
    }

    return jsonWithSession(
        {
            authenticated: true,
            hasBuyerLead,
            hasSellerLead,
            hasAnyLead: hasBuyerLead || hasSellerLead,
        },
        session
    );
}
