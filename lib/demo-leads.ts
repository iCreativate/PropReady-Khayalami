import { DEMO_AGENT } from '@/lib/demo-agent';

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
const daysAhead = (n: number) => {
    const d = new Date(now.getTime() + n * 86400000);
    return d.toISOString().slice(0, 10);
};

export const DEMO_BUYER_LEADS = [
    {
        id: 'demo-buyer-lerato',
        leadType: 'buyer' as const,
        fullName: 'Lerato Naidoo',
        email: 'lerato.demo@prop-ready.co.za',
        phone: '+27831234002',
        city: 'Sandton',
        employmentStatus: 'Self-employed',
        monthlyIncome: 'R62,000',
        depositSaved: 'R320,000',
        creditScore: 'Excellent',
        score: 92,
        preQualAmount: 2400000,
        bondOriginator: 'betterbond',
        prequalifiedWithOriginator: true,
        status: 'qualified' as const,
        appointmentVerified: true,
        timestamp: daysAgo(8),
        contactedAt: daysAgo(6),
    },
    {
        id: 'demo-buyer-james',
        leadType: 'buyer' as const,
        fullName: 'James van Wyk',
        email: 'james.demo@prop-ready.co.za',
        phone: '+27841234003',
        city: 'Pretoria',
        employmentStatus: 'Permanent employment',
        monthlyIncome: 'R38,000',
        depositSaved: 'R95,000',
        creditScore: 'Fair',
        score: 74,
        preQualAmount: 1200000,
        bondOriginator: 'ooba',
        prequalifiedWithOriginator: true,
        status: 'contacted' as const,
        appointmentVerified: false,
        timestamp: daysAgo(5),
        contactedAt: daysAgo(3),
    },
];

export const DEMO_SELLER_LEADS = [
    {
        id: 'demo-seller-john',
        leadType: 'seller' as const,
        fullName: 'John Mthembu',
        email: 'john.demo@prop-ready.co.za',
        phone: '+27871234006',
        city: 'Midrand',
        propertyAddress: '14 Maple Street, Midrand',
        propertyType: 'Townhouse',
        currentValue: 'R1,850,000',
        timeline: '1–3 months',
        status: 'contacted' as const,
        appointmentVerified: true,
        timestamp: daysAgo(9),
        contactedAt: daysAgo(7),
    },
    {
        id: 'demo-seller-sipho',
        leadType: 'seller' as const,
        fullName: 'Sipho Dlamini',
        email: 'sipho.demo@prop-ready.co.za',
        phone: '+27861234005',
        city: 'Johannesburg',
        propertyAddress: '8 Oak Avenue, Sandton',
        propertyType: 'House',
        currentValue: 'R2,400,000',
        timeline: '3–6 months',
        status: 'contacted' as const,
        appointmentVerified: true,
        timestamp: daysAgo(11),
        contactedAt: daysAgo(9),
    },
];

export const DEMO_VIEWINGS = [
    {
        id: 'demo-viewing-lerato',
        propertyId: 'demo-property-midrand',
        propertyTitle: 'Stylish Midrand Townhouse',
        propertyAddress: '14 Maple Street, Midrand',
        propertyPrice: 1850000,
        agentId: DEMO_AGENT.id,
        buyerLeadId: 'demo-buyer-lerato',
        sellerLeadId: 'demo-seller-john',
        buyerName: 'Lerato Naidoo',
        buyerEmail: 'lerato.demo@prop-ready.co.za',
        buyerPhone: '+27831234002',
        sellerName: 'John Mthembu',
        sellerEmail: 'john.demo@prop-ready.co.za',
        sellerPhone: '+27871234006',
        buyerConfirmedAt: daysAgo(5),
        sellerConfirmedAt: daysAgo(4),
        contactName: 'Lerato Naidoo',
        contactEmail: 'lerato.demo@prop-ready.co.za',
        contactPhone: '+27831234002',
        contactType: 'buyer' as const,
        date: daysAhead(4),
        time: '14:30',
        status: 'confirmed' as const,
        notes: 'Prequalified via BetterBond.',
        timestamp: daysAgo(6),
    },
    {
        id: 'demo-viewing-james',
        propertyId: 'demo-property-sandton',
        propertyTitle: 'Modern 3-Bed Family Home',
        propertyAddress: '8 Oak Avenue, Sandton',
        propertyPrice: 2400000,
        agentId: DEMO_AGENT.id,
        buyerLeadId: 'demo-buyer-james',
        sellerLeadId: 'demo-seller-sipho',
        buyerName: 'James van Wyk',
        buyerEmail: 'james.demo@prop-ready.co.za',
        buyerPhone: '+27841234003',
        sellerName: 'Sipho Dlamini',
        sellerEmail: 'sipho.demo@prop-ready.co.za',
        sellerPhone: '+27861234005',
        buyerConfirmedAt: daysAgo(2),
        sellerConfirmedAt: null,
        contactName: 'James van Wyk',
        contactEmail: 'james.demo@prop-ready.co.za',
        contactPhone: '+27841234003',
        contactType: 'buyer' as const,
        date: daysAhead(6),
        time: '11:00',
        status: 'scheduled' as const,
        notes: 'Awaiting seller confirmation — prequalified with Ooba.',
        timestamp: daysAgo(3),
    },
];

const DEMO_LEADS_STORAGE_KEY = 'propReady_demoLeadsSeeded';

export function mergeDemoLeadsIntoStorage(agentId?: string): boolean {
    if (typeof window === 'undefined') return false;
    if (agentId && agentId !== DEMO_AGENT.id) return false;
    if (localStorage.getItem(DEMO_LEADS_STORAGE_KEY) === '1') return false;

    const buyers = JSON.parse(localStorage.getItem('propReady_leads') || '[]');
    const sellers = JSON.parse(localStorage.getItem('propReady_sellers') || '[]');
    const viewings = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');

    const buyerIds = new Set(buyers.map((l: { id: string }) => l.id));
    const sellerIds = new Set(sellers.map((l: { id: string }) => l.id));
    const viewingIds = new Set(viewings.map((v: { id: string }) => v.id));

    const mergedBuyers = [
        ...buyers,
        ...DEMO_BUYER_LEADS.filter((l) => !buyerIds.has(l.id)),
    ];
    const mergedSellers = [
        ...sellers,
        ...DEMO_SELLER_LEADS.filter((l) => !sellerIds.has(l.id)),
    ];
    const mergedViewings = [
        ...viewings,
        ...DEMO_VIEWINGS.filter((v) => !viewingIds.has(v.id)),
    ];

    localStorage.setItem('propReady_leads', JSON.stringify(mergedBuyers));
    localStorage.setItem('propReady_sellers', JSON.stringify(mergedSellers));
    localStorage.setItem('propReady_viewingAppointments', JSON.stringify(mergedViewings));
    localStorage.setItem(DEMO_LEADS_STORAGE_KEY, '1');
    return true;
}

export function getDemoLeadsApiPayload() {
    return {
        buyers: DEMO_BUYER_LEADS,
        sellers: DEMO_SELLER_LEADS,
        viewings: DEMO_VIEWINGS,
        agentId: DEMO_AGENT.id,
    };
}
