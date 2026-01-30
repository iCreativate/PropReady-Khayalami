import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET() {
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json({ count: 0 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { count, error } = await supabase
            .from('agents')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('API agents/count error:', error);
            return NextResponse.json({ count: 0 });
        }

        return NextResponse.json({ count: count ?? 0 });
    } catch (err) {
        console.error('API agents/count error:', err);
        return NextResponse.json({ count: 0 });
    }
}
