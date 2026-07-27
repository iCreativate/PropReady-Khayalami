import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const type = request.nextUrl.searchParams.get('type') || 'all';
    const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
    const status = request.nextUrl.searchParams.get('status') || 'all';

    try {
        const accounts: Array<{
            id: string;
            accountType: 'user' | 'agent' | 'originator';
            fullName: string;
            email: string;
            status: string;
            createdAt: string | null;
            meta?: string;
        }> = [];

        if (type === 'all' || type === 'user') {
            let query = supabase
                .from('users')
                .select('id, full_name, email, created_at')
                .order('created_at', { ascending: false })
                .limit(100);
            if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
            const { data } = await query;
            for (const row of data || []) {
                accounts.push({
                    id: String(row.id),
                    accountType: 'user',
                    fullName: String(row.full_name || ''),
                    email: String(row.email || ''),
                    status: 'active',
                    createdAt: row.created_at ? String(row.created_at) : null,
                });
            }
        }

        if (type === 'all' || type === 'agent') {
            let query = supabase
                .from('agents')
                .select('id, full_name, email, status, verification_status, company, created_at')
                .order('created_at', { ascending: false })
                .limit(100);
            if (status !== 'all') query = query.eq('status', status);
            if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
            const { data } = await query;
            for (const row of data || []) {
                accounts.push({
                    id: String(row.id),
                    accountType: 'agent',
                    fullName: String(row.full_name || ''),
                    email: String(row.email || ''),
                    status: String(row.status || row.verification_status || 'unknown'),
                    createdAt: row.created_at ? String(row.created_at) : null,
                    meta: row.company ? String(row.company) : undefined,
                });
            }
        }

        if (type === 'all' || type === 'originator') {
            let query = supabase
                .from('originators')
                .select('id, full_name, email, status, organization_id, staff_number, created_at')
                .order('created_at', { ascending: false })
                .limit(100);
            if (status !== 'all') query = query.eq('status', status);
            if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
            const { data } = await query;
            for (const row of data || []) {
                accounts.push({
                    id: String(row.id),
                    accountType: 'originator',
                    fullName: String(row.full_name || ''),
                    email: String(row.email || ''),
                    status: String(row.status || 'unknown'),
                    createdAt: row.created_at ? String(row.created_at) : null,
                    meta: [row.organization_id, row.staff_number].filter(Boolean).join(' · ') || undefined,
                });
            }
        }

        accounts.sort(
            (a, b) =>
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        return NextResponse.json({ success: true, accounts: accounts.slice(0, 150) });
    } catch (err) {
        console.error('admin accounts:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const accountType = String(body.accountType || '');
        const id = String(body.id || '');
        const status = String(body.status || '').trim().toLowerCase();

        if (!id || !['agent', 'originator'].includes(accountType)) {
            return NextResponse.json(
                { error: 'id and accountType (agent|originator) required' },
                { status: 400 }
            );
        }
        if (!['approved', 'rejected', 'pending', 'active'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const table = accountType === 'agent' ? 'agents' : 'originators';
        const updates: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        };
        if (accountType === 'agent' && status === 'approved') {
            updates.verification_status = 'verified';
            updates.verification_date = new Date().toISOString();
        }
        if (accountType === 'agent' && status === 'rejected') {
            updates.verification_status = 'rejected';
        }

        const { error } = await supabase.from(table).update(updates).eq('id', id);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('admin accounts PATCH:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
