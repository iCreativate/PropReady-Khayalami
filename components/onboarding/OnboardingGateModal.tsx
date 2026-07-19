'use client';

import type { ReactNode } from 'react';

interface OnboardingGateModalProps {
    open: boolean;
    title: string;
    subtitle: string;
    children: ReactNode;
}

/** Blocking overlay — no dismiss control. Dashboard stays non-interactive underneath. */
export default function OnboardingGateModal({
    open,
    title,
    subtitle,
    children,
}: OnboardingGateModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-gate-title"
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-charcoal/[0.06]">
                <div className="sticky top-0 bg-white border-b border-charcoal/[0.06] px-6 py-5 rounded-t-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold mb-1">
                        Required to continue
                    </p>
                    <h2 id="onboarding-gate-title" className="text-xl font-bold text-charcoal">
                        {title}
                    </h2>
                    <p className="text-sm text-charcoal/60 mt-1">{subtitle}</p>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}
