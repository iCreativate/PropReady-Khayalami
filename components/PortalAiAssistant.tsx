'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AiTutorFab from '@/components/buyer-learn/course/AiTutorFab';

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

    if (!enabled || shouldSuppressForPath(pathname)) return null;

    const ctx = CONTEXT[portal];

    return (
        <AiTutorFab
            variant="assistant"
            lessonTitle={ctx.title}
            lessonSubtitle={ctx.subtitle}
            hubBasePath={ctx.hubBasePath}
            open={open}
            onOpenChange={setOpen}
            fabClassName="bottom-6 right-5"
        />
    );
}
