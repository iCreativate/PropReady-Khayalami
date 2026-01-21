'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, BookOpen } from 'lucide-react';

export default function LearningCenterDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-charcoal/90 hover:text-charcoal transition"
            >
                <span>Learning Center</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                    className="absolute top-full left-0 mt-2 w-56 premium-card rounded-xl shadow-2xl border border-charcoal/10 overflow-hidden z-50"
                >
                    <div className="p-2">
                        <Link
                            href="/learn"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gold/10 transition-colors group"
                            onClick={() => setIsOpen(false)}
                        >
                            <BookOpen className="w-5 h-5 text-gold group-hover:text-gold" />
                            <div>
                                <p className="font-semibold text-charcoal">Buyers</p>
                                <p className="text-xs text-charcoal/60">First-time buyer guides</p>
                            </div>
                        </Link>
                        <Link
                            href="/learn/investors"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gold/10 transition-colors group"
                            onClick={() => setIsOpen(false)}
                        >
                            <BookOpen className="w-5 h-5 text-gold group-hover:text-gold" />
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
