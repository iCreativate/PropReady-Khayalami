'use client';

import Link from 'next/link';
import {
    ArrowRight,
    Brain,
    CheckCircle2,
    CircleDashed,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import {
    buildPropReadyScoreInsights,
    type AiRecommendation,
    type ScoreFactor,
} from '@/lib/propready-score-insights';
import type { BuyerQuizResult } from '@/lib/quiz-result';
import type { BuyerDocument } from '@/lib/buyer-documents';
import {
    PORTAL_CALLOUT,
    PORTAL_CARD,
    PORTAL_PRIMARY_BTN,
    PORTAL_SECONDARY_BTN,
    PORTAL_STAT_ICON,
    PORTAL_TEXT_SECONDARY,
} from '@/lib/portal-ui';

interface PropReadyScoreCardProps {
    result: BuyerQuizResult | null;
    documents?: BuyerDocument[];
    viewingCount?: number;
    preQualAmount?: number;
    depositSavedLabel?: string;
    monthlyDebtLabel?: string | null;
    showDebtNote?: boolean;
}

function factorBarColor(status: ScoreFactor['status']) {
    if (status === 'strong') return 'bg-emerald-500';
    if (status === 'ok') return 'bg-gold';
    return 'bg-charcoal/25';
}

function priorityStyles(priority: AiRecommendation['priority']) {
    if (priority === 'high') {
        return 'border-gold/25 bg-gold/[0.04] text-gold';
    }
    if (priority === 'medium') {
        return 'border-charcoal/[0.1] bg-charcoal/[0.02] text-charcoal/55';
    }
    return 'border-charcoal/[0.08] bg-white text-charcoal/45';
}

export default function PropReadyScoreCard({
    result,
    documents = [],
    viewingCount = 0,
    preQualAmount = 0,
    depositSavedLabel,
    monthlyDebtLabel,
    showDebtNote,
}: PropReadyScoreCardProps) {
    const insights = buildPropReadyScoreInsights(result, { documents, viewingCount });
    const hasScore = Boolean(result && (result.score != null || result.preQualAmount != null));

    return (
        <div className={`${PORTAL_CARD} p-6 sm:p-8 mb-8 sm:mb-10 overflow-hidden`}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/[0.06] border border-gold/15 text-gold text-xs font-semibold mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI readiness insight
                    </div>
                    <h2 className="text-2xl font-semibold text-charcoal tracking-tight mb-2">
                        Your PropReady Score
                    </h2>
                    <p className={`text-sm max-w-xl ${PORTAL_TEXT_SECONDARY}`}>{insights.summary}</p>
                </div>
                <div className="text-left lg:text-right shrink-0">
                    <div className="text-5xl font-bold text-gold mb-1 tabular-nums">
                        {insights.score}%
                    </div>
                    <p className={`text-sm font-medium ${PORTAL_TEXT_SECONDARY}`}>{insights.label}</p>
                    {insights.projectedBoost > 0 && hasScore ? (
                        <p className="text-xs text-emerald-700 mt-2 inline-flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Up to +{insights.projectedBoost} pts possible
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-8">
                <div className="portal-stat-inner">
                    <p className="text-charcoal/45 text-xs font-medium mb-2 uppercase tracking-[0.08em]">
                        Pre-Qualification
                    </p>
                    <p className="text-charcoal font-bold text-xl">
                        {formatCurrency(preQualAmount || result?.preQualAmount || 0)}
                    </p>
                </div>
                <div className="portal-stat-inner">
                    <p className="text-charcoal/45 text-xs font-medium mb-2 uppercase tracking-[0.08em]">
                        Monthly Budget
                    </p>
                    <p className="text-charcoal font-bold text-xl">
                        {formatCurrency(insights.monthlyBudget)}
                    </p>
                </div>
                <div className="portal-stat-inner">
                    <p className="text-charcoal/45 text-xs font-medium mb-2 uppercase tracking-[0.08em]">
                        Deposit Saved
                    </p>
                    <p className="text-charcoal font-bold text-xl whitespace-nowrap">
                        {depositSavedLabel ?? formatCurrency(insights.depositAmount)}
                    </p>
                    {showDebtNote && monthlyDebtLabel ? (
                        <p className="text-charcoal/45 text-xs mt-2">
                            Monthly debt: {monthlyDebtLabel}
                        </p>
                    ) : insights.depositPctOfPreQual != null ? (
                        <p className="text-charcoal/45 text-xs mt-2">
                            ~{insights.depositPctOfPreQual}% of pre-qual
                        </p>
                    ) : null}
                </div>
            </div>

            <p className={`text-sm leading-relaxed mb-8 ${PORTAL_TEXT_SECONDARY}`}>
                {insights.narrative}
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={PORTAL_STAT_ICON}>
                            <Brain className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-charcoal">Score factors</h3>
                            <p className={`text-xs ${PORTAL_TEXT_SECONDARY}`}>How your score is built</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {insights.factors.map((factor) => {
                            const pct = Math.round((factor.points / factor.maxPoints) * 100);
                            return (
                                <div key={factor.id}>
                                    <div className="flex items-center justify-between gap-3 mb-1.5">
                                        <span className="text-sm font-medium text-charcoal">
                                            {factor.label}
                                        </span>
                                        <span className={`text-xs tabular-nums ${PORTAL_TEXT_SECONDARY}`}>
                                            {factor.points}/{factor.maxPoints}
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-charcoal/[0.06] overflow-hidden mb-1.5">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${factorBarColor(factor.status)}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className={`text-xs leading-relaxed ${PORTAL_TEXT_SECONDARY}`}>
                                        {factor.detail}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="xl:col-span-3 space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <h3 className="text-sm font-semibold text-charcoal">
                                AI recommendations
                            </h3>
                            <p className={`text-xs ${PORTAL_TEXT_SECONDARY}`}>
                                Next best actions ranked by impact
                            </p>
                        </div>
                        {!hasScore ? (
                            <Link href="/quiz" className={PORTAL_PRIMARY_BTN}>
                                Take assessment
                            </Link>
                        ) : (
                            <Link href="/quiz" className={PORTAL_SECONDARY_BTN}>
                                Update assessment
                            </Link>
                        )}
                    </div>

                    <div className="space-y-3">
                        {insights.recommendations.map((rec) => (
                            <div
                                key={rec.id}
                                className="rounded-2xl border border-charcoal/[0.07] bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4"
                            >
                                <div className="shrink-0 pt-0.5">
                                    {rec.priority === 'high' ? (
                                        <CheckCircle2 className="w-5 h-5 text-gold" />
                                    ) : (
                                        <CircleDashed className="w-5 h-5 text-charcoal/30" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <span
                                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] border ${priorityStyles(rec.priority)}`}
                                        >
                                            {rec.priority} impact
                                        </span>
                                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-charcoal/[0.04] text-charcoal/50 border border-charcoal/[0.06]">
                                            {rec.feature}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-charcoal mb-1">
                                        {rec.title}
                                    </h4>
                                    <p className={`text-sm leading-relaxed ${PORTAL_TEXT_SECONDARY}`}>
                                        {rec.body}
                                    </p>
                                    {rec.href && rec.cta ? (
                                        <Link
                                            href={rec.href}
                                            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-gold hover:text-gold-700 transition"
                                        >
                                            {rec.cta}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`${PORTAL_CALLOUT} mt-2`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold mb-3">
                            Built-in AI features
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {insights.aiFeatures.map((feature) => (
                                <div key={feature.id}>
                                    <p className="text-sm font-semibold text-charcoal mb-0.5">
                                        {feature.title}
                                    </p>
                                    <p className={`text-xs leading-relaxed ${PORTAL_TEXT_SECONDARY}`}>
                                        {feature.body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
