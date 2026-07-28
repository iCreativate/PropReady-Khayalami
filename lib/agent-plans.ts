/**
 * Agent lead packages — buyer, seller, mixed, and subscription pricing.
 */

export type BuyerPlan = 'free' | 'starter' | 'growth' | 'professional';
export type SellerPlan = 'none' | 'seller_starter' | 'seller_growth' | 'seller_professional';
export type AgentPlanStatus = 'trialing' | 'active' | 'payment_pending';

/** Values at or above this count are treated as unlimited for display and limits */
export const UNLIMITED_LEAD_CAP = 999999;

export const BUYER_PLANS = {
    free: {
        id: 'free' as const,
        name: 'Free',
        leadLimit: 3,
        price: 0,
        priceLabel: 'Free',
        costPerLead: null as number | null,
        description: '3 verified leads to get started.',
        isUnlimited: false,
        isConsultation: false,
    },
    starter: {
        id: 'starter' as const,
        name: 'Starter',
        leadLimit: 5,
        price: 2500,
        priceLabel: 'R2,500',
        costPerLead: 500,
        description: '5 verified buyer leads.',
        isUnlimited: false,
        isConsultation: false,
    },
    growth: {
        id: 'growth' as const,
        name: 'Growth',
        leadLimit: 10,
        price: 4500,
        priceLabel: 'R4,500',
        costPerLead: 450,
        description: '10 verified buyer leads.',
        isUnlimited: false,
        isConsultation: false,
    },
    professional: {
        id: 'professional' as const,
        name: 'Professional',
        leadLimit: 15,
        price: 6000,
        priceLabel: 'R6,000',
        costPerLead: 400,
        description: '15 verified buyer leads.',
        isUnlimited: false,
        isConsultation: false,
    },
} as const;

export const SELLER_PLANS = {
    none: {
        id: 'none' as const,
        name: 'No seller package',
        leadLimit: 0,
        price: 0,
        priceLabel: '—',
        costPerLead: null as number | null,
        description: 'Add a seller lead package below.',
    },
    seller_starter: {
        id: 'seller_starter' as const,
        name: 'Seller Starter',
        leadLimit: 5,
        price: 5000,
        priceLabel: 'R5,000',
        costPerLead: 1000,
        description: '5 seller leads.',
    },
    seller_growth: {
        id: 'seller_growth' as const,
        name: 'Seller Growth',
        leadLimit: 10,
        price: 9000,
        priceLabel: 'R9,000',
        costPerLead: 900,
        description: '10 seller leads.',
    },
    seller_professional: {
        id: 'seller_professional' as const,
        name: 'Seller Professional',
        leadLimit: 15,
        price: 12000,
        priceLabel: 'R12,000',
        costPerLead: 800,
        description: '15 seller leads.',
    },
} as const;

/** Mixed buyer + seller lead bundles (once-off) */
export const MIXED_PLANS = {
    bronze: {
        id: 'bronze' as const,
        name: 'Bronze',
        leadLimit: 5,
        price: 3000,
        priceLabel: 'R3,000',
        description: '5 verified leads (buyers + sellers).',
    },
    silver: {
        id: 'silver' as const,
        name: 'Silver',
        leadLimit: 10,
        price: 5500,
        priceLabel: 'R5,500',
        description: '10 verified leads (buyers + sellers).',
    },
    gold: {
        id: 'gold' as const,
        name: 'Gold',
        leadLimit: 15,
        price: 7500,
        priceLabel: 'R7,500',
        description: '15 verified leads (buyers + sellers).',
    },
} as const;

/** Recurring monthly subscriptions (recommended) */
export const SUBSCRIPTION_PLANS = {
    agent_lite: {
        id: 'agent_lite' as const,
        name: 'Agent Lite',
        leadLimit: 10,
        price: 4999,
        priceLabel: 'R4,999/month',
        description: '10 leads per month.',
    },
    agent_pro: {
        id: 'agent_pro' as const,
        name: 'Agent Pro',
        leadLimit: 25,
        price: 9999,
        priceLabel: 'R9,999/month',
        description: '25 leads per month.',
    },
    agency_plus: {
        id: 'agency_plus' as const,
        name: 'Agency Plus',
        leadLimit: 50,
        price: 17999,
        priceLabel: 'R17,999/month',
        description: '50 leads per month.',
    },
} as const;

/** Recommended sweet-spot once-off pricing */
export const SWEET_SPOT_PRICING = [
    { leads: 5, priceLabel: 'R2,999' },
    { leads: 10, priceLabel: 'R5,499' },
    { leads: 15, priceLabel: 'R7,499' },
] as const;

/** Appointment-based pricing guide */
export const APPOINTMENT_PRICING = [
    { label: 'Verified lead', range: 'R500 – R1,000' },
    { label: 'Property viewing appointment booked', range: 'R1,500 – R3,000' },
    { label: 'Seller valuation appointment booked', range: 'R2,500 – R5,000' },
] as const;

/** @deprecated Use BUYER_PLANS — kept for gradual migration */
export const AGENT_PLANS = {
    free: BUYER_PLANS.free,
    starter: BUYER_PLANS.starter,
    pro: BUYER_PLANS.growth,
    enterprise: BUYER_PLANS.professional,
};

export function getBuyerLeadLimit(plan: BuyerPlan | string | undefined): number {
    const key = normalizeBuyerPlan(plan);
    return BUYER_PLANS[key].leadLimit;
}

export function isUnlimitedBuyerPlan(plan: BuyerPlan | string | undefined): boolean {
    const key = normalizeBuyerPlan(plan);
    return BUYER_PLANS[key].isUnlimited;
}

export function formatLeadLimit(plan: BuyerPlan | string | undefined): string {
    if (isUnlimitedBuyerPlan(plan)) return 'Unlimited';
    return String(getBuyerLeadLimit(plan));
}

export function getSellerLeadLimit(sellerPlan: SellerPlan | string | undefined | null): number {
    const key = normalizeSellerPlan(sellerPlan);
    return SELLER_PLANS[key].leadLimit;
}

export function normalizeBuyerPlan(plan: string | undefined): BuyerPlan {
    if (plan === 'starter' || plan === 'growth' || plan === 'professional') return plan;
    if (plan === 'pro') return 'growth';
    if (plan === 'enterprise') return 'professional';
    return 'free';
}

export function normalizeSellerPlan(plan: string | undefined | null): SellerPlan {
    if (
        plan === 'seller_starter' ||
        plan === 'seller_growth' ||
        plan === 'seller_professional'
    ) {
        return plan;
    }
    return 'none';
}

export type AgentPlanLifecycle = {
    plan?: string | null;
    sellerPlan?: string | null;
    planStatus?: string | null;
    trialStartedAt?: string | null;
    trialEndsAt?: string | null;
    planActivatedAt?: string | null;
};

export type AgentLeadAccessState = {
    status: AgentPlanStatus;
    locked: boolean;
    message: string;
    badge: string;
    trialEndsAt: string | null;
};

export function normalizeAgentPlanStatus(status: string | null | undefined): AgentPlanStatus {
    return status === 'active' || status === 'payment_pending' ? status : 'trialing';
}

export function getAgentLeadAccessState(agent: AgentPlanLifecycle): AgentLeadAccessState {
    const status = normalizeAgentPlanStatus(agent.planStatus);
    const trialEndsAt = agent.trialEndsAt || null;
    const trialExpired = trialEndsAt ? new Date(trialEndsAt).getTime() < Date.now() : false;

    if (status === 'active') {
        return {
            status,
            locked: false,
            badge: 'Plan active',
            trialEndsAt,
            message: 'Your selected plan is active and your leads are fully unlocked.',
        };
    }

    if (status === 'trialing' && !trialExpired) {
        return {
            status,
            locked: false,
            badge: '7-day trial',
            trialEndsAt,
            message: trialEndsAt
                ? `Your trial is active until ${new Date(trialEndsAt).toLocaleDateString()}.`
                : 'Your 7-day trial is active.',
        };
    }

    return {
        status: 'payment_pending',
        locked: true,
        badge: 'Activation needed',
        trialEndsAt,
        message: 'Your trial has ended. Leads stay visible, but contact details remain locked until PropReady activates your plan.',
    };
}

export function getAgentPlanStatusLabel(status: string | null | undefined): string {
    const normalized = normalizeAgentPlanStatus(status);
    if (normalized === 'active') return 'Active';
    if (normalized === 'payment_pending') return 'Payment pending';
    return 'Trialing';
}

export function getPlanDisplay(plan: BuyerPlan | string | undefined): string {
    return BUYER_PLANS[normalizeBuyerPlan(plan)].name;
}

export function isFreeBuyerPlan(plan: BuyerPlan | string | undefined): boolean {
    return normalizeBuyerPlan(plan) === 'free';
}

/** Short label for agent profile / nav (e.g. "Free plan", "Growth plan") */
export function getAgentPlanBadge(
    plan: BuyerPlan | string | undefined,
    sellerPlan?: SellerPlan | string | null
): string {
    const buyerKey = normalizeBuyerPlan(plan);
    const sellerKey = normalizeSellerPlan(sellerPlan);
    const buyerLabel =
        buyerKey === 'free' ? 'Free plan' : `${BUYER_PLANS[buyerKey].name} plan`;
    if (sellerKey !== 'none') {
        return `${buyerLabel} · ${SELLER_PLANS[sellerKey].name}`;
    }
    return buyerLabel;
}

/** @deprecated Use getBuyerLeadLimit */
export function getLeadLimit(plan: BuyerPlan | string | undefined): number {
    return getBuyerLeadLimit(plan);
}

const SUPPORT_EMAIL = 'info@prop-ready.co.za';

export function buildUpgradeMailto(
    agentName: string,
    agentEmail: string,
    packageName: string,
    priceLabel: string,
    options?: { isConsultation?: boolean; isSubscription?: boolean }
): string {
    const isConsultation = options?.isConsultation ?? false;
    const isSubscription = options?.isSubscription ?? false;
    const subject = encodeURIComponent(
        isConsultation
            ? 'PropReady — Book consultation'
            : isSubscription
              ? `PropReady Subscription — ${packageName} (${priceLabel})`
              : `PropReady Upgrade — ${packageName} (${priceLabel})`
    );
    const body = encodeURIComponent(
        isConsultation
            ? `Hi,\n\nI would like to book a consultation to discuss PropReady lead packages.\n\nAgent name: ${agentName}\nAgent email: ${agentEmail}\n\nThank you.`
            : isSubscription
              ? `Hi,\n\nI would like to subscribe to a monthly PropReady package.\n\nPlan: ${packageName}\nPrice: ${priceLabel}\n\nAgent name: ${agentName}\nAgent email: ${agentEmail}\n\nThank you.`
              : `Hi,\n\nI would like to upgrade my PropReady agent account.\n\nPackage: ${packageName}\nPrice: ${priceLabel}\n\nAgent name: ${agentName}\nAgent email: ${agentEmail}\n\nThank you.`
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export const PRICING_SUMMARY =
    'Free: 3 verified leads. Buyer packages from R2,500 (5 leads). Mixed bundles and monthly subscriptions available — see plans below.';
