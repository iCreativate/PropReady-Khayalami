import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const AGENT_SELECT_EXTENDED =
    'id, full_name, email, company, phone, password, plan, seller_plan, email_verified, ppra_number, eaab_number, ffc_number, ffc_document_url, verification_status, verification_date, status, city';

const AGENT_SELECT_BASE =
    'id, full_name, email, company, phone, password, eaab_number, status';

async function fetchAgentForLogin(supabase: SupabaseClient, email: string) {
    const extended = await supabase
        .from('agents')
        .select(AGENT_SELECT_EXTENDED)
        .eq('email', email)
        .single();

    if (!extended.error) return extended;

    if (/column/i.test(extended.error.message || '')) {
        return supabase.from('agents').select(AGENT_SELECT_BASE).eq('email', email).single();
    }

    return extended;
}

export async function POST(request: NextRequest) {
    const { email, password, type = 'user' } = await request.json();

    if (!email || !password) {
        return NextResponse.json(
            { success: false, error: 'Email and password required' },
            { status: 400 }
        );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json(
            { success: false, error: 'Database not configured' },
            { status: 503 }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const accountType = type === 'agent' ? 'agent' : 'user';

    try {
        if (accountType === 'agent') {
            const { data: agent, error } = await fetchAgentForLogin(supabase, email);

            if (error || !agent || agent.password !== password) {
                return NextResponse.json(
                    { success: false, error: 'Invalid email or password' },
                    { status: 401 }
                );
            }

            if (agent.email_verified === false) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Please verify your email before signing in.',
                        needsVerification: true,
                        email: agent.email,
                    },
                    { status: 403 }
                );
            }

            const { password: _p, ...safe } = agent;
            return NextResponse.json({
                success: true,
                user: {
                    id: safe.id,
                    fullName: safe.full_name,
                    email: safe.email,
                    company: safe.company,
                    phone: safe.phone,
                    city: safe.city,
                    plan: safe.plan || 'free',
                    sellerPlan: safe.seller_plan || 'none',
                    ppraNumber: safe.ppra_number || safe.eaab_number,
                    ffcNumber: safe.ffc_number,
                    ffcDocumentUrl: safe.ffc_document_url,
                    verificationStatus:
                        safe.verification_status ||
                        (safe.status === 'approved' ? 'verified' : 'pending'),
                    status: safe.status,
                },
            });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('id, full_name, email, password, email_verified')
            .eq('email', email)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        if (user.password !== password) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        if (user.email_verified === false) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Please verify your email before signing in.',
                    needsVerification: true,
                    email: user.email,
                },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
            },
        });
    } catch (err) {
        console.error('API auth/login error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
