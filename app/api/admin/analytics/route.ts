import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';

function dayKey(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

function emptySeries(since: Date, days: number): Array<{ date: string; count: number }> {
    const out: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setHours(12, 0, 0, 0);
        d.setDate(d.getDate() + i);
        out.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    return out;
}

function bucketByDay(
    rows: Array<{ created_at?: string | null }> | null | undefined,
    since: Date,
    days: number
): Array<{ date: string; count: number }> {
    const series = emptySeries(since, days);
    const index = new Map(series.map((p, i) => [p.date, i]));
    for (const row of rows || []) {
        const key = dayKey(String(row.created_at || ''));
        const i = index.get(key);
        if (i != null) series[i].count += 1;
    }
    return series;
}

export async function GET(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const params = request.nextUrl.searchParams;
    const sinceParam = params.get('since');
    const untilParam = params.get('until');

    let until = untilParam ? new Date(untilParam) : new Date();
    if (Number.isNaN(until.getTime())) until = new Date();
    until.setHours(23, 59, 59, 999);

    let since: Date;
    if (sinceParam) {
        since = new Date(sinceParam);
        if (Number.isNaN(since.getTime())) {
            since = new Date(until);
            since.setDate(since.getDate() - 30);
        }
    } else {
        const rangeDays = Math.min(90, Math.max(1, Number(params.get('days') || 30) || 30));
        since = new Date(until);
        since.setDate(since.getDate() - (rangeDays - 1));
    }
    since.setHours(0, 0, 0, 0);

    const msPerDay = 86400000;
    const rangeDays = Math.min(
        90,
        Math.max(1, Math.ceil((until.getTime() - since.getTime()) / msPerDay) + 1)
    );
    const sinceIso = since.toISOString();
    const untilIso = until.toISOString();

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
            usersCreated,
            agentsCreated,
            leadsCreated,
            conversationsCreated,
            viewingsCreated,
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
            supabase
                .from('users')
                .select('created_at')
                .gte('created_at', sinceIso)
                .lte('created_at', untilIso)
                .order('created_at', { ascending: true })
                .limit(5000),
            supabase
                .from('agents')
                .select('created_at')
                .gte('created_at', sinceIso)
                .lte('created_at', untilIso)
                .order('created_at', { ascending: true })
                .limit(5000),
            supabase
                .from('leads')
                .select('created_at')
                .gte('created_at', sinceIso)
                .lte('created_at', untilIso)
                .order('created_at', { ascending: true })
                .limit(5000),
            supabase
                .from('message_conversations')
                .select('created_at')
                .gte('created_at', sinceIso)
                .lte('created_at', untilIso)
                .order('created_at', { ascending: true })
                .limit(5000),
            supabase
                .from('viewing_appointments')
                .select('created_at')
                .gte('created_at', sinceIso)
                .lte('created_at', untilIso)
                .order('created_at', { ascending: true })
                .limit(5000),
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
            series: {
                days: rangeDays,
                users: bucketByDay(usersCreated.data, since, rangeDays),
                agents: bucketByDay(agentsCreated.data, since, rangeDays),
                leads: bucketByDay(leadsCreated.data, since, rangeDays),
                conversations: bucketByDay(conversationsCreated.data, since, rangeDays),
                viewings: bucketByDay(viewingsCreated.data, since, rangeDays),
            },
            recentLeads: recentLeads || [],
            recentAgents: recentAgents || [],
        });
    } catch (err) {
        console.error('admin analytics:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
