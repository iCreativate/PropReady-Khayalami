import { createServiceClient } from '@/lib/supabase-admin';
import { AUTH_CONFIG, getAppUrl, type OAuthProvider } from './config';
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

    if (provider === 'microsoft') {
        const clientId = process.env.MICROSOFT_CLIENT_ID;
        if (!clientId) return null;
        const tenant = process.env.MICROSOFT_TENANT_ID || 'common';
        params.set('client_id', clientId);
        return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;
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
    if (provider === 'microsoft') return 'openid email profile User.Read';
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
    const table = accountType === 'agent' ? 'agents' : 'users';
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

    if (provider === 'microsoft') {
        const clientId = process.env.MICROSOFT_CLIENT_ID;
        const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
        const tenant = process.env.MICROSOFT_TENANT_ID || 'common';
        if (!clientId || !clientSecret) return null;

        const tokenRes = await fetch(
            `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }),
            }
        );
        const tokens = await tokenRes.json();
        if (!tokens.access_token) return null;

        const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const user = await userRes.json();
        return {
            email: (user.mail || user.userPrincipalName) as string,
            name: user.displayName as string,
            providerId: user.id as string,
        };
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
