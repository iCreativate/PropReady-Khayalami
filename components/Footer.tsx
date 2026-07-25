'use client';

import Link from 'next/link';
import { Home, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

interface FooterProps {
    variant?: 'default' | 'portal';
}

function GooglePlayBadge() {
    return (
        <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="footer-play-badge"
            aria-label="Get it on Google Play (coming soon)"
            title="Coming soon"
        >
            <svg viewBox="0 0 155 46" className="h-11 w-auto" aria-hidden="true">
                <rect width="155" height="46" rx="6" fill="#000" />
                <rect x="0.5" y="0.5" width="154" height="45" rx="5.5" fill="none" stroke="rgba(255,255,255,0.22)" />
                <g transform="translate(12 8)">
                    <path
                        d="M1.2 1.1c-.3.3-.5.8-.5 1.5v24.8c0 .7.2 1.2.5 1.5l.1.1 13.9-13.9v-.3L1.3 1z"
                        fill="#00A0FF"
                    />
                    <path
                        d="M20.4 20.3l-5.2-5.2v-.3l5.2-5.2.1.1 6.2 3.5c1.8 1 1.8 2.7 0 3.7l-6.3 3.4z"
                        fill="#FFCE00"
                    />
                    <path
                        d="M20.5 20.2L15.2 15 1.2 29c.5.5 1.2.6 2 .1l17.3-9z"
                        fill="#FF3A44"
                    />
                    <path
                        d="M20.5 9.7L3.2.8C2.4.3 1.7.4 1.2.9L15.2 15l5.3-5.3z"
                        fill="#00F076"
                    />
                </g>
                <g fill="#fff" fontFamily="Arial, Helvetica, sans-serif">
                    <text x="48" y="17" fontSize="8" fill="rgba(255,255,255,0.75)">
                        GET IT ON
                    </text>
                    <text x="48" y="33" fontSize="16" fontWeight="600">
                        Google Play
                    </text>
                </g>
            </svg>
        </a>
    );
}

function AppStoreBadge() {
    return (
        <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="footer-play-badge"
            aria-label="Download on the App Store (coming soon)"
            title="Coming soon"
        >
            <svg viewBox="0 0 155 46" className="h-11 w-auto" aria-hidden="true">
                <rect width="155" height="46" rx="6" fill="#000" />
                <rect x="0.5" y="0.5" width="154" height="45" rx="5.5" fill="none" stroke="rgba(255,255,255,0.22)" />
                <g transform="translate(14 9)" fill="#fff">
                    <path d="M16.2 7.3c-.1-1.3.6-2.5 1.5-3.3-.9-1.3-2.4-2-3.8-2.1-1.6-.2-3.2 1-4 1-.8 0-2.2-.9-3.6-.9-1.8 0-3.5 1.1-4.4 2.7-1.9 3.3-.5 8.1 1.4 10.8.9 1.3 2 2.7 3.4 2.7 1.4 0 1.9-.9 3.5-.9s2.1.9 3.6.9c1.5 0 2.4-1.3 3.3-2.6.7-1 1-1.9 1-2 0 0-2.5-1-2.5-3.8zm-2.4-5.7c.7-.9 1.2-2.1 1.1-3.3-1.1.1-2.4.7-3.2 1.6-.7.8-1.3 2-1.1 3.2 1.2.1 2.4-.6 3.2-1.5z" />
                </g>
                <g fill="#fff" fontFamily="Arial, Helvetica, sans-serif">
                    <text x="48" y="17" fontSize="8" fill="rgba(255,255,255,0.75)">
                        Download on the
                    </text>
                    <text x="48" y="33" fontSize="16" fontWeight="600">
                        App Store
                    </text>
                </g>
            </svg>
        </a>
    );
}

export default function Footer({ variant = 'default' }: FooterProps) {
    const isPortal = variant === 'portal';

    return (
        <footer
            className={`bg-charcoal mt-auto ${
                isPortal ? 'border-t border-white/[0.06]' : 'border-t border-charcoal/20'
            }`}
        >
            <div
                className={`mx-auto ${
                    isPortal
                        ? 'max-w-[1400px] px-6 sm:px-8 lg:px-10 py-14 sm:py-16'
                        : 'container px-4 py-12'
                }`}
            >
                <div
                    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${
                        isPortal ? 'gap-10 lg:gap-12 mb-12' : 'gap-8 mb-8'
                    }`}
                >
                    <div className={isPortal ? 'lg:pr-4' : ''}>
                        <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
                            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-sm">
                                <Home className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-white text-xl font-semibold tracking-tight group-hover:text-white/90 transition">
                                PropReady
                            </span>
                        </Link>
                        <p className="text-white/55 text-sm leading-relaxed mb-6 max-w-xs">
                            Your Home. Ready. 100% Free for buyers and Sellers — learn more about real estate in minutes.
                        </p>
                        <div className="flex items-center gap-3">
                            {[
                                { href: 'https://facebook.com', label: 'Facebook', Icon: Facebook },
                                { href: 'https://twitter.com', label: 'Twitter', Icon: Twitter },
                                { href: 'https://instagram.com', label: 'Instagram', Icon: Instagram },
                                { href: 'https://linkedin.com', label: 'LinkedIn', Icon: Linkedin },
                            ].map(({ href, label, Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="icon-clickable w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-white/55 hover:text-gold hover:bg-gold/10 hover:border-gold/20 transition-all duration-200"
                                    aria-label={label}
                                    title={`${label} (update URL when social accounts are live)`}
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold text-sm uppercase tracking-[0.12em] mb-5">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/learn', label: 'Learning Center - Buyers' },
                                { href: '/learn/investors', label: 'Learning Center - Investors' },
                                { href: '/sellers', label: 'For Sellers' },
                                { href: '/search', label: 'Properties' },
                                { href: '/calculator', label: 'Bond Calculator' },
                                { href: '/dashboard', label: 'Dashboard' },
                            ].map(({ href, label }) => (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        className="link-animated text-white/55 hover:text-gold transition text-sm leading-relaxed"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold text-sm uppercase tracking-[0.12em] mb-5">
                            Resources
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/learn', label: 'Home Buying Guide' },
                                { href: '/sellers', label: 'Selling Guide' },
                                { href: '/calculator', label: 'Transfer Costs' },
                                { href: '/quiz', label: 'PropReady Quiz' },
                                { href: '/popi', label: 'POPI Act' },
                            ].map(({ href, label }) => (
                                <li key={label}>
                                    <Link
                                        href={href}
                                        className="link-animated text-white/55 hover:text-gold transition text-sm leading-relaxed"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold text-sm uppercase tracking-[0.12em] mb-5">
                            Contact Us
                        </h3>
                        <ul className="space-y-4 mb-7">
                            <li>
                                <a
                                    href="mailto:info@prop-ready.co.za"
                                    className="inline-flex items-center gap-2.5 text-white/55 hover:text-gold transition text-sm group"
                                >
                                    <span className="w-8 h-8 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition">
                                        <Mail className="w-3.5 h-3.5 text-gold" />
                                    </span>
                                    info@prop-ready.co.za
                                </a>
                            </li>
                        </ul>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href="/agents/login"
                                className="btn-interactive inline-flex items-center justify-center px-5 py-2.5 bg-gold text-white font-semibold rounded-xl hover:bg-gold-600 transition text-sm shadow-sm"
                            >
                                Agent Login
                            </Link>
                            <Link
                                href="/originators/login"
                                className="btn-interactive inline-flex items-center justify-center px-5 py-2.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/15 hover:border-gold/40 transition text-sm"
                            >
                                Bond Originator
                            </Link>
                        </div>

                        {!isPortal ? (
                            <div className="mt-7">
                                <h3 className="text-white font-semibold text-sm uppercase tracking-[0.12em] mb-4">
                                    Get the App
                                </h3>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    <GooglePlayBadge />
                                    <AppStoreBadge />
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className={`border-t border-white/[0.08] ${isPortal ? 'pt-8' : 'pt-8 mt-8'}`}>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
                        <p className="text-white/45 text-sm leading-relaxed max-w-2xl">
                            © {new Date().getFullYear()} PropReady-iKhayalami. All rights reserved. We adhere to the
                            Protection of Personal Information Act (POPI Act) of South Africa.
                        </p>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm shrink-0">
                            <Link href="/privacy" className="link-animated text-white/45 hover:text-gold transition">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="link-animated text-white/45 hover:text-gold transition">
                                Terms of Service
                            </Link>
                            <Link href="/popi" className="link-animated text-white/45 hover:text-gold transition">
                                POPI Act
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
