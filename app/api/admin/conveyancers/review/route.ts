import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminEmail, conveyancerId, action } = body as {
            adminEmail?: string;
            conveyancerId?: string;
            action?: 'approve' | 'reject' | 'suspend';
        };

        const auth = await assertAdminRequest(request, adminEmail);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        if (!conveyancerId || !action) {
            return NextResponse.json(
                { success: false, error: 'conveyancerId and action required' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const status =
            action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended';
        const updates: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        };
        if (action === 'approve') {
            updates.verified_at = new Date().toISOString();
            updates.profile_completion = 85;
        }

        const { data, error } = await supabase
            .from('conveyancers')
            .update(updates)
            .eq('id', conveyancerId)
            .select('id, full_name, email, firm_name, firm_slug, status, verified_at')
            .maybeSingle();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        if (!data) {
            return NextResponse.json({ success: false, error: 'Conveyancer not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, conveyancer: data });
    } catch (err) {
        console.error('admin/conveyancers/review:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
