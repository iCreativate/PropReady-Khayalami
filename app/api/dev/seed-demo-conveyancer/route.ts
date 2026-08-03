import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    DEMO_CONVEYANCERS,
    getDemoConveyancerPassword,
    type DemoConveyancer,
} from '@/lib/demo-conveyancer';
import { createServiceClient } from '@/lib/supabase-admin';
import { upsertAccountFromProfile } from '@/lib/auth-enterprise';

function isDevSeedAllowed(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.ALLOW_DEMO_SEED === 'true';
}

function getDemoCredentials() {
    const password = getDemoConveyancerPassword();
    return DEMO_CONVEYANCERS.map((c) => ({
        email: c.email,
        password,
        firmName: c.firmName,
        loginUrl: '/conveyancers/login',
        portalUrl: '/conveyancers/portal',
        note: 'Credentials returned only from this seed endpoint — not shown in the app UI.',
    }));
}

function buildConveyancerRow(profile: DemoConveyancer): Record<string, unknown> {
    const now = new Date().toISOString();
    return {
        id: profile.id,
        email: profile.email,
        full_name: profile.fullName,
        phone: profile.phone,
        firm_name: profile.firmName,
        firm_slug: profile.firmSlug,
        lpc_number: profile.lpcNumber,
        province: profile.province,
        city: profile.city,
        suburb: profile.suburb,
        bio: profile.bio,
        languages: ['English'],
        specialisations: profile.specialisations,
        password: getDemoConveyancerPassword(),
        status: profile.status,
        verified_at: now,
        profile_completion: 90,
        updated_at: now,
        created_at: now,
    };
}

function missingColumnName(message: string): string | null {
    const patterns = [
        /Could not find the '([^']+)' column/i,
        /column conveyancers\.(\w+) does not exist/i,
        /column "(\w+)" of relation "conveyancers" does not exist/i,
    ];
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
}

async function upsertDemoConveyancer(supabase: SupabaseClient, profile: DemoConveyancer) {
    const row = buildConveyancerRow(profile);
    const stripped: string[] = [];
    let attempt = { ...row };

    for (let i = 0; i < 20; i++) {
        const { data, error } = await supabase
            .from('conveyancers')
            .upsert(attempt, { onConflict: 'email' })
            .select('id, email, full_name, firm_name, status, firm_slug')
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

    return { error: `Too many schema mismatches while seeding ${profile.email}` };
}

async function ensureAuthAccount(supabase: SupabaseClient, profile: DemoConveyancer, profileId: string) {
    await upsertAccountFromProfile(
        profile.email,
        'conveyancer',
        profileId,
        getDemoConveyancerPassword()
    );
    const now = new Date().toISOString();
    await supabase
        .from('auth_accounts')
        .update({
            email_verified_at: now,
            profile_completed_at: now,
            updated_at: now,
        })
        .eq('email', profile.email)
        .eq('account_type', 'conveyancer');
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

    const emails = DEMO_CONVEYANCERS.map((c) => c.email);
    const { data, error } = await supabase
        .from('conveyancers')
        .select('id, email, full_name, firm_name, status, firm_slug')
        .in('email', emails);

    if (error) {
        return NextResponse.json({ seeded: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        seeded: (data || []).length === DEMO_CONVEYANCERS.length,
        conveyancers: data || [],
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

    const seeded: Array<Record<string, unknown>> = [];
    const notes: string[] = [];

    for (const profile of DEMO_CONVEYANCERS) {
        const result = await upsertDemoConveyancer(supabase, profile);
        if (result.error) {
            return NextResponse.json(
                { success: false, error: result.error, seededSoFar: seeded },
                { status: 500 }
            );
        }

        try {
            await ensureAuthAccount(
                supabase,
                profile,
                String(result.data?.id || profile.id)
            );
        } catch (authErr) {
            console.warn('Demo conveyancer auth account seed:', authErr);
            notes.push(`Auth seed warning for ${profile.email}`);
        }

        if (result.data) seeded.push(result.data);
        if (result.stripped?.length) {
            notes.push(`${profile.email} without columns: ${result.stripped.join(', ')}`);
        }
    }

    return NextResponse.json({
        success: true,
        conveyancers: seeded,
        credentials: getDemoCredentials(),
        ...(notes.length ? { note: notes.join(' | ') } : {}),
    });
}
