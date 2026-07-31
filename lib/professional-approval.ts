import type { AccountType } from '@/lib/auth-enterprise/config';

/** Professional portals only allow login after admin approval. */
export type ProfessionalAccountStatus = 'pending' | 'approved' | 'rejected' | 'active' | string | null | undefined;

export function isProfessionalAccountType(accountType: AccountType | string | undefined): boolean {
    return accountType === 'agent' || accountType === 'originator' || accountType === 'conveyancer';
}

/**
 * Agents, originators & conveyancers: only `status === 'approved'` may sign in.
 * Approvals are performed by PropReady admins.
 */
export function isProfessionalAccountApproved(status: ProfessionalAccountStatus): boolean {
    return (
        String(status || '')
            .trim()
            .toLowerCase() === 'approved'
    );
}

export function professionalApprovalError(status: ProfessionalAccountStatus): string {
    const s = String(status || '')
        .trim()
        .toLowerCase();
    if (s === 'rejected') {
        return 'This registration was not approved. Contact PropReady support if you believe this is an error.';
    }
    return 'Your registration is pending PropReady approval. You can sign in after an admin has approved your account.';
}
