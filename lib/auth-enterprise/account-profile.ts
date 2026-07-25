import type { AccountType } from './config';

export function profileTableForAccountType(accountType: AccountType): 'users' | 'agents' | 'originators' {
    if (accountType === 'agent') return 'agents';
    if (accountType === 'originator') return 'originators';
    return 'users';
}

export function parseAccountType(value: unknown): AccountType {
    if (value === 'agent' || value === 'originator') return value;
    return 'user';
}

export function dashboardPathForAccountType(accountType?: string): string {
    if (accountType === 'agent') return '/agents/dashboard';
    if (accountType === 'originator') return '/originators/dashboard';
    return '/dashboard';
}

export function loginPathForAccountType(accountType?: string): string {
    if (accountType === 'agent') return '/agents/login';
    if (accountType === 'originator') return '/originators/login';
    return '/auth/login';
}
