/**
 * Agent plan tiers and lead limits.
 * Free: 3 leads. Pro and Enterprise: more leads (upgrade required).
 */

export type AgentPlan = 'free' | 'pro' | 'enterprise';

export const AGENT_PLANS = {
    free: {
        name: 'Free',
        leadLimit: 3,
        description: 'Register for free. View up to 3 leads.',
    },
    pro: {
        name: 'Pro',
        leadLimit: 50,
        description: 'Up to 50 leads. Ideal for growing your pipeline.',
    },
    enterprise: {
        name: 'Enterprise',
        leadLimit: 9999, // effectively unlimited
        description: 'Unlimited leads. For teams and high-volume agents.',
    },
} as const;

export function getLeadLimit(plan: AgentPlan | string | undefined): number {
    const key = (plan === 'pro' || plan === 'enterprise' ? plan : 'free') as AgentPlan;
    return AGENT_PLANS[key].leadLimit;
}

export function getPlanDisplay(plan: AgentPlan | string | undefined): string {
    const key = (plan === 'pro' || plan === 'enterprise' ? plan : 'free') as AgentPlan;
    return AGENT_PLANS[key].name;
}
