'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    Calendar,
    Check,
    CheckCircle2,
    Home,
    MapPin,
    Percent,
    Plus,
    Search,
    Sparkles,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
    Wrench,
    X,
} from 'lucide-react';
import {
    DEFAULT_AGENT_COMMISSION_PCT,
    DEFAULT_MARGINAL_TAX_RATE_PCT,
    CGT_PRIMARY_RESIDENCE_EXCLUSION,
    buildDefaultSellerDeductibles,
    buildSaleProceedsBreakdown,
    estimateCapitalGainsTax,
    formatZAR,
    IMPROVEMENT_TEMPLATES,
    SA_PROVINCES,
    type AcquisitionType,
    type CgtEstimate,
    type InvestmentSignal,
    type LocationInput,
    type SaleDeductible,
    type SellSuggestion,
} from '@/lib/property-optimizer';
import { PvoBadge, PvoGlassCard } from './pvo-ui';

interface SuburbSuggestion {
    suburb: string;
    municipality: string;
    province: string;
    city?: string;
    avgPropertyPrice?: number;
    priceYear?: number;
    dataQuality?: string;
    dataSource?: string;
}

interface OtherImprovement {
    id: string;
    label: string;
    spend: number;
}

interface DeductibleDraft {
    id: string;
    label: string;
    amountInput: string;
    note?: string;
    lockedLabel?: boolean;
}

const PRESET_DEDUCTIBLE_IDS = new Set([
    'rates-taxes',
    'cgt',
    'bond-cancel',
    'compliance',
    'rates-clearance',
]);

function seedDeductibleDrafts(initial?: LocationInput): DeductibleDraft[] {
    if (initial?.deductibles?.length) {
        return initial.deductibles.map((d) => ({
            id: d.id,
            label: d.label,
            amountInput: d.amount > 0 ? String(d.amount) : '',
            note: d.note,
            lockedLabel: PRESET_DEDUCTIBLE_IDS.has(d.id),
        }));
    }
    return buildDefaultSellerDeductibles({
        grossSalePrice: initial?.expectedSalePrice || initial?.purchasePrice || 2_500_000,
        bondBalance: initial?.bondBalance || 0,
        underBond: Boolean(initial?.underBond),
    }).map((d) => ({
        id: d.id,
        label: d.label,
        amountInput: d.amount > 0 ? String(d.amount) : '',
        note: d.note,
        lockedLabel: true,
    }));
}

function draftsToDeductibles(drafts: DeductibleDraft[]): SaleDeductible[] {
    return drafts
        .map((d) => ({
            id: d.id,
            label: d.label.trim() || 'Deductible',
            amount: parseMoney(d.amountInput) ?? 0,
            note: d.note,
        }))
        .filter((d) => d.label.length > 0);
}

const COMPLETED_OPTIONS = IMPROVEMENT_TEMPLATES.filter((t) =>
    [
        'kitchen',
        'bathroom',
        'solar',
        'battery',
        'electric-fence',
        'cctv',
        'fibre',
        'borehole',
        'pool',
        'entertainment',
        'flooring',
        'exterior-paint',
        'landscaping',
        'aircon',
        'roof',
        'garage-ext',
    ].includes(t.id)
);

interface PvoLocationPanelProps {
    onApply: (input: LocationInput) => void;
    initial?: LocationInput;
    sellSuggestion?: SellSuggestion | null;
    /** Persist sale price / commission tweaks from the breakdown panel */
    onSaleTermsChange?: (terms: Partial<LocationInput>) => void;
}

function parseMoney(raw: string): number | undefined {
    const cleaned = raw.replace(/[^\d.]/g, '');
    if (!cleaned) return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

function parsePercent(raw: string): number | undefined {
    const cleaned = raw.replace(/[^\d.]/g, '');
    if (!cleaned) return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 100) / 100 : undefined;
}

function StepHeader({
    step,
    icon: Icon,
    title,
    subtitle,
}: {
    step: number;
    icon: typeof MapPin;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="flex items-start gap-3.5 mb-5">
            <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/25 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gold" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-charcoal text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {step}
                </span>
            </div>
            <div className="min-w-0 pt-0.5">
                <h4 className="pvo-heading text-base sm:text-lg font-semibold tracking-tight">{title}</h4>
                <p className="pvo-muted text-sm mt-0.5 leading-snug">{subtitle}</p>
            </div>
        </div>
    );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] pvo-muted mb-1.5">
            {children}
            {required ? <span className="text-gold ml-0.5">*</span> : null}
        </label>
    );
}

export default function PvoLocationPanel({
    onApply,
    initial,
    sellSuggestion,
    onSaleTermsChange,
}: PvoLocationPanelProps) {
    const [suburb, setSuburb] = useState(initial?.suburb ?? '');
    const [municipality, setMunicipality] = useState(initial?.municipality ?? '');
    const [province, setProvince] = useState(initial?.province ?? 'Gauteng');
    const [streetAddress, setStreetAddress] = useState(initial?.streetAddress ?? '');
    const [purchasePriceInput, setPurchasePriceInput] = useState(
        initial?.purchasePrice ? String(initial.purchasePrice) : ''
    );
    const [purchaseDate, setPurchaseDate] = useState(
        initial?.purchaseDate?.slice(0, 10) ?? '2019-01-01'
    );
    const [acquisitionType, setAcquisitionType] = useState<AcquisitionType>(
        initial?.acquisitionType ?? (initial?.inherited ? 'inherited' : 'purchased')
    );
    const [underBond, setUnderBond] = useState(
        initial?.acquisitionType === 'bought_cash' ? false : Boolean(initial?.underBond)
    );
    const [bondBalanceInput, setBondBalanceInput] = useState(
        initial?.bondBalance ? String(initial.bondBalance) : ''
    );
    const [expectedSaleInput, setExpectedSaleInput] = useState(
        initial?.expectedSalePrice ? String(initial.expectedSalePrice) : ''
    );
    const [commissionMode, setCommissionMode] = useState<'percent' | 'fixed'>(
        initial?.agentCommissionAmount && initial.agentCommissionAmount > 0 ? 'fixed' : 'percent'
    );
    const [commissionPctInput, setCommissionPctInput] = useState(
        String(initial?.agentCommissionPct ?? DEFAULT_AGENT_COMMISSION_PCT)
    );
    const [commissionAmountInput, setCommissionAmountInput] = useState(
        initial?.agentCommissionAmount ? String(initial.agentCommissionAmount) : ''
    );
    const [commissionIncludesVat, setCommissionIncludesVat] = useState(
        Boolean(initial?.agentCommissionIncludesVat)
    );
    const [deductibleDrafts, setDeductibleDrafts] = useState<DeductibleDraft[]>(() =>
        seedDeductibleDrafts(initial)
    );
    const [customDeductibleLabel, setCustomDeductibleLabel] = useState('');
    const [customDeductibleAmount, setCustomDeductibleAmount] = useState('');
    const [isPrimaryResidence, setIsPrimaryResidence] = useState(
        initial?.isPrimaryResidence !== false
    );
    const [marginalTaxRateInput, setMarginalTaxRateInput] = useState(
        String(initial?.marginalTaxRatePct ?? DEFAULT_MARGINAL_TAX_RATE_PCT)
    );
    const [cgtManualOverride, setCgtManualOverride] = useState(Boolean(initial?.cgtManualOverride));
    const [completedIds, setCompletedIds] = useState<string[]>(initial?.completedImprovementIds ?? []);
    const [spendById, setSpendById] = useState<Record<string, string>>(() => {
        const seed: Record<string, string> = {};
        const fromInitial = initial?.improvementSpendById ?? {};
        for (const [id, amount] of Object.entries(fromInitial)) {
            if (amount > 0) seed[id] = String(amount);
        }
        return seed;
    });
    const [otherImprovements, setOtherImprovements] = useState<OtherImprovement[]>(
        initial?.otherImprovements ?? []
    );
    const [otherLabelDraft, setOtherLabelDraft] = useState('');
    const [otherSpendDraft, setOtherSpendDraft] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<SuburbSuggestion[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const q = suburb.trim();
        if (q.length < 2) {
            setSuggestions([]);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `/api/property-optimizer/suburbs?q=${encodeURIComponent(q)}&limit=8`,
                    { signal: controller.signal }
                );
                if (!res.ok) return;
                const data = await res.json();
                setSuggestions(data.results ?? []);
            } catch {
                /* aborted or network */
            } finally {
                setSearching(false);
            }
        }, 280);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [suburb]);

    const visibleSuggestions = useMemo(() => suggestions.slice(0, 8), [suggestions]);
    const parsedPrice = parseMoney(purchasePriceInput);
    const parsedBondBalance = parseMoney(bondBalanceInput);
    const parsedExpectedSale = parseMoney(expectedSaleInput);
    const parsedCommissionAmount = parseMoney(commissionAmountInput);
    const parsedMarginalTaxRate = parsePercent(marginalTaxRateInput);

    const improvementSpendById = useMemo(() => {
        const out: Record<string, number> = {};
        for (const id of completedIds) {
            const amount = parseMoney(spendById[id] ?? '');
            if (amount) out[id] = amount;
        }
        return out;
    }, [completedIds, spendById]);

    const renovationSpendTotal = useMemo(() => {
        const fromCards = Object.values(improvementSpendById).reduce((s, n) => s + n, 0);
        const fromOther = otherImprovements.reduce((s, o) => s + (o.spend > 0 ? o.spend : 0), 0);
        return fromCards + fromOther;
    }, [improvementSpendById, otherImprovements]);

    const liveCgtPreview = useMemo(() => {
        const sale =
            parsedExpectedSale ||
            sellSuggestion?.suggestedSellPrice ||
            parsedPrice ||
            2_500_000;
        const noPurchase =
            acquisitionType === 'inherited' || acquisitionType === 'family_home';
        const baseAssumed = noPurchase && !parsedPrice;
        const baseCost =
            (parsedPrice || (baseAssumed ? Math.round(sale * 0.55) : 0)) + renovationSpendTotal;

        let agent = 0;
        if (commissionMode === 'fixed') {
            agent = parsedCommissionAmount ?? 0;
        } else {
            const pct = parsePercent(commissionPctInput) ?? DEFAULT_AGENT_COMMISSION_PCT;
            const exVat = Math.round(sale * (pct / 100));
            agent = commissionIncludesVat ? exVat : exVat + Math.round(exVat * 0.15);
        }
        const otherFees = deductibleDrafts
            .filter((d) => d.id !== 'cgt' && d.id !== 'rates-taxes')
            .reduce((sum, d) => sum + (parseMoney(d.amountInput) ?? 0), 0);

        return estimateCapitalGainsTax({
            salePrice: sale,
            baseCost,
            baseCostAssumed: baseAssumed,
            sellingCosts: agent + otherFees,
            isPrimaryResidence,
            marginalTaxRatePct: parsedMarginalTaxRate ?? DEFAULT_MARGINAL_TAX_RATE_PCT,
        });
    }, [
        parsedExpectedSale,
        sellSuggestion?.suggestedSellPrice,
        parsedPrice,
        acquisitionType,
        renovationSpendTotal,
        commissionMode,
        parsedCommissionAmount,
        commissionPctInput,
        commissionIncludesVat,
        deductibleDrafts,
        isPrimaryResidence,
        parsedMarginalTaxRate,
    ]);

    // Keep auto CGT row in sync unless manually overridden
    useEffect(() => {
        if (cgtManualOverride) return;
        const nextAmount =
            liveCgtPreview.estimatedCgt > 0 ? String(liveCgtPreview.estimatedCgt) : '';
        const nextNote = liveCgtPreview.isPrimaryResidence
            ? `Auto SARS estimate · primary residence exclusion up to ${formatZAR(CGT_PRIMARY_RESIDENCE_EXCLUSION)}`
            : 'Auto SARS estimate · no primary residence exclusion';
        setDeductibleDrafts((prev) => {
            const cur = prev.find((d) => d.id === 'cgt');
            if (cur && cur.amountInput === nextAmount && cur.note === nextNote) return prev;
            return prev.map((d) =>
                d.id === 'cgt' ? { ...d, amountInput: nextAmount, note: nextNote } : d
            );
        });
    }, [liveCgtPreview, cgtManualOverride]);

    const toggleCompleted = (id: string) => {
        setCompletedIds((prev) => {
            if (prev.includes(id)) {
                setSpendById((spends) => {
                    const next = { ...spends };
                    delete next[id];
                    return next;
                });
                return prev.filter((x) => x !== id);
            }
            return [...prev, id];
        });
    };

    const setCardSpend = (id: string, raw: string) => {
        setSpendById((prev) => ({ ...prev, [id]: raw }));
        setCompletedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const addOtherImprovement = () => {
        const label = otherLabelDraft.trim();
        if (!label) {
            setError('Enter a description for the other improvement.');
            return;
        }
        const spend = parseMoney(otherSpendDraft) ?? 0;
        setOtherImprovements((prev) => [
            ...prev,
            { id: `other-${Date.now()}`, label, spend },
        ]);
        setOtherLabelDraft('');
        setOtherSpendDraft('');
        setError('');
    };

    const removeOtherImprovement = (id: string) => {
        setOtherImprovements((prev) => prev.filter((o) => o.id !== id));
    };

    const noPurchaseRequired =
        acquisitionType === 'inherited' || acquisitionType === 'family_home';
    const isBoughtCash = acquisitionType === 'bought_cash';
    const showBondFields = !isBoughtCash;

    const selectAcquisition = (type: AcquisitionType) => {
        // Toggle special types off → back to standard financed/cash purchase path
        if (acquisitionType === type && type !== 'purchased') {
            setAcquisitionType('purchased');
            return;
        }
        setAcquisitionType(type);
        if (type === 'bought_cash') {
            setUnderBond(false);
            setBondBalanceInput('');
        }
    };

    const handleApply = () => {
        if (!suburb.trim()) {
            setError('Enter a suburb so we can use local market appreciation.');
            return;
        }
        const purchasePrice = parseMoney(purchasePriceInput);
        if (!noPurchaseRequired && !purchasePrice) {
            setError(
                isBoughtCash
                    ? 'Enter what you paid in cash for the property.'
                    : 'Enter what you paid for the property, or choose Inherited / Family home.'
            );
            return;
        }
        if (!purchaseDate) {
            setError(
                acquisitionType === 'inherited'
                    ? 'Enter the date you inherited the property.'
                    : acquisitionType === 'family_home'
                      ? 'Enter when the family home became yours.'
                      : 'Enter the purchase date.'
            );
            return;
        }
        if (showBondFields && underBond && !parseMoney(bondBalanceInput)) {
            setError('Enter how much is still outstanding on the bond.');
            return;
        }
        if (commissionMode === 'percent') {
            const pct = parsePercent(commissionPctInput);
            if (pct === undefined) {
                setError('Enter the agent commission percentage (e.g. 6.5).');
                return;
            }
        } else if (!parseMoney(commissionAmountInput)) {
            setError('Enter the fixed agent commission amount in rand.');
            return;
        }
        setError('');
        onApply({
            suburb: suburb.trim(),
            municipality: municipality.trim(),
            province,
            streetAddress: streetAddress.trim(),
            purchasePrice: purchasePrice ?? 0,
            purchaseDate,
            completedImprovementIds: completedIds,
            improvementSpendById,
            otherImprovements,
            renovationSpend: renovationSpendTotal > 0 ? renovationSpendTotal : undefined,
            otherImprovementsNote:
                otherImprovements.map((o) => o.label).join('; ') || undefined,
            acquisitionType,
            inherited: noPurchaseRequired,
            underBond: isBoughtCash ? false : underBond,
            bondBalance: isBoughtCash || !underBond ? 0 : parseMoney(bondBalanceInput),
            expectedSalePrice: parseMoney(expectedSaleInput),
            agentCommissionPct:
                commissionMode === 'percent'
                    ? parsePercent(commissionPctInput) ?? DEFAULT_AGENT_COMMISSION_PCT
                    : undefined,
            agentCommissionAmount:
                commissionMode === 'fixed' ? parseMoney(commissionAmountInput) : undefined,
            agentCommissionIncludesVat:
                commissionMode === 'percent' ? commissionIncludesVat : undefined,
            deductibles: draftsToDeductibles(deductibleDrafts),
            isPrimaryResidence,
            marginalTaxRatePct: parsePercent(marginalTaxRateInput) ?? DEFAULT_MARGINAL_TAX_RATE_PCT,
            cgtManualOverride,
        });
    };

    const pickSuggestion = (s: SuburbSuggestion) => {
        setSuburb(s.suburb);
        setMunicipality(s.municipality);
        setProvince(s.province);
        setShowSuggestions(false);
    };

    const clearAllImprovements = () => {
        setCompletedIds([]);
        setSpendById({});
        setOtherImprovements([]);
    };

    return (
        <PvoGlassCard className="overflow-hidden mb-8 pvo-details-shell" glow>
            <div className="relative px-6 sm:px-8 pt-7 sm:pt-8 pb-6 border-b border-charcoal/[0.06]">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.55]"
                    style={{
                        background:
                            'radial-gradient(ellipse 80% 120% at 0% 0%, rgba(201,162,39,0.14), transparent 55%), radial-gradient(ellipse 60% 80% at 100% 0%, rgba(0,77,64,0.06), transparent 50%)',
                    }}
                />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/80 border border-gold/20 shadow-sm flex items-center justify-center shrink-0">
                        <Home className="w-7 h-7 text-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <PvoBadge tone="gold">Start here</PvoBadge>
                        <h3 className="pvo-heading text-2xl sm:text-[1.65rem] font-semibold tracking-tight mt-2">
                            Property details
                        </h3>
                        <p className="pvo-muted text-sm sm:text-[15px] mt-1.5 max-w-xl leading-relaxed">
                            Location, what you paid, and upgrades already done — we estimate a sell price with
                            compound growth and suburb data.
                        </p>
                    </div>
                    {(completedIds.length > 0 || otherImprovements.length > 0) && (
                        <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
                            <span className="text-[11px] uppercase tracking-wider pvo-muted font-semibold">
                                Reno total
                            </span>
                            <span className="text-2xl font-bold text-gold tabular-nums mt-0.5">
                                {renovationSpendTotal > 0 ? formatZAR(renovationSpendTotal) : '—'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 sm:px-8 py-7 sm:py-8 space-y-6">
                <section className="pvo-details-step rounded-2xl p-5 sm:p-6">
                    <StepHeader
                        step={1}
                        icon={MapPin}
                        title="Property location"
                        subtitle="Search any South African suburb to anchor local appreciation rates."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative md:col-span-2">
                            <FieldLabel required>Suburb</FieldLabel>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pvo-muted pointer-events-none" />
                                <input
                                    value={suburb}
                                    onChange={(e) => {
                                        setSuburb(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                    placeholder="e.g. Bryanston, Sea Point, Umhlanga"
                                    className="pvo-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium"
                                />
                            </div>
                            {showSuggestions && visibleSuggestions.length > 0 && (
                                <ul className="absolute z-20 mt-2 w-full rounded-2xl border border-charcoal/10 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden max-h-72 overflow-y-auto">
                                    {visibleSuggestions.map((s) => (
                                        <li key={`${s.suburb}-${s.city ?? s.municipality}-${s.province}`}>
                                            <button
                                                type="button"
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-gold/[0.06] transition border-b border-charcoal/[0.04] last:border-0"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => pickSuggestion(s)}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <span className="font-semibold pvo-heading">{s.suburb}</span>
                                                        <span className="block text-xs pvo-muted mt-0.5">
                                                            {s.city ?? s.municipality}, {s.province}
                                                        </span>
                                                    </div>
                                                    {s.avgPropertyPrice ? (
                                                        <span className="text-xs font-semibold text-gold tabular-nums shrink-0">
                                                            {formatZAR(s.avgPropertyPrice)}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {searching && suburb.trim().length >= 2 && (
                                <p className="text-xs pvo-muted mt-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                    Searching suburbs…
                                </p>
                            )}
                        </div>

                        <div>
                            <FieldLabel>Street address</FieldLabel>
                            <input
                                value={streetAddress}
                                onChange={(e) => setStreetAddress(e.target.value)}
                                placeholder="Optional — e.g. 42 Jacaranda Crescent"
                                className="pvo-input w-full px-4 py-3.5 rounded-xl text-sm"
                            />
                        </div>

                        <div>
                            <FieldLabel>Municipality / city</FieldLabel>
                            <input
                                value={municipality}
                                onChange={(e) => setMunicipality(e.target.value)}
                                placeholder="e.g. Sandton, City of Cape Town"
                                className="pvo-input w-full px-4 py-3.5 rounded-xl text-sm"
                            />
                        </div>

                        <div className="md:col-span-2 md:max-w-sm">
                            <FieldLabel>Province</FieldLabel>
                            <select
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                className="pvo-input w-full px-4 py-3.5 rounded-xl text-sm appearance-none cursor-pointer"
                            >
                                {SA_PROVINCES.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="pvo-details-step rounded-2xl p-5 sm:p-6">
                    <StepHeader
                        step={2}
                        icon={Wallet}
                        title="Ownership & purchase"
                        subtitle="How you acquired the property, what you paid, and any bond still outstanding."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                        <ToggleCard
                            active={acquisitionType === 'bought_cash'}
                            title="Bought cash"
                            description="Paid in full — no bond outstanding."
                            onClick={() => selectAcquisition('bought_cash')}
                        />
                        <ToggleCard
                            active={acquisitionType === 'inherited'}
                            title="Inherited"
                            description="Received via inheritance — purchase price optional."
                            onClick={() => selectAcquisition('inherited')}
                        />
                        <ToggleCard
                            active={acquisitionType === 'family_home'}
                            title="Family home"
                            description="Generational / family home — purchase price optional."
                            onClick={() => selectAcquisition('family_home')}
                        />
                    </div>
                    {acquisitionType === 'purchased' && (
                        <p className="text-xs pvo-muted mb-5 -mt-2 leading-relaxed">
                            Standard purchase — enter what you paid below. Turn on Under bond if there is still a
                            mortgage to settle.
                        </p>
                    )}
                    {showBondFields && (
                        <div className="mb-5">
                            <ToggleCard
                                active={underBond}
                                title="Under bond"
                                description="There is still a mortgage / bond to pay off."
                                onClick={() => {
                                    setUnderBond((v) => {
                                        if (v) setBondBalanceInput('');
                                        return !v;
                                    });
                                }}
                            />
                        </div>
                    )}
                    {isBoughtCash && (
                        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5 mb-5">
                            Bought cash — bond balance is treated as R0 when calculating what you stand to gain.
                        </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel required={!noPurchaseRequired}>
                                {noPurchaseRequired
                                    ? acquisitionType === 'family_home'
                                        ? 'Known value when it became yours (optional)'
                                        : 'Value when inherited (optional)'
                                    : isBoughtCash
                                      ? 'Cash purchase price'
                                      : 'Purchase price'}
                            </FieldLabel>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gold pointer-events-none">
                                    R
                                </span>
                                <input
                                    value={purchasePriceInput}
                                    onChange={(e) => setPurchasePriceInput(e.target.value)}
                                    inputMode="numeric"
                                    placeholder={noPurchaseRequired ? 'Optional' : '2 950 000'}
                                    className="pvo-input w-full pl-9 pr-4 py-3.5 rounded-xl text-sm font-semibold tabular-nums"
                                />
                            </div>
                            {parsedPrice ? (
                                <p className="text-xs font-medium text-gold/90 mt-2 tabular-nums">
                                    {formatZAR(parsedPrice)}
                                </p>
                            ) : (
                                <p className="text-xs pvo-muted mt-2">
                                    {noPurchaseRequired
                                        ? 'Leave blank if you had no purchase cost.'
                                        : 'Enter the amount you paid (ZAR).'}
                                </p>
                            )}
                        </div>
                        <div>
                            <FieldLabel required>
                                {acquisitionType === 'inherited'
                                    ? 'Inheritance date'
                                    : acquisitionType === 'family_home'
                                      ? 'Owned since'
                                      : 'Purchase date'}
                            </FieldLabel>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pvo-muted pointer-events-none" />
                                <input
                                    type="date"
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                    className="pvo-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                                />
                            </div>
                            <p className="text-xs pvo-muted mt-2">
                                Compound growth runs from this date to today.
                            </p>
                        </div>
                        {showBondFields && underBond && (
                            <div className="md:col-span-2 md:max-w-md">
                                <FieldLabel required>Remaining on the bond</FieldLabel>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gold pointer-events-none">
                                        R
                                    </span>
                                    <input
                                        value={bondBalanceInput}
                                        onChange={(e) => setBondBalanceInput(e.target.value)}
                                        inputMode="numeric"
                                        placeholder="e.g. 1 200 000"
                                        className="pvo-input w-full pl-9 pr-4 py-3.5 rounded-xl text-sm font-semibold tabular-nums"
                                    />
                                </div>
                                {parsedBondBalance ? (
                                    <p className="text-xs font-medium text-gold/90 mt-2 tabular-nums">
                                        {formatZAR(parsedBondBalance)} still to pay
                                    </p>
                                ) : (
                                    <p className="text-xs pvo-muted mt-2">
                                        Outstanding balance used to calculate what you stand to gain.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <section className="pvo-details-step rounded-2xl p-5 sm:p-6">
                    <StepHeader
                        step={3}
                        icon={Wrench}
                        title="Improvements already made"
                        subtitle="Select each upgrade and enter roughly what you spent — totals are calculated automatically."
                    />
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <p className="text-xs pvo-muted">
                            {completedIds.length === 0 && otherImprovements.length === 0
                                ? 'None selected yet'
                                : `${completedIds.length + otherImprovements.length} item${
                                      completedIds.length + otherImprovements.length === 1 ? '' : 's'
                                  } · total ${
                                      renovationSpendTotal > 0 ? formatZAR(renovationSpendTotal) : 'R0'
                                  }`}
                        </p>
                        {(completedIds.length > 0 || otherImprovements.length > 0) && (
                            <button
                                type="button"
                                onClick={clearAllImprovements}
                                className="text-xs font-semibold text-gold hover:underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {COMPLETED_OPTIONS.map((opt) => {
                            const on = completedIds.includes(opt.id);
                            const spendRaw = spendById[opt.id] ?? '';
                            const spendParsed = parseMoney(spendRaw);
                            return (
                                <div
                                    key={opt.id}
                                    className={`rounded-xl border transition-all duration-200 p-3.5 ${
                                        on
                                            ? 'border-gold/45 bg-gold/[0.12] shadow-[0_0_0_1px_rgba(201,162,39,0.15)]'
                                            : 'border-charcoal/[0.08] bg-white/50 hover:border-charcoal/20'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleCompleted(opt.id)}
                                        aria-pressed={on}
                                        className="w-full text-left"
                                    >
                                        <span className="inline-flex items-start gap-2.5">
                                            <span
                                                className={`mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                                    on
                                                        ? 'bg-gold border-gold text-white'
                                                        : 'border-charcoal/20 bg-white'
                                                }`}
                                                style={{ width: 18, height: 18 }}
                                            >
                                                {on ? <Check className="w-3 h-3" strokeWidth={3} /> : null}
                                            </span>
                                            <span
                                                className={`text-sm leading-snug ${
                                                    on ? 'pvo-heading font-semibold' : 'pvo-muted'
                                                }`}
                                            >
                                                {opt.name}
                                            </span>
                                        </span>
                                    </button>
                                    <div className="mt-3 pl-[26px]">
                                        <label className="block text-[10px] uppercase tracking-wider pvo-muted font-semibold mb-1">
                                            Rough amount spent
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gold pointer-events-none">
                                                R
                                            </span>
                                            <input
                                                value={spendRaw}
                                                onChange={(e) => setCardSpend(opt.id, e.target.value)}
                                                onFocus={() => {
                                                    if (!completedIds.includes(opt.id)) {
                                                        setCompletedIds((prev) => [...prev, opt.id]);
                                                    }
                                                }}
                                                inputMode="numeric"
                                                placeholder="0"
                                                className="pvo-input w-full pl-7 pr-2 py-2 rounded-lg text-sm font-semibold tabular-nums"
                                            />
                                        </div>
                                        {spendParsed ? (
                                            <p className="text-[10px] text-gold/90 mt-1 tabular-nums">
                                                {formatZAR(spendParsed)}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-5 pt-5 border-t border-charcoal/[0.06]">
                        <FieldLabel>Other improvements</FieldLabel>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <input
                                value={otherLabelDraft}
                                onChange={(e) => setOtherLabelDraft(e.target.value)}
                                placeholder="e.g. New roof tiles, staff bathroom reno"
                                className="pvo-input flex-1 px-4 py-3 rounded-xl text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addOtherImprovement();
                                    }
                                }}
                            />
                            <div className="relative sm:w-40">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gold pointer-events-none">
                                    R
                                </span>
                                <input
                                    value={otherSpendDraft}
                                    onChange={(e) => setOtherSpendDraft(e.target.value)}
                                    inputMode="numeric"
                                    placeholder="Spend"
                                    className="pvo-input w-full pl-8 pr-3 py-3 rounded-xl text-sm font-semibold tabular-nums"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addOtherImprovement();
                                        }
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addOtherImprovement}
                                className="pvo-primary-btn inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </div>

                        {otherImprovements.length > 0 && (
                            <ul className="mt-3 space-y-2">
                                {otherImprovements.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-charcoal/[0.08] bg-white/60 px-3.5 py-2.5"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium pvo-heading truncate">{item.label}</p>
                                            <p className="text-xs text-gold tabular-nums mt-0.5">
                                                {item.spend > 0 ? formatZAR(item.spend) : 'No spend entered'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeOtherImprovement(item.id)}
                                            className="p-2 rounded-lg text-charcoal/40 hover:text-red-600 hover:bg-red-50 transition"
                                            aria-label={`Remove ${item.label}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {renovationSpendTotal > 0 && (
                        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-3">
                            <span className="text-sm font-medium pvo-heading">Total renovation spend</span>
                            <span className="text-lg font-bold text-gold tabular-nums">
                                {formatZAR(renovationSpendTotal)}
                            </span>
                        </div>
                    )}
                </section>

                <section className="pvo-details-step rounded-2xl p-5 sm:p-6">
                    <StepHeader
                        step={4}
                        icon={Percent}
                        title="Sale, fees & deductibles"
                        subtitle="Set sale price, agent commission, rates/taxes owed and any other amounts to deduct."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div>
                            <FieldLabel>Target / expected sale price (optional)</FieldLabel>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gold pointer-events-none">
                                    R
                                </span>
                                <input
                                    value={expectedSaleInput}
                                    onChange={(e) => setExpectedSaleInput(e.target.value)}
                                    inputMode="numeric"
                                    placeholder="Leave blank to use estimate"
                                    className="pvo-input w-full pl-9 pr-4 py-3.5 rounded-xl text-sm font-semibold tabular-nums"
                                />
                            </div>
                            {parsedExpectedSale ? (
                                <p className="text-xs font-medium text-gold/90 mt-2 tabular-nums">
                                    {formatZAR(parsedExpectedSale)} used for deductions
                                </p>
                            ) : (
                                <p className="text-xs pvo-muted mt-2">
                                    Blank = use the model’s suggested selling price.
                                </p>
                            )}
                        </div>
                        <div>
                            <FieldLabel>Commission type</FieldLabel>
                            <div className="grid grid-cols-2 gap-2">
                                <ToggleCard
                                    active={commissionMode === 'percent'}
                                    title="Percentage"
                                    description="e.g. 6.5% + VAT"
                                    onClick={() => setCommissionMode('percent')}
                                />
                                <ToggleCard
                                    active={commissionMode === 'fixed'}
                                    title="Fixed amount"
                                    description="Total R to the agent"
                                    onClick={() => setCommissionMode('fixed')}
                                />
                            </div>
                        </div>
                    </div>

                    {commissionMode === 'percent' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <FieldLabel required>Agent commission %</FieldLabel>
                                <div className="relative">
                                    <input
                                        value={commissionPctInput}
                                        onChange={(e) => setCommissionPctInput(e.target.value)}
                                        inputMode="decimal"
                                        placeholder="6.5"
                                        className="pvo-input w-full pl-4 pr-10 py-3.5 rounded-xl text-sm font-semibold tabular-nums"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gold pointer-events-none">
                                        %
                                    </span>
                                </div>
                                <p className="text-xs pvo-muted mt-2">
                                    Typical SA range 5–7.5%. Default {DEFAULT_AGENT_COMMISSION_PCT}%.
                                </p>
                            </div>
                            <div className="flex flex-col justify-end">
                                <ToggleCard
                                    active={commissionIncludesVat}
                                    title="Rate already includes VAT"
                                    description="Turn on if your mandate % is all-in. Off = add 15% VAT."
                                    onClick={() => setCommissionIncludesVat((v) => !v)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="md:max-w-md">
                            <FieldLabel required>Fixed commission to agent</FieldLabel>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gold pointer-events-none">
                                    R
                                </span>
                                <input
                                    value={commissionAmountInput}
                                    onChange={(e) => setCommissionAmountInput(e.target.value)}
                                    inputMode="numeric"
                                    placeholder="e.g. 250 000"
                                    className="pvo-input w-full pl-9 pr-4 py-3.5 rounded-xl text-sm font-semibold tabular-nums"
                                />
                            </div>
                            {parsedCommissionAmount ? (
                                <p className="text-xs font-medium text-gold/90 mt-2 tabular-nums">
                                    {formatZAR(parsedCommissionAmount)}
                                    {parsedExpectedSale
                                        ? ` · ~${Math.round((parsedCommissionAmount / parsedExpectedSale) * 1000) / 10}% of sale`
                                        : ''}
                                </p>
                            ) : (
                                <p className="text-xs pvo-muted mt-2">
                                    Enter the total amount the agent will receive under your mandate.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="mt-6 pt-5 border-t border-charcoal/[0.06]">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
                            <div>
                                <p className="text-sm font-semibold pvo-heading">Deductibles</p>
                                <p className="text-xs pvo-muted mt-0.5">
                                    Rates owed, SARS CGT (auto), clearance fees — add every amount that comes off
                                    the sale
                                </p>
                            </div>
                            <p className="text-xs font-semibold text-gold tabular-nums">
                                Total deductibles{' '}
                                {formatZAR(
                                    deductibleDrafts.reduce(
                                        (sum, d) => sum + (parseMoney(d.amountInput) ?? 0),
                                        0
                                    )
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <ToggleCard
                                active={isPrimaryResidence}
                                title="Primary residence"
                                description={`Uses R${(CGT_PRIMARY_RESIDENCE_EXCLUSION / 1_000_000).toFixed(0)}m CGT exclusion (from Mar 2026)`}
                                onClick={() => setIsPrimaryResidence((v) => !v)}
                            />
                            <div>
                                <FieldLabel>Your marginal tax rate</FieldLabel>
                                <div className="relative">
                                    <input
                                        value={marginalTaxRateInput}
                                        onChange={(e) => setMarginalTaxRateInput(e.target.value)}
                                        inputMode="decimal"
                                        placeholder="45"
                                        className="pvo-input w-full pl-4 pr-10 py-3 rounded-xl text-sm font-semibold tabular-nums"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gold">
                                        %
                                    </span>
                                </div>
                                <p className="text-[11px] pvo-muted mt-1.5">
                                    Used for SARS CGT. Max bracket is 45% (effective CGT up to ~18%).
                                </p>
                            </div>
                        </div>

                        <div className="mb-4 rounded-xl border border-sky-200/80 bg-sky-50/80 px-4 py-3">
                            <p className="text-sm font-semibold text-sky-950">
                                SARS CGT estimate:{' '}
                                <span className="tabular-nums">{formatZAR(liveCgtPreview.estimatedCgt)}</span>
                            </p>
                            <p className="text-[11px] text-sky-900/75 mt-1 leading-relaxed">
                                Gain {formatZAR(liveCgtPreview.capitalGain)}
                                {liveCgtPreview.isPrimaryResidence
                                    ? ` − primary exclusion ${formatZAR(liveCgtPreview.primaryResidenceExclusionApplied)}`
                                    : ''}
                                {liveCgtPreview.annualExclusion > 0
                                    ? ` − annual exclusion ${formatZAR(liveCgtPreview.annualExclusion)}`
                                    : ''}
                                {' → '}
                                {liveCgtPreview.inclusionRatePct}% inclusion × {liveCgtPreview.marginalTaxRatePct}%
                                tax.
                                {liveCgtPreview.baseCostAssumed
                                    ? ' Base cost assumed (enter inheritance/family value for accuracy).'
                                    : ''}
                            </p>
                            <label className="mt-2 inline-flex items-center gap-2 text-xs text-sky-950/80 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={cgtManualOverride}
                                    onChange={(e) => setCgtManualOverride(e.target.checked)}
                                    className="rounded border-charcoal/20"
                                />
                                Enter CGT manually instead
                            </label>
                        </div>

                        <ul className="space-y-2.5">
                            {deductibleDrafts.map((row) => {
                                const isCgt = row.id === 'cgt';
                                const lockedAmount = isCgt && !cgtManualOverride;
                                return (
                                <li
                                    key={row.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-charcoal/[0.08] bg-white/60 px-3 py-2.5"
                                >
                                    <div className="flex-1 min-w-0">
                                        {row.lockedLabel ? (
                                            <p className="text-sm font-medium pvo-heading">{row.label}</p>
                                        ) : (
                                            <input
                                                value={row.label}
                                                onChange={(e) =>
                                                    setDeductibleDrafts((prev) =>
                                                        prev.map((d) =>
                                                            d.id === row.id
                                                                ? { ...d, label: e.target.value }
                                                                : d
                                                        )
                                                    )
                                                }
                                                className="pvo-input w-full px-2.5 py-1.5 rounded-lg text-sm font-medium"
                                                placeholder="Deductible name"
                                            />
                                        )}
                                        {row.note ? (
                                            <p className="text-[11px] pvo-muted mt-0.5 leading-snug">{row.note}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-2 sm:w-44 shrink-0">
                                        <div className="relative flex-1">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gold">
                                                R
                                            </span>
                                            <input
                                                value={row.amountInput}
                                                onChange={(e) =>
                                                    setDeductibleDrafts((prev) =>
                                                        prev.map((d) =>
                                                            d.id === row.id
                                                                ? { ...d, amountInput: e.target.value }
                                                                : d
                                                        )
                                                    )
                                                }
                                                inputMode="numeric"
                                                placeholder="0"
                                                readOnly={lockedAmount}
                                                className={`pvo-input w-full pl-7 pr-2 py-2 rounded-lg text-sm font-semibold tabular-nums ${
                                                    lockedAmount ? 'bg-charcoal/[0.03] text-charcoal/70' : ''
                                                }`}
                                            />
                                        </div>
                                        {!row.lockedLabel ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDeductibleDrafts((prev) =>
                                                        prev.filter((d) => d.id !== row.id)
                                                    )
                                                }
                                                className="p-2 rounded-lg text-charcoal/40 hover:text-red-600 hover:bg-red-50"
                                                aria-label={`Remove ${row.label}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        ) : null}
                                    </div>
                                </li>
                                );
                            })}
                        </ul>
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <input
                                value={customDeductibleLabel}
                                onChange={(e) => setCustomDeductibleLabel(e.target.value)}
                                placeholder="Add deductible (e.g. SARS tax, levies)"
                                className="pvo-input flex-1 px-3 py-2.5 rounded-xl text-sm"
                            />
                            <div className="relative sm:w-40">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gold">
                                    R
                                </span>
                                <input
                                    value={customDeductibleAmount}
                                    onChange={(e) => setCustomDeductibleAmount(e.target.value)}
                                    inputMode="numeric"
                                    placeholder="Amount"
                                    className="pvo-input w-full pl-7 pr-3 py-2.5 rounded-xl text-sm font-semibold tabular-nums"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const label = customDeductibleLabel.trim();
                                    if (!label) {
                                        setError('Enter a name for the deductible.');
                                        return;
                                    }
                                    const amount = parseMoney(customDeductibleAmount);
                                    if (!amount) {
                                        setError('Enter the deductible amount.');
                                        return;
                                    }
                                    setDeductibleDrafts((prev) => [
                                        ...prev,
                                        {
                                            id: `custom-${Date.now()}`,
                                            label,
                                            amountInput: String(amount),
                                            note: 'Custom deductible you added',
                                        },
                                    ]);
                                    setCustomDeductibleLabel('');
                                    setCustomDeductibleAmount('');
                                    setError('');
                                }}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gold/30 bg-gold/10 text-sm font-semibold pvo-heading hover:bg-gold/15 transition"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </div>
                    </div>
                </section>

                {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start justify-between gap-3">
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => setError('')}
                            className="shrink-0 p-0.5"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : null}

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                    <button
                        type="button"
                        onClick={handleApply}
                        className="pvo-primary-btn inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl text-[15px]"
                    >
                        Estimate selling price
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-xs pvo-muted sm:max-w-xs leading-relaxed">
                        Uses suburb appreciation, your purchase history, and selected upgrades.
                    </p>
                </div>
            </div>

            {sellSuggestion && (
                <div className="mx-6 sm:mx-8 mb-7 sm:mb-8 rounded-2xl overflow-hidden border border-gold/25 bg-gradient-to-br from-gold/[0.09] via-white to-teal-50/40">
                    <div className="px-5 sm:px-7 py-6 sm:py-7">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                            <div>
                                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold mb-3">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Suggested selling price
                                </p>
                                <p className="text-3xl sm:text-4xl font-bold pvo-heading tabular-nums tracking-tight">
                                    {formatZAR(sellSuggestion.suggestedSellPrice)}
                                </p>
                                <p className="text-sm pvo-muted mt-2 flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
                                    Compound @ {sellSuggestion.annualAppreciationPct}%/yr ·{' '}
                                    {sellSuggestion.yearsOwned} years · {sellSuggestion.acquisitionLabel}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 lg:max-w-xl w-full">
                                <ResultStat
                                    label="Cash to you"
                                    value={formatZAR(sellSuggestion.standToGain)}
                                    accent={sellSuggestion.standToGain >= 0}
                                />
                                <ResultStat
                                    label="Est. profit"
                                    value={formatZAR(sellSuggestion.gainVsInvestment)}
                                    accent={sellSuggestion.gainVsInvestment >= 0}
                                />
                                {!sellSuggestion.inherited && sellSuggestion.purchasePrice > 0 ? (
                                    <ResultStat
                                        label="You paid"
                                        value={formatZAR(sellSuggestion.purchasePrice)}
                                    />
                                ) : (
                                    <ResultStat
                                        label="Acquisition"
                                        value={sellSuggestion.acquisitionLabel}
                                    />
                                )}
                                {sellSuggestion.renovationSpend > 0 ? (
                                    <ResultStat
                                        label="Reno spend"
                                        value={formatZAR(sellSuggestion.renovationSpend)}
                                    />
                                ) : null}
                                <ResultStat
                                    label="Cost basis"
                                    value={formatZAR(sellSuggestion.costBasis)}
                                />
                                <ResultStat label="Suburb avg" value={formatZAR(sellSuggestion.suburbAverage)} />
                            </div>
                        </div>

                        <SaleProceedsPanel
                            suggestion={sellSuggestion}
                            onSaleTermsChange={onSaleTermsChange}
                        />

                        <InvestmentSignalBanner suggestion={sellSuggestion} />

                        {sellSuggestion.completedImprovementNames.length > 0 && (
                            <div className="mt-5 pt-5 border-t border-charcoal/[0.06]">
                                <p className="text-[11px] uppercase tracking-wider pvo-muted font-semibold mb-2.5">
                                    Counted upgrades
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {sellSuggestion.completedImprovementNames.map((name) => (
                                        <span
                                            key={name}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full bg-white/80 border border-charcoal/10 pvo-heading"
                                        >
                                            <CheckCircle2 className="w-3 h-3 text-gold" />
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="text-[11px] pvo-muted mt-5 leading-relaxed max-w-3xl">
                            Cash to you is after bond settlement, your agent commission
                            {sellSuggestion.proceeds.agentCommissionIsFixed
                                ? ' (fixed amount)'
                                : sellSuggestion.proceeds.agentCommissionIncludesVat
                                  ? ` (${sellSuggestion.proceeds.agentCommissionRatePct}% incl. VAT)`
                                  : ` (${sellSuggestion.proceeds.agentCommissionRatePct}% + VAT)`}{' '}
                            and typical seller costs
                            {sellSuggestion.proceeds.salePriceSource === 'custom'
                                ? ', using your target sale price'
                                : ''}
                            . Est. profit compares sale after selling costs to your cost basis
                            {sellSuggestion.inherited
                                ? ` (renovation spend only for ${sellSuggestion.acquisitionLabel.toLowerCase()})`
                                : sellSuggestion.acquisitionType === 'bought_cash'
                                  ? ' (cash purchase + renovations)'
                                  : ' (purchase + renovations)'}
                            .
                        </p>
                        <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3">
                            <p className="text-xs text-amber-950/80 leading-relaxed">
                                <span className="font-semibold text-amber-950">Disclaimer:</span> This is a rough
                                estimation only and should not be used as a final asking or sale price. Always consult
                                seasoned property practitioners or obtain a reliable professional valuation for
                                appropriate pricing. Commission and selling costs vary by mandate and conveyancer.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </PvoGlassCard>
    );
}

function ToggleCard({
    active,
    title,
    description,
    onClick,
}: {
    active: boolean;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`text-left rounded-xl border px-4 py-3.5 transition-all ${
                active
                    ? 'border-gold/45 bg-gold/[0.12] shadow-[0_0_0_1px_rgba(201,162,39,0.12)]'
                    : 'border-charcoal/[0.08] bg-white/50 hover:border-charcoal/20'
            }`}
        >
            <span className="inline-flex items-center gap-2">
                <span
                    className={`rounded-md border flex items-center justify-center ${
                        active ? 'bg-gold border-gold text-white' : 'border-charcoal/20 bg-white'
                    }`}
                    style={{ width: 18, height: 18 }}
                >
                    {active ? <Check className="w-3 h-3" strokeWidth={3} /> : null}
                </span>
                <span className={`text-sm font-semibold ${active ? 'pvo-heading' : 'pvo-muted'}`}>{title}</span>
            </span>
            <p className="text-xs pvo-muted mt-1.5 pl-[26px] leading-snug">{description}</p>
        </button>
    );
}

function SaleProceedsPanel({
    suggestion,
    onSaleTermsChange,
}: {
    suggestion: SellSuggestion;
    onSaleTermsChange?: (terms: Partial<LocationInput>) => void;
}) {
    const [saleDraft, setSaleDraft] = useState(
        suggestion.proceeds.salePriceSource === 'custom'
            ? String(suggestion.proceeds.grossSalePrice)
            : ''
    );
    const [pctDraft, setPctDraft] = useState(String(suggestion.proceeds.agentCommissionRatePct));
    const [fixedDraft, setFixedDraft] = useState(
        suggestion.proceeds.agentCommissionIsFixed ? String(suggestion.proceeds.toAgent) : ''
    );
    const [mode, setMode] = useState<'percent' | 'fixed'>(
        suggestion.proceeds.agentCommissionIsFixed ? 'fixed' : 'percent'
    );
    const [includesVat, setIncludesVat] = useState(suggestion.proceeds.agentCommissionIncludesVat);

    useEffect(() => {
        setSaleDraft(
            suggestion.proceeds.salePriceSource === 'custom'
                ? String(suggestion.proceeds.grossSalePrice)
                : ''
        );
        setPctDraft(String(suggestion.proceeds.agentCommissionRatePct));
        setFixedDraft(suggestion.proceeds.agentCommissionIsFixed ? String(suggestion.proceeds.toAgent) : '');
        setMode(suggestion.proceeds.agentCommissionIsFixed ? 'fixed' : 'percent');
        setIncludesVat(suggestion.proceeds.agentCommissionIncludesVat);
    }, [suggestion]);

    const liveProceeds = useMemo(() => {
        const customSale = parseMoney(saleDraft);
        return buildSaleProceedsBreakdown({
            grossSalePrice: customSale ?? suggestion.suggestedSellPrice,
            purchasePrice: suggestion.purchasePrice,
            renovationSpend: suggestion.renovationSpend,
            costBasis: suggestion.costBasis,
            bondBalance: suggestion.bondBalance,
            underBond: suggestion.underBond,
            salePriceSource: customSale ? 'custom' : 'suggested',
            agentCommissionPct: mode === 'percent' ? parsePercent(pctDraft) : undefined,
            agentCommissionAmount: mode === 'fixed' ? parseMoney(fixedDraft) : undefined,
            agentCommissionIncludesVat: mode === 'percent' ? includesVat : undefined,
            deductibles: suggestion.proceeds.deductibles,
            isPrimaryResidence: suggestion.proceeds.cgtEstimate?.isPrimaryResidence,
            marginalTaxRatePct: suggestion.proceeds.cgtEstimate?.marginalTaxRatePct,
            cgtManualOverride: false,
            cgtBaseCost: suggestion.proceeds.cgtEstimate?.baseCost,
            cgtBaseCostAssumed: suggestion.proceeds.cgtEstimate?.baseCostAssumed,
        });
    }, [saleDraft, pctDraft, fixedDraft, mode, includesVat, suggestion]);

    const applyTweaks = () => {
        if (!onSaleTermsChange) return;
        if (mode === 'percent') {
            onSaleTermsChange({
                expectedSalePrice: parseMoney(saleDraft),
                agentCommissionPct: parsePercent(pctDraft) ?? DEFAULT_AGENT_COMMISSION_PCT,
                agentCommissionAmount: undefined,
                agentCommissionIncludesVat: includesVat,
                deductibles: suggestion.proceeds.deductibles,
                isPrimaryResidence: suggestion.proceeds.cgtEstimate?.isPrimaryResidence,
                marginalTaxRatePct: suggestion.proceeds.cgtEstimate?.marginalTaxRatePct,
                cgtManualOverride: false,
            });
            return;
        }
        const fixed = parseMoney(fixedDraft);
        if (!fixed) return;
        onSaleTermsChange({
            expectedSalePrice: parseMoney(saleDraft),
            agentCommissionAmount: fixed,
            agentCommissionPct: undefined,
            agentCommissionIncludesVat: undefined,
            deductibles: suggestion.proceeds.deductibles,
            isPrimaryResidence: suggestion.proceeds.cgtEstimate?.isPrimaryResidence,
            marginalTaxRatePct: suggestion.proceeds.cgtEstimate?.marginalTaxRatePct,
            cgtManualOverride: false,
        });
    };

    const proceeds = liveProceeds;

    return (
        <div className="mt-6 rounded-2xl border border-charcoal/[0.08] bg-white/75 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-charcoal/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                    <p className="text-sm font-semibold pvo-heading">Sale proceeds breakdown</p>
                    <p className="text-xs pvo-muted mt-0.5">
                        Adjust sale price and agent commission for a more accurate picture
                    </p>
                </div>
                <p className="text-xs font-medium text-gold tabular-nums">
                    Profit {formatZAR(proceeds.estimatedProfit)}
                </p>
            </div>

            {onSaleTermsChange && (
                <div className="px-4 sm:px-5 py-4 border-b border-charcoal/[0.06] bg-charcoal/[0.015] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider pvo-muted font-semibold mb-1">
                                Sale price
                            </label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gold">
                                    R
                                </span>
                                <input
                                    value={saleDraft}
                                    onChange={(e) => setSaleDraft(e.target.value)}
                                    placeholder={String(suggestion.suggestedSellPrice)}
                                    inputMode="numeric"
                                    className="pvo-input w-full pl-7 pr-3 py-2 rounded-lg text-sm font-semibold tabular-nums"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider pvo-muted font-semibold mb-1">
                                {mode === 'percent' ? 'Commission %' : 'Commission R'}
                            </label>
                            {mode === 'percent' ? (
                                <div className="relative">
                                    <input
                                        value={pctDraft}
                                        onChange={(e) => setPctDraft(e.target.value)}
                                        inputMode="decimal"
                                        className="pvo-input w-full pl-3 pr-8 py-2 rounded-lg text-sm font-semibold tabular-nums"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gold">
                                        %
                                    </span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gold">
                                        R
                                    </span>
                                    <input
                                        value={fixedDraft}
                                        onChange={(e) => setFixedDraft(e.target.value)}
                                        inputMode="numeric"
                                        className="pvo-input w-full pl-7 pr-3 py-2 rounded-lg text-sm font-semibold tabular-nums"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col justify-end gap-2">
                            <div className="flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setMode('percent')}
                                    className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition ${
                                        mode === 'percent'
                                            ? 'border-gold/40 bg-gold/10 text-charcoal'
                                            : 'border-charcoal/10 pvo-muted'
                                    }`}
                                >
                                    %
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('fixed')}
                                    className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition ${
                                        mode === 'fixed'
                                            ? 'border-gold/40 bg-gold/10 text-charcoal'
                                            : 'border-charcoal/10 pvo-muted'
                                    }`}
                                >
                                    Fixed R
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={applyTweaks}
                                className="pvo-primary-btn text-xs font-semibold py-2 rounded-lg"
                            >
                                Update breakdown
                            </button>
                        </div>
                    </div>
                    {mode === 'percent' && (
                        <label className="inline-flex items-center gap-2 text-xs pvo-muted cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includesVat}
                                onChange={(e) => setIncludesVat(e.target.checked)}
                                className="rounded border-charcoal/20"
                            />
                            Commission % already includes VAT
                        </label>
                    )}
                </div>
            )}

            <ul className="divide-y divide-charcoal/[0.05]">
                {proceeds.lines.map((line) => {
                    const isNet = line.id === 'net';
                    const isGross = line.id === 'gross';
                    const negative = line.amount < 0;
                    return (
                        <li
                            key={line.id}
                            className={`flex items-start justify-between gap-4 px-4 sm:px-5 py-3 ${
                                isNet ? 'bg-gold/[0.08]' : ''
                            }`}
                        >
                            <div className="min-w-0">
                                <p
                                    className={`text-sm ${
                                        isNet || isGross ? 'font-semibold pvo-heading' : 'font-medium pvo-heading'
                                    }`}
                                >
                                    {line.label}
                                </p>
                                {line.note ? (
                                    <p className="text-[11px] pvo-muted mt-0.5 leading-snug">{line.note}</p>
                                ) : null}
                            </div>
                            <p
                                className={`text-sm font-bold tabular-nums shrink-0 ${
                                    isNet
                                        ? proceeds.netToSeller >= 0
                                            ? 'text-green-700'
                                            : 'text-red-700'
                                        : negative
                                          ? 'text-charcoal/70'
                                          : 'pvo-heading'
                                }`}
                            >
                                {negative ? `−${formatZAR(Math.abs(line.amount))}` : formatZAR(line.amount)}
                            </p>
                        </li>
                    );
                })}
            </ul>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-charcoal/[0.05] border-t border-charcoal/[0.06]">
                <MiniDeduction label="Purchase / basis" value={formatZAR(proceeds.costBasis)} />
                <MiniDeduction
                    label="To the bank"
                    value={proceeds.toBank > 0 ? formatZAR(proceeds.toBank) : 'None'}
                />
                <MiniDeduction label="To the agent" value={formatZAR(proceeds.toAgent)} />
                <MiniDeduction
                    label="To SARS (CGT)"
                    value={formatZAR(proceeds.capitalGainsTax)}
                />
            </div>
            {proceeds.cgtEstimate && <CgtWorkingBlock estimate={proceeds.cgtEstimate} />}
            {(proceeds.ratesAndTaxesOwed > 0 ||
                (proceeds.otherSellerCosts > proceeds.capitalGainsTax &&
                    proceeds.otherSellerCosts - proceeds.capitalGainsTax > 0)) && (
                <div className="px-4 sm:px-5 py-3 border-t border-charcoal/[0.06] grid grid-cols-2 gap-3 text-xs">
                    {proceeds.ratesAndTaxesOwed > 0 ? (
                        <p className="pvo-muted">
                            Rates & taxes owed:{' '}
                            <span className="font-semibold pvo-heading tabular-nums">
                                {formatZAR(proceeds.ratesAndTaxesOwed)}
                            </span>
                        </p>
                    ) : null}
                    <p className="pvo-muted">
                        All deductibles:{' '}
                        <span className="font-semibold pvo-heading tabular-nums">
                            {formatZAR(proceeds.otherSellerCosts)}
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
}

function CgtWorkingBlock({ estimate }: { estimate: CgtEstimate }) {
    return (
        <div className="px-4 sm:px-5 py-3.5 border-t border-charcoal/[0.06] bg-sky-50/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-900/70 mb-2">
                SARS CGT working
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                <p className="pvo-muted">
                    Sale proceeds{' '}
                    <span className="font-semibold pvo-heading tabular-nums">
                        {formatZAR(estimate.proceeds)}
                    </span>
                </p>
                <p className="pvo-muted">
                    Base cost{' '}
                    <span className="font-semibold pvo-heading tabular-nums">
                        {formatZAR(estimate.baseCost)}
                        {estimate.baseCostAssumed ? '*' : ''}
                    </span>
                </p>
                <p className="pvo-muted">
                    Selling costs{' '}
                    <span className="font-semibold pvo-heading tabular-nums">
                        {formatZAR(estimate.sellingCosts)}
                    </span>
                </p>
                <p className="pvo-muted">
                    Capital gain{' '}
                    <span className="font-semibold pvo-heading tabular-nums">
                        {formatZAR(estimate.capitalGain)}
                    </span>
                </p>
                {estimate.isPrimaryResidence ? (
                    <p className="pvo-muted">
                        Primary exclusion{' '}
                        <span className="font-semibold pvo-heading tabular-nums">
                            −{formatZAR(estimate.primaryResidenceExclusionApplied)}
                        </span>
                    </p>
                ) : (
                    <p className="pvo-muted">Not primary residence</p>
                )}
                <p className="pvo-muted">
                    Annual exclusion{' '}
                    <span className="font-semibold pvo-heading tabular-nums">
                        −{formatZAR(estimate.annualExclusion)}
                    </span>
                </p>
                <p className="pvo-muted">
                    Taxable ({estimate.inclusionRatePct}%){' '}
                    <span className="font-semibold pvo-heading tabular-nums">
                        {formatZAR(estimate.taxableCapitalGain)}
                    </span>
                </p>
                <p className="pvo-muted">
                    × {estimate.marginalTaxRatePct}% tax{' '}
                    <span className="font-semibold text-sky-900 tabular-nums">
                        = {formatZAR(estimate.estimatedCgt)}
                    </span>
                </p>
            </div>
            {estimate.baseCostAssumed ? (
                <p className="text-[10px] pvo-muted mt-2">
                    * Base cost assumed from suburb norms — enter the value at inheritance / transfer for a
                    tighter estimate. Not a SARS assessment.
                </p>
            ) : (
                <p className="text-[10px] pvo-muted mt-2">
                    Illustrative individual CGT only — confirm with a tax practitioner before filing.
                </p>
            )}
        </div>
    );
}

function MiniDeduction({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white/90 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider pvo-muted font-semibold">{label}</p>
            <p className="text-sm font-bold tabular-nums pvo-heading mt-0.5">{value}</p>
        </div>
    );
}

function InvestmentSignalBanner({ suggestion }: { suggestion: SellSuggestion }) {
    const styles: Record<
        InvestmentSignal,
        { wrap: string; icon: typeof TrendingUp; title: string }
    > = {
        under: {
            wrap: 'border-emerald-200 bg-emerald-50/90 text-emerald-950',
            icon: TrendingUp,
            title: suggestion.investmentSignalLabel,
        },
        balanced: {
            wrap: 'border-sky-200 bg-sky-50/90 text-sky-950',
            icon: CheckCircle2,
            title: suggestion.investmentSignalLabel,
        },
        caution: {
            wrap: 'border-amber-200 bg-amber-50/90 text-amber-950',
            icon: TrendingDown,
            title: suggestion.investmentSignalLabel,
        },
        over: {
            wrap: 'border-red-200 bg-red-50/90 text-red-950',
            icon: TrendingDown,
            title: suggestion.investmentSignalLabel,
        },
    };
    const s = styles[suggestion.investmentSignal];
    const Icon = s.icon;
    return (
        <div className={`mt-5 rounded-xl border px-4 py-3.5 ${s.wrap}`}>
            <p className="text-sm font-semibold inline-flex items-center gap-2">
                <Icon className="w-4 h-4 shrink-0" />
                {s.title}
            </p>
            <p className="text-xs mt-1.5 leading-relaxed opacity-90">{suggestion.investmentSignalDetail}</p>
        </div>
    );
}

function ResultStat({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className="rounded-xl bg-white/70 border border-charcoal/[0.06] px-3 py-2.5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider pvo-muted font-semibold">{label}</p>
            <p
                className={`text-sm font-bold tabular-nums mt-1 truncate ${
                    accent ? 'text-green-700' : 'pvo-heading'
                }`}
            >
                {value}
            </p>
        </div>
    );
}
