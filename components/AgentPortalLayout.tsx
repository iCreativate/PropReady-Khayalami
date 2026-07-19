'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Home,
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
import { AgentProfileCompact } from '@/components/AgentProfileSummary';
import { AGENT_PAGE_CONTAINER, AGENT_PAGE_HEADER_BAND, AGENT_LOGO_MARK, AGENT_LOGO_MARK_SM, AGENT_ICON_LOGO, AGENT_ICON_LOGO_SM, AGENT_SECONDARY_BTN, AGENT_ICON_BTN, AGENT_SHELL_SIDEBAR, AGENT_SHELL_SIDEBAR_MOBILE, AGENT_SHELL_CONTENT, AGENT_SHELL_TOPBAR, AGENT_NAV_LINK, AGENT_NAV_LINK_IDLE, AGENT_NAV_LINK_ACTIVE } from '@/lib/agent-portal-ui';
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

function NavLinks({
    activePage,
    onNavigate,
}: {
    activePage: AgentPortalPage;
    onNavigate?: () => void;
}) {
    return (
        <nav className="flex flex-col gap-1 px-3">
            {SIDEBAR_LINKS.map(({ page, href, label, icon: Icon }) => (
                <Link
                    key={page}
                    href={href}
                    onClick={onNavigate}
                    className={`${AGENT_NAV_LINK} ${
                        activePage === page ? AGENT_NAV_LINK_ACTIVE : AGENT_NAV_LINK_IDLE
                    }`}
                >
                    <Icon className="w-5 h-5 shrink-0" />
                    {label}
                </Link>
            ))}
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

    return (
        <div className={`min-h-screen ${AGENT_SHELL_CONTENT}`}>
            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-40 ${AGENT_SHELL_SIDEBAR}`}
            >
                <div className="px-5 py-6 border-b border-charcoal/[0.08]">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className={AGENT_LOGO_MARK}>
                            <Home className={`${AGENT_ICON_LOGO} text-white`} />
                        </div>
                        <span className="text-charcoal text-lg font-bold">PropReady</span>
                    </Link>
                    <p className="text-charcoal/45 text-xs mt-2 pl-0.5">Agent portal</p>
                </div>
                <div className="flex-1 py-4 overflow-y-auto">
                    <NavLinks activePage={activePage} />
                </div>
            </aside>

            {/* Mobile sidebar drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        aria-label="Close menu"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside
                        className={`absolute left-0 top-0 bottom-0 w-72 flex flex-col ${AGENT_SHELL_SIDEBAR_MOBILE}`}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal/[0.08]">
                            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                                <div className={AGENT_LOGO_MARK_SM}>
                                    <Home className={`${AGENT_ICON_LOGO_SM} text-white`} />
                                </div>
                                <span className="font-bold text-charcoal">PropReady</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className={AGENT_ICON_BTN}
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-charcoal" />
                            </button>
                        </div>
                        <div className="flex-1 py-4 overflow-y-auto">
                            <NavLinks activePage={activePage} onNavigate={() => setMobileOpen(false)} />
                        </div>
                    </aside>
                </div>
            )}

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

            <main className={`lg:pl-64 pt-[4.25rem] min-h-screen ${AGENT_SHELL_CONTENT}`}>
                {pageHeader && (
                    <div
                        className={`${AGENT_PAGE_HEADER_BAND} px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 lg:py-11`}
                    >
                        <div className={`${AGENT_PAGE_CONTAINER} !pb-0`}>{pageHeader}</div>
                    </div>
                )}
                <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 lg:py-12">{children}</div>
            </main>
        </div>
    );
}
