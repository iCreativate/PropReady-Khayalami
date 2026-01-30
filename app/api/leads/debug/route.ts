import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * GET /api/leads/debug
 * Call this to see if the database is configured and if the leads table works.
 */
export async function GET() {
    const configured = !!(supabaseUrl && supabaseAnonKey);

    if (!configured) {
        return NextResponse.json({
            configured: false,
            error: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing',
        });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (error) {
            return NextResponse.json({
                configured: true,
                tableOk: false,
                error: error.message,
                code: error.code,
                hint: error.code === '42P01'
                    ? 'Run supabase-schema.sql in Supabase SQL Editor to create the leads table.'
                    : error.code === '42501'
                        ? 'RLS may be blocking. In Supabase SQL Editor run: DROP POLICY IF EXISTS "Allow all operations on leads" ON leads; CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true) WITH CHECK (true);'
                        : undefined,
            });
        }

        return NextResponse.json({
            configured: true,
            tableOk: true,
            leadCount: count ?? 0,
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
