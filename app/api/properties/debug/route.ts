import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertDemoToolsAllowed } from '@/lib/production';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

/**
 * GET /api/properties/debug — development only.
 */
export async function GET(request: NextRequest) {
    const gate = assertDemoToolsAllowed();
    if (!gate.ok) return gate.response;

    const configured = !!(supabaseUrl && supabaseKey);

    if (!configured) {
        return NextResponse.json({
            configured: false,
            error: 'Supabase URL or key missing',
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
                });
            }
            await supabase.from('listed_properties').delete().eq('id', testId);
            return NextResponse.json({
                configured: true,
                tableOk: true,
                testWrite: true,
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
            });
        }

        return NextResponse.json({
            configured: true,
            tableOk: true,
            propertyCount: totalCount ?? 0,
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
