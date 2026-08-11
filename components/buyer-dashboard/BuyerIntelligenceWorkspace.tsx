'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
    ArrowRight,
    Brain,
    Building2,
    Calculator,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    Clock,
    ExternalLink,
    Eye,
    FileSearch,
    FileText,
    Home,
    KeyRound,
    Landmark,
    LineChart,
    MapPin,
    MessageSquare,
    Phone,
    Scale,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    TrendingUp,
    Upload,
    Wallet,
} from 'lucide-react';
import BuyerDocumentPreviewModal from '@/components/BuyerDocumentPreviewModal';
import RepoRateBanner from '@/components/market/RepoRateBanner';
import { formatCurrency } from '@/lib/currency';
import { useLiveBondOriginators } from '@/hooks/useLiveBondOriginators';
import type { BondOriginator } from '@/lib/bond-originators';
import {
    BUYER_DOCUMENT_SLOTS,
    type BuyerDocument,
} from '@/lib/buyer-documents';
import type { ListedProperty } from '@/lib/listed-property';
import { buildPropReadyScoreInsights } from '@/lib/propready-score-insights';
import {
    calculateMonthlyBondBudget,
    getPropReadyScoreLabel,
    parseStoredAmount,
    type BuyerQuizResult,
} from '@/lib/quiz-result';
import '@/app/dashboard/buyer-intelligence.css';

type MatchedListing = ListedProperty & { matchScore: number };

export type BuyerIntelligenceWorkspaceProps = {
    user: { id?: string; fullName?: string; email?: string };
    quizResult: (BuyerQuizResult & { monthlyDebt?: string | null; hasDebt?: boolean }) | null;
    documents: BuyerDocument[];
    viewings: Array<{
        id: string;
        propertyTitle?: string;
        propertyAddress?: string;
        propertyPrice?: number;
        date: string;
        time?: string;
        status: string;
        notes?: string;
    }>;
    suggestedProperties: MatchedListing[];
    sellerInfo?: {
        currentValue?: string | number;
        propertyType?: string;
        timeline?: string;
    } | null;
    onFullPrequalUpdated?: () => void;
};

const ORIGINATOR_META: Record<
    string,
    {
        successRate: string;
        speed: string;
        response: string;
        banks: string;
        rating: string;
        years: string;
        fees: string;
        strength: string;
        suited: string;
    }
> = {
    'sa-home-loans': {
        successRate: '91%',
        speed: '3–5 days',
        response: '< 4 hrs',
        banks: 'Specialist + majors',
        rating: '4.7',
        years: '20+',
        fees: 'Free to buyer',
        strength: 'Flexible structures',
        suited: 'Complex income profiles',
    },
    betterbond: {
        successRate: '94%',
        speed: '2–4 days',
        response: '< 2 hrs',
        banks: 'All majors',
        rating: '4.8',
        years: '25+',
        fees: 'Free to buyer',
        strength: 'Bank comparison',
        suited: 'First-time buyers',
    },
    ooba: {
        successRate: '93%',
        speed: '2–4 days',
        response: '< 3 hrs',
        banks: 'Major banks',
        rating: '4.8',
        years: '20+',
        fees: 'Free to buyer',
        strength: 'Fast turnaround',
        suited: 'Time-sensitive deals',
    },
    multinet: {
        successRate: '90%',
        speed: '3–6 days',
        response: '< 5 hrs',
        banks: 'Major banks',
        rating: '4.6',
        years: '15+',
        fees: 'Free to buyer',
        strength: 'Personal support',
        suited: 'Guided applications',
    },
    mortgageplus: {
        successRate: '89%',
        speed: '3–5 days',
        response: '< 6 hrs',
        banks: 'Selected banks',
        rating: '4.5',
        years: '12+',
        fees: 'Free to buyer',
        strength: 'Application polish',
        suited: 'Self-employed buyers',
    },
};

const JOURNEY = [
    {
        id: 'quiz',
        label: 'Qualification Quiz',
        href: '/quiz',
        icon: ClipboardCheck,
        tip: 'Capture income, deposit and readiness so PropReady can estimate confidence.',
        eta: 'Day 1',
    },
    {
        id: 'soft',
        label: 'Soft Prequalification',
        href: '/dashboard/prequal',
        icon: Sparkles,
        tip: 'See an educational affordability band before you speak to banks.',
        eta: 'Day 1–2',
    },
    {
        id: 'documents',
        label: 'Upload Documents',
        href: '/dashboard/documents',
        icon: Upload,
        tip: 'ID, residence, income and statements unlock a fuller prequal pack.',
        eta: 'Day 2–5',
    },
    {
        id: 'full',
        label: 'Full Bond Pre-Approval',
        href: '/dashboard/documents',
        icon: Building2,
        tip: 'An originator shops banks with your pack for a stronger approval signal.',
        eta: 'Week 1–2',
    },
    {
        id: 'search',
        label: 'Property Search',
        href: '/search',
        icon: Search,
        tip: 'Shop inside your buying power — not wishful stretch prices.',
        eta: 'Week 1–3',
    },
    {
        id: 'viewing',
        label: 'Property Viewing',
        href: '/dashboard/viewings',
        icon: Home,
        tip: 'Inspect condition, neighbourhood fit and negotiation levers on site.',
        eta: 'Week 2–4',
    },
    {
        id: 'otp',
        label: 'Offer to Purchase',
        href: '/learn',
        icon: FileSearch,
        tip: 'Structure price, suspensive conditions and timelines carefully.',
        eta: 'Week 3–5',
    },
    {
        id: 'approval',
        label: 'Bond Approval',
        href: '/learn',
        icon: CheckCircle2,
        tip: 'Bank issues formal grant subject to valuation and conditions.',
        eta: 'Week 4–7',
    },
    {
        id: 'transfer',
        label: 'Transfer Attorneys',
        href: '/conveyancers',
        icon: Scale,
        tip: 'Conveyancers run transfer, guarantees and Deeds Office lodging.',
        eta: 'Week 6–12',
    },
    {
        id: 'registration',
        label: 'Registration',
        href: '/conveyancers',
        icon: FileText,
        tip: 'Ownership registers in your name at the Deeds Office.',
        eta: 'Week 8–14',
    },
    {
        id: 'keys',
        label: 'Collect Your Keys',
        href: '/property-iq',
        icon: KeyRound,
        tip: 'Take occupation and track equity growth in Property IQ.',
        eta: 'Handover day',
    },
] as const;

function firstName(full?: string) {
    if (!full?.trim()) return 'there';
    return full.trim().split(/\s+/)[0];
}

function sparkHeights(seed: number) {
    return [28, 42, 35, 55, 48, 68, 60, 78, 70, 88].map((h, i) => Math.max(18, (h + ((seed + i) % 17)) % 92));
}

function gradeColor(score: number) {
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#e53935';
}

function idealPropertyType(budget: number) {
    if (budget <= 0) return 'Complete quiz to unlock types';
    if (budget < 800000) return 'Studio / compact apartment';
    if (budget < 1400000) return '2-bed apartment or townhouse';
    if (budget < 2500000) return '3-bed family home';
    return 'Premium family / cluster home';
}

function suburbHint(budget: number, city?: string) {
    const base = city?.trim() || 'your city';
    if (budget <= 0) return `Map suburbs in ${base} after prequal`;
    if (budget < 1200000) return `Value nodes near ${base} transit corridors`;
    if (budget < 2200000) return `Established suburbs around ${base}`;
    return `Prime family suburbs in ${base}`;
}

export default function BuyerIntelligenceWorkspace({
    user,
    quizResult,
    documents,
    viewings,
    suggestedProperties: _suggestedProperties,
    sellerInfo,
    onFullPrequalUpdated: _onFullPrequalUpdated,
}: BuyerIntelligenceWorkspaceProps) {
    const [previewDoc, setPreviewDoc] = useState<BuyerDocument | null>(null);
    const [selectedOriginator, setSelectedOriginator] = useState<BondOriginator | null>(null);
    const { originators: liveOriginators, loading: liveOriginatorsLoading } = useLiveBondOriginators();

    const insights = useMemo(
        () =>
            buildPropReadyScoreInsights(quizResult, {
                userId: user.id,
                documents,
                viewingCount: viewings.length,
            }),
        [quizResult, user.id, documents, viewings.length]
    );

    const score = insights.score;
    const preQual = insights.prequal.displayAmount || quizResult?.preQualAmount || 0;
    const monthlyBudget = insights.monthlyBudget || calculateMonthlyBondBudget(preQual);
    const deposit = insights.depositAmount;
    const income = parseStoredAmount(quizResult?.monthlyIncome);
    const expenses = parseStoredAmount(quizResult?.expenses);
    const name = firstName(user.fullName || quizResult?.fullName);
    const docsUploaded = documents.length;
    const docsTotal = BUYER_DOCUMENT_SLOTS.length;
    const idealDeposit = Math.round(preQual * 0.1) || 0;
    const depositPctIdeal = idealDeposit > 0 ? Math.min(100, Math.round((deposit / idealDeposit) * 100)) : 0;

    const nextMilestone =
        insights.recommendations[0]?.title ||
        (!quizResult
            ? 'Complete your buyer quiz'
            : docsUploaded < docsTotal
              ? 'Upload proof of income'
              : 'Speak to a bond originator');
    const nextMilestoneHref =
        insights.recommendations[0]?.href || (!quizResult ? '/quiz' : '/dashboard/documents');

    const journeyStates = useMemo(() => {
        const quizDone = Boolean(quizResult);
        const softDone = quizDone && preQual > 0;
        const hasDocs = docsUploaded > 0;
        const fullDocs = docsUploaded >= 3;
        const hasViewing = viewings.length > 0;

        return JOURNEY.map((step) => {
            let status: 'done' | 'current' | 'todo' = 'todo';
            if (step.id === 'quiz' && quizDone) status = 'done';
            if (step.id === 'soft' && softDone) status = 'done';
            if (step.id === 'documents' && fullDocs) status = 'done';
            else if (step.id === 'documents' && hasDocs) status = 'current';
            if (step.id === 'full' && fullDocs) status = 'current';
            if (step.id === 'viewing' && hasViewing) status = 'done';
            if (!quizDone && step.id === 'quiz') status = 'current';
            if (quizDone && !softDone && step.id === 'soft') status = 'current';
            if (softDone && !hasDocs && step.id === 'documents') status = 'current';
            return { ...step, status };
        }).map((step, _i, arr) => {
            const hasCurrent = arr.some((s) => s.status === 'current');
            if (!hasCurrent && step.status === 'todo') {
                const firstTodo = arr.findIndex((s) => s.status === 'todo');
                if (arr.findIndex((s) => s.id === step.id) === firstTodo) {
                    return { ...step, status: 'current' as const };
                }
            }
            return step;
        });
    }, [quizResult, docsUploaded, preQual, viewings.length]);

    const journeyPct = Math.round(
        (journeyStates.filter((s) => s.status === 'done').length / journeyStates.length) * 100
    );

    const topRecs = insights.recommendations.slice(0, 3);
    const nextViewing = viewings[0];
    const transferEstimate = preQual ? Math.round(preQual * 0.04 + 25000) : 0;
    const ownershipMonthly = monthlyBudget
        ? Math.round(monthlyBudget + (preQual > 0 ? preQual * 0.0008 : 0) + 1800)
        : 0;

    const gauges = [
        {
            label: 'Income allocation',
            pct: income ? Math.min(100, Math.round(((expenses || income * 0.35) / income) * 100)) : 12,
            color: '#2563eb',
            display: income ? `${Math.min(100, Math.round(((expenses || income * 0.35) / income) * 100))}%` : '—',
        },
        {
            label: 'Debt load',
            pct: Math.min(100, Math.round(insights.debtToIncomePct || 8)),
            color: insights.debtToIncomePct && insights.debtToIncomePct > 30 ? '#e53935' : '#f59e0b',
            display: insights.debtToIncomePct != null ? `${Math.round(insights.debtToIncomePct)}%` : 'Low',
        },
        {
            label: 'Savings ratio',
            pct: Math.min(100, depositPctIdeal || (deposit > 0 ? 35 : 8)),
            color: '#22c55e',
            display: depositPctIdeal ? `${depositPctIdeal}%` : deposit ? 'On track' : '—',
        },
        {
            label: 'Housing cost',
            pct: income && monthlyBudget ? Math.min(100, Math.round((monthlyBudget / income) * 100)) : 18,
            color: '#e53935',
            display:
                income && monthlyBudget
                    ? `${Math.min(100, Math.round((monthlyBudget / income) * 100))}%`
                    : '—',
        },
        {
            label: 'Risk profile',
            pct: Math.max(8, 100 - score),
            color: gradeColor(score),
            display: score >= 65 ? 'Steady' : score >= 40 ? 'Watch' : 'Elevated',
        },
    ];

    const activity = [
        {
            icon: quizResult ? CheckCircle2 : Sparkles,
            title: quizResult ? 'Qualification quiz completed' : 'Buyer quiz still outstanding',
            detail: quizResult ? 'Confidence baseline is on file.' : 'Start here to unlock affordability.',
            when: quizResult ? 'On file' : 'Now',
            status: quizResult ? 'Done' : 'Action',
        },
        {
            icon: FileText,
            title:
                docsUploaded > 0
                    ? `${docsUploaded} document${docsUploaded === 1 ? '' : 's'} in vault`
                    : 'Document vault empty',
            detail: docsUploaded > 0 ? 'Keep uploads current for originators.' : 'ID and income unlock full prequal.',
            when: 'Docs',
            status: docsUploaded >= 3 ? 'Strong' : docsUploaded > 0 ? 'Pending' : 'Missing',
        },
        {
            icon: Calendar,
            title: viewings.length > 0 ? `${viewings.length} viewing${viewings.length === 1 ? '' : 's'} booked` : 'No viewings yet',
            detail: viewings.length > 0 ? 'Diary is live with your agent.' : 'Book once shortlists are ready.',
            when: 'Diary',
            status: viewings.length > 0 ? 'Active' : 'Soon',
        },
        {
            icon: Brain,
            title: topRecs[0]?.title || 'AI coach standing by',
            detail: topRecs[0]?.body || 'Recommendations appear after quiz + docs.',
            when: 'AI',
            status: 'Tip',
        },
        {
            icon: MessageSquare,
            title: 'Messages & system updates',
            detail: 'Originator and agent threads stay in your inbox.',
            when: 'Inbox',
            status: 'Live',
        },
    ];

    return (
        <div className="biw">
            <div className="biw-shell">
                <div className="biw-main">
                    <RepoRateBanner variant="dashboard" />

                    {/* HERO */}
                    <section className="biw-hero">
                        <div className="biw-hero-grid">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                                    Buyer intelligence
                                </p>
                                <h2 className="biw-hero-title">
                                    Welcome back, {name} <span aria-hidden="true">👋</span>
                                </h2>
                                <p className="biw-hero-sub">
                                    Here&apos;s where your buying journey stands today.
                                </p>

                                <div className="mt-6 flex flex-wrap items-center gap-5">
                                    <div
                                        className="biw-ring"
                                        style={{ ['--p' as string]: String(score) }}
                                        aria-label={`Buying confidence ${score}%`}
                                    >
                                        <div className="text-center">
                                            <div className="biw-ring-value">{score}%</div>
                                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                                                Confidence
                                            </div>
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-3">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                                                Next milestone
                                            </p>
                                            <p className="mt-1 text-base font-semibold tracking-tight text-white">
                                                {nextMilestone}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wide text-white/40">
                                                    Affordability
                                                </p>
                                                <p className="font-semibold tabular-nums text-white">
                                                    {preQual ? formatCurrency(preQual) : '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wide text-white/40">
                                                    Monthly target
                                                </p>
                                                <p className="font-semibold tabular-nums text-white">
                                                    {monthlyBudget ? formatCurrency(monthlyBudget) : '—'}
                                                </p>
                                            </div>
                                        </div>
                                        {nextViewing ? (
                                            <p className="text-xs text-white/60">
                                                Next viewing · {new Date(nextViewing.date).toLocaleDateString()}{' '}
                                                {nextViewing.time || ''}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="biw-hero-glass">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                                    Today&apos;s pulse
                                </p>
                                <div className="mt-3 space-y-3">
                                    {[
                                        { label: 'Score grade', value: getPropReadyScoreLabel(score) },
                                        {
                                            label: 'Deposit saved',
                                            value: deposit ? formatCurrency(deposit) : 'Add deposit',
                                        },
                                        {
                                            label: 'Docs complete',
                                            value: `${docsUploaded}/${docsTotal}`,
                                        },
                                        {
                                            label: 'Journey progress',
                                            value: `${journeyPct}%`,
                                        },
                                    ].map((row) => (
                                        <div
                                            key={row.label}
                                            className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5 last:border-0 last:pb-0"
                                        >
                                            <span className="text-xs text-white/55">{row.label}</span>
                                            <span className="text-sm font-semibold tabular-nums text-white">
                                                {row.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <Link href={nextMilestoneHref} className="biw-cta biw-cta--primary mt-5 w-full">
                                    Continue
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* KPIs */}
                    <section className="biw-kpis" aria-label="Key metrics">
                        {[
                            {
                                label: 'Buying capacity',
                                value: preQual
                                    ? formatCurrency(preQual)
                                    : sellerInfo?.currentValue
                                      ? formatCurrency(
                                            Number(String(sellerInfo.currentValue).replace(/[^\d]/g, '') || 0)
                                        )
                                      : '—',
                                trend: preQual ? '+est.' : 'Set quiz',
                                hint: idealPropertyType(preQual),
                                seed: 3,
                            },
                            {
                                label: 'Monthly budget',
                                value: monthlyBudget ? formatCurrency(monthlyBudget) : '—',
                                trend:
                                    income && monthlyBudget
                                        ? `${Math.round((monthlyBudget / income) * 100)}% of income`
                                        : 'Comfort band',
                                hint:
                                    income && monthlyBudget && monthlyBudget / income <= 0.3
                                        ? 'Comfortable housing stretch'
                                        : 'Watch instalment pressure',
                                seed: 7,
                            },
                            {
                                label: 'Estimated approval',
                                value: `${Math.min(98, Math.max(35, score + 8))}%`,
                                trend: score >= 65 ? 'High confidence' : 'Building',
                                hint:
                                    score >= 65
                                        ? 'Docs + deposit will lock this in'
                                        : 'Improve score factors to lift odds',
                                seed: 11,
                            },
                            {
                                label: 'Deposit saved',
                                value: deposit ? formatCurrency(deposit) : '—',
                                trend: idealDeposit ? `${depositPctIdeal}% of ideal 10%` : 'Track progress',
                                hint: idealDeposit
                                    ? `Target ~${formatCurrency(idealDeposit)} for a healthier LTV`
                                    : 'Deposit progress unlocks after prequal',
                                seed: 15,
                            },
                        ].map((kpi) => (
                            <article key={kpi.label} className="biw-panel biw-kpi">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="biw-kpi-label">{kpi.label}</p>
                                    <Wallet className="h-3.5 w-3.5 text-[#e53935]/75" />
                                </div>
                                <p className="biw-kpi-value">{kpi.value}</p>
                                <p className="text-[11px] font-semibold text-[#22c55e]">{kpi.trend}</p>
                                <p className="biw-kpi-hint">{kpi.hint}</p>
                                <div className="biw-spark" aria-hidden>
                                    {sparkHeights(kpi.seed).map((h, i) => (
                                        <span key={i} style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </article>
                        ))}
                    </section>

                    {/* Journey + AI */}
                    <section className="biw-split biw-split--65-35">
                        <article className="biw-panel biw-panel--static biw-journey-panel p-5 sm:p-6">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h3 className="biw-sec-title">Home ownership journey</h3>
                                    <p className="biw-sec-sub">Interactive milestones from quiz to keys</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold tabular-nums text-[#e53935]">{journeyPct}%</p>
                                    <p className="text-[11px] text-black/45">Estimated completion: 2–4 weeks</p>
                                </div>
                            </div>
                            <div className="biw-progress mt-3">
                                <span style={{ width: `${journeyPct}%` }} />
                            </div>
                            <div className="biw-journey">
                                {journeyStates.map((step) => {
                                    const Icon = step.icon;
                                    return (
                                        <Link
                                            key={step.id}
                                            href={step.href}
                                            className={`biw-step biw-step--${step.status}`}
                                            title={step.tip}
                                        >
                                            <div className="biw-step-rail">
                                                <span className="biw-step-dot">
                                                    {step.status === 'done' ? (
                                                        <Check className="h-3 w-3" strokeWidth={3} />
                                                    ) : null}
                                                </span>
                                                <span className="biw-step-line" />
                                            </div>
                                            <div className="biw-step-body">
                                                <div className="flex items-center gap-2">
                                                    <Icon
                                                        className={`h-3.5 w-3.5 shrink-0 ${
                                                            step.status === 'todo'
                                                                ? 'text-black/25'
                                                                : step.status === 'current'
                                                                  ? 'text-[#e53935]'
                                                                  : 'text-[#22c55e]'
                                                        }`}
                                                    />
                                                    <p
                                                        className={`text-sm font-semibold tracking-tight ${
                                                            step.status === 'todo'
                                                                ? 'text-black/35'
                                                                : 'text-[#1b1b1b]'
                                                        }`}
                                                    >
                                                        {step.label}
                                                    </p>
                                                    <span className="ml-auto text-[10px] font-semibold text-black/35">
                                                        {step.eta}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-[11px] text-black/40">
                                                    {step.status === 'done'
                                                        ? 'Complete'
                                                        : step.status === 'current'
                                                          ? 'You’re here'
                                                          : 'Upcoming'}
                                                </p>
                                                <p className="biw-step-tip">{step.tip}</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </article>

                        <article className="biw-panel biw-panel--static biw-ai">
                            <div className="biw-ai-head">
                                <div className="biw-ai-head-icon">
                                    <Brain className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="biw-sec-title">AI recommendations</h3>
                                    <p className="biw-sec-sub">
                                        {insights.recommendationSubtitle || 'Prioritised moves that lift approval odds'}
                                    </p>
                                </div>
                            </div>
                            <div className="biw-ai-list">
                                {topRecs.length ? (
                                    topRecs.map((rec, idx) => {
                                        const impact =
                                            rec.priority === 'high'
                                                ? '+8–12 pts'
                                                : rec.priority === 'medium'
                                                  ? '+4–7 pts'
                                                  : '+2–4 pts';
                                        const time =
                                            rec.priority === 'high'
                                                ? '15–25 min'
                                                : rec.priority === 'medium'
                                                  ? '8–12 min'
                                                  : '5 min';
                                        const difficulty =
                                            rec.priority === 'high'
                                                ? 'Moderate'
                                                : rec.priority === 'medium'
                                                  ? 'Easy'
                                                  : 'Quick';
                                        const why =
                                            rec.priority === 'high'
                                                ? 'Highest leverage on lender confidence right now.'
                                                : rec.priority === 'medium'
                                                  ? 'Solid uplift with low effort relative to impact.'
                                                  : 'Quick win that keeps momentum on your file.';
                                        return (
                                            <div
                                                key={rec.id}
                                                className={`biw-rec biw-rec--${rec.priority}`}
                                            >
                                                <div className="biw-rec-top">
                                                    <span className={`biw-rec-rank biw-rec-rank--${rec.priority}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="biw-rec-tags">
                                                            <span
                                                                className={`biw-badge ${
                                                                    rec.priority === 'high'
                                                                        ? 'biw-badge--high'
                                                                        : rec.priority === 'medium'
                                                                          ? 'biw-badge--med'
                                                                          : 'biw-badge--low'
                                                                }`}
                                                            >
                                                                {rec.priority} priority
                                                            </span>
                                                            <span className="biw-rec-feature">{rec.feature}</span>
                                                        </div>
                                                        <p className="biw-rec-title">{rec.title}</p>
                                                    </div>
                                                </div>
                                                <p className="biw-rec-body">{rec.body}</p>
                                                <p className="biw-rec-why">
                                                    <Sparkles className="h-3 w-3 shrink-0" />
                                                    {why}
                                                </p>
                                                <div className="biw-rec-meta">
                                                    <div>
                                                        <span>Impact</span>
                                                        <strong>{impact}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Time</span>
                                                        <strong>{time}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Difficulty</span>
                                                        <strong>{difficulty}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Score lift</span>
                                                        <strong className="biw-rec-lift">{impact}</strong>
                                                    </div>
                                                </div>
                                                {rec.href ? (
                                                    <Link
                                                        href={rec.href}
                                                        className={`biw-rec-cta${
                                                            rec.priority === 'high' ? ' biw-rec-cta--hot' : ''
                                                        }`}
                                                    >
                                                        {rec.cta || 'Take action'}
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                ) : null}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="biw-ai-empty">
                                        <Sparkles className="h-5 w-5 text-[#e53935]" />
                                        <div>
                                            <p className="font-semibold">No recommendations yet</p>
                                            <p className="text-xs text-black/45">
                                                Complete your quiz to unlock tailored AI moves.
                                            </p>
                                        </div>
                                        <Link href="/quiz" className="biw-cta biw-cta--primary !h-9 !text-xs">
                                            Start quiz
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </article>
                    </section>

                    {/* Affordability gauges + Score */}
                    <section className="biw-split biw-split--50-50">
                        <article className="biw-panel biw-panel--static biw-health">
                            <div className="biw-health-head">
                                <div>
                                    <p className="biw-health-kicker">Financial fitness</p>
                                    <h3 className="biw-sec-title">Affordability health</h3>
                                    <p className="biw-sec-sub">
                                        How lenders will read your income, debt, savings and housing load.
                                    </p>
                                </div>
                                <div
                                    className={`biw-health-verdict biw-health-verdict--${
                                        score >= 65 ? 'good' : score >= 40 ? 'watch' : 'risk'
                                    }`}
                                >
                                    <span className="biw-health-verdict-label">Overall</span>
                                    <strong>
                                        {score >= 65 ? 'Healthy' : score >= 40 ? 'Building' : 'At risk'}
                                    </strong>
                                </div>
                            </div>

                            <div className="biw-health-gauges">
                                {gauges.map((g) => {
                                    const tone =
                                        g.label === 'Debt load' && insights.debtToIncomePct && insights.debtToIncomePct > 30
                                            ? 'risk'
                                            : g.label === 'Risk profile'
                                              ? score >= 65
                                                  ? 'good'
                                                  : score >= 40
                                                    ? 'watch'
                                                    : 'risk'
                                              : g.label === 'Savings ratio' && depositPctIdeal >= 10
                                                ? 'good'
                                                : 'neutral';
                                    const hint =
                                        g.label === 'Income allocation'
                                            ? 'Share of income already committed'
                                            : g.label === 'Debt load'
                                              ? 'Lower is stronger for banks'
                                              : g.label === 'Savings ratio'
                                                ? 'Progress vs ideal deposit'
                                                : g.label === 'Housing cost'
                                                  ? 'Bond vs monthly income'
                                                  : 'Composite readiness risk';
                                    return (
                                        <div key={g.label} className={`biw-health-gauge biw-health-gauge--${tone}`}>
                                            <div
                                                className="biw-health-ring"
                                                style={{
                                                    ['--p' as string]: String(g.pct),
                                                    ['--c' as string]: g.color,
                                                }}
                                            >
                                                <span>{g.display}</span>
                                            </div>
                                            <div className="biw-health-gauge-copy">
                                                <p className="biw-health-gauge-label">{g.label}</p>
                                                <p className="biw-health-gauge-hint">{hint}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="biw-health-footer">
                                <div>
                                    <p className="biw-health-footer-label">Monthly comfort</p>
                                    <p className="biw-health-footer-value">
                                        {monthlyBudget ? formatCurrency(monthlyBudget) : '—'}
                                        <span> modelled bond band</span>
                                    </p>
                                </div>
                                <Link href="/calculator" className="biw-cta biw-cta--ghost">
                                    Stress-test budget
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </article>

                        <article className="biw-panel biw-panel--static biw-prscore">
                            <div className="biw-prscore-hero">
                                <div className="biw-prscore-hero-copy">
                                    <p className="biw-health-kicker biw-health-kicker--light">Readiness index</p>
                                    <h3 className="biw-sec-title">PropReady Score</h3>
                                    <p className="biw-prscore-sub">
                                        {insights.summary ||
                                            insights.narrative ||
                                            'A transparent score of how ready you are to apply for a bond.'}
                                    </p>
                                </div>
                                <div
                                    className="biw-prscore-ring"
                                    style={{
                                        ['--p' as string]: String(score),
                                        ['--c' as string]: gradeColor(score),
                                    }}
                                    aria-label={`PropReady score ${score}`}
                                >
                                    <div className="biw-prscore-ring-inner">
                                        <span className="biw-prscore-value">{score}</span>
                                        <span className="biw-prscore-grade">{getPropReadyScoreLabel(score)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="biw-prscore-body">
                                <div className="biw-prscore-bands" role="list" aria-label="Score bands">
                                    {[
                                        { id: 'Weak', min: 0, max: 49, color: '#e53935' },
                                        { id: 'Good', min: 50, max: 79, color: '#f59e0b' },
                                        { id: 'Excellent', min: 80, max: 100, color: '#22c55e' },
                                    ].map((band) => {
                                        const active = score >= band.min && score <= band.max;
                                        return (
                                            <div
                                                key={band.id}
                                                role="listitem"
                                                className={`biw-prscore-band${active ? ' is-active' : ''}`}
                                                style={{ ['--band' as string]: band.color }}
                                            >
                                                <span className="biw-prscore-band-dot" />
                                                <span>{band.id}</span>
                                                <em>
                                                    {band.min}–{band.max}
                                                </em>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="biw-prscore-factors">
                                    <p className="biw-prscore-factors-title">Score breakdown</p>
                                    {insights.factors.slice(0, 5).map((factor) => {
                                        const pct = Math.round((factor.points / factor.maxPoints) * 100);
                                        return (
                                            <div key={factor.id} className="biw-prscore-factor">
                                                <div className="biw-prscore-factor-top">
                                                    <span>{factor.label}</span>
                                                    <strong>
                                                        {factor.points}/{factor.maxPoints}
                                                    </strong>
                                                </div>
                                                <div className="biw-prscore-bar" aria-hidden>
                                                    <span
                                                        className={`biw-prscore-bar-fill biw-prscore-bar-fill--${factor.status}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <p className="biw-prscore-factor-detail">{factor.detail}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="biw-prscore-actions">
                                    <Link href="/dashboard/prequal" className="biw-cta biw-cta--primary flex-1">
                                        Improve score
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                    <Link href="/quiz" className="biw-cta biw-cta--ghost">
                                        Retake quiz
                                    </Link>
                                </div>
                            </div>
                        </article>
                    </section>

                    {/* Buying power insights (replaces featured match) */}
                    <section className="biw-panel p-5 sm:p-6">
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h3 className="biw-sec-title">Buying power insights</h3>
                                <p className="biw-sec-sub">Practical capacity — not placeholder listings</p>
                            </div>
                            <Link href="/calculator" className="text-xs font-semibold text-[#e53935]">
                                Model scenarios
                            </Link>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    label: 'Buying capacity',
                                    value: preQual ? formatCurrency(preQual) : '—',
                                    hint: 'Educational ceiling band',
                                },
                                {
                                    label: 'Ideal property type',
                                    value: idealPropertyType(preQual),
                                    hint: 'Matched to your band',
                                },
                                {
                                    label: 'Recommended focus',
                                    value: suburbHint(preQual, quizResult?.city),
                                    hint: 'Affordability-led areas',
                                },
                                {
                                    label: 'Est. transfer costs',
                                    value: transferEstimate ? formatCurrency(transferEstimate) : '—',
                                    hint: '~fees + duties signal',
                                },
                                {
                                    label: 'Monthly ownership',
                                    value: ownershipMonthly ? formatCurrency(ownershipMonthly) : '—',
                                    hint: 'Bond + rates + buffer',
                                },
                                {
                                    label: 'Affordability confidence',
                                    value: `${Math.min(98, Math.max(30, score + 5))}%`,
                                    hint: score >= 65 ? 'Strong footing' : 'Improve docs & deposit',
                                },
                            ].map((cell) => (
                                <div key={cell.label} className="biw-iq-cell">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-black/40">
                                        {cell.label}
                                    </p>
                                    <p className="mt-1.5 text-sm font-bold tracking-tight">{cell.value}</p>
                                    <p className="mt-1 text-[11px] text-black/45">{cell.hint}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 grid gap-3 rounded-[18px] border border-black/[0.05] bg-black/[0.02] p-4 sm:grid-cols-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-black/40">
                                    Market snapshot
                                </p>
                                <p className="mt-1 text-sm font-bold">Avg. entry homes steady</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-black/40">
                                    Rate trend
                                </p>
                                <p className="mt-1 text-sm font-bold text-[#2563eb]">Watch repo path</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-black/40">
                                    Buyer demand
                                </p>
                                <p className="mt-1 text-sm font-bold text-[#22c55e]">Selective · active</p>
                            </div>
                        </div>
                    </section>

                    {/* Property IQ highlight */}
                    <section className="biw-panel biw-panel--static biw-wealth">
                        <div className="biw-wealth-hero">
                            <div className="biw-wealth-hero-copy">
                                <div className="biw-wealth-kicker">
                                    <LineChart className="h-3.5 w-3.5" />
                                    Property IQ
                                </div>
                                <h3 className="biw-sec-title">Wealth snapshot</h3>
                                <p className="biw-wealth-sub">
                                    Long-term ownership growth — equity, cash flow and projected net worth in one view.
                                </p>
                                <Link href="/property-iq" className="biw-cta biw-cta--light mt-5">
                                    Open Property IQ
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                            {(() => {
                                const health = Math.min(98, Math.max(40, score + 6));
                                return (
                                    <div
                                        className="biw-wealth-ring"
                                        style={{ ['--p' as string]: String(health) }}
                                        aria-label={`Portfolio health ${health} of 100`}
                                    >
                                        <div className="biw-wealth-ring-inner">
                                            <span className="biw-wealth-ring-value">{health}</span>
                                            <span className="biw-wealth-ring-label">Health</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="biw-wealth-body">
                            <div className="biw-wealth-feature">
                                <div>
                                    <p className="biw-wealth-feature-label">5-year wealth projection</p>
                                    <p className="biw-wealth-feature-value">
                                        {preQual
                                            ? formatCurrency(Math.round(preQual * 0.22 + deposit * 1.4))
                                            : '—'}
                                    </p>
                                    <p className="biw-wealth-feature-hint">
                                        {score >= 65
                                            ? 'Trajectory: compounding equity path'
                                            : 'Trajectory: building your foundation'}
                                    </p>
                                </div>
                                <div className="biw-wealth-feature-chart" aria-hidden>
                                    {sparkHeights(11).map((h, i) => (
                                        <i key={i} style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                            <div className="biw-wealth-grid">
                                {[
                                    {
                                        label: 'Equity built',
                                        value: deposit ? formatCurrency(deposit) : '—',
                                        hint: 'Deposit & early equity signal',
                                        tone: 'up' as const,
                                        icon: Wallet,
                                    },
                                    {
                                        label: 'Est. appreciation',
                                        value: '+4.2%',
                                        hint: 'Illustrative annual uplift',
                                        tone: 'up' as const,
                                        icon: TrendingUp,
                                    },
                                    {
                                        label: 'Mortgage remaining',
                                        value: preQual ? formatCurrency(Math.round(preQual * 0.92)) : '—',
                                        hint: 'Projected balance at purchase',
                                        tone: 'neutral' as const,
                                        icon: Home,
                                    },
                                    {
                                        label: 'Est. net worth lean',
                                        value: preQual
                                            ? formatCurrency(Math.round(preQual * 0.12 + deposit))
                                            : deposit
                                              ? formatCurrency(deposit)
                                              : '—',
                                        hint: 'Assets less illustrative debt',
                                        tone: 'up' as const,
                                        icon: LineChart,
                                    },
                                    {
                                        label: 'Monthly cash flow',
                                        value: monthlyBudget ? formatCurrency(-monthlyBudget) : '—',
                                        hint: 'Ownership cost after bond',
                                        tone: 'down' as const,
                                        icon: Calculator,
                                    },
                                    {
                                        label: 'Future trajectory',
                                        value: score >= 65 ? 'Compounding' : 'Foundation',
                                        hint: 'Based on readiness score',
                                        tone: score >= 65 ? ('up' as const) : ('neutral' as const),
                                        icon: Sparkles,
                                    },
                                ].map((cell) => {
                                    const Icon = cell.icon;
                                    return (
                                        <div key={cell.label} className={`biw-wealth-card biw-wealth-card--${cell.tone}`}>
                                            <div className="biw-wealth-card-top">
                                                <span className="biw-wealth-card-icon">
                                                    <Icon className="h-3.5 w-3.5" />
                                                </span>
                                                <span className="biw-wealth-card-label">{cell.label}</span>
                                            </div>
                                            <p className="biw-wealth-card-value">{cell.value}</p>
                                            <p className="biw-wealth-card-hint">{cell.hint}</p>
                                            <div className="biw-iq-spark" aria-hidden>
                                                {sparkHeights(cell.label.length + 3)
                                                    .slice(0, 8)
                                                    .map((h, i) => (
                                                        <i key={i} style={{ height: `${h}%` }} />
                                                    ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Originators */}
                    <section className="biw-panel biw-panel--static p-5 sm:p-6">
                        <div className="mb-4 flex items-end justify-between gap-3">
                            <div>
                                <h3 className="biw-sec-title">Recommended bond originators</h3>
                                <p className="biw-sec-sub">Compare fit, speed and trust — swipe to explore</p>
                            </div>
                            <Link href="/dashboard/documents" className="biw-appt-diary">
                                Full prequal
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        <div className="biw-originator-scroll">
                            {liveOriginatorsLoading ? (
                                <p className="text-sm text-charcoal/55 px-1">Loading bond originators…</p>
                            ) : liveOriginators.length === 0 ? (
                                <p className="text-sm leading-relaxed text-charcoal/55 px-1">
                                    Verified bond originators appear here once their staff are approved on
                                    PropReady. You can still upload documents or use your agent&apos;s
                                    originator.
                                </p>
                            ) : (
                                liveOriginators.map((o, index) => {
                                const meta = ORIGINATOR_META[o.id] || ORIGINATOR_META.betterbond;
                                const initials = o.name
                                    .split(/\s+/)
                                    .map((w) => w[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase();
                                const featured = index === 0;
                                return (
                                    <article
                                        key={o.id}
                                        className={`biw-orig-card${featured ? ' biw-orig-card--featured' : ''}`}
                                    >
                                        {featured ? (
                                            <span className="biw-orig-ribbon">Top match</span>
                                        ) : null}
                                        <div className="biw-orig-head">
                                            <div className="biw-orig-avatar" aria-hidden>
                                                {initials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="biw-orig-name">{o.name}</p>
                                                    <span className="biw-orig-partner">{o.badge}</span>
                                                </div>
                                                <p className="biw-orig-desc">{o.description}</p>
                                            </div>
                                        </div>

                                        <div className="biw-orig-rating-row">
                                            <div className="biw-orig-stars" aria-label={`${meta.rating} out of 5`}>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-3.5 w-3.5 ${
                                                            i < Math.round(Number(meta.rating))
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'text-black/15'
                                                        }`}
                                                    />
                                                ))}
                                                <strong>{meta.rating}</strong>
                                            </div>
                                            <div className="biw-orig-success">
                                                <span>{meta.successRate}</span>
                                                success rate
                                            </div>
                                        </div>

                                        <div className="biw-orig-stats">
                                            <div className="biw-orig-stat">
                                                <span>Approval speed</span>
                                                <strong>{meta.speed}</strong>
                                            </div>
                                            <div className="biw-orig-stat">
                                                <span>Avg. response</span>
                                                <strong>{meta.response}</strong>
                                            </div>
                                            <div className="biw-orig-stat">
                                                <span>Banks</span>
                                                <strong>{meta.banks}</strong>
                                            </div>
                                            <div className="biw-orig-stat">
                                                <span>Experience</span>
                                                <strong>{meta.years} yrs</strong>
                                            </div>
                                        </div>

                                        <div className="biw-orig-chips">
                                            <span className="biw-orig-chip">
                                                <ShieldCheck className="h-3 w-3" />
                                                {meta.strength}
                                            </span>
                                            <span className="biw-orig-chip">
                                                <Landmark className="h-3 w-3" />
                                                Best for {meta.suited}
                                            </span>
                                        </div>

                                        <div className="biw-orig-trust">
                                            <ShieldCheck className="h-3.5 w-3.5 text-[#22c55e]" />
                                            <span>
                                                Verified partner · {meta.fees}
                                            </span>
                                        </div>

                                        <div className="biw-orig-actions">
                                            <button
                                                type="button"
                                                className="biw-orig-btn biw-orig-btn--primary"
                                                onClick={() => setSelectedOriginator(o)}
                                            >
                                                <Phone className="h-3.5 w-3.5" />
                                                Contact
                                            </button>
                                            <a
                                                href={o.website}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="biw-orig-btn"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                Site
                                            </a>
                                            <Link href="/dashboard/documents" className="biw-orig-btn">
                                                Compare
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })
                            )}
                        </div>
                    </section>

                    {/* Viewings */}
                    <section className="biw-panel biw-panel--static p-5 sm:p-6">
                        <div className="mb-4 flex items-end justify-between gap-3">
                            <div>
                                <h3 className="biw-sec-title">Viewing appointments</h3>
                                <p className="biw-sec-sub">Upcoming viewings · tap to open</p>
                            </div>
                            <Link href="/dashboard/viewings" className="biw-appt-diary">
                                Open diary
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        {viewings.length ? (
                            <div className="biw-appt-list">
                                {viewings.slice(0, 4).map((v) => {
                                    const date = new Date(v.date);
                                    const statusKey = String(v.status || 'scheduled').toLowerCase();
                                    const statusClass =
                                        statusKey === 'confirmed'
                                            ? 'biw-appt-status--ok'
                                            : statusKey === 'completed'
                                              ? 'biw-appt-status--done'
                                              : statusKey === 'cancelled'
                                                ? 'biw-appt-status--cancel'
                                                : 'biw-appt-status--soon';
                                    const statusLabel =
                                        statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
                                    const mapsUrl = v.propertyAddress
                                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.propertyAddress)}`
                                        : null;

                                    return (
                                        <article key={v.id} className="biw-appt">
                                            <Link
                                                href="/dashboard/viewings"
                                                className="biw-appt-main"
                                                aria-label={`Open viewing for ${v.propertyTitle || 'property'}`}
                                            >
                                                <div className="biw-appt-date" aria-hidden="true">
                                                    <span className="biw-appt-weekday">
                                                        {date.toLocaleString('en-ZA', { weekday: 'short' })}
                                                    </span>
                                                    <span className="biw-appt-day">{date.getDate()}</span>
                                                    <span className="biw-appt-month">
                                                        {date.toLocaleString('en-ZA', { month: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="biw-appt-body">
                                                    <div className="biw-appt-top">
                                                        <p className="biw-appt-title">
                                                            {v.propertyTitle || 'Property viewing'}
                                                        </p>
                                                        <span className={`biw-appt-status ${statusClass}`}>
                                                            {statusLabel}
                                                        </span>
                                                    </div>
                                                    <p className="biw-appt-meta">
                                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                                        <span>{v.time || 'Time TBC'}</span>
                                                    </p>
                                                    <p className="biw-appt-meta">
                                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">
                                                            {v.propertyAddress || 'Address TBC'}
                                                        </span>
                                                    </p>
                                                    {typeof v.propertyPrice === 'number' &&
                                                    v.propertyPrice > 0 ? (
                                                        <p className="biw-appt-price">
                                                            {formatCurrency(v.propertyPrice)}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <ChevronRight className="biw-appt-chevron" aria-hidden="true" />
                                            </Link>
                                            <div className="biw-appt-actions">
                                                <Link href="/dashboard/viewings" className="biw-appt-btn biw-appt-btn--primary">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    Open
                                                </Link>
                                                {mapsUrl ? (
                                                    <a
                                                        href={mapsUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="biw-appt-btn"
                                                    >
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        Directions
                                                    </a>
                                                ) : null}
                                                <Link href="/dashboard/viewings" className="biw-appt-btn">
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    Message
                                                </Link>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <Link href="/dashboard/viewings" className="biw-appt-empty">
                                <span className="biw-appt-empty-icon">
                                    <Calendar className="h-5 w-5" />
                                </span>
                                <span className="biw-appt-empty-copy">
                                    <strong>No viewings yet</strong>
                                    <span>Book once your shortlist is ready — open diary</span>
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                            </Link>
                        )}
                    </section>

                    {/* Documents */}
                    <section className="biw-panel biw-panel--static biw-vault">
                        <div className="biw-vault-head">
                            <div>
                                <p className="biw-health-kicker">Secure storage</p>
                                <h3 className="biw-sec-title">Document vault</h3>
                                <p className="biw-sec-sub">
                                    Upload once — verification status stays visible for originators.
                                </p>
                            </div>
                            <div className="biw-vault-stats">
                                <div>
                                    <strong>
                                        {documents.filter((d) => d.status === 'verified').length}
                                    </strong>
                                    <span>Verified</span>
                                </div>
                                <div>
                                    <strong>
                                        {
                                            documents.filter(
                                                (d) => d.status === 'pending' || d.status === 'uploaded'
                                            ).length
                                        }
                                    </strong>
                                    <span>Pending</span>
                                </div>
                                <div>
                                    <strong>
                                        {Math.max(0, BUYER_DOCUMENT_SLOTS.length - documents.length)}
                                    </strong>
                                    <span>Missing</span>
                                </div>
                            </div>
                        </div>
                        <div className="biw-doc-grid">
                            {BUYER_DOCUMENT_SLOTS.map(({ type, label, hint }) => {
                                const uploaded = documents.find((d) => d.type === type);
                                const pending = uploaded?.status === 'pending' || uploaded?.status === 'uploaded';
                                const verified = uploaded?.status === 'verified';
                                const state = verified ? 'ok' : pending ? 'pending' : 'miss';
                                return (
                                    <div key={type} className={`biw-doc-tile biw-doc-tile--${state}`}>
                                        <Link
                                            href={`/dashboard/documents?type=${type}`}
                                            className="biw-doc-main"
                                        >
                                            <div className="biw-doc-file">
                                                {uploaded ? (
                                                    <FileText className="h-5 w-5" />
                                                ) : (
                                                    <Upload className="h-5 w-5" />
                                                )}
                                            </div>
                                            <p className="biw-doc-name">{label}</p>
                                            <p className="biw-doc-hint">
                                                {uploaded
                                                    ? uploaded.uploadedAt
                                                        ? `Uploaded ${new Date(uploaded.uploadedAt).toLocaleDateString('en-ZA')}`
                                                        : 'Uploaded'
                                                    : hint || 'Drag & drop to upload'}
                                            </p>
                                            <span className={`biw-doc-badge biw-doc-badge--${state}`}>
                                                {verified
                                                    ? 'Verified'
                                                    : pending
                                                      ? 'Pending review'
                                                      : 'Missing'}
                                            </span>
                                        </Link>
                                        {uploaded ? (
                                            <button
                                                type="button"
                                                className="biw-doc-preview"
                                                title="Preview"
                                                onClick={() => setPreviewDoc(uploaded)}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Preview
                                            </button>
                                        ) : (
                                            <Link
                                                href={`/dashboard/documents?type=${type}`}
                                                className="biw-doc-preview biw-doc-preview--upload"
                                            >
                                                <Upload className="h-3.5 w-3.5" />
                                                Upload
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="biw-vault-foot">
                            <Link href="/dashboard/documents" className="biw-cta biw-cta--primary">
                                Open full vault
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </section>

                    {/* Activity timeline */}
                    <section className="biw-panel biw-panel--static biw-feed">
                        <div className="biw-feed-head">
                            <div>
                                <p className="biw-health-kicker">Live timeline</p>
                                <h3 className="biw-sec-title">Recent activity</h3>
                                <p className="biw-sec-sub">System, documents, viewings and AI in one scan.</p>
                            </div>
                            <Link href="/dashboard/messages" className="biw-appt-diary">
                                Inbox
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        <ol className="biw-feed-list">
                            {activity.map((item, index) => {
                                const Icon = item.icon;
                                const tone =
                                    item.status === 'Done' || item.status === 'Strong' || item.status === 'Active'
                                        ? 'ok'
                                        : item.status === 'Action' || item.status === 'Missing'
                                          ? 'hot'
                                          : 'neutral';
                                return (
                                    <li key={item.title} className={`biw-feed-item biw-feed-item--${tone}`}>
                                        <div className="biw-feed-rail" aria-hidden>
                                            <span className="biw-feed-dot">
                                                <Icon className="h-3.5 w-3.5" />
                                            </span>
                                            {index < activity.length - 1 ? (
                                                <span className="biw-feed-line" />
                                            ) : null}
                                        </div>
                                        <div className="biw-feed-card">
                                            <div className="biw-feed-card-top">
                                                <p className="biw-feed-title">{item.title}</p>
                                                <span className={`biw-feed-status biw-feed-status--${tone}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="biw-feed-detail">{item.detail}</p>
                                            <p className="biw-feed-when">
                                                <Clock className="h-3 w-3" />
                                                {item.when}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                </div>
            </div>

            <BuyerDocumentPreviewModal
                doc={previewDoc}
                userId={user.id}
                onClose={() => setPreviewDoc(null)}
            />

            {selectedOriginator ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="biw-panel biw-panel--static w-full max-w-md p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="biw-badge biw-badge--high">{selectedOriginator.badge}</p>
                                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                                    {selectedOriginator.name}
                                </h3>
                                <p className="mt-1 text-sm text-black/55">{selectedOriginator.description}</p>
                            </div>
                            <button
                                type="button"
                                className="biw-cta biw-cta--ghost !px-3"
                                onClick={() => setSelectedOriginator(null)}
                            >
                                Close
                            </button>
                        </div>
                        <div className="mt-5 space-y-2 text-sm">
                            <p>
                                Phone ·{' '}
                                <a className="font-semibold text-[#e53935]" href={`tel:${selectedOriginator.phone}`}>
                                    {selectedOriginator.phone}
                                </a>
                            </p>
                            <p>
                                Web ·{' '}
                                <a
                                    className="font-semibold text-[#2563eb]"
                                    href={selectedOriginator.website}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Visit site
                                </a>
                            </p>
                        </div>
                        <Link
                            href="/dashboard/documents"
                            className="biw-cta biw-cta--primary mt-5 w-full"
                            onClick={() => setSelectedOriginator(null)}
                        >
                            Send documents pack
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
