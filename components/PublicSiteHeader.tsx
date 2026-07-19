import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import LearningCenterDropdown from '@/components/LearningCenterDropdown';
import {
    PORTAL_LOGO_MARK,
    PORTAL_ICON_LOGO,
    PORTAL_PRIMARY_BTN,
    PORTAL_SECONDARY_BTN,
} from '@/lib/portal-ui';

export type PublicNavLink = {
    href: string;
    label: string;
    isButton?: boolean;
};

interface PublicSiteHeaderProps {
    /** Shown on the left when set (replaces logo row alignment for simple pages) */
    backHref?: string;
    backLabel?: string;
    showLogo?: boolean;
    showDesktopNav?: boolean;
    mobileLinks?: PublicNavLink[];
    /** Right-side desktop CTA (e.g. Dashboard) */
    ctaHref?: string;
    ctaLabel?: string;
    className?: string;
}

const DEFAULT_MOBILE: PublicNavLink[] = [
    { href: '/learn', label: 'Learning Center - Buyers' },
    { href: '/learn/investors', label: 'Learning Center - Investors' },
    { href: '/sellers', label: 'For Sellers', isButton: true },
    { href: '/search', label: 'Properties' },
    { href: '/calculator', label: 'Bond Calculator' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/agents/login', label: 'Agent Login' },
];

export default function PublicSiteHeader({
    backHref,
    backLabel = 'Back',
    showLogo = true,
    showDesktopNav = true,
    mobileLinks = DEFAULT_MOBILE,
    ctaHref,
    ctaLabel,
    className = '',
}: PublicSiteHeaderProps) {
    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10 ${className}`}
        >
            <nav className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    {backHref ? (
                        <Link
                            href={backHref}
                            className="flex items-center gap-2 text-charcoal/70 hover:text-charcoal transition shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:inline">{backLabel}</span>
                        </Link>
                    ) : null}

                    {showLogo ? (
                        <Link href="/" className="flex items-center gap-2 min-w-0">
                            <div className={PORTAL_LOGO_MARK}>
                                <Home className={`${PORTAL_ICON_LOGO} text-white`} />
                            </div>
                            <span className="text-charcoal text-xl font-bold truncate">PropReady</span>
                        </Link>
                    ) : null}
                </div>

                {showDesktopNav ? (
                    <div className="hidden md:flex items-center gap-6 lg:gap-8">
                        <LearningCenterDropdown />
                        <Link href="/sellers" className={PORTAL_PRIMARY_BTN}>
                            For Sellers
                        </Link>
                        <Link
                            href="/search"
                            className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition"
                        >
                            Properties
                        </Link>
                        <Link
                            href="/calculator"
                            className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition"
                        >
                            Bond Calculator
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition"
                        >
                            Dashboard
                        </Link>
                        <Link href="/agents/login" className={PORTAL_SECONDARY_BTN}>
                            Agent Login
                        </Link>
                    </div>
                ) : ctaHref && ctaLabel ? (
                    <Link href={ctaHref} className={`hidden sm:inline-flex ${PORTAL_SECONDARY_BTN}`}>
                        {ctaLabel}
                    </Link>
                ) : null}

                {showDesktopNav || mobileLinks.length > 0 ? (
                    <MobileNav links={mobileLinks} />
                ) : null}
            </nav>
        </header>
    );
}
