import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * GET /api/properties/debug
 * Call this to see if the database is configured and if the listed_properties table works.
 */
export async function GET() {
    const configured = !!(supabaseUrl && supabaseKey);

    if (!configured) {
        return NextResponse.json({
            configured: false,
            error: 'NEXT_PUBLIC_SUPABASE_URL or Supabase key (SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing',
        });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

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
            propertyCount: totalCount ?? 0,
            publishedCount,
            sample: allRows || [],
            hint: publishedCount === 0 && (totalCount ?? 0) > 0
                ? 'Properties exist but none are published. Agents must click "Publish" on each property for it to appear on the search page.'
                : (totalCount ?? 0) === 0
                    ? 'No properties in database. Add a property in the agent dashboard and click Publish.'
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
