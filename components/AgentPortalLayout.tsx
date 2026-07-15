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
import { AGENT_PAGE_CONTAINER, AGENT_PAGE_HEADER_BAND } from '@/lib/agent-portal-ui';

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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        activePage === page
                            ? 'bg-gold/15 text-gold border border-gold/25'
                            : 'text-charcoal/75 hover:text-charcoal hover:bg-charcoal/5'
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
        <div className="min-h-screen bg-white">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-charcoal/[0.06] bg-white z-40">
                <div className="px-5 py-6 border-b border-charcoal/[0.06]">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center shadow-sm">
                            <Home className="w-6 h-6 text-white" />
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
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal/10">
                            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                                <div className="w-9 h-9 bg-gold rounded-lg flex items-center justify-center">
                                    <Home className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-charcoal">PropReady</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="p-2 rounded-lg hover:bg-charcoal/5"
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
            <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-[4.25rem] bg-white/95 backdrop-blur-md border-b border-charcoal/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-lg border border-charcoal/15 text-charcoal hover:bg-charcoal/5"
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold text-charcoal truncate">
                                {title ?? activeLabel}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {agent && <AgentProfileCompact agent={agent} />}
                        <button
                            type="button"
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    localStorage.removeItem('propReady_currentAgent');
                                    window.location.href = '/agents/login';
                                }
                            }}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-charcoal/[0.08] text-charcoal/65 hover:bg-charcoal/[0.03] hover:text-charcoal hover:border-charcoal/12 transition-all duration-200 text-sm font-medium"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="lg:pl-64 pt-[4.25rem] min-h-screen bg-[#fafafa]">
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
