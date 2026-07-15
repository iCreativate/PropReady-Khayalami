import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import {
    buildDemoBuyerQuizResult,
    DEMO_BUYER,
    DEMO_BUYER_LOGIN_HINT,
    DEMO_SELLER,
    DEMO_SELLER_LOGIN_HINT,
} from '@/lib/demo-users';
import { getDemoLeadsApiPayload } from '@/lib/demo-leads';
import { createServiceClient } from '@/lib/supabase-admin';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config';

function isDevSeedAllowed(): boolean {
    return (
        process.env.NODE_ENV === 'development' ||
        process.env.ALLOW_DEMO_SEED === 'true'
    );
}

function missingColumnName(message: string): string | null {
    const patterns = [
        /Could not find the '([^']+)' column/i,
        /column (\w+) does not exist/i,
        /column "(\w+)" of relation "\w+" does not exist/i,
    ];
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
}

async function upsertWithStrip(
    supabase: SupabaseClient,
    table: string,
    row: Record<string, unknown>,
    onConflict: string
) {
    const stripped: string[] = [];
    let attempt = { ...row };

    for (let i = 0; i < 20; i++) {
        const { data, error } = await supabase
            .from(table)
            .upsert(attempt, { onConflict })
            .select('*')
            .single();

        if (!error) return { data, stripped };

        const col = missingColumnName(error.message || '');
        if (!col || !(col in attempt)) {
            return { error: error.message };
        }

        delete attempt[col];
        stripped.push(col);
    }

    return { error: `Too many schema mismatches seeding ${table}` };
}

function buildUserRow(profile: typeof DEMO_BUYER | typeof DEMO_SELLER) {
    const now = new Date().toISOString();
    return {
        id: profile.id,
        full_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        password: profile.password,
        email_verified: profile.emailVerified,
        created_at: now,
        updated_at: now,
    };
}

function buildQuizRow() {
    const quiz = buildDemoBuyerQuizResult();
    return {
        id: quiz.id,
        user_id: quiz.user_id,
        full_name: quiz.fullName,
        email: quiz.email,
        phone: quiz.phone,
        monthly_income: quiz.monthlyIncome,
        expenses: quiz.expenses,
        has_debt: quiz.hasDebt,
        deposit_saved: quiz.depositSaved,
        credit_score: quiz.creditScore,
        employment_status: quiz.employmentStatus,
        score: quiz.score,
        pre_qual_amount: quiz.preQualAmount,
        selected_originator: quiz.selectedOriginator,
    };
}

function toLeadRow(lead: Record<string, unknown>) {
    const type = (lead.leadType ?? 'buyer') as string;
    return {
        id: lead.id,
        agent_id: null,
        lead_type: type === 'seller' ? 'seller' : 'buyer',
        full_name: lead.fullName,
        email: lead.email,
        phone: lead.phone ?? null,
        monthly_income: lead.monthlyIncome ?? null,
        deposit_saved: lead.depositSaved ?? null,
        employment_status: lead.employmentStatus ?? null,
        credit_score: lead.creditScore ?? null,
        score: lead.score ?? null,
        pre_qual_amount: lead.preQualAmount ?? null,
        property_address: lead.propertyAddress ?? null,
        property_type: lead.propertyType ?? null,
        current_value: lead.currentValue ?? null,
        timeline: lead.timeline ?? null,
        status: lead.status ?? 'new',
        city: lead.city ?? null,
        bond_originator: lead.bondOriginator ?? null,
        prequalified_with_originator: lead.prequalifiedWithOriginator ?? false,
        appointment_verified: lead.appointmentVerified ?? false,
    };
}

export async function GET() {
    if (!isDevSeedAllowed()) {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    return NextResponse.json({
        buyer: DEMO_BUYER_LOGIN_HINT,
        seller: DEMO_SELLER_LOGIN_HINT,
        seedCommand: 'npm run seed:demo-users',
    });
}

export async function POST() {
    if (!isDevSeedAllowed()) {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    const supabase =
        createServiceClient() ||
        (getSupabaseUrl().startsWith('https://') && getSupabaseAnonKey()
            ? createClient(getSupabaseUrl(), getSupabaseAnonKey())
            : null);

    if (!supabase) {
        return NextResponse.json(
            { success: false, error: 'Supabase not configured' },
            { status: 503 }
        );
    }

    const errors: string[] = [];
    const notes: string[] = [];

    for (const profile of [DEMO_BUYER, DEMO_SELLER]) {
        const userResult = await upsertWithStrip(
            supabase,
            'users',
            buildUserRow(profile),
            'email'
        );
        if (userResult.error) {
            errors.push(`user ${profile.email}: ${userResult.error}`);
        } else if (userResult.stripped?.length) {
            notes.push(`users (${profile.email}): omitted ${userResult.stripped.join(', ')}`);
        }
    }

    const quizResult = await upsertWithStrip(supabase, 'quiz_results', buildQuizRow(), 'id');
    if (quizResult.error) {
        errors.push(`quiz_results: ${quizResult.error}`);
    } else if (quizResult.stripped?.length) {
        notes.push(`quiz_results: omitted ${quizResult.stripped.join(', ')}`);
    }

    const payload = getDemoLeadsApiPayload();
    for (const lead of [...payload.buyers, ...payload.sellers]) {
        if (lead.id !== DEMO_BUYER.id && lead.id !== DEMO_SELLER.id) continue;

        const row = toLeadRow(lead as Record<string, unknown>);
        const { error } = await supabase.from('leads').upsert(row, { onConflict: 'id' });
        if (error) errors.push(`lead ${row.id}: ${error.message}`);
    }

    return NextResponse.json({
        success: errors.length === 0,
        credentials: {
            buyer: DEMO_BUYER_LOGIN_HINT,
            seller: DEMO_SELLER_LOGIN_HINT,
        },
        errors: errors.length ? errors : undefined,
        notes: notes.length ? notes : undefined,
    });
}
