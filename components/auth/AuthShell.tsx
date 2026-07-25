'use client';

import Link from 'next/link';

interface AuthShellProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    accountType?: 'user' | 'agent' | 'originator';
    /** Wider form column for multi-step agent registration */
    wide?: boolean;
}

export default function AuthShell({
    children,
    title,
    subtitle,
    accountType: _accountType = 'user',
    wide = false,
}: AuthShellProps) {
    const homeHref = '/';

    return (
        <div className="auth-shell min-h-screen flex">
            <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal to-[#1a1a1a]" />
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 20% 80%, rgba(220,38,38,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(220,38,38,0.2) 0%, transparent 45%)',
                    }}
                />
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                    <Link href={homeHref} className="text-2xl font-bold text-white tracking-tight">
                        Prop<span className="text-gold">Ready</span>
                    </Link>
                    <div>
                        <p className="text-gold/90 text-sm font-semibold uppercase tracking-[0.2em] mb-4">
                            South Africa&apos;s property platform
                        </p>
                        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                            Secure access to your property journey
                        </h1>
                        <p className="text-white/60 text-lg leading-relaxed max-w-md">
                            Enterprise-grade authentication with OAuth, magic links, and bank-level
                            session security.
                        </p>
                    </div>
                    <p className="text-white/30 text-xs">
                        © {new Date().getFullYear()} PropReady · OWASP-aligned security
                    </p>
                </div>
            </div>

            <div className="flex-1 flex items-start justify-center p-6 sm:p-10 bg-[#FAFAFA] min-h-screen overflow-y-auto">
                <div className={`w-full ${wide ? 'max-w-[560px]' : 'max-w-[420px]'} py-4 sm:py-8`}>
                    <div className="lg:hidden mb-8 text-center">
                        <Link href={homeHref} className="text-2xl font-bold text-charcoal">
                            Prop<span className="text-gold">Ready</span>
                        </Link>
                    </div>
                    <div className="auth-card">
                        <h2 className="text-2xl font-bold text-charcoal mb-1">{title}</h2>
                        {subtitle ? (
                            <p className="text-charcoal/55 text-sm mb-8">{subtitle}</p>
                        ) : (
                            <div className="mb-8" />
                        )}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
