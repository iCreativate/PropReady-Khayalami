'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ArrowLeft,
    Bath,
    BedDouble,
    Bell,
    Building2,
    Calendar,
    Car,
    Check,
    ChevronDown,
    ChevronRight,
    FileText,
    Hammer,
    Home,
    ImagePlus,
    Pencil,
    Plus,
    Shield,
    Sparkles,
    Trash2,
    Trees,
    Wallet,
    Waves,
    X,
    Zap,
} from 'lucide-react';
import {
    formatCurrency,
    formatMoneyInput,
    formatPriceWithCommas,
    parseMoneyInput,
} from '@/lib/currency';
import {
    BOND_TERM_YEAR_OPTIONS,
    allPrioritisedInsights,
    bondTermLabel,
    bondTermYearsOf,
    bondTracker,
    bondPaidToDate,
    compressPropertyImage,
    createEmptyCompanionState,
    createEmptyProperty,
    createEmptyRenovation,
    daysUntil,
    deleteCompanionProperty,
    equityOf,
    formatPct,
    formatZar,
    grossYield,
    healthScore,
    loadCompanionStateAsync,
    monthlyProfit,
    mortgageProgress,
    netCashFlow,
    netYield,
    portfolioKpis,
    prioritisedInsights,
    propertyImageCompressLabel,
    propertyTypeLabel,
    purchaseFundingLabel,
    propertyConditionLabel,
    propertySpecsLabel,
    propertyAmenityLabel,
    PROPERTY_TYPE_OPTIONS,
    PROPERTY_CONDITION_OPTIONS,
    PROPERTY_AMENITY_OPTIONS,
    PURCHASE_FUNDING_OPTIONS,
    BUILD_COST_STAGE_OPTIONS,
    BUILD_FUNDING_OPTIONS,
    RENOVATION_CATEGORIES,
    estimateCurrentValue,
    refineCompanionState,
    resolveCompanionSuburb,
    searchCompanionSuburbs,
    totalBuildCostOf,
    emptyBuildCostBreakdown,
    buildFundingLabel,
    roiPct,
    saveCompanionStateAsync,
    simulateBond,
    syncDerivedBondFields,
    effectiveBondRatePct,
    effectiveMonthlyBond,
    effectiveRemainingTermMonths,
    withBondFinance,
    withBondTermYears,
    withBuildInvestment,
    withCurrentValueMode,
    withPropertyCondition,
    withPropertyType,
    withPurchaseFunding,
    type CompanionAlert,
    type CompanionState,
    type DocCategory,
    type IqProperty,
    type IqRenovation,
    type PropertyAmenityId,
    type PropertyType,
    type RenovationCategory,
    type RenovationStatus,
} from '@/lib/property-iq';

const CompanionSpreadsheet = dynamic(
    () => import('@/components/property-iq/CompanionSpreadsheet'),
    { ssr: false, loading: () => <div className="pc-loading">Loading spreadsheet…</div> }
);
const RepoRateBanner = dynamic(() => import('@/components/market/RepoRateBanner'), {
    ssr: false,
});

const PROPERTY_IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';

async function readPropertyImageFile(file: File): Promise<string> {
    return compressPropertyImage(file, {
        maxEdge: 1600,
        quality: 0.72,
        maxBytes: 450 * 1024,
    });
}
type CompanionTab =
    | 'overview'
    | 'bond'
    | 'rental'
    | 'expenses'
    | 'renovations'
    | 'spreadsheet'
    | 'documents'
    | 'ai'
    | 'timeline';

const TABS: { id: CompanionTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'bond', label: 'Bond' },
    { id: 'rental', label: 'Rental' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'renovations', label: 'Renovations' },
    { id: 'spreadsheet', label: 'Spreadsheet' },
    { id: 'documents', label: 'Documents' },
    { id: 'ai', label: 'AI' },
    { id: 'timeline', label: 'Timeline' },
];

const AMENITY_GROUPS: {
    id: 'Outdoor' | 'Security' | 'Building' | 'Energy' | 'Lifestyle';
    label: string;
    hint: string;
    Icon: typeof Trees;
}[] = [
    { id: 'Outdoor', label: 'Outdoor', hint: 'Garden, pool & braai', Icon: Trees },
    { id: 'Security', label: 'Security', hint: 'Safety & estate', Icon: Shield },
    { id: 'Building', label: 'Building', hint: 'Interior & extras', Icon: Home },
    { id: 'Energy', label: 'Energy', hint: 'Power & solar', Icon: Zap },
    { id: 'Lifestyle', label: 'Lifestyle', hint: 'Views & living', Icon: Waves },
];

const DOC_CHIPS: { id: DocCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'title', label: 'ID / Title' },
    { id: 'bond', label: 'Bond' },
    { id: 'lease', label: 'Lease' },
    { id: 'municipal', label: 'Municipality' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'invoice', label: 'Tax' },
    { id: 'transfer', label: 'Transfer' },
];

const WHAT_IF = [500, 1_000, 2_500, 5_000, 7_500, 10_000] as const;

function Ring({ value, size = 160, label }: { value: number; size?: number; label: string }) {
    const r = size * 0.38;
    const c = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, value));
    const len = (pct / 100) * c;
    const mid = size / 2;
    return (
        <div className="pc-ring" style={{ width: size, height: size }} aria-label={label}>
            <svg viewBox={`0 0 ${size} ${size}`}>
                <circle cx={mid} cy={mid} r={r} className="pc-ring-track" />
                <circle
                    cx={mid}
                    cy={mid}
                    r={r}
                    className="pc-ring-prog"
                    strokeDasharray={`${len} ${c}`}
                    transform={`rotate(-90 ${mid} ${mid})`}
                />
            </svg>
            <div className="pc-ring-label">
                <strong>{Math.round(pct)}%</strong>
                <span>{label}</span>
            </div>
        </div>
    );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
    return (
        <div className="pc-stat">
            <span>{label}</span>
            <strong className={tone ? `is-${tone}` : undefined}>{value}</strong>
        </div>
    );
}

function SoftField({
    label,
    value,
    onChange,
    type = 'text',
    hint,
    step,
    min,
}: {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    type?: string;
    hint?: string;
    step?: string | number;
    min?: string | number;
}) {
    return (
        <label className="pc-soft-field">
            <span>{label}</span>
            <input
                type={type}
                value={value}
                step={step}
                min={min}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint ? <em className="pc-field-hint">{hint}</em> : null}
        </label>
    );
}

/** Whole / decimal number field stored as number. */
function NumberField({
    label,
    value,
    onChange,
    hint,
    step = 1,
    min = 0,
}: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    hint?: string;
    step?: number;
    min?: number;
}) {
    return (
        <label className="pc-soft-field">
            <span>{label}</span>
            <input
                type="number"
                inputMode="decimal"
                min={min}
                step={step}
                placeholder="0"
                value={value === 0 ? '' : value}
                onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                        onChange(0);
                        return;
                    }
                    const n = Number(raw);
                    onChange(Number.isFinite(n) ? Math.max(min, n) : 0);
                }}
            />
            {hint ? <em className="pc-field-hint">{hint}</em> : null}
        </label>
    );
}

function SoftSelect<T extends string>({
    label,
    value,
    onChange,
    options,
    hint,
}: {
    label: string;
    value: T;
    onChange: (v: T) => void;
    options: { id: T; label: string; hint?: string }[];
    hint?: string;
}) {
    const selectedHint = options.find((o) => o.id === value)?.hint;
    return (
        <label className="pc-soft-field">
            <span>{label}</span>
            <select value={value} onChange={(e) => onChange(e.target.value as T)}>
                {options.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.label}
                    </option>
                ))}
            </select>
            {hint || selectedHint ? <em className="pc-field-hint">{hint || selectedHint}</em> : null}
        </label>
    );
}

/** Currency amount field — shows 1,250,000 while typing; stores a number. */
function MoneyField({
    label,
    value,
    onChange,
    hint,
}: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    hint?: string;
}) {
    return (
        <label className="pc-soft-field">
            <span>{label}</span>
            <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={value === 0 ? '' : formatPriceWithCommas(value)}
                onChange={(e) => {
                    const formatted = formatMoneyInput(e.target.value);
                    onChange(parseMoneyInput(formatted));
                }}
            />
            {hint ? <em className="pc-field-hint">{hint}</em> : null}
        </label>
    );
}

/** Suburb + city picker anchored to Property24 suburb averages. */
function SuburbLocationField({
    suburb,
    city,
    onSelect,
}: {
    suburb: string;
    city: string;
    onSelect: (next: { suburb: string; city: string }) => void;
}) {
    const [query, setQuery] = useState(suburb || '');
    const [open, setOpen] = useState(false);
    const match = resolveCompanionSuburb({ suburb, city, address: '' });
    const results = query.trim().length >= 2 ? searchCompanionSuburbs(query, 8) : [];

    useEffect(() => {
        setQuery(suburb || '');
    }, [suburb]);

    return (
        <div className={`pc-soft-field pc-suburb-field${match ? ' is-matched' : ''}`}>
            <span>Suburb / location</span>
            <input
                type="text"
                value={query}
                placeholder="e.g. Parkhurst, Sea Point, Umhlanga"
                autoComplete="off"
                onFocus={() => setOpen(true)}
                onChange={(e) => {
                    const v = e.target.value;
                    setQuery(v);
                    setOpen(true);
                    onSelect({ suburb: v, city });
                }}
                onBlur={() => {
                    window.setTimeout(() => setOpen(false), 160);
                }}
            />
            {open && results.length > 0 ? (
                <ul className="pc-suburb-suggest" role="listbox">
                    {results.map((r) => (
                        <li key={r.key}>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    setQuery(r.suburb);
                                    setOpen(false);
                                    onSelect({ suburb: r.suburb, city: r.city });
                                }}
                            >
                                <strong>
                                    {r.suburb}, {r.city}
                                </strong>
                                <span>
                                    {r.province} · avg {formatZar(r.avgPropertyPrice)}
                                    {r.priceYear ? ` · ${r.priceYear}` : ''}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
            <em className="pc-field-hint">
                {match
                    ? `Property24 average ${formatZar(match.avgPropertyPrice)}${match.priceYear ? ` (${match.priceYear})` : ''} — auto value is location-based`
                    : 'Search and select a SA suburb so current value anchors to local Property24 averages'}
            </em>
        </div>
    );
}

/** Single photo upload — compressed JPG/PNG/WebP. */
function PropertyImageField({
    value,
    onChange,
    label = 'Property photo',
}: {
    value: string;
    onChange: (dataUrl: string) => void;
    label?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function onFile(file: File | undefined) {
        if (!file) return;
        setError(null);
        setBusy(true);
        try {
            const dataUrl = await readPropertyImageFile(file);
            onChange(dataUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Upload failed.');
        } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    }

    return (
        <div className="pc-soft-field pc-edit-photo">
            <span>{label}</span>
            <div className={`pc-image-upload${value ? ' has-image' : ''}`}>
                {value ? (
                    <div className="pc-image-preview">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={value} alt="" />
                        <div className="pc-image-actions">
                            <button
                                type="button"
                                className="pc-btn"
                                disabled={busy}
                                onClick={() => inputRef.current?.click()}
                            >
                                <ImagePlus className="w-3.5 h-3.5" /> Replace
                            </button>
                            <button
                                type="button"
                                className="pc-btn"
                                disabled={busy}
                                onClick={() => {
                                    setError(null);
                                    onChange('');
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="pc-image-drop"
                        disabled={busy}
                        onClick={() => inputRef.current?.click()}
                    >
                        <ImagePlus className="w-6 h-6" />
                        <strong>{busy ? 'Compressing…' : 'Upload photo'}</strong>
                        <span>JPG, PNG or WebP · auto-compressed · max 12 MB</span>
                        <em className="pc-image-compress-hint">{propertyImageCompressLabel()}</em>
                    </button>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept={PROPERTY_IMAGE_ACCEPT}
                    className="sr-only"
                    onChange={(e) => void onFile(e.target.files?.[0])}
                />
            </div>
            {error ? <em className="pc-field-error">{error}</em> : null}
        </div>
    );
}

type Props = { embedded?: boolean };

export default function PropertyIQDashboard({ embedded = false }: Props) {
    const [state, setState] = useState<CompanionState | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [mode, setMode] = useState<'portfolio' | 'companion'>('portfolio');
    const [tab, setTab] = useState<CompanionTab>('overview');
    const [extra, setExtra] = useState(1000);
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [showAllIq, setShowAllIq] = useState(false);
    const [docChip, setDocChip] = useState<DocCategory | 'all'>('all');
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<IqProperty | null>(null);
    const tabsNavRef = useRef<HTMLElement | null>(null);
    const tabScrollLock = useRef<number | null>(null);
    const skipNextSave = useRef(true);

    useEffect(() => {
        let cancelled = false;
        void loadCompanionStateAsync()
            .then((loaded) => {
                if (cancelled) return;
                skipNextSave.current = true;
                setState(loaded);
                setHydrated(true);

                // Refine bond figures after first paint so load never blocks on schedules.
                const refine = () => {
                    if (cancelled) return;
                    try {
                        const refined = refineCompanionState(loaded);
                        skipNextSave.current = true;
                        setState(refined);
                    } catch (err) {
                        console.warn('[Property Companion] Background refine failed', err);
                    }
                };
                if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                    window.requestIdleCallback(refine, { timeout: 1500 });
                } else {
                    setTimeout(refine, 100);
                }
            })
            .catch((err) => {
                console.warn('[Property Companion] Hydrate failed — empty workspace', err);
                if (cancelled) return;
                skipNextSave.current = true;
                setState(createEmptyCompanionState());
                setHydrated(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!hydrated || !state) return;
        // Avoid rewriting large photo payloads to IndexedDB right after hydrate.
        if (skipNextSave.current) {
            skipNextSave.current = false;
            return;
        }
        const timer = window.setTimeout(() => {
            void saveCompanionStateAsync(state);
        }, 450);
        return () => window.clearTimeout(timer);
    }, [state, hydrated]);

    // Heal bond properties that have a balance but R0 instalment / missing rate
    // (what-if and the bond header stay stuck until monthlyBond is priced).
    // Preserve the stored outstanding balance — only fill rate + instalment.
    useEffect(() => {
        if (!hydrated || !state) return;
        const needsHeal = state.properties.some(
            (p) =>
                p.purchaseFunding !== 'cash' &&
                p.outstandingBond > 0 &&
                (p.monthlyBond <= 0 || p.interestRate <= 0)
        );
        if (!needsHeal) return;

        let changed = false;
        const properties = state.properties.map((p) => {
            if (
                p.purchaseFunding === 'cash' ||
                p.outstandingBond <= 0 ||
                (p.monthlyBond > 0 && p.interestRate > 0)
            ) {
                return p;
            }
            const interestRate =
                p.interestRate > 0 ? p.interestRate : effectiveBondRatePct(p);
            const remainingTermMonths = effectiveRemainingTermMonths(p);
            const monthlyBond =
                p.monthlyBond > 0
                    ? p.monthlyBond
                    : effectiveMonthlyBond({
                          ...p,
                          interestRate,
                          remainingTermMonths,
                      });
            if (monthlyBond === p.monthlyBond && interestRate === p.interestRate) {
                return p;
            }
            changed = true;
            return {
                ...p,
                interestRate,
                remainingTermMonths,
                monthlyBond,
            };
        });
        if (!changed) return;
        setState((prev) => (prev ? { ...prev, properties } : prev));
    }, [hydrated, state]);

    useLayoutEffect(() => {
        if (tabScrollLock.current == null) return;
        const y = tabScrollLock.current;
        tabScrollLock.current = null;
        const scroller =
            tabsNavRef.current?.closest('main') ??
            document.querySelector('main');
        if (scroller instanceof HTMLElement) {
            scroller.scrollTop = y;
            return;
        }
        window.scrollTo({ top: y, left: 0 });
    }, [tab]);

    function selectTab(next: CompanionTab) {
        const scroller =
            tabsNavRef.current?.closest('main') ??
            document.querySelector('main');
        tabScrollLock.current =
            scroller instanceof HTMLElement ? scroller.scrollTop : window.scrollY;
        setTab(next);
        // Keep the active tab visible in the strip without scrolling the page.
        requestAnimationFrame(() => {
            const nav = tabsNavRef.current;
            const btn = nav?.querySelector<HTMLButtonElement>('button.is-active');
            if (!nav || !btn) return;
            const left = btn.offsetLeft - (nav.clientWidth - btn.offsetWidth) / 2;
            nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
        });
    }

    const properties = state?.properties ?? [];
    const paidByPropertyId = useMemo(() => {
        const map = new Map<string, ReturnType<typeof bondPaidToDate>>();
        for (const p of properties) {
            map.set(p.id, bondPaidToDate(p));
        }
        return map;
    }, [properties]);
    const active = properties.find((p) => p.id === state?.activePropertyId) ?? properties[0] ?? null;
    const viewForSim = editing && draft ? draft : active;
    const kpis = useMemo(() => portfolioKpis(properties), [properties]);
    const health = useMemo(
        () => (active ? healthScore(properties, active) : null),
        [active, properties]
    );
    const bondSim = useMemo(
        () =>
            viewForSim && viewForSim.purchaseFunding !== 'cash'
                ? simulateBond(viewForSim, {
                      extraMonthly: extra,
                      annualLump: 0,
                      biWeekly: false,
                      refinanceRate: null,
                  })
                : null,
        [viewForSim, extra]
    );
    const tracker = useMemo(
        () =>
            viewForSim && viewForSim.purchaseFunding !== 'cash'
                ? bondTracker(viewForSim)
                : null,
        [viewForSim]
    );
    const topIq = useMemo(
        () =>
            viewForSim && bondSim
                ? prioritisedInsights(viewForSim, properties, bondSim, 4)
                : [],
        [viewForSim, bondSim, properties]
    );
    const allIq = useMemo(
        () =>
            viewForSim && bondSim
                ? allPrioritisedInsights(viewForSim, properties, bondSim)
                : [],
        [viewForSim, bondSim, properties]
    );

    const unread = state?.alerts.filter((a) => !a.read).length ?? 0;
    const healthTone =
        !health ? 'idle' : health.score >= 85 ? 'excellent' : health.score >= 70 ? 'strong' : health.score >= 55 ? 'fair' : 'focus';
    const healthLabel =
        healthTone === 'idle'
            ? '—'
            : healthTone === 'excellent'
              ? 'Excellent'
              : healthTone === 'strong'
                ? 'Strong'
                : healthTone === 'fair'
                  ? 'Fair'
                  : 'Needs focus';
    const healthScoreValue = health?.score ?? 0;
    const healthRing = (() => {
        const r = 34;
        const c = 2 * Math.PI * r;
        const pct = Math.max(0, Math.min(100, healthScoreValue)) / 100;
        return { r, c, offset: c * (1 - pct) };
    })();

    function patch(fn: (s: CompanionState) => CompanionState) {
        setState((prev) => (prev ? fn(prev) : prev));
    }

    function openCompanion(id: string, nextTab: CompanionTab = 'overview') {
        patch((s) => ({ ...s, activePropertyId: id }));
        setTab(nextTab);
        setMode('companion');
        setEditing(false);
        setDraft(null);
        setShowAllIq(false);
    }

    function backToPortfolio() {
        setMode('portfolio');
        setEditing(false);
        setDraft(null);
    }

    function addProperty() {
        const p = createEmptyProperty({ name: `Property ${properties.length + 1}` });
        patch((s) => ({
            ...s,
            properties: [...s.properties, p],
            activePropertyId: p.id,
        }));
        setDraft(p);
        setEditing(true);
        setMode('companion');
        setTab('overview');
    }

    function saveEdit() {
        if (!draft) return;
        const synced = syncDerivedBondFields(draft);
        patch((s) => ({
            ...s,
            properties: s.properties.map((p) => (p.id === synced.id ? synced : p)),
        }));
        setEditing(false);
        setDraft(null);
    }

    function removeProperty(propertyId: string) {
        const target = properties.find((p) => p.id === propertyId);
        if (!target) return;
        const ok = window.confirm(
            `Delete “${target.name}” from Property Companion? This cannot be undone.`
        );
        if (!ok) return;
        patch((s) => deleteCompanionProperty(s, propertyId));
        setEditing(false);
        setDraft(null);
        setMode('portfolio');
    }

    function updateDraft<K extends keyof IqProperty>(key: K, value: IqProperty[K]) {
        setDraft((d) => (d ? { ...d, [key]: value } : d));
    }

    function markAlert(id: string) {
        patch((s) => ({
            ...s,
            alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
        }));
    }

    if (!state) {
        return (
            <div className={`pc-root ${embedded ? 'pc-embed' : ''}`}>
                <div className="pc-loading">Loading Property Companion™…</div>
            </div>
        );
    }

    const view = editing && draft ? draft : active;

    return (
        <div className={`pc-root ${embedded ? 'pc-embed' : ''}`}>
            {/* Alerts drawer */}
            {alertsOpen ? (
                <div className="pc-drawer-scrim" onClick={() => setAlertsOpen(false)} role="presentation">
                    <aside className="pc-drawer" onClick={(e) => e.stopPropagation()} aria-label="Notifications">
                        <header>
                            <h2>Notifications</h2>
                            <button type="button" onClick={() => setAlertsOpen(false)} aria-label="Close">
                                <X className="w-4 h-4" />
                            </button>
                        </header>
                        {state.alerts.length === 0 ? (
                            <p className="pc-muted">No alerts yet. Lease, bond and IQ tips will appear here.</p>
                        ) : (
                            <ul className="pc-alert-list">
                                {state.alerts.map((a: CompanionAlert) => (
                                    <li key={a.id}>
                                        <button type="button" className={a.read ? 'is-read' : ''} onClick={() => markAlert(a.id)}>
                                            <strong>{a.title}</strong>
                                            <span>{a.body}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>
                </div>
            ) : null}

            <div className="pc-shell">
                <RepoRateBanner variant="companion" />

                {/* Portfolio masthead — one composition */}
                <header className={`pc-pulse${mode === 'companion' ? ' is-slim' : ''}`}>
                    <div className="pc-pulse-main">
                        <div className="pc-pulse-heading">
                            <p className="pc-kicker">My Portfolio</p>
                            <button
                                type="button"
                                className="pc-bell"
                                onClick={() => setAlertsOpen(true)}
                                aria-label="Notifications"
                            >
                                <Bell className="w-4 h-4" />
                                {unread > 0 ? <em>{unread}</em> : null}
                            </button>
                        </div>
                        <h2 className="pc-title">{formatZar(kpis.value)}</h2>
                        <p className="pc-pulse-count">
                            {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}
                        </p>
                    </div>

                    <dl className="pc-pulse-metrics" aria-label="Portfolio snapshot">
                        <div>
                            <dt>Equity</dt>
                            <dd>{formatZar(kpis.equity)}</dd>
                        </div>
                        <div className={kpis.cashFlow < 0 ? 'is-down' : 'is-up'}>
                            <dt>Cash flow</dt>
                            <dd>{formatZar(kpis.cashFlow)}</dd>
                        </div>
                    </dl>

                    <div className="pc-pulse-aside">
                        <div
                            className={`pc-health-float is-${healthTone}`}
                            aria-label={`Portfolio health ${health?.score ?? 'unavailable'}`}
                        >
                            <div className="pc-health-ring" aria-hidden>
                                <svg viewBox="0 0 80 80">
                                    <circle className="pc-health-ring-track" cx="40" cy="40" r={healthRing.r} />
                                    <circle
                                        className="pc-health-ring-value"
                                        cx="40"
                                        cy="40"
                                        r={healthRing.r}
                                        strokeDasharray={healthRing.c}
                                        strokeDashoffset={health?.score == null ? healthRing.c : healthRing.offset}
                                    />
                                </svg>
                                <strong>{health?.score ?? '—'}</strong>
                            </div>
                            <div className="pc-health-copy">
                                <span>Portfolio Health</span>
                                <em>{healthLabel}</em>
                                <small>
                                    <i /> Improving
                                </small>
                            </div>
                        </div>
                        {mode !== 'companion' ? (
                            <button type="button" className="pc-btn pc-btn-primary" onClick={addProperty}>
                                <Plus className="w-4 h-4" /> Add property
                            </button>
                        ) : null}
                    </div>
                </header>

                {properties.length === 0 ? (
                    <section className="pc-empty">
                        <Building2 className="w-9 h-9" />
                        <h3>Your portfolio starts here</h3>
                        <p>Add a property you own or intend to own. Companion answers worth, debt, income, and what to do next.</p>
                        <button type="button" className="pc-btn pc-btn-primary" onClick={addProperty}>
                            <Plus className="w-4 h-4" /> Add your first property
                        </button>
                    </section>
                ) : mode === 'portfolio' ? (
                    <section className="pc-portfolio">
                        <div className="pc-prop-rail">
                            {properties.map((p) => {
                                const cf = netCashFlow(p);
                                const eq = equityOf(p);
                                const prog = mortgageProgress(p);
                                const paid = paidByPropertyId.get(p.id) ?? bondPaidToDate(p);
                                const isBond = p.purchaseFunding !== 'cash';
                                const parking = (p.garages ?? 0) + (p.openParking ?? 0);
                                const amenityIds = (p.amenities ?? []).slice(0, 4);
                                const amenityExtra = Math.max(0, (p.amenities ?? []).length - amenityIds.length);
                                return (
                                    <article key={p.id} className={`pc-prop ${p.id === active?.id ? 'is-active' : ''}`}>
                                        <div className={`pc-prop-visual${p.image ? '' : ' is-blank'}`}>
                                            {p.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={p.image} alt="" />
                                            ) : (
                                                <Building2 />
                                            )}
                                            <div className="pc-prop-visual-meta">
                                                <span>{propertyTypeLabel(p.propertyType)}</span>
                                                {paid.monthsHeld > 0 ? <span>{paid.yearsOwned} owned</span> : null}
                                            </div>
                                        </div>
                                        <div className="pc-prop-main">
                                            <header className="pc-prop-head">
                                                <div className="pc-prop-head-row">
                                                    <h3>{p.name}</h3>
                                                    <span className="pc-prop-funding">
                                                        {p.propertyType === 'self_built'
                                                            ? `${purchaseFundingLabel(p.purchaseFunding)} · build ${buildFundingLabel(p.buildFunding)}`
                                                            : purchaseFundingLabel(p.purchaseFunding)}
                                                    </span>
                                                </div>
                                                <p className="pc-prop-meta">
                                                    {p.address || p.suburb || 'Add an address'}
                                                    {paid.purchaseYear ? ` · Bought ${paid.purchaseYear}` : ''}
                                                </p>
                                                {(p.bedrooms > 0 ||
                                                    p.bathrooms > 0 ||
                                                    parking > 0 ||
                                                    p.floorSizeSqm > 0) && (
                                                    <ul className="pc-prop-specs" aria-label="Property specs">
                                                        {p.bedrooms > 0 ? (
                                                            <li>
                                                                <BedDouble aria-hidden />
                                                                <span>{p.bedrooms}</span>
                                                                <em>Beds</em>
                                                            </li>
                                                        ) : null}
                                                        {p.bathrooms > 0 ? (
                                                            <li>
                                                                <Bath aria-hidden />
                                                                <span>{p.bathrooms}</span>
                                                                <em>Baths</em>
                                                            </li>
                                                        ) : null}
                                                        {parking > 0 ? (
                                                            <li>
                                                                <Car aria-hidden />
                                                                <span>{parking}</span>
                                                                <em>Parking</em>
                                                            </li>
                                                        ) : null}
                                                        {p.floorSizeSqm > 0 ? (
                                                            <li>
                                                                <span>{Math.round(p.floorSizeSqm)}</span>
                                                                <em>m²</em>
                                                            </li>
                                                        ) : null}
                                                    </ul>
                                                )}
                                                {amenityIds.length > 0 ? (
                                                    <ul className="pc-prop-amenities" aria-label="Amenities">
                                                        {amenityIds.map((id) => (
                                                            <li key={id}>{propertyAmenityLabel(id)}</li>
                                                        ))}
                                                        {amenityExtra > 0 ? (
                                                            <li className="is-more">+{amenityExtra}</li>
                                                        ) : null}
                                                    </ul>
                                                ) : null}
                                            </header>

                                            <div className="pc-prop-hero" aria-label="Key metrics">
                                                <div>
                                                    <span>Current value</span>
                                                    <strong>{formatZar(p.currentValue)}</strong>
                                                </div>
                                                <div>
                                                    <span>Equity</span>
                                                    <strong className="is-up">{formatZar(eq)}</strong>
                                                </div>
                                                <div>
                                                    <span>Cashflow</span>
                                                    <strong className={cf >= 0 ? 'is-up' : 'is-down'}>
                                                        {`${cf >= 0 ? '+' : ''}${formatZar(cf)}`}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="pc-prop-facts">
                                                <Stat label="Purchased" value={formatZar(p.purchasePrice)} />
                                                <Stat
                                                    label="Deposit"
                                                    value={p.depositPaid > 0 ? formatZar(p.depositPaid) : '—'}
                                                />
                                                {isBond ? (
                                                    <>
                                                        <Stat label="Bond left" value={formatZar(p.outstandingBond)} />
                                                        <Stat
                                                            label="Monthly bond"
                                                            value={formatCurrency(p.monthlyBond, true, 2)}
                                                        />
                                                        <Stat
                                                            label="Principal paid"
                                                            value={formatZar(paid.principalPaid)}
                                                            tone="up"
                                                        />
                                                        <Stat label="Interest paid" value={formatZar(paid.interestPaid)} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <Stat
                                                            label="Purchase year"
                                                            value={paid.purchaseYear ? String(paid.purchaseYear) : '—'}
                                                        />
                                                        <Stat label="Years owned" value={paid.yearsOwned} />
                                                    </>
                                                )}
                                            </div>

                                            {isBond ? (
                                                <div className="pc-progress-row">
                                                    <span>Bond paid</span>
                                                    <div className="pc-bar">
                                                        <i style={{ width: `${prog}%` }} />
                                                    </div>
                                                    <strong>{Math.round(prog)}%</strong>
                                                </div>
                                            ) : null}

                                            <button
                                                type="button"
                                                className="pc-btn pc-btn-primary pc-btn-wide"
                                                onClick={() => openCompanion(p.id)}
                                            >
                                                Open Companion <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {/* Portfolio-level IQ strip */}
                        {active && topIq.length > 0 ? (
                            <div className="pc-next-panel pc-next-panel--portfolio">
                                <div className="pc-next-panel-head">
                                    <div className="pc-next-panel-brand">
                                        <span className="pc-next-panel-mark" aria-hidden>
                                            <Sparkles />
                                        </span>
                                        <div>
                                            <p className="pc-ov-kicker">Property IQ™</p>
                                            <h4>What to do next</h4>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="pc-next-panel-link"
                                        onClick={() => openCompanion(active.id, 'ai')}
                                    >
                                        See all <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="pc-next-grid pc-next-grid--3">
                                    {topIq.slice(0, 3).map((ins, i) => (
                                        <NextInsightCard
                                            key={ins.id}
                                            ins={ins}
                                            index={i}
                                            showBody
                                            onOpen={() => openCompanion(active.id, 'ai')}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </section>
                ) : view ? (
                    <section className="pc-companion">
                        <header className="pc-companion-head">
                            <button type="button" className="pc-back" onClick={backToPortfolio}>
                                <ArrowLeft className="w-4 h-4" /> Portfolio
                            </button>
                            <div className="pc-companion-title">
                                <h2>{view.name}</h2>
                                <p>
                                    {[
                                        propertyTypeLabel(view.propertyType),
                                        propertySpecsLabel(view) || null,
                                        view.address || null,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ') || 'Edit details in Overview'}
                                </p>
                            </div>
                            {editing ? (
                                <div className="pc-btn-row">
                                    <button type="button" className="pc-btn" onClick={() => { setEditing(false); setDraft(null); }}>
                                        Cancel
                                    </button>
                                    <button type="button" className="pc-btn pc-btn-primary" onClick={saveEdit}>
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <div className="pc-btn-row">
                                    <button
                                        type="button"
                                        className="pc-btn"
                                        onClick={() => {
                                            setDraft({ ...view });
                                            setEditing(true);
                                            setTab('overview');
                                        }}
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="pc-btn pc-btn-danger"
                                        onClick={() => removeProperty(view.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            )}
                        </header>

                        <nav
                            ref={(el) => {
                                tabsNavRef.current = el;
                            }}
                            className="pc-tabs"
                            aria-label="Companion tabs"
                        >
                            {TABS.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    className={tab === t.id ? 'is-active' : ''}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => selectTab(t.id)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </nav>

                        <div className="pc-stage">
                            {tab === 'overview' ? (
                                <OverviewTab
                                    view={view}
                                    editing={editing}
                                    draft={draft}
                                    updateDraft={updateDraft}
                                    replaceDraft={setDraft}
                                    onOpenBond={() => selectTab('bond')}
                                    onOpenAi={() => selectTab('ai')}
                                    insights={topIq.slice(0, 2)}
                                />
                            ) : null}

                            {tab === 'bond' ? (
                                view.purchaseFunding === 'cash' ? (
                                    <div className="pc-bond">
                                        <div className="pc-tab-empty">
                                            <div className="pc-tab-empty-icon" aria-hidden>
                                                <Wallet />
                                            </div>
                                            <p className="pc-ov-kicker">Cash purchase</p>
                                            <h3>No bond on this property</h3>
                                            <p className="pc-muted">
                                                You marked this as a cash purchase. Equity is the full current value.
                                                Switch to Bond / financed in Edit if you took out a home loan.
                                            </p>
                                        </div>
                                    </div>
                                ) : tracker && bondSim ? (
                                    <BondTab
                                        view={view}
                                        tracker={tracker}
                                        bondSim={bondSim}
                                        extra={extra}
                                        setExtra={setExtra}
                                    />
                                ) : null
                            ) : null}

                            {tab === 'rental' ? <RentalTab view={view} /> : null}
                            {tab === 'expenses' ? <ExpensesTab view={view} /> : null}
                            {tab === 'renovations' ? (
                                <RenovationsTab
                                    view={view}
                                    onChange={(renovations) => {
                                        patch((s) => ({
                                            ...s,
                                            properties: s.properties.map((p) =>
                                                p.id === view.id
                                                    ? withBondFinance({ ...p, renovations }, {})
                                                    : p
                                            ),
                                        }));
                                        if (draft?.id === view.id) {
                                            setDraft((d) =>
                                                d ? withBondFinance({ ...d, renovations }, {}) : d
                                            );
                                        }
                                    }}
                                />
                            ) : null}
                            {tab === 'spreadsheet' ? <CompanionSpreadsheet property={view} /> : null}
                            {tab === 'documents' ? (
                                <DocumentsTab view={view} chip={docChip} setChip={setDocChip} />
                            ) : null}
                            {tab === 'ai' ? (
                                <AiTab
                                    items={showAllIq ? allIq : topIq}
                                    showAll={showAllIq}
                                    onToggle={() => setShowAllIq((v) => !v)}
                                />
                            ) : null}
                            {tab === 'timeline' ? <TimelineTab view={view} /> : null}
                        </div>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function OverviewTab({
    view,
    editing,
    draft,
    updateDraft,
    replaceDraft,
    onOpenBond,
    onOpenAi,
    insights,
}: {
    view: IqProperty;
    editing: boolean;
    draft: IqProperty | null;
    updateDraft: <K extends keyof IqProperty>(key: K, value: IqProperty[K]) => void;
    replaceDraft: (p: IqProperty | null) => void;
    onOpenBond: () => void;
    onOpenAi: () => void;
    insights: ReturnType<typeof prioritisedInsights>;
}) {
    const cf = netCashFlow(view);
    const prog = mortgageProgress(view);
    const paid = bondPaidToDate(view);
    const valueEstimate = estimateCurrentValue(view);
    const growth =
        view.purchasePrice > 0
            ? ((view.currentValue - view.purchasePrice) / view.purchasePrice) * 100
            : 0;

    if (editing && draft) {
        const equity = Math.max(0, draft.currentValue - draft.outstandingBond);
        return (
            <div className="pc-edit-sheet">
                <header className="pc-edit-hero">
                    <div>
                        <p className="pc-ov-kicker">Edit property</p>
                        <h3>{draft.name || 'Untitled property'}</h3>
                        <p className="pc-muted">Essentials only — Companion tabs cover the rest.</p>
                    </div>
                    <div className="pc-edit-hero-stats">
                        <div>
                            <span>Equity</span>
                            <strong>{formatZar(equity)}</strong>
                        </div>
                        <div>
                            <span>Outstanding</span>
                            <strong>{draft.outstandingBond > 0 ? formatCurrency(draft.outstandingBond, true, 2) : '—'}</strong>
                        </div>
                        <div>
                            <span>Instalment</span>
                            <strong>{draft.monthlyBond > 0 ? formatCurrency(draft.monthlyBond, true, 2) : '—'}</strong>
                        </div>
                    </div>
                </header>

                <section className="pc-edit-section">
                    <div className="pc-edit-section-head">
                        <p className="pc-ov-kicker">Identity</p>
                        <h4>Property profile</h4>
                    </div>
                    <div className="pc-edit-identity">
                        <div className="pc-edit-grid pc-edit-grid--identity">
                            <SoftField label="Name" value={draft.name} onChange={(v) => updateDraft('name', v)} />
                            <SoftSelect
                                label="Property type"
                                value={draft.propertyType}
                                onChange={(v: PropertyType) => replaceDraft(withPropertyType(draft, v))}
                                options={PROPERTY_TYPE_OPTIONS}
                            />
                            <SoftField label="Address" value={draft.address} onChange={(v) => updateDraft('address', v)} />
                            <SuburbLocationField
                                suburb={draft.suburb}
                                city={draft.city}
                                onSelect={({ suburb, city }) =>
                                    replaceDraft(
                                        withBondFinance(
                                            {
                                                ...draft,
                                                suburb,
                                                city,
                                                currentValueMode: 'auto',
                                            },
                                            {}
                                        )
                                    )
                                }
                            />
                            {draft.city ? (
                                <SoftField
                                    label="City"
                                    value={draft.city}
                                    onChange={(v) =>
                                        replaceDraft(
                                            withBondFinance(
                                                { ...draft, city: v, currentValueMode: 'auto' },
                                                {}
                                            )
                                        )
                                    }
                                />
                            ) : null}
                        </div>
                        <PropertyImageField
                            value={draft.image}
                            onChange={(dataUrl) => {
                                replaceDraft({
                                    ...draft,
                                    image: dataUrl,
                                    images: dataUrl ? [dataUrl] : [],
                                });
                            }}
                        />
                    </div>
                </section>

                <section className="pc-edit-section">
                    <div className="pc-edit-section-head">
                        <p className="pc-ov-kicker">Features</p>
                        <h4>Property information</h4>
                        <p className="pc-muted">
                            Rooms, parking and amenities — the same detail buyers see on Property24-style listings.
                        </p>
                    </div>
                    <div className="pc-edit-grid">
                        <NumberField
                            label="Bedrooms"
                            value={draft.bedrooms}
                            onChange={(n) => updateDraft('bedrooms', n)}
                            step={1}
                        />
                        <NumberField
                            label="Bathrooms"
                            value={draft.bathrooms}
                            onChange={(n) => updateDraft('bathrooms', n)}
                            step={0.5}
                            hint="Use 0.5 for a guest toilet"
                        />
                        <NumberField
                            label="En-suites"
                            value={draft.ensuites}
                            onChange={(n) => updateDraft('ensuites', n)}
                            step={1}
                        />
                        <NumberField
                            label="Lounges / reception"
                            value={draft.lounges}
                            onChange={(n) => updateDraft('lounges', n)}
                            step={1}
                        />
                        <NumberField
                            label="Dining rooms"
                            value={draft.diningRooms}
                            onChange={(n) => updateDraft('diningRooms', n)}
                            step={1}
                        />
                        <NumberField
                            label="Studies"
                            value={draft.studies}
                            onChange={(n) => updateDraft('studies', n)}
                            step={1}
                        />
                        <NumberField
                            label="Domestic rooms"
                            value={draft.domesticRooms}
                            onChange={(n) => updateDraft('domesticRooms', n)}
                            step={1}
                        />
                        <NumberField
                            label="Store rooms"
                            value={draft.storeRooms}
                            onChange={(n) => updateDraft('storeRooms', n)}
                            step={1}
                        />
                        <NumberField
                            label="Garages"
                            value={draft.garages}
                            onChange={(n) => updateDraft('garages', n)}
                            step={1}
                        />
                        <NumberField
                            label="Open parking"
                            value={draft.openParking}
                            onChange={(n) => updateDraft('openParking', n)}
                            step={1}
                        />
                        <NumberField
                            label="Floor size (m²)"
                            value={draft.floorSizeSqm}
                            onChange={(n) => updateDraft('floorSizeSqm', n)}
                            step={1}
                        />
                        <NumberField
                            label="Land / erf (m²)"
                            value={draft.landSizeSqm}
                            onChange={(n) => updateDraft('landSizeSqm', n)}
                            step={1}
                        />
                    </div>

                    <details className="pc-amenity-block">
                        <summary className="pc-amenity-summary">
                            <div className="pc-amenity-summary-main">
                                <ChevronDown className="pc-amenity-chevron" aria-hidden />
                                <div>
                                    <strong>Amenities &amp; features</strong>
                                    <p>
                                        Optional — expand to tag outdoor, security, building, energy and lifestyle
                                        features.
                                    </p>
                                </div>
                            </div>
                            <div className="pc-amenity-block-meta">
                                <span
                                    className="pc-amenity-count"
                                    data-empty={draft.amenities.length === 0 ? 'true' : 'false'}
                                >
                                    {draft.amenities.length === 0
                                        ? 'None selected'
                                        : `${draft.amenities.length} selected`}
                                </span>
                            </div>
                        </summary>

                        <div className="pc-amenity-body">
                            <div className="pc-amenity-body-actions">
                                {draft.amenities.length > 0 ? (
                                    <button
                                        type="button"
                                        className="pc-amenity-clear"
                                        onClick={() => updateDraft('amenities', [])}
                                    >
                                        Clear all
                                    </button>
                                ) : null}
                            </div>

                            {draft.amenities.length > 0 ? (
                                <div className="pc-amenity-selected" aria-label="Selected amenities">
                                    {draft.amenities.map((id) => (
                                        <button
                                            key={id}
                                            type="button"
                                            className="pc-amenity-selected-chip"
                                            onClick={() =>
                                                updateDraft(
                                                    'amenities',
                                                    draft.amenities.filter((a) => a !== id),
                                                )
                                            }
                                            aria-label={`Remove ${propertyAmenityLabel(id)}`}
                                        >
                                            <span>{propertyAmenityLabel(id)}</span>
                                            <X aria-hidden />
                                        </button>
                                    ))}
                                </div>
                            ) : null}

                            <div className="pc-amenity-groups">
                                {AMENITY_GROUPS.map((group) => {
                                    const opts = PROPERTY_AMENITY_OPTIONS.filter((o) => o.group === group.id);
                                    const selectedInGroup = opts.filter((o) =>
                                        draft.amenities.includes(o.id),
                                    ).length;
                                    const Icon = group.Icon;
                                    return (
                                        <div key={group.id} className="pc-amenity-group">
                                            <div className="pc-amenity-group-head">
                                                <div className="pc-amenity-group-icon" aria-hidden>
                                                    <Icon />
                                                </div>
                                                <div>
                                                    <p>{group.label}</p>
                                                    <em>{group.hint}</em>
                                                </div>
                                                <span
                                                    className="pc-amenity-group-count"
                                                    data-active={selectedInGroup > 0 ? 'true' : 'false'}
                                                >
                                                    {selectedInGroup}/{opts.length}
                                                </span>
                                            </div>
                                            <div
                                                className="pc-amenity-chips"
                                                role="group"
                                                aria-label={`${group.label} amenities`}
                                            >
                                                {opts.map((opt) => {
                                                    const on = draft.amenities.includes(opt.id);
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            className={on ? 'is-active' : ''}
                                                            aria-pressed={on}
                                                            onClick={() => {
                                                                const next: PropertyAmenityId[] = on
                                                                    ? draft.amenities.filter(
                                                                          (id) => id !== opt.id,
                                                                      )
                                                                    : [...draft.amenities, opt.id];
                                                                updateDraft('amenities', next);
                                                            }}
                                                        >
                                                            <Check aria-hidden className="pc-amenity-check" />
                                                            <span>{opt.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </details>
                </section>

                <section className="pc-edit-section">
                    <div className="pc-edit-section-head">
                        <p className="pc-ov-kicker">Acquisition</p>
                        <h4>Purchase &amp; value</h4>
                    </div>
                    <div className="pc-edit-grid">
                        <div className="pc-soft-field pc-field-span">
                            <span>How was it purchased?</span>
                            <div className="pc-term-pills" role="group" aria-label="Purchase funding">
                                {PURCHASE_FUNDING_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        className={draft.purchaseFunding === opt.id ? 'is-active' : ''}
                                        onClick={() => replaceDraft(withPurchaseFunding(draft, opt.id))}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <em className="pc-field-hint">
                                {PURCHASE_FUNDING_OPTIONS.find((o) => o.id === draft.purchaseFunding)?.hint}
                            </em>
                        </div>
                        <MoneyField
                            label={
                                draft.propertyType === 'self_built' || draft.propertyType === 'vacant_land'
                                    ? 'Land purchase price'
                                    : 'Purchase price'
                            }
                            value={draft.purchasePrice}
                            onChange={(n) => replaceDraft(withBondFinance(draft, { purchasePrice: n }))}
                        />
                        {draft.propertyType === 'vacant_land' ? (
                            <div className="pc-build-prompt pc-field-span">
                                <div>
                                    <strong>Did you build on this land?</strong>
                                    <p>
                                        Vacant land is valued as the stand only. If a dwelling was built from foundation
                                        to finishes, switch to capture build spend so valuation includes land + property.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="pc-btn pc-btn-primary"
                                    onClick={() =>
                                        replaceDraft(
                                            withPropertyType(
                                                {
                                                    ...draft,
                                                    buildCostBreakdown:
                                                        draft.buildCostBreakdown || emptyBuildCostBreakdown(),
                                                },
                                                'self_built',
                                            ),
                                        )
                                    }
                                >
                                    Yes — add build costs
                                </button>
                            </div>
                        ) : null}

                        {draft.propertyType === 'self_built' ? (
                            <div className="pc-build-spend pc-field-span">
                                <div className="pc-build-spend-head">
                                    <div>
                                        <strong>How much was spent building?</strong>
                                        <p>
                                            Enter what you spent from foundation to roof to finishes. We compound that
                                            build total with the land price for the auto valuation.
                                        </p>
                                    </div>
                                    <span className="pc-build-spend-total">
                                        Total build {formatZar(totalBuildCostOf(draft))}
                                    </span>
                                </div>
                                <div className="pc-soft-field">
                                    <span>How were building costs paid?</span>
                                    <div className="pc-term-pills" role="group" aria-label="Build funding">
                                        {BUILD_FUNDING_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                className={
                                                    (draft.buildFunding || 'self') === opt.id ? 'is-active' : ''
                                                }
                                                onClick={() =>
                                                    replaceDraft(
                                                        withBuildInvestment(draft, { buildFunding: opt.id }),
                                                    )
                                                }
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <em className="pc-field-hint">
                                        {
                                            BUILD_FUNDING_OPTIONS.find(
                                                (o) => o.id === (draft.buildFunding || 'self'),
                                            )?.hint
                                        }
                                        {(draft.buildFunding || 'self') === 'loan'
                                            ? ' · Keep outstanding bond / building loan balance in the Bond section if still owing.'
                                            : ''}
                                    </em>
                                </div>
                                <div className="pc-build-spend-grid">
                                    {BUILD_COST_STAGE_OPTIONS.map((stage) => {
                                        const breakdown =
                                            draft.buildCostBreakdown || emptyBuildCostBreakdown();
                                        const value = breakdown[stage.id] || 0;
                                        return (
                                            <MoneyField
                                                key={stage.id}
                                                label={stage.label}
                                                value={value}
                                                onChange={(n) =>
                                                    replaceDraft(
                                                        withBuildInvestment(draft, {
                                                            buildCostBreakdown: { [stage.id]: n },
                                                        }),
                                                    )
                                                }
                                                hint={stage.hint}
                                            />
                                        );
                                    })}
                                    <SoftField
                                        label="Build completion date"
                                        type="date"
                                        value={draft.buildCompletionDate || ''}
                                        onChange={(v) =>
                                            replaceDraft(
                                                withBuildInvestment(draft, {
                                                    buildCompletionDate: v || null,
                                                }),
                                            )
                                        }
                                        hint="When the dwelling was finished — grows build cost from this date"
                                    />
                                </div>
                                {(() => {
                                    const buildEstimate = estimateCurrentValue({
                                        ...draft,
                                        currentValueMode: 'auto',
                                    });
                                    const spent = totalBuildCostOf(draft);
                                    return (
                                        <div className="pc-build-spend-estimate">
                                            <div>
                                                <span>Estimated dwelling value</span>
                                                <strong>
                                                    {buildEstimate.buildValue > 0
                                                        ? formatZar(buildEstimate.buildValue)
                                                        : '—'}
                                                </strong>
                                            </div>
                                            <div>
                                                <span>Land + dwelling estimate</span>
                                                <strong>
                                                    {buildEstimate.value > 0
                                                        ? formatZar(buildEstimate.value)
                                                        : '—'}
                                                </strong>
                                            </div>
                                            <em>
                                                {spent <= 0
                                                    ? 'Add foundation, structure and finishes spend to estimate the built property.'
                                                    : `Build spend ${formatZar(spent)} (${buildFundingLabel(draft.buildFunding)}) grown at ${buildEstimate.ratePct}% p.a. × condition ${buildEstimate.conditionMultiplier}, plus land ${formatZar(buildEstimate.landValue)}.`}
                                            </em>
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : null}

                        {draft.purchaseFunding === 'bond' ? (
                            <MoneyField
                                label="Deposit paid"
                                value={draft.depositPaid}
                                onChange={(n) => replaceDraft(withBondFinance(draft, { depositPaid: n }))}
                            />
                        ) : (
                            <label className="pc-soft-field pc-soft-field--computed">
                                <span>Paid in full</span>
                                <input
                                    type="text"
                                    readOnly
                                    className="pc-input-readonly"
                                    value={
                                        draft.purchasePrice > 0
                                            ? formatCurrency(draft.purchasePrice, true, 2)
                                            : ''
                                    }
                                    placeholder="Cash — no bond"
                                />
                                <em className="pc-field-hint">No deposit or bond instalment on a cash purchase</em>
                            </label>
                        )}
                        <SoftField
                            label="Purchase date"
                            type="date"
                            value={draft.purchaseDate}
                            onChange={(v) => {
                                replaceDraft(withBondFinance({ ...draft, purchaseDate: v }, { purchaseDate: v }));
                            }}
                        />
                        <div className="pc-soft-field pc-field-span">
                            <span>Property condition</span>
                            <div className="pc-term-pills" role="group" aria-label="Property condition">
                                {PROPERTY_CONDITION_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        className={draft.propertyCondition === opt.id ? 'is-active' : ''}
                                        onClick={() => replaceDraft(withPropertyCondition(draft, opt.id))}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <em className="pc-field-hint">
                                {PROPERTY_CONDITION_OPTIONS.find((o) => o.id === draft.propertyCondition)?.hint}
                                {' · '}
                                Affects the auto current-value estimate
                            </em>
                        </div>
                        <SoftField
                            label="Annual appreciation %"
                            type="number"
                            value={draft.expectedAnnualIncreasePct || ''}
                            onChange={(v) =>
                                replaceDraft(
                                    withBondFinance(
                                        {
                                            ...draft,
                                            expectedAnnualIncreasePct: Number(v) || 0,
                                            currentValueMode: 'auto',
                                        },
                                        {}
                                    )
                                )
                            }
                        />
                        {(() => {
                            const estimate = estimateCurrentValue({
                                ...draft,
                                currentValueMode: 'auto',
                            });
                            const isAuto = draft.currentValueMode !== 'manual';
                            return (
                                <label className={`pc-soft-field pc-field-span${isAuto ? ' pc-soft-field--computed' : ''}`}>
                                    <span>Current value {isAuto ? '(auto)' : '(manual)'}</span>
                                    {isAuto ? (
                                        <input
                                            type="text"
                                            readOnly
                                            className="pc-input-readonly"
                                            value={
                                                estimate.value > 0
                                                    ? formatCurrency(estimate.value, true, 2)
                                                    : ''
                                            }
                                            placeholder="Set purchase price & date"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            placeholder="0"
                                            value={
                                                draft.currentValue === 0
                                                    ? ''
                                                    : formatPriceWithCommas(draft.currentValue)
                                            }
                                            onChange={(e) => {
                                                const formatted = formatMoneyInput(e.target.value);
                                                replaceDraft(
                                                    withCurrentValueMode(
                                                        draft,
                                                        'manual',
                                                        parseMoneyInput(formatted)
                                                    )
                                                );
                                            }}
                                        />
                                    )}
                                    <em className="pc-field-hint">
                                        {isAuto
                                            ? estimate.locationMatched
                                                ? [
                                                      `Location ${estimate.locationLabel}`,
                                                      `suburb avg ${formatZar(estimate.suburbAverage)}${estimate.priceYear ? ` (${estimate.priceYear})` : ''}`,
                                                      `adjusted ${formatZar(estimate.locationAnchor)}`,
                                                      draft.purchasePrice > 0
                                                          ? `blended with purchase @ ${estimate.ratePct}% p.a.`
                                                          : null,
                                                      estimate.renovationUplift > 0
                                                          ? `+ renovations ${formatZar(estimate.renovationUplift)}`
                                                          : null,
                                                  ]
                                                      .filter(Boolean)
                                                      .join(' · ')
                                                : draft.suburb.trim()
                                                  ? `No Property24 match for “${draft.suburb}” — try another suburb spelling, or value stays purchase-based @ ${estimate.ratePct}% p.a.`
                                                  : `Select a suburb above — value must be location-based. Purchase-only fallback @ ${estimate.ratePct}% p.a.`
                                            : `Auto (location) estimate would be ${formatZar(estimate.value)}`}
                                    </em>
                                    <span className="pc-value-mode-row">
                                        {isAuto ? (
                                            <button
                                                type="button"
                                                className="pc-btn"
                                                onClick={() =>
                                                    replaceDraft(
                                                        withCurrentValueMode(
                                                            draft,
                                                            'manual',
                                                            estimate.value || draft.currentValue
                                                        )
                                                    )
                                                }
                                            >
                                                Override manually
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="pc-btn pc-btn-primary"
                                                onClick={() =>
                                                    replaceDraft(withCurrentValueMode(draft, 'auto'))
                                                }
                                            >
                                                Use auto estimate
                                            </button>
                                        )}
                                    </span>
                                </label>
                            );
                        })()}
                    </div>
                </section>

                {draft.purchaseFunding === 'bond' ? (
                <section className="pc-edit-section pc-edit-section--bond">
                    <div className="pc-edit-section-head">
                        <p className="pc-ov-kicker">Finance</p>
                        <h4>Bond details</h4>
                        <p className="pc-muted">Outstanding and instalment update from deposit, term, rate and purchase date.</p>
                    </div>
                    <div className="pc-edit-grid">
                        <MoneyField
                            label="Original bond amount"
                            value={draft.originalBondAmount}
                            onChange={(n) => replaceDraft(withBondFinance(draft, { originalBondAmount: n }))}
                        />
                        <SoftField
                            label="Interest rate %"
                            type="number"
                            value={draft.interestRate || ''}
                            onChange={(v) =>
                                replaceDraft(withBondFinance(draft, { interestRate: Number(v) || 0 }))
                            }
                        />
                        <label className="pc-soft-field pc-soft-field--computed">
                            <span>Outstanding bond</span>
                            <input
                                type="text"
                                readOnly
                                className="pc-input-readonly"
                                value={
                                    draft.outstandingBond > 0
                                        ? formatCurrency(draft.outstandingBond, true, 2)
                                        : ''
                                }
                                placeholder="Auto-calculated"
                            />
                            <em className="pc-field-hint">Purchase − deposit, SA prime path, nearest cent</em>
                        </label>
                        <label className="pc-soft-field pc-soft-field--computed">
                            <span>Monthly repayment</span>
                            <input
                                type="text"
                                readOnly
                                className="pc-input-readonly"
                                value={
                                    draft.monthlyBond > 0 ? formatCurrency(draft.monthlyBond, true, 2) : ''
                                }
                                placeholder="Auto-calculated"
                            />
                            <em className="pc-field-hint">Current instalment on remaining balance</em>
                        </label>
                        <div className="pc-soft-field pc-field-span">
                            <span>Bond repayment term</span>
                            <div className="pc-term-pills" role="group" aria-label="Bond repayment years">
                                {BOND_TERM_YEAR_OPTIONS.map((y) => (
                                    <button
                                        key={y}
                                        type="button"
                                        className={bondTermYearsOf(draft) === y ? 'is-active' : ''}
                                        onClick={() => replaceDraft(withBondTermYears(draft, y))}
                                    >
                                        {y} years
                                    </button>
                                ))}
                            </div>
                            <em className="pc-field-hint">
                                {draft.remainingTermMonths > 0
                                    ? `${Math.floor(draft.remainingTermMonths / 12)}y ${draft.remainingTermMonths % 12}m remaining from purchase date`
                                    : 'Choose 20, 25 or 30 years'}
                            </em>
                        </div>
                    </div>
                </section>
                ) : (
                <section className="pc-edit-section">
                    <div className="pc-edit-section-head">
                        <p className="pc-ov-kicker">Finance</p>
                        <h4>Cash purchase</h4>
                        <p className="pc-muted">
                            This property has no bond. Equity equals current value, and the Bond tab stays clear of
                            instalments.
                        </p>
                    </div>
                </section>
                )}

                <section className="pc-edit-section">
                    <div className="pc-edit-section-head">
                        <p className="pc-ov-kicker">Cash flow</p>
                        <h4>Income &amp; costs</h4>
                    </div>
                    <div className="pc-edit-grid">
                        <MoneyField
                            label="Monthly rental"
                            value={draft.rentalIncome}
                            onChange={(n) => updateDraft('rentalIncome', n)}
                        />
                        <MoneyField
                            label="Monthly expenses"
                            value={draft.monthlyExpenses}
                            onChange={(n) => updateDraft('monthlyExpenses', n)}
                        />
                        <MoneyField
                            label="Municipal rates / month"
                            value={draft.municipalRates}
                            onChange={(n) => updateDraft('municipalRates', n)}
                        />
                        <SoftField
                            label="Lease end"
                            type="date"
                            value={draft.leaseExpiry || ''}
                            onChange={(v) => updateDraft('leaseExpiry', v || null)}
                        />
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="pc-overview">
            <div className="pc-ov-hero">
                <div className={`pc-ov-media${view.image ? '' : ' is-blank'}`}>
                    {view.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={view.image} alt="" />
                    ) : (
                        <Building2 />
                    )}
                </div>
                <div className="pc-ov-hero-copy">
                    <p className="pc-ov-kicker">Property snapshot</p>
                    <h3>{view.name}</h3>
                    <p className="pc-muted">
                        {[
                            propertyTypeLabel(view.propertyType),
                            purchaseFundingLabel(view.purchaseFunding),
                            view.propertyType === 'self_built'
                                ? `Build ${buildFundingLabel(view.buildFunding)}`
                                : null,
                            propertyConditionLabel(view.propertyCondition),
                            propertySpecsLabel(view) || null,
                            view.address || view.suburb,
                            paid.purchaseYear ? `Bought ${paid.purchaseYear}` : null,
                            paid.monthsHeld > 0 ? `${paid.yearsOwned} owned` : null,
                        ]
                            .filter(Boolean)
                            .join(' · ') || 'Add details to personalise this view'}
                    </p>
                    {view.amenities.length > 0 ? (
                        <div className="pc-amenity-readout" aria-label="Amenities">
                            {view.amenities.slice(0, 8).map((id) => (
                                <span key={id}>{propertyAmenityLabel(id)}</span>
                            ))}
                            {view.amenities.length > 8 ? (
                                <span>+{view.amenities.length - 8} more</span>
                            ) : null}
                        </div>
                    ) : null}
                    <div className="pc-ov-hero-equity">
                        <span>Your equity</span>
                        <strong>{formatZar(equityOf(view))}</strong>
                    </div>
                </div>
            </div>

            <div className="pc-ov-primary">
                <article className="pc-ov-feature">
                    <span>Portfolio worth</span>
                    <strong>{formatZar(view.currentValue)}</strong>
                    <em>
                        {view.currentValueMode === 'manual'
                            ? 'Manual value'
                            : valueEstimate.locationMatched
                              ? `${valueEstimate.locationLabel} · Property24${valueEstimate.priceYear ? ` ${valueEstimate.priceYear}` : ''}`
                              : 'Add suburb for location-based value'}
                        {growth !== 0 ? ` · ${growth > 0 ? '+' : ''}${formatPct(growth, 0)} vs buy` : ''}
                    </em>
                </article>
                <article className="pc-ov-feature pc-ov-feature--debt">
                    <span>{view.purchaseFunding === 'cash' ? 'Bond' : 'Still owe'}</span>
                    <strong>
                        {view.purchaseFunding === 'cash' ? 'Paid cash' : formatZar(view.outstandingBond)}
                    </strong>
                    <em>
                        {view.purchaseFunding === 'cash'
                            ? 'No instalment · full equity'
                            : `${formatCurrency(view.monthlyBond, true, 2)}/mo · ${bondTermLabel(view)}`}
                    </em>
                </article>
                <article className={`pc-ov-feature ${cf >= 0 ? 'pc-ov-feature--up' : 'pc-ov-feature--down'}`}>
                    <span>Monthly cash flow</span>
                    <strong>
                        {cf >= 0 ? '+' : ''}
                        {formatZar(cf)}
                    </strong>
                    <em>
                        Rent {formatZar(view.rentalIncome)} · Costs {formatZar(view.monthlyExpenses + view.monthlyBond)}
                    </em>
                </article>
            </div>

            <button type="button" className="pc-ov-bond" onClick={onOpenBond}>
                <Ring value={view.purchaseFunding === 'cash' ? 100 : prog} size={120} label="Complete" />
                <div className="pc-ov-bond-copy">
                    <p className="pc-ov-kicker">{view.purchaseFunding === 'cash' ? 'Cash purchase' : 'Live bond'}</p>
                    <strong>
                        {view.purchaseFunding === 'cash'
                            ? 'Owned free of bond'
                            : `${Math.round(prog)}% of the bond paid`}
                    </strong>
                    <p>
                        {view.purchaseFunding === 'cash'
                            ? 'Switch to Bond / financed in Edit if you later take a home loan.'
                            : `Principal ${formatZar(paid.principalPaid)} · Interest ${formatZar(paid.interestPaid)}${paid.yearsOwned !== '—' ? ` · Owned ${paid.yearsOwned}` : ''}`}
                    </p>
                    <span className="pc-ov-bond-cta">
                        {view.purchaseFunding === 'cash' ? 'View finance' : 'Open bond tracker'}{' '}
                        <ChevronRight className="w-4 h-4" />
                    </span>
                </div>
            </button>

            <div className="pc-ov-secondary">
                <div>
                    <span>{view.purchaseFunding === 'cash' ? 'Paid in full' : 'Deposit paid'}</span>
                    <strong>
                        {view.purchaseFunding === 'cash'
                            ? view.purchasePrice > 0
                                ? formatZar(view.purchasePrice)
                                : '—'
                            : view.depositPaid > 0
                              ? formatZar(view.depositPaid)
                              : '—'}
                    </strong>
                </div>
                <div>
                    <span>Interest rate</span>
                    <strong>
                        {view.purchaseFunding === 'cash'
                            ? 'N/A'
                            : view.interestRate > 0
                              ? formatPct(view.interestRate)
                              : '—'}
                    </strong>
                </div>
                <div>
                    <span>Bond term</span>
                    <strong>{view.purchaseFunding === 'cash' ? 'Cash' : bondTermLabel(view)}</strong>
                </div>
                <div>
                    <span>Principal paid</span>
                    <strong>
                        {view.purchaseFunding === 'cash'
                            ? formatZar(view.purchasePrice)
                            : formatZar(paid.principalPaid)}
                    </strong>
                </div>
                <div>
                    <span>Interest paid</span>
                    <strong>{view.purchaseFunding === 'cash' ? formatZar(0) : formatZar(paid.interestPaid)}</strong>
                </div>
                <div>
                    <span>Growth since buy</span>
                    <strong className={growth >= 0 ? 'is-up' : 'is-down'}>
                        {view.purchasePrice > 0 ? `${growth >= 0 ? '+' : ''}${formatPct(growth, 0)}` : '—'}
                    </strong>
                </div>
            </div>

            {insights.length > 0 ? (
                <div className="pc-next-panel">
                    <div className="pc-next-panel-head">
                        <div className="pc-next-panel-brand">
                            <span className="pc-next-panel-mark" aria-hidden>
                                <Sparkles />
                            </span>
                            <div>
                                <p className="pc-ov-kicker">Property IQ™</p>
                                <h4>What to do next</h4>
                            </div>
                        </div>
                        <button type="button" className="pc-next-panel-link" onClick={onOpenAi}>
                            See all <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="pc-next-grid">
                        {insights.map((ins, i) => (
                            <NextInsightCard key={ins.id} ins={ins} index={i} showBody onOpen={onOpenAi} />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function BondTab({
    view,
    tracker,
    bondSim,
    extra,
    setExtra,
}: {
    view: IqProperty;
    tracker: ReturnType<typeof bondTracker>;
    bondSim: NonNullable<ReturnType<typeof simulateBond>>;
    extra: number;
    setExtra: (n: number) => void;
}) {
    return (
        <div className="pc-bond">
            <div className="pc-tab-hero">
                <Ring value={tracker.progress} size={148} label="Complete" />
                <div className="pc-tab-hero-copy">
                    <p className="pc-ov-kicker">Bond tracker</p>
                    <h3>{Math.round(tracker.progress)}% paid off</h3>
                    <p className="pc-muted">
                        Balance {formatZar(tracker.outstanding)}
                        {tracker.completionDate !== '—' ? ` · Finish ${tracker.completionDate}` : ''}
                    </p>
                    <div className="pc-tab-hero-stat">
                        <span>Monthly repayment</span>
                        <strong>
                            {formatCurrency(
                                bondSim.scheduled > 0 ? bondSim.scheduled : view.monthlyBond,
                                true,
                                2
                            )}
                        </strong>
                        {bondSim.rateIsAssumed ? (
                            <em className="pc-tab-hero-note">
                                Modelled at prime {formatPct(bondSim.rateUsed)} — set your rate in Edit
                            </em>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="pc-ov-primary">
                <article className="pc-ov-feature pc-ov-feature--debt">
                    <span>Still owe</span>
                    <strong>{formatZar(tracker.outstanding)}</strong>
                    <em>
                        {tracker.yearsRemaining}y {tracker.monthsRemaining}m left · {bondTermLabel(view)}
                    </em>
                </article>
                <article className="pc-ov-feature">
                    <span>Principal paid</span>
                    <strong>{formatZar(tracker.principalPaid)}</strong>
                    <em>Owned {tracker.yearsOwned}</em>
                </article>
                <article className="pc-ov-feature">
                    <span>Interest paid</span>
                    <strong>{formatZar(tracker.interestPaid)}</strong>
                    <em>Bought {tracker.purchaseYear || '—'}</em>
                </article>
            </div>

            <div className="pc-ov-secondary">
                <div>
                    <span>Purchase price</span>
                    <strong>{formatZar(view.purchasePrice)}</strong>
                </div>
                <div>
                    <span>Interest rate</span>
                    <strong>
                        {view.interestRate > 0
                            ? formatPct(view.interestRate)
                            : bondSim.rateIsAssumed
                              ? `${formatPct(bondSim.rateUsed)}*`
                              : '—'}
                    </strong>
                </div>
                <div>
                    <span>Bond term</span>
                    <strong>{bondTermLabel(view)}</strong>
                </div>
                <div>
                    <span>Expected finish</span>
                    <strong>{tracker.completionDate}</strong>
                </div>
                <div>
                    <span>Interest avoided</span>
                    <strong className="is-up">{formatZar(bondSim.interestSaved)}</strong>
                </div>
                <div>
                    <span>Time saved</span>
                    <strong className="is-up">{bondSim.durationSavedLabel}</strong>
                </div>
            </div>

            <div className="pc-sim">
                <div className="pc-sim-head">
                    <div>
                        <p className="pc-ov-kicker">What-if</p>
                        <h3>Extra monthly payment</h3>
                        <p className="pc-muted">
                            +{formatCurrency(extra, true, 0)}/mo on your{' '}
                            {formatCurrency(bondSim.scheduled, true, 2)} instalment at{' '}
                            {bondSim.rateUsed.toFixed(2)}% p.a.
                            {bondSim.rateIsAssumed ? ' (prime assumed)' : ''}
                        </p>
                    </div>
                    <div className="pc-sim-save">
                        <span>Interest avoided</span>
                        <strong>{formatZar(bondSim.interestSaved)}</strong>
                        <em className="pc-sim-save-sub">
                            {bondSim.monthsSaved > 0
                                ? `${bondSim.durationSavedLabel} sooner`
                                : 'Same payoff pace'}
                        </em>
                    </div>
                </div>
                {view.outstandingBond <= 0 ? (
                    <p className="pc-muted">
                        Add an outstanding bond balance in Edit to model extra repayments.
                    </p>
                ) : (
                    <>
                        <label className="pc-slider-wrap">
                            <span className="sr-only">Extra monthly payment (R500 to R10,000)</span>
                            <input
                                type="range"
                                min={500}
                                max={10_000}
                                step={100}
                                value={Math.min(10_000, Math.max(500, extra))}
                                onChange={(e) => setExtra(Number(e.target.value))}
                                onInput={(e) =>
                                    setExtra(Number((e.target as HTMLInputElement).value))
                                }
                                className="pc-slider"
                            />
                        </label>
                        <div className="pc-whatif-pills">
                            {WHAT_IF.map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    className={extra === amt ? 'is-active' : ''}
                                    onClick={() => setExtra(amt)}
                                >
                                    +{formatZar(amt)}
                                </button>
                            ))}
                        </div>

                        <div className="pc-whatif-facts">
                            <div>
                                <span>Interest avoided</span>
                                <strong>{formatZar(bondSim.interestSaved)}</strong>
                                <em>
                                    {formatZar(bondSim.baselineInterest)} →{' '}
                                    {formatZar(bondSim.optimizedInterest)}
                                </em>
                            </div>
                            <div>
                                <span>Settle earlier by</span>
                                <strong>{bondSim.durationSavedLabel}</strong>
                                <em>
                                    {bondSim.baselineDurationLabel} → {bondSim.optimizedDurationLabel}
                                </em>
                            </div>
                            <div>
                                <span>New payoff</span>
                                <strong>{bondSim.payoffDate}</strong>
                                <em>Was {bondSim.baselinePayoffDate}</em>
                            </div>
                            <div>
                                <span>Extra capital paid</span>
                                <strong>{formatZar(bondSim.totalExtraPaid)}</strong>
                                <em>Over the shortened term</em>
                            </div>
                        </div>

                        <div className="pc-chart pc-chart--panel">
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={bondSim.chart} key={`whatif-${extra}`}>
                                    <defs>
                                        <linearGradient
                                            id={`pcBase-${extra}`}
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient
                                            id={`pcOpt-${extra}`}
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) =>
                                            Math.abs(Number(v)) >= 1_000_000
                                                ? `${(Number(v) / 1e6).toFixed(1)}m`
                                                : `${Math.round(Number(v) / 1e3)}k`
                                        }
                                    />
                                    <Tooltip formatter={(v: number) => formatZar(v)} />
                                    <Area
                                        type="monotone"
                                        dataKey="baseline"
                                        name="Current path"
                                        stroke="#94a3b8"
                                        fill={`url(#pcBase-${extra})`}
                                        isAnimationActive={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="optimized"
                                        name={`+${formatZar(extra)}/mo`}
                                        stroke="#dc2626"
                                        fill={`url(#pcOpt-${extra})`}
                                        isAnimationActive={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="pc-bond-footer">{bondSim.assumption}</p>
                    </>
                )}
            </div>
        </div>
    );
}

function RentalTab({ view }: { view: IqProperty }) {
    const leaseDays = daysUntil(view.leaseExpiry);
    const profit = monthlyProfit(view);
    const cf = netCashFlow(view);
    const vacancy =
        view.occupancyRate >= 95 ? 'Low' : view.occupancyRate >= 85 ? 'Medium' : view.occupancyRate > 0 ? 'High' : '—';
    const chart = view.history.slice(-12).map((h) => ({
        month: h.month,
        income: h.rental,
        expenses: Math.max(0, h.rental - h.cashFlow),
    }));

    return (
        <div className="pc-rental">
            <div className="pc-tab-hero pc-tab-hero--teal">
                <div className="pc-tab-hero-icon" aria-hidden>
                    <Wallet />
                </div>
                <div className="pc-tab-hero-copy">
                    <p className="pc-ov-kicker">Rental performance</p>
                    <h3>{view.rentalIncome > 0 ? formatZar(view.rentalIncome) : 'No rent yet'}</h3>
                    <p className="pc-muted">
                        {view.tenantStatus === 'occupied'
                            ? `Occupied${leaseDays != null ? ` · lease in ${leaseDays} days` : ''}`
                            : `Status: ${view.tenantStatus}`}
                        {view.rentalIncome > 0 ? ` · Net yield ${formatPct(netYield(view))}` : ''}
                    </p>
                    <div className="pc-tab-hero-stat">
                        <span>Monthly profit</span>
                        <strong className={profit >= 0 ? 'is-up' : 'is-down'}>
                            {profit >= 0 ? '+' : ''}
                            {formatZar(profit)}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="pc-ov-primary">
                <article className="pc-ov-feature">
                    <span>Monthly rent</span>
                    <strong>{formatZar(view.rentalIncome)}</strong>
                    <em>Occupancy {view.occupancyRate > 0 ? formatPct(view.occupancyRate, 0) : '—'}</em>
                </article>
                <article className={`pc-ov-feature ${cf >= 0 ? 'pc-ov-feature--up' : 'pc-ov-feature--down'}`}>
                    <span>Cash flow</span>
                    <strong>
                        {cf >= 0 ? '+' : ''}
                        {formatZar(cf)}
                    </strong>
                    <em>After bond + expenses</em>
                </article>
                <article className="pc-ov-feature">
                    <span>Gross yield</span>
                    <strong>{formatPct(grossYield(view))}</strong>
                    <em>ROI {formatPct(roiPct(view), 0)}</em>
                </article>
            </div>

            <div className="pc-ov-secondary">
                <div>
                    <span>Lease ends</span>
                    <strong>{view.leaseExpiry || '—'}</strong>
                </div>
                <div>
                    <span>Occupancy</span>
                    <strong>{view.occupancyRate > 0 ? formatPct(view.occupancyRate, 0) : '—'}</strong>
                </div>
                <div>
                    <span>Expenses</span>
                    <strong>{formatZar(view.monthlyExpenses)}</strong>
                </div>
                <div>
                    <span>Profit</span>
                    <strong className={profit >= 0 ? 'is-up' : 'is-down'}>{formatZar(profit)}</strong>
                </div>
                <div>
                    <span>Net yield</span>
                    <strong>{formatPct(netYield(view))}</strong>
                </div>
                <div>
                    <span>Vacancy risk</span>
                    <strong>{vacancy}</strong>
                </div>
            </div>

            <div className="pc-module">
                <div className="pc-module-head">
                    <p className="pc-ov-kicker">Trend</p>
                    <h3>Income vs expenses</h3>
                </div>
                <div className="pc-chart pc-chart--panel">
                    {chart.length ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chart}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v: number) => formatZar(v)} />
                                <Bar dataKey="income" name="Income" fill="#0f766e" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="expenses" name="Expenses" fill="#c4a574" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="pc-empty-hint">Add rental history as you track months — the graph appears here.</p>
                    )}
                </div>
            </div>

            <div className="pc-ai-summary">
                <Sparkles className="w-4 h-4" />
                <div>
                    <strong>Companion note</strong>
                    <p>
                        {view.tenantStatus === 'occupied'
                            ? `Tenant occupied${leaseDays != null ? ` · lease in ${leaseDays} days` : ''}.`
                            : `Status: ${view.tenantStatus}.`}{' '}
                        Net yield {formatPct(netYield(view))}.
                        {view.rentalIncome > 0
                            ? ' Review market rent before the next escalation.'
                            : ' Add rental income to unlock yield insights.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ExpensesTab({ view }: { view: IqProperty }) {
    const rows = view.expenses.length
        ? view.expenses
        : [
              { category: 'Rates', amount: view.municipalRates, color: '#c4a574' },
              { category: 'Levies', amount: view.levies, color: '#0f766e' },
              { category: 'Insurance', amount: view.homeInsurance, color: '#6366f1' },
              { category: 'Maintenance', amount: view.maintenanceBudget, color: '#f59e0b' },
              { category: 'Utilities', amount: view.utilities, color: '#64748b' },
          ].filter((r) => r.amount > 0);
    const opTotal = rows.reduce((s, r) => s + r.amount, 0) || view.monthlyExpenses;
    const allIn = view.monthlyExpenses + view.monthlyBond;

    return (
        <div className="pc-expenses">
            <div className="pc-tab-hero">
                <div className="pc-tab-hero-icon" aria-hidden>
                    <Wallet />
                </div>
                <div className="pc-tab-hero-copy">
                    <p className="pc-ov-kicker">Monthly outgoings</p>
                    <h3>{formatZar(allIn)}</h3>
                    <p className="pc-muted">Bond + operating costs for this property</p>
                    <div className="pc-tab-hero-stat">
                        <span>Operating only</span>
                        <strong>{formatZar(view.monthlyExpenses)}</strong>
                    </div>
                </div>
            </div>

            <div className="pc-ov-primary">
                <article className="pc-ov-feature">
                    <span>Operating</span>
                    <strong>{formatZar(view.monthlyExpenses)}</strong>
                    <em>Rates, levies, insurance &amp; more</em>
                </article>
                <article className="pc-ov-feature pc-ov-feature--debt">
                    <span>Bond</span>
                    <strong>{formatCurrency(view.monthlyBond, true, 2)}</strong>
                    <em>{bondTermLabel(view)}</em>
                </article>
                <article className="pc-ov-feature">
                    <span>All-in monthly</span>
                    <strong>{formatZar(allIn)}</strong>
                    <em>Against rent {formatZar(view.rentalIncome)}</em>
                </article>
            </div>

            <div className="pc-module">
                <div className="pc-module-head">
                    <p className="pc-ov-kicker">Breakdown</p>
                    <h3>Where it goes</h3>
                </div>
                <div className="pc-expense-list">
                    {rows.length === 0 ? (
                        <p className="pc-empty-hint">No expenses yet — edit the property to add them.</p>
                    ) : (
                        rows.map((r) => {
                            const pct = opTotal > 0 ? (r.amount / opTotal) * 100 : 0;
                            return (
                                <div key={r.category} className="pc-expense-row">
                                    <i style={{ background: r.color }} />
                                    <div className="pc-expense-meta">
                                        <span>{r.category}</span>
                                        <div className="pc-expense-bar" aria-hidden>
                                            <b style={{ width: `${Math.max(4, pct)}%`, background: r.color }} />
                                        </div>
                                    </div>
                                    <strong>{formatZar(r.amount)}</strong>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

function RenovationsTab({
    view,
    onChange,
}: {
    view: IqProperty;
    onChange: (renovations: IqRenovation[]) => void;
}) {
    const [form, setForm] = useState<IqRenovation | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const editingId = form && view.renovations.some((r) => r.id === form.id) ? form.id : null;

    const totalSpent = view.renovations.reduce((s, r) => s + r.cost, 0);
    const totalAdded = view.renovations.reduce((s, r) => s + (r.actualValueAdd || r.estimatedValueAdd), 0);
    const formAdded = form ? form.actualValueAdd || form.estimatedValueAdd : 0;
    const formRoi = form && form.cost > 0 ? (formAdded / form.cost) * 100 : 0;

    function openNew(category?: RenovationCategory) {
        setFormError(null);
        setForm(
            createEmptyRenovation({
                category: category ?? 'Kitchen',
                room: category && category !== 'Other' ? category : '',
                status: 'completed',
            })
        );
    }

    function openEdit(r: IqRenovation) {
        setFormError(null);
        setForm({ ...r });
    }

    function updateForm<K extends keyof IqRenovation>(key: K, value: IqRenovation[K]) {
        setForm((prev) => {
            if (!prev) return prev;
            const next = { ...prev, [key]: value };
            if (key === 'status') {
                const status = value as RenovationStatus;
                next.progress = status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0;
            }
            if (key === 'category' && !prev.room) {
                next.room = String(value);
            }
            return next;
        });
    }

    function saveForm() {
        if (!form) return;
        if (!form.category.trim()) {
            setFormError('Choose a category for this improvement.');
            return;
        }
        if (form.cost <= 0 && formAdded <= 0) {
            setFormError('Enter what you spent or the value added.');
            return;
        }
        const photos = [form.beforeImage, form.afterImage].filter(Boolean);
        const saved: IqRenovation = {
            ...form,
            room: form.room.trim() || form.category,
            contractor: form.contractor.trim(),
            warranty: form.warranty?.trim() || '',
            notes: form.notes?.trim() || '',
            photos,
            progress:
                form.status === 'completed' ? 100 : form.status === 'in_progress' ? 50 : form.progress || 0,
        };
        const exists = view.renovations.some((r) => r.id === saved.id);
        onChange(
            exists
                ? view.renovations.map((r) => (r.id === saved.id ? saved : r))
                : [...view.renovations, saved]
        );
        setForm(null);
        setFormError(null);
    }

    function removeRenovation(id: string) {
        const target = view.renovations.find((r) => r.id === id);
        if (!target) return;
        const ok = window.confirm(`Remove “${target.room || target.category}” from renovations?`);
        if (!ok) return;
        onChange(view.renovations.filter((r) => r.id !== id));
        if (form?.id === id) {
            setForm(null);
            setFormError(null);
        }
    }

    return (
        <div className="pc-reno">
            {view.renovations.length > 0 ? (
                <div className="pc-tab-hero pc-tab-hero--gold">
                    <div className="pc-tab-hero-icon" aria-hidden>
                        <Hammer />
                    </div>
                    <div className="pc-tab-hero-copy">
                        <p className="pc-ov-kicker">Improvements</p>
                        <h3>
                            {view.renovations.length} project{view.renovations.length === 1 ? '' : 's'}
                        </h3>
                        <p className="pc-muted">
                            Spent {formatZar(totalSpent)}
                            {totalAdded > 0 ? ` · Value added ${formatZar(totalAdded)}` : ''}
                        </p>
                        <div className="pc-tab-hero-stat">
                            <span>Net value lift</span>
                            <strong className={totalAdded - totalSpent >= 0 ? 'is-up' : 'is-down'}>
                                {totalAdded - totalSpent >= 0 ? '+' : ''}
                                {formatZar(totalAdded - totalSpent)}
                            </strong>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="pc-reno-composer">
                <div className="pc-reno-composer-head">
                    <div>
                        <p className="pc-ov-kicker">Add improvement</p>
                        <h4>What have you done to this property?</h4>
                        <p className="pc-muted">
                            Pick a category and capture spend — like the Value Optimizer — then add value lift and
                            photos if you have them.
                        </p>
                    </div>
                    {!form ? (
                        <button type="button" className="pc-btn pc-btn-primary" onClick={() => openNew()}>
                            <Plus className="w-4 h-4" /> Add improvement
                        </button>
                    ) : null}
                </div>

                <div className="pc-reno-presets" role="group" aria-label="Improvement categories">
                    {RENOVATION_CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            className={form?.category === cat && !editingId ? 'is-active' : ''}
                            onClick={() => {
                                if (form && !editingId) {
                                    updateForm('category', cat);
                                    if (!form.room || RENOVATION_CATEGORIES.includes(form.room as RenovationCategory)) {
                                        updateForm('room', cat === 'Other' ? '' : cat);
                                    }
                                } else {
                                    openNew(cat);
                                }
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {form ? (
                    <div className="pc-reno-form">
                        <div className="pc-reno-form-head">
                            <strong>{editingId ? 'Edit improvement' : 'New improvement'}</strong>
                            <span>
                                {form.cost > 0 || formAdded > 0
                                    ? `${formatZar(form.cost)} spent${formAdded > 0 ? ` · ${formatZar(formAdded)} value` : ''}${form.cost > 0 && formAdded > 0 ? ` · ${formatPct(formRoi, 0)} ROI` : ''}`
                                    : 'Enter spend and value added'}
                            </span>
                        </div>
                        <div className="pc-edit-grid">
                            <SoftSelect
                                label="Category"
                                value={
                                    (RENOVATION_CATEGORIES.includes(form.category as RenovationCategory)
                                        ? form.category
                                        : 'Other') as RenovationCategory
                                }
                                onChange={(v) => updateForm('category', v)}
                                options={RENOVATION_CATEGORIES.map((id) => ({ id, label: id }))}
                            />
                            <SoftField
                                label="Room / label"
                                value={form.room}
                                onChange={(v) => updateForm('room', v)}
                            />
                            <MoneyField label="Amount spent" value={form.cost} onChange={(n) => updateForm('cost', n)} />
                            <MoneyField
                                label="Value added"
                                value={form.actualValueAdd || form.estimatedValueAdd}
                                onChange={(n) => {
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  estimatedValueAdd: n,
                                                  actualValueAdd: n,
                                              }
                                            : prev
                                    );
                                }}
                            />
                            <SoftField
                                label="Date completed"
                                type="date"
                                value={form.date}
                                onChange={(v) => updateForm('date', v)}
                            />
                            <SoftSelect
                                label="Status"
                                value={form.status}
                                onChange={(v) => updateForm('status', v)}
                                options={[
                                    { id: 'completed', label: 'Completed' },
                                    { id: 'in_progress', label: 'In progress' },
                                    { id: 'planned', label: 'Planned' },
                                ]}
                            />
                            <SoftField
                                label="Contractor"
                                value={form.contractor}
                                onChange={(v) => updateForm('contractor', v)}
                            />
                            <SoftField
                                label="Warranty"
                                value={form.warranty || ''}
                                onChange={(v) => updateForm('warranty', v)}
                            />
                            <label className="pc-soft-field pc-field-span">
                                <span>Notes</span>
                                <input
                                    type="text"
                                    value={form.notes || ''}
                                    placeholder="e.g. Quartz tops, new plumbing"
                                    onChange={(e) => updateForm('notes', e.target.value)}
                                />
                            </label>
                        </div>
                        <div className="pc-reno-photos">
                            <PropertyImageField
                                label="Before photo"
                                value={form.beforeImage}
                                onChange={(dataUrl) => updateForm('beforeImage', dataUrl)}
                            />
                            <PropertyImageField
                                label="After photo"
                                value={form.afterImage}
                                onChange={(dataUrl) => updateForm('afterImage', dataUrl)}
                            />
                        </div>
                        {formError ? <em className="pc-field-error">{formError}</em> : null}
                        <div className="pc-btn-row">
                            <button
                                type="button"
                                className="pc-btn"
                                onClick={() => {
                                    setForm(null);
                                    setFormError(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button type="button" className="pc-btn pc-btn-primary" onClick={saveForm}>
                                {editingId ? 'Save changes' : 'Add to property'}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {view.renovations.length === 0 && !form ? (
                <div className="pc-tab-empty pc-tab-empty--compact">
                    <div className="pc-tab-empty-icon" aria-hidden>
                        <Hammer />
                    </div>
                    <h3>No upgrades yet</h3>
                    <p className="pc-muted">
                        Select a category above or tap Add improvement to log kitchens, solar, security and more.
                    </p>
                </div>
            ) : null}

            {view.renovations.length > 0 ? (
                <div className="pc-reno-gallery">
                    {view.renovations.map((r) => {
                        const added = r.actualValueAdd || r.estimatedValueAdd;
                        const roi = r.cost > 0 ? (added / r.cost) * 100 : 0;
                        const img = r.afterImage || r.beforeImage;
                        return (
                            <article key={r.id} className={`pc-reno-card${form?.id === r.id ? ' is-editing' : ''}`}>
                                <div className={`pc-reno-media${img ? '' : ' is-blank'}`}>
                                    {img ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={img} alt="" />
                                    ) : (
                                        <Hammer />
                                    )}
                                    <span>{r.category}</span>
                                </div>
                                <div className="pc-reno-body">
                                    <div className="pc-reno-body-top">
                                        <h3>{r.room || r.category}</h3>
                                        <div className="pc-btn-row">
                                            <button type="button" className="pc-btn" onClick={() => openEdit(r)}>
                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="pc-btn pc-btn-danger"
                                                onClick={() => removeRenovation(r.id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="pc-ov-secondary pc-ov-secondary--tight">
                                        <div>
                                            <span>Spent</span>
                                            <strong>{formatZar(r.cost)}</strong>
                                        </div>
                                        <div>
                                            <span>Value added</span>
                                            <strong className="is-up">{formatZar(added)}</strong>
                                        </div>
                                        <div>
                                            <span>ROI</span>
                                            <strong>{formatPct(roi, 0)}</strong>
                                        </div>
                                        <div>
                                            <span>Date</span>
                                            <strong>{r.date || '—'}</strong>
                                        </div>
                                    </div>
                                    <p className="pc-muted">
                                        {r.status.replace(/_/g, ' ')}
                                        {r.contractor ? ` · ${r.contractor}` : ''}
                                        {r.warranty ? ` · ${r.warranty}` : ''}
                                        {r.notes ? ` · ${r.notes}` : ''}
                                    </p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

function DocumentsTab({
    view,
    chip,
    setChip,
}: {
    view: IqProperty;
    chip: DocCategory | 'all';
    setChip: (c: DocCategory | 'all') => void;
}) {
    const docs = view.documents.filter((d) => chip === 'all' || d.category === chip);
    return (
        <div className="pc-docs">
            <div className="pc-module-head">
                <p className="pc-ov-kicker">Vault</p>
                <h3>Property documents</h3>
                <p className="pc-muted">
                    {view.documents.length
                        ? `${view.documents.length} file${view.documents.length === 1 ? '' : 's'} on file`
                        : 'Bond, rates, insurance and lease files live here'}
                </p>
            </div>
            <div className="pc-chips">
                {DOC_CHIPS.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        className={chip === c.id ? 'is-active' : ''}
                        onClick={() => setChip(c.id)}
                    >
                        {c.label}
                    </button>
                ))}
            </div>
            <div className="pc-doc-list">
                {docs.length === 0 ? (
                    <div className="pc-tab-empty pc-tab-empty--compact">
                        <div className="pc-tab-empty-icon" aria-hidden>
                            <FileText />
                        </div>
                        <p className="pc-muted">No documents in this category yet.</p>
                    </div>
                ) : (
                    docs.map((d) => (
                        <div key={d.id} className="pc-doc-row">
                            <div className="pc-doc-icon" aria-hidden>
                                <FileText className="w-4 h-4" />
                            </div>
                            <div>
                                <strong>{d.name}</strong>
                                <span>
                                    {d.category} · {d.sizeLabel}
                                </span>
                            </div>
                            <time>{d.uploadedAt}</time>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function NextInsightCard({
    ins,
    index,
    showBody = false,
    onOpen,
}: {
    ins: ReturnType<typeof prioritisedInsights>[number];
    index?: number;
    showBody?: boolean;
    onOpen?: () => void;
}) {
    const className = `pc-next-card impact-${ins.impact}${onOpen ? ' is-action' : ''}`;
    const inner = (
        <>
            <div className="pc-next-card-accent" aria-hidden />
            <div className="pc-next-card-main">
                <div className="pc-next-card-meta">
                    {typeof index === 'number' ? (
                        <span className="pc-next-index">{String(index + 1).padStart(2, '0')}</span>
                    ) : null}
                    <em>{ins.impact} impact</em>
                    {typeof ins.confidence === 'number' ? (
                        <span className="pc-next-conf">{ins.confidence}% sure</span>
                    ) : null}
                </div>
                <strong>{ins.title}</strong>
                {showBody && ins.body ? <p>{ins.body}</p> : null}
                <div className="pc-next-metric">
                    <span>{ins.metricLabel}</span>
                    <b>{ins.metric}</b>
                </div>
            </div>
            {onOpen ? <ChevronRight className="pc-next-card-go" aria-hidden /> : null}
        </>
    );

    if (onOpen) {
        return (
            <button type="button" className={className} onClick={onOpen}>
                {inner}
            </button>
        );
    }

    return <article className={className}>{inner}</article>;
}

function AiTab({
    items,
    showAll,
    onToggle,
}: {
    items: ReturnType<typeof prioritisedInsights>;
    showAll: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="pc-ai">
            <div className="pc-next-hero">
                <div className="pc-next-hero-mark" aria-hidden>
                    <Sparkles />
                </div>
                <div>
                    <p className="pc-ov-kicker">Intelligence</p>
                    <h3>What to do next</h3>
                    <p className="pc-muted">
                        Fact-based moves from this property&apos;s numbers — maths explained, ranked by impact
                        on equity, cash flow and time. Educational only, not bank advice.
                    </p>
                </div>
            </div>
            {items.length === 0 ? (
                <div className="pc-tab-empty">
                    <div className="pc-tab-empty-icon" aria-hidden>
                        <Sparkles />
                    </div>
                    <h3>Add more detail</h3>
                    <p className="pc-muted">Bond, rent and expenses unlock Companion recommendations.</p>
                </div>
            ) : (
                <ol className="pc-next-list">
                    {items.map((ins, i) => (
                        <li key={ins.id}>
                            <NextInsightCard ins={ins} index={i} showBody />
                        </li>
                    ))}
                </ol>
            )}
            {items.length > 0 ? (
                <button type="button" className="pc-btn pc-btn-wide" onClick={onToggle}>
                    {showAll ? 'Show top recommendations' : 'See all recommendations'}
                </button>
            ) : null}
        </div>
    );
}

function TimelineTab({ view }: { view: IqProperty }) {
    const events = [...view.timeline].sort((a, b) => a.date.localeCompare(b.date));
    if (events.length === 0) {
        return (
            <div className="pc-timeline-wrap">
                <div className="pc-tab-empty">
                    <div className="pc-tab-empty-icon" aria-hidden>
                        <Calendar />
                    </div>
                    <p className="pc-ov-kicker">Story</p>
                    <h3>Timeline is empty</h3>
                    <p className="pc-muted">It fills as you buy, renovate, refinance and renew leases.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pc-timeline-wrap">
            <div className="pc-module-head">
                <p className="pc-ov-kicker">Story</p>
                <h3>Property timeline</h3>
                <p className="pc-muted">{events.length} milestones on record</p>
            </div>
            <ol className="pc-timeline-v">
                {events.map((ev) => (
                    <li key={ev.id} className={ev.predicted ? 'is-predicted' : ''}>
                        <div className="pc-timeline-dot" aria-hidden />
                        <div className="pc-timeline-card">
                            <time>{ev.date}</time>
                            <strong>{ev.title}</strong>
                            {ev.predicted ? <em>Predicted</em> : null}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}
