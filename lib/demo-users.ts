import { DEMO_BUYER_LEADS, DEMO_SELLER_LEADS, DEMO_VIEWINGS } from '@/lib/demo-leads';

/** Shared password for all PropReady demo accounts (buyer, seller, agent). */
export const DEMO_USER_PASSWORD = 'Demo@123!';

export const DEMO_BUYER = {
    id: 'demo-buyer-lerato',
    email: 'lerato.demo@prop-ready.co.za',
    password: DEMO_USER_PASSWORD,
    fullName: 'Lerato Naidoo',
    phone: '+27831234002',
    city: 'Sandton',
    emailVerified: true,
    loginUrl: '/login',
    dashboardUrl: '/dashboard',
} as const;

export const DEMO_SELLER = {
    id: 'demo-seller-john',
    email: 'john.demo@prop-ready.co.za',
    password: DEMO_USER_PASSWORD,
    fullName: 'John Mthembu',
    phone: '+27871234006',
    city: 'Midrand',
    emailVerified: true,
    loginUrl: '/login',
    dashboardUrl: '/sellers/dashboard',
} as const;

export const DEMO_BUYER_LOGIN_HINT = {
    email: DEMO_BUYER.email,
    password: DEMO_BUYER.password,
    loginUrl: DEMO_BUYER.loginUrl,
    dashboardUrl: DEMO_BUYER.dashboardUrl,
};

export const DEMO_SELLER_LOGIN_HINT = {
    email: DEMO_SELLER.email,
    password: DEMO_SELLER.password,
    loginUrl: DEMO_SELLER.loginUrl,
    dashboardUrl: DEMO_SELLER.dashboardUrl,
};

function getBuyerLead() {
    return DEMO_BUYER_LEADS.find((l) => l.id === DEMO_BUYER.id) ?? DEMO_BUYER_LEADS[0];
}

function getSellerLead() {
    return DEMO_SELLER_LEADS.find((l) => l.id === DEMO_SELLER.id) ?? DEMO_SELLER_LEADS[0];
}

export function buildDemoBuyerQuizResult() {
    const buyerLead = getBuyerLead();
    return {
        id: DEMO_BUYER.id,
        user_id: DEMO_BUYER.id,
        fullName: DEMO_BUYER.fullName,
        email: DEMO_BUYER.email,
        phone: DEMO_BUYER.phone,
        city: buyerLead.city,
        inMarketForProperty: true,
        monthlyIncome: buyerLead.monthlyIncome?.replace(/^R/, '') ?? '62000',
        expenses: '22000',
        hasDebt: false,
        depositSaved: buyerLead.depositSaved?.replace(/^R/, '') ?? '320000',
        creditScore: buyerLead.creditScore ?? 'Excellent',
        employmentStatus: buyerLead.employmentStatus ?? 'Self-employed',
        score: buyerLead.score ?? 92,
        preQualAmount: buyerLead.preQualAmount ?? 2400000,
        selectedOriginator: 'BetterBond',
        bondOriginator: buyerLead.bondOriginator ?? 'betterbond',
        timestamp: buyerLead.timestamp,
    };
}

export function buildDemoSellerInfo() {
    const sellerLead = getSellerLead();
    return {
        id: DEMO_SELLER.id,
        fullName: DEMO_SELLER.fullName,
        email: DEMO_SELLER.email,
        phone: DEMO_SELLER.phone,
        city: sellerLead.city,
        propertyAddress: sellerLead.propertyAddress,
        propertyType: sellerLead.propertyType,
        bedrooms: '3',
        bathrooms: '2',
        landSize: '350',
        buildingSize: '180',
        yearBuilt: '2015',
        currentValue: sellerLead.currentValue?.replace(/^R/, '') ?? '1850000',
        reasonForSelling: 'Relocating for work',
        timeline: sellerLead.timeline,
        hasBond: true,
        bondBalance: '950000',
        agentPreference: 'Experienced local agent',
        timestamp: sellerLead.timestamp,
    };
}

export function buildDemoBuyerLeadRecord() {
    return { ...getBuyerLead() };
}

export function buildDemoSellerLeadRecord() {
    return {
        ...getSellerLead(),
        ...buildDemoSellerInfo(),
        leadType: 'seller' as const,
    };
}

export function isDemoBuyerEmail(email: string): boolean {
    return email.trim().toLowerCase() === DEMO_BUYER.email.toLowerCase();
}

export function isDemoSellerEmail(email: string): boolean {
    return email.trim().toLowerCase() === DEMO_SELLER.email.toLowerCase();
}

export function getDemoAccountType(email: string): 'buyer' | 'seller' | null {
    if (isDemoBuyerEmail(email)) return 'buyer';
    if (isDemoSellerEmail(email)) return 'seller';
    return null;
}

export function getDemoViewingsForAccount(type: 'buyer' | 'seller') {
    const email =
        type === 'buyer' ? DEMO_BUYER.email.toLowerCase() : DEMO_SELLER.email.toLowerCase();
    return DEMO_VIEWINGS.filter((v) => {
        if (type === 'buyer') {
            return (
                v.buyerEmail?.toLowerCase() === email ||
                (v.contactType === 'buyer' && v.contactEmail?.toLowerCase() === email)
            );
        }
        return (
            v.sellerEmail?.toLowerCase() === email ||
            (v.contactType === 'seller' && v.contactEmail?.toLowerCase() === email)
        );
    });
}
