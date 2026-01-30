import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: NextRequest) {
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json(
            { success: false, error: 'Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const { user: userData, quizResult: quizData } = body;

        if (!userData?.id || !userData?.email || !userData?.fullName) {
            return NextResponse.json(
                { success: false, error: 'Invalid user data' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const dbUser = {
            id: userData.id,
            full_name: userData.fullName,
            email: userData.email,
            phone: userData.phone || null,
            password: userData.password,
            created_at: userData.timestamp || new Date().toISOString(),
            updated_at: userData.timestamp || new Date().toISOString(),
        };

        const { error: userError } = await supabase
            .from('users')
            .insert([dbUser])
            .select()
            .single();

        if (userError) {
            console.error('Supabase createUser error:', userError);
            const isDuplicate = userError.code === '23505' || /unique|duplicate/i.test(userError.message);
            return NextResponse.json(
                { success: false, error: isDuplicate ? 'An account with this email already exists' : userError.message },
                { status: isDuplicate ? 409 : 500 }
            );
        }

        if (quizData && typeof quizData === 'object') {
            const dbQuiz = {
                id: quizData.id || userData.id,
                user_id: quizData.user_id || userData.id,
                full_name: quizData.fullName ?? quizData.full_name ?? userData.fullName,
                email: quizData.email ?? userData.email,
                phone: quizData.phone ?? userData.phone ?? null,
                monthly_income: quizData.monthlyIncome ?? quizData.monthly_income ?? null,
                expenses: quizData.expenses ?? null,
                has_debt: quizData.hasDebt ?? quizData.has_debt ?? null,
                deposit_saved: quizData.depositSaved ?? quizData.deposit_saved ?? null,
                credit_score: quizData.creditScore ?? quizData.credit_score ?? null,
                employment_status: quizData.employmentStatus ?? quizData.employment_status ?? null,
                score: quizData.score ?? null,
                pre_qual_amount: quizData.preQualAmount ?? quizData.pre_qual_amount ?? null,
                selected_originator: quizData.selectedOriginator ?? quizData.selected_originator ?? null,
            };

            const { error: quizError } = await supabase
                .from('quiz_results')
                .insert([dbQuiz])
                .select()
                .single();

            if (quizError) {
                console.error('Supabase saveQuizResult error:', quizError);
                return NextResponse.json(
                    { success: false, error: quizError.message },
                    { status: 500 }
                );
            }
        }

        // Create lead for agents (buyer); same request
        const dbLead = {
            id: userData.id,
            lead_type: 'buyer',
            full_name: userData.fullName,
            email: userData.email,
            phone: userData.phone ?? null,
            monthly_income: quizData?.monthlyIncome ?? quizData?.monthly_income ?? null,
            deposit_saved: quizData?.depositSaved ?? quizData?.deposit_saved ?? null,
            employment_status: quizData?.employmentStatus ?? quizData?.employment_status ?? null,
            credit_score: quizData?.creditScore ?? quizData?.credit_score ?? null,
            score: quizData?.score ?? null,
            pre_qual_amount: quizData?.preQualAmount ?? quizData?.pre_qual_amount ?? null,
            status: 'new',
        };

        const { error: leadError } = await supabase
            .from('leads')
            .insert([dbLead])
            .select()
            .single();

        if (leadError) {
            console.error('Supabase createLead error (from users/register):', leadError);
            // Don't fail registration; user and quiz are saved; lead can be retried or fixed
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API users/register error:', err);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
