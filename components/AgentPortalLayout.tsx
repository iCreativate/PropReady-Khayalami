'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    Users,
    Building2,
    Calendar,
    CreditCard,
    BookOpen,
    Settings,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { AgentProfileCompact } from '@/components/AgentProfileSummary';
import {
    AGENT_PAGE_CONTAINER,
    AGENT_PAGE_HEADER_BAND,
    AGENT_SECONDARY_BTN,
    AGENT_ICON_BTN,
    AGENT_SHELL_SIDEBAR,
    AGENT_SHELL_SIDEBAR_MOBILE,
    AGENT_SHELL_CONTENT,
    AGENT_SHELL_TOPBAR,
    AGENT_SHELL_DIVIDER,
    AGENT_SHELL_SUBTITLE,
    AGENT_SHELL_ICON_BTN,
    AGENT_SHELL_NAV,
    AGENT_SHELL_NAV_SCROLL,
    AGENT_SHELL_NAV_GROUP,
    AGENT_SHELL_NAV_GROUP_LABEL,
    AGENT_NAV_LINK,
    AGENT_NAV_LINK_IDLE,
    AGENT_NAV_LINK_ACTIVE,
    AGENT_NAV_ICON,
    AGENT_NAV_ICON_ACTIVE,
    AGENT_NAV_LABEL,
} from '@/lib/agent-portal-ui';
import { signOutClient } from '@/lib/auth-signout';

export type AgentPortalPage =
    | 'dashboard'
    | 'my-leads'
    | 'properties'
    | 'viewings'
    | 'plan'
    | 'learn'
    | 'settings';

export interface AgentPortalAgent {
    fullName: string;
    email?: string;
    company?: string;
    plan?: string;
    sellerPlan?: string;
    phone?: string;
    city?: string;
    verificationStatus?: string;
    ppraNumber?: string;
}

interface AgentPortalLayoutProps {
    activePage: AgentPortalPage;
    agent: AgentPortalAgent | null;
    title?: string;
    pageHeader?: React.ReactNode;
    children: React.ReactNode;
}

const SIDEBAR_LINKS: {
    page: AgentPortalPage;
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
}[] = [
    { page: 'dashboard', href: '/agents/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'my-leads', href: '/agents/my-leads', label: 'My Leads', icon: Users },
    { page: 'properties', href: '/agents/properties', label: 'Properties', icon: Building2 },
    { page: 'viewings', href: '/agents/viewings', label: 'Viewings', icon: Calendar },
    { page: 'plan', href: '/agents/plan', label: 'Your Plan', icon: CreditCard },
    { page: 'learn', href: '/agents/learn', label: 'Learning Hub', icon: BookOpen },
    { page: 'settings', href: '/agents/settings', label: 'Settings', icon: Settings },
];

/** Visual groups only — link order unchanged */
const NAV_GROUPS: { label: string; pages: AgentPortalPage[] }[] = [
    { label: 'Workspace', pages: ['dashboard', 'my-leads', 'properties', 'viewings'] },
    { label: 'Account', pages: ['plan', 'learn', 'settings'] },
];

function NavLinks({
    activePage,
    onNavigate,
}: {
    activePage: AgentPortalPage;
    onNavigate?: () => void;
}) {
    return (
        <nav className={AGENT_SHELL_NAV} aria-label="Agent portal">
            {NAV_GROUPS.map((group) => {
                const groupLinks = group.pages
                    .map((page) => SIDEBAR_LINKS.find((l) => l.page === page))
                    .filter(Boolean) as typeof SIDEBAR_LINKS;

                return (
                    <div key={group.label} className={AGENT_SHELL_NAV_GROUP}>
                        <p className={AGENT_SHELL_NAV_GROUP_LABEL}>{group.label}</p>
                        <div className="flex flex-col gap-0.5">
                            {groupLinks.map(({ page, href, label, icon: Icon }) => {
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
                        </div>
                    </div>
                );
            })}
        </nav>
    );
}

export default function AgentPortalLayout({
    activePage,
    agent,
    title,
    pageHeader,
    children,
}: AgentPortalLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const activeLabel = SIDEBAR_LINKS.find((l) => l.page === activePage)?.label ?? 'Agent Portal';

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
        <div className={`min-h-dvh lg:h-dvh lg:overflow-hidden ${AGENT_SHELL_CONTENT}`}>
            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-40 overflow-hidden ${AGENT_SHELL_SIDEBAR}`}
            >
                <div className={`px-5 py-5 border-b ${AGENT_SHELL_DIVIDER} shrink-0`}>
                    <BrandLogo />
                    <p className={AGENT_SHELL_SUBTITLE}>Agent portal</p>
                </div>
                <div className={AGENT_SHELL_NAV_SCROLL}>
                    <NavLinks activePage={activePage} />
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
                    className={`absolute left-0 top-0 bottom-0 w-72 flex flex-col portal-nav-drawer-panel ${AGENT_SHELL_SIDEBAR_MOBILE} ${
                        mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation menu"
                >
                    <div className={`flex items-center justify-between px-5 py-4 border-b ${AGENT_SHELL_DIVIDER} shrink-0`}>
                        <BrandLogo size="sm" onClick={() => setMobileOpen(false)} />
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className={AGENT_SHELL_ICON_BTN}
                            aria-label="Close"
                            tabIndex={mobileOpen ? 0 : -1}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className={AGENT_SHELL_NAV_SCROLL}>
                        <NavLinks activePage={activePage} onNavigate={() => setMobileOpen(false)} />
                    </div>
                </aside>
            </div>

            {/* Top app bar */}
            <header
                className={`fixed top-0 right-0 left-0 lg:left-64 z-30 h-[4.25rem] ${AGENT_SHELL_TOPBAR}`}
            >
                <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className={`lg:hidden ${AGENT_ICON_BTN}`}
                            aria-label="Open menu"
                            aria-expanded={mobileOpen}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-charcoal/40 leading-none mb-1 hidden sm:block">
                                Agent portal
                            </p>
                            <h1 className="text-lg sm:text-xl font-semibold text-charcoal truncate tracking-tight leading-tight">
                                {title ?? activeLabel}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {agent && <AgentProfileCompact agent={agent} />}
                        <button
                            type="button"
                            onClick={() => {
                                void signOutClient({ accountType: 'agent' });
                            }}
                            className={`${AGENT_SECONDARY_BTN} !h-9 !px-3.5`}
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className={`lg:pl-64 pt-[4.25rem] min-h-dvh lg:h-dvh lg:overflow-y-auto lg:overscroll-contain ${AGENT_SHELL_CONTENT}`}>
                {pageHeader && (
                    <div
                        className={`${AGENT_PAGE_HEADER_BAND} px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 lg:py-11`}
                    >
                        <div className={AGENT_PAGE_CONTAINER}>{pageHeader}</div>
                    </div>
                )}
                <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10">{children}</div>
            </main>
        </div>
    );
}
