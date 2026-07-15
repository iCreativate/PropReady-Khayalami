export const BOND_ORIGINATORS = [
    {
        id: 'sa-home-loans',
        name: 'SA Home Loans',
        description: 'Specialist home loan provider with competitive rates and flexible terms',
        rating: '4.9/5',
        features: ['Free pre-qualification', 'Competitive rates', 'Dedicated consultant'],
        phone: '0861123456',
        website: 'https://www.sahomeloans.com',
    },
    {
        id: 'betterbond',
        name: 'BetterBond',
        description: "South Africa's leading bond originator",
        rating: '4.8/5',
        features: ['Free service', 'Multiple bank comparisons', 'Expert guidance'],
        phone: '0800007111',
        website: 'https://www.betterbond.co.za',
    },
    {
        id: 'ooba',
        name: 'Ooba',
        description: 'Compare deals from 20+ banks',
        rating: '4.7/5',
        features: ['No cost to you', 'Fast approval', 'Dedicated consultant'],
        phone: '0860006622',
        website: 'https://www.ooba.co.za',
    },
    {
        id: 'multinet',
        name: 'MultiNET Home Loans',
        description: 'Personalized home loan solutions across major banks',
        rating: '4.6/5',
        features: ['Free pre-approval', 'Best rates guaranteed', '24/7 support'],
        phone: '0861545444',
        website: 'https://www.multinet.co.za',
    },
    {
        id: 'mortgageplus',
        name: 'Mortgage Plus',
        description: 'Expert bond origination and application support',
        rating: '4.5/5',
        features: ['Professional service', 'Competitive rates', 'Quick processing'],
        phone: '0861000000',
        website: 'https://www.mortgageplus.co.za',
    },
] as const;

export type BondOriginator = (typeof BOND_ORIGINATORS)[number];
export type BondOriginatorId = BondOriginator['id'];

export function bondOriginatorLabel(id?: string | null): string | null {
    if (!id) return null;
    const found = BOND_ORIGINATORS.find((o) => o.id === id || o.name.toLowerCase() === id.toLowerCase());
    if (found) return found.name;
    return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Agent-facing summary for Learning Hub articles */
export function formatBondOriginatorList(): string {
    return BOND_ORIGINATORS.map((o) => o.name).join(', ');
}
