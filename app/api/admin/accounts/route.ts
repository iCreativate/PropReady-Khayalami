import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { validatePassword } from '@/lib/password';
import {
    findAccountByEmail,
    revokeAllSessions,
    upsertAccountFromProfile,
} from '@/lib/auth-enterprise';
import { profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';
import type { AccountType } from '@/lib/auth-enterprise/config';
import { generateUniqueOriginatorStaffNumber } from '@/lib/originator-staff-number';
import { sendOriginatorApprovalEmail } from '@/lib/send-originator-approval-email';

type PortalAccountType = AccountType;

function parsePortalType(value: unknown): PortalAccountType | null {
    if (value === 'user' || value === 'agent' || value === 'originator') return value;
    return null;
}

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
            accountType: PortalAccountType;
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
                .limit(150);
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
                .limit(150);
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
                .limit(150);
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

        return NextResponse.json({ success: true, accounts: accounts.slice(0, 200) });
    } catch (err) {
        console.error('admin accounts:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

/** Create a buyer/seller, agent, or originator account. */
export async function POST(request: NextRequest) {
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
        const accountType = parsePortalType(body.accountType);
        const email = String(body.email || '')
            .trim()
            .toLowerCase();
        const fullName = String(body.fullName || '').trim();
        const password = String(body.password || '');
        const phone = String(body.phone || '').trim() || null;
        const organizationId = String(body.organizationId || '').trim();
        const company = String(body.company || '').trim() || null;
        const approve = body.approve === true;

        if (!accountType || !email || !fullName || !password) {
            return NextResponse.json(
                { error: 'accountType, email, fullName, and password are required' },
                { status: 400 }
            );
        }

        const pw = validatePassword(password);
        if (!pw.valid) {
            return NextResponse.json({ error: pw.errors.join(', ') }, { status: 400 });
        }

        if (accountType === 'originator') {
            const validOrg = BOND_ORIGINATORS.some((o) => o.id === organizationId);
            if (!validOrg) {
                return NextResponse.json(
                    { error: 'Select a valid bond originator organisation' },
                    { status: 400 }
                );
            }
        }

        const existing = await findAccountByEmail(email, accountType);
        if (existing) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
        }

        const table = profileTableForAccountType(accountType);
        const { data: dup } = await supabase.from(table).select('id').eq('email', email).maybeSingle();
        if (dup) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        let staffNumber: string | null = null;

        const row: Record<string, unknown> =
            accountType === 'agent'
                ? {
                      id,
                      full_name: fullName,
                      email,
                      phone,
                      company,
                      password: '',
                      status: approve ? 'approved' : 'pending',
                      verification_status: approve ? 'verified' : 'pending',
                      verification_date: approve ? now : null,
                      verified_by: approve ? auth.email : null,
                      email_verified: true,
                  }
                : accountType === 'originator'
                  ? {
                        id,
                        full_name: fullName,
                        email,
                        phone,
                        password: '',
                        organization_id: organizationId,
                        status: approve ? 'approved' : 'pending',
                        email_verified: true,
                    }
                  : {
                        id,
                        full_name: fullName,
                        email,
                        phone,
                        password: '',
                        email_verified: true,
                    };

        if (accountType === 'originator' && approve) {
            staffNumber = await generateUniqueOriginatorStaffNumber(organizationId, id);
            row.staff_number = staffNumber;
        }

        const { data: profile, error } = await supabase
            .from(table)
            .insert(row)
            .select('id, email, full_name')
            .single();

        if (error || !profile) {
            return NextResponse.json(
                { error: error?.message || 'Could not create account' },
                { status: 500 }
            );
        }

        await upsertAccountFromProfile(email, accountType, String(profile.id), password);
        const account = await findAccountByEmail(email, accountType);
        if (account) {
            await supabase
                .from('auth_accounts')
                .update({
                    email_verified_at: now,
                    updated_at: now,
                })
                .eq('id', account.id);
        }

        if (accountType === 'originator' && approve && staffNumber) {
            const orgName =
                BOND_ORIGINATORS.find((o) => o.id === organizationId)?.name || organizationId;
            await sendOriginatorApprovalEmail({
                email,
                fullName,
                organizationName: orgName,
                staffNumber,
            }).catch(() => null);
        }

        return NextResponse.json({
            success: true,
            account: {
                id: String(profile.id),
                accountType,
                fullName: String(profile.full_name || fullName),
                email: String(profile.email || email),
                staffNumber,
            },
        });
    } catch (err) {
        console.error('admin accounts POST:', err);
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
        const accountType = parsePortalType(body.accountType);
        const id = String(body.id || '');
        const status = String(body.status || '').trim().toLowerCase();

        if (!id || !accountType || accountType === 'user') {
            return NextResponse.json(
                { error: 'id and accountType (agent|originator) required' },
                { status: 400 }
            );
        }
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const now = new Date().toISOString();

        if (accountType === 'agent') {
            const updates: Record<string, unknown> = {
                status,
                updated_at: now,
                verified_by: auth.email,
            };
            if (status === 'approved') {
                updates.verification_status = 'verified';
                updates.verification_date = now;
            } else if (status === 'rejected') {
                updates.verification_status = 'rejected';
                updates.verification_date = now;
            } else {
                updates.verification_status = 'pending';
            }

            const { error } = await supabase.from('agents').update(updates).eq('id', id);
            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true });
        }

        // Originator — mirror dedicated review (staff number + email on approve)
        const { data: existing, error: fetchError } = await supabase
            .from('originators')
            .select('id, full_name, email, organization_id, staff_number, status')
            .eq('id', id)
            .maybeSingle();

        if (fetchError || !existing) {
            return NextResponse.json({ error: fetchError?.message || 'Not found' }, { status: 404 });
        }

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

        const { error } = await supabase.from('originators').update(updates).eq('id', id);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
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

        return NextResponse.json({ success: true, staffNumber: staffNumber || null });
    } catch (err) {
        console.error('admin accounts PATCH:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

/** Permanently delete a portal account. */
export async function DELETE(request: NextRequest) {
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
        const accountType = parsePortalType(body.accountType);
        const id = String(body.id || '');

        if (!id || !accountType) {
            return NextResponse.json(
                { error: 'id and accountType (user|agent|originator) required' },
                { status: 400 }
            );
        }

        const table = profileTableForAccountType(accountType);

        const { data: authAccount } = await supabase
            .from('auth_accounts')
            .select('id')
            .eq('account_type', accountType)
            .eq('profile_id', id)
            .maybeSingle();

        if (authAccount?.id) {
            await revokeAllSessions(String(authAccount.id));
            await supabase.from('auth_accounts').delete().eq('id', authAccount.id);
        }

        // Also clear by email match if profile_id linking differs
        const { data: profile } = await supabase.from(table).select('email').eq('id', id).maybeSingle();
        if (profile?.email) {
            const { data: byEmail } = await supabase
                .from('auth_accounts')
                .select('id')
                .eq('account_type', accountType)
                .eq('email', String(profile.email).toLowerCase())
                .maybeSingle();
            if (byEmail?.id) {
                await revokeAllSessions(String(byEmail.id));
                await supabase.from('auth_accounts').delete().eq('id', byEmail.id);
            }
        }

        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('admin accounts DELETE:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
