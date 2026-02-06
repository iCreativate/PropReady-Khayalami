import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

/**
 * GET /api/properties/debug
 * Call this to see if the database is configured and if the listed_properties table works.
 *
 * GET /api/properties/debug?testWrite=1
 * Tests if inserts work - creates a temporary row and deletes it.
 */
export async function GET(request: NextRequest) {
    const configured = !!(supabaseUrl && supabaseKey);

    if (!configured) {
        return NextResponse.json({
            configured: false,
            error: 'NEXT_PUBLIC_SUPABASE_URL or Supabase key (SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing',
        });
    }

    const { searchParams } = new URL(request.url);
    const testWrite = searchParams.get('testWrite') === '1';

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (testWrite) {
            const testId = `test-${Date.now()}`;
            const { error: insertError } = await supabase.from('listed_properties').insert({
                id: testId,
                agent_id: 'test',
                title: 'Test Property',
                address: 'Test Address',
                type: 'House',
                price: 1000000,
                published: false,
            });
            if (insertError) {
                return NextResponse.json({
                    configured: true,
                    tableOk: true,
                    testWrite: false,
                    testWriteError: insertError.message,
                    testWriteCode: insertError.code,
                    hint: insertError.code === '42501'
                        ? 'RLS is blocking inserts. Run in Supabase SQL: DROP POLICY IF EXISTS "Allow all operations on listed_properties" ON listed_properties; CREATE POLICY "Allow all operations on listed_properties" ON listed_properties FOR ALL USING (true) WITH CHECK (true);'
                        : insertError.code === '42P01'
                            ? 'Table does not exist. Run supabase-migration-properties.sql in Supabase SQL Editor.'
                            : undefined,
                });
            }
            await supabase.from('listed_properties').delete().eq('id', testId);
            return NextResponse.json({
                configured: true,
                tableOk: true,
                testWrite: true,
                message: 'Insert and delete test passed. Database is writable.',
            });
        }

        const { count: totalCount, error: countError } = await supabase
            .from('listed_properties')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            return NextResponse.json({
                configured: true,
                tableOk: false,
                error: countError.message,
                code: countError.code,
                hint: countError.code === '42P01'
                    ? 'Run supabase-migration-properties.sql in Supabase SQL Editor to create the listed_properties table.'
                    : countError.code === '42501'
                        ? 'RLS may be blocking. Check your Supabase RLS policies on listed_properties.'
                        : undefined,
            });
        }

        const { data: allRows, error } = await supabase
            .from('listed_properties')
            .select('id, title, published, created_at')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            return NextResponse.json({
                configured: true,
                tableOk: false,
                error: error.message,
                code: error.code,
                hint: error.code === '42P01'
                    ? 'Run supabase-migration-properties.sql in Supabase SQL Editor.'
                    : undefined,
            });
        }

        const publishedCount = (allRows || []).filter((r: { published?: boolean }) => r.published !== false).length;

        return NextResponse.json({
            configured: true,
            tableOk: true,
            tableName: 'listed_properties',
            propertyCount: totalCount ?? 0,
            publishedCount,
            sample: allRows || [],
            hint: publishedCount === 0 && (totalCount ?? 0) > 0
                ? 'Properties exist but none are published. Agents must click "Publish" on each property for it to appear on the search page.'
                : (totalCount ?? 0) === 0
                    ? 'No properties in database. Add a property in the agent dashboard and click Publish. If you added properties but this shows 0, check: (1) Run supabase-migration-properties.sql to create listed_properties table, (2) Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Netlify env vars, (3) Redeploy.'
                    : undefined,
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
