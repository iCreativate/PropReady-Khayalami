import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEMO_ORIGINATOR, getDemoOriginatorPassword } from '@/lib/demo-originator';
import { createServiceClient } from '@/lib/supabase-admin';
import { upsertAccountFromProfile } from '@/lib/auth-enterprise';

function isDevSeedAllowed(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.ALLOW_DEMO_SEED === 'true';
}

function getDemoCredentials() {
    return {
        email: DEMO_ORIGINATOR.email,
        password: getDemoOriginatorPassword(),
        organizationId: DEMO_ORIGINATOR.organizationId,
        staffNumber: DEMO_ORIGINATOR.staffNumber,
        loginUrl: '/originators/login',
        note: 'Credentials returned only from this seed endpoint — not shown in the app UI.',
    };
}

function buildOriginatorRow(): Record<string, unknown> {
    const now = new Date().toISOString();
    return {
        id: DEMO_ORIGINATOR.id,
        full_name: DEMO_ORIGINATOR.fullName,
        email: DEMO_ORIGINATOR.email,
        phone: DEMO_ORIGINATOR.phone,
        organization_id: DEMO_ORIGINATOR.organizationId,
        staff_number: DEMO_ORIGINATOR.staffNumber,
        password: getDemoOriginatorPassword(),
        status: DEMO_ORIGINATOR.status,
        updated_at: now,
        created_at: now,
    };
}

function missingColumnName(message: string): string | null {
    const patterns = [
        /Could not find the '([^']+)' column/i,
        /column originators\.(\w+) does not exist/i,
        /column "(\w+)" of relation "originators" does not exist/i,
    ];
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
}

async function upsertDemoOriginator(supabase: SupabaseClient) {
    const row = buildOriginatorRow();
    const stripped: string[] = [];
    let attempt = { ...row };

    for (let i = 0; i < 20; i++) {
        const { data, error } = await supabase
            .from('originators')
            .upsert(attempt, { onConflict: 'email' })
            .select('id, email, full_name, organization_id, staff_number, status')
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

    return { error: 'Too many schema mismatches while seeding demo originator' };
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
        .from('originators')
        .select('id, email, full_name, organization_id, staff_number, status')
        .eq('email', DEMO_ORIGINATOR.email)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ seeded: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        seeded: Boolean(data),
        originator: data,
        credentials: getDemoCredentials(),
    });
}

export async function POST() {
    if (!isDevSeedAllowed()) {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json(
            { success: false, error: 'Supabase not configured' },
            { status: 503 }
        );
    }

    const result = await upsertDemoOriginator(supabase);
    if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    try {
        await upsertAccountFromProfile(
            DEMO_ORIGINATOR.email,
            'originator',
            String(result.data?.id || DEMO_ORIGINATOR.id),
            getDemoOriginatorPassword()
        );
        await supabase
            .from('auth_accounts')
            .update({
                email_verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('email', DEMO_ORIGINATOR.email)
            .eq('account_type', 'originator');
    } catch (authErr) {
        console.warn('Demo originator auth account seed:', authErr);
    }

    return NextResponse.json({
        success: true,
        originator: result.data,
        credentials: getDemoCredentials(),
        ...(result.stripped?.length
            ? { note: `Seeded without columns: ${result.stripped.join(', ')}` }
            : {}),
    });
}
