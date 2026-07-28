'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import PortalAnnouncementBanner from '@/components/PortalAnnouncementBanner';
import PortalAppBarAlerts from '@/components/PortalAppBarAlerts';
import { bondOriginatorLabel } from '@/lib/bond-originators';
import { ORIGINATOR_PORTAL_LINKS, type OriginatorPortalPage } from '@/lib/originator-portal-nav';
import {
    ORIGINATOR_NAV_ICON,
    ORIGINATOR_NAV_ICON_ACTIVE,
    ORIGINATOR_NAV_LABEL,
    ORIGINATOR_NAV_LINK,
    ORIGINATOR_NAV_LINK_ACTIVE,
    ORIGINATOR_NAV_LINK_IDLE,
    ORIGINATOR_PAGE_CONTAINER,
    ORIGINATOR_PAGE_HEADER_BAND,
    ORIGINATOR_SECONDARY_BTN,
    ORIGINATOR_SHELL_CONTENT,
    ORIGINATOR_SHELL_DIVIDER,
    ORIGINATOR_SHELL_ICON_BTN,
    ORIGINATOR_SHELL_NAV,
    ORIGINATOR_SHELL_NAV_SCROLL,
    ORIGINATOR_SHELL_SIDEBAR,
    ORIGINATOR_SHELL_SIDEBAR_MOBILE,
    ORIGINATOR_SHELL_SUBTITLE,
    ORIGINATOR_SHELL_TOPBAR,
} from '@/lib/originator-portal-ui';
import { signOutClient } from '@/lib/auth-signout';

export interface OriginatorPortalUser {
    fullName: string;
    email?: string;
    organizationId?: string;
}

interface OriginatorPortalLayoutProps {
    activePage: OriginatorPortalPage;
    user: OriginatorPortalUser | null;
    title?: string;
    pageHeader?: React.ReactNode;
    children: React.ReactNode;
}

function NavLinks({
    activePage,
    onNavigate,
}: {
    activePage: OriginatorPortalPage;
    onNavigate?: () => void;
}) {
    return (
        <nav className={ORIGINATOR_SHELL_NAV} aria-label="Originator portal">
            {ORIGINATOR_PORTAL_LINKS.map(({ page, href, label, icon: Icon }) => {
                const isActive = activePage === page || (activePage === 'cases' && page === 'dashboard');
                return (
                    <Link
                        key={page}
                        href={href}
                        onClick={onNavigate}
                        aria-current={isActive ? 'page' : undefined}
                        className={`${ORIGINATOR_NAV_LINK} ${
                            isActive ? ORIGINATOR_NAV_LINK_ACTIVE : ORIGINATOR_NAV_LINK_IDLE
                        }`}
                    >
                        <Icon
                            className={isActive ? ORIGINATOR_NAV_ICON_ACTIVE : ORIGINATOR_NAV_ICON}
                            strokeWidth={isActive ? 2.25 : 2}
                        />
                        <span className={ORIGINATOR_NAV_LABEL}>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default function OriginatorPortalLayout({
    activePage,
    user,
    title,
    pageHeader,
    children,
}: OriginatorPortalLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const orgName = bondOriginatorLabel(user?.organizationId) || 'Bond originator';
    const activeLabel =
        ORIGINATOR_PORTAL_LINKS.find((l) => l.page === activePage)?.label ?? 'Originator portal';

    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    return (
        <div className={`min-h-dvh lg:h-dvh lg:overflow-hidden ${ORIGINATOR_SHELL_CONTENT}`}>
            <ImpersonationBanner />
            <aside
                className={`hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-40 overflow-hidden ${ORIGINATOR_SHELL_SIDEBAR}`}
            >
                <div className={`px-5 py-5 border-b ${ORIGINATOR_SHELL_DIVIDER} shrink-0`}>
                    <BrandLogo tone="dark" />
                    <p className={ORIGINATOR_SHELL_SUBTITLE}>Originator portal</p>
                </div>
                <div className={ORIGINATOR_SHELL_NAV_SCROLL}>
                    <NavLinks activePage={activePage} />
                </div>
            </aside>

            <div
                className={`lg:hidden fixed inset-0 z-50 portal-nav-drawer-backdrop ${
                    mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            >
                <button
                    type="button"
                    className="absolute inset-0 bg-black/45"
                    aria-label="Close menu"
                    onClick={() => setMobileOpen(false)}
                />
                <aside
                    className={`absolute left-0 top-0 bottom-0 w-72 flex flex-col ${ORIGINATOR_SHELL_SIDEBAR_MOBILE} ${
                        mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    } transition-transform`}
                >
                    <div className={`flex items-center justify-between px-5 py-4 border-b ${ORIGINATOR_SHELL_DIVIDER}`}>
                        <BrandLogo tone="dark" size="sm" onClick={() => setMobileOpen(false)} />
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className={ORIGINATOR_SHELL_ICON_BTN}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className={ORIGINATOR_SHELL_NAV_SCROLL}>
                        <NavLinks activePage={activePage} onNavigate={() => setMobileOpen(false)} />
                    </div>
                </aside>
            </div>

            <header className={`fixed top-0 right-0 left-0 lg:left-64 z-30 h-[4.25rem] ${ORIGINATOR_SHELL_TOPBAR}`}>
                <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className={`lg:hidden ${ORIGINATOR_SHELL_ICON_BTN} !text-charcoal`}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-charcoal/40 leading-none mb-1 hidden sm:block">
                                {orgName}
                            </p>
                            <h1 className="text-lg sm:text-xl font-semibold text-charcoal truncate tracking-tight">
                                {title ?? activeLabel}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <PortalAppBarAlerts role="originator" />
                        {user && (
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-charcoal truncate max-w-[160px]">
                                    {user.fullName}
                                </p>
                                <p className="text-xs text-charcoal/45 truncate max-w-[160px]">{user.email}</p>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                void signOutClient({ accountType: 'originator' });
                            }}
                            className={`${ORIGINATOR_SECONDARY_BTN} !h-9 !px-3.5`}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className={`lg:pl-64 pt-[4.25rem] min-h-dvh lg:h-dvh lg:overflow-y-auto lg:overscroll-contain ${ORIGINATOR_SHELL_CONTENT}`}>
                {pageHeader && (
                    <div className={`${ORIGINATOR_PAGE_HEADER_BAND} px-4 sm:px-6 lg:px-8 xl:px-10 py-8`}>
                        <div className={ORIGINATOR_PAGE_CONTAINER}>{pageHeader}</div>
                    </div>
                )}
                <div className={`${ORIGINATOR_PAGE_CONTAINER} px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8`}>
                    <PortalAnnouncementBanner />
                    {children}
                </div>
            </main>
        </div>
    );
}
