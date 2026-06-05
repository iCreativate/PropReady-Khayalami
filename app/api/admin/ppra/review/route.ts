import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminEmail, agentId, action, rejectionReason, verificationNotes } = body as {
            adminEmail?: string;
            agentId?: string;
            action?: 'approve' | 'reject';
            rejectionReason?: string;
            verificationNotes?: string;
        };

        const auth = assertAdmin(adminEmail);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
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
        const updates: Record<string, unknown> = {
            updated_at: now,
            verified_by: adminEmail,
            verification_notes:
                action === 'reject'
                    ? `${rejectionReason?.trim()}${verificationNotes ? ` — ${verificationNotes}` : ''}`
                    : verificationNotes?.trim() || null,
        };

        if (action === 'approve') {
            updates.verification_status = 'verified';
            updates.verification_date = now;
            updates.status = 'approved';
        } else {
            updates.verification_status = 'rejected';
            updates.verification_date = now;
            updates.status = 'rejected';
        }

        const { data, error } = await supabase
            .from('agents')
            .update(updates)
            .eq('id', agentId)
            .select('id, verification_status, full_name, email')
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            agent: {
                id: data.id,
                verificationStatus: data.verification_status,
                fullName: data.full_name,
                email: data.email,
            },
        });
    } catch (err) {
        console.error('PPRA review error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
