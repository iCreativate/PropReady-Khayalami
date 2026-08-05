'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { PORTAL_ICON_BTN } from '@/lib/portal-ui';

interface MobileNavProps {
    links: Array<{
        href: string;
        label: string;
        isButton?: boolean;
    }>;
}

/**
 * Lock page scroll without collapsing the scrollbar gutter (avoids header/nav jump).
 */
function lockBodyScroll() {
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.documentElement.style.setProperty('--mobile-nav-scrollbar', `${scrollbarWidth}px`);
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.querySelectorAll<HTMLElement>('[data-fixed-nav]').forEach((el) => {
        el.style.paddingRight = `${scrollbarWidth}px`;
    });
}

function unlockBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.documentElement.style.removeProperty('--mobile-nav-scrollbar');
    document.querySelectorAll<HTMLElement>('[data-fixed-nav]').forEach((el) => {
        el.style.paddingRight = '';
    });
}

export default function MobileNav({ links }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            lockBodyScroll();
        } else {
            unlockBodyScroll();
        }
        return () => {
            unlockBodyScroll();
        };
    }, [isOpen]);

    const closeMenu = () => setIsOpen(false);

    return (
        <>
            <button
                onClick={() => setIsOpen((open) => !open)}
                className={`md:hidden ${PORTAL_ICON_BTN} relative shrink-0`}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                type="button"
            >
                {/* Keep both icons in the tree so the button box never reflows */}
                <Menu
                    className={`w-5 h-5 text-charcoal absolute transition-opacity duration-150 ${
                        isOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                    aria-hidden={isOpen}
                />
                <X
                    className={`w-5 h-5 text-charcoal absolute transition-opacity duration-150 ${
                        isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden={!isOpen}
                />
                <span className="inline-block w-5 h-5" aria-hidden />
            </button>

            {isMounted &&
                isOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] md:hidden" onClick={closeMenu}>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

                        <div
                            className="absolute left-0 top-0 h-full w-72 max-w-[85vw] flex flex-col overflow-hidden bg-charcoal brand-dark-panel border-r border-white/[0.06] shadow-[4px_0_24px_rgba(0,0,0,0.28)]"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Navigation menu"
                        >
                            <div className="sticky top-0 shrink-0 border-b border-white/[0.08] px-5 py-4 flex items-center justify-between z-10 bg-charcoal/80 backdrop-blur-md">
                                <BrandLogo tone="dark" href="/" size="sm" onClick={closeMenu} />
                                <button
                                    onClick={closeMenu}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white/65 hover:text-white hover:bg-white/[0.08] active:scale-[0.97] transition-[color,background-color,transform] duration-200"
                                    aria-label="Close menu"
                                    type="button"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
                                {links.map((link) => (
                                    <Link
                                        key={link.href + link.label}
                                        href={link.href}
                                        onClick={closeMenu}
                                        className={
                                            link.isButton
                                                ? 'flex items-center justify-center w-full min-h-[2.75rem] px-3 py-2.5 rounded-xl text-sm font-semibold bg-gold text-white shadow-[0_1px_3px_rgba(0,0,0,0.18)] hover:bg-gold/90 transition'
                                                : 'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.07] transition'
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
