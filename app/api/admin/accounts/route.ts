import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import {
    adminDeleteAccount,
    adminSetAccountStatus,
    parsePortalAccountType,
} from '@/lib/admin-accounts';
import { createServiceClient } from '@/lib/supabase-admin';
import { BOND_ORIGINATORS } from '@/lib/bond-originators';
import { validatePassword } from '@/lib/password';
import {
    findAccountByEmail,
    upsertAccountFromProfile,
} from '@/lib/auth-enterprise';
import { profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';
import { generateUniqueOriginatorStaffNumber } from '@/lib/originator-staff-number';
import { sendOriginatorApprovalEmail } from '@/lib/send-originator-approval-email';
import {
    duplicateEmailConflictResponse,
    findExistingAccountsByEmail,
} from '@/lib/email-availability';
import { filterDemoOriginators } from '@/lib/originator-exclusions';

export async function GET(request: NextRequest) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabaseOrNull = createServiceClient();
    if (!supabaseOrNull) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const supabase = supabaseOrNull;

    const type = request.nextUrl.searchParams.get('type') || 'all';
    const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
    const status = request.nextUrl.searchParams.get('status') || 'all';

    try {
        type AccountRow = {
            id: string;
            accountType: 'user' | 'agent' | 'originator';
            fullName: string;
            email: string;
            status: string;
            createdAt: string | null;
            meta?: string;
            plan?: string;
            planStatus?: string;
            trialEndsAt?: string | null;
            planActivatedAt?: string | null;
            consumerRole?: 'buyer' | 'seller' | 'both' | null;
            lastLoginAt?: string | null;
            lastLogoutAt?: string | null;
        };

        const accounts: AccountRow[] = [];

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
                .select('id, full_name, email, status, verification_status, company, created_at, plan, plan_status, trial_ends_at, plan_activated_at')
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
                    plan: row.plan ? String(row.plan) : 'free',
                    planStatus: row.plan_status ? String(row.plan_status) : 'trialing',
                    trialEndsAt: row.trial_ends_at ? String(row.trial_ends_at) : null,
                    planActivatedAt: row.plan_activated_at ? String(row.plan_activated_at) : null,
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
            for (const row of filterDemoOriginators(data || [])) {
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

        // Enrich with auth timestamps + buyer/seller intent
        if (accounts.length > 0) {
            const emails = [...new Set(accounts.map((a) => a.email.toLowerCase()).filter(Boolean))];
            const profileIds = [...new Set(accounts.map((a) => a.id).filter(Boolean))];

            const authByKey = new Map<
                string,
                {
                    onboarding_intent: string | null;
                    last_login_at: string | null;
                    last_logout_at: string | null;
                    created_at: string | null;
                    account_id: string;
                }
            >();

            const ingestAuthRows = (
                rows: Array<Record<string, unknown>> | null
            ) => {
                for (const row of rows || []) {
                    const payload = {
                        onboarding_intent: row.onboarding_intent
                            ? String(row.onboarding_intent)
                            : null,
                        last_login_at: row.last_login_at ? String(row.last_login_at) : null,
                        last_logout_at: row.last_logout_at ? String(row.last_logout_at) : null,
                        created_at: row.created_at ? String(row.created_at) : null,
                        account_id: String(row.id),
                    };
                    const typeKey = String(row.account_type || '');
                    authByKey.set(`${typeKey}:${String(row.profile_id || '')}`, payload);
                    authByKey.set(`${typeKey}:${String(row.email || '').toLowerCase()}`, payload);
                }
            };

            const AUTH_SELECT_FULL =
                'id, profile_id, email, account_type, onboarding_intent, last_login_at, last_logout_at, created_at';
            const AUTH_SELECT_BASIC =
                'id, profile_id, email, account_type, onboarding_intent, created_at';

            async function fetchAuthBy(
                column: 'email' | 'profile_id',
                values: string[]
            ): Promise<Array<Record<string, unknown>>> {
                if (values.length === 0) return [];
                const full = await supabase
                    .from('auth_accounts')
                    .select(AUTH_SELECT_FULL)
                    .in(column, values)
                    .in('account_type', ['user', 'agent', 'originator'])
                    .limit(500);
                if (!full.error) {
                    return (full.data || []) as Array<Record<string, unknown>>;
                }

                const basic = await supabase
                    .from('auth_accounts')
                    .select(AUTH_SELECT_BASIC)
                    .in(column, values)
                    .in('account_type', ['user', 'agent', 'originator'])
                    .limit(500);
                return (basic.data || []) as Array<Record<string, unknown>>;
            }

            ingestAuthRows(await fetchAuthBy('email', emails));
            ingestAuthRows(await fetchAuthBy('profile_id', profileIds));

            // Fallback last login/logout from sessions when account columns are still null
            const accountIds = [...new Set([...authByKey.values()].map((v) => v.account_id))];
            const sessionAgg = new Map<string, { lastLogin: string | null; lastLogout: string | null }>();
            if (accountIds.length > 0) {
                const { data: sessions } = await supabase
                    .from('auth_sessions')
                    .select('account_id, created_at, revoked_at')
                    .in('account_id', accountIds)
                    .order('created_at', { ascending: false })
                    .limit(2000);

                for (const s of sessions || []) {
                    const id = String(s.account_id);
                    const cur = sessionAgg.get(id) || { lastLogin: null, lastLogout: null };
                    const created = s.created_at ? String(s.created_at) : null;
                    const revoked = s.revoked_at ? String(s.revoked_at) : null;
                    if (created && (!cur.lastLogin || created > cur.lastLogin)) {
                        cur.lastLogin = created;
                    }
                    if (revoked && (!cur.lastLogout || revoked > cur.lastLogout)) {
                        cur.lastLogout = revoked;
                    }
                    sessionAgg.set(id, cur);
                }
            }

            // Lead-based buyer/seller fallback for consumer users
            const userEmails = accounts
                .filter((a) => a.accountType === 'user')
                .map((a) => a.email.toLowerCase())
                .filter(Boolean);
            const leadRoles = new Map<string, { buyer: boolean; seller: boolean }>();
            if (userEmails.length > 0) {
                const { data: leads } = await supabase
                    .from('leads')
                    .select('email, lead_type')
                    .in('email', userEmails)
                    .limit(500);
                for (const lead of leads || []) {
                    const email = String(lead.email || '').toLowerCase();
                    if (!email) continue;
                    const cur = leadRoles.get(email) || { buyer: false, seller: false };
                    const lt = String(lead.lead_type || 'buyer');
                    if (lt === 'buyer') cur.buyer = true;
                    if (lt === 'seller' || lt === 'investor') cur.seller = true;
                    leadRoles.set(email, cur);
                }
            }

            for (const account of accounts) {
                const authMeta =
                    authByKey.get(`${account.accountType}:${account.id}`) ||
                    authByKey.get(`${account.accountType}:${account.email.toLowerCase()}`);
                if (authMeta) {
                    const sessions = sessionAgg.get(authMeta.account_id);
                    account.lastLoginAt = authMeta.last_login_at || sessions?.lastLogin || null;
                    account.lastLogoutAt = authMeta.last_logout_at || sessions?.lastLogout || null;
                    if (!account.createdAt && authMeta.created_at) {
                        account.createdAt = authMeta.created_at;
                    }
                }

                if (account.accountType === 'user') {
                    const intent = authMeta?.onboarding_intent;
                    const leads = leadRoles.get(account.email.toLowerCase());
                    const isBuyer = intent === 'buyer' || Boolean(leads?.buyer);
                    const isSeller = intent === 'seller' || Boolean(leads?.seller);
                    if (isBuyer && isSeller) account.consumerRole = 'both';
                    else if (isBuyer) account.consumerRole = 'buyer';
                    else if (isSeller) account.consumerRole = 'seller';
                    else account.consumerRole = null;
                }
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

/**
 * POST handles:
 * - mutate via action: approve | reject | delete (preferred on Netlify)
 * - create account when no action is set
 */
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
        const action = String(body.action || '')
            .trim()
            .toLowerCase();

        if (action === 'approve' || action === 'reject' || action === 'pending') {
            const accountType = parsePortalAccountType(body.accountType);
            const id = String(body.id || '').trim();
            if (!id || !accountType) {
                return NextResponse.json(
                    { error: 'id and accountType (agent|originator) required' },
                    { status: 400 }
                );
            }
            const status =
                action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';
            const result = await adminSetAccountStatus(supabase, {
                id,
                accountType,
                status,
                adminEmail: auth.email,
            });
            if (!result.ok) {
                return NextResponse.json({ error: result.error }, { status: result.status });
            }
            return NextResponse.json({
                success: true,
                staffNumber: 'staffNumber' in result ? result.staffNumber : null,
            });
        }

        if (action === 'activate-plan' || action === 'deactivate-plan') {
            const accountType = parsePortalAccountType(body.accountType);
            const id = String(body.id || '').trim();
            if (!id || accountType !== 'agent') {
                return NextResponse.json(
                    { error: 'id and accountType=agent required' },
                    { status: 400 }
                );
            }

            const updates =
                action === 'activate-plan'
                    ? {
                          plan_status: 'active',
                          plan_activated_at: new Date().toISOString(),
                          plan_activated_by: auth.email,
                          updated_at: new Date().toISOString(),
                      }
                    : {
                          plan_status: 'payment_pending',
                          updated_at: new Date().toISOString(),
                      };

            const { error } = await supabase.from('agents').update(updates).eq('id', id);
            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            const accountType = parsePortalAccountType(body.accountType);
            const id = String(body.id || '').trim();
            if (!id || !accountType) {
                return NextResponse.json(
                    { error: 'id and accountType (user|agent|originator) required' },
                    { status: 400 }
                );
            }
            const result = await adminDeleteAccount(supabase, { id, accountType });
            if (!result.ok) {
                return NextResponse.json({ error: result.error }, { status: result.status });
            }
            return NextResponse.json({ success: true });
        }

        // ── Create account ──
        const accountType = parsePortalAccountType(body.accountType);
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

        const existingHits = await findExistingAccountsByEmail(email);
        if (existingHits.length > 0) {
            const conflict = duplicateEmailConflictResponse(existingHits);
            return NextResponse.json(conflict, { status: 409 });
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
        const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        let staffNumber: string | null = null;

        const row: Record<string, unknown> =
            accountType === 'agent'
                ? {
                      id,
                      full_name: fullName,
                      email,
                      phone: phone || '0000000000',
                      company: company || 'PropReady',
                      eaab_number: 'PENDING',
                      password: '',
                      status: approve ? 'approved' : 'pending',
                      verification_status: approve ? 'verified' : 'pending',
                      verification_date: approve ? now : null,
                      verified_by: approve ? auth.email : null,
                      plan: 'free',
                      seller_plan: 'none',
                      plan_status: approve ? 'active' : 'trialing',
                      trial_started_at: now,
                      trial_ends_at: trialEndsAt,
                      plan_activated_at: approve ? now : null,
                      plan_activated_by: approve ? auth.email : null,
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

/** Prefer POST with action — kept for compatibility */
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
        const accountType = parsePortalAccountType(body.accountType);
        const id = String(body.id || '').trim();
        const status = String(body.status || '')
            .trim()
            .toLowerCase();
        if (!id || !accountType) {
            return NextResponse.json({ error: 'id and accountType required' }, { status: 400 });
        }
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        const result = await adminSetAccountStatus(supabase, {
            id,
            accountType,
            status: status as 'approved' | 'rejected' | 'pending',
            adminEmail: auth.email,
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('admin accounts PATCH:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

/** Prefer POST action=delete — also accepts query params */
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
        let id = request.nextUrl.searchParams.get('id') || '';
        let accountType = parsePortalAccountType(request.nextUrl.searchParams.get('accountType'));
        try {
            const body = await request.json();
            if (body?.id) id = String(body.id);
            if (body?.accountType) accountType = parsePortalAccountType(body.accountType);
        } catch {
            /* body optional when using query params */
        }
        id = id.trim();
        if (!id || !accountType) {
            return NextResponse.json(
                { error: 'id and accountType (user|agent|originator) required' },
                { status: 400 }
            );
        }
        const result = await adminDeleteAccount(supabase, { id, accountType });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('admin accounts DELETE:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
