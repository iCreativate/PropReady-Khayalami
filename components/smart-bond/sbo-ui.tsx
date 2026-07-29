'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import {
    PORTAL_CARD,
    PORTAL_CARD_BODY,
    PORTAL_CARD_HEADER,
    PORTAL_FORM_INPUT,
    PORTAL_FORM_LABEL,
} from '@/lib/portal-ui';

export function SboSection({
    title,
    subtitle,
    action,
    children,
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className={`${PORTAL_CARD} overflow-hidden`}>
            <div className={`${PORTAL_CARD_HEADER} flex flex-wrap items-start justify-between gap-3`}>
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight text-charcoal">{title}</h2>
                    {subtitle ? (
                        <p className="mt-1 text-sm text-charcoal/60">{subtitle}</p>
                    ) : null}
                </div>
                {action}
            </div>
            <div className={PORTAL_CARD_BODY}>{children}</div>
        </section>
    );
}

export function SboKpi({
    label,
    value,
    hint,
    icon: Icon,
    tone = 'default',
    trend,
}: {
    label: string;
    value: string;
    hint?: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'default' | 'good' | 'warn' | 'danger' | 'accent';
    trend?: string;
}) {
    const toneCls =
        tone === 'good'
            ? 'bg-emerald-50 text-emerald-700'
            : tone === 'warn'
              ? 'bg-amber-50 text-amber-700'
              : tone === 'danger'
                ? 'bg-red-50 text-red-700'
                : tone === 'accent'
                  ? 'bg-gold/10 text-gold'
                  : 'bg-charcoal/[0.04] text-charcoal/70';
    return (
        <div className="group rounded-2xl border border-charcoal/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneCls}`}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend ? (
                    <span className="text-[11px] font-semibold text-charcoal/45">{trend}</span>
                ) : null}
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal/45">
                {label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-charcoal">
                {value}
            </p>
            {hint ? <p className="mt-1 text-xs text-charcoal/55">{hint}</p> : null}
        </div>
    );
}

export function SboSlider({
    label,
    value,
    min,
    max,
    step,
    onChange,
    display,
    hint,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (n: number) => void;
    display: string;
    hint?: string;
}) {
    return (
        <label className="block space-y-2">
            <div className="flex items-center justify-between gap-3">
                <span className={PORTAL_FORM_LABEL}>{label}</span>
                <span className="text-sm font-semibold tabular-nums text-charcoal">{display}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-[#DC2626]"
            />
            {hint ? <p className="text-xs text-charcoal/50">{hint}</p> : null}
        </label>
    );
}

export function SboNumberField({
    label,
    value,
    onChange,
    hint,
    min,
    step = 1,
}: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    hint?: string;
    min?: number;
    step?: number;
}) {
    return (
        <label className="block space-y-1.5">
            <span className={PORTAL_FORM_LABEL}>{label}</span>
            <input
                type="number"
                className={PORTAL_FORM_INPUT}
                value={Number.isFinite(value) ? value : 0}
                min={min}
                step={step}
                onChange={(e) => onChange(Number(e.target.value))}
            />
            {hint ? <p className="text-xs text-charcoal/50">{hint}</p> : null}
        </label>
    );
}

export function SboScoreRing({
    score,
    label,
    sub,
}: {
    score: number;
    label: string;
    sub: string;
}) {
    const r = 54;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, score)) / 100;
    const offset = c * (1 - pct);
    return (
        <div className="flex flex-col items-center rounded-2xl border border-charcoal/[0.08] bg-gradient-to-b from-white to-[#F8FAFC] p-5">
            <div className="relative h-36 w-36">
                <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                    <circle cx="70" cy="70" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
                    <circle
                        cx="70"
                        cy="70"
                        r={r}
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={c}
                        strokeDashoffset={offset}
                        className="transition-all duration-700"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-semibold tabular-nums text-charcoal">{score}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/45">
                        / 100
                    </span>
                </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-charcoal">{label}</p>
            <p className="text-xs text-charcoal/55">{sub}</p>
        </div>
    );
}

export function SboInsightBadge({ kind }: { kind: string }) {
    const map: Record<string, string> = {
        fact: 'bg-sky-50 text-sky-700 border-sky-100',
        estimate: 'bg-violet-50 text-violet-700 border-violet-100',
        assumption: 'bg-amber-50 text-amber-800 border-amber-100',
        opportunity: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[kind] || map.fact}`}
        >
            {kind}
        </span>
    );
}

export function SboCallout({ children }: { children: ReactNode }) {
    return (
        <div className="flex gap-3 rounded-2xl border border-charcoal/[0.08] bg-[#F8FAFC] px-4 py-3 text-sm text-charcoal/70">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <div className="min-w-0 leading-relaxed">{children}</div>
        </div>
    );
}

export function SboTabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition ${
                active
                    ? 'bg-gold text-white shadow-sm'
                    : 'bg-white text-charcoal/65 ring-1 ring-charcoal/[0.08] hover:bg-[#F8FAFC]'
            }`}
        >
            {children}
        </button>
    );
}
