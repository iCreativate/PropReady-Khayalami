import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agentId, action, rejectionReason, verificationNotes } = body as {
            agentId?: string;
            action?: 'approve' | 'reject';
            rejectionReason?: string;
            verificationNotes?: string;
        };

        const auth = await assertAdminRequest(request);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        if (!agentId || !action) {
            return NextResponse.json(
                { success: false, error: 'agentId and action required' },
                { status: 400 }
            );
        }

        if (action === 'reject' && !rejectionReason?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Rejection reason is required' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        const now = new Date().toISOString();
        const fullUpdates: Record<string, unknown> = {
            updated_at: now,
            verified_by: auth.email,
            verification_notes:
                action === 'reject'
                    ? `${rejectionReason?.trim()}${verificationNotes ? ` — ${verificationNotes}` : ''}`
                    : verificationNotes?.trim() || null,
            status: action === 'approve' ? 'approved' : 'rejected',
            verification_status: action === 'approve' ? 'verified' : 'rejected',
            verification_date: now,
        };

        let { data, error } = await supabase
            .from('agents')
            .update(fullUpdates)
            .eq('id', agentId)
            .select('id, verification_status, status, full_name, email')
            .maybeSingle();

        // Fallback if optional verification columns are missing on older DBs
        if (error && /verified_by|verification_/i.test(error.message)) {
            const retry = await supabase
                .from('agents')
                .update({
                    status: action === 'approve' ? 'approved' : 'rejected',
                    updated_at: now,
                })
                .eq('id', agentId)
                .select('id, status, full_name, email')
                .maybeSingle();
            data = retry.data as typeof data;
            error = retry.error;
        }

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        if (!data) {
            return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            agent: {
                id: data.id,
                verificationStatus: data.verification_status || data.status,
                fullName: data.full_name,
                email: data.email,
            },
        });
    } catch (err) {
        console.error('PPRA review error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
