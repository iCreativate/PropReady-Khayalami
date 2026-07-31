import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';
import { findAccountByEmail } from '@/lib/auth-enterprise/sessions';
import { hashPassword, verifyPassword } from '@/lib/auth-enterprise/password';
import { validatePassword } from '@/lib/password';

/** GET /api/agents/profile — current agent profile */
export async function GET(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session || session.user.accountType !== 'agent') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }
        const { data, error } = await supabase
            .from('agents')
            .select(
                'id, full_name, email, phone, company, city, eaab_number, ppra_number, ffc_number, status, plan, seller_plan, verification_status'
            )
            .eq('id', session.user.profileId)
            .maybeSingle();
        if (error || !data) {
            return NextResponse.json({ success: false, error: error?.message || 'Not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, agent: data });
    } catch (err) {
        console.error('agents/profile GET:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

/** PATCH /api/agents/profile — update profile fields and/or password */
export async function PATCH(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session || session.user.accountType !== 'agent') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user;
        const body = await request.json();
        const supabase = createServiceClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
        }

        if (body.newPassword) {
            const currentPassword = String(body.currentPassword || '');
            const newPassword = String(body.newPassword || '');
            const pw = validatePassword(newPassword);
            if (!pw.valid) {
                return NextResponse.json({ success: false, error: pw.errors.join(', ') }, { status: 400 });
            }
            const account = await findAccountByEmail(user.email, 'agent');
            if (!account) {
                return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
            }
            if (account.password_hash) {
                const ok = await verifyPassword(currentPassword, account.password_hash);
                if (!ok) {
                    return NextResponse.json(
                        { success: false, error: 'Current password is incorrect' },
                        { status: 401 }
                    );
                }
            }
            const password_hash = await hashPassword(newPassword);
            const { error: authErr } = await supabase
                .from('auth_accounts')
                .update({ password_hash, updated_at: new Date().toISOString() })
                .eq('id', account.id);
            if (authErr) {
                return NextResponse.json({ success: false, error: authErr.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, passwordChanged: true });
        }

        const patch: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };
        if (body.fullName !== undefined) patch.full_name = String(body.fullName).trim();
        if (body.phone !== undefined) patch.phone = String(body.phone).trim();
        if (body.company !== undefined) patch.company = String(body.company).trim();
        if (body.city !== undefined) patch.city = String(body.city).trim();
        if (body.eaabNumber !== undefined) {
            patch.eaab_number = String(body.eaabNumber).replace(/\D/g, '');
        }

        const { data, error } = await supabase
            .from('agents')
            .update(patch)
            .eq('id', user.profileId)
            .select(
                'id, full_name, email, phone, company, city, eaab_number, ppra_number, status, plan'
            )
            .maybeSingle();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, agent: data });
    } catch (err) {
        console.error('agents/profile PATCH:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
