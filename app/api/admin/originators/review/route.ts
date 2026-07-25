import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminEmail, originatorId, action } = body as {
            adminEmail?: string;
            originatorId?: string;
            action?: 'approve' | 'reject';
        };

        const auth = assertAdmin(adminEmail);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
        }

        if (!originatorId || !action) {
            return NextResponse.json(
                { success: false, error: 'originatorId and action required' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const status = action === 'approve' ? 'approved' : 'rejected';
        const { data, error } = await supabase
            .from('originators')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', originatorId)
            .select('id, full_name, email, status')
            .single();

        if (error || !data) {
            return NextResponse.json(
                { success: false, error: error?.message || 'Update failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            originator: {
                id: data.id,
                fullName: data.full_name,
                email: data.email,
                status: data.status,
            },
        });
    } catch (err) {
        console.error('originator review error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
