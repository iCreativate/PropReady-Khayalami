import { createServiceClient } from '@/lib/supabase-admin';
import type { AccountType } from '@/lib/auth-enterprise/config';
import {
    dashboardPathForAccountType,
    loginPathForAccountType,
} from '@/lib/auth-enterprise/account-profile';
import { findAccountByEmail } from '@/lib/auth-enterprise/sessions';

export type ExistingEmailHit = {
    accountType: AccountType;
    profileId: string;
    source: 'auth_accounts' | 'users' | 'agents' | 'originators';
};

const TYPE_LABEL: Record<AccountType, string> = {
    user: 'buyer/seller',
    agent: 'agent',
    originator: 'bond originator',
};

/** Find any existing account using this email across all portal types. */
export async function findExistingAccountsByEmail(email: string): Promise<ExistingEmailHit[]> {
    const normalized = email.toLowerCase().trim();
    if (!normalized) return [];

    const hits: ExistingEmailHit[] = [];
    const seen = new Set<string>();

    const add = (hit: ExistingEmailHit) => {
        const key = `${hit.accountType}:${hit.profileId}`;
        if (seen.has(key)) return;
        seen.add(key);
        hits.push(hit);
    };

    for (const accountType of ['user', 'agent', 'originator'] as AccountType[]) {
        try {
            const account = await findAccountByEmail(normalized, accountType);
            if (account) {
                add({
                    accountType,
                    profileId: String(account.profile_id),
                    source: 'auth_accounts',
                });
            }
        } catch {
            /* auth_accounts may be missing on older installs */
        }
    }

    const supabase = createServiceClient();
    if (supabase) {
        const tables: Array<{ table: 'users' | 'agents' | 'originators'; accountType: AccountType }> = [
            { table: 'users', accountType: 'user' },
            { table: 'agents', accountType: 'agent' },
            { table: 'originators', accountType: 'originator' },
        ];
        for (const { table, accountType } of tables) {
            const { data } = await supabase
                .from(table)
                .select('id')
                .ilike('email', normalized)
                .maybeSingle();
            if (data?.id) {
                add({
                    accountType,
                    profileId: String(data.id),
                    source: table,
                });
            }
        }
    }

    return hits;
}

export function duplicateEmailConflictResponse(hits: ExistingEmailHit[]) {
    const primary = hits[0];
    const accountType = primary?.accountType || 'user';
    const label = TYPE_LABEL[accountType];
    const loginPath = loginPathForAccountType(accountType);
    const resetPath = `/auth/forgot-password?type=${accountType}`;

    return {
        success: false as const,
        code: 'EMAIL_EXISTS' as const,
        error: `An account with this email already exists (${label}). Please log in or reset your password.`,
        existingAccountType: accountType,
        loginPath,
        resetPasswordPath: resetPath,
        dashboardPath: dashboardPathForAccountType(accountType),
        message:
            'This email is already registered. Log in with your existing account, or reset your password if you forgot it.',
    };
}
