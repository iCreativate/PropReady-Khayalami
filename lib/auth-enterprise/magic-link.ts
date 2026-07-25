import { createServiceClient } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { AUTH_CONFIG, getAppUrl } from './config';
import type { AccountType } from './config';
import { profileTableForAccountType } from './account-profile';
import { generateSecureToken, hashToken } from './password';
import { createSession, findAccountByEmail, upsertAccountFromProfile } from './sessions';
import type { LoginResult } from './types';
import {
    isProfessionalAccountApproved,
    isProfessionalAccountType,
} from '@/lib/professional-approval';
import { validateProfessionalWorkEmail } from '@/lib/professional-email';

function db() {
    const client = createServiceClient();
    if (!client) throw new Error('Database not configured');
    return client;
}

async function ensureProfileAndAccount(email: string, accountType: AccountType) {
    const normalized = email.toLowerCase().trim();
    let account = await findAccountByEmail(normalized, accountType);
    if (account) return account;

    const table = profileTableForAccountType(accountType);
    const existing = await db().from(table).select('id, full_name').eq('email', normalized).maybeSingle();

    let profileId = existing.data?.id as string | undefined;
    if (!profileId) {
        const id = crypto.randomUUID();
        const row =
            accountType === 'agent'
                ? {
                      id,
                      full_name: normalized.split('@')[0],
                      email: normalized,
                      password: '',
                      status: 'pending',
                  }
                : accountType === 'originator'
                  ? {
                        id,
                        full_name: normalized.split('@')[0],
                        email: normalized,
                        password: '',
                        organization_id: 'betterbond',
                        status: 'pending',
                    }
                  : {
                        id,
                        full_name: normalized.split('@')[0],
                        email: normalized,
                        password: '',
                    };
        const { data, error } = await db()
            .from(table)
            .insert(row as Record<string, unknown>)
            .select('id')
            .single();
        if (error || !data) {
            console.error('magic-link: profile create failed', error);
            throw new Error('Could not create account for magic link');
        }
        profileId = data.id as string;
    }

    account = await upsertAccountFromProfile(normalized, accountType, profileId);
    return account;
}

export async function createMagicLink(
    email: string,
    accountType: AccountType,
    options?: { appUrl?: string }
): Promise<{ sent: boolean; link?: string }> {
    const normalized = email.toLowerCase().trim();
    if (isProfessionalAccountType(accountType)) {
        const emailError = validateProfessionalWorkEmail(normalized);
        if (emailError) {
            throw new Error(emailError);
        }
    }
    await ensureProfileAndAccount(normalized, accountType);

    const token = generateSecureToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.magicLinkTtlSeconds * 1000).toISOString();

    const { error: insertError } = await db().from('auth_magic_links').insert({
        email: normalized,
        account_type: accountType,
        token_hash: tokenHash,
        expires_at: expiresAt,
    });
    if (insertError) {
        console.error('magic-link: insert failed', insertError);
        throw new Error('Could not create magic link');
    }

    const baseUrl = (options?.appUrl || getAppUrl()).replace(/\/$/, '');
    const link = `${baseUrl}/auth/magic-link?token=${encodeURIComponent(token)}&type=${accountType}`;
    await sendAuthEmail(normalized, 'Sign in to PropReady', magicLinkHtml(link));

    // Never expose the raw link outside local development
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    return isLocal ? { sent: true, link } : { sent: true };
}

export async function verifyMagicLink(
    token: string,
    accountType: AccountType,
    meta: { userAgent?: string; ip?: string; trustedDevice?: boolean }
): Promise<LoginResult | null> {
    const tokenHash = hashToken(token);
    const { data: link } = await db()
        .from('auth_magic_links')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('account_type', accountType)
        .is('used_at', null)
        .maybeSingle();

    if (!link || new Date(link.expires_at) < new Date()) return null;

    await db()
        .from('auth_magic_links')
        .update({ used_at: new Date().toISOString() })
        .eq('id', link.id);

    const account = await findAccountByEmail(link.email, accountType);
    if (!account) return null;

    if (isProfessionalAccountType(accountType)) {
        const table = profileTableForAccountType(accountType);
        const { data: row } = await db()
            .from(table)
            .select('status')
            .eq('id', account.profile_id)
            .maybeSingle();
        if (!isProfessionalAccountApproved(row?.status as string | undefined)) {
            return null;
        }
    }

    if (!account.email_verified_at) {
        await db()
            .from('auth_accounts')
            .update({ email_verified_at: new Date().toISOString() })
            .eq('id', account.id);
    }

    return createSession(
        { ...account, email_verified_at: account.email_verified_at ?? new Date().toISOString() },
        { ...meta, passwordOk: false }
    );
}

export async function createPasswordReset(
    email: string,
    accountType: AccountType,
    options?: { appUrl?: string }
) {
    const normalized = email.toLowerCase().trim();
    const account = await findAccountByEmail(normalized, accountType);
    if (!account) return { sent: true };

    const token = generateSecureToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.passwordResetTtlSeconds * 1000).toISOString();

    await db().from('auth_password_resets').insert({
        account_id: account.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
    });

    const baseUrl = (options?.appUrl || getAppUrl()).replace(/\/$/, '');
    const link = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(token)}&type=${accountType}`;
    await sendAuthEmail(normalized, 'Reset your PropReady password', resetHtml(link));

    return { sent: true };
}

export async function resetPasswordWithToken(
    token: string,
    _accountType: AccountType,
    newPassword: string
) {
    const tokenHash = hashToken(token);
    const { data: reset } = await db()
        .from('auth_password_resets')
        .select('*')
        .eq('token_hash', tokenHash)
        .is('used_at', null)
        .maybeSingle();

    if (!reset || new Date(reset.expires_at) < new Date()) {
        return { success: false, error: 'Invalid or expired reset link' };
    }

    const { updateAccountPassword, revokeAllSessions } = await import('./sessions');

    await updateAccountPassword(reset.account_id, newPassword);

    await db()
        .from('auth_password_resets')
        .update({ used_at: new Date().toISOString() })
        .eq('id', reset.id);

    await revokeAllSessions(reset.account_id);

    return { success: true };
}

async function sendAuthEmail(to: string, subject: string, html: string) {
    const key = process.env.RESEND_API_KEY?.trim();
    const from = process.env.RESEND_FROM_EMAIL?.trim() || 'PropReady <onboarding@resend.dev>';
    if (!key) {
        console.warn('[auth] RESEND_API_KEY missing — email not sent to', to);
        return;
    }
    try {
        const resend = new Resend(key);
        const result = await resend.emails.send({ from, to, subject, html });
        if (result.error) {
            console.error('[auth] Resend error:', result.error);
        }
    } catch (err) {
        console.error('[auth] Resend send failed:', err);
    }
}

function magicLinkHtml(link: string) {
    return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="color:#1a1a1a">Sign in to PropReady</h2>
    <p style="color:#52525b;line-height:1.6">Click the button below to sign in. This link expires in 15 minutes.</p>
    <a href="${link}" style="display:inline-block;background:#C9A227;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;margin:16px 0">Sign in securely</a>
    <p style="color:#a1a1aa;font-size:12px;word-break:break-all;margin-top:16px">${link}</p>
    <p style="color:#a1a1aa;font-size:12px">If you didn't request this, ignore this email.</p>
  </div>`;
}

function resetHtml(link: string) {
    return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="color:#1a1a1a">Reset your password</h2>
    <p style="color:#52525b;line-height:1.6">Click below to set a new password. This link expires in 1 hour.</p>
    <a href="${link}" style="display:inline-block;background:#C9A227;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;margin:16px 0">Reset password</a>
    <p style="color:#a1a1aa;font-size:12px">If you didn't request this, ignore this email.</p>
  </div>`;
}
