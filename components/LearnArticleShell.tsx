'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PortalPageHeader from '@/components/PortalPageHeader';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import {
    PORTAL_CARD,
    PORTAL_PAGE_CONTAINER,
    PORTAL_PRIMARY_BTN,
    PORTAL_SECONDARY_BTN,
    PORTAL_TEXT_SECONDARY,
} from '@/lib/portal-ui';

interface LearnArticleShellProps {
    title: string;
    nextSlug?: string | null;
    nextTitle?: string | null;
    toolkit?: React.ReactNode;
    children: React.ReactNode;
}

export default function LearnArticleShell({
    title,
    nextSlug,
    nextTitle,
    toolkit,
    children,
}: LearnArticleShellProps) {
    const { user } = useHydratedBuyerPortalUser();

    const pageHeader = (
        <PortalPageHeader variant="premium" eyebrow="Learning Center" title={title}>
            <Link href="/learn" className={`${PORTAL_SECONDARY_BTN} mt-4 h-9 px-4 text-xs`}>
                <ArrowLeft className="w-4 h-4" />
                Back to Learning Center
            </Link>
        </PortalPageHeader>
    );

    const publicChrome = (
        <PublicSiteHeader
            backHref="/learn"
            backLabel="Back to Learning Center"
            showDesktopNav={false}
            mobileLinks={[]}
        />
    );

    const footer = (
        <div className="mt-12 pt-8 border-t border-charcoal/[0.08] flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <Link
                href="/learn"
                className={`inline-flex items-center gap-2 text-sm font-medium transition hover:text-charcoal ${PORTAL_TEXT_SECONDARY}`}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Topics
            </Link>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 md:items-center md:ml-auto">
                {nextSlug && nextTitle && (
                    <Link href={`/learn/${nextSlug}`} className={PORTAL_SECONDARY_BTN}>
                        Next Topic: {nextTitle}
                    </Link>
                )}

                {!user && (
                    <Link href="/quiz" className={PORTAL_PRIMARY_BTN}>
                        Start Your Journey
                    </Link>
                )}
            </div>
        </div>
    );

    const articleBody = (
        <>
            <div className="prose max-w-none text-charcoal/90">{children}</div>
            {toolkit}
            {footer}
        </>
    );

    return (
        <BuyerPortalShell
            activePage="learn"
            title="Learning Center"
            pageHeader={user ? pageHeader : undefined}
            publicChrome={publicChrome}
        >
            {user ? (
                <div className={PORTAL_PAGE_CONTAINER}>
                    <article className={PORTAL_CARD}>
                        <div className="px-6 sm:px-8 md:px-10 py-8 md:py-10">{articleBody}</div>
                    </article>
                </div>
            ) : (
                <div className="relative pb-8 pt-4">
                    <div className="container mx-auto max-w-4xl relative z-10">
                        <article className={PORTAL_CARD}>
                            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-charcoal/[0.06]">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-charcoal/[0.03] border border-charcoal/[0.06] flex items-center justify-center shrink-0">
                                        <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-gold" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-semibold text-charcoal leading-tight mb-2 tracking-tight">
                                            {title}
                                        </h1>
                                        <p className={`text-sm md:text-base max-w-xl ${PORTAL_TEXT_SECONDARY}`}>
                                            A focused learning module to guide you step-by-step on your
                                            home journey.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 md:px-10 py-8 md:py-10">{articleBody}</div>
                        </article>
                    </div>
                </div>
            )}
        </BuyerPortalShell>
    );
}
