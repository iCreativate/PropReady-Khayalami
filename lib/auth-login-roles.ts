import type { AccountType } from '@/lib/auth-enterprise/config';
import { loginPathForAccountType } from '@/lib/auth-enterprise/account-profile';

/** UI roles for conditional login — buyers/sellers share consumer `user` accounts. */
export type LoginRole = 'buyer' | 'seller' | 'agent' | 'originator' | 'conveyancer';

export type LoginRoleOption = {
    id: LoginRole;
    label: string;
    description: string;
    /** Account type sent to auth APIs / OAuth */
    accountType: AccountType;
    /** External portal login when not the consumer form */
    href?: string;
};

export const LOGIN_ROLE_OPTIONS: LoginRoleOption[] = [
    {
        id: 'buyer',
        label: 'Buyer',
        description: 'Home loans, prequal and learning',
        accountType: 'user',
    },
    {
        id: 'seller',
        label: 'Seller',
        description: 'Listings, valuation and agents',
        accountType: 'user',
    },
    {
        id: 'agent',
        label: 'Agent',
        description: 'PPRA-verified agent portal',
        accountType: 'agent',
        href: loginPathForAccountType('agent'),
    },
    {
        id: 'originator',
        label: 'Bond originator',
        description: 'Staff prequal case portal',
        accountType: 'originator',
        href: loginPathForAccountType('originator'),
    },
    {
        id: 'conveyancer',
        label: 'Conveyancer',
        description: 'Matters, inbox and Deeds tracking',
        accountType: 'conveyancer',
        href: loginPathForAccountType('conveyancer'),
    },
];

export type LoginAudience = 'consumer' | 'professionals';

export const CONSUMER_LOGIN_ROLES = LOGIN_ROLE_OPTIONS.filter(
    (r): r is LoginRoleOption & { id: 'buyer' | 'seller' } =>
        r.id === 'buyer' || r.id === 'seller'
);

export const PROFESSIONAL_LOGIN_ROLES = LOGIN_ROLE_OPTIONS.filter(
    (r): r is LoginRoleOption & { id: 'agent' | 'originator' | 'conveyancer' } =>
        r.id === 'agent' || r.id === 'originator' || r.id === 'conveyancer'
);

export const PROFESSIONALS_LOGIN_HREF = '/auth/login?audience=professionals';

export function parseLoginAudience(value: unknown): LoginAudience {
    return value === 'professionals' ? 'professionals' : 'consumer';
}

export const LOGIN_ROLE_STORAGE_KEY = 'propReady_loginRole';

export function parseLoginRole(value: unknown): LoginRole | null {
    if (
        value === 'buyer' ||
        value === 'seller' ||
        value === 'agent' ||
        value === 'originator' ||
        value === 'conveyancer'
    ) {
        return value;
    }
    return null;
}

export function getLoginRoleOption(role: LoginRole): LoginRoleOption {
    return LOGIN_ROLE_OPTIONS.find((r) => r.id === role) ?? LOGIN_ROLE_OPTIONS[0];
}

export function persistLoginRole(role: LoginRole) {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(LOGIN_ROLE_STORAGE_KEY, role);
    } catch {
        /* ignore */
    }
}

export function readPersistedLoginRole(): LoginRole | null {
    if (typeof window === 'undefined') return null;
    try {
        return parseLoginRole(sessionStorage.getItem(LOGIN_ROLE_STORAGE_KEY));
    } catch {
        return null;
    }
}
