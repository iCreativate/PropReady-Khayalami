import type { AccountType } from './config';
import type { AuthAccount } from './types';

/** SA-friendly phone: optional +27 / 0, 9–11 digits after stripping spaces. */
export function isValidPhone(phone: string): boolean {
    const digits = phone.replace(/[^\d+]/g, '');
    const normalized = digits.replace(/^\+?27/, '0');
    return /^0\d{9}$/.test(normalized) || /^\+\d{10,15}$/.test(digits);
}

export function looksLikePlaceholderName(fullName: string | undefined, email: string): boolean {
    if (!fullName?.trim()) return true;
    const local = email.split('@')[0]?.toLowerCase() || '';
    const name = fullName.trim().toLowerCase();
    if (name === local) return true;
    if (name.length < 2) return true;
    if (!/\s/.test(name) && name.length < 4) return true;
    return false;
}

export function isProfileCompleteFromData(input: {
    account?: Pick<AuthAccount, 'profile_completed_at' | 'email'> | null;
    fullName?: string | null;
    phone?: string | null;
    accountType: AccountType;
    company?: string | null;
}): boolean {
    if (input.account?.profile_completed_at) return true;

    const email = input.account?.email || '';
    if (looksLikePlaceholderName(input.fullName || undefined, email)) return false;
    if (!input.phone || !isValidPhone(input.phone)) return false;
    if (input.accountType === 'agent' && !input.company?.trim()) return false;
    return true;
}
