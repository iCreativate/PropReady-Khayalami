import { NextRequest, NextResponse } from 'next/server';
import {
    assertAdminRequest,
    setImpersonatorCookie,
    clearImpersonatorCookie,
    getImpersonatorFromRequest,
} from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase-admin';
import {
    createSession,
    ensureAuthAccountForProfile,
    findAccountByEmail,
} from '@/lib/auth-enterprise';
import { setAuthCookies, clearAuthCookies } from '@/lib/auth-enterprise/cookies';
import { dashboardPathForAccountType, profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';
import { parsePortalAccountType } from '@/lib/admin-accounts';
import { getRequestMeta } from '@/lib/auth-enterprise/request-meta';

/** Open a portal session as another account (staff support access). */
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
        const accountType = parsePortalAccountType(body.accountType);
        const id = String(body.id || '').trim();
        const notes = String(body.notes || '').trim() || null;

        if (!id || !accountType) {
            return NextResponse.json(
                { error: 'id and accountType (user|agent|originator) required' },
                { status: 400 }
            );
        }

        const table = profileTableForAccountType(accountType);
        const { data: profile, error } = await supabase
            .from(table)
            .select('id, email, full_name')
            .eq('id', id)
            .maybeSingle();

        if (error || !profile?.email) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        const email = String(profile.email).toLowerCase().trim();
        let account = await findAccountByEmail(email, accountType);
        if (!account) {
            account = await ensureAuthAccountForProfile(email, accountType, String(profile.id));
        }
        if (!account) {
            return NextResponse.json({ error: 'Could not prepare login for this account' }, { status: 500 });
        }

        const meta = getRequestMeta(request);
        const login = await createSession(account, {
            ...meta,
            passwordOk: true,
            forceProfileComplete: true,
            impersonatedBy: auth.email,
            trustedDevice: false,
        });

        await supabase.from('admin_impersonation_log').insert({
            admin_email: auth.email,
            target_account_type: accountType,
            target_profile_id: String(profile.id),
            target_email: email,
            target_name: profile.full_name ? String(profile.full_name) : null,
            notes,
        });

        const redirectTo = dashboardPathForAccountType(accountType);
        const response = NextResponse.json({
            success: true,
            redirectTo,
            target: {
                id: String(profile.id),
                email,
                fullName: profile.full_name,
                accountType,
            },
        });

        setAuthCookies(response, login.accessToken, login.refreshToken, false);
        setImpersonatorCookie(response, auth.email);
        return response;
    } catch (err) {
        console.error('admin impersonate:', err);
        return NextResponse.json(
            {
                error:
                    err instanceof Error && /impersonation_log|does not exist/i.test(err.message)
                        ? 'Run supabase/migrations/20260728_admin_announcements_impersonation.sql in Supabase.'
                        : err instanceof Error
                          ? err.message
                          : 'Server error',
            },
            { status: 500 }
        );
    }
}

/** Exit staff access and return to admin console. */
export async function DELETE(request: NextRequest) {
    const impersonator = getImpersonatorFromRequest(request);
    if (!impersonator) {
        // Still clear portal cookies so staff aren't stuck
        const response = NextResponse.json({ success: true, redirectTo: '/admin/accounts' });
        clearAuthCookies(response);
        clearImpersonatorCookie(response);
        return response;
    }

    try {
        // Best-effort: mark latest open log as ended
        const supabase = createServiceClient();
        if (supabase) {
            const { data: latest } = await supabase
                .from('admin_impersonation_log')
                .select('id')
                .eq('admin_email', impersonator)
                .is('ended_at', null)
                .order('started_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (latest?.id) {
                await supabase
                    .from('admin_impersonation_log')
                    .update({ ended_at: new Date().toISOString() })
                    .eq('id', latest.id);
            }
        }
    } catch {
        /* ignore */
    }

    const response = NextResponse.json({ success: true, redirectTo: '/admin/accounts' });
    clearAuthCookies(response);
    clearImpersonatorCookie(response);
    return response;
}
