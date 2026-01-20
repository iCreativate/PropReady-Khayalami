'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X, Home } from 'lucide-react';

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
            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={toggleMenu}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-charcoal/5 hover:bg-charcoal/10 active:bg-charcoal/20 transition-colors touch-manipulation z-50 relative"
                aria-label="Toggle menu"
                type="button"
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-charcoal" />
                ) : (
                    <Menu className="w-6 h-6 text-charcoal" />
                )}
            </button>

            {/* Mobile Menu Overlay - Rendered via Portal */}
            {isMounted && isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] md:hidden"
                    onClick={closeMenu}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    {/* Menu Panel */}
                    <div
                        className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-br from-gold via-gold/90 to-gold/80 px-6 py-5 border-b border-gold/20 flex items-center justify-between z-10">
                            <div className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                                    <Home className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-white text-xl font-bold">PropReady</span>
                            </div>
                            <button
                                onClick={closeMenu}
                                className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 active:bg-white/40 transition-colors flex items-center justify-center touch-manipulation"
                                aria-label="Close menu"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <nav className="px-4 py-6 space-y-2">
                            {links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    onClick={(e) => {
                                        closeMenu();
                                    }}
                                    className={`block px-4 py-3 rounded-xl transition-all touch-manipulation ${
                                        link.isButton
                                            ? 'bg-gradient-to-r from-gold to-gold/90 text-white font-semibold hover:from-gold-600 hover:to-gold-700 active:from-gold-700 active:to-gold-800 shadow-md'
                                            : 'text-charcoal/90 hover:text-charcoal active:text-charcoal hover:bg-charcoal/5 active:bg-charcoal/10'
                                    }`}
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
