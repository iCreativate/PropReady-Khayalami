/**
 * Demo agent account for local / staging testing.
 * Seed via: npm run seed:demo-agent  OR  POST /api/dev/seed-demo-agent
 *
 * Login: /agents/login
 * Email + password + FFC number below.
 */
export const DEMO_AGENT = {
    id: 'demo-agent-propready',
    email: 'demo.agent@prop-ready.co.za',
    password: 'Demo@123!',
    fullName: 'Demo Agent',
    phone: '+27821234567',
    company: 'PropReady Demo Realty',
    city: 'Johannesburg',
    ppraNumber: '1234567',
    /** Valid 15-digit FFC (20 + 13 digits) for login testing */
    ffcNumber: '202512345678901',
    ffcDocumentUrl: 'demo/ffc-certificate.pdf',
    plan: 'growth',
    sellerPlan: 'none',
    status: 'approved',
    emailVerified: true,
    verificationStatus: 'verified',
} as const;

/** Seed-only credentials — never display these in the public app UI. */
export const DEMO_AGENT_SEED_CREDENTIALS = {
    email: DEMO_AGENT.email,
    password: DEMO_AGENT.password,
    ffcNumber: DEMO_AGENT.ffcNumber,
};
