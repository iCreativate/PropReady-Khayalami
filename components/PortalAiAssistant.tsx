'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import AiTutorFab from '@/components/buyer-learn/course/AiTutorFab';
import { useAiAssistantVisibility } from '@/hooks/useAiAssistantVisibility';

export type PortalAiKind = 'buyer' | 'seller' | 'agent' | 'originator' | 'conveyancer';

const CONTEXT: Record<
    PortalAiKind,
    { title: string; subtitle: string; hubBasePath: string }
> = {
    buyer: {
        title: 'Buyer portal',
        subtitle:
            'Bond readiness, affordability, Property Companion™, live repo/prime context, documents, viewings and next steps on PropReady',
        hubBasePath: '/dashboard',
    },
    seller: {
        title: 'Seller portal',
        subtitle: 'Valuations, listings, agents, buyer readiness and selling strategy on PropReady',
        hubBasePath: '/sellers/dashboard',
    },
    agent: {
        title: 'Agent portal',
        subtitle: 'Leads, viewings, listings, client readiness and PropReady workflows for agents',
        hubBasePath: '/agents/dashboard',
    },
    originator: {
        title: 'Originator portal',
        subtitle: 'Bond cases, buyer packs, bank submissions and PropReady originator workflows',
        hubBasePath: '/originators/dashboard',
    },
    conveyancer: {
        title: 'Conveyancer portal',
        subtitle: 'Matters, quotes, deeds office progress and PropReady conveyancing workflows',
        hubBasePath: '/conveyancers/portal',
    },
};

/** Immersive lesson canvases mount their own AI Tutor — avoid two FABs. */
function shouldSuppressForPath(pathname: string | null): boolean {
    if (!pathname) return false;
    if (/^\/learn\/investors\/[^/]+$/.test(pathname)) return true;
    if (/^\/learn\/[^/]+$/.test(pathname) && pathname !== '/learn/investors') return true;
    if (/^\/sellers\/learn\/[^/]+$/.test(pathname)) return true;
    return false;
}

/**
 * PropReady AI Assistant FAB for authenticated portal shells.
 */
export default function PortalAiAssistant({
    portal,
    enabled = true,
}: {
    portal: PortalAiKind;
    enabled?: boolean;
}) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const { hidden, ready, hide, show } = useAiAssistantVisibility();

    if (!enabled || shouldSuppressForPath(pathname) || !ready) return null;

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

    const ctx = CONTEXT[portal];

    return (
        <AiTutorFab
            variant="assistant"
            lessonTitle={ctx.title}
            lessonSubtitle={ctx.subtitle}
            hubBasePath={ctx.hubBasePath}
            open={open}
            onOpenChange={setOpen}
            onHide={hide}
            fabClassName="bottom-6 right-5"
        />
    );
}
