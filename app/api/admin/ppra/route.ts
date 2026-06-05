import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';

interface PpraApplication {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    company: string;
    city: string | null;
    ppraNumber: string;
    ffcNumber: string | null;
    ffcDocumentUrl: string | null;
    verificationStatus: string;
    verificationDate: string | null;
    verifiedBy: string | null;
    verificationNotes: string | null;
    createdAt: string;
    status: string;
}

function mapAgent(row: Record<string, unknown>): PpraApplication {
    return {
        id: String(row.id),
        fullName: String(row.full_name ?? ''),
        email: String(row.email ?? ''),
        phone: String(row.phone ?? ''),
        company: String(row.company ?? ''),
        city: row.city != null ? String(row.city) : null,
        ppraNumber: String(row.ppra_number ?? row.eaab_number ?? ''),
        ffcNumber: row.ffc_number != null ? String(row.ffc_number) : null,
        ffcDocumentUrl: row.ffc_document_url != null ? String(row.ffc_document_url) : null,
        verificationStatus: String(row.verification_status || 'pending'),
        verificationDate: row.verification_date != null ? String(row.verification_date) : null,
        verifiedBy: row.verified_by != null ? String(row.verified_by) : null,
        verificationNotes: row.verification_notes != null ? String(row.verification_notes) : null,
        createdAt: String(row.created_at ?? ''),
        status: String(row.status ?? ''),
    };
}

export async function GET(request: NextRequest) {
    const adminEmail = request.headers.get('x-admin-email') || new URL(request.url).searchParams.get('adminEmail');
    const auth = assertAdmin(adminEmail);
    if (!auth.ok) {
        return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
    }

    const q = new URL(request.url).searchParams.get('q')?.trim().toLowerCase() || '';
    const statusFilter = new URL(request.url).searchParams.get('status') || 'all';

    let query = supabase
        .from('agents')
        .select(
            'id, full_name, email, phone, company, city, ppra_number, eaab_number, ffc_number, ffc_document_url, verification_status, verification_date, verified_by, verification_notes, created_at, status'
        )
        .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let applications = (data || []).map((row) => mapAgent(row as Record<string, unknown>));

    if (q) {
        applications = applications.filter(
            (a) =>
                a.fullName?.toLowerCase().includes(q) ||
                a.company?.toLowerCase().includes(q) ||
                String(a.ppraNumber || '').includes(q) ||
                a.email?.toLowerCase().includes(q)
        );
    }

    return NextResponse.json({ success: true, applications });
}
