'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu, Scale, X } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import PortalAnnouncementBanner from '@/components/PortalAnnouncementBanner';
import PortalAppBarAlerts from '@/components/PortalAppBarAlerts';
import {
    CONVEYANCER_PORTAL_LINKS,
    type ConveyancerPortalPage,
} from '@/lib/conveyancer-portal-nav';
import {
    AGENT_NAV_ICON,
    AGENT_NAV_ICON_ACTIVE,
    AGENT_NAV_LABEL,
    AGENT_NAV_LINK,
    AGENT_NAV_LINK_ACTIVE,
    AGENT_NAV_LINK_IDLE,
    AGENT_PAGE_CONTAINER,
    AGENT_PAGE_HEADER_BAND,
    AGENT_SECONDARY_BTN,
    AGENT_SHELL_CONTENT,
    AGENT_SHELL_DIVIDER,
    AGENT_SHELL_ICON_BTN,
    AGENT_SHELL_NAV,
    AGENT_SHELL_NAV_SCROLL,
    AGENT_SHELL_SIDEBAR,
    AGENT_SHELL_SIDEBAR_MOBILE,
    AGENT_SHELL_SUBTITLE,
    AGENT_SHELL_TOPBAR,
} from '@/lib/agent-portal-ui';
import { signOutClient } from '@/lib/auth-signout';

export interface ConveyancerPortalUser {
    id?: string;
    fullName: string;
    email?: string;
    firmName?: string;
    status?: string;
}

interface Props {
    activePage: ConveyancerPortalPage;
    user: ConveyancerPortalUser | null;
    title?: string;
    pageHeader?: React.ReactNode;
    children: React.ReactNode;
}

function NavLinks({
    activePage,
    onNavigate,
}: {
    activePage: ConveyancerPortalPage;
    onNavigate?: () => void;
}) {
    return (
        <nav className={AGENT_SHELL_NAV} aria-label="Conveyancer portal">
            {CONVEYANCER_PORTAL_LINKS.map(({ page, href, label, icon: Icon }) => {
                const isActive = activePage === page;
                return (
                    <Link
                        key={page}
                        href={href}
                        onClick={onNavigate}
                        aria-current={isActive ? 'page' : undefined}
                        className={`${AGENT_NAV_LINK} ${
                            isActive ? AGENT_NAV_LINK_ACTIVE : AGENT_NAV_LINK_IDLE
                        }`}
                    >
                        <Icon
                            className={isActive ? AGENT_NAV_ICON_ACTIVE : AGENT_NAV_ICON}
                            strokeWidth={isActive ? 2.25 : 2}
                        />
                        <span className={AGENT_NAV_LABEL}>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default function ConveyancerPortalLayout({
    activePage,
    user,
    title,
    pageHeader,
    children,
}: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [activePage]);

    const activeLabel =
        CONVEYANCER_PORTAL_LINKS.find((l) => l.page === activePage)?.label ?? 'Conveyancer portal';

    return (
        <div className="min-h-dvh bg-[#F8FAFC] text-charcoal">
            <ImpersonationBanner />
            <aside className={`hidden lg:flex !fixed left-0 top-0 bottom-0 w-64 z-40 ${AGENT_SHELL_SIDEBAR}`}>
                <div className="px-5 py-5 border-b border-white/[0.08]">
                    <BrandLogo tone="dark" />
                    <p className={`${AGENT_SHELL_SUBTITLE} mt-3 flex items-center gap-1.5`}>
                        <Scale className="h-3.5 w-3.5" />
                        Conveyancer Connect
                    </p>
                    <p className="mt-2 truncate text-xs text-white/50">{user?.firmName || user?.fullName}</p>
                </div>
                <div className={AGENT_SHELL_NAV_SCROLL}>
                    <NavLinks activePage={activePage} />
                </div>
                <div className={`${AGENT_SHELL_DIVIDER} p-4`}>
                    <button
                        type="button"
                        onClick={() =>
                            void signOutClient({
                                accountType: 'conveyancer',
                                redirectTo: '/conveyancers/login',
                            })
                        }
                        className={`${AGENT_SECONDARY_BTN} w-full !border-white/15 !bg-white/5 !text-white hover:!bg-white/10`}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {mobileOpen ? (
                <div className="lg:hidden fixed inset-0 z-50">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        aria-label="Close navigation"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className={`absolute left-0 top-0 bottom-0 w-[280px] ${AGENT_SHELL_SIDEBAR_MOBILE}`}>
                        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.08]">
                            <BrandLogo tone="dark" />
                            <button
                                type="button"
                                className={AGENT_SHELL_ICON_BTN}
                                onClick={() => setMobileOpen(false)}
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto">
                            <NavLinks activePage={activePage} onNavigate={() => setMobileOpen(false)} />
                        </div>
                    </aside>
                </div>
            ) : null}

            <div className="lg:pl-64 min-h-dvh flex flex-col">
                <header className={`sticky top-0 z-20 ${AGENT_SHELL_TOPBAR}`}>
                    <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                type="button"
                                className={`lg:hidden ${AGENT_SHELL_ICON_BTN}`}
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open navigation"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal/45">
                                    Conveyancer portal
                                </p>
                                <h1 className="truncate text-base font-semibold sm:text-lg">
                                    {title || activeLabel}
                                </h1>
                            </div>
                        </div>
                        <PortalAppBarAlerts role="conveyancer" />
                    </div>
                </header>

                <main className={`flex-1 ${AGENT_SHELL_CONTENT}`}>
                    {pageHeader ? (
                        <div className={`${AGENT_PAGE_HEADER_BAND} px-4 sm:px-6 lg:px-8 py-5`}>
                            <div className={AGENT_PAGE_CONTAINER}>{pageHeader}</div>
                        </div>
                    ) : null}
                    <div className={`${AGENT_PAGE_CONTAINER} px-4 sm:px-6 lg:px-8 py-6`}>
                        <PortalAnnouncementBanner />
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
