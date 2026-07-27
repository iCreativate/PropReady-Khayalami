'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { PORTAL_ICON_BTN, PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';

interface MobileNavProps {
    links: Array<{
        href: string;
        label: string;
        isButton?: boolean;
    }>;
}

export default function MobileNav({ links }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const closeMenu = () => setIsOpen(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`md:hidden ${PORTAL_ICON_BTN}`}
                aria-label="Toggle menu"
                type="button"
            >
                {isOpen ? (
                    <X className="w-5 h-5 text-charcoal" />
                ) : (
                    <Menu className="w-5 h-5 text-charcoal" />
                )}
            </button>

            {isMounted &&
                isOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] md:hidden" onClick={closeMenu}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

                        <div
                            className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white border-r border-charcoal/[0.08] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white border-b border-charcoal/[0.06] px-5 py-4 flex items-center justify-between z-10">
                                <BrandLogo href="/" size="sm" onClick={closeMenu} />
                                <button
                                    onClick={closeMenu}
                                    className={PORTAL_ICON_BTN}
                                    aria-label="Close menu"
                                    type="button"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="px-3 py-5 space-y-1">
                                {links.map((link) => (
                                    <Link
                                        key={link.href + link.label}
                                        href={link.href}
                                        onClick={closeMenu}
                                        className={
                                            link.isButton
                                                ? `${PORTAL_PRIMARY_BTN} w-full`
                                                : 'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-charcoal/75 hover:text-charcoal hover:bg-charcoal/5 transition'
                                        }
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
