import { createServiceClient } from '@/lib/supabase-admin';
import { profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';

export type AccountType = 'user' | 'agent' | 'originator' | 'admin';

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Dev-only in-memory fallback when Supabase service role is not configured */
const memoryStore = new Map<string, { code: string; expiresAt: number; accountType: AccountType }>();

function storeKey(email: string, accountType: AccountType) {
    return `${accountType}:${email.toLowerCase().trim()}`;
}

export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function saveVerificationCode(
    email: string,
    accountType: AccountType,
    code: string
): Promise<{ ok: boolean; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
    const key = storeKey(normalizedEmail, accountType);

    const supabase = createServiceClient();
    if (supabase) {
        const { error } = await supabase.from('email_verification_codes').upsert(
            {
                email: normalizedEmail,
                account_type: accountType,
                code,
                expires_at: expiresAt,
            },
            { onConflict: 'email,account_type' }
        );
        if (!error) return { ok: true };
        console.error('Supabase verification store failed:', error);
        return {
            ok: false,
            error:
                error.message ||
                'Could not save verification code. Check email_verification_codes table and SUPABASE_SERVICE_ROLE_KEY.',
        };
    }

    if (process.env.NODE_ENV === 'development') {
        memoryStore.set(key, {
            code,
            expiresAt: Date.now() + OTP_TTL_MS,
            accountType,
        });
        return { ok: true };
    }

    return {
        ok: false,
        error: 'Database not configured. Set SUPABASE_SERVICE_ROLE_KEY on Netlify.',
    };
}

export async function verifyCode(
    email: string,
    accountType: AccountType,
    code: string
): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const key = storeKey(normalizedEmail, accountType);

    const supabase = createServiceClient();
    if (supabase) {
        const { data, error } = await supabase
            .from('email_verification_codes')
            .select('code, expires_at')
            .eq('email', normalizedEmail)
            .eq('account_type', accountType)
            .maybeSingle();

        if (!error && data) {
            if (new Date(data.expires_at).getTime() < Date.now()) return false;
            if (data.code !== code.trim()) return false;
            await supabase
                .from('email_verification_codes')
                .delete()
                .eq('email', normalizedEmail)
                .eq('account_type', accountType);
            return true;
        }
        if (error) {
            console.error('Supabase verifyCode error:', error);
        }
    }

    const entry = memoryStore.get(key);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
        memoryStore.delete(key);
        return false;
    }
    if (entry.code !== code.trim()) return false;
    memoryStore.delete(key);
    return true;
}

export async function markEmailVerified(email: string, accountType: AccountType): Promise<void> {
    // Staff OTPs are not tied to a profile row
    if (accountType === 'admin') return;

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createServiceClient();
    if (!supabase) return;

    const table = profileTableForAccountType(accountType);
    await supabase
        .from(table)
        .update({ email_verified: true, updated_at: new Date().toISOString() })
        .eq('email', normalizedEmail);
}

export async function isEmailVerified(
    email: string,
    accountType: AccountType
): Promise<boolean | null> {
    if (accountType === 'admin') return null;

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createServiceClient();
    if (!supabase) return null;

    const table = profileTableForAccountType(accountType);
    const { data, error } = await supabase
        .from(table)
        .select('email_verified')
        .eq('email', normalizedEmail)
        .maybeSingle();

    if (error || !data) return null;
    return data.email_verified === true;
}
