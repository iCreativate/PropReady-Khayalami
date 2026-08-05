/** Canonical public learning hubs (buyers / sellers / investors). */
export const LEARNING_HUBS = [
    {
        href: '/learn',
        title: 'Buyers',
        blurb: 'Home loans, prequalification, transfer costs, insurance and first-time buyer discipline.',
        description:
            'Home loans, prequalification, the buying process, transfer costs, FLISP, insurance, and first-time buyer guides — so you buy with clarity.',
        icon: 'Home',
        progress: 72,
        badge: '17 modules',
        cta: 'Open Buyers hub',
    },
    {
        href: '/sellers',
        title: 'Sellers',
        blurb: 'Pricing, agents, marketing, sale process, insurance and net-proceeds clarity.',
        description:
            'Pricing, choosing an agent, marketing, selling costs, insurance while selling, and the sale process — so you sell with confidence.',
        icon: 'Building2',
        progress: 45,
        badge: '16 modules',
        cta: 'Open Sellers hub',
    },
    {
        href: '/learn/investors',
        title: 'Investors',
        blurb: 'Strategy, returns, financing, tax, landlord insurance and portfolio mistakes to avoid.',
        description:
            'Investment strategies, returns, financing, tax basics, landlord insurance, portfolio management, and common investor mistakes.',
        icon: 'TrendingUp',
        progress: 58,
        badge: '15 modules',
        cta: 'Open Investors hub',
    },
] as const;

export type LearningHub = (typeof LEARNING_HUBS)[number];
