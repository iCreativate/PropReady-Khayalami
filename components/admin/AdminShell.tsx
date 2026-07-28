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
    MessageSquare,
    Shield,
    Users,
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

export default function AdminShell({
    children,
    title,
}: {
    children: ReactNode;
    title?: string;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch('/api/admin/auth/session', { credentials: 'include' });
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (!res.ok || !data.authenticated) {
                    router.replace('/admin/login');
                    return;
                }
                setEmail(data.email || null);
            } catch {
                if (!cancelled) router.replace('/admin/login');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    async function signOut() {
        await fetch('/api/admin/auth/session', { method: 'DELETE', credentials: 'include' });
        router.replace('/admin/login');
    }

    if (loading) {
        return null;
    }

    if (!email) return null;

    return (
        <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#f4f4f5] text-charcoal">
            {/* Fixed left nav — does not scroll with page content */}
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-40 bg-charcoal text-white border-r border-white/[0.06]">
                <div className="px-5 py-5 border-b border-white/[0.08] shrink-0">
                    <p className="text-lg font-semibold tracking-tight">
                        Prop<span className="text-gold">Ready</span>
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/40 mt-2">
                        Staff console
                    </p>
                </div>
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {NAV.map(({ href, label, icon: Icon, exact }) => {
                        const active = exact ? pathname === href : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                                    active
                                        ? 'bg-gold text-white font-semibold'
                                        : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-white/[0.08] shrink-0">
                    <p className="text-xs text-white/40 truncate mb-2">{email}</p>
                    <button
                        type="button"
                        onClick={() => void signOut()}
                        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            <div className="lg:pl-64 min-h-dvh lg:h-dvh flex flex-col min-w-0">
                <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-charcoal/[0.07] px-4 sm:px-6 h-14 flex items-center justify-between gap-3 shrink-0">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal/40">
                            PropReady admin
                        </p>
                        <h1 className="text-base sm:text-lg font-semibold truncate">
                            {title || 'Staff console'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 lg:hidden">
                        <button
                            type="button"
                            onClick={() => void signOut()}
                            className="text-sm text-charcoal/55 hover:text-charcoal"
                        >
                            Sign out
                        </button>
                    </div>
                </header>

                <div className="lg:hidden border-b border-charcoal/[0.07] bg-white px-3 py-2 flex gap-1 overflow-x-auto shrink-0">
                    {NAV.map(({ href, label, exact }) => {
                        const active = exact ? pathname === href : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                                    active ? 'bg-gold text-white' : 'text-charcoal/60 bg-charcoal/[0.04]'
                                }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>

                <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
