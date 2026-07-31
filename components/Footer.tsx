'use client';

import Link from 'next/link';
import { Home, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

interface FooterProps {
    variant?: 'default' | 'portal';
}

const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() || '';
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || '';
const HAS_STORE_LINKS = Boolean(PLAY_STORE_URL && APP_STORE_URL);

/** Matched-size store badges (official PNGs have unequal padding). */
function AppleMark() {
    return (
        <svg viewBox="0 0 17 20" className="footer-store-mark" aria-hidden="true">
            <path
                fill="currentColor"
                d="M14.12 10.55c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.71-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.55 2.68-.4 6.65 1.11 8.83.74 1.07 1.61 2.26 2.76 2.22 1.11-.04 1.53-.71 2.87-.71 1.33 0 1.72.71 2.89.69 1.2-.02 1.95-1.08 2.68-2.15.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.31-.89-2.4-3.59ZM11.4 3.76c.61-.74 1.02-1.77.91-2.8-.88.04-1.95.59-2.58 1.33-.56.65-1.06 1.7-.93 2.7 1 .08 2-.51 2.6-1.23Z"
            />
        </svg>
    );
}

function GooglePlayMark() {
    return (
        <svg viewBox="0 0 20 22" className="footer-store-mark" aria-hidden="true">
            <path fill="#EA4335" d="M1.1 1.2 11.4 11 1.1 20.8c-.4-.3-.7-.8-.7-1.4V2.6c0-.6.3-1.1.7-1.4Z" />
            <path fill="#FBBC04" d="m11.4 11 2.7-2.7 4.4 2.5c.7.4.7 1.4 0 1.8l-4.4 2.5L11.4 11Z" />
            <path fill="#4285F4" d="M11.4 11 1.1 1.2C1.5.9 2 .8 2.5 1.1L14.1 8.3 11.4 11Z" />
            <path fill="#34A853" d="M11.4 11 14.1 13.7 2.5 20.9c-.5.3-1 .2-1.4-.1L11.4 11Z" />
        </svg>
    );
}

function GooglePlayBadge() {
    return (
        <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-store-badge"
            aria-label="Get it on Google Play"
        >
            <GooglePlayMark />
            <span className="footer-store-copy">
                <span className="footer-store-kicker">Get it on</span>
                <span className="footer-store-name">Google Play</span>
            </span>
        </a>
    );
}

function AppStoreBadge() {
    return (
        <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-store-badge"
            aria-label="Download on the App Store"
        >
            <AppleMark />
            <span className="footer-store-copy">
                <span className="footer-store-kicker">Download on the</span>
                <span className="footer-store-name">App Store</span>
            </span>
        </a>
    );
}

function StoreDownloadButtons() {
    if (!HAS_STORE_LINKS) return null;
    return (
        <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-[0.12em] mb-4">
                Get the App
            </h3>
            <div className="footer-store-badges">
                {APP_STORE_URL ? <AppStoreBadge /> : null}
                {PLAY_STORE_URL ? <GooglePlayBadge /> : null}
            </div>
        </div>
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
                                {
                                    href: process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim(),
                                    label: 'Facebook',
                                    Icon: Facebook,
                                },
                                {
                                    href: process.env.NEXT_PUBLIC_TWITTER_URL?.trim(),
                                    label: 'Twitter',
                                    Icon: Twitter,
                                },
                                {
                                    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim(),
                                    label: 'Instagram',
                                    Icon: Instagram,
                                },
                                {
                                    href: process.env.NEXT_PUBLIC_LINKEDIN_URL?.trim(),
                                    label: 'LinkedIn',
                                    Icon: Linkedin,
                                },
                            ]
                                .filter((s): s is { href: string; label: string; Icon: typeof Facebook } =>
                                    Boolean(s.href)
                                )
                                .map(({ href, label, Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="icon-clickable w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-white/55 hover:text-gold hover:bg-gold/10 hover:border-gold/20 transition-all duration-200"
                                    aria-label={label}
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
                                { href: '/get-started', label: 'Get Started' },
                                { href: '/learn', label: 'Learning Center - Buyers' },
                                { href: '/learn/investors', label: 'Learning Center - Investors' },
                                { href: '/sellers', label: 'For Sellers' },
                                { href: '/search', label: 'Properties' },
                                { href: '/calculator', label: 'Bond Calculator' },
                                { href: '/auth/login', label: 'Sign in' },
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
                                { href: '/get-started', label: 'Get Started' },
                                { href: '/quiz', label: 'Buyer Quiz' },
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

                        <div className="mt-7">
                            <StoreDownloadButtons />
                        </div>
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
