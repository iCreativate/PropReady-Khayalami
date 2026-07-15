'use client';

import {
    getSellerLeadLimit,
    BUYER_PLANS,
    SELLER_PLANS,
    MIXED_PLANS,
    SUBSCRIPTION_PLANS,
    SWEET_SPOT_PRICING,
    APPOINTMENT_PRICING,
    buildUpgradeMailto,
    getPlanDisplay,
    normalizeBuyerPlan,
    normalizeSellerPlan,
    formatLeadLimit,
    isUnlimitedBuyerPlan,
    PRICING_SUMMARY,
} from '@/lib/agent-plans';
import {
    AGENT_CARD,
    AGENT_CARD_HEADER,
    AGENT_CARD_BODY,
    AGENT_PLAN_CARD,
    AGENT_PLAN_CARD_CURRENT,
    AGENT_SECTION_LABEL,
    AGENT_CARD_SOFT,
} from '@/lib/agent-portal-ui';

interface AgentPlanPanelProps {
    agent: {
        fullName: string;
        email: string;
        plan?: string;
        sellerPlan?: string;
    };
    verifiedBuyerCount?: number;
    verifiedSellerCount?: number;
}

function PlanCard({
    isCurrent,
    href,
    children,
    className = '',
}: {
    isCurrent: boolean;
    href?: string;
    children: React.ReactNode;
    className?: string;
}) {
    const base = isCurrent ? AGENT_PLAN_CARD_CURRENT : AGENT_PLAN_CARD;

    if (isCurrent || !href) {
        return <div className={`${base} ${className}`}>{children}</div>;
    }

    return (
        <a href={href} className={`${base} ${className}`}>
            {children}
        </a>
    );
}

export default function AgentPlanPanel({
    agent,
    verifiedBuyerCount = 0,
    verifiedSellerCount = 0,
}: AgentPlanPanelProps) {
    const buyerPlanKey = normalizeBuyerPlan(agent.plan);
    const buyerPlanLimitLabel = formatLeadLimit(buyerPlanKey);
    const buyerPlanUnlimited = isUnlimitedBuyerPlan(buyerPlanKey);
    const sellerPlanLimit = getSellerLeadLimit(normalizeSellerPlan(agent.sellerPlan));

    return (
        <div className="space-y-6 sm:space-y-8">
            <section className={AGENT_CARD}>
                <div className="px-6 sm:px-8 py-6 sm:py-7 border-b border-charcoal/[0.06] bg-gradient-to-r from-gold/[0.04] via-white to-white">
                    <h3 className="text-lg font-semibold text-charcoal tracking-tight mb-2">Your buyer plan</h3>
                    <p className="text-charcoal/45 text-sm mb-4 leading-relaxed">{PRICING_SUMMARY}</p>
                    <p className="text-charcoal/65 text-sm mb-2 leading-relaxed">
                        Current: <span className="font-semibold text-charcoal">{getPlanDisplay(agent.plan)}</span> —{' '}
                        {buyerPlanUnlimited
                            ? 'unlimited verified buyer leads'
                            : `up to ${buyerPlanLimitLabel} verified buyer leads`}
                        .
                    </p>
                    <p className="text-charcoal/65 text-sm leading-relaxed">
                        Verified this period:{' '}
                        <strong className="text-charcoal">{verifiedBuyerCount}</strong>
                        {buyerPlanUnlimited ? ' buyer (unlimited)' : ` / ${buyerPlanLimitLabel} buyer`}
                        {sellerPlanLimit > 0 && (
                            <>
                                {' · '}
                                <strong className="text-charcoal">{verifiedSellerCount}</strong> / {sellerPlanLimit}{' '}
                                seller
                            </>
                        )}
                        . Leads verify only after a viewing is booked and{' '}
                        <strong className="text-charcoal">both buyer and seller confirm</strong> the appointment.
                    </p>
                </div>
            </section>

            <section className={AGENT_CARD}>
                <div className={AGENT_CARD_HEADER}>
                    <h4 className={AGENT_SECTION_LABEL}>Buyer verified leads</h4>
                </div>
                <div className={`${AGENT_CARD_BODY} sm:px-6 sm:py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5`}>
                    {(['free', 'starter', 'growth', 'professional'] as const).map((planId) => {
                        const plan = BUYER_PLANS[planId];
                        const isCurrent = buyerPlanKey === planId;
                        return (
                            <PlanCard
                                key={planId}
                                isCurrent={isCurrent}
                                href={
                                    isCurrent
                                        ? undefined
                                        : buildUpgradeMailto(
                                              agent.fullName,
                                              agent.email,
                                              plan.name,
                                              plan.priceLabel,
                                              plan.isConsultation ? { isConsultation: true } : undefined
                                          )
                                }
                            >
                                <p className="font-semibold text-charcoal">{plan.name}</p>
                                <p className="text-charcoal/50 text-sm mt-2 leading-relaxed">
                                    {plan.isUnlimited
                                        ? plan.priceLabel
                                        : `${plan.leadLimit} leads · ${plan.priceLabel}`}
                                </p>
                                {plan.costPerLead != null && (
                                    <p className="text-charcoal/40 text-xs mt-2">R{plan.costPerLead}/lead</p>
                                )}
                                {isCurrent && (
                                    <p className="text-gold text-xs font-semibold mt-3">Current plan</p>
                                )}
                            </PlanCard>
                        );
                    })}
                </div>
            </section>

            <section className={AGENT_CARD}>
                <div className={AGENT_CARD_HEADER}>
                    <h4 className={AGENT_SECTION_LABEL}>Seller lead packages</h4>
                </div>
                <div className={`${AGENT_CARD_BODY} sm:px-6 sm:py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5`}>
                    {(['seller_starter', 'seller_growth', 'seller_professional'] as const).map((planId) => {
                        const plan = SELLER_PLANS[planId];
                        const isCurrent = normalizeSellerPlan(agent.sellerPlan) === planId;
                        return (
                            <PlanCard
                                key={planId}
                                isCurrent={isCurrent}
                                href={
                                    isCurrent
                                        ? undefined
                                        : buildUpgradeMailto(agent.fullName, agent.email, plan.name, plan.priceLabel)
                                }
                            >
                                <p className="font-semibold text-charcoal">{plan.name}</p>
                                <p className="text-charcoal/50 text-sm mt-2 leading-relaxed">
                                    {plan.leadLimit} leads · {plan.priceLabel}
                                </p>
                                <p className="text-charcoal/40 text-xs mt-2">R{plan.costPerLead}/lead</p>
                                {isCurrent && (
                                    <p className="text-gold text-xs font-semibold mt-3">Active package</p>
                                )}
                            </PlanCard>
                        );
                    })}
                </div>
            </section>

            <section className={AGENT_CARD}>
                <div className={AGENT_CARD_HEADER}>
                    <h4 className={AGENT_SECTION_LABEL}>Mixed leads (buyers + sellers)</h4>
                </div>
                <div className={`${AGENT_CARD_BODY} sm:px-6 sm:py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5`}>
                    {(['bronze', 'silver', 'gold'] as const).map((planId) => {
                        const plan = MIXED_PLANS[planId];
                        return (
                            <PlanCard
                                key={planId}
                                isCurrent={false}
                                href={buildUpgradeMailto(agent.fullName, agent.email, plan.name, plan.priceLabel)}
                            >
                                <p className="font-semibold text-charcoal">{plan.name}</p>
                                <p className="text-charcoal/50 text-sm mt-2 leading-relaxed">
                                    {plan.leadLimit} leads · {plan.priceLabel}
                                </p>
                                <p className="text-charcoal/40 text-xs mt-2 leading-relaxed">{plan.description}</p>
                            </PlanCard>
                        );
                    })}
                </div>
            </section>

            <section className={AGENT_CARD}>
                <div className={`${AGENT_CARD_HEADER} flex flex-wrap items-center gap-2`}>
                    <h4 className={AGENT_SECTION_LABEL}>Monthly subscriptions</h4>
                    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-semibold uppercase bg-gold/[0.08] text-gold border border-gold/10`}>
                        Recommended
                    </span>
                </div>
                <p className="px-6 sm:px-8 pt-5 text-charcoal/45 text-sm leading-relaxed">
                    Recurring packages for predictable lead flow each month.
                </p>
                <div className={`${AGENT_CARD_BODY} sm:px-6 sm:py-6 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5`}>
                    {(['agent_lite', 'agent_pro', 'agency_plus'] as const).map((planId) => {
                        const plan = SUBSCRIPTION_PLANS[planId];
                        return (
                            <PlanCard
                                key={planId}
                                isCurrent={false}
                                href={buildUpgradeMailto(
                                    agent.fullName,
                                    agent.email,
                                    plan.name,
                                    plan.priceLabel,
                                    { isSubscription: true }
                                )}
                                className="bg-gold/[0.02] hover:bg-gold/[0.04]"
                            >
                                <p className="font-semibold text-charcoal">{plan.name}</p>
                                <p className="text-charcoal/50 text-sm mt-2 leading-relaxed">
                                    {plan.leadLimit} leads/mo · {plan.priceLabel}
                                </p>
                                <p className="text-charcoal/40 text-xs mt-2 leading-relaxed">{plan.description}</p>
                            </PlanCard>
                        );
                    })}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                <section className={`${AGENT_CARD_SOFT} p-6 sm:p-7`}>
                    <p className="text-sm font-semibold text-charcoal mb-3">Recommended sweet-spot pricing</p>
                    <p className="text-charcoal/55 text-sm leading-relaxed">
                        {SWEET_SPOT_PRICING.map((tier, i) => (
                            <span key={tier.leads}>
                                {i > 0 && ' · '}
                                {tier.leads} leads = {tier.priceLabel}
                            </span>
                        ))}
                    </p>
                </section>

                <section className={`${AGENT_CARD_SOFT} p-6 sm:p-7`}>
                    <p className="text-sm font-semibold text-charcoal mb-3">Appointment-based pricing</p>
                    <ul className="text-charcoal/55 text-sm space-y-2 leading-relaxed">
                        {APPOINTMENT_PRICING.map((item) => (
                            <li key={item.label}>
                                <strong className="text-charcoal font-medium">{item.label}:</strong> {item.range}
                            </li>
                        ))}
                    </ul>
                    <p className="text-charcoal/40 text-xs mt-4 leading-relaxed">
                        Agents often value confirmed appointments over raw leads — contact us to discuss this model.
                    </p>
                </section>
            </div>

            <p className="text-charcoal/45 text-sm px-1 leading-relaxed">
                Upgrade via email to{' '}
                <a href="mailto:info@prop-ready.co.za" className="text-gold font-medium hover:underline">
                    info@prop-ready.co.za
                </a>
            </p>
        </div>
    );
}
