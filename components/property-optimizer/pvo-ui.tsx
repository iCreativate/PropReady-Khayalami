'use client';

import { useEffect, useRef, useState } from 'react';

export function AnimatedCounter({
    value,
    format = (v) => v.toLocaleString('en-ZA'),
    duration = 700,
    className = '',
}: {
    value: number;
    format?: (v: number) => string;
    duration?: number;
    className?: string;
}) {
    const [display, setDisplay] = useState(value);
    const prev = useRef(value);

    useEffect(() => {
        const start = prev.current;
        const end = value;
        const startTime = performance.now();

        const tick = (now: number) => {
            const t = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(start + (end - start) * eased);
            if (t < 1) requestAnimationFrame(tick);
            else prev.current = end;
        };

        requestAnimationFrame(tick);
    }, [value, duration]);

    return <span className={className}>{format(display)}</span>;
}

export function PvoGlassCard({
    children,
    className = '',
    glow = false,
}: {
    children: React.ReactNode;
    className?: string;
    glow?: boolean;
}) {
    return (
        <div
            className={`pvo-glass rounded-3xl border transition-all duration-300 ${glow ? 'pvo-glow' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

export function PvoSection({
    id,
    title,
    subtitle,
    children,
    action,
}: {
    id?: string;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <section id={id} className="pvo-section learn-animate-in">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
                <div>
                    <h2 className="pvo-heading text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
                    {subtitle && <p className="pvo-muted mt-2 text-sm sm:text-base max-w-2xl">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

export function PvoSkeleton({ className = '' }: { className?: string }) {
    return <div className={`pvo-skeleton rounded-2xl ${className}`} />;
}

export function PvoBadge({
    children,
    tone = 'default',
}: {
    children: React.ReactNode;
    tone?: 'default' | 'gold' | 'green' | 'blue' | 'warm';
}) {
    const tones = {
        default: 'pvo-badge',
        gold: 'pvo-badge pvo-badge-gold',
        green: 'pvo-badge pvo-badge-green',
        blue: 'pvo-badge pvo-badge-blue',
        warm: 'pvo-badge pvo-badge-warm',
    };
    return <span className={tones[tone]}>{children}</span>;
}

export function PvoTabs<T extends string>({
    tabs,
    active,
    onChange,
}: {
    tabs: { id: T; label: string }[];
    active: T;
    onChange: (id: T) => void;
}) {
    return (
        <div className="pvo-tabs inline-flex p-1 rounded-full">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        active === tab.id ? 'pvo-tab-active' : 'pvo-tab'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

export function PvoProgressRing({ score, size = 120 }: { score: number; size?: number }) {
    const r = (size - 12) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={8}
                    className="pvo-ring-track"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="url(#pvoGrad)"
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                />
                <defs>
                    <linearGradient id="pvoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#004D40" />
                        <stop offset="100%" stopColor="#DC2626" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold pvo-heading tabular-nums">{Math.round(score)}</span>
                <span className="text-[10px] uppercase tracking-wider pvo-muted">Score</span>
            </div>
        </div>
    );
}

export function PvoThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="pvo-theme-btn inline-flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium transition-all"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
    );
}
