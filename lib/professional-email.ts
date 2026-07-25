/**
 * Agents and bond originators must register with a work/agency domain —
 * free consumer mailboxes are blocked to reduce scammer sign-ups.
 */

const FREE_EMAIL_DOMAINS = new Set([
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'yahoo.co.uk',
    'yahoo.co.za',
    'ymail.com',
    'hotmail.com',
    'hotmail.co.uk',
    'hotmail.co.za',
    'outlook.com',
    'outlook.co.za',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'proton.me',
    'protonmail.com',
    'pm.me',
    'gmx.com',
    'gmx.net',
    'mail.com',
    'zoho.com',
    'yandex.com',
    'yandex.ru',
    'qq.com',
    '163.com',
    '126.com',
    'rediffmail.com',
    'fastmail.com',
    'tutanota.com',
    'tutamail.com',
    'hey.com',
]);

export const PROFESSIONAL_EMAIL_ERROR =
    'Use your agency or company email address. Free addresses such as Gmail, Yahoo, and Outlook.com are not allowed.';

export function emailDomain(email: string): string | null {
    const normalized = email.trim().toLowerCase();
    const at = normalized.lastIndexOf('@');
    if (at < 1 || at === normalized.length - 1) return null;
    return normalized.slice(at + 1);
}

export function isFreeEmailDomain(domain: string): boolean {
    const d = domain.trim().toLowerCase();
    if (FREE_EMAIL_DOMAINS.has(d)) return true;
    // Block common regional free-mail subdomains like yahoo.co.*
    if (/^(gmail|googlemail|yahoo|hotmail|outlook|live|msn|icloud|aol|protonmail|ymail)\./.test(d)) {
        return true;
    }
    return false;
}

/** Returns an error message when the email is invalid or a free consumer domain. */
export function validateProfessionalWorkEmail(email: string): string | null {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return 'Please enter a valid work email address';
    }
    const domain = emailDomain(normalized);
    if (!domain || isFreeEmailDomain(domain)) {
        return PROFESSIONAL_EMAIL_ERROR;
    }
    return null;
}
