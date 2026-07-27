/**
 * Demo bond originator staff account for local / staging testing.
 * Seed via: npm run seed:demo-originator  OR  POST /api/dev/seed-demo-originator
 *
 * Login: /originators/login
 * Organisation + staff number + email + password below.
 */
export const DEMO_ORIGINATOR = {
    id: 'a0000000-0000-4000-8000-0000000000d1',
    email: 'demo.originator@prop-ready.co.za',
    password: 'Demo@123!',
    fullName: 'Demo Originator',
    phone: '+27821234568',
    organizationId: 'betterbond',
    organizationName: 'BetterBond',
    staffNumber: 'PR-BB-DEMO01',
    status: 'approved',
    emailVerified: true,
} as const;

export const DEMO_ORIGINATOR_LOGIN_HINT = {
    email: DEMO_ORIGINATOR.email,
    password: DEMO_ORIGINATOR.password,
    organizationId: DEMO_ORIGINATOR.organizationId,
    staffNumber: DEMO_ORIGINATOR.staffNumber,
};
