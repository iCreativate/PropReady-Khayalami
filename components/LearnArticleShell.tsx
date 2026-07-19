'use client';

import Link from 'next/link';
import {
    ArrowLeft,
    BookOpen,
    Calculator,
    FileText,
    Users,
    Home,
    Wallet,
    Coins,
    Building2,
    Scale,
    AlertCircle,
    ShieldCheck,
    Briefcase,
    type LucideIcon,
} from 'lucide-react';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import { PORTAL_PAGE_CONTAINER, PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';

const ICON_MAP: Record<string, LucideIcon> = {
    Calculator,
    BookOpen,
    FileText,
    Users,
    Home,
    Wallet,
    Coins,
    Building2,
    Scale,
    AlertCircle,
    ShieldCheck,
    Briefcase,
};

interface LearnArticleShellProps {
    title: string;
    icon?: string;
    nextSlug?: string | null;
    nextTitle?: string | null;
    toolkit?: React.ReactNode;
    children: React.ReactNode;
}

export default function LearnArticleShell({
    title,
    icon = 'BookOpen',
    nextSlug,
    nextTitle,
    toolkit,
    children,
}: LearnArticleShellProps) {
    const { user } = useHydratedBuyerPortalUser();
    const IconComponent = ICON_MAP[icon] || BookOpen;

    const publicChrome = (
        <PublicSiteHeader
            backHref="/learn"
            backLabel="Back to Learning Center"
            showDesktopNav={false}
            mobileLinks={[]}
        />
    );

    const articleCard = (
        <div className="rounded-3xl shadow-2xl border border-charcoal/10 bg-white/90 backdrop-blur-xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-6 md:px-10 py-6 md:py-8 border-b border-gold/20">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg shrink-0">
                        <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
                            {title}
                        </h1>
                        <p className="text-white/90 text-sm md:text-base max-w-xl">
                            A focused learning module to guide you step-by-step on your home journey.
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-10 py-8 md:py-10 bg-gradient-to-b from-white to-charcoal/5">
                <div className="prose max-w-none text-charcoal/90">{children}</div>

                {toolkit}

                <div className="mt-12 pt-8 border-t border-charcoal/15 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <Link
                        href="/learn"
                        className="text-charcoal/70 hover:text-charcoal transition flex items-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Topics
                    </Link>

                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 md:items-center md:ml-auto">
                        {nextSlug && nextTitle && (
                            <Link
                                href={`/learn/${nextSlug}`}
                                className="px-6 py-3 border border-gold/40 text-gold font-semibold rounded-xl hover:bg-gold/10 transition shadow-sm text-center"
                            >
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
            </div>
        </div>
    );

    return (
        <BuyerPortalShell
            activePage="learn"
            title="Learning Center"
            publicChrome={publicChrome}
        >
            {user ? (
                <div className={`${PORTAL_PAGE_CONTAINER} max-w-4xl`}>
                    <div className="mb-4">
                        <Link
                            href="/learn"
                            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/70 hover:text-charcoal transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Learning Center
                        </Link>
                    </div>
                    {articleCard}
                </div>
            ) : (
                <div className="relative pb-8">
                    <div className="container mx-auto max-w-4xl relative z-10">{articleCard}</div>
                    <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
                        <div className="absolute top-20 left-10 w-72 h-72 bg-gold/40 rounded-full blur-3xl" />
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/30 rounded-full blur-3xl" />
                    </div>
                </div>
            )}
        </BuyerPortalShell>
    );
}
