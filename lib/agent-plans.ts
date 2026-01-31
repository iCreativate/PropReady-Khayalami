/**
 * Agent plan tiers and lead limits.
 * Free: 3 leads. Starter: 10 leads R120. Pro: 25 leads R250. Enterprise: Unlimited (book a consultation).
 */

export type AgentPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export const AGENT_PLANS = {
    free: {
        name: 'Free',
        leadLimit: 3,
        price: null as number | null,
        priceLabel: 'Free',
        description: 'Register for free. View up to 3 leads.',
    },
    starter: {
        name: 'Starter',
        leadLimit: 10,
        price: 120,
        priceLabel: 'R120',
        description: 'Up to 10 leads.',
    },
    pro: {
        name: 'Pro',
        leadLimit: 25,
        price: 250,
        priceLabel: 'R250',
        description: 'Up to 25 leads.',
    },
    enterprise: {
        name: 'Enterprise',
        leadLimit: 9999, // unlimited
        price: null as number | null,
        priceLabel: 'Book a consultation',
        description: 'Unlimited leads. Book a consultation.',
    },
} as const;

export function getLeadLimit(plan: AgentPlan | string | undefined): number {
    if (plan === 'starter') return AGENT_PLANS.starter.leadLimit;
    if (plan === 'pro') return AGENT_PLANS.pro.leadLimit;
    if (plan === 'enterprise') return AGENT_PLANS.enterprise.leadLimit;
    return AGENT_PLANS.free.leadLimit;
}

export function getPlanDisplay(plan: AgentPlan | string | undefined): string {
    if (plan === 'starter') return AGENT_PLANS.starter.name;
    if (plan === 'pro') return AGENT_PLANS.pro.name;
    if (plan === 'enterprise') return AGENT_PLANS.enterprise.name;
    return AGENT_PLANS.free.name;
}
