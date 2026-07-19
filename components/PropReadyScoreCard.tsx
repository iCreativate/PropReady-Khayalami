'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    AlertCircle,
    ArrowRight,
    Brain,
    CheckCircle2,
    CircleDashed,
    ShieldCheck,
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
import { confirmFullPrequalAmount } from '@/lib/buyer-full-prequal';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import {
    PORTAL_CALLOUT,
    PORTAL_CARD,
    PORTAL_INPUT,
    PORTAL_PRIMARY_BTN,
    PORTAL_SECONDARY_BTN,
    PORTAL_STAT_ICON,
    PORTAL_TEXT_SECONDARY,
} from '@/lib/portal-ui';

interface PropReadyScoreCardProps {
    result: BuyerQuizResult | null;
    userId?: string;
    documents?: BuyerDocument[];
    viewingCount?: number;
    preQualAmount?: number;
    depositSavedLabel?: string;
    monthlyDebtLabel?: string | null;
    showDebtNote?: boolean;
    onFullPrequalUpdated?: () => void;
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
    userId,
    documents = [],
    viewingCount = 0,
    preQualAmount = 0,
    depositSavedLabel,
    monthlyDebtLabel,
    showDebtNote,
    onFullPrequalUpdated,
}: PropReadyScoreCardProps) {
    const [amountInput, setAmountInput] = useState('');
    const [amountError, setAmountError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const insights = useMemo(
        () =>
            buildPropReadyScoreInsights(result, {
                documents,
                viewingCount,
                userId,
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey forces recompute after localStorage write
        [result, documents, viewingCount, userId, refreshKey]
    );

    const hasScore = Boolean(result && (result.score != null || result.preQualAmount != null));
    const displayPreQual = insights.prequal.displayAmount || preQualAmount || result?.preQualAmount || 0;
    const showConfirmForm =
        Boolean(userId) &&
        !insights.prequal.isFull &&
        (insights.prequal.isAwaitingFull || insights.prequal.letterUploaded);

    function handleConfirmAmount(e: React.FormEvent) {
        e.preventDefault();
        if (!userId) return;
        const digits = amountInput.replace(/[^\d]/g, '');
        const amount = digits ? Number(digits) : 0;
        if (!amount || amount < 50000) {
            setAmountError('Enter the official amount from your originator letter (min R50,000).');
            return;
        }
        setAmountError('');
        confirmFullPrequalAmount({
            userId,
            amount,
            softAmount: result?.preQualAmount ?? null,
        });

        // Keep quiz result in sync so suggested properties / search use the full figure
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.quizResult);
            if (raw) {
                const quiz = JSON.parse(raw) as Record<string, unknown>;
                quiz.preQualAmount = amount;
                quiz.fullPrequalAmount = amount;
                quiz.prequalMode = 'full';
                localStorage.setItem(STORAGE_KEYS.quizResult, JSON.stringify(quiz));
            }
        } catch {
            /* ignore */
        }

        setAmountInput('');
        setRefreshKey((k) => k + 1);
        onFullPrequalUpdated?.();
    }

    return (
        <div className={`${PORTAL_CARD} p-6 sm:p-8 mb-8 sm:mb-10 overflow-hidden`}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {insights.prequal.isFull ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Full originator prequal
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Soft pre-qualification
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/[0.06] border border-gold/15 text-gold text-xs font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI readiness insight
                        </span>
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

            <div
                className={`rounded-2xl border px-4 py-3 mb-8 text-sm leading-relaxed ${
                    insights.prequal.isFull
                        ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                        : 'border-amber-200 bg-amber-50/90 text-amber-950'
                }`}
                role="note"
            >
                <p className="font-semibold mb-1">
                    {insights.prequal.isFull ? 'Full pre-qualification active' : 'Disclaimer — soft pre-qualification'}
                </p>
                <p className="text-[13px] opacity-90">{insights.disclaimer}</p>
                {insights.prequal.isSoft && insights.prequal.softAmount > 0 ? (
                    <p className="text-[13px] mt-2 opacity-90">
                        Soft quiz estimate: {formatCurrency(insights.prequal.softAmount)}. After a full bond-originator
                        prequal, this amount updates and the recommendation set expands.
                    </p>
                ) : null}
                {insights.prequal.isFull && insights.prequal.softAmount > 0 ? (
                    <p className="text-[13px] mt-2 opacity-90">
                        Previous soft estimate: {formatCurrency(insights.prequal.softAmount)} → now using your
                        originator amount.
                    </p>
                ) : null}
            </div>

            {showConfirmForm ? (
                <form
                    onSubmit={handleConfirmAmount}
                    className="rounded-2xl border border-charcoal/[0.08] bg-charcoal/[0.02] p-4 sm:p-5 mb-8"
                >
                    <h3 className="text-sm font-semibold text-charcoal mb-1">
                        Enter your official full prequal amount
                    </h3>
                    <p className={`text-xs mb-3 ${PORTAL_TEXT_SECONDARY}`}>
                        Use the figure on your bond originator / bank letter. This replaces the soft estimate and unlocks
                        full recommendations.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 1 850 000"
                            value={amountInput}
                            onChange={(e) => setAmountInput(e.target.value)}
                            className={PORTAL_INPUT}
                            aria-label="Official full pre-qualification amount"
                        />
                        <button type="submit" className={`${PORTAL_PRIMARY_BTN} shrink-0`}>
                            Update prequal
                        </button>
                    </div>
                    {amountError ? <p className="text-xs text-red-600 mt-2">{amountError}</p> : null}
                </form>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-8">
                <div className="portal-stat-inner">
                    <p className="text-charcoal/45 text-xs font-medium mb-2 uppercase tracking-[0.08em]">
                        {insights.prequal.isFull ? 'Full Pre-Qualification' : 'Soft Pre-Qualification'}
                    </p>
                    <p className="text-charcoal font-bold text-xl">{formatCurrency(displayPreQual)}</p>
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
                                {insights.recommendationTitle}
                            </h3>
                            <p className={`text-xs ${PORTAL_TEXT_SECONDARY}`}>
                                {insights.recommendationSubtitle}
                            </p>
                        </div>
                        {!hasScore ? (
                            <Link href="/quiz" className={PORTAL_PRIMARY_BTN}>
                                Take assessment
                            </Link>
                        ) : insights.prequal.isFull ? (
                            <Link href="/dashboard/documents" className={PORTAL_SECONDARY_BTN}>
                                Manage originator docs
                            </Link>
                        ) : (
                            <Link href="/dashboard/documents" className={PORTAL_PRIMARY_BTN}>
                                Get full prequal
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
