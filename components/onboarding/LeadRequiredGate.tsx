'use client';

import Link from 'next/link';
import { ArrowRight, Home, KeyRound } from 'lucide-react';
import OnboardingGateModal from '@/components/onboarding/OnboardingGateModal';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

interface LeadRequiredGateProps {
    open: boolean;
}

/** Blocking prompt when a signed-in consumer has never completed a quiz. No dismiss. */
export default function LeadRequiredGate({ open }: LeadRequiredGateProps) {
    return (
        <OnboardingGateModal
            open={open}
            title="Complete a short quiz first"
            subtitle="First-time users must finish a buyer or seller quiz before using the portal. Your answers power your PropReady score or listing details, and become a lead for verified agents."
        >
            <div className="space-y-3">
                <Link
                    href="/quiz"
                    className={`${PORTAL_PRIMARY_BTN} w-full justify-center inline-flex items-center gap-2`}
                >
                    <KeyRound className="w-4 h-4" />
                    I&apos;m buying
                    <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                    href="/sellers/property-quiz"
                    className={`${PORTAL_SECONDARY_BTN} w-full justify-center inline-flex items-center gap-2`}
                >
                    <Home className="w-4 h-4" />
                    I&apos;m selling
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </OnboardingGateModal>
    );
}
