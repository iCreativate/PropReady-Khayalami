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

        const { count: totalCount, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            return NextResponse.json({
                configured: true,
                tableOk: false,
                error: countError.message,
                code: countError.code,
                hint: countError.code === '42P01'
                    ? 'Run supabase-schema.sql in Supabase SQL Editor to create the leads table.'
                    : /column.*does not exist|undefined column/i.test(countError.message)
                        ? 'Run supabase-migration-leads-seller-columns.sql to add lead_type and seller columns.'
                        : countError.code === '42501'
                            ? 'RLS may be blocking. In Supabase SQL Editor run: DROP POLICY IF EXISTS "Allow all operations on leads" ON leads; CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true) WITH CHECK (true);'
                            : undefined,
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
                hint: error.code === '42P01'
                    ? 'Run supabase-schema.sql in Supabase SQL Editor to create the leads table.'
                    : /column.*does not exist|undefined column/i.test(error.message)
                        ? 'Run supabase-migration-leads-seller-columns.sql to add lead_type and seller columns.'
                        : error.code === '42501'
                            ? 'RLS may be blocking. In Supabase SQL Editor run: DROP POLICY IF EXISTS "Allow all operations on leads" ON leads; CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true) WITH CHECK (true);'
                            : undefined,
            });
        }

        const leads = rows || [];
        const buyerCount = leads.filter((r: { lead_type?: string }) => (r.lead_type || 'buyer') !== 'seller' && (r.lead_type || 'buyer') !== 'investor').length;
        const sellerCount = leads.filter((r: { lead_type?: string }) => (r.lead_type || '') === 'seller' || (r.lead_type || '') === 'investor').length;

        return NextResponse.json({
            configured: true,
            tableOk: true,
            leadCount: totalCount ?? 0,
            buyerCount,
            sellerCount,
            sample: leads.slice(0, 5),
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
