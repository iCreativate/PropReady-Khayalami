import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function toLeadRow(lead: Record<string, unknown>) {
    // Omit agent_id so DB uses NULL (shared leads for all agents)
    return {
        id: lead.id,
        full_name: lead.fullName,
        email: lead.email,
        phone: lead.phone ?? null,
        monthly_income: lead.monthlyIncome ?? null,
        deposit_saved: lead.depositSaved ?? null,
        employment_status: lead.employmentStatus ?? null,
        credit_score: lead.creditScore ?? null,
        score: lead.score ?? null,
        pre_qual_amount: lead.preQualAmount ?? null,
        status: lead.status ?? 'new',
    };
}

function fromLeadRow(row: Record<string, unknown>) {
    return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone ?? null,
        monthlyIncome: row.monthly_income ?? null,
        depositSaved: row.deposit_saved ?? null,
        employmentStatus: row.employment_status ?? null,
        creditScore: row.credit_score ?? null,
        score: row.score ?? null,
        preQualAmount: row.pre_qual_amount ?? null,
        status: row.status ?? 'new',
        timestamp: row.created_at,
        contactedAt: row.updated_at && (row.status === 'contacted' || row.status === 'qualified') ? row.updated_at : null,
    };
}

export async function GET() {
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json(
            { leads: [] },
            { status: 200 }
        );
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase getLeads error:', error);
            return NextResponse.json({ leads: [] }, { status: 200 });
        }

        const leads = (data || []).map(fromLeadRow);
        return NextResponse.json(
            { leads },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Pragma': 'no-cache',
                },
            }
        );
    } catch (err) {
        console.error('API leads GET error:', err);
        return NextResponse.json({ leads: [] }, { status: 200 });
    }
}

export async function POST(request: NextRequest) {
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json(
            { success: false, error: 'Database not configured' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const row = toLeadRow(body);

        if (!row.id || !row.email || !row.full_name) {
            return NextResponse.json(
                { success: false, error: 'Invalid lead data' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { error } = await supabase
            .from('leads')
            .insert([row])
            .select()
            .single();

        if (error) {
            console.error('Supabase createLead error:', error);
            const hint = error.code === '23502'
                ? ' Run in Supabase SQL: ALTER TABLE leads ALTER COLUMN agent_id DROP NOT NULL;'
                : error.code === '42P01'
                    ? ' Create the leads table in Supabase (run supabase-schema.sql).'
                    : error.code === '42501'
                        ? ' RLS blocking insert. Run in Supabase SQL: DROP POLICY IF EXISTS "Allow all operations on leads" ON leads; CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true) WITH CHECK (true);'
                        : '';
            return NextResponse.json(
                { success: false, error: error.message + hint, code: error.code },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API leads POST error:', err);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
