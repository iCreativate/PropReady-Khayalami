'use client';

import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Calculator, Clock, MessageSquare, Newspaper, Sparkles } from 'lucide-react';
import '@/app/dashboard/portal-ai-coach.css';
import { useAiAssistantVisibility } from '@/hooks/useAiAssistantVisibility';
import { formatCurrency } from '@/lib/currency';
import { STORAGE_KEYS } from '@/lib/storage-keys';

/** Soft-fail dynamic import — Turbopack/extension chunk fetch failures must not crash the portal. */
const AiTutorFab = dynamic(
    () =>
        import('@/components/buyer-learn/course/AiTutorFab').catch((err) => {
            console.warn('[PortalAiCoach] AiTutorFab chunk failed to load', err);
            return {
                default: function AiTutorFabUnavailable() {
                    return null;
                },
            };
        }),
    { ssr: false, loading: () => null }
);

export type PortalAiCoachRole = 'buyer' | 'seller' | 'agent' | 'originator' | 'conveyancer';

type PortalAiCoachProps = {
    role: PortalAiCoachRole;
    /** Current portal page key — used for today's goal copy */
    activePage?: string;
    /** Page title fallback for lesson context */
    pageTitle?: string;
};

const ROLE_COPY: Record<
    PortalAiCoachRole,
    {
        subtitle: string;
        tipTitle: string;
        tipBody: string;
        pulseTitle: string;
        pulseBody: string;
        calculatorHref: string;
        calculatorLabel: string;
        lessonTitle: string;
        lessonSubtitle: string;
        hubBasePath: string;
        signalTitle: string;
        signalHint: string;
    }
> = {
    buyer: {
        subtitle: "Sticky coach for today's buy path",
        tipTitle: 'Mortgage tip',
        tipBody:
            'A larger deposit can shrink instalments faster than chasing a tiny rate cut — model both in the calculator.',
        pulseTitle: 'Rate pulse',
        pulseBody: 'Watch repo-rate moves — your monthly target updates with affordability.',
        calculatorHref: '/calculator',
        calculatorLabel: 'Quick calculator',
        lessonTitle: 'Buyer portal',
        lessonSubtitle:
            'Bond readiness, Property Companion™, affordability, documents, viewings and next steps on PropReady',
        hubBasePath: '/dashboard',
        signalTitle: 'Estimated savings',
        signalHint: 'Rate / fee optimisation signal',
    },
    seller: {
        subtitle: "Sticky coach for today's sell path",
        tipTitle: 'Pricing tip',
        tipBody:
            'Realistic pricing with strong presentation usually attracts more qualified buyers than stretching the ask.',
        pulseTitle: 'Market pulse',
        pulseBody: 'Track demand signals in your suburb before adjusting list price or incentives.',
        calculatorHref: '/sellers/valuation',
        calculatorLabel: 'Open valuation',
        lessonTitle: 'Seller portal',
        lessonSubtitle: 'Valuations, listing readiness, viewings and conveyancing on PropReady',
        hubBasePath: '/sellers/dashboard',
        signalTitle: 'Listing focus',
        signalHint: 'Keep buyer-ready details current',
    },
    agent: {
        subtitle: 'Sticky coach for listings & leads',
        tipTitle: 'Lead tip',
        tipBody:
            'Respond quickly to new leads and confirm viewing slots — speed is one of the strongest conversion levers.',
        pulseTitle: 'Pipeline pulse',
        pulseBody: 'Keep viewings, follow-ups and listing updates moving so nothing stalls mid-journey.',
        calculatorHref: '/agents/dashboard',
        calculatorLabel: 'Open workspace',
        lessonTitle: 'Agent portal',
        lessonSubtitle: 'Leads, listings, viewings and client readiness coaching on PropReady',
        hubBasePath: '/agents/dashboard',
        signalTitle: 'Pipeline focus',
        signalHint: 'Prioritise hottest leads today',
    },
    originator: {
        subtitle: 'Sticky coach for bond applications',
        tipTitle: 'File tip',
        tipBody:
            'Complete income and bank packs early — clean documents cut bank turnaround more than anything else.',
        pulseTitle: 'Case pulse',
        pulseBody: 'Prioritise incomplete files and follow up pending bank responses same day when possible.',
        calculatorHref: '/originators/dashboard',
        calculatorLabel: 'Open cases',
        lessonTitle: 'Originator portal',
        lessonSubtitle: 'Bond applications, document readiness and bank progress on PropReady',
        hubBasePath: '/originators/dashboard',
        signalTitle: 'Case focus',
        signalHint: 'Clear incomplete packs first',
    },
    conveyancer: {
        subtitle: 'Sticky coach for matters & transfers',
        tipTitle: 'Matter tip',
        tipBody:
            'Flag missing FICA and bond instructions early — transfer delays almost always start with incomplete packs.',
        pulseTitle: 'Transfer pulse',
        pulseBody: 'Keep parties aligned on conditions, guarantees and registration milestones.',
        calculatorHref: '/conveyancers/portal',
        calculatorLabel: 'Open portal',
        lessonTitle: 'Conveyancer portal',
        lessonSubtitle: 'Matters, quotes, deeds and client communication on PropReady',
        hubBasePath: '/conveyancers/portal',
        signalTitle: 'Matter focus',
        signalHint: 'Unblock the nearest registration',
    },
};

function goalForPage(role: PortalAiCoachRole, activePage?: string): string {
    const page = (activePage || '').toLowerCase();
    if (role === 'buyer') {
        if (page === 'dashboard' || !page) return 'Upload ID and proof of income';
        if (page === 'documents' || page.includes('prequal')) return 'Complete your document vault for full prequal';
        if (page === 'viewings') return 'Confirm upcoming viewings and follow up with your agent';
        if (page === 'messages') return 'Reply to open threads with your agent or originator';
        if (page === 'calculator' || page === 'smart-bond') return 'Model deposit and rate scenarios for comfort';
        if (page === 'learn' || page === 'quiz') return 'Finish the next learning module for confidence';
        if (page === 'property-iq')
            return 'Update Property Companion™ or check live repo/prime context';
        if (page === 'conveyancer-connect') return 'Shortlist a conveyancer for when you go to offer';
        return 'Keep momentum on your next buying milestone';
    }
    if (role === 'seller') {
        if (page === 'dashboard' || !page) return 'Refresh your valuation and listing readiness';
        if (page === 'valuation') return 'Refresh your valuation inputs for a sharper guide price';
        if (page === 'property-quiz') return 'Complete seller readiness details for better matches';
        if (page === 'messages') return 'Respond to buyer or agent messages promptly';
        return 'Advance listing readiness and buyer engagement';
    }
    if (role === 'agent') {
        if (page === 'viewings') return "Confirm today's viewing schedule and follow-ups";
        if (page === 'my-leads' || page === 'messages') return 'Clear unread lead and client messages';
        if (page === 'properties') return 'Keep listing details and status current';
        return 'Move your hottest leads one step closer to offer';
    }
    if (role === 'originator') {
        if (page === 'messages') return 'Follow up outstanding client document requests';
        if (page === 'cases' || page.includes('case')) return 'Push incomplete cases toward bank submission';
        return 'Advance the highest-priority bond file today';
    }
    if (page === 'matters' || page === 'deeds') return 'Unblock the matter closest to registration';
    if (page === 'quotes') return 'Issue or follow up outstanding fee quotes';
    if (page === 'messages') return 'Clear client and attorney message queues';
    return 'Keep active transfers moving without silent delays';
}

function readBuyerEstimatedSavings(): number | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.quizResult);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { preQualAmount?: number; pre_qual_amount?: number };
        const amount = Number(parsed.preQualAmount ?? parsed.pre_qual_amount ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) return null;
        return Math.round(amount * 0.018);
    } catch {
        return null;
    }
}

export function PortalAiCoachShell({
    role,
    activePage,
    pageTitle,
    header,
    children,
}: PortalAiCoachProps & { header?: ReactNode; children: ReactNode }) {
    const [showRail, setShowRail] = useState(false);
    const [railFailed, setRailFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const schedule =
            typeof window !== 'undefined' && 'requestIdleCallback' in window
                ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 1200 })
                : (cb: () => void) => window.setTimeout(cb, 200);
        const cancel =
            typeof window !== 'undefined' && 'cancelIdleCallback' in window
                ? (id: number) => window.cancelIdleCallback(id)
                : (id: number) => window.clearTimeout(id);

        const id = schedule(() => {
            if (!cancelled) setShowRail(true);
        }) as number;

        return () => {
            cancelled = true;
            cancel(id);
        };
    }, []);

    return (
        <div className="pac-shell">
            <div className="pac-main">
                {header ? <div className="mb-6 sm:mb-8">{header}</div> : null}
                {children}
            </div>
            {showRail && !railFailed ? (
                <CoachRailErrorBoundary onError={() => setRailFailed(true)}>
                    <PortalAiCoachRail role={role} activePage={activePage} pageTitle={pageTitle} />
                </CoachRailErrorBoundary>
            ) : null}
        </div>
    );
}

/** Keeps Property Companion / portal pages alive if the AI rail chunk fails. */
class CoachRailErrorBoundary extends React.Component<
    { children: ReactNode; onError?: () => void },
    { failed: boolean }
> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: Error) {
        console.warn('[PortalAiCoach] Rail failed — continuing without AI coach UI', error);
        this.props.onError?.();
    }

    render() {
        if (this.state.failed) return null;
        return this.props.children;
    }
}

export default function PortalAiCoachRail({ role, activePage, pageTitle }: PortalAiCoachProps) {
    const [aiOpen, setAiOpen] = useState(false);
    const [chatMounted, setChatMounted] = useState(false);
    const [buyerSavings, setBuyerSavings] = useState<number | null>(null);
    const { hidden, ready, hide, show } = useAiAssistantVisibility();
    const copy = ROLE_COPY[role];
    const goal = useMemo(() => goalForPage(role, activePage), [role, activePage]);

    useEffect(() => {
        if (role !== 'buyer') return;
        setBuyerSavings(readBuyerEstimatedSavings());
    }, [role, activePage]);

    function openChat() {
        show();
        setChatMounted(true);
        setAiOpen(true);
    }

    if (!ready) return null;

    return (
        <>
            <aside className="pac-rail" aria-label="PropReady AI assistant rail">
                <div className="pac-panel">
                    <header className="pac-panel-head">
                        <div className="flex min-w-0 items-center gap-2">
                            <Sparkles className="h-4 w-4 shrink-0 text-[#e53935]" />
                            <h3 className="pac-panel-title">AI assistant</h3>
                        </div>
                    </header>
                    <p className="pac-panel-sub">{copy.subtitle}</p>

                    <div className="pac-panel-body">
                        <div className="pac-goal-box">
                            <p className="pac-label pac-label--red">Today&apos;s goal</p>
                            <p className="pac-goal-copy">{goal}</p>
                        </div>

                        <div>
                            <p className="pac-label">{copy.signalTitle}</p>
                            {role === 'buyer' ? (
                                <>
                                    <p className="pac-savings">
                                        {buyerSavings != null ? formatCurrency(buyerSavings) : '—'}
                                    </p>
                                    <p className="pac-hint">{copy.signalHint}</p>
                                </>
                            ) : (
                                <p className="pac-hint mt-1">{copy.signalHint}</p>
                            )}
                        </div>

                        <div>
                            <p className="pac-label">{copy.tipTitle}</p>
                            <p className="pac-copy">{copy.tipBody}</p>
                        </div>

                        <div className="pac-pulse-box">
                            <Newspaper className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563eb]" />
                            <div>
                                <p className="pac-label">{copy.pulseTitle}</p>
                                <p className="pac-copy">{copy.pulseBody}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pac-panel-actions">
                        <Link href={copy.calculatorHref} className="pac-btn pac-btn--ghost">
                            <Calculator className="h-3.5 w-3.5" />
                            {copy.calculatorLabel}
                        </Link>
                        <button type="button" className="pac-btn pac-btn--primary" onClick={openChat}>
                            <MessageSquare className="h-3.5 w-3.5" />
                            Chat with AI
                        </button>
                    </div>
                </div>

                <div className="pac-disclaimer-bar">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    Educational only · not bank advice
                </div>
            </aside>

            {hidden ? (
                <button
                    type="button"
                    onClick={show}
                    className="fixed bottom-6 right-5 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/10 bg-white text-charcoal shadow-[0_8px_28px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:border-gold/35"
                    aria-label="Show PropReady AI Assistant chat"
                    title="Show AI chat"
                >
                    <Sparkles className="h-4 w-4 text-gold" />
                </button>
            ) : !chatMounted ? (
                <button
                    type="button"
                    onClick={openChat}
                    className="fixed bottom-6 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5"
                    aria-label="Open PropReady AI Assistant"
                >
                    <Sparkles className="h-4 w-4 text-gold" />
                    PropReady AI Assistant
                </button>
            ) : (
                <AiTutorFab
                    variant="assistant"
                    lessonTitle={pageTitle || copy.lessonTitle}
                    lessonSubtitle={copy.lessonSubtitle}
                    hubBasePath={copy.hubBasePath}
                    open={aiOpen}
                    onOpenChange={setAiOpen}
                    onHide={hide}
                    fabClassName="bottom-6 right-5"
                />
            )}
        </>
    );
}
