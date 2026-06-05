import { createClient } from '@supabase/supabase-js';

export type AccountType = 'user' | 'agent';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Dev-only in-memory fallback when Supabase is not configured */
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
): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
    const key = storeKey(normalizedEmail, accountType);

    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from('email_verification_codes').upsert(
            {
                email: normalizedEmail,
                account_type: accountType,
                code,
                expires_at: expiresAt,
            },
            { onConflict: 'email,account_type' }
        );
        if (!error) return;
        console.warn('Supabase verification store failed, using memory fallback:', error.message);
    }

    memoryStore.set(key, {
        code,
        expiresAt: Date.now() + OTP_TTL_MS,
        accountType,
    });
}

export async function verifyCode(
    email: string,
    accountType: AccountType,
    code: string
): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const key = storeKey(normalizedEmail, accountType);

    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
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
    const normalizedEmail = email.toLowerCase().trim();

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const table = accountType === 'agent' ? 'agents' : 'users';

    await supabase
        .from(table)
        .update({ email_verified: true, updated_at: new Date().toISOString() })
        .eq('email', normalizedEmail);
}

export async function isEmailVerified(
    email: string,
    accountType: AccountType
): Promise<boolean | null> {
    const normalizedEmail = email.toLowerCase().trim();

    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const table = accountType === 'agent' ? 'agents' : 'users';

    const { data, error } = await supabase
        .from(table)
        .select('email_verified')
        .eq('email', normalizedEmail)
        .maybeSingle();

    if (error || !data) return null;
    return data.email_verified === true;
}
