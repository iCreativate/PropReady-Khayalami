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
import LearnExpandedCard from '@/components/LearnExpandedCard';
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
    hubHref?: string;
    hubLabel?: string;
    subtitle?: string;
}

export default function LearnArticleShell({
    title,
    icon = 'BookOpen',
    nextSlug,
    nextTitle,
    toolkit,
    children,
    hubHref = '/learn',
    hubLabel = 'Back to Learning Center',
    subtitle = 'A focused learning module to guide you step-by-step on your home journey.',
}: LearnArticleShellProps) {
    const { user } = useHydratedBuyerPortalUser();
    const IconComponent = ICON_MAP[icon] || BookOpen;

    const publicChrome = (
        <PublicSiteHeader
            backHref={hubHref}
            backLabel={hubLabel}
            showDesktopNav={false}
            mobileLinks={[]}
        />
    );

    const footer = (
        <>
            {toolkit}
            <div className="mt-12 pt-8 border-t border-charcoal/15 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <Link
                    href={hubHref}
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
        </>
    );

    const articleCard = (
        <LearnExpandedCard title={title} subtitle={subtitle} icon={IconComponent} footer={footer}>
            {children}
        </LearnExpandedCard>
    );

    return (
        <BuyerPortalShell activePage="learn" title="Learning Center" publicChrome={publicChrome}>
            {user ? (
                <div className={`${PORTAL_PAGE_CONTAINER} max-w-4xl`}>
                    <div className="mb-4">
                        <Link
                            href={hubHref}
                            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/70 hover:text-charcoal transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {hubLabel}
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
