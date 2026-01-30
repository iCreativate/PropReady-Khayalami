import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

    try {
        if (type === 'agent') {
            const { data: agent, error } = await supabase
                .from('agents')
                .select('id, full_name, email, company, password, plan')
                .eq('email', email)
                .single();

            if (error || !agent || agent.password !== password) {
                return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
            }

            const { password: _p, ...safe } = agent;
            return NextResponse.json({
                success: true,
                user: {
                    id: safe.id,
                    fullName: safe.full_name,
                    email: safe.email,
                    company: safe.company,
                    plan: safe.plan || 'free',
                },
            });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('id, full_name, email, password')
            .eq('email', email)
            .single();

        if (error || !user) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        if (user.password !== password) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
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
