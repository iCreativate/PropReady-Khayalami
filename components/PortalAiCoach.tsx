'use client';

import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Calculator, Clock, MessageSquare, Newspaper, Sparkles, X } from 'lucide-react';
import '@/app/dashboard/portal-ai-coach.css';
import { useAiAssistantVisibility } from '@/hooks/useAiAssistantVisibility';

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
        lessonTitle: string;
        lessonSubtitle: string;
        hubBasePath: string;
    }
> = {
    buyer: {
        subtitle: "Sticky coach for today's buy path",
        tipTitle: 'Mortgage tip',
        tipBody:
            'Repo is the SARB policy rate; prime usually tracks repo + 3.5pp. A bigger deposit often helps more than chasing a tiny rate cut — model both.',
        pulseTitle: 'Rate pulse',
        pulseBody:
            'Use the live repo/prime banner, then stress-test affordability if rates rise 1–2 percentage points.',
        calculatorHref: '/calculator',
        lessonTitle: 'Buyer portal',
        lessonSubtitle:
            'Bond readiness, Property Companion™, affordability, documents, viewings and next steps on PropReady',
        hubBasePath: '/dashboard',
    },
    seller: {
        subtitle: "Sticky coach for today's sell path",
        tipTitle: 'Pricing tip',
        tipBody:
            'Realistic pricing with strong presentation usually attracts more qualified buyers than stretching the ask.',
        pulseTitle: 'Market pulse',
        pulseBody: 'Track demand signals in your suburb before adjusting list price or incentives.',
        calculatorHref: '/sellers/valuation',
        lessonTitle: 'Seller portal',
        lessonSubtitle: 'Valuations, listing readiness, viewings and conveyancing on PropReady',
        hubBasePath: '/sellers/dashboard',
    },
    agent: {
        subtitle: 'Sticky coach for listings & leads',
        tipTitle: 'Lead tip',
        tipBody:
            'Respond quickly to new leads and confirm viewing slots — speed is one of the strongest conversion levers.',
        pulseTitle: 'Pipeline pulse',
        pulseBody: 'Keep viewings, follow-ups and listing updates moving so nothing stalls mid-journey.',
        calculatorHref: '/agents/dashboard',
        lessonTitle: 'Agent portal',
        lessonSubtitle: 'Leads, listings, viewings and client readiness coaching on PropReady',
        hubBasePath: '/agents/dashboard',
    },
    originator: {
        subtitle: 'Sticky coach for bond applications',
        tipTitle: 'File tip',
        tipBody:
            'Complete income and bank packs early — clean documents cut bank turnaround more than anything else.',
        pulseTitle: 'Case pulse',
        pulseBody: 'Prioritise incomplete files and follow up pending bank responses same day when possible.',
        calculatorHref: '/originators/dashboard',
        lessonTitle: 'Originator portal',
        lessonSubtitle: 'Bond applications, document readiness and bank progress on PropReady',
        hubBasePath: '/originators/dashboard',
    },
    conveyancer: {
        subtitle: 'Sticky coach for matters & transfers',
        tipTitle: 'Matter tip',
        tipBody:
            'Flag missing FICA and bond instructions early — transfer delays almost always start with incomplete packs.',
        pulseTitle: 'Transfer pulse',
        pulseBody: 'Keep parties aligned on conditions, guarantees and registration milestones.',
        calculatorHref: '/conveyancers/portal',
        lessonTitle: 'Conveyancer portal',
        lessonSubtitle: 'Matters, quotes, deeds and client communication on PropReady',
        hubBasePath: '/conveyancers/portal',
    },
};

function goalForPage(role: PortalAiCoachRole, activePage?: string): string {
    const page = (activePage || '').toLowerCase();
    if (role === 'buyer') {
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
        if (page === 'valuation') return 'Refresh your valuation inputs for a sharper guide price';
        if (page === 'property-quiz') return 'Complete seller readiness details for better matches';
        if (page === 'messages') return 'Respond to buyer or agent messages promptly';
        return 'Advance listing readiness and buyer engagement';
    }
    if (role === 'agent') {
        if (page === 'viewings') return 'Confirm today’s viewing schedule and follow-ups';
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
    const { hidden, ready, hide, show } = useAiAssistantVisibility();
    const copy = ROLE_COPY[role];
    const goal = useMemo(() => goalForPage(role, activePage), [role, activePage]);

    function openChat() {
        setChatMounted(true);
        setAiOpen(true);
    }

    if (!ready) return null;

    if (hidden) {
        return (
            <button
                type="button"
                onClick={show}
                className="fixed bottom-6 right-5 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/10 bg-white text-charcoal shadow-[0_8px_28px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:border-gold/35"
                aria-label="Show PropReady AI Assistant"
                title="Show AI Assistant"
            >
                <Sparkles className="h-4 w-4 text-gold" />
            </button>
        );
    }

    return (
        <>
            <aside className="pac-rail" aria-label="PropReady AI assistant rail">
                <div className="pac-card">
                    <div className="pac-card-aura" aria-hidden />

                    <header className="pac-card-head">
                        <div className="pac-mark" aria-hidden>
                            <Sparkles />
                        </div>
                        <div className="pac-card-brand">
                            <p className="pac-brand-line">PropReady</p>
                            <h3 className="pac-title">AI Assistant</h3>
                            <p className="pac-sub">{copy.subtitle}</p>
                        </div>
                        <button
                            type="button"
                            onClick={hide}
                            className="ml-auto rounded-lg p-1.5 text-charcoal/40 transition hover:bg-charcoal/[0.06] hover:text-charcoal"
                            aria-label="Turn off AI Assistant"
                            title="Turn off"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </header>

                    <section className="pac-goal" aria-label="Today's goal">
                        <span className="pac-kicker pac-kicker--accent">Today&apos;s goal</span>
                        <p className="pac-goal-text">{goal}</p>
                    </section>

                    <section className="pac-tip" aria-label={copy.tipTitle}>
                        <span className="pac-kicker">{copy.tipTitle}</span>
                        <p className="pac-tip-text">{copy.tipBody}</p>
                    </section>

                    <section className="pac-pulse" aria-label={copy.pulseTitle}>
                        <div className="pac-pulse-mark" aria-hidden>
                            <Newspaper />
                        </div>
                        <div>
                            <span className="pac-kicker">{copy.pulseTitle}</span>
                            <p className="pac-pulse-text">{copy.pulseBody}</p>
                        </div>
                    </section>

                    <div className="pac-actions">
                        <Link href={copy.calculatorHref} className="pac-cta pac-cta--ghost">
                            <Calculator />
                            {role === 'buyer' ? 'Quick calculator' : 'Open workspace'}
                        </Link>
                        <button type="button" className="pac-cta pac-cta--primary" onClick={openChat}>
                            <MessageSquare />
                            Chat with AI
                        </button>
                    </div>

                    <p className="pac-disclaimer">
                        <Clock aria-hidden />
                        Educational only · not bank advice
                    </p>
                </div>
            </aside>

            {/* Lightweight FAB until chat chunk is needed */}
            {!chatMounted ? (
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
