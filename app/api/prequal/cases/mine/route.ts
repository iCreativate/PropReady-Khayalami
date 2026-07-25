import { NextRequest, NextResponse } from 'next/server';
import { resolvePrequalActor } from '@/lib/prequal-auth';
import { serializePrequalCase, type PrequalCaseRow } from '@/lib/prequal-cases';
import { createServiceClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
    try {
        const actor = await resolvePrequalActor(request);
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        let buyerUserId = actor?.role === 'buyer' ? actor.profileId : '';
        if (!buyerUserId) {
            buyerUserId = request.nextUrl.searchParams.get('userId')?.trim() || '';
        }
        if (!buyerUserId) {
            return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('prequal_cases')
            .select('*')
            .eq('buyer_user_id', buyerUserId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('prequal cases mine:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            cases: ((data ?? []) as PrequalCaseRow[]).map((row) => serializePrequalCase(row)),
        });
    } catch (err) {
        console.error('GET /api/prequal/cases/mine:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
