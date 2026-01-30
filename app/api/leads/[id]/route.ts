import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json(
            { success: false, error: 'Database not configured' },
            { status: 503 }
        );
    }

    const { id } = await params;
    if (!id) {
        return NextResponse.json(
            { success: false, error: 'Lead id required' },
            { status: 400 }
        );
    }

    try {
        const body = await _request.json();
        const { status } = body;

        if (!status || !['new', 'contacted', 'qualified', 'not-interested'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Valid status required' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const updates: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase updateLead error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            lead: {
                id: data.id,
                fullName: data.full_name,
                email: data.email,
                phone: data.phone,
                monthlyIncome: data.monthly_income,
                depositSaved: data.deposit_saved,
                employmentStatus: data.employment_status,
                creditScore: data.credit_score,
                score: data.score,
                preQualAmount: data.pre_qual_amount,
                status: data.status,
                timestamp: data.created_at,
                contactedAt: data.updated_at && (data.status === 'contacted' || data.status === 'qualified') ? data.updated_at : null,
            },
        });
    } catch (err) {
        console.error('API leads PATCH error:', err);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
