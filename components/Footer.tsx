import Link from 'next/link';
import { Home, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

interface FooterProps {
    variant?: 'default' | 'portal';
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
                                    className="w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-white/55 hover:text-gold hover:bg-gold/10 hover:border-gold/20 transition-all duration-200"
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
                                        className="text-white/55 hover:text-gold transition text-sm leading-relaxed"
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
                                        className="text-white/55 hover:text-gold transition text-sm leading-relaxed"
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
                        <Link
                            href="/agents/login"
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-gold text-white font-semibold rounded-xl hover:bg-gold-600 transition text-sm shadow-sm"
                        >
                            Agent Login
                        </Link>
                    </div>
                </div>

                <div className={`border-t border-white/[0.08] ${isPortal ? 'pt-8' : 'pt-8 mt-8'}`}>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
                        <p className="text-white/45 text-sm leading-relaxed max-w-2xl">
                            © {new Date().getFullYear()} PropReady-iKhayalami. All rights reserved. We adhere to the
                            Protection of Personal Information Act (POPI Act) of South Africa.
                        </p>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm shrink-0">
                            <Link href="/privacy" className="text-white/45 hover:text-gold transition">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-white/45 hover:text-gold transition">
                                Terms of Service
                            </Link>
                            <Link href="/popi" className="text-white/45 hover:text-gold transition">
                                POPI Act
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
