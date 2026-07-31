import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
    try {
        const adminEmail = request.nextUrl.searchParams.get('adminEmail') || undefined;
        const status = request.nextUrl.searchParams.get('status') || undefined;
        const auth = await assertAdminRequest(request, adminEmail);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        let query = supabase
            .from('conveyancers')
            .select(
                'id, full_name, email, firm_name, firm_slug, lpc_number, province, city, status, profile_completion, created_at, verified_at'
            )
            .order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const pending = (data || []).filter((r) => r.status === 'pending').length;
        return NextResponse.json({
            success: true,
            conveyancers: data || [],
            pendingCount: pending,
        });
    } catch (err) {
        console.error('admin/conveyancers GET:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
