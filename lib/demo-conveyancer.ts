/**
 * Demo conveyancer accounts for local / staging testing.
 * Seed via: npm run seed:demo-conveyancer  OR  POST /api/dev/seed-demo-conveyancer
 *
 * Password is only for server seed routes — do not surface in UI.
 */
export type DemoConveyancer = {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    firmName: string;
    firmSlug: string;
    lpcNumber: string;
    province: string;
    city: string;
    suburb: string;
    bio: string;
    status: 'approved';
    specialisations: string[];
};

export const DEMO_CONVEYANCERS: DemoConveyancer[] = [
    {
        id: 'a0000000-0000-4000-8000-0000000000c1',
        email: 'demo.conveyancer@prop-ready.co.za',
        fullName: 'Thandi Mokoena',
        phone: '+27821110001',
        firmName: 'PropReady Demo Conveyancers JHB',
        firmSlug: 'propready-demo-conveyancers-jhb',
        lpcNumber: 'LPC-DEMO-JHB-001',
        province: 'gauteng',
        city: 'Johannesburg',
        suburb: 'Sandton',
        bio: 'Demo conveyancing firm for PropReady testing — residential transfers and bond registrations in Gauteng.',
        status: 'approved',
        specialisations: ['residential', 'bond-registration', 'sectional-title'],
    },
    {
        id: 'a0000000-0000-4000-8000-0000000000c2',
        email: 'demo.conveyancer.cpt@prop-ready.co.za',
        fullName: 'Pieter van der Berg',
        phone: '+27821110002',
        firmName: 'PropReady Demo Conveyancers CPT',
        firmSlug: 'propready-demo-conveyancers-cpt',
        lpcNumber: 'LPC-DEMO-CPT-001',
        province: 'western-cape',
        city: 'Cape Town',
        suburb: 'Claremont',
        bio: 'Demo Cape Town conveyancing practice for PropReady testing — transfers, cancellations and estates.',
        status: 'approved',
        specialisations: ['residential', 'bond-cancellation', 'estate-transfers'],
    },
];

/** Primary demo conveyancer (Johannesburg). */
export const DEMO_CONVEYANCER = DEMO_CONVEYANCERS[0];

export function getDemoConveyancerPassword(): string {
    return (
        process.env.DEMO_CONVEYANCER_PASSWORD?.trim() ||
        process.env.DEMO_USER_PASSWORD?.trim() ||
        'Demo@123!'
    );
}

export const DEMO_CONVEYANCER_SEED_CREDENTIALS = DEMO_CONVEYANCERS.map((c) => ({
    email: c.email,
    firmName: c.firmName,
    loginUrl: '/conveyancers/login',
    portalUrl: '/conveyancers/portal',
    get password() {
        return getDemoConveyancerPassword();
    },
}));
