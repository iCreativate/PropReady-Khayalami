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
        <div className="rounded-xl border border-gold/30 bg-gradient-to-r from-gold/10 to-gold/5 p-6">
            <h3 className="text-lg font-bold text-charcoal mb-1">Your buyer plan</h3>
            <p className="text-charcoal/70 text-sm mb-2">{PRICING_SUMMARY}</p>
            <p className="text-charcoal/70 text-sm mb-2">
                Current: {getPlanDisplay(agent.plan)} —{' '}
                {buyerPlanUnlimited
                    ? 'unlimited verified buyer leads'
                    : `up to ${buyerPlanLimitLabel} verified buyer leads`}
                .
            </p>
            <p className="text-charcoal/80 text-sm mb-4">
                Verified this period:{' '}
                <strong>{verifiedBuyerCount}</strong>
                {buyerPlanUnlimited ? ' buyer (unlimited)' : ` / ${buyerPlanLimitLabel} buyer`}
                {sellerPlanLimit > 0 && (
                    <>
                        {' · '}
                        <strong>{verifiedSellerCount}</strong> / {sellerPlanLimit} seller
                    </>
                )}
                . Leads verify only after a viewing is booked and{' '}
                <strong>both buyer and seller confirm</strong> the appointment.
            </p>

            <h4 className="text-sm font-bold text-charcoal mb-2 uppercase tracking-wide">
                Buyer verified leads
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {(['free', 'starter', 'growth', 'professional'] as const).map((planId) => {
                    const plan = BUYER_PLANS[planId];
                    const isCurrent = buyerPlanKey === planId;
                    const CardTag = isCurrent ? 'div' : 'a';
                    return (
                        <CardTag
                            key={planId}
                            {...(!isCurrent && {
                                href: buildUpgradeMailto(
                                    agent.fullName,
                                    agent.email,
                                    plan.name,
                                    plan.priceLabel,
                                    plan.isConsultation ? { isConsultation: true } : undefined
                                ),
                            })}
                            className={`rounded-lg p-4 border block transition-all ${
                                isCurrent
                                    ? 'bg-white/90 border-gold/40'
                                    : 'bg-gold/10 border-gold/30 hover:bg-gold/20 hover:shadow-md'
                            }`}
                        >
                            <p className="font-bold text-charcoal">{plan.name}</p>
                            <p className="text-charcoal/70 text-sm">
                                {plan.isUnlimited
                                    ? plan.priceLabel
                                    : `${plan.leadLimit} leads · ${plan.priceLabel}`}
                            </p>
                            {plan.costPerLead != null && (
                                <p className="text-charcoal/50 text-xs">R{plan.costPerLead}/lead</p>
                            )}
                            {isCurrent && (
                                <p className="text-gold text-xs font-semibold mt-1">Current plan</p>
                            )}
                        </CardTag>
                    );
                })}
            </div>

            <h4 className="text-sm font-bold text-charcoal mb-2 uppercase tracking-wide">
                Seller lead packages
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {(['seller_starter', 'seller_growth', 'seller_professional'] as const).map((planId) => {
                    const plan = SELLER_PLANS[planId];
                    const isCurrent = normalizeSellerPlan(agent.sellerPlan) === planId;
                    const SellerCard = isCurrent ? 'div' : 'a';
                    return (
                        <SellerCard
                            key={planId}
                            {...(!isCurrent && {
                                href: buildUpgradeMailto(
                                    agent.fullName,
                                    agent.email,
                                    plan.name,
                                    plan.priceLabel
                                ),
                            })}
                            className={`rounded-lg p-4 border block transition-all ${
                                isCurrent
                                    ? 'bg-white/90 border-gold/40'
                                    : 'bg-white/80 border-charcoal/10 hover:border-gold/30'
                            }`}
                        >
                            <p className="font-bold text-charcoal">{plan.name}</p>
                            <p className="text-charcoal/70 text-sm">
                                {plan.leadLimit} leads · {plan.priceLabel}
                            </p>
                            <p className="text-charcoal/50 text-xs">R{plan.costPerLead}/lead</p>
                            {isCurrent && (
                                <p className="text-gold text-xs font-semibold mt-1">Active package</p>
                            )}
                        </SellerCard>
                    );
                })}
            </div>

            <h4 className="text-sm font-bold text-charcoal mb-2 uppercase tracking-wide">
                Mixed leads (buyers + sellers)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {(['bronze', 'silver', 'gold'] as const).map((planId) => {
                    const plan = MIXED_PLANS[planId];
                    return (
                        <a
                            key={planId}
                            href={buildUpgradeMailto(agent.fullName, agent.email, plan.name, plan.priceLabel)}
                            className="rounded-lg p-4 border bg-white/80 border-charcoal/10 hover:border-gold/30 block transition-all"
                        >
                            <p className="font-bold text-charcoal">{plan.name}</p>
                            <p className="text-charcoal/70 text-sm">
                                {plan.leadLimit} leads · {plan.priceLabel}
                            </p>
                            <p className="text-charcoal/50 text-xs">{plan.description}</p>
                        </a>
                    );
                })}
            </div>

            <h4 className="text-sm font-bold text-charcoal mb-1 uppercase tracking-wide flex items-center gap-2">
                Monthly subscriptions
                <span className="text-[10px] font-semibold uppercase bg-gold/20 text-gold px-2 py-0.5 rounded-full normal-case tracking-normal">
                    Recommended
                </span>
            </h4>
            <p className="text-charcoal/60 text-xs mb-2">
                Recurring packages for predictable lead flow each month.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {(['agent_lite', 'agent_pro', 'agency_plus'] as const).map((planId) => {
                    const plan = SUBSCRIPTION_PLANS[planId];
                    return (
                        <a
                            key={planId}
                            href={buildUpgradeMailto(
                                agent.fullName,
                                agent.email,
                                plan.name,
                                plan.priceLabel,
                                { isSubscription: true }
                            )}
                            className="rounded-lg p-4 border bg-gold/10 border-gold/30 hover:bg-gold/20 block transition-all"
                        >
                            <p className="font-bold text-charcoal">{plan.name}</p>
                            <p className="text-charcoal/70 text-sm">
                                {plan.leadLimit} leads/mo · {plan.priceLabel}
                            </p>
                            <p className="text-charcoal/50 text-xs">{plan.description}</p>
                        </a>
                    );
                })}
            </div>

            <div className="rounded-lg border border-charcoal/10 bg-white/60 p-4 mb-4">
                <p className="text-sm font-semibold text-charcoal mb-2">Recommended sweet-spot pricing</p>
                <p className="text-charcoal/70 text-sm">
                    {SWEET_SPOT_PRICING.map((tier, i) => (
                        <span key={tier.leads}>
                            {i > 0 && ' · '}
                            {tier.leads} leads = {tier.priceLabel}
                        </span>
                    ))}
                </p>
            </div>

            <div className="rounded-lg border border-charcoal/10 bg-white/60 p-4 mb-4">
                <p className="text-sm font-semibold text-charcoal mb-2">Appointment-based pricing</p>
                <ul className="text-charcoal/70 text-sm space-y-1">
                    {APPOINTMENT_PRICING.map((item) => (
                        <li key={item.label}>
                            <strong>{item.label}:</strong> {item.range}
                        </li>
                    ))}
                </ul>
                <p className="text-charcoal/50 text-xs mt-2">
                    Agents often value confirmed appointments over raw leads — contact us to discuss this
                    model.
                </p>
            </div>

            <p className="text-charcoal/60 text-sm mt-4">
                Upgrade via email to{' '}
                <a href="mailto:info@prop-ready.co.za" className="text-gold hover:underline">
                    info@prop-ready.co.za
                </a>
            </p>
        </div>
    );
}
