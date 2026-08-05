'use client';

import BrandLogo from '@/components/BrandLogo';
import type { LoginAudience } from '@/lib/auth-login-roles';

interface AuthShellProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    accountType?: 'user' | 'agent' | 'originator' | 'conveyancer';
    /** Wider form column for multi-step agent registration */
    wide?: boolean;
    /** Role-picker / hub step — richer right-panel treatment */
    variant?: 'default' | 'roles';
    /** Which role hub is showing when variant is roles */
    rolesAudience?: LoginAudience;
}

export default function AuthShell({
    children,
    title,
    subtitle,
    accountType: _accountType = 'user',
    wide = false,
    variant = 'default',
    rolesAudience = 'consumer',
}: AuthShellProps) {
    const homeHref = '/';
    const isRoles = variant === 'roles';
    const isProRoles = isRoles && rolesAudience === 'professionals';

    const rolesPanel = isProRoles
        ? {
              kicker: 'Professionals',
              heading: 'Sign in to your PropReady portal',
              body: 'Choose your professional account to continue to the agent, originator or conveyancer workspace.',
              points: [
                  'PPRA-verified agent leads and listings',
                  'Bond originator prequal case portal',
                  'Conveyancer matters and Deeds tracking',
              ],
          }
        : {
              kicker: 'Buyers & sellers',
              heading: 'Sign in to your PropReady account',
              body: 'Choose buyer or seller to continue. Professionals sign in from the Professionals button.',
              points: [
                  'Buyer dashboard, prequal and learning',
                  'Seller listings, valuation and agents',
                  'Bank-grade session security',
              ],
          };

    return (
        <div className={`auth-shell min-h-screen flex ${isRoles ? 'auth-shell--roles' : ''}`}>
            <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden bg-charcoal">
                <div className="pointer-events-none absolute inset-0 opacity-40 brand-dark-glow" aria-hidden />
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                    <BrandLogo href={homeHref} tone="dark" size="lg" />
                    <div>
                        <p className="text-gold/90 text-sm font-semibold uppercase tracking-[0.2em] mb-4">
                            {isRoles ? rolesPanel.kicker : "South Africa's property platform"}
                        </p>
                        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                            {isRoles ? rolesPanel.heading : 'Secure access to your property journey'}
                        </h1>
                        <p className="text-white/60 text-lg leading-relaxed max-w-md">
                            {isRoles
                                ? rolesPanel.body
                                : 'Enterprise-grade authentication with OAuth, magic links, and bank-level session security.'}
                        </p>
                        {isRoles ? (
                            <ul className="mt-8 space-y-3">
                                {rolesPanel.points.map((point) => (
                                    <li
                                        key={point}
                                        className="flex items-start gap-3 text-sm text-white/65"
                                    >
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                    <p className="text-white/30 text-xs">
                        © {new Date().getFullYear()} PropReady · OWASP-aligned security
                    </p>
                </div>
            </div>

            <div
                className={`flex-1 flex items-start justify-center p-6 sm:p-10 min-h-screen overflow-y-auto ${
                    isRoles ? 'auth-shell-panel--roles' : 'bg-[#FAFAFA]'
                }`}
            >
                <div
                    className={`w-full ${
                        wide || isRoles ? 'max-w-[520px]' : 'max-w-[420px]'
                    } py-4 sm:py-8`}
                >
                    <div className="lg:hidden mb-8 text-center">
                        <BrandLogo href={homeHref} size="lg" />
                    </div>
                    <div className={`auth-card ${isRoles ? 'auth-card--roles' : ''}`}>
                        {isRoles ? (
                            <p className="auth-card-eyebrow">Account access</p>
                        ) : null}
                        <h2
                            className={`font-bold text-charcoal tracking-tight ${
                                isRoles ? 'text-[1.65rem] sm:text-[1.85rem] leading-tight' : 'text-2xl'
                            } mb-1`}
                        >
                            {title}
                        </h2>
                        {subtitle ? (
                            <p
                                className={`text-charcoal/55 leading-relaxed ${
                                    isRoles ? 'text-[0.9375rem] mb-7 max-w-[36ch]' : 'text-sm mb-8'
                                }`}
                            >
                                {subtitle}
                            </p>
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
