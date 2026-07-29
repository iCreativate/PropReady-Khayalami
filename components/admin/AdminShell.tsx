'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    BarChart3,
    Building2,
    LayoutDashboard,
    LogOut,
    Megaphone,
    Menu,
    MessageSquare,
    Shield,
    Users,
    X,
} from 'lucide-react';

const NAV: Array<{
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
}> = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/accounts', label: 'Accounts', icon: Users },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/admin/ppra', label: 'Agent approvals', icon: Shield },
    { href: '/admin/originators', label: 'Originator approvals', icon: Building2 },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

let adminSessionCache: { email: string; at: number } | null = null;
const ADMIN_SESSION_TTL_MS = 60_000;

function NavLinks({
    pathname,
    onNavigate,
    compact = false,
}: {
    pathname: string;
    onNavigate?: () => void;
    compact?: boolean;
}) {
    return (
        <nav className={`flex ${compact ? 'flex-row gap-1 overflow-x-auto' : 'flex-col gap-1'} p-3`}>
            {NAV.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={
                            compact
                                ? `shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
                                      active
                                          ? 'bg-[#E52323] text-white'
                                          : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#111827]'
                                  }`
                                : `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/70 ${
                                      active
                                          ? 'bg-white/[0.08] text-white font-semibold'
                                          : 'text-white/65 hover:bg-white/[0.05] hover:text-white'
                                  }`
                        }
                    >
                        {!compact ? (
                            <span
                                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full transition ${
                                    active ? 'bg-[#E52323]' : 'bg-transparent group-hover:bg-white/20'
                                }`}
                                aria-hidden
                            />
                        ) : null}
                        <Icon className={`${compact ? 'hidden' : 'w-4 h-4'} shrink-0`} />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}

export default function AdminShell({
    children,
    title,
}: {
    children: ReactNode;
    title?: string;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(() => {
        if (
            adminSessionCache &&
            Date.now() - adminSessionCache.at < ADMIN_SESSION_TTL_MS
        ) {
            return adminSessionCache.email;
        }
        return null;
    });
    const [loading, setLoading] = useState(() => !email);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (
            adminSessionCache &&
            Date.now() - adminSessionCache.at < ADMIN_SESSION_TTL_MS
        ) {
            setEmail(adminSessionCache.email);
            setLoading(false);
            return;
        }
        void (async () => {
            try {
                const res = await fetch('/api/admin/auth/session', { credentials: 'include' });
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (!res.ok || !data.authenticated) {
                    adminSessionCache = null;
                    router.replace('/admin/login');
                    return;
                }
                const nextEmail = String(data.email || '');
                adminSessionCache = { email: nextEmail, at: Date.now() };
                setEmail(nextEmail || null);
            } catch {
                if (!cancelled) {
                    adminSessionCache = null;
                    router.replace('/admin/login');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    async function signOut() {
        await fetch('/api/admin/auth/session', { method: 'DELETE', credentials: 'include' });
        adminSessionCache = null;
        router.replace('/admin/login');
    }

    const displayEmail = email || 'Signing in…';
    const ready = Boolean(email) && !loading;

    return (
        <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#F8FAFC] text-[#111827]">
            {/* Desktop sidebar — always mounted to avoid white flash on navigation */}
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col z-40 bg-[#111827] text-white border-r border-white/[0.06]">
                <div className="px-5 py-6 border-b border-white/[0.08] shrink-0">
                    <p className="text-lg font-semibold tracking-tight">
                        Prop<span className="text-[#E52323]">Ready</span>
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/40 mt-2">
                        Staff console
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <NavLinks pathname={pathname} />
                </div>
                <div className="p-4 border-t border-white/[0.08] shrink-0">
                    <p className="text-xs text-white/40 truncate mb-3">{displayEmail}</p>
                    <button
                        type="button"
                        onClick={() => void signOut()}
                        disabled={!ready}
                        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition rounded-lg px-2 py-1.5 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/70 disabled:opacity-40"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Mobile drawer */}
            {mobileOpen ? (
                <div className="lg:hidden fixed inset-0 z-50">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                        aria-label="Close navigation"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#111827] text-white shadow-2xl flex flex-col transition-transform duration-200 ease-out">
                        <div className="px-5 py-5 border-b border-white/[0.08] flex items-center justify-between">
                            <p className="text-lg font-semibold tracking-tight">
                                Prop<span className="text-[#E52323]">Ready</span>
                            </p>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/[0.06]"
                                aria-label="Close menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                        </div>
                        <div className="p-4 border-t border-white/[0.08]">
                            <p className="text-xs text-white/40 truncate mb-3">{displayEmail}</p>
                            <button
                                type="button"
                                onClick={() => void signOut()}
                                disabled={!ready}
                                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white disabled:opacity-40"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </button>
                        </div>
                    </aside>
                </div>
            ) : null}

            <div className="lg:pl-[260px] min-h-dvh lg:h-dvh flex flex-col min-w-0">
                <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E5E7EB] px-4 sm:px-6 h-16 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            className="lg:hidden p-2 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52323]/50"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open navigation"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                                PropReady admin
                            </p>
                            <h1 className="text-base sm:text-lg font-semibold truncate text-[#111827]">
                                {title || 'Staff console'}
                            </h1>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-[#6B7280]">
                        <span className="truncate max-w-[180px]">{displayEmail}</span>
                    </div>
                </header>

                <div className="lg:hidden border-b border-[#E5E7EB] bg-white px-3 py-2 shrink-0">
                    <NavLinks pathname={pathname} compact />
                </div>

                <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
                    {ready ? (
                        children
                    ) : (
                        <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
                            <div className="h-10 w-48 animate-pulse rounded-xl bg-white border border-[#E5E7EB]" />
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-28 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white"
                                    />
                                ))}
                            </div>
                            <div className="h-[50vh] animate-pulse rounded-2xl border border-[#E5E7EB] bg-white" />
                            <span className="sr-only">Loading admin…</span>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
