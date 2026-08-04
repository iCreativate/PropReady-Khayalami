'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Home, KeyRound, ArrowRight } from 'lucide-react';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import { PORTAL_TEXT_SECONDARY } from '@/lib/portal-ui';

function GetStartedContent() {
    const searchParams = useSearchParams();
    const resume = searchParams.get('resume') === '1';

    return (
        <div className="min-h-screen bg-white">
            <PublicSiteHeader
                showDesktopNav={false}
                mobileLinks={[
                    { href: '/auth/login', label: 'Sign in' },
                    { href: '/learning-center', label: 'Learning Center' },
                ]}
                ctaHref="/auth/login"
                ctaLabel="Sign in"
            />

            <main className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
                <div className="w-full max-w-3xl mx-auto text-center relative z-10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold mb-4">
                        {resume ? 'Finish your profile' : 'Get started'}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold text-charcoal tracking-tight mb-4">
                        Prop<span className="text-gold">Ready</span>
                    </h1>
                    <p className={`text-lg ${PORTAL_TEXT_SECONDARY} mb-12 max-w-xl mx-auto leading-relaxed`}>
                        {resume
                            ? 'Complete a short quiz so we can show your buying readiness or listing details — and connect you with the right agents.'
                            : 'Take a short quiz first. Your answers power your PropReady score or listing details, and become a lead for verified agents.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                        <Link
                            href="/quiz"
                            className="group block rounded-2xl border border-charcoal/[0.08] bg-[#FAFAFA] p-7 hover:border-gold/40 hover:shadow-md transition"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center mb-5">
                                <KeyRound className="w-6 h-6 text-gold" />
                            </div>
                            <h2 className="text-xl font-bold text-charcoal mb-2">I&apos;m buying</h2>
                            <p className={`text-sm ${PORTAL_TEXT_SECONDARY} mb-5 leading-relaxed`}>
                                Get pre-qualified, see your PropReady score, and help agents match you to homes.
                            </p>
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold group-hover:gap-3 transition-all">
                                Start buyer quiz <ArrowRight className="w-4 h-4" />
                            </span>
                        </Link>

                        <Link
                            href="/sellers/property-quiz"
                            className="group block rounded-2xl border border-charcoal/[0.08] bg-[#FAFAFA] p-7 hover:border-gold/40 hover:shadow-md transition"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center mb-5">
                                <Home className="w-6 h-6 text-gold" />
                            </div>
                            <h2 className="text-xl font-bold text-charcoal mb-2">I&apos;m selling</h2>
                            <p className={`text-sm ${PORTAL_TEXT_SECONDARY} mb-5 leading-relaxed`}>
                                Tell us about your property so agents can prepare a valuation and marketing plan.
                            </p>
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold group-hover:gap-3 transition-all">
                                Start seller quiz <ArrowRight className="w-4 h-4" />
                            </span>
                        </Link>
                    </div>

                    <p className={`mt-10 text-sm ${PORTAL_TEXT_SECONDARY}`}>
                        Already completed a quiz?{' '}
                        <Link href="/auth/login" className="text-gold font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>

                <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden>
                    <div className="absolute top-24 left-8 w-64 h-64 bg-gold rounded-full blur-3xl" />
                    <div className="absolute bottom-16 right-8 w-80 h-80 bg-gold/40 rounded-full blur-3xl" />
                </div>
            </main>
        </div>
    );
}

export default function GetStartedPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center text-charcoal/50 text-sm">
                    Loading…
                </div>
            }
        >
            <GetStartedContent />
        </Suspense>
    );
}
