'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import PortalAppBarAlerts from '@/components/PortalAppBarAlerts';
import UserProfileCompact from '@/components/UserProfileCompact';
import {
    getUserPortalLabel,
    getUserPortalLinks,
    type UserPortalKind,
    type UserPortalPage,
} from '@/lib/user-portal-nav';
import {
    PORTAL_PAGE_CONTAINER,
    PORTAL_PAGE_HEADER_BAND,
    PORTAL_SECONDARY_BTN,
    PORTAL_ICON_BTN,
    PORTAL_SHELL_SIDEBAR,
    PORTAL_SHELL_SIDEBAR_MOBILE,
    PORTAL_SHELL_CONTENT,
    PORTAL_SHELL_TOPBAR,
    PORTAL_SHELL_DIVIDER,
    PORTAL_SHELL_SUBTITLE,
    PORTAL_SHELL_FOOTER_LINK,
    PORTAL_SHELL_ICON_BTN,
    PORTAL_SHELL_NAV,
    PORTAL_SHELL_NAV_SCROLL,
    PORTAL_SHELL_NAV_GROUP,
    PORTAL_SHELL_NAV_GROUP_LABEL,
    PORTAL_NAV_LINK,
    PORTAL_NAV_LINK_IDLE,
    PORTAL_NAV_LINK_ACTIVE,
    PORTAL_NAV_ICON,
    PORTAL_NAV_ICON_ACTIVE,
    PORTAL_NAV_LABEL,
} from '@/lib/portal-ui';
import { signOutClient } from '@/lib/auth-signout';

export interface UserPortalUser {
    fullName: string;
    email?: string;
    id?: string;
    phone?: string;
}

interface UserPortalLayoutProps {
    portal: UserPortalKind;
    activePage: UserPortalPage;
    user?: UserPortalUser | null;
    title?: string;
    pageHeader?: React.ReactNode;
    children: React.ReactNode;
}

/** Visual groups only — link order unchanged */
const BUYER_NAV_GROUPS: { label: string; pages: UserPortalPage[] }[] = [
    { label: 'Workspace', pages: ['dashboard', 'properties', 'viewings', 'documents', 'agent'] },
    { label: 'Tools', pages: ['property-optimizer', 'calculator', 'learn', 'quiz'] },
];

const SELLER_NAV_GROUPS: { label: string; pages: UserPortalPage[] }[] = [
    { label: 'Workspace', pages: ['dashboard', 'valuation', 'property-quiz', 'agent'] },
    { label: 'Tools', pages: ['property-optimizer', 'learn', 'buyer-dashboard'] },
];

function NavLinks({
    portal,
    activePage,
    onNavigate,
}: {
    portal: UserPortalKind;
    activePage: UserPortalPage;
    onNavigate?: () => void;
}) {
    const links = getUserPortalLinks(portal);
    const groups = portal === 'buyer' ? BUYER_NAV_GROUPS : SELLER_NAV_GROUPS;

    return (
        <nav className={PORTAL_SHELL_NAV} aria-label={`${portal} portal`}>
            {groups.map((group) => {
                const groupLinks = group.pages
                    .map((page) => links.find((l) => l.page === page))
                    .filter(Boolean) as typeof links;

                if (groupLinks.length === 0) return null;

                return (
                    <div key={group.label} className={PORTAL_SHELL_NAV_GROUP}>
                        <p className={PORTAL_SHELL_NAV_GROUP_LABEL}>{group.label}</p>
                        <div className="flex flex-col gap-0.5">
                            {groupLinks.map(({ page, href, label, icon: Icon, emphasize }) => {
                                const isActive = activePage === page;
                                const isAlert = emphasize === 'alert';
                                return (
                                    <Link
                                        key={page}
                                        href={href}
                                        onClick={onNavigate}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`${PORTAL_NAV_LINK} ${
                                            isAlert
                                                ? isActive
                                                    ? 'portal-nav-link-active bg-red-600 text-white shadow-[0_1px_3px_rgba(0,0,0,0.18)]'
                                                    : 'bg-red-500/15 text-red-200 border border-red-400/20 hover:bg-red-500/25 hover:text-white'
                                                : isActive
                                                  ? PORTAL_NAV_LINK_ACTIVE
                                                  : PORTAL_NAV_LINK_IDLE
                                        }`}
                                    >
                                        <Icon
                                            className={
                                                isActive && !isAlert
                                                    ? PORTAL_NAV_ICON_ACTIVE
                                                    : isAlert && isActive
                                                      ? 'w-[1.25rem] h-[1.25rem] shrink-0 text-white'
                                                      : PORTAL_NAV_ICON
                                            }
                                            strokeWidth={isActive ? 2.25 : 2}
                                        />
                                        <span className={PORTAL_NAV_LABEL}>{label}</span>
                                        {isAlert && !isActive && (
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-red-300">
                                                Prequal
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </nav>
    );
}

export default function UserPortalLayout({
    portal,
    activePage,
    user,
    title,
    pageHeader,
    children,
}: UserPortalLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const links = getUserPortalLinks(portal);
    const activeLabel = links.find((l) => l.page === activePage)?.label ?? 'Dashboard';
    const portalLabel = getUserPortalLabel(portal);

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

    const handleSignOut = () => {
        void signOutClient({ accountType: 'user' });
    };

    return (
        <div className={`min-h-dvh lg:h-dvh lg:overflow-hidden ${PORTAL_SHELL_CONTENT}`}>
            <aside
                className={`hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-40 overflow-hidden ${PORTAL_SHELL_SIDEBAR}`}
            >
                <div className={`px-5 py-5 border-b ${PORTAL_SHELL_DIVIDER} shrink-0`}>
                    <BrandLogo />
                    <p className={PORTAL_SHELL_SUBTITLE}>{portalLabel}</p>
                </div>
                <div className={PORTAL_SHELL_NAV_SCROLL}>
                    <NavLinks portal={portal} activePage={activePage} />
                </div>
                <div className={`px-5 py-4 border-t ${PORTAL_SHELL_DIVIDER} shrink-0`}>
                    <Link
                        href={portal === 'buyer' ? '/sellers/dashboard' : '/dashboard'}
                        className={PORTAL_SHELL_FOOTER_LINK}
                    >
                        Switch to {portal === 'buyer' ? 'seller' : 'buyer'} portal →
                    </Link>
                </div>
            </aside>

            {/* Mobile drawer — always mounted for smooth transitions */}
            <div
                className={`lg:hidden fixed inset-0 z-50 portal-nav-drawer-backdrop ${
                    mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                aria-hidden={!mobileOpen}
            >
                <button
                    type="button"
                    className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                    aria-label="Close menu"
                    tabIndex={mobileOpen ? 0 : -1}
                    onClick={() => setMobileOpen(false)}
                />
                <aside
                    className={`absolute left-0 top-0 bottom-0 w-72 flex flex-col portal-nav-drawer-panel ${PORTAL_SHELL_SIDEBAR_MOBILE} ${
                        mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation menu"
                >
                    <div className={`flex items-center justify-between px-5 py-4 border-b ${PORTAL_SHELL_DIVIDER} shrink-0`}>
                        <BrandLogo size="sm" onClick={() => setMobileOpen(false)} />
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className={PORTAL_SHELL_ICON_BTN}
                            aria-label="Close"
                            tabIndex={mobileOpen ? 0 : -1}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className={PORTAL_SHELL_NAV_SCROLL}>
                        <NavLinks
                            portal={portal}
                            activePage={activePage}
                            onNavigate={() => setMobileOpen(false)}
                        />
                    </div>
                    <div className={`px-5 py-4 border-t ${PORTAL_SHELL_DIVIDER} shrink-0`}>
                        <Link
                            href={portal === 'buyer' ? '/sellers/dashboard' : '/dashboard'}
                            onClick={() => setMobileOpen(false)}
                            className={PORTAL_SHELL_FOOTER_LINK}
                            tabIndex={mobileOpen ? 0 : -1}
                        >
                            Switch to {portal === 'buyer' ? 'seller' : 'buyer'} portal →
                        </Link>
                    </div>
                </aside>
            </div>

            <header
                className={`fixed top-0 right-0 left-0 lg:left-64 z-30 h-[4.25rem] ${PORTAL_SHELL_TOPBAR}`}
            >
                <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className={`lg:hidden ${PORTAL_ICON_BTN}`}
                            aria-label="Open menu"
                            aria-expanded={mobileOpen}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-charcoal/40 leading-none mb-1 hidden sm:block">
                                {portalLabel}
                            </p>
                            <h1 className="text-lg sm:text-xl font-semibold text-charcoal truncate tracking-tight leading-tight">
                                {title ?? activeLabel}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <PortalAppBarAlerts role={portal === 'seller' ? 'seller' : 'buyer'} />
                        {user && <UserProfileCompact user={user} portal={portal} />}
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className={`${PORTAL_SECONDARY_BTN} !h-9 !px-3.5`}
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className={`lg:pl-64 pt-[4.25rem] min-h-dvh lg:h-dvh lg:overflow-y-auto lg:overscroll-contain ${PORTAL_SHELL_CONTENT}`}>
                {pageHeader && (
                    <div
                        className={`${PORTAL_PAGE_HEADER_BAND} px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 lg:py-11`}
                    >
                        <div className={PORTAL_PAGE_CONTAINER}>{pageHeader}</div>
                    </div>
                )}
                <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10">{children}</div>
            </main>
        </div>
    );
}
