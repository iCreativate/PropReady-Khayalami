'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Home, KeyRound, BookOpen, ArrowRight } from 'lucide-react';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import { PORTAL_CARD, PORTAL_PAGE_CONTAINER, PORTAL_TEXT_SECONDARY } from '@/lib/portal-ui';

function GetStartedContent() {
    const searchParams = useSearchParams();
    const resume = searchParams.get('resume') === '1';

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <PublicSiteHeader
                showDesktopNav={false}
                mobileLinks={[
                    { href: '/auth/login', label: 'Sign in' },
                    { href: '/learning-center', label: 'Learning Center' },
                ]}
                ctaHref="/auth/login"
                ctaLabel="Sign in"
            />

            <main className="relative flex min-h-screen items-center justify-center px-4 pb-16 pt-24">
                <div className={`${PORTAL_PAGE_CONTAINER} relative z-10 mx-auto w-full max-w-3xl text-center`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold mb-4">
                        {resume ? 'Finish your profile' : 'Get started'}
                    </p>
                    <h1 className="biw-sec-title text-[2rem] sm:text-[2.5rem] md:text-[3rem] mb-4">
                        Prop<span className="text-gold">Ready</span>
                    </h1>
                    <p className={`text-lg ${PORTAL_TEXT_SECONDARY} mb-12 max-w-xl mx-auto leading-relaxed`}>
                        {resume
                            ? 'Complete a short quiz so we can show your buying readiness or listing details — and connect you with the right agents.'
                            : 'Take a short quiz first. Your answers power your PropReady score or listing details, and become a lead for verified agents.'}
                    </p>

                    <div className="grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
                        <Link
                            href="/quiz"
                            className={`${PORTAL_CARD} group block p-7 transition hover:border-gold/30`}
                        >
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.08]">
                                <KeyRound className="h-6 w-6 text-gold" />
                            </div>
                            <h2 className="mb-2 text-xl font-bold text-charcoal">I&apos;m buying</h2>
                            <p className={`mb-5 text-sm leading-relaxed ${PORTAL_TEXT_SECONDARY}`}>
                                Get pre-qualified, see your PropReady score, and help agents match you to homes.
                            </p>
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition-all group-hover:gap-3">
                                Start buyer quiz <ArrowRight className="h-4 w-4" />
                            </span>
                        </Link>

                        <Link
                            href="/sellers/quiz"
                            className={`${PORTAL_CARD} group block p-7 transition hover:border-gold/30`}
                        >
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.08]">
                                <Home className="h-6 w-6 text-gold" />
                            </div>
                            <h2 className="mb-2 text-xl font-bold text-charcoal">I&apos;m selling</h2>
                            <p className={`mb-5 text-sm leading-relaxed ${PORTAL_TEXT_SECONDARY}`}>
                                Tell us about your property so agents can prepare a valuation and marketing plan.
                            </p>
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition-all group-hover:gap-3">
                                Start seller quiz <ArrowRight className="h-4 w-4" />
                            </span>
                        </Link>

                        <Link
                            href="/learning-center"
                            className={`${PORTAL_CARD} group block p-7 transition hover:border-gold/30 sm:col-span-2 lg:col-span-1`}
                        >
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.08]">
                                <BookOpen className="h-6 w-6 text-gold" />
                            </div>
                            <h2 className="mb-2 text-xl font-bold text-charcoal">Just learning</h2>
                            <p className={`mb-5 text-sm leading-relaxed ${PORTAL_TEXT_SECONDARY}`}>
                                Explore buyers, sellers and investor guides — no quiz or account required to start.
                            </p>
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition-all group-hover:gap-3">
                                Open Learning Center <ArrowRight className="h-4 w-4" />
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
