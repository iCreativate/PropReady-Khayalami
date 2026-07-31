import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEMO_AGENT, getDemoAgentPassword } from '@/lib/demo-agent';
import { createServiceClient } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config';
import { upsertAccountFromProfile } from '@/lib/auth-enterprise';

function isDevSeedAllowed(): boolean {
    return (
        process.env.NODE_ENV === 'development' ||
        process.env.ALLOW_DEMO_SEED === 'true'
    );
}

function getDemoCredentials() {
    return {
        email: DEMO_AGENT.email,
        password: getDemoAgentPassword(),
        ffcNumber: DEMO_AGENT.ffcNumber,
        loginUrl: '/agents/login',
        note: 'Credentials returned only from this seed endpoint — not shown in the app UI.',
    };
}

function buildAgentRow(): Record<string, unknown> {
    const now = new Date().toISOString();
    return {
        id: DEMO_AGENT.id,
        full_name: DEMO_AGENT.fullName,
        email: DEMO_AGENT.email,
        phone: DEMO_AGENT.phone,
        eaab_number: DEMO_AGENT.ppraNumber,
        ppra_number: DEMO_AGENT.ppraNumber,
        ffc_number: DEMO_AGENT.ffcNumber,
        ffc_document_url: DEMO_AGENT.ffcDocumentUrl,
        company: DEMO_AGENT.company,
        city: DEMO_AGENT.city,
        password: getDemoAgentPassword(),
        status: DEMO_AGENT.status,
        plan: DEMO_AGENT.plan,
        seller_plan: DEMO_AGENT.sellerPlan,
        email_verified: DEMO_AGENT.emailVerified,
        verification_status: DEMO_AGENT.verificationStatus,
        verification_date: now,
        updated_at: now,
        created_at: now,
    };
}

function missingColumnName(message: string): string | null {
    const patterns = [
        /Could not find the '([^']+)' column/i,
        /column agents\.(\w+) does not exist/i,
        /column "(\w+)" of relation "agents" does not exist/i,
    ];
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
}

async function upsertDemoAgent(supabase: SupabaseClient) {
    const row = buildAgentRow();
    const stripped: string[] = [];
    let attempt = { ...row };

    for (let i = 0; i < 20; i++) {
        const { data, error } = await supabase
            .from('agents')
            .upsert(attempt, { onConflict: 'email' })
            .select('id, email, full_name')
            .single();

        if (!error) {
            return { data, stripped };
        }

        const col = missingColumnName(error.message || '');
        if (!col || !(col in attempt)) {
            return { error: error.message };
        }

        delete attempt[col];
        stripped.push(col);
    }

    return { error: 'Too many schema mismatches while seeding demo agent' };
}

export async function GET() {
    if (!isDevSeedAllowed()) {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json(
            { seeded: false, error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
            { status: 503 }
        );
    }

    const { data, error } = await supabase
        .from('agents')
        .select('id, email, full_name, plan, verification_status, email_verified')
        .eq('email', DEMO_AGENT.email)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ seeded: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        seeded: Boolean(data),
        agent: data,
        credentials: getDemoCredentials(),
    });
}

export async function POST() {
    if (!isDevSeedAllowed()) {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    const supabaseUrl = getSupabaseUrl();
    const supabase =
        createServiceClient() ||
        (supabaseUrl.startsWith('https://') && getSupabaseAnonKey()
            ? createClient(supabaseUrl, getSupabaseAnonKey())
            : null);

    if (!supabase) {
        return NextResponse.json(
            { success: false, error: 'Supabase not configured' },
            { status: 503 }
        );
    }

    const result = await upsertDemoAgent(supabase);

    if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    try {
        await upsertAccountFromProfile(
            DEMO_AGENT.email,
            'agent',
            String(result.data?.id || DEMO_AGENT.id),
            getDemoAgentPassword()
        );
        const supabaseAuth = createServiceClient();
        if (supabaseAuth) {
            await supabaseAuth
                .from('auth_accounts')
                .update({
                    email_verified_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('email', DEMO_AGENT.email)
                .eq('account_type', 'agent');
        }
    } catch (authErr) {
        console.warn('Demo agent auth account seed:', authErr);
    }

    return NextResponse.json({
        success: true,
        agent: result.data,
        credentials: getDemoCredentials(),
        ...(result.stripped?.length
            ? { note: `Seeded without columns: ${result.stripped.join(', ')}` }
            : {}),
    });
}
