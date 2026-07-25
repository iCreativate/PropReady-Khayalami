import { createServiceClient } from '@/lib/supabase-admin';
import { AUTH_CONFIG, getAppUrl, type OAuthProvider } from './config';
import { profileTableForAccountType } from './account-profile';
import { generateSecureToken, hashToken } from './password';
import {
    createSession,
    ensureAuthAccountForProfile,
    findAccountByEmail,
    markEmailVerified,
    upsertAccountFromProfile,
} from './sessions';
import type { LoginResult } from './types';
import type { AccountType } from './config';
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

export function getOAuthAuthorizationUrl(
    provider: OAuthProvider,
    accountType: AccountType,
    state: string
): string | null {
    const redirectUri = `${getAppUrl()}/api/auth/oauth/${provider}/callback`;
    const params = new URLSearchParams({
        response_type: 'code',
        redirect_uri: redirectUri,
        state: `${state}:${accountType}`,
        scope: providerScopes(provider),
    });

    if (provider === 'google') {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) return null;
        params.set('client_id', clientId);
        params.set('access_type', 'offline');
        params.set('prompt', 'consent');
        return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    }

    if (provider === 'apple') {
        const clientId = process.env.APPLE_CLIENT_ID;
        if (!clientId) return null;
        params.set('client_id', clientId);
        params.set('response_mode', 'form_post');
        return `https://appleid.apple.com/auth/authorize?${params}`;
    }

    return null;
}

function providerScopes(provider: OAuthProvider): string {
    if (provider === 'google') return 'openid email profile';
    return 'name email';
}

export async function handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
    accountType: AccountType,
    meta: { userAgent?: string; ip?: string; trustedDevice?: boolean }
): Promise<LoginResult | null> {
    try {
        const profile = await exchangeCodeForProfile(provider, code);
        if (!profile?.email) {
            console.error('oauth: token exchange failed or missing email', { provider });
            return null;
        }

        if (isProfessionalAccountType(accountType)) {
            const emailError = validateProfessionalWorkEmail(profile.email);
            if (emailError) {
                console.error('oauth: free email blocked for professional account', {
                    accountType,
                    email: profile.email,
                });
                return null;
            }
        }

        let account = await findAccountByEmail(profile.email, accountType);

        if (!account) {
            const profileId = await createProfileForOAuth(profile.email, profile.name, accountType);
            if (!profileId) {
                console.error('oauth: could not create/find profile', { email: profile.email, accountType });
                return null;
            }
            account = await upsertAccountFromProfile(profile.email, accountType, profileId);
            await markEmailVerified(account.id);
            account.email_verified_at = new Date().toISOString();
        } else if (!account.email_verified_at) {
            await markEmailVerified(account.id);
            account.email_verified_at = new Date().toISOString();
        }

        const { error: oauthLinkError } = await db().from('auth_oauth_providers').upsert(
            {
                account_id: account.id,
                provider,
                provider_account_id: profile.providerId,
                provider_email: profile.email,
            },
            { onConflict: 'provider,provider_account_id' }
        );
        if (oauthLinkError) {
            console.error('oauth: link provider failed', oauthLinkError);
            // Continue — session can still be created even if link upsert fails transiently
        }

        if (isProfessionalAccountType(accountType)) {
            const table = profileTableForAccountType(accountType);
            const { data: row } = await db()
                .from(table)
                .select('status')
                .eq('id', account.profile_id)
                .maybeSingle();
            if (!isProfessionalAccountApproved(row?.status as string | undefined)) {
                console.error('oauth: professional account not approved', {
                    accountType,
                    status: row?.status,
                });
                return null;
            }
        }

        return createSession(account, meta);
    } catch (err) {
        console.error('oauth: handleOAuthCallback failed', err);
        return null;
    }
}

async function createProfileForOAuth(
    email: string,
    name: string | undefined,
    accountType: AccountType
): Promise<string | null> {
    const table = profileTableForAccountType(accountType);
    const normalized = email.toLowerCase().trim();

    const existing = await db().from(table).select('id').eq('email', normalized).maybeSingle();
    if (existing.data?.id) {
        return existing.data.id as string;
    }

    const id = crypto.randomUUID();
    const row =
        accountType === 'agent'
            ? {
                  id,
                  full_name: name || normalized.split('@')[0],
                  email: normalized,
                  password: '',
                  status: 'pending',
              }
            : accountType === 'originator'
              ? {
                    id,
                    full_name: name || normalized.split('@')[0],
                    email: normalized,
                    password: '',
                    organization_id: 'betterbond',
                    status: 'pending',
                }
              : {
                    id,
                    full_name: name || normalized.split('@')[0],
                    email: normalized,
                    password: '',
                };

    const { data, error } = await db().from(table).insert(row as Record<string, unknown>).select('id').single();
    if (error || !data) {
        console.error('oauth: profile insert failed', error);
        return null;
    }
    return data.id as string;
}

async function exchangeCodeForProfile(provider: OAuthProvider, code: string) {
    const redirectUri = `${getAppUrl()}/api/auth/oauth/${provider}/callback`;

    if (provider === 'google') {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) return null;

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });
        const tokens = await tokenRes.json();
        if (!tokens.access_token) {
            console.error('oauth:google token error', tokens);
            return null;
        }

        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const user = await userRes.json();
        if (!user?.email) {
            console.error('oauth:google userinfo error', user);
            return null;
        }
        return { email: user.email as string, name: user.name as string, providerId: String(user.id) };
    }

    if (provider === 'apple') {
        return null;
    }

    return null;
}

export function createOAuthState(): string {
    return generateSecureToken(24);
}

export function hashOAuthState(state: string): string {
    return hashToken(state);
}
