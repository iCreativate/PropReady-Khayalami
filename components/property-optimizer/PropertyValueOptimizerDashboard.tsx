'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Bath,
    BedDouble,
    Building2,
    Car,
    Fence,
    FileText,
    Flame,
    Home,
    LandPlot,
    Lightbulb,
    MessageCircle,
    Paintbrush,
    Percent,
    Download,
    Ruler,
    Share2,
    Shield,
    Sparkles,
    Sun,
    Trees,
    Waves,
    Wifi,
    Wind,
    Wrench,
    BatteryCharging,
    Droplets,
    Armchair,
    type LucideIcon,
} from 'lucide-react';
import { AnimatedCounter, PvoBadge, PvoProgressRing } from './pvo-ui';
import {
    PvoLocationSearchBlock,
    type PvoPlaceSelection,
} from './PvoGooglePlaceSearch';
import {
    DEFAULT_AGENT_COMMISSION_PCT,
    DEFAULT_MARGINAL_TAX_RATE_PCT,
    IMPROVEMENT_TEMPLATES,
    answerCoachQuestion,
    buildDefaultSellerDeductibles,
    buildSaleProceedsBreakdown,
    buildSnapshotForLocation,
    formatZAR,
    type ForecastScenario,
    type LocationInput,
    type OptimizerSnapshot,
    type SaleDeductible,
} from '@/lib/property-optimizer';
import { exportPropertyValueReportPdf } from '@/lib/property-optimizer/export-report';
import '@/app/dashboard/property-optimizer/pvo-studio.css';


const IMPROVEMENT_CARDS: {
    id: string;
    label: string;
    icon: LucideIcon;
}[] = [
    { id: 'kitchen', label: 'Kitchen Renovation', icon: Flame },
    { id: 'bathroom', label: 'Bathroom Upgrade', icon: Bath },
    { id: 'solar', label: 'Solar System', icon: Sun },
    { id: 'battery', label: 'Backup Battery', icon: BatteryCharging },
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
    { id: 'entertainment', label: 'Entertainment Area', icon: Armchair },
    { id: 'garage-ext', label: 'Garage Extension', icon: Car },
    { id: 'aircon', label: 'Air Conditioning', icon: Wind },
    { id: 'landscaping', label: 'Landscaping', icon: Trees },
    { id: 'flooring', label: 'Flooring', icon: LandPlot },
    { id: 'electric-fence', label: 'Security Upgrade', icon: Shield },
    { id: 'roof', label: 'Roof Restoration', icon: Home },
    { id: 'exterior-paint', label: 'Exterior Paint', icon: Paintbrush },
    { id: 'smart-home', label: 'Smart Home', icon: Sparkles },
    { id: 'fibre', label: 'Fiber', icon: Wifi },
    { id: 'borehole', label: 'Borehole', icon: Droplets },
];

const COST_CARDS: { id: string; label: string; hint: string }[] = [
    { id: 'agent', label: 'Agent Commission', hint: 'Typical 5–7.5% + VAT' },
    { id: 'transfer', label: 'Transfer Costs', hint: 'Buyer usually pays — include if you cover' },
    { id: 'bond-cancel', label: 'Bond Cancellation', hint: 'Bank / attorney cancel fees' },
    { id: 'compliance', label: 'Compliance Certificates', hint: 'Electrical, gas, beetle, etc.' },
    { id: 'rates-clearance', label: 'Rates Clearance', hint: 'Municipal clearance certificate' },
    { id: 'attorney', label: 'Attorney Fees', hint: 'Seller-side conveyancing' },
    { id: 'cgt', label: 'Capital Gains Tax', hint: 'Illustrative SARS estimate' },
    { id: 'other', label: 'Other Costs', hint: 'Staging, repairs, extras' },
];

const SCENARIOS = [
    { id: 'today', label: 'Sell Today', years: 0, renovate: false, rent: false },
    { id: 'next-year', label: 'Sell Next Year', years: 1, renovate: false, rent: false },
    { id: 'renovate', label: 'Renovate Before Selling', years: 0.5, renovate: true, rent: false },
    { id: 'rent', label: 'Rent Instead', years: 1, renovate: false, rent: true },
    { id: 'keep-5', label: 'Keep For 5 Years', years: 5, renovate: false, rent: false },
] as const;

const SUGGESTED_QS = [
    'Should I sell now or wait?',
    'Which improvement added the most value?',
    'How do agent fees change my cash?',
    'Is my suburb outperforming nearby areas?',
    'What if I renovate the kitchen first?',
];

function parseMoney(raw: string | null | undefined): number | undefined {
    if (raw == null || raw === '') return undefined;
    const cleaned = String(raw).replace(/[^\d.]/g, '');
    if (!cleaned) return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
}

/** Format a typed currency string with thousand separators while typing (e.g. 1,350,000). */
function formatMoneyInput(raw: string): string {
    const cleaned = raw.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function moneyFromNumber(n: number | null | undefined): string {
    if (n == null || !Number.isFinite(n) || n <= 0) return '';
    return formatMoneyInput(String(Math.round(n)));
}

function yearsBetween(iso: string) {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return 0;
    return Math.max(0, (Date.now() - t) / (365.25 * 24 * 3600 * 1000));
}

function Band({
    kicker,
    title,
    subtitle,
    tint,
    action,
    children,
}: {
    kicker: string;
    title: string;
    subtitle: string;
    tint?: boolean;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className={`pvo-band${tint ? ' pvo-band--tint' : ''}`}>
            <div className="pvo-band-head">
                <div>
                    <p className="pvo-band-kicker">{kicker}</p>
                    <h2 className="pvo-band-title">{title}</h2>
                    <p className="pvo-band-sub">{subtitle}</p>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="pvo-kpi-label mb-1.5 block">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    'w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-sm text-[#1b1b1b] outline-none transition focus:border-[#e53935]/40 focus:ring-2 focus:ring-[#e53935]/15';

/**
 * Premium Property Value Optimizer — everything below the portal hero.
 */
export default function PropertyValueOptimizerDashboard() {
    const [snapshot, setSnapshot] = useState<OptimizerSnapshot | null>(null);
    const [suburb, setSuburb] = useState('');
    const [municipality, setMunicipality] = useState('');
    const [province, setProvince] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [propertyType, setPropertyType] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [bathrooms, setBathrooms] = useState('');
    const [parking, setParking] = useState('');
    const [floorSize, setFloorSize] = useState('');
    const [landSize, setLandSize] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [underBond, setUnderBond] = useState(false);
    const [bondBalance, setBondBalance] = useState('');
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [spendById, setSpendById] = useState<Record<string, string>>({});
    const [expandedImprove, setExpandedImprove] = useState<string | null>(null);
    const [agentPct, setAgentPct] = useState(String(DEFAULT_AGENT_COMMISSION_PCT));
    const [costAmounts, setCostAmounts] = useState<Record<string, string>>({});
    const [expandedCost, setExpandedCost] = useState<string | null>('agent');
    const [expectedSale, setExpectedSale] = useState('');
    const [isPrimaryResidence, setIsPrimaryResidence] = useState(true);
    const [forecastScenario, setForecastScenario] = useState<ForecastScenario>('expected');
    const [timelineYear, setTimelineYear] = useState(0);
    const [coachQuestion, setCoachQuestion] = useState('');
    const [coachHistory, setCoachHistory] = useState<
        { q: string; a: ReturnType<typeof answerCoachQuestion> }[]
    >([]);
    const [activeScenario, setActiveScenario] = useState<(typeof SCENARIOS)[number]['id']>('today');
    const [exporting, setExporting] = useState(false);

    const hasPropertyBrief = Boolean(
        suburb.trim() ||
            streetAddress.trim() ||
            parseMoney(purchasePrice) ||
            Number(bedrooms) ||
            Number(floorSize) ||
            Number(landSize) ||
            propertyType.trim()
    );

    const locationInput: LocationInput = useMemo(() => {
        const purchase = parseMoney(purchasePrice) ?? 0;
        const spendMap: Record<string, number> = {};
        let reno = 0;
        for (const id of completedIds) {
            const amt = parseMoney(spendById[id] || '') ?? 0;
            if (amt > 0) {
                spendMap[id] = amt;
                reno += amt;
            } else {
                const tpl = IMPROVEMENT_TEMPLATES.find((t) => t.id === id);
                const fallback = tpl?.baseCost ?? 0;
                if (fallback > 0) {
                    spendMap[id] = fallback;
                    reno += fallback;
                }
            }
        }

        const deductibles: SaleDeductible[] = buildDefaultSellerDeductibles({
            grossSalePrice: parseMoney(expectedSale) || purchase || 0,
            bondBalance: underBond ? parseMoney(bondBalance) || 0 : 0,
            underBond,
        }).map((d) => {
            if (d.id === 'bond-cancel' && costAmounts['bond-cancel']) {
                return { ...d, amount: parseMoney(costAmounts['bond-cancel']) || d.amount };
            }
            if (d.id === 'compliance' && costAmounts.compliance) {
                return { ...d, amount: parseMoney(costAmounts.compliance) || d.amount };
            }
            if (d.id === 'rates-clearance' && costAmounts['rates-clearance']) {
                return { ...d, amount: parseMoney(costAmounts['rates-clearance']) || d.amount };
            }
            if (d.id === 'cgt' && costAmounts.cgt) {
                return { ...d, amount: parseMoney(costAmounts.cgt) || d.amount };
            }
            return d;
        });

        const transfer = parseMoney(costAmounts.transfer) || 0;
        const attorney = parseMoney(costAmounts.attorney) || 0;
        const other = parseMoney(costAmounts.other) || 0;
        if (transfer > 0) deductibles.push({ id: 'transfer', label: 'Transfer Costs', amount: transfer });
        if (attorney > 0) deductibles.push({ id: 'attorney', label: 'Attorney Fees', amount: attorney });
        if (other > 0) deductibles.push({ id: 'other', label: 'Other Costs', amount: other });

        return {
            suburb: suburb.trim(),
            municipality,
            province,
            streetAddress: streetAddress.trim() || undefined,
            propertyType: propertyType.trim() || undefined,
            bedrooms: Number(bedrooms) || undefined,
            bathrooms: Number(bathrooms) || undefined,
            garages: parking === '' ? undefined : Number(parking) || 0,
            floorSizeSqm: Number(floorSize) || undefined,
            landSizeSqm: Number(landSize) || undefined,
            purchasePrice: purchase > 0 ? purchase : undefined,
            purchaseDate: purchaseDate || undefined,
            completedImprovementIds: completedIds,
            improvementSpendById: spendMap,
            renovationSpend: reno,
            underBond,
            bondBalance: underBond ? parseMoney(bondBalance) : 0,
            expectedSalePrice: parseMoney(expectedSale),
            agentCommissionPct: Number(agentPct) || DEFAULT_AGENT_COMMISSION_PCT,
            agentCommissionIncludesVat: false,
            deductibles,
            isPrimaryResidence,
            marginalTaxRatePct: DEFAULT_MARGINAL_TAX_RATE_PCT,
            cgtManualOverride: Boolean(costAmounts.cgt),
            acquisitionType: 'purchased',
        };
    }, [
        suburb,
        municipality,
        province,
        streetAddress,
        propertyType,
        bedrooms,
        bathrooms,
        parking,
        floorSize,
        landSize,
        purchasePrice,
        purchaseDate,
        completedIds,
        spendById,
        underBond,
        bondBalance,
        expectedSale,
        agentPct,
        costAmounts,
        isPrimaryResidence,
    ]);

    useEffect(() => {
        if (!hasPropertyBrief) {
            setSnapshot(null);
            return;
        }
        const t = window.setTimeout(() => {
            setSnapshot(buildSnapshotForLocation(locationInput));
        }, 280);
        return () => window.clearTimeout(t);
    }, [locationInput, hasPropertyBrief]);

    const applyPlace = useCallback((place: PvoPlaceSelection) => {
        setSuburb(place.suburb);
        setMunicipality(place.municipality);
        setProvince(place.province);
        if (place.streetAddress) setStreetAddress(place.streetAddress);
    }, []);

    const canEstimate = Boolean(
        snapshot &&
            snapshot.valuationBasis !== 'insufficient' &&
            snapshot.estimatedMarketValue > 0
    );
    const canExport = canEstimate;

    const sell = snapshot?.sellSuggestion;
    const sellPrice = snapshot?.estimatedMarketValue ?? 0;
    const yearsOwned = sell?.yearsOwned ?? (purchaseDate ? yearsBetween(purchaseDate) : 0);

    const liveProceeds = useMemo(() => {
        if (!sell || !canEstimate) return null;
        const customSale = parseMoney(expectedSale);
        const gross = customSale ?? sellPrice;
        return buildSaleProceedsBreakdown({
            grossSalePrice: gross,
            purchasePrice: sell.purchasePrice,
            renovationSpend: sell.renovationSpend,
            costBasis: sell.costBasis,
            bondBalance: sell.bondBalance,
            underBond: sell.underBond,
            salePriceSource: customSale ? 'custom' : 'suggested',
            agentCommissionPct: Number(agentPct) || DEFAULT_AGENT_COMMISSION_PCT,
            agentCommissionIncludesVat: false,
            deductibles: locationInput.deductibles,
            isPrimaryResidence,
            marginalTaxRatePct: DEFAULT_MARGINAL_TAX_RATE_PCT,
            cgtManualOverride: Boolean(costAmounts.cgt),
            cgtBaseCost: sell.proceeds.cgtEstimate?.baseCost,
            cgtBaseCostAssumed: sell.proceeds.cgtEstimate?.baseCostAssumed,
        });
    }, [
        sell,
        sellPrice,
        expectedSale,
        agentPct,
        locationInput.deductibles,
        isPrimaryResidence,
        costAmounts.cgt,
        canEstimate,
    ]);

    const improvementStats = useMemo(() => {
        const recs = (snapshot?.improvements ?? []).filter((i) => completedIds.includes(i.id));
        let invested = 0;
        let added = 0;
        const rows = IMPROVEMENT_CARDS.filter((c) => completedIds.includes(c.id)).map((c) => {
            const rec = recs.find((r) => r.id === c.id);
            const spent =
                parseMoney(spendById[c.id] || '') ??
                rec?.estimatedCost ??
                IMPROVEMENT_TEMPLATES.find((t) => t.id === c.id)?.baseCost ??
                0;
            const valueAdd = rec?.estimatedValueIncrease ?? Math.round(spent * 1.15);
            const roi = spent > 0 ? ((valueAdd - spent) / spent) * 100 : 0;
            const recovery = spent > 0 ? (valueAdd / spent) * 100 : 0;
            invested += spent;
            added += valueAdd;
            return { ...c, spent, valueAdd, roi, recovery, avgRoi: rec?.estimatedRoi ?? roi };
        });
        return {
            rows,
            invested,
            added,
            net: added - invested,
            roi: invested > 0 ? ((added - invested) / invested) * 100 : 0,
        };
    }, [completedIds, spendById, snapshot?.improvements]);

    const confidence = useMemo(() => {
        if (!hasPropertyBrief) return 0;
        if (snapshot?.confidenceScore != null) return snapshot.confidenceScore;
        let score = 18;
        if (suburb.trim().length > 2) score += 12;
        if (streetAddress.trim()) score += 8;
        if (parseMoney(purchasePrice)) score += 14;
        if (purchaseDate) score += 8;
        if (Number(bedrooms) && Number(bathrooms)) score += 8;
        if (Number(floorSize) && Number(landSize)) score += 8;
        if (completedIds.length) score += Math.min(14, completedIds.length * 3);
        if (underBond ? parseMoney(bondBalance) : true) score += 6;
        return Math.min(96, score);
    }, [
        hasPropertyBrief,
        snapshot?.confidenceScore,
        suburb,
        streetAddress,
        purchasePrice,
        purchaseDate,
        bedrooms,
        bathrooms,
        floorSize,
        landSize,
        completedIds,
        underBond,
        bondBalance,
    ]);

    const purchaseYear = useMemo(() => {
        const y = new Date(purchaseDate).getFullYear();
        return Number.isFinite(y) && purchaseDate ? y : new Date().getFullYear();
    }, [purchaseDate]);
    const currentYear = new Date().getFullYear();
    const maxTimeline = Math.max(1, currentYear - purchaseYear);

    useEffect(() => {
        setTimelineYear(maxTimeline);
    }, [maxTimeline]);

    const timelineData = useMemo(() => {
        if (!canEstimate || !snapshot) return [];
        const purchase =
            parseMoney(purchasePrice) || snapshot.property.purchasePrice || sellPrice * 0.7;
        const appr = (snapshot.avgAnnualAppreciation || 5) / 100;
        const points = [];
        for (let i = 0; i <= maxTimeline; i++) {
            const base = purchase * Math.pow(1 + appr, i);
            const improveShare = (improvementStats.added * i) / Math.max(1, maxTimeline);
            const value = Math.round(base + improveShare);
            const bondStart = underBond ? parseMoney(bondBalance) || sell?.bondBalance || 0 : 0;
            const bond = Math.max(0, Math.round(bondStart * Math.pow(0.94, i)));
            points.push({
                year: purchaseYear + i,
                value,
                beforeImprove: Math.round(base),
                afterImprove: value,
                equity: Math.max(0, value - bond),
                bond,
                profit: Math.max(0, value - purchase - improvementStats.invested - value * 0.08),
            });
        }
        return points;
    }, [
        canEstimate,
        snapshot,
        purchasePrice,
        sellPrice,
        maxTimeline,
        improvementStats.added,
        improvementStats.invested,
        underBond,
        bondBalance,
        sell?.bondBalance,
        purchaseYear,
    ]);

    const timelinePoint =
        timelineData[Math.min(timelineYear, Math.max(0, timelineData.length - 1))] ??
        timelineData.at(-1);

    const appreciation =
        sell && sell.purchasePrice > 0 && sellPrice > 0
            ? Math.round(((sellPrice - sell.purchasePrice) / sell.purchasePrice) * 1000) / 10
            : snapshot?.growthSincePurchase ?? 0;

    const handleExportPdf = useCallback(async () => {
        if (!snapshot || !canExport) return;
        setExporting(true);
        try {
            await exportPropertyValueReportPdf({
                snapshot,
                proceeds: liveProceeds,
                appreciationPct: appreciation,
                yearsOwned,
            });
        } finally {
            setExporting(false);
        }
    }, [snapshot, canExport, liveProceeds, appreciation, yearsOwned]);

    const aiInsights = useMemo(() => {
        if (!snapshot || !hasPropertyBrief) return [];
        const cards: { title: string; body: string; tone: 'gold' | 'green' | 'blue' | 'warm' }[] = [];
        const top = [...improvementStats.rows].sort((a, b) => b.valueAdd - a.valueAdd)[0];
        if (top) {
            cards.push({
                title: `${top.label} — illustrative uplift ~${formatZAR(top.valueAdd)}.`,
                body: `Model recovery ~${top.recovery.toFixed(0)}% of spend. Costs/uplifts are illustrative SA industry models, not deed comps.`,
                tone: 'green',
            });
        }
        if (snapshot.market.hasVerifiedSuburbAverage) {
            cards.push({
                title: `Property24 suburb average: ${formatZAR(snapshot.market.avgPropertyPrice)}.`,
                body: `${snapshot.property.suburb || 'Matched suburb'}${
                    snapshot.market.priceYear ? ` · ${snapshot.market.priceYear}` : ''
                }. This is the verified SA market anchor — not days-on-market or demand scores.`,
                tone: 'warm',
            });
        } else {
            cards.push({
                title: 'Suburb average not matched yet.',
                body: 'Search and select a South African suburb so we can load the Property24 average. Without it, estimates stay input-only models.',
                tone: 'warm',
            });
        }
        if (completedIds.includes('solar') || completedIds.includes('battery')) {
            cards.push({
                title: 'Energy upgrades recorded.',
                body: 'Solar / battery are common SA buyer filters under load-shedding — confirm local quotes before treating modelled uplift as fact.',
                tone: 'gold',
            });
        }
        const waitValue = timelineData.find((p) => p.year === currentYear + 2);
        if (waitValue && timelinePoint) {
            const delta = waitValue.value - timelinePoint.value;
            cards.push({
                title: `Model: waiting ~24 months could change proceeds by ~${formatZAR(delta)}.`,
                body: `Uses disclosed SA model appreciation of ~${snapshot.avgAnnualAppreciation.toFixed(1)}% p.a. — not a verified suburb YoY series.`,
                tone: 'blue',
            });
        }
        if (liveProceeds) {
            const save = Math.round(
                liveProceeds.toAgent * (0.5 / Math.max(1, liveProceeds.agentCommissionRatePct || 6.5))
            );
            cards.push({
                title: `Cutting agent commission by 0.5% saves ~${formatZAR(save)}.`,
                body: 'Commission is negotiable — compare mandates before you list.',
                tone: 'gold',
            });
        }
        cards.push({
            title: 'Sell now vs wait (model)',
            body:
                liveProceeds && timelinePoint
                    ? `Today’s modelled cash ~${formatZAR(liveProceeds.netToSeller)}. Holding builds modelled equity toward ~${formatZAR(timelinePoint.equity)} at the selected year.`
                    : 'Add purchase price and a Property24-matched suburb to unlock a clearer comparison.',
            tone: 'blue',
        });
        return cards.slice(0, 6);
    }, [
        hasPropertyBrief,
        snapshot,
        improvementStats.rows,
        completedIds,
        timelineData,
        currentYear,
        timelinePoint,
        liveProceeds,
    ]);

    const scenarioCards = useMemo(() => {
        if (!canEstimate || !snapshot) return [];
        const purchase = parseMoney(purchasePrice) || snapshot.property.purchasePrice || 0;
        const appr = (snapshot.avgAnnualAppreciation || 5) / 100;
        return SCENARIOS.map((s) => {
            const years = s.years;
            let price = sellPrice * Math.pow(1 + appr, years);
            if (s.renovate) price += improvementStats.added * 0.35;
            if (s.rent) price *= 0.98;
            const costs = price * 0.085 + (underBond ? parseMoney(bondBalance) || 0 : 0) * 0.15;
            const bond = underBond ? parseMoney(bondBalance) || 0 : 0;
            const cash = Math.max(0, price - bond - costs);
            const profit = cash - Math.max(0, purchase - bond);
            const roi = purchase > 0 ? (profit / purchase) * 100 : 0;
            const equity = Math.max(0, price - bond);
            let recommendation = 'Balanced path';
            if (s.id === 'renovate') recommendation = 'Best if upgrades are unfinished';
            if (s.id === 'keep-5') recommendation = 'Strongest long-term equity build';
            if (s.id === 'rent') recommendation = 'Income focus — slower capital release';
            return {
                ...s,
                price: Math.round(price),
                profit: Math.round(profit),
                cash: Math.round(cash),
                roi,
                equity: Math.round(equity),
                recommendation,
            };
        });
    }, [
        canEstimate,
        snapshot,
        purchasePrice,
        sellPrice,
        improvementStats.added,
        underBond,
        bondBalance,
    ]);

    const toggleImprovement = (id: string) => {
        setCompletedIds((prev) => {
            const on = prev.includes(id);
            if (on) {
                if (expandedImprove === id) setExpandedImprove(null);
                return prev.filter((x) => x !== id);
            }
            setExpandedImprove(id);
            return [...prev, id];
        });
    };

    const askCoach = useCallback(() => {
        if (!coachQuestion.trim() || !snapshot) return;
        const response = answerCoachQuestion(coachQuestion, snapshot, snapshot.improvements);
        setCoachHistory((h) => [{ q: coachQuestion, a: response }, ...h].slice(0, 5));
        setCoachQuestion('');
    }, [coachQuestion, snapshot]);

    return (
        <div className="pvo-studio pvo-dashboard">
            {!hasPropertyBrief ? (
                <div className="pvo-card mb-8 border border-dashed border-black/[0.12] bg-[#fafafa] p-6 sm:p-8">
                    <PvoBadge tone="gold">Seller workspace</PvoBadge>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#1b1b1b]">
                        No property listed for sale yet
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/55">
                        Buyers start with an empty Property Value Optimizer. Add the property you want
                        to sell — suburb, specs and purchase details — and PropReady will build live
                        estimates from your inputs and Property24 suburb averages. Export a branded
                        PDF once you have a usable estimate.
                    </p>
                </div>
            ) : null}

            {/* ─── 1. Property Snapshot ─── */}
            <Band
                kicker="01 · Property snapshot"
                title="What is my property worth?"
                subtitle="Enter the property you are considering selling. Estimates stay empty until you provide enough detail."
            >
                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="pvo-card p-5 sm:p-6 space-y-5">
                        <PvoLocationSearchBlock
                            suburb={suburb}
                            onSuburbChange={setSuburb}
                            onPlaceSelect={applyPlace}
                            inputClassName={inputClass}
                            placeholder="Search suburb or street address in South Africa"
                        />

                        <Field label="Street address (optional)">
                            <input
                                className={inputClass}
                                value={streetAddress}
                                onChange={(e) => setStreetAddress(e.target.value)}
                                placeholder="12 Example Road"
                            />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Property type">
                                <select
                                    className={inputClass}
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value)}
                                >
                                    <option value="">Select type</option>
                                    {['House', 'Townhouse', 'Apartment', 'Cluster', 'Smallholding'].map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Purchase date">
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <Field label="Bedrooms">
                                <div className="relative">
                                    <BedDouble className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                                    <input
                                        className={`${inputClass} !pl-9`}
                                        inputMode="numeric"
                                        value={bedrooms}
                                        onChange={(e) => setBedrooms(e.target.value)}
                                        placeholder="—"
                                    />
                                </div>
                            </Field>
                            <Field label="Bathrooms">
                                <div className="relative">
                                    <Bath className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                                    <input
                                        className={`${inputClass} !pl-9`}
                                        inputMode="numeric"
                                        value={bathrooms}
                                        onChange={(e) => setBathrooms(e.target.value)}
                                        placeholder="—"
                                    />
                                </div>
                            </Field>
                            <Field label="Parking">
                                <div className="relative">
                                    <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                                    <input
                                        className={`${inputClass} !pl-9`}
                                        inputMode="numeric"
                                        value={parking}
                                        onChange={(e) => setParking(e.target.value)}
                                        placeholder="—"
                                    />
                                </div>
                            </Field>
                            <Field label="Floor size (m²)">
                                <div className="relative">
                                    <Ruler className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                                    <input
                                        className={`${inputClass} !pl-9`}
                                        inputMode="numeric"
                                        value={floorSize}
                                        onChange={(e) => setFloorSize(e.target.value)}
                                        placeholder="—"
                                    />
                                </div>
                            </Field>
                            <Field label="Land size (m²)">
                                <div className="relative">
                                    <LandPlot className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                                    <input
                                        className={`${inputClass} !pl-9`}
                                        inputMode="numeric"
                                        value={landSize}
                                        onChange={(e) => setLandSize(e.target.value)}
                                        placeholder="—"
                                    />
                                </div>
                            </Field>
                            <Field label="Purchase price">
                                <input
                                    className={inputClass}
                                    inputMode="numeric"
                                    value={purchasePrice}
                                    onChange={(e) => setPurchasePrice(formatMoneyInput(e.target.value))}
                                    placeholder="R"
                                />
                            </Field>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-black/[0.06] bg-[#f7f8fa] px-4 py-3">
                            <label className="inline-flex items-center gap-2 text-sm font-medium">
                                <input
                                    type="checkbox"
                                    checked={underBond}
                                    onChange={(e) => setUnderBond(e.target.checked)}
                                    className="rounded border-black/20"
                                />
                                Outstanding bond
                            </label>
                            {underBond ? (
                                <input
                                    className={`${inputClass} max-w-[12rem]`}
                                    inputMode="numeric"
                                    value={bondBalance}
                                    onChange={(e) => setBondBalance(formatMoneyInput(e.target.value))}
                                    placeholder="Bond balance"
                                />
                            ) : null}
                            <label className="inline-flex items-center gap-2 text-sm font-medium">
                                <input
                                    type="checkbox"
                                    checked={isPrimaryResidence}
                                    onChange={(e) => setIsPrimaryResidence(e.target.checked)}
                                    className="rounded border-black/20"
                                />
                                Primary residence
                            </label>
                        </div>
                    </div>

                    <div className="pvo-card p-5 sm:p-6 space-y-5">
                        {!hasPropertyBrief || !snapshot ? (
                            <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
                                <PvoBadge tone="gold">Empty until you add a property</PvoBadge>
                                <h3 className="mt-4 text-lg font-semibold tracking-tight text-[#1b1b1b]">
                                    Your estimate will appear here
                                </h3>
                                <p className="mt-2 max-w-sm text-sm text-black/50">
                                    Search a South African suburb and add purchase or size details for
                                    the home you want to sell. Nothing is pre-filled for buyers.
                                </p>
                            </div>
                        ) : (
                            <>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <PvoBadge tone="gold">Property summary</PvoBadge>
                                <h3 className="mt-3 text-lg font-semibold tracking-tight text-[#1b1b1b]">
                                    {snapshot.property.address || suburb || 'Your property'}
                                </h3>
                                <p className="mt-1 text-sm text-black/50">
                                    {[propertyType || null, bedrooms ? `${bedrooms} bed` : null, bathrooms ? `${bathrooms} bath` : null, parking !== '' ? `${parking} park` : null]
                                        .filter(Boolean)
                                        .join(' · ') || 'Add specs on the left'}
                                </p>
                            </div>
                            <PvoProgressRing score={confidence} size={88} />
                        </div>

                        <div>
                            <p className="pvo-kpi-label mb-2">Confidence score · {confidence}%</p>
                            <div className="pvo-confidence" aria-hidden>
                                <span style={{ width: `${confidence}%` }} />
                            </div>
                            <p className="mt-2 text-xs text-black/45">
                                Completeness of location, ownership and improvement detail.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-[#1b1b1b] p-4 text-white col-span-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                                    Estimated market value
                                </p>
                                <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
                                    {canEstimate ? (
                                        <AnimatedCounter
                                            value={sellPrice}
                                            format={(v) => formatZAR(Math.round(v))}
                                        />
                                    ) : (
                                        '—'
                                    )}
                                </p>
                                <p className="mt-2 text-[11px] leading-relaxed text-white/55">
                                    {snapshot.market.hasVerifiedSuburbAverage
                                        ? `Anchored to Property24 suburb average${
                                              snapshot.market.priceYear
                                                  ? ` (${snapshot.market.priceYear})`
                                                  : ''
                                          }: ${formatZAR(snapshot.market.avgPropertyPrice)}.`
                                        : 'No Property24 suburb average matched yet — search a SA suburb to anchor this figure.'}{' '}
                                    {!canEstimate
                                        ? 'Add a matched suburb and/or purchase price for a usable estimate.'
                                        : 'Model estimate for decision support — not a formal valuation.'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-black/[0.06] bg-[#f7f8fa] p-3.5">
                                <p className="pvo-kpi-label">Estimated equity</p>
                                <p className="pvo-kpi-value mt-1">
                                    {canEstimate ? formatZAR(snapshot.equity) : '—'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-black/[0.06] bg-[#f7f8fa] p-3.5">
                                <p className="pvo-kpi-label">Appreciation</p>
                                <p className="pvo-kpi-value mt-1">
                                    {canEstimate ? `${appreciation}%` : '—'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-black/[0.06] bg-[#f7f8fa] p-3.5">
                                <p className="pvo-kpi-label">Years owned</p>
                                <p className="pvo-kpi-value mt-1">
                                    {purchaseDate ? yearsOwned.toFixed(1) : '—'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-black/[0.06] bg-[#f7f8fa] p-3.5">
                                <p className="pvo-kpi-label">Purchase price</p>
                                <p className="pvo-kpi-value mt-1">
                                    {parseMoney(purchasePrice)
                                        ? formatZAR(parseMoney(purchasePrice)!)
                                        : '—'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-black/[0.06] bg-[#f7f8fa] p-3.5 col-span-2">
                                <p className="pvo-kpi-label">Outstanding bond</p>
                                <p className="pvo-kpi-value mt-1">
                                    {underBond
                                        ? formatZAR(parseMoney(bondBalance) || 0)
                                        : 'None'}
                                </p>
                            </div>
                        </div>
                            </>
                        )}
                    </div>
                </div>
            </Band>

            {hasPropertyBrief ? (
            <>
            {/* ─── 2. Value Builders ─── */}
            <Band
                tint
                kicker="02 · Value builders"
                title="How did I increase value?"
                subtitle="Toggle improvements you’ve already made. Expand any card to capture spend and see recovery instantly."
            >
                <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {IMPROVEMENT_CARDS.map((card) => {
                            const on = completedIds.includes(card.id);
                            const open = expandedImprove === card.id && on;
                            const row = improvementStats.rows.find((r) => r.id === card.id);
                            const tpl = IMPROVEMENT_TEMPLATES.find((t) => t.id === card.id);
                            const Icon = card.icon;
                            return (
                                <div
                                    key={card.id}
                                    className={`pvo-card pvo-card--interactive p-4 ${on ? 'pvo-card--selected' : ''}`}
                                >
                                    <button
                                        type="button"
                                        className="flex w-full items-start gap-3 text-left"
                                        onClick={() => toggleImprovement(card.id)}
                                    >
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e53935]/[0.08] text-[#e53935]">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-[#1b1b1b]">{card.label}</span>
                                                <span
                                                    className={`h-5 w-9 rounded-full p-0.5 transition ${
                                                        on ? 'bg-[#e53935]' : 'bg-black/15'
                                                    }`}
                                                    aria-hidden
                                                >
                                                    <span
                                                        className={`block h-4 w-4 rounded-full bg-white transition ${
                                                            on ? 'translate-x-4' : ''
                                                        }`}
                                                    />
                                                </span>
                                            </span>
                                            <span className="mt-1 block text-xs text-black/45">
                                                Avg ROI ~{tpl ? Math.round(((tpl.baseValueUplift - tpl.baseCost) / tpl.baseCost) * 100) : 20}%
                                                {row ? ` · Est. add ${formatZAR(row.valueAdd)}` : ''}
                                            </span>
                                        </span>
                                    </button>
                                    {open ? (
                                        <div className="mt-4 space-y-3 border-t border-black/[0.06] pt-4">
                                            <Field label="Amount spent">
                                                <input
                                                    className={inputClass}
                                                    inputMode="numeric"
                                                    value={spendById[card.id] || ''}
                                                    onChange={(e) =>
                                                        setSpendById((m) => ({
                                                            ...m,
                                                            [card.id]: formatMoneyInput(e.target.value),
                                                        }))
                                                    }
                                                    placeholder={
                                                        tpl ? formatMoneyInput(String(tpl.baseCost)) : 'R'
                                                    }
                                                />
                                            </Field>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="rounded-xl bg-[#f7f8fa] p-2.5">
                                                    <p className="pvo-kpi-label">Added value</p>
                                                    <p className="mt-1 text-sm font-semibold tabular-nums">
                                                        {formatZAR(row?.valueAdd ?? 0)}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-[#f7f8fa] p-2.5">
                                                    <p className="pvo-kpi-label">Return %</p>
                                                    <p className="mt-1 text-sm font-semibold tabular-nums">
                                                        {(row?.roi ?? 0).toFixed(0)}%
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-[#f7f8fa] p-2.5">
                                                    <p className="pvo-kpi-label">Recovery %</p>
                                                    <p className="mt-1 text-sm font-semibold tabular-nums">
                                                        {(row?.recovery ?? 0).toFixed(0)}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>

                    <aside className="pvo-card pvo-sticky h-fit space-y-4 p-5 sm:p-6">
                        <p className="pvo-kpi-label">Live improvement total</p>
                        <div className="space-y-3">
                            {[
                                { label: 'Total invested', value: formatZAR(improvementStats.invested) },
                                { label: 'Estimated value added', value: formatZAR(improvementStats.added) },
                                {
                                    label: 'Net gain',
                                    value: formatZAR(improvementStats.net),
                                    good: improvementStats.net >= 0,
                                },
                                { label: 'ROI', value: `${improvementStats.roi.toFixed(0)}%` },
                            ].map((r) => (
                                <div
                                    key={r.label}
                                    className="flex items-center justify-between gap-3 border-b border-black/[0.06] pb-3 last:border-0"
                                >
                                    <span className="text-sm text-black/55">{r.label}</span>
                                    <span
                                        className={`text-sm font-semibold tabular-nums ${
                                            r.good === false ? 'text-red-600' : 'text-[#1b1b1b]'
                                        }`}
                                    >
                                        {r.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs leading-relaxed text-black/45">
                            Recovery above 100% means buyers are modelled to pay more than you spent — still educational, not a valuation.
                        </p>
                    </aside>
                </div>
            </Band>

            {/* ─── 3. Selling costs ─── */}
            <Band
                kicker="03 · Selling cost estimator"
                title="What will selling cost?"
                subtitle="Expand each cost card. The sticky proceeds panel recalculates cash you’ll receive."
                action={
                    <Field label="Expected selling price (optional)">
                        <input
                            className={`${inputClass} min-w-[12rem]`}
                            inputMode="numeric"
                            value={expectedSale}
                            onChange={(e) => setExpectedSale(formatMoneyInput(e.target.value))}
                            placeholder={formatZAR(sellPrice)}
                        />
                    </Field>
                }
            >
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {COST_CARDS.map((card) => {
                            const open = expandedCost === card.id;
                            return (
                                <div key={card.id} className={`pvo-card p-4 ${open ? 'pvo-card--selected' : ''}`}>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between gap-3 text-left"
                                        onClick={() => setExpandedCost(open ? null : card.id)}
                                    >
                                        <span>
                                            <span className="block font-semibold text-[#1b1b1b]">{card.label}</span>
                                            <span className="mt-0.5 block text-xs text-black/45">{card.hint}</span>
                                        </span>
                                        <Percent className="h-4 w-4 shrink-0 text-[#e53935]" />
                                    </button>
                                    {open ? (
                                        <div className="mt-4 border-t border-black/[0.06] pt-4">
                                            {card.id === 'agent' ? (
                                                <Field label="Commission % (excl. VAT)">
                                                    <input
                                                        className={inputClass}
                                                        inputMode="decimal"
                                                        value={agentPct}
                                                        onChange={(e) => setAgentPct(e.target.value)}
                                                    />
                                                </Field>
                                            ) : (
                                                <Field label="Amount (ZAR)">
                                                    <input
                                                        className={inputClass}
                                                        inputMode="numeric"
                                                        value={costAmounts[card.id] || ''}
                                                        onChange={(e) =>
                                                            setCostAmounts((m) => ({
                                                                ...m,
                                                                [card.id]: formatMoneyInput(e.target.value),
                                                            }))
                                                        }
                                                        placeholder="Optional override"
                                                    />
                                                </Field>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>

                    <aside className="pvo-card pvo-sticky h-fit overflow-hidden">
                        <div className="bg-gradient-to-br from-[#1b1b1b] via-[#2a1f21] to-[#5c1d1d] p-5 text-white sm:p-6">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                                Proceeds pulse
                            </p>
                            <div className="mt-4 space-y-3">
                                {[
                                    { label: 'Expected selling price', value: liveProceeds?.grossSalePrice ?? sellPrice },
                                    { label: 'Total selling costs', value: liveProceeds?.totalDeductions ?? 0 },
                                    { label: 'Net proceeds', value: liveProceeds?.netToSeller ?? 0 },
                                    { label: 'Profit', value: liveProceeds?.estimatedProfit ?? 0 },
                                ].map((r) => (
                                    <div key={r.label} className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-white/55">{r.label}</span>
                                        <span className="text-sm font-semibold tabular-nums">
                                            <AnimatedCounter
                                                value={r.value}
                                                format={(v) => formatZAR(Math.round(v))}
                                            />
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                                    Cash you&apos;ll receive
                                </p>
                                <p className="mt-1 text-2xl font-bold tabular-nums">
                                    <AnimatedCounter
                                        value={liveProceeds?.netToSeller ?? 0}
                                        format={(v) => formatZAR(Math.round(v))}
                                    />
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </Band>

            {/* ─── 4. Value Timeline ─── */}
            <Band
                tint
                kicker="04 · Value timeline"
                title="How has value moved since purchase?"
                subtitle="Drag the timeline from purchase year to today. Charts update with improvements and bond pay-down."
                action={
                    <div className="flex flex-wrap gap-2">
                        {(['conservative', 'expected', 'optimistic'] as ForecastScenario[]).map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setForecastScenario(s)}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${
                                    forecastScenario === s
                                        ? 'bg-[#1b1b1b] text-white'
                                        : 'border border-black/[0.08] bg-white text-black/60'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                }
            >
                <div className="pvo-card p-5 sm:p-6 space-y-6">
                    <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-semibold text-[#1b1b1b]">
                                {purchaseYear + timelineYear}
                            </span>
                            <span className="tabular-nums text-black/45">
                                Year {timelineYear} of {maxTimeline}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={maxTimeline}
                            value={timelineYear}
                            onChange={(e) => setTimelineYear(Number(e.target.value))}
                            className="w-full accent-[#e53935]"
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {[
                            { label: 'Property value', value: timelinePoint?.value ?? sellPrice },
                            { label: 'Before improvements', value: timelinePoint?.beforeImprove ?? 0 },
                            { label: 'After improvements', value: timelinePoint?.afterImprove ?? 0 },
                            { label: 'Equity', value: timelinePoint?.equity ?? snapshot?.equity ?? 0 },
                            { label: 'Bond balance', value: timelinePoint?.bond ?? 0 },
                            { label: 'Selling profit', value: timelinePoint?.profit ?? 0 },
                        ].map((k) => (
                            <div key={k.label} className="rounded-2xl border border-black/[0.06] bg-[#f7f8fa] p-3.5">
                                <p className="pvo-kpi-label">{k.label}</p>
                                <p className="mt-1 text-sm font-semibold tabular-nums">
                                    {formatZAR(k.value)}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,27,27,0.06)" />
                                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                                <YAxis
                                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}m`}
                                    width={42}
                                    tick={{ fontSize: 11 }}
                                />
                                <Tooltip formatter={(v: number) => formatZAR(v)} />
                                <Legend />
                                <Line type="monotone" dataKey="beforeImprove" name="Before upgrades" stroke="#9ca3af" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="afterImprove" name="After upgrades" stroke="#e53935" strokeWidth={2.5} dot={false} />
                                <Line type="monotone" dataKey="equity" name="Equity" stroke="#16a34a" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="bond" name="Bond" stroke="#2563eb" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={snapshot?.forecasts[forecastScenario] ?? []}>
                                <defs>
                                    <linearGradient id="pvoGrow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#e53935" stopOpacity={0.35} />
                                        <stop offset="100%" stopColor="#e53935" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,27,27,0.06)" />
                                <XAxis dataKey="year" tickFormatter={(y) => `${y}y`} tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}m`} width={42} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v: number) => formatZAR(v)} />
                                <Area type="monotone" dataKey="value" name="Forward growth" stroke="#e53935" fill="url(#pvoGrow)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Band>

            {/* ─── 5. AI Insights ─── */}
            <Band
                kicker="05 · AI property insights"
                title="Why is it worth that?"
                subtitle="Narrative insights from your profile — plus suggested questions to dig deeper."
            >
                <div id="pvo-ai-insights" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {aiInsights.map((card) => (
                        <article key={card.title} className="pvo-card p-5">
                            <PvoBadge tone={card.tone}>{card.tone === 'gold' ? 'Insight' : 'Signal'}</PvoBadge>
                            <h3 className="mt-3 text-base font-semibold leading-snug text-[#1b1b1b]">
                                {card.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-black/55">{card.body}</p>
                        </article>
                    ))}
                </div>

                <div className="pvo-card mt-6 p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap gap-2">
                        {SUGGESTED_QS.map((q) => (
                            <button key={q} type="button" className="pvo-chip-q" onClick={() => setCoachQuestion(q)}>
                                <Sparkles className="h-3.5 w-3.5 text-[#e53935]" />
                                {q}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            className={`${inputClass} flex-1`}
                            value={coachQuestion}
                            onChange={(e) => setCoachQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && askCoach()}
                            placeholder="Ask anything about this property…"
                        />
                        <button
                            type="button"
                            onClick={askCoach}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#e53935] px-4 text-sm font-semibold text-white"
                        >
                            <MessageCircle className="h-4 w-4" />
                            Ask
                        </button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {coachHistory.map((entry, i) => (
                            <div key={`${entry.q}-${i}`} className="rounded-2xl border border-black/[0.06] bg-[#f7f8fa] p-4">
                                <p className="text-xs font-semibold text-[#e53935]">{entry.q}</p>
                                <p className="mt-1.5 text-sm leading-relaxed text-[#1b1b1b]">{entry.a.answer}</p>
                                {entry.a.evidence[0] ? (
                                    <p className="mt-2 flex items-start gap-1.5 text-xs text-black/45">
                                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        {entry.a.evidence[0]}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            </Band>

            {/* ─── 6. Scenarios ─── */}
            <Band
                tint
                kicker="06 · What happens if?"
                title="Should I sell now — or wait?"
                subtitle="Tap a scenario. Numbers recalculate instantly so you can compare paths side by side."
            >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                    {scenarioCards.map((s) => {
                        const active = activeScenario === s.id;
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setActiveScenario(s.id)}
                                className={`pvo-card pvo-card--interactive p-5 text-left ${
                                    active ? 'pvo-card--selected' : ''
                                }`}
                            >
                                <p className="text-sm font-semibold text-[#1b1b1b]">{s.label}</p>
                                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                                    Selling price
                                </p>
                                <p className="text-lg font-bold tabular-nums text-[#1b1b1b]">
                                    {formatZAR(s.price)}
                                </p>
                                <div className="mt-3 space-y-1.5 text-xs text-black/55">
                                    <p className="flex justify-between gap-2">
                                        <span>Profit</span>
                                        <span className="font-semibold tabular-nums text-[#1b1b1b]">
                                            {formatZAR(s.profit)}
                                        </span>
                                    </p>
                                    <p className="flex justify-between gap-2">
                                        <span>Cash</span>
                                        <span className="font-semibold tabular-nums text-[#1b1b1b]">
                                            {formatZAR(s.cash)}
                                        </span>
                                    </p>
                                    <p className="flex justify-between gap-2">
                                        <span>ROI</span>
                                        <span className="font-semibold tabular-nums text-[#1b1b1b]">
                                            {s.roi.toFixed(0)}%
                                        </span>
                                    </p>
                                    <p className="flex justify-between gap-2">
                                        <span>Equity</span>
                                        <span className="font-semibold tabular-nums text-[#1b1b1b]">
                                            {formatZAR(s.equity)}
                                        </span>
                                    </p>
                                </div>
                                <p className="mt-4 rounded-xl bg-[#e53935]/[0.07] px-3 py-2 text-xs font-medium text-[#5c1d1d]">
                                    {s.recommendation}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </Band>

            {/* ─── 7. Final report ─── */}
            <Band
                kicker="07 · Property report"
                title="How can I maximise my return?"
                subtitle="A boardroom-ready snapshot of value, costs, profit and confidence — ready to share with your team."
            >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                        { label: 'Estimated market value', value: formatZAR(sellPrice), icon: Building2 },
                        {
                            label: 'Estimated selling costs',
                            value: formatZAR(liveProceeds?.totalDeductions ?? 0),
                            icon: FileText,
                        },
                        {
                            label: 'Net profit',
                            value: formatZAR(liveProceeds?.estimatedProfit ?? 0),
                            icon: Sparkles,
                        },
                        {
                            label: 'ROI since purchase',
                            value: `${appreciation}%`,
                            icon: Percent,
                        },
                        {
                            label: 'Property IQ score',
                            value: `${snapshot?.overallAiScore ?? '—'}/100`,
                            icon: Wrench,
                        },
                        {
                            label: 'Market confidence',
                            value: `${confidence}%`,
                            icon: Fence,
                        },
                    ].map((k) => (
                        <div key={k.label} className="pvo-card flex items-start gap-4 p-5">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e53935]/[0.08] text-[#e53935]">
                                <k.icon className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="pvo-kpi-label">{k.label}</p>
                                <p className="mt-1 text-xl font-bold tracking-tight tabular-nums text-[#1b1b1b]">
                                    {k.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        disabled={!canExport || exporting}
                        className="inline-flex h-12 items-center gap-2 rounded-full bg-[#e53935] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(229,57,53,0.28)] disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => void handleExportPdf()}
                    >
                        <FileText className="h-4 w-4" />
                        {exporting ? 'Preparing report…' : 'Generate PropReady Report'}
                    </button>
                    <button
                        type="button"
                        disabled={!canExport || exporting}
                        className="inline-flex h-12 items-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 text-sm font-semibold text-[#1b1b1b] disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => void handleExportPdf()}
                    >
                        <Download className="h-4 w-4" />
                        Export branded PDF
                    </button>
                    <Link
                        href="/dashboard/agent"
                        className="inline-flex h-12 items-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 text-sm font-semibold text-[#1b1b1b]"
                    >
                        <Share2 className="h-4 w-4" />
                        Share With Agent
                    </Link>
                    <Link
                        href="/conveyancers"
                        className="inline-flex h-12 items-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 text-sm font-semibold text-[#1b1b1b]"
                    >
                        Send To Conveyancer
                    </Link>
                    <button
                        type="button"
                        disabled={!snapshot}
                        className="inline-flex h-12 items-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 text-sm font-semibold text-[#1b1b1b] disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => {
                            if (!snapshot) return;
                            const q = 'How can I maximise my return before listing?';
                            const response = answerCoachQuestion(q, snapshot, snapshot.improvements);
                            setCoachQuestion('');
                            setCoachHistory((h) => [{ q, a: response }, ...h].slice(0, 5));
                            document
                                .getElementById('pvo-ai-insights')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                    >
                        <MessageCircle className="h-4 w-4" />
                        Talk To AI
                    </button>
                </div>

                {!canExport ? (
                    <p className="mt-3 text-xs text-black/45">
                        Export unlocks once you have a usable estimate (Property24-matched suburb and/or purchase
                        price with enough detail).
                    </p>
                ) : null}

                <aside className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-5 py-4" role="note">
                    <p className="text-sm leading-relaxed text-amber-950/85">
                        <span className="font-semibold text-amber-950">Disclaimer:</span> Figures on this page are a
                        rough estimation only and should not be used as a final asking or sale price. Always consult
                        seasoned property practitioners or obtain a reliable professional valuation for appropriate
                        pricing.
                    </p>
                </aside>
            </Band>
            </>
            ) : null}
        </div>
    );
}
