import { createServiceClient } from '@/lib/supabase-admin';
import { AUTH_CONFIG } from './config';
import { profileTableForAccountType } from './account-profile';
import { generateSecureToken, hashPassword, hashToken, verifyPassword } from './password';
import { isProfileCompleteFromData, isValidPhone, looksLikePlaceholderName } from './profile-gate';
import { signAccessToken } from './tokens';
import type { AuthAccount, LoginResult, SessionUser } from './types';
import type { AccountType } from './config';

function db() {
    const client = createServiceClient();
    if (!client) throw new Error('Database not configured');
    return client;
}

export async function findAccountByEmail(email: string, accountType: AccountType) {
    const { data, error } = await db()
        .from('auth_accounts')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('account_type', accountType)
        .maybeSingle();
    if (error) {
        // PGRST205 = table missing from schema cache (migration not applied)
        if (error.code === 'PGRST205' || /auth_accounts/i.test(error.message)) {
            throw new Error(
                'Enterprise auth tables are missing. Run supabase/migrations/20260717_enterprise_auth.sql in the Supabase SQL Editor.'
            );
        }
        throw error;
    }
    return data as AuthAccount | null;
}

export async function findAccountById(id: string) {
    const { data } = await db().from('auth_accounts').select('*').eq('id', id).maybeSingle();
    return data as AuthAccount | null;
}

export async function upsertAccountFromProfile(
    email: string,
    accountType: AccountType,
    profileId: string,
    password?: string
) {
    const existing = await findAccountByEmail(email, accountType);
    const password_hash = password ? await hashPassword(password) : existing?.password_hash ?? null;

    const row = {
        email: email.toLowerCase().trim(),
        account_type: accountType,
        profile_id: profileId,
        password_hash,
        email_verified_at: existing?.email_verified_at ?? null,
        updated_at: new Date().toISOString(),
    };

    if (existing) {
        const { data, error } = await db()
            .from('auth_accounts')
            .update(row)
            .eq('id', existing.id)
            .select('*')
            .single();
        if (error) throw error;
        return data as AuthAccount;
    }

    const { data, error } = await db().from('auth_accounts').insert(row).select('*').single();
    if (error) throw error;
    return data as AuthAccount;
}

export async function markEmailVerified(accountId: string) {
    await db()
        .from('auth_accounts')
        .update({ email_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', accountId);
}

export async function migrateLegacyPassword(
    account: AuthAccount,
    plainPassword: string
): Promise<boolean> {
    if (account.password_hash) {
        return verifyPassword(plainPassword, account.password_hash);
    }
    if (plainPassword !== await getLegacyPlainPassword(account)) return false;
    const password_hash = await hashPassword(plainPassword);
    await db()
        .from('auth_accounts')
        .update({
            password_hash,
            password_changed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);
    return true;
}

async function getLegacyPlainPassword(account: AuthAccount): Promise<string | null> {
    const table = profileTableForAccountType(account.account_type);
    const { data } = await db()
        .from(table)
        .select('password')
        .eq('id', account.profile_id)
        .maybeSingle();
    return (data as { password?: string } | null)?.password ?? null;
}

export async function verifyAccountPassword(account: AuthAccount, password: string) {
    if (account.password_hash) {
        return verifyPassword(password, account.password_hash);
    }
    return migrateLegacyPassword(account, password);
}

export async function updateAccountPassword(accountId: string, newPassword: string) {
    const password_hash = await hashPassword(newPassword);
    await db()
        .from('auth_accounts')
        .update({
            password_hash,
            password_changed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);
}

export async function loadSessionUser(account: AuthAccount): Promise<SessionUser> {
    const intent = account.onboarding_intent === 'seller' || account.onboarding_intent === 'buyer'
        ? account.onboarding_intent
        : null;
    const onboardingRequired = Boolean(intent) && !account.onboarding_completed_at;

    const base: SessionUser = {
        accountId: account.id,
        profileId: account.profile_id,
        email: account.email,
        accountType: account.account_type,
        sessionId: '',
        profileComplete: Boolean(account.profile_completed_at),
        hasPassword: Boolean(account.password_hash),
        onboardingIntent: intent,
        onboardingRequired,
    };

    if (account.account_type === 'agent') {
        const { data } = await db()
            .from('agents')
            .select(
                'full_name, email, company, phone, plan, seller_plan, plan_status, trial_started_at, trial_ends_at, plan_activated_at, ppra_number, eaab_number, verification_status, status'
            )
            .eq('id', account.profile_id)
            .maybeSingle();
        if (data) {
            base.fullName = data.full_name;
            base.company = data.company;
            base.phone = data.phone;
            base.plan = data.plan || 'free';
            base.sellerPlan = data.seller_plan || 'none';
            base.planStatus = data.plan_status || 'trialing';
            base.trialStartedAt = data.trial_started_at || null;
            base.trialEndsAt = data.trial_ends_at || null;
            base.planActivatedAt = data.plan_activated_at || null;
            base.ppraNumber = data.ppra_number || data.eaab_number;
            base.verificationStatus =
                data.verification_status || (data.status === 'approved' ? 'verified' : 'pending');
            base.status = data.status;
            base.profileComplete = isProfileCompleteFromData({
                account,
                fullName: data.full_name,
                phone: data.phone,
                company: data.company,
                accountType: 'agent',
            });
        }
    } else if (account.account_type === 'originator') {
        const { data } = await db()
            .from('originators')
            .select('full_name, email, phone, organization_id, status')
            .eq('id', account.profile_id)
            .maybeSingle();
        if (data) {
            base.fullName = data.full_name;
            base.phone = data.phone;
            base.organizationId = data.organization_id;
            base.company = data.organization_id;
            base.status = data.status;
            base.profileComplete = isProfileCompleteFromData({
                account,
                fullName: data.full_name,
                phone: data.phone,
                company: data.organization_id,
                accountType: 'originator',
            });
        }
    } else if (account.account_type === 'conveyancer') {
        const { data } = await db()
            .from('conveyancers')
            .select('full_name, email, phone, firm_name, status, province, city')
            .eq('id', account.profile_id)
            .maybeSingle();
        if (data) {
            base.fullName = data.full_name;
            base.phone = data.phone;
            base.company = data.firm_name;
            base.status = data.status;
            base.profileComplete = isProfileCompleteFromData({
                account,
                fullName: data.full_name,
                phone: data.phone,
                company: data.firm_name,
                accountType: 'conveyancer',
            });
        }
    } else {
        const { data } = await db()
            .from('users')
            .select('full_name, email, phone')
            .eq('id', account.profile_id)
            .maybeSingle();
        if (data) {
            base.fullName = data.full_name;
            base.phone = data.phone;
            base.profileComplete = isProfileCompleteFromData({
                account,
                fullName: data.full_name,
                phone: data.phone,
                accountType: 'user',
            });
        }
    }

    return base;
}

export async function ensureAuthAccountForProfile(
    email: string,
    accountType: AccountType,
    profileId: string
) {
    const existing = await findAccountByEmail(email, accountType);
    if (existing) return existing;

    const account = await upsertAccountFromProfile(email, accountType, profileId);
    return (await findAccountById(account.id)) as AuthAccount;
}

export async function createSession(
    account: AuthAccount,
    meta: {
        userAgent?: string;
        ip?: string;
        deviceFingerprint?: string;
        trustedDevice?: boolean;
        /** Default true (password/OAuth). Magic link passes false until password confirmed. */
        passwordOk?: boolean;
        /** Force profileComplete in JWT (staff access) */
        forceProfileComplete?: boolean;
        /** Staff email when opening account for support */
        impersonatedBy?: string;
    }
): Promise<LoginResult> {
    await enforceSessionLimit(account.id);

    const refreshToken = generateSecureToken(48);
    const refreshHash = hashToken(refreshToken);
    const ttl = meta.trustedDevice
        ? AUTH_CONFIG.trustedRefreshTtlSeconds
        : AUTH_CONFIG.refreshTokenTtlSeconds;
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    const passwordOk = meta.passwordOk !== false;

    const { data: session, error } = await db()
        .from('auth_sessions')
        .insert({
            account_id: account.id,
            refresh_token_hash: refreshHash,
            device_fingerprint: meta.deviceFingerprint ?? null,
            user_agent: meta.userAgent?.slice(0, 512) ?? null,
            ip_address: meta.ip ?? null,
            is_trusted: meta.trustedDevice ?? false,
            password_ok: passwordOk,
            expires_at: expiresAt,
        })
        .select('id')
        .single();

    if (error || !session) throw error ?? new Error('Failed to create session');

    const user = await loadSessionUser(account);
    user.sessionId = session.id;
    user.passwordOk = passwordOk;
    if (meta.forceProfileComplete) {
        user.profileComplete = true;
    }
    if (meta.impersonatedBy) {
        user.impersonatedBy = meta.impersonatedBy;
    }

    const accessToken = await signAccessToken({
        sub: account.id,
        email: account.email,
        accountType: account.account_type,
        profileId: account.profile_id,
        sessionId: session.id,
        profileComplete: meta.forceProfileComplete ? true : Boolean(user.profileComplete),
        passwordOk,
        hasPassword: Boolean(user.hasPassword),
        ...(meta.impersonatedBy ? { impersonatedBy: meta.impersonatedBy } : {}),
    });

    return {
        user,
        accessToken,
        refreshToken,
        expiresIn: AUTH_CONFIG.accessTokenTtlSeconds,
    };
}

async function enforceSessionLimit(accountId: string) {
    const { data: sessions } = await db()
        .from('auth_sessions')
        .select('id, created_at')
        .eq('account_id', accountId)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

    const active = sessions ?? [];
    const excess = active.length - AUTH_CONFIG.maxConcurrentSessions + 1;
    if (excess <= 0) return;

    const toRevoke = active.slice(0, excess).map((s) => s.id);
    await db()
        .from('auth_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .in('id', toRevoke);
}

export async function rotateRefreshToken(
    refreshToken: string,
    meta: { userAgent?: string; ip?: string; trustedDevice?: boolean }
): Promise<LoginResult | null> {
    const refreshHash = hashToken(refreshToken);
    const { data: session } = await db()
        .from('auth_sessions')
        .select('*')
        .eq('refresh_token_hash', refreshHash)
        .is('revoked_at', null)
        .maybeSingle();

    if (!session) return null;

    const account = await findAccountById(session.account_id);
    if (!account) return null;

    if (new Date(session.expires_at) < new Date()) {
        await revokeSession(session.id);
        return null;
    }

    const inactiveMs = Date.now() - new Date(session.last_active_at).getTime();
    if (inactiveMs > AUTH_CONFIG.inactivityTimeoutSeconds * 1000 && !session.is_trusted) {
        await revokeSession(session.id);
        return null;
    }

    await revokeSession(session.id);

    const newRefresh = generateSecureToken(48);
    const newHash = hashToken(newRefresh);
    const ttl =
        meta.trustedDevice || session.is_trusted
            ? AUTH_CONFIG.trustedRefreshTtlSeconds
            : AUTH_CONFIG.refreshTokenTtlSeconds;

    const { data: newSession, error } = await db()
        .from('auth_sessions')
        .insert({
            account_id: account.id,
            refresh_token_hash: newHash,
            device_fingerprint: session.device_fingerprint,
            user_agent: meta.userAgent?.slice(0, 512) ?? session.user_agent,
            ip_address: meta.ip ?? session.ip_address,
            is_trusted: session.is_trusted || meta.trustedDevice || false,
            password_ok: session.password_ok !== false,
            expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
            rotated_from: session.id,
        })
        .select('id')
        .single();

    if (error || !newSession) return null;

    const passwordOk = session.password_ok !== false;
    const user = await loadSessionUser(account);
    user.sessionId = newSession.id;
    user.passwordOk = passwordOk;

    const accessToken = await signAccessToken({
        sub: account.id,
        email: account.email,
        accountType: account.account_type,
        profileId: account.profile_id,
        sessionId: newSession.id,
        profileComplete: Boolean(user.profileComplete),
        passwordOk,
        hasPassword: Boolean(user.hasPassword),
    });

    return {
        user,
        accessToken,
        refreshToken: newRefresh,
        expiresIn: AUTH_CONFIG.accessTokenTtlSeconds,
    };
}

export async function touchSession(sessionId: string) {
    await db()
        .from('auth_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', sessionId)
        .is('revoked_at', null);
}

export async function revokeSession(sessionId: string) {
    await db()
        .from('auth_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', sessionId);
}

export async function revokeAllSessions(accountId: string, exceptSessionId?: string) {
    let q = db()
        .from('auth_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('account_id', accountId)
        .is('revoked_at', null);
    if (exceptSessionId) {
        q = q.neq('id', exceptSessionId);
    }
    await q;
}

export async function revokeSessionByRefreshToken(refreshToken: string) {
    const refreshHash = hashToken(refreshToken);
    await db()
        .from('auth_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('refresh_token_hash', refreshHash);
}

export async function completeVerifiedProfile(
    account: AuthAccount,
    input: {
        fullName: string;
        phone: string;
        company?: string;
        organizationId?: string;
        eaabNumber?: string;
        password?: string;
        intent?: 'buyer' | 'seller';
    }
): Promise<LoginResult & { intent?: 'buyer' | 'seller' }> {
    const fullName = input.fullName.trim();
    const phone = input.phone.trim();
    const company = input.company?.trim();
    const organizationId = input.organizationId?.trim() || company;
    const needsPassword = !account.password_hash;

    if (looksLikePlaceholderName(fullName, account.email)) {
        throw new Error('Please enter your full legal name');
    }
    if (!isValidPhone(phone)) {
        throw new Error('Please enter a valid South African phone number');
    }
    if (account.account_type === 'agent' && !company) {
        throw new Error('Agency / company name is required');
    }
    if (account.account_type === 'originator' && !organizationId) {
        throw new Error('Bond originator organisation is required');
    }
    if (account.account_type === 'conveyancer' && !company) {
        throw new Error('Firm name is required');
    }
    if (needsPassword) {
        if (!input.password) {
            throw new Error('Please create a password for your account');
        }
        const { validatePassword } = await import('@/lib/password');
        const pw = validatePassword(input.password);
        if (!pw.valid) {
            throw new Error(`Password must include: ${pw.errors.join(', ')}`);
        }
    }
    if (needsPassword && account.account_type === 'user' && !input.intent) {
        throw new Error('Please choose whether you are buying or selling');
    }

    const table = profileTableForAccountType(account.account_type);
    const patch: Record<string, unknown> = {
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
    };
    if (account.account_type === 'agent') {
        patch.company = company;
        if (input.eaabNumber?.trim()) patch.eaab_number = input.eaabNumber.trim();
    }
    if (account.account_type === 'originator') {
        patch.organization_id = organizationId;
    }
    if (account.account_type === 'conveyancer') {
        patch.firm_name = company;
    }

    const { error } = await db().from(table).update(patch).eq('id', account.profile_id);
    if (error) throw error;

    if (needsPassword && input.password) {
        await updateAccountPassword(account.id, input.password);
    }

    const accountPatch: Record<string, unknown> = {
        profile_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    // Only first-time passwordless users get a forced buyer/seller onboarding gate.
    // Learner-hub / existing password users never set this and are not blocked.
    if (needsPassword && account.account_type === 'user' && input.intent) {
        accountPatch.onboarding_intent = input.intent;
        accountPatch.onboarding_completed_at = null;
    }

    await db().from('auth_accounts').update(accountPatch).eq('id', account.id);

    const refreshed = await findAccountById(account.id);
    if (!refreshed) throw new Error('Account not found');

    const session = await createSession(
        { ...refreshed, profile_completed_at: refreshed.profile_completed_at ?? new Date().toISOString() },
        { trustedDevice: true, passwordOk: true }
    );

    return {
        ...session,
        intent: needsPassword && account.account_type === 'user' ? input.intent : undefined,
    };
}

export async function markOnboardingComplete(accountId: string) {
    await db()
        .from('auth_accounts')
        .update({
            onboarding_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);
}

export async function confirmSessionPassword(
    account: AuthAccount,
    password: string,
    meta: { userAgent?: string; ip?: string; trustedDevice?: boolean }
): Promise<LoginResult> {
    const valid = await verifyAccountPassword(account, password);
    if (!valid) {
        throw new Error('Incorrect password');
    }
    return createSession(account, { ...meta, trustedDevice: true, passwordOk: true });
}
