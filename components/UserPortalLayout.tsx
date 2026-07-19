'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, LogOut, Menu, X } from 'lucide-react';
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
    PORTAL_LOGO_MARK,
    PORTAL_LOGO_MARK_SM,
    PORTAL_ICON_LOGO,
    PORTAL_ICON_LOGO_SM,
    PORTAL_SECONDARY_BTN,
    PORTAL_ICON_BTN,
    PORTAL_SHELL_SIDEBAR,
    PORTAL_SHELL_SIDEBAR_MOBILE,
    PORTAL_SHELL_CONTENT,
    PORTAL_SHELL_TOPBAR,
    PORTAL_NAV_LINK,
    PORTAL_NAV_LINK_IDLE,
    PORTAL_NAV_LINK_ACTIVE,
} from '@/lib/portal-ui';
import { signOutClient } from '@/lib/auth-signout';

export interface UserPortalUser {
    fullName: string;
    email?: string;
    id?: string;
}

interface UserPortalLayoutProps {
    portal: UserPortalKind;
    activePage: UserPortalPage;
    user?: UserPortalUser | null;
    title?: string;
    pageHeader?: React.ReactNode;
    children: React.ReactNode;
}

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

    return (
        <nav className="flex flex-col gap-1 px-3">
            {links.map(({ page, href, label, icon: Icon, emphasize }) => {
                const isActive = activePage === page;
                const isAlert = emphasize === 'alert';
                return (
                    <Link
                        key={page}
                        href={href}
                        onClick={onNavigate}
                        className={`${PORTAL_NAV_LINK} ${
                            isAlert
                                ? isActive
                                    ? 'bg-red-600 text-white border border-red-700 shadow-sm'
                                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:text-red-800'
                                : isActive
                                  ? PORTAL_NAV_LINK_ACTIVE
                                  : PORTAL_NAV_LINK_IDLE
                        }`}
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1">{label}</span>
                        {isAlert && !isActive && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                                Prequal
                            </span>
                        )}
                    </Link>
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

    const handleSignOut = () => {
        void signOutClient({ accountType: 'user' });
    };

    return (
        <div className={`min-h-screen ${PORTAL_SHELL_CONTENT}`}>
            <aside
                className={`hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-40 ${PORTAL_SHELL_SIDEBAR}`}
            >
                <div className="px-5 py-6 border-b border-charcoal/[0.08]">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className={PORTAL_LOGO_MARK}>
                            <Home className={`${PORTAL_ICON_LOGO} text-white`} />
                        </div>
                        <span className="text-charcoal text-lg font-semibold">PropReady</span>
                    </Link>
                    <p className="text-charcoal/45 text-xs mt-2 pl-0.5">{portalLabel}</p>
                </div>
                <div className="flex-1 py-4 overflow-y-auto">
                    <NavLinks portal={portal} activePage={activePage} />
                </div>
                <div className="px-5 py-4 border-t border-charcoal/[0.08]">
                    <Link
                        href={portal === 'buyer' ? '/sellers/dashboard' : '/dashboard'}
                        className="text-xs font-medium text-charcoal/50 hover:text-gold transition"
                    >
                        Switch to {portal === 'buyer' ? 'seller' : 'buyer'} portal →
                    </Link>
                </div>
            </aside>

            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        aria-label="Close menu"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside
                        className={`absolute left-0 top-0 bottom-0 w-72 flex flex-col ${PORTAL_SHELL_SIDEBAR_MOBILE}`}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal/[0.08]">
                            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                                <div className={PORTAL_LOGO_MARK_SM}>
                                    <Home className={`${PORTAL_ICON_LOGO_SM} text-white`} />
                                </div>
                                <span className="font-semibold text-charcoal">PropReady</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className={PORTAL_ICON_BTN}
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-charcoal" />
                            </button>
                        </div>
                        <div className="flex-1 py-4 overflow-y-auto">
                            <NavLinks
                                portal={portal}
                                activePage={activePage}
                                onNavigate={() => setMobileOpen(false)}
                            />
                        </div>
                        <div className="px-5 py-4 border-t border-charcoal/[0.08]">
                            <Link
                                href={portal === 'buyer' ? '/sellers/dashboard' : '/dashboard'}
                                onClick={() => setMobileOpen(false)}
                                className="text-xs font-medium text-charcoal/50 hover:text-gold transition"
                            >
                                Switch to {portal === 'buyer' ? 'seller' : 'buyer'} portal →
                            </Link>
                        </div>
                    </aside>
                </div>
            )}

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
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-semibold text-charcoal truncate tracking-tight">
                                {title ?? activeLabel}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

            <main className={`lg:pl-64 pt-[4.25rem] min-h-screen ${PORTAL_SHELL_CONTENT}`}>
                {pageHeader && (
                    <div
                        className={`${PORTAL_PAGE_HEADER_BAND} px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 lg:py-11`}
                    >
                        <div className={`${PORTAL_PAGE_CONTAINER} !pb-0`}>{pageHeader}</div>
                    </div>
                )}
                <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 lg:py-12">{children}</div>
            </main>
        </div>
    );
}
