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
        const agentData = await request.json();

        if (!agentData?.id || !agentData?.email || !agentData?.fullName || !agentData?.eaabNumber) {
            return NextResponse.json(
                { success: false, error: 'Invalid agent data' },
                { status: 400 }
            );
        }

        const ffc = String(agentData.eaabNumber).replace(/\D/g, '');
        if (ffc.length !== 7) {
            return NextResponse.json(
                { success: false, error: 'FFC number must be exactly 7 digits' },
                { status: 400 }
            );
        }
        if (/^0+$/.test(ffc)) {
            return NextResponse.json(
                { success: false, error: 'Enter a valid 7-digit PPRA FFC number' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const dbAgent = {
            id: agentData.id,
            full_name: agentData.fullName,
            email: agentData.email,
            phone: agentData.phone,
            eaab_number: ffc,
            company: agentData.company,
            password: agentData.password,
            status: agentData.status || 'pending',
            created_at: agentData.timestamp || new Date().toISOString(),
            updated_at: agentData.timestamp || new Date().toISOString(),
        };

        const { error } = await supabase
            .from('agents')
            .insert([dbAgent])
            .select()
            .single();

        if (error) {
            console.error('Supabase createAgent error:', error);
            const isDuplicate = error.code === '23505' || /unique|duplicate/i.test(error.message);
            return NextResponse.json(
                { success: false, error: isDuplicate ? 'An account with this email already exists' : error.message },
                { status: isDuplicate ? 409 : 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API agents/register error:', err);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
