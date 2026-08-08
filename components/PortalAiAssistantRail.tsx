'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Clock, MessageSquare, Newspaper, Sparkles } from 'lucide-react';
import AiTutorFab from '@/components/buyer-learn/course/AiTutorFab';
import './portal-ai-assistant.css';

export type PortalAiRole = 'buyer' | 'seller' | 'agent' | 'originator' | 'conveyancer';

type PortalAiAssistantRailProps = {
    role: PortalAiRole;
    /** Optional page key for contextual goal copy */
    page?: string;
    userName?: string;
    /** Hide floating FAB (e.g. when a page already mounts its own tutor) */
    hideFab?: boolean;
};

const ROLE_COPY: Record<
    PortalAiRole,
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
            'Repo moves often pull prime with it — model deposit size and instalments together in the calculator before you stretch affordability.',
        pulseTitle: 'Rate pulse',
        pulseBody:
            'Repo is the SARB policy rate; prime is usually repo + 3.5pp. Watch the live banner — variable bonds typically reprice with prime.',
        calculatorHref: '/calculator',
        lessonTitle: 'Buyer portal',
        lessonSubtitle:
            'Bond readiness, affordability, Property Companion™, repo/prime literacy, documents, viewings and next steps on PropReady',
        hubBasePath: '/dashboard',
    },
    seller: {
        subtitle: "Sticky coach for today's sell path",
        tipTitle: 'Pricing tip',
        tipBody:
            'Price to the first two weeks of demand — overpricing often adds holding costs without lifting the final offer.',
        pulseTitle: 'Market pulse',
        pulseBody: 'Track viewing interest and comparable sales before you renegotiate.',
        calculatorHref: '/sellers/valuation',
        lessonTitle: 'Seller portal',
        lessonSubtitle: 'Valuations, staging, offers and transfer readiness on PropReady',
        hubBasePath: '/sellers/dashboard',
    },
    agent: {
        subtitle: 'Sticky coach for your pipeline',
        tipTitle: 'Pipeline tip',
        tipBody:
            'Prioritise buyers with documents uploaded — they convert faster once a viewing lands.',
        pulseTitle: 'Lead pulse',
        pulseBody: 'Respond to warm leads within two hours to keep PropReady match quality high.',
        calculatorHref: '/agents/my-leads',
        lessonTitle: 'Agent portal',
        lessonSubtitle: 'Leads, viewings, listings and client readiness on PropReady',
        hubBasePath: '/agents/dashboard',
    },
    originator: {
        subtitle: 'Sticky coach for bond cases',
        tipTitle: 'Pack tip',
        tipBody:
            'Complete ID, income and bank statements before banking — incomplete packs slow every approval.',
        pulseTitle: 'Case pulse',
        pulseBody: 'Flag missing FICA early so buyers can clear blockers before bank submission.',
        calculatorHref: '/originators/dashboard',
        lessonTitle: 'Originator portal',
        lessonSubtitle: 'Bond cases, documents and bank packs on PropReady',
        hubBasePath: '/originators/dashboard',
    },
    conveyancer: {
        subtitle: 'Sticky coach for matters',
        tipTitle: 'Matter tip',
        tipBody:
            'Confirm FICA and instruction completeness before quoting — it reduces cancellations mid-transfer.',
        pulseTitle: 'Matter pulse',
        pulseBody: 'Keep buyers and sellers updated on milestones to cut “where are we?” messages.',
        calculatorHref: '/conveyancers/portal',
        lessonTitle: 'Conveyancer portal',
        lessonSubtitle: 'Matters, quotes, deeds and messaging on PropReady',
        hubBasePath: '/conveyancers/portal',
    },
};

function goalForPage(role: PortalAiRole, page?: string, pathname?: string | null): string {
    const p = (page || '').toLowerCase();
    const path = pathname || '';

    if (role === 'buyer') {
        if (p === 'documents' || path.includes('/documents')) return 'Upload remaining FICA documents';
        if (p === 'viewings' || path.includes('/viewings')) return 'Confirm your next viewing';
        if (p === 'prequal' || path.includes('/prequal')) return 'Review and strengthen your prequal';
        if (p === 'messages' || path.includes('/messages')) return 'Reply to agent or originator threads';
        if (p === 'calculator' || path.includes('/calculator')) return 'Model deposit vs instalment scenarios';
        if (p === 'learn' || path.includes('/learn')) return 'Finish one learning module today';
        if (p === 'property-iq' || path.includes('/property-iq'))
            return 'Update Property Companion™ details or review equity';
        if (p === 'quiz' || path.includes('/quiz')) return 'Complete your qualification quiz';
        return 'Advance your next buying milestone';
    }

    if (role === 'seller') {
        if (p === 'valuation' || path.includes('/valuation')) return 'Refresh your valuation inputs';
        if (p === 'property-quiz' || path.includes('/property-quiz')) return 'Complete your property profile';
        if (p === 'messages' || path.includes('/messages')) return 'Respond to buyer or agent messages';
        return 'Move your listing readiness forward';
    }

    if (role === 'agent') {
        if (p.includes('lead') || path.includes('/my-leads')) return 'Follow up on warm buyer leads';
        if (p.includes('viewing') || path.includes('/viewings')) return 'Confirm upcoming viewings';
        if (p.includes('message') || path.includes('/messages')) return 'Clear unread client messages';
        return 'Progress your hottest pipeline deals';
    }

    if (role === 'originator') {
        if (path.includes('/cases/')) return 'Chase missing docs on this case';
        if (path.includes('/messages')) return 'Reply to buyer document questions';
        return 'Move incomplete bond packs forward';
    }

    if (path.includes('/matters')) return 'Update matter milestones';
    if (path.includes('/quotes')) return 'Send outstanding quotes';
    if (path.includes('/messages')) return 'Clear client message backlog';
    return 'Keep active matters on track';
}

export default function PortalAiAssistantRail({
    role,
    page,
    userName,
    hideFab = false,
}: PortalAiAssistantRailProps) {
    const pathname = usePathname();
    const [aiOpen, setAiOpen] = useState(false);
    const copy = ROLE_COPY[role];
    const goal = useMemo(() => goalForPage(role, page, pathname), [role, page, pathname]);

    const lessonOnPage =
        Boolean(pathname?.match(/\/learn\/[^/]+/)) ||
        Boolean(pathname?.match(/\/agents\/learn\/[^/]+/));
    const showFab = !hideFab && !lessonOnPage;

    const firstName = userName?.trim().split(/\s+/)[0];

    return (
        <>
            <aside className="portal-ai-rail" aria-label="PropReady AI assistant rail">
                <div className="portal-ai-card portal-ai-card--glass">
                    <div className="portal-ai-card-head">
                        <Sparkles className="h-4 w-4 text-[#e53935]" />
                        <h3 className="portal-ai-title">AI assistant</h3>
                    </div>
                    <p className="portal-ai-sub">{copy.subtitle}</p>
                    {firstName ? (
                        <p className="portal-ai-hello">Hi {firstName} — ready when you are.</p>
                    ) : null}

                    <div className="portal-ai-blocks">
                        <div className="portal-ai-goal">
                            <p className="portal-ai-label portal-ai-label--red">Today&apos;s goal</p>
                            <p className="portal-ai-goal-text">{goal}</p>
                        </div>

                        <div>
                            <p className="portal-ai-label">{copy.tipTitle}</p>
                            <p className="portal-ai-body">{copy.tipBody}</p>
                        </div>

                        <div className="portal-ai-pulse">
                            <Newspaper className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563eb]" />
                            <div>
                                <p className="portal-ai-label">{copy.pulseTitle}</p>
                                <p className="portal-ai-body">{copy.pulseBody}</p>
                            </div>
                        </div>
                    </div>

                    <div className="portal-ai-actions">
                        <Link href={copy.calculatorHref} className="portal-ai-btn portal-ai-btn--ghost">
                            <Calculator className="h-3.5 w-3.5" />
                            Quick link
                        </Link>
                        <button
                            type="button"
                            className="portal-ai-btn portal-ai-btn--primary"
                            onClick={() => setAiOpen(true)}
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Chat with AI
                        </button>
                    </div>
                </div>

                <div className="portal-ai-card portal-ai-disclaimer">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    Educational only · not bank advice
                </div>
            </aside>

            <AiTutorFab
                variant="assistant"
                lessonTitle={copy.lessonTitle}
                lessonSubtitle={copy.lessonSubtitle}
                hubBasePath={copy.hubBasePath}
                open={aiOpen}
                onOpenChange={setAiOpen}
                fabClassName={showFab ? 'bottom-6 right-5' : 'sr-only pointer-events-none'}
            />
        </>
    );
}

/** Wrapper that places page content beside the sticky AI rail on wide screens. */
export function PortalAiContentShell({
    role,
    page,
    userName,
    hideFab,
    children,
}: PortalAiAssistantRailProps & { children: React.ReactNode }) {
    return (
        <div className="portal-ai-shell">
            <div className="portal-ai-main min-w-0">{children}</div>
            <PortalAiAssistantRail role={role} page={page} userName={userName} hideFab={hideFab} />
        </div>
    );
}
