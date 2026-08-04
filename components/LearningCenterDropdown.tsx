'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, BookOpen, Building2, Home, TrendingUp } from 'lucide-react';

export default function LearningCenterDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isOpen]);

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 200);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="flex items-center gap-1"
            >
                <Link
                    href="/learning-center"
                    className="text-charcoal/90 hover:text-charcoal transition"
                >
                    Learning Center
                </Link>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-label="Learning Center menu"
                    className="text-charcoal/90 hover:text-charcoal transition p-0.5"
                >
                    <ChevronDown
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>

            {isOpen && (
                <div
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="absolute top-full left-0 mt-2 w-64 premium-card rounded-xl shadow-2xl border border-charcoal/10 overflow-hidden z-50"
                >
                    <div className="p-2">
                        <Link
                            href="/learning-center"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gold/10 transition-colors group border-b border-charcoal/5 mb-1"
                            onClick={() => setIsOpen(false)}
                        >
                            <BookOpen className="w-5 h-5 text-gold shrink-0" />
                            <div>
                                <p className="font-semibold text-charcoal">All hubs</p>
                                <p className="text-xs text-charcoal/60">Buyers, sellers & investors</p>
                            </div>
                        </Link>
                        <Link
                            href="/learn"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gold/10 transition-colors group"
                            onClick={() => setIsOpen(false)}
                        >
                            <Home className="w-5 h-5 text-gold shrink-0" />
                            <div>
                                <p className="font-semibold text-charcoal">Buyers</p>
                                <p className="text-xs text-charcoal/60">First-time buyer guides</p>
                            </div>
                        </Link>
                        <Link
                            href="/sellers"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gold/10 transition-colors group"
                            onClick={() => setIsOpen(false)}
                        >
                            <Building2 className="w-5 h-5 text-gold shrink-0" />
                            <div>
                                <p className="font-semibold text-charcoal">Sellers</p>
                                <p className="text-xs text-charcoal/60">Selling guides & tips</p>
                            </div>
                        </Link>
                        <Link
                            href="/learn/investors"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gold/10 transition-colors group"
                            onClick={() => setIsOpen(false)}
                        >
                            <TrendingUp className="w-5 h-5 text-gold shrink-0" />
                            <div>
                                <p className="font-semibold text-charcoal">Property Investors</p>
                                <p className="text-xs text-charcoal/60">Investment strategies & tips</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
