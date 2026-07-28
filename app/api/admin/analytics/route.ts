import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    try {
        const [
            users,
            agents,
            originators,
            leads,
            pendingAgents,
            pendingOriginators,
            conversations,
            prequalCases,
            viewings,
            activePlans,
            trialingAgents,
            paymentPendingAgents,
        ] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('agents').select('id', { count: 'exact', head: true }),
            supabase.from('originators').select('id', { count: 'exact', head: true }),
            supabase.from('leads').select('id', { count: 'exact', head: true }),
            supabase
                .from('agents')
                .select('id', { count: 'exact', head: true })
                .or('status.eq.pending,verification_status.eq.pending'),
            supabase
                .from('originators')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending'),
            supabase.from('message_conversations').select('id', { count: 'exact', head: true }),
            supabase.from('prequal_cases').select('id', { count: 'exact', head: true }),
            supabase.from('viewing_appointments').select('id', { count: 'exact', head: true }),
            supabase.from('agents').select('id', { count: 'exact', head: true }).eq('plan_status', 'active'),
            supabase.from('agents').select('id', { count: 'exact', head: true }).eq('plan_status', 'trialing'),
            supabase
                .from('agents')
                .select('id', { count: 'exact', head: true })
                .eq('plan_status', 'payment_pending'),
        ]);

        const { data: recentLeads } = await supabase
            .from('leads')
            .select('id, full_name, email, lead_type, status, score, created_at')
            .order('created_at', { ascending: false })
            .limit(8);

        const { data: recentAgents } = await supabase
            .from('agents')
            .select('id, full_name, email, status, verification_status, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        return NextResponse.json({
            success: true,
            analytics: {
                users: users.count ?? 0,
                agents: agents.count ?? 0,
                originators: originators.count ?? 0,
                leads: leads.count ?? 0,
                pendingAgentApprovals: pendingAgents.count ?? 0,
                pendingOriginatorApprovals: pendingOriginators.count ?? 0,
                conversations: conversations.count ?? 0,
                prequalCases: prequalCases.count ?? 0,
                viewings: viewings.count ?? 0,
                activePlans: activePlans.count ?? 0,
                trialingAgents: trialingAgents.count ?? 0,
                paymentPendingAgents: paymentPendingAgents.count ?? 0,
            },
            recentLeads: recentLeads || [],
            recentAgents: recentAgents || [],
        });
    } catch (err) {
        console.error('admin analytics:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
