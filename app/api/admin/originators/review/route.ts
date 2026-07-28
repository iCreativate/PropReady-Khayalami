import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { generateUniqueOriginatorStaffNumber } from '@/lib/originator-staff-number';
import { sendOriginatorApprovalEmail } from '@/lib/send-originator-approval-email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminEmail, originatorId, action } = body as {
            adminEmail?: string;
            originatorId?: string;
            action?: 'approve' | 'reject';
        };

        const auth = await assertAdminRequest(request, adminEmail);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
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

        const { data: existing, error: fetchError } = await supabase
            .from('originators')
            .select('id, full_name, email, organization_id, staff_number, status')
            .eq('id', originatorId)
            .maybeSingle();

        if (fetchError || !existing) {
            return NextResponse.json(
                { success: false, error: fetchError?.message || 'Originator not found' },
                { status: 404 }
            );
        }

        const status = action === 'approve' ? 'approved' : 'rejected';
        const updates: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        };

        let staffNumber =
            existing.staff_number != null ? String(existing.staff_number).trim().toUpperCase() : '';
        let emailSent = false;
        let emailError: string | undefined;

        if (action === 'approve') {
            if (!staffNumber) {
                const orgId = String(existing.organization_id || 'org');
                staffNumber = await generateUniqueOriginatorStaffNumber(orgId, originatorId);
                updates.staff_number = staffNumber;
            }
        }

        const { data, error } = await supabase
            .from('originators')
            .update(updates)
            .eq('id', originatorId)
            .select('id, full_name, email, organization_id, staff_number, status')
            .maybeSingle();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        if (!data) {
            return NextResponse.json({ success: false, error: 'Originator not found' }, { status: 404 });
        }

        if (action === 'approve' && staffNumber && data.email) {
            const orgName =
                BOND_ORIGINATORS.find((o) => o.id === data.organization_id)?.name ||
                String(data.organization_id || 'your organisation');
            const sent = await sendOriginatorApprovalEmail({
                email: String(data.email),
                fullName: data.full_name ? String(data.full_name) : undefined,
                organizationName: orgName,
                staffNumber,
            });
            emailSent = sent.ok;
            emailError = sent.error;
        }

        return NextResponse.json({
            success: true,
            originator: {
                id: data.id,
                fullName: data.full_name,
                email: data.email,
                organizationId: data.organization_id,
                staffNumber: data.staff_number,
                status: data.status,
            },
            staffNumberAssigned: Boolean(action === 'approve' && staffNumber),
            emailSent,
            ...(emailError ? { emailWarning: emailError } : {}),
        });
    } catch (err) {
        console.error('originator review error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
