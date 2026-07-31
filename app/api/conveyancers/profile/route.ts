import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';

export async function PATCH(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session || session.user.accountType !== 'conveyancer') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            profile_completion: 90,
        };
        if (body.bio !== undefined) updates.bio = String(body.bio || '');
        if (body.phone !== undefined) updates.phone = String(body.phone || '');
        if (body.website !== undefined) updates.website = String(body.website || '');
        if (body.city !== undefined) updates.city = String(body.city || '');
        if (body.suburb !== undefined) updates.suburb = String(body.suburb || '');

        const { data, error } = await supabase
            .from('conveyancers')
            .update(updates)
            .eq('id', session.user.profileId)
            .select('*')
            .maybeSingle();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, profile: data });
    } catch (err) {
        console.error('conveyancers/profile PATCH:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
