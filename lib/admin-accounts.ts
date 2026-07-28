import type { SupabaseClient } from '@supabase/supabase-js';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { revokeAllSessions } from '@/lib/auth-enterprise';
import { profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';
import type { AccountType } from '@/lib/auth-enterprise/config';
import { generateUniqueOriginatorStaffNumber } from '@/lib/originator-staff-number';
import { sendOriginatorApprovalEmail } from '@/lib/send-originator-approval-email';

export type PortalAccountType = AccountType;

export function parsePortalAccountType(value: unknown): PortalAccountType | null {
    if (value === 'user' || value === 'agent' || value === 'originator') return value;
    return null;
}

async function updateAgentStatus(
    supabase: SupabaseClient,
    id: string,
    status: 'approved' | 'rejected' | 'pending',
    adminEmail: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
    const now = new Date().toISOString();
    const base: Record<string, unknown> = {
        status,
        updated_at: now,
    };
    if (status === 'approved') {
        base.verification_status = 'verified';
        base.verification_date = now;
        base.verified_by = adminEmail;
    } else if (status === 'rejected') {
        base.verification_status = 'rejected';
        base.verification_date = now;
        base.verified_by = adminEmail;
    } else {
        base.verification_status = 'pending';
    }

    let { data, error } = await supabase
        .from('agents')
        .update(base)
        .eq('id', id)
        .select('id, status, verification_status')
        .maybeSingle();

    // Older DBs may lack verified_by / verification_* — retry with status only
    if (error && /verified_by|verification_/i.test(error.message)) {
        const fallback = { status, updated_at: now };
        const retry = await supabase
            .from('agents')
            .update(fallback)
            .eq('id', id)
            .select('id, status')
            .maybeSingle();
        data = retry.data as typeof data;
        error = retry.error;
    }

    if (error) {
        return { ok: false, error: error.message, status: 500 };
    }
    if (!data) {
        return { ok: false, error: 'Agent not found', status: 404 };
    }
    return { ok: true };
}

async function updateOriginatorStatus(
    supabase: SupabaseClient,
    id: string,
    status: 'approved' | 'rejected' | 'pending'
): Promise<{ ok: true; staffNumber?: string | null } | { ok: false; error: string; status: number }> {
    const { data: existing, error: fetchError } = await supabase
        .from('originators')
        .select('id, full_name, email, organization_id, staff_number, status')
        .eq('id', id)
        .maybeSingle();

    if (fetchError || !existing) {
        return { ok: false, error: fetchError?.message || 'Originator not found', status: 404 };
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { status, updated_at: now };
    let staffNumber =
        existing.staff_number != null ? String(existing.staff_number).trim().toUpperCase() : '';

    if (status === 'approved' && !staffNumber) {
        staffNumber = await generateUniqueOriginatorStaffNumber(
            String(existing.organization_id || 'org'),
            id
        );
        updates.staff_number = staffNumber;
    }

    const { data, error } = await supabase
        .from('originators')
        .update(updates)
        .eq('id', id)
        .select('id, status, staff_number')
        .maybeSingle();

    if (error) {
        return { ok: false, error: error.message, status: 500 };
    }
    if (!data) {
        return { ok: false, error: 'Originator not found', status: 404 };
    }

    if (status === 'approved' && staffNumber && existing.email) {
        const orgName =
            BOND_ORIGINATORS.find((o) => o.id === existing.organization_id)?.name ||
            String(existing.organization_id || 'your organisation');
        await sendOriginatorApprovalEmail({
            email: String(existing.email),
            fullName: existing.full_name ? String(existing.full_name) : undefined,
            organizationName: orgName,
            staffNumber,
        }).catch(() => null);
    }

    return { ok: true, staffNumber: staffNumber || null };
}

export async function adminSetAccountStatus(
    supabase: SupabaseClient,
    input: {
        id: string;
        accountType: PortalAccountType;
        status: 'approved' | 'rejected' | 'pending';
        adminEmail: string;
    }
): Promise<{ ok: true; staffNumber?: string | null } | { ok: false; error: string; status: number }> {
    if (input.accountType === 'user') {
        return { ok: false, error: 'Buyers/sellers do not have approval status', status: 400 };
    }
    if (input.accountType === 'agent') {
        return updateAgentStatus(supabase, input.id, input.status, input.adminEmail);
    }
    return updateOriginatorStatus(supabase, input.id, input.status);
}

export async function adminDeleteAccount(
    supabase: SupabaseClient,
    input: { id: string; accountType: PortalAccountType }
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
    const { id, accountType } = input;
    const table = profileTableForAccountType(accountType);

    const { data: profile, error: profileError } = await supabase
        .from(table)
        .select('id, email')
        .eq('id', id)
        .maybeSingle();

    if (profileError) {
        return { ok: false, error: profileError.message, status: 500 };
    }
    if (!profile) {
        return { ok: false, error: 'Account not found', status: 404 };
    }

    // Revoke + remove enterprise auth rows (best-effort)
    try {
        const email = String(profile.email || '')
            .trim()
            .toLowerCase();
        const ids = new Set<string>();

        const { data: byProfile } = await supabase
            .from('auth_accounts')
            .select('id')
            .eq('account_type', accountType)
            .eq('profile_id', id);
        for (const row of byProfile || []) ids.add(String(row.id));

        if (email) {
            const { data: byEmail } = await supabase
                .from('auth_accounts')
                .select('id')
                .eq('account_type', accountType)
                .eq('email', email);
            for (const row of byEmail || []) ids.add(String(row.id));
        }

        for (const accountId of ids) {
            try {
                await revokeAllSessions(accountId);
            } catch {
                /* ignore */
            }
            await supabase.from('auth_accounts').delete().eq('id', accountId);
        }
    } catch {
        /* auth tables may be missing on older installs */
    }

    const { data: deleted, error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

    if (error) {
        const msg = error.message || 'Delete failed';
        if (/foreign key|violates|restrict/i.test(msg)) {
            return {
                ok: false,
                error:
                    'Cannot delete: this account still has linked records (leads, viewings, documents, or cases). Remove or reassign those first.',
                status: 409,
            };
        }
        return { ok: false, error: msg, status: 500 };
    }
    if (!deleted) {
        return { ok: false, error: 'Account not found', status: 404 };
    }
    return { ok: true };
}
