import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';
import { listDeedsForConveyancer } from '@/lib/deeds-office';
import { listMattersForConveyancer } from '@/lib/conveyancer-matters';

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

        const { data: profile } = await supabase
            .from('conveyancers')
            .select('*')
            .eq('id', user.profileId)
            .maybeSingle();

        const [matters, quotesRes, consultationsRes, deeds] = await Promise.all([
            listMattersForConveyancer(user.profileId),
            supabase
                .from('conveyancer_quote_requests')
                .select('*')
                .eq('conveyancer_id', user.profileId)
                .order('created_at', { ascending: false })
                .limit(20),
            supabase
                .from('conveyancer_consultations')
                .select('*')
                .eq('conveyancer_id', user.profileId)
                .order('created_at', { ascending: false })
                .limit(20),
            listDeedsForConveyancer(user.profileId),
        ]);

        const quotes = quotesRes.data || [];
        const consultations = consultationsRes.data || [];
        const openMatters = matters.filter((m) => m.status !== 'closed' && m.status !== 'completed');

        return NextResponse.json({
            success: true,
            profile,
            kpis: {
                openMatters: openMatters.length,
                openQuotes: quotes.filter((q) =>
                    ['submitted', 'viewed', 'quoted'].includes(String(q.status))
                ).length,
                consultations: consultations.filter((c) => c.status === 'confirmed').length,
                deedsActive: deeds.filter(
                    (d) => !['uplifted', 'not_lodged'].includes(String(d.provider_status))
                ).length,
                profileCompletion: profile?.profile_completion ?? 40,
                status: profile?.status || 'pending',
            },
            matters: matters.slice(0, 8),
            quotes: quotes.slice(0, 8),
            consultations: consultations.slice(0, 8),
            deeds: deeds.slice(0, 8),
        });
    } catch (err) {
        console.error('conveyancers/portal/summary:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
