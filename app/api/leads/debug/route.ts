import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertDemoToolsAllowed } from '@/lib/production';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * GET /api/leads/debug — development only.
 */
export async function GET() {
    const gate = assertDemoToolsAllowed();
    if (!gate.ok) return gate.response;

    const configured = !!(supabaseUrl && supabaseAnonKey);

    if (!configured) {
        return NextResponse.json({
            configured: false,
            error: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing',
        });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { count: totalCount, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            return NextResponse.json({
                configured: true,
                tableOk: false,
                error: countError.message,
                code: countError.code,
            });
        }

        const { data: rows, error } = await supabase
            .from('leads')
            .select('id, lead_type, full_name, email, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            return NextResponse.json({
                configured: true,
                tableOk: false,
                error: error.message,
                code: error.code,
            });
        }

        const leads = rows || [];
        return NextResponse.json({
            configured: true,
            tableOk: true,
            leadCount: totalCount ?? 0,
            sampleCount: Math.min(5, leads.length),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({
            configured: true,
            tableOk: false,
            error: message,
        });
    }
}
