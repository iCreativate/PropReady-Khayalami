import type { AccountType } from './config';

export function profileTableForAccountType(
    accountType: AccountType
): 'users' | 'agents' | 'originators' | 'conveyancers' {
    if (accountType === 'agent') return 'agents';
    if (accountType === 'originator') return 'originators';
    if (accountType === 'conveyancer') return 'conveyancers';
    return 'users';
}

export function parseAccountType(value: unknown): AccountType {
    if (value === 'agent' || value === 'originator' || value === 'conveyancer') return value;
    return 'user';
}

export function dashboardPathForAccountType(accountType?: string): string {
    if (accountType === 'agent') return '/agents/dashboard';
    if (accountType === 'originator') return '/originators/dashboard';
    if (accountType === 'conveyancer') return '/conveyancers/portal';
    return '/dashboard';
}

export function loginPathForAccountType(accountType?: string): string {
    if (accountType === 'agent') return '/agents/login';
    if (accountType === 'originator') return '/originators/login';
    if (accountType === 'conveyancer') return '/conveyancers/login';
    return '/auth/login';
}
