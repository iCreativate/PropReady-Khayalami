import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';
import { bondOriginatorLabel } from '@/lib/bond-originators';

function mapOriginator(row: Record<string, unknown>) {
    const orgId = String(row.organization_id ?? '');
    return {
        id: String(row.id),
        fullName: String(row.full_name ?? ''),
        email: String(row.email ?? ''),
        phone: row.phone != null ? String(row.phone) : null,
        organizationId: orgId,
        organizationName: bondOriginatorLabel(orgId) || orgId,
        staffNumber: row.staff_number != null ? String(row.staff_number) : null,
        status: String(row.status || 'pending'),
        createdAt: String(row.created_at ?? ''),
    };
}

export async function GET(request: NextRequest) {
    const adminEmail =
        request.headers.get('x-admin-email') || new URL(request.url).searchParams.get('adminEmail');
    const auth = assertAdmin(adminEmail);
    if (!auth.ok) {
        return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
    }

    const statusFilter = new URL(request.url).searchParams.get('status') || 'pending';
    const q = new URL(request.url).searchParams.get('q')?.trim().toLowerCase() || '';

    let query = supabase
        .from('originators')
        .select('id, full_name, email, phone, organization_id, staff_number, status, created_at')
        .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let applications = (data || []).map((row) => mapOriginator(row as Record<string, unknown>));
    if (q) {
        applications = applications.filter(
            (a) =>
                a.fullName.toLowerCase().includes(q) ||
                a.email.toLowerCase().includes(q) ||
                a.organizationName.toLowerCase().includes(q) ||
                String(a.staffNumber || '')
                    .toLowerCase()
                    .includes(q)
        );
    }

    return NextResponse.json({ success: true, applications });
}
