'use client';

import {
    useEffect,
    useId,
    useState,
    type ReactNode,
} from 'react';
import {
    ChevronDown,
    HelpCircle,
    Info,
    Minus,
    Plus,
    Sparkles,
} from 'lucide-react';
import { formatNumber, formatZar } from '@/lib/smart-bond/format';

/** Metric / KPI card */
export function MetricCard({
    label,
    value,
    hint,
    icon: Icon,
    tone = 'neutral',
    trend,
    trendPositive,
}: {
    label: string;
    value: string;
    hint?: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'info' | 'brand';
    trend?: string;
    trendPositive?: boolean;
}) {
    const iconTone =
        tone === 'good'
            ? 'bg-emerald-50 text-emerald-600'
            : tone === 'warn'
              ? 'bg-amber-50 text-amber-600'
              : tone === 'danger'
                ? 'bg-red-50 text-red-600'
                : tone === 'info'
                  ? 'bg-sky-50 text-sky-600'
                  : tone === 'brand'
                    ? 'bg-gold/10 text-gold'
                    : 'bg-slate-100 text-slate-600';

    return (
        <div className="group relative overflow-hidden rounded-[1.15rem] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.04] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] sm:p-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-80" />
            <div className="flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconTone} transition group-hover:scale-105`}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend ? (
                    <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            trendPositive === false
                                ? 'bg-red-50 text-red-600'
                                : trendPositive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                        {trend}
                    </span>
                ) : null}
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                {label}
            </p>
            <p className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-2xl">
                {value}
            </p>
            {hint ? <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
        </div>
    );
}

export function SectionIntro({
    eyebrow,
    title,
    body,
    example,
}: {
    eyebrow?: string;
    title: string;
    body: string;
    example?: string;
}) {
    return (
        <div className="mb-5 max-w-3xl">
            {eyebrow ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                    {eyebrow}
                </p>
            ) : null}
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{body}</p>
            {example ? (
                <p className="mt-3 rounded-2xl bg-sky-50/80 px-4 py-3 text-sm leading-relaxed text-sky-900/80 ring-1 ring-sky-100">
                    <span className="font-semibold text-sky-800">Example: </span>
                    {example}
                </p>
            ) : null}
        </div>
    );
}

export function Panel({
    children,
    className = '',
    padded = true,
}: {
    children: ReactNode;
    className?: string;
    padded?: boolean;
}) {
    return (
        <section
            className={`overflow-hidden rounded-[1.25rem] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.04] ${className}`}
        >
            <div className={padded ? 'p-5 sm:p-6 lg:p-7' : ''}>{children}</div>
        </section>
    );
}

export function TooltipHint({ text }: { text: string }) {
    const [open, setOpen] = useState(false);
    const id = useId();
    return (
        <span className="relative inline-flex align-middle">
            <button
                type="button"
                aria-describedby={open ? id : undefined}
                aria-label="More information"
                className="ml-1 inline-flex text-slate-400 transition hover:text-slate-600"
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
            >
                <HelpCircle className="h-3.5 w-3.5" />
            </button>
            {open ? (
                <span
                    id={id}
                    role="tooltip"
                    className="absolute bottom-full left-1/2 z-40 mb-2 w-56 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-left text-[11px] leading-relaxed text-white shadow-lg"
                >
                    {text}
                </span>
            ) : null}
        </span>
    );
}

export function SmartSlider({
    label,
    value,
    min,
    max,
    step,
    onChange,
    display,
    why,
    example,
    tooltip,
    chips,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (n: number) => void;
    display: string;
    why?: string;
    example?: string;
    tooltip?: string;
    chips?: Array<{ label: string; value: number }>;
}) {
    return (
        <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-900/[0.04] sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                        {label}
                        {tooltip ? <TooltipHint text={tooltip} /> : null}
                    </p>
                    {why ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{why}</p> : null}
                </div>
                <p className="shrink-0 text-base font-semibold tabular-nums text-slate-900">{display}</p>
            </div>
            <div className="mt-4 flex items-center gap-3">
                <button
                    type="button"
                    aria-label="Decrease"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-900/[0.06] transition hover:bg-slate-50 active:scale-95"
                    onClick={() => onChange(Math.max(min, value - step))}
                >
                    <Minus className="h-4 w-4" />
                </button>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#DC2626] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#DC2626] [&::-webkit-slider-thumb]:shadow-md"
                />
                <button
                    type="button"
                    aria-label="Increase"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-900/[0.06] transition hover:bg-slate-50 active:scale-95"
                    onClick={() => onChange(Math.min(max, value + step))}
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
            {chips?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                    {chips.map((c) => (
                        <button
                            key={c.label}
                            type="button"
                            onClick={() => onChange(c.value)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                value === c.value
                                    ? 'bg-gold text-white'
                                    : 'bg-white text-slate-600 ring-1 ring-slate-900/[0.06] hover:bg-slate-50'
                            }`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            ) : null}
            {example ? (
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    <span className="font-medium text-slate-600">Example: </span>
                    {example}
                </p>
            ) : null}
        </div>
    );
}

export function FinancialInput({
    label,
    value,
    onChange,
    hint,
    tooltip,
    min = 0,
    step = 1000,
    currency = true,
    suffix,
}: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    hint?: string;
    tooltip?: string;
    min?: number;
    step?: number;
    currency?: boolean;
    suffix?: string;
}) {
    const [draft, setDraft] = useState(
        currency ? formatNumber(value, 0) : String(value)
    );

    useEffect(() => {
        setDraft(currency ? formatNumber(value, 0) : String(value));
    }, [value, currency]);

    function commit(raw: string) {
        const cleaned = raw.replace(/[^\d.]/g, '');
        const n = Number(cleaned);
        if (!Number.isFinite(n)) return;
        onChange(Math.max(min, n));
    }

    return (
        <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
                {label}
                {tooltip ? <TooltipHint text={tooltip} /> : null}
            </span>
            <div className="flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/[0.08] focus-within:ring-2 focus-within:ring-gold/30">
                <button
                    type="button"
                    className="flex w-11 items-center justify-center border-r border-slate-100 text-slate-500 transition hover:bg-slate-50"
                    onClick={() => onChange(Math.max(min, value - step))}
                    aria-label="Decrease"
                >
                    <Minus className="h-4 w-4" />
                </button>
                <div className="relative flex-1">
                    {currency ? (
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                            R
                        </span>
                    ) : null}
                    <input
                        inputMode="decimal"
                        className={`h-11 w-full bg-transparent text-sm font-semibold tabular-nums text-slate-900 outline-none ${
                            currency ? 'pl-8 pr-3' : 'px-3'
                        }`}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => commit(draft)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commit(draft);
                        }}
                    />
                    {suffix ? (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                            {suffix}
                        </span>
                    ) : null}
                </div>
                <button
                    type="button"
                    className="flex w-11 items-center justify-center border-l border-slate-100 text-slate-500 transition hover:bg-slate-50"
                    onClick={() => onChange(value + step)}
                    aria-label="Increase"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
            {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </label>
    );
}

export function ComparisonCard({
    leftTitle,
    rightTitle,
    leftValue,
    rightValue,
    highlight,
    footnote,
}: {
    leftTitle: string;
    rightTitle: string;
    leftValue: string;
    rightValue: string;
    highlight?: string;
    footnote?: string;
}) {
    return (
        <div className="overflow-hidden rounded-[1.15rem] bg-gradient-to-br from-slate-50 to-white p-1 shadow-[0_8px_28px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.05]">
            <div className="grid gap-px overflow-hidden rounded-[1.05rem] bg-slate-100 sm:grid-cols-2">
                <div className="bg-white p-4 sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        {leftTitle}
                    </p>
                    <p className="mt-2 text-xl font-semibold tabular-nums text-slate-800">{leftValue}</p>
                </div>
                <div className="bg-emerald-50/60 p-4 sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700/70">
                        {rightTitle}
                    </p>
                    <p className="mt-2 text-xl font-semibold tabular-nums text-emerald-800">{rightValue}</p>
                </div>
            </div>
            {highlight ? (
                <p className="px-4 py-3 text-sm font-medium text-emerald-800 sm:px-5">{highlight}</p>
            ) : null}
            {footnote ? <p className="px-4 pb-4 text-xs text-slate-500 sm:px-5">{footnote}</p> : null}
        </div>
    );
}

export function AIInsightCard({
    kind,
    title,
    body,
    actionLabel,
    onAction,
}: {
    kind: string;
    title: string;
    body: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const kindStyle: Record<string, string> = {
        fact: 'bg-sky-50 text-sky-700',
        estimate: 'bg-indigo-50 text-indigo-700',
        assumption: 'bg-amber-50 text-amber-800',
        opportunity: 'bg-emerald-50 text-emerald-700',
    };
    return (
        <article className="rounded-[1.15rem] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.04] sm:p-5">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/15 to-gold/5 text-gold">
                    <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                kindStyle[kind] || kindStyle.fact
                            }`}
                        >
                            {kind}
                        </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">{title}</h3>
                    <p className={`mt-1.5 text-sm leading-relaxed text-slate-600 ${expanded ? '' : 'line-clamp-3'}`}>
                        {body}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                            onClick={() => setExpanded((v) => !v)}
                        >
                            {expanded ? 'Show less' : 'Read more'}
                            <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                        {actionLabel && onAction ? (
                            <button
                                type="button"
                                onClick={onAction}
                                className="text-xs font-semibold text-gold hover:underline"
                            >
                                {actionLabel}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </article>
    );
}

export function ProgressRing({
    score,
    label,
    sub,
    color = '#DC2626',
}: {
    score: number;
    label: string;
    sub: string;
    color?: string;
}) {
    const r = 52;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, score)) / 100;
    return (
        <div className="flex flex-col items-center rounded-[1.25rem] bg-gradient-to-b from-white to-slate-50 p-5 ring-1 ring-slate-900/[0.04]">
            <div className="relative h-32 w-32 sm:h-36 sm:w-36">
                <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                    <circle cx="70" cy="70" r={r} fill="none" stroke="#E2E8F0" strokeWidth="10" />
                    <circle
                        cx="70"
                        cy="70"
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={c}
                        strokeDashoffset={c * (1 - pct)}
                        className="transition-all duration-700 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-semibold tabular-nums text-slate-900">{score}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        / 100
                    </span>
                </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">{sub}</p>
        </div>
    );
}

export function ChartContainer({
    title,
    subtitle,
    children,
    height = 'h-72',
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    height?: string;
}) {
    return (
        <Panel>
            <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
            </div>
            <div className={height}>{children}</div>
        </Panel>
    );
}

export function StickyActionBar({
    summary,
    primaryLabel,
    onPrimary,
    secondaryLabel,
    onSecondary,
}: {
    summary: string;
    primaryLabel: string;
    onPrimary: () => void;
    secondaryLabel?: string;
    onSecondary?: () => void;
}) {
    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 print:hidden">
            <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <p className="px-1 text-sm text-white/75">{summary}</p>
                <div className="flex flex-wrap gap-2">
                    {secondaryLabel && onSecondary ? (
                        <button
                            type="button"
                            onClick={onSecondary}
                            className="h-11 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            {secondaryLabel}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={onPrimary}
                        className="h-11 rounded-xl bg-gold px-5 text-sm font-semibold text-white shadow-lg shadow-gold/25 transition hover:bg-[#c91d1d] active:scale-[0.98]"
                    >
                        {primaryLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function TabPill({
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
            className={`snap-start whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition ${
                active
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                    : 'bg-white/80 text-slate-600 ring-1 ring-slate-900/[0.06] hover:bg-white hover:text-slate-900'
            }`}
        >
            {children}
        </button>
    );
}

export function DisclaimerBanner({ children }: { children: ReactNode }) {
    return (
        <div className="flex gap-3 rounded-2xl bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950/80 ring-1 ring-amber-100">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>{children}</div>
        </div>
    );
}

export function EmptyState({
    title,
    body,
}: {
    title: string;
    body: string;
}) {
    return (
        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
            <p className="text-base font-semibold text-slate-800">{title}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{body}</p>
        </div>
    );
}

export function formatChipZar(n: number) {
    return `+${formatZar(n)}`;
}
