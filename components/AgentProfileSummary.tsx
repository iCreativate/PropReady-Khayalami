'use client';

import Link from 'next/link';
import {
    Building2,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import { getAgentPlanBadge, getPlanDisplay, isFreeBuyerPlan, normalizeBuyerPlan } from '@/lib/agent-plans';
import { formatVerificationLabel, getAgentInitials } from '@/lib/agent-profile';
import type { AgentPortalAgent } from '@/components/AgentPortalNav';

export interface AgentProfileDetails extends AgentPortalAgent {
    phone?: string;
    city?: string;
    verificationStatus?: string;
    ppraNumber?: string;
}

interface AgentProfileSummaryProps {
    agent: AgentProfileDetails;
    variant?: 'compact' | 'full';
}

function PlanBadge({ plan, sellerPlan }: { plan?: string; sellerPlan?: string }) {
    const isFree = isFreeBuyerPlan(plan);
    const label = getAgentPlanBadge(plan, sellerPlan);
    const planName = getPlanDisplay(plan);

    return (
        <Link
            href="/agents/plan"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-90 ${
                isFree
                    ? 'bg-charcoal/8 text-charcoal/70 border border-charcoal/15'
                    : 'bg-gold/15 text-gold border border-gold/30'
            }`}
        >
            <Sparkles className={`w-3 h-3 ${isFree ? 'text-charcoal/50' : 'text-gold'}`} />
            {isFree ? label : planName}
            {!isFree && sellerPlan && sellerPlan !== 'none' && (
                <span className="text-charcoal/50 font-normal">+ seller</span>
            )}
            <ChevronRight className="w-3 h-3 opacity-60" />
        </Link>
    );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-9 h-9 text-sm',
        md: 'w-12 h-12 text-base',
        lg: 'w-20 h-20 text-2xl',
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white shrink-0`}
            aria-hidden
        >
            {getAgentInitials(name)}
        </div>
    );
}

function VerificationPill({ status }: { status?: string }) {
    const s = (status || '').toLowerCase();
    const styles =
        s === 'verified'
            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25'
            : s === 'rejected'
              ? 'bg-red-500/10 text-red-700 border-red-500/25'
              : 'bg-amber-500/10 text-amber-800 border-amber-500/25';

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${styles}`}
        >
            <ShieldCheck className="w-3 h-3" />
            {formatVerificationLabel(status)}
        </span>
    );
}

export function AgentProfileCompact({ agent }: { agent: AgentProfileDetails }) {
    return (
        <Link
            href="/agents/settings"
            className="hidden sm:flex items-center gap-3 pl-3 pr-1 py-1.5 rounded-xl border border-charcoal/10 bg-white/60 hover:bg-white hover:border-gold/25 hover:shadow-sm transition-all group"
        >
            <Avatar name={agent.fullName} size="sm" />
            <div className="text-left min-w-0 max-w-[160px] lg:max-w-[200px]">
                <p className="text-charcoal font-semibold text-sm truncate leading-tight group-hover:text-gold transition-colors">
                    {agent.fullName}
                </p>
                {agent.company && (
                    <p className="text-charcoal/50 text-[11px] truncate leading-tight">{agent.company}</p>
                )}
            </div>
            <PlanBadge plan={agent.plan} sellerPlan={agent.sellerPlan} />
        </Link>
    );
}

export default function AgentProfileSummary({
    agent,
    variant = 'full',
}: AgentProfileSummaryProps) {
    if (variant === 'compact') {
        return <AgentProfileCompact agent={agent} />;
    }

    const buyerPlanKey = normalizeBuyerPlan(agent.plan);
    const isFree = buyerPlanKey === 'free';

    return (
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-white via-gold/[0.04] to-gold/10 shadow-sm mb-8">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

            <div className="relative p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <Avatar name={agent.fullName} size="lg" />

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <VerificationPill status={agent.verificationStatus} />
                            <PlanBadge plan={agent.plan} sellerPlan={agent.sellerPlan} />
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold text-charcoal mb-1 truncate">
                            {agent.fullName}
                        </h2>

                        {agent.company && (
                            <p className="text-charcoal/70 font-medium flex items-center gap-2 mb-4">
                                <Building2 className="w-4 h-4 text-gold shrink-0" />
                                {agent.company}
                            </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {agent.email && (
                                <div className="flex items-center gap-2.5 text-sm text-charcoal/70 min-w-0">
                                    <span className="w-8 h-8 rounded-lg bg-charcoal/5 flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4 text-charcoal/50" />
                                    </span>
                                    <span className="truncate">{agent.email}</span>
                                </div>
                            )}
                            {agent.phone && (
                                <div className="flex items-center gap-2.5 text-sm text-charcoal/70">
                                    <span className="w-8 h-8 rounded-lg bg-charcoal/5 flex items-center justify-center shrink-0">
                                        <Phone className="w-4 h-4 text-charcoal/50" />
                                    </span>
                                    <span>{agent.phone}</span>
                                </div>
                            )}
                            {agent.city && (
                                <div className="flex items-center gap-2.5 text-sm text-charcoal/70">
                                    <span className="w-8 h-8 rounded-lg bg-charcoal/5 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-charcoal/50" />
                                    </span>
                                    <span>{agent.city}</span>
                                </div>
                            )}
                            {agent.ppraNumber && (
                                <div className="flex items-center gap-2.5 text-sm text-charcoal/70">
                                    <span className="w-8 h-8 rounded-lg bg-charcoal/5 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-4 h-4 text-charcoal/50" />
                                    </span>
                                    <span>PPRA #{agent.ppraNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:text-right shrink-0">
                        <p className="text-xs uppercase tracking-wider text-charcoal/50 font-semibold mb-1">
                            Current plan
                        </p>
                        <p className={`text-xl font-bold ${isFree ? 'text-charcoal/70' : 'text-gold'}`}>
                            {getPlanDisplay(agent.plan)}
                        </p>
                        <Link
                            href="/agents/plan"
                            className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-gold hover:text-gold-600 transition"
                        >
                            View plans & upgrade
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
