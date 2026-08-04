'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function SectionReveal({
    children,
    className = '',
    align = 'left',
}: {
    children: ReactNode;
    className?: string;
    align?: 'left' | 'right' | 'center';
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) {
            setVisible(true);
            return;
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    io.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const alignClass =
        align === 'right' ? 'md:ml-auto' : align === 'center' ? 'mx-auto' : '';

    return (
        <div
            ref={ref}
            className={`transition-all duration-500 ease-out ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            } ${alignClass} ${className}`}
        >
            {children}
        </div>
    );
}
