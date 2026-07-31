/**
 * Demo originator account for local / staging testing.
 * Seed via POST /api/dev/seed-demo-originator
 * Password is only for server seed routes.
 */
export const DEMO_ORIGINATOR = {
    id: 'demo-originator-propready',
    email: 'demo.originator@prop-ready.co.za',
    fullName: 'Demo Originator',
    phone: '+27820000000',
    organizationId: 'betterbond',
    staffNumber: 'BB-DEMO-001',
    status: 'approved',
    emailVerified: true,
} as const;

export function getDemoOriginatorPassword(): string {
    return process.env.DEMO_ORIGINATOR_PASSWORD?.trim() || 'Demo@123!';
}

export const DEMO_ORIGINATOR_SEED_CREDENTIALS = {
    email: DEMO_ORIGINATOR.email,
    get password() {
        return getDemoOriginatorPassword();
    },
};
