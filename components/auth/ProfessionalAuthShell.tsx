'use client';

import Link from 'next/link';
import { BadgeCheck, Building2, Shield } from 'lucide-react';

type ProfessionalRole = 'agent' | 'originator';

interface ProfessionalAuthShellProps {
    children: React.ReactNode;
    role: ProfessionalRole;
    title: string;
    subtitle?: string;
    wide?: boolean;
}

const ROLE_COPY: Record<
    ProfessionalRole,
    {
        homeHref: string;
        badge: string;
        headline: string;
        body: string;
        points: string[];
        Icon: typeof Shield;
    }
> = {
    agent: {
        homeHref: '/',
        badge: 'Agent portal',
        headline: 'PPRA-verified agent access',
        body: 'Sign in with your Fidelity Fund Certificate details. Consumer accounts use a separate login.',
        points: [
            'FFC number required at sign-in',
            'PPRA practitioner verification',
            'Leads and listings for licensed agents',
        ],
        Icon: BadgeCheck,
    },
    originator: {
        homeHref: '/',
        badge: 'Bond originator portal',
        headline: 'Staff access for bond originators',
        body: 'Use your organisation and staff originator number. This portal is separate from buyer and agent login.',
        points: [
            'Organisation + staff number required',
            'Buyer prequal case inbox',
            'Secure document and result exchange',
        ],
        Icon: Building2,
    },
};

export default function ProfessionalAuthShell({
    children,
    role,
    title,
    subtitle,
    wide = false,
}: ProfessionalAuthShellProps) {
    const copy = ROLE_COPY[role];
    const Icon = copy.Icon;

    return (
        <div className="auth-shell min-h-screen flex bg-[#f3f1ef]">
            <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-charcoal">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 15% 20%, rgba(220,38,38,0.45) 0%, transparent 42%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.08) 0%, transparent 40%)',
                    }}
                />
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                    <Link href={copy.homeHref} className="text-2xl font-semibold text-white tracking-tight">
                        Prop<span className="text-gold">Ready</span>
                    </Link>
                    <div>
                        <p className="inline-flex items-center gap-2 text-gold/90 text-xs font-semibold uppercase tracking-[0.18em] mb-5">
                            <Icon className="w-3.5 h-3.5" />
                            {copy.badge}
                        </p>
                        <h1 className="text-3xl xl:text-4xl font-semibold text-white leading-tight mb-4 max-w-md">
                            {copy.headline}
                        </h1>
                        <p className="text-white/55 text-base leading-relaxed max-w-md mb-8">{copy.body}</p>
                        <ul className="space-y-3">
                            {copy.points.map((point) => (
                                <li key={point} className="flex items-start gap-3 text-sm text-white/70">
                                    <Shield className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <p className="text-white/30 text-xs">
                        © {new Date().getFullYear()} PropReady · Professional credentials verified separately from
                        consumer accounts
                    </p>
                </div>
            </div>

            <div className="flex-1 flex items-start justify-center p-6 sm:p-10 min-h-screen overflow-y-auto">
                <div className={`w-full ${wide ? 'max-w-[560px]' : 'max-w-[440px]'} py-4 sm:py-10`}>
                    <div className="lg:hidden mb-8">
                        <Link href={copy.homeHref} className="text-2xl font-semibold text-charcoal">
                            Prop<span className="text-gold">Ready</span>
                        </Link>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/45 mt-2">
                            {copy.badge}
                        </p>
                    </div>
                    <div className="rounded-3xl border border-charcoal/[0.08] bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(44,44,44,0.06)]">
                        <h2 className="text-2xl font-semibold text-charcoal tracking-tight mb-1">{title}</h2>
                        {subtitle ? (
                            <p className="text-charcoal/55 text-sm mb-8 leading-relaxed">{subtitle}</p>
                        ) : (
                            <div className="mb-8" />
                        )}
                        {children}
                    </div>
                    <p className="text-center text-xs text-charcoal/40 mt-6">
                        Looking for the buyer or seller account?{' '}
                        <Link href="/auth/login" className="text-gold hover:underline font-medium">
                            Consumer sign-in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
