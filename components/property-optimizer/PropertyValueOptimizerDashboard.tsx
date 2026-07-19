'use client';

import { useCallback, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Info, Lightbulb, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { AnimatedCounter, PvoBadge, PvoGlassCard, PvoSection, PvoTabs } from './pvo-ui';
import {
    answerCoachQuestion,
    buildOptimizerSnapshot,
    buildSaleProceedsBreakdown,
    buildSnapshotForLocation,
    formatZAR,
    type ForecastScenario,
    type LocationInput,
    type OptimizerSnapshot,
} from '@/lib/property-optimizer';
import PvoLocationPanel from './PvoLocationPanel';

/**
 * Property Value Optimizer:
 * 1) Property details → sell estimate & proceeds
 * 2) Forecast & quick advice
 */
export default function PropertyValueOptimizerDashboard() {
    const [snapshot, setSnapshot] = useState<OptimizerSnapshot>(() => buildOptimizerSnapshot());
    const [lastDetails, setLastDetails] = useState<LocationInput | null>(null);
    const [forecastScenario, setForecastScenario] = useState<ForecastScenario>('expected');
    const [coachQuestion, setCoachQuestion] = useState('');
    const [coachHistory, setCoachHistory] = useState<
        { q: string; a: ReturnType<typeof answerCoachQuestion> }[]
    >([]);

    const sellPrice = snapshot.estimatedMarketValue;

    const liveProceeds = useMemo(() => {
        const s = snapshot.sellSuggestion;
        if (!s) return null;
        const customSale =
            typeof lastDetails?.expectedSalePrice === 'number' && lastDetails.expectedSalePrice > 0
                ? lastDetails.expectedSalePrice
                : undefined;
        const gross =
            customSale ??
            (s.proceeds.salePriceSource === 'custom' ? s.proceeds.grossSalePrice : sellPrice);
        return buildSaleProceedsBreakdown({
            grossSalePrice: gross,
            purchasePrice: s.purchasePrice,
            renovationSpend: s.renovationSpend,
            costBasis: s.costBasis,
            bondBalance: s.bondBalance,
            underBond: s.underBond,
            salePriceSource: customSale || s.proceeds.salePriceSource === 'custom' ? 'custom' : 'suggested',
            agentCommissionPct:
                lastDetails?.agentCommissionPct ??
                (s.proceeds.agentCommissionIsFixed ? undefined : s.proceeds.agentCommissionRatePct),
            agentCommissionAmount:
                lastDetails?.agentCommissionAmount ??
                (s.proceeds.agentCommissionIsFixed ? s.proceeds.toAgent : undefined),
            agentCommissionIncludesVat:
                lastDetails?.agentCommissionIncludesVat ?? s.proceeds.agentCommissionIncludesVat,
            deductibles: lastDetails?.deductibles ?? s.proceeds.deductibles,
            isPrimaryResidence:
                lastDetails?.isPrimaryResidence ?? s.proceeds.cgtEstimate?.isPrimaryResidence,
            marginalTaxRatePct:
                lastDetails?.marginalTaxRatePct ?? s.proceeds.cgtEstimate?.marginalTaxRatePct,
            cgtManualOverride: lastDetails?.cgtManualOverride,
            cgtBaseCost: s.proceeds.cgtEstimate?.baseCost,
            cgtBaseCostAssumed: s.proceeds.cgtEstimate?.baseCostAssumed,
        });
    }, [snapshot.sellSuggestion, sellPrice, lastDetails]);

    const handleDetailsApply = useCallback((input: LocationInput) => {
        const next = buildSnapshotForLocation(input);
        setLastDetails(input);
        setSnapshot(next);
        setCoachHistory([]);
    }, []);

    const handleSaleTermsChange = useCallback(
        (terms: Partial<LocationInput>) => {
            if (!lastDetails) return;
            const merged: LocationInput = {
                ...lastDetails,
                expectedSalePrice: terms.expectedSalePrice,
                agentCommissionPct: terms.agentCommissionPct,
                agentCommissionAmount: terms.agentCommissionAmount,
                agentCommissionIncludesVat: terms.agentCommissionIncludesVat,
                deductibles: terms.deductibles ?? lastDetails.deductibles,
                isPrimaryResidence: terms.isPrimaryResidence ?? lastDetails.isPrimaryResidence,
                marginalTaxRatePct: terms.marginalTaxRatePct ?? lastDetails.marginalTaxRatePct,
                cgtManualOverride: terms.cgtManualOverride ?? lastDetails.cgtManualOverride,
            };
            setLastDetails(merged);
            setSnapshot(buildSnapshotForLocation(merged));
        },
        [lastDetails]
    );

    const askCoach = () => {
        if (!coachQuestion.trim()) return;
        const response = answerCoachQuestion(coachQuestion, snapshot, snapshot.improvements);
        setCoachHistory((h) => [{ q: coachQuestion, a: response }, ...h].slice(0, 4));
        setCoachQuestion('');
    };

    const forecastData = snapshot.forecasts[forecastScenario];

    return (
        <div className="pvo-dashboard space-y-8 sm:space-y-10">
            <PvoLocationPanel
                onApply={handleDetailsApply}
                onSaleTermsChange={handleSaleTermsChange}
                sellSuggestion={snapshot.sellSuggestion}
                initial={
                    lastDetails ?? {
                        suburb: snapshot.property.suburb,
                        municipality: snapshot.property.municipality,
                        province: snapshot.property.province,
                        streetAddress: snapshot.property.address.includes(',')
                            ? snapshot.property.address.split(',')[0]
                            : '',
                        purchasePrice: snapshot.property.purchasePrice,
                        purchaseDate: snapshot.property.purchaseDate,
                    }
                }
            />

            {snapshot.sellSuggestion && (
                <PvoGlassCard className="p-6 sm:p-8" glow>
                    <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                        <div className="flex-1 min-w-0">
                            <PvoBadge tone="gold">Could sell for</PvoBadge>
                            <h3 className="pvo-heading text-xl sm:text-2xl font-semibold mt-3 flex items-start gap-2">
                                <MapPin className="w-5 h-5 text-gold shrink-0 mt-1" />
                                {snapshot.property.address}
                            </h3>
                            <p className="pvo-muted text-sm mt-1">
                                {snapshot.property.suburb} · {snapshot.sellSuggestion.acquisitionLabel} ·{' '}
                                {snapshot.sellSuggestion.yearsOwned} yrs · growth{' '}
                                {snapshot.growthSincePurchase}%
                            </p>
                            <p className="text-3xl sm:text-4xl font-bold pvo-heading tabular-nums mt-5">
                                <AnimatedCounter value={sellPrice} format={formatZAR} />
                            </p>
                            <p className="text-lg font-semibold text-green-700 tabular-nums mt-2">
                                Cash to you {formatZAR(liveProceeds?.netToSeller ?? 0)}
                            </p>
                            <p className="text-sm pvo-muted mt-1">
                                After bank
                                {snapshot.sellSuggestion.underBond
                                    ? ` (${formatZAR(snapshot.sellSuggestion.bondBalance)})`
                                    : ''}
                                , your agent fee
                                {liveProceeds
                                    ? liveProceeds.agentCommissionIsFixed
                                        ? ` (${formatZAR(liveProceeds.toAgent)})`
                                        : liveProceeds.agentCommissionIncludesVat
                                          ? ` (~${liveProceeds.agentCommissionRatePct}% incl. VAT)`
                                          : ` (~${liveProceeds.agentCommissionRatePct}% + VAT)`
                                    : ''}{' '}
                                and typical seller costs
                            </p>
                            <div
                                className={`mt-4 inline-flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs leading-snug max-w-lg ${
                                    snapshot.sellSuggestion.investmentSignal === 'over'
                                        ? 'border-red-200 bg-red-50 text-red-900'
                                        : snapshot.sellSuggestion.investmentSignal === 'caution'
                                          ? 'border-amber-200 bg-amber-50 text-amber-950'
                                          : snapshot.sellSuggestion.investmentSignal === 'under'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                                            : 'border-sky-200 bg-sky-50 text-sky-950'
                                }`}
                            >
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>
                                    <span className="font-semibold">
                                        {snapshot.sellSuggestion.investmentSignalLabel}.
                                    </span>{' '}
                                    {snapshot.sellSuggestion.investmentSignalDetail}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:w-[22rem] shrink-0">
                            <Stat
                                label="Cash to you"
                                value={formatZAR(liveProceeds?.netToSeller ?? 0)}
                            />
                            <Stat
                                label="Est. profit"
                                value={formatZAR(liveProceeds?.estimatedProfit ?? 0)}
                            />
                            <Stat
                                label="You paid"
                                value={
                                    snapshot.sellSuggestion.purchasePrice > 0
                                        ? formatZAR(snapshot.sellSuggestion.purchasePrice)
                                        : snapshot.sellSuggestion.acquisitionLabel
                                }
                            />
                            <Stat
                                label="To the bank"
                                value={
                                    (liveProceeds?.toBank ?? 0) > 0
                                        ? formatZAR(liveProceeds!.toBank)
                                        : 'None'
                                }
                            />
                            <Stat
                                label="To the agent"
                                value={formatZAR(liveProceeds?.toAgent ?? 0)}
                            />
                            <Stat
                                label="To SARS (CGT)"
                                value={formatZAR(liveProceeds?.capitalGainsTax ?? 0)}
                            />
                            <Stat
                                label="Other costs"
                                value={formatZAR(
                                    Math.max(
                                        0,
                                        (liveProceeds?.otherSellerCosts ?? 0) -
                                            (liveProceeds?.capitalGainsTax ?? 0)
                                    )
                                )}
                            />
                            {(liveProceeds?.ratesAndTaxesOwed ?? 0) > 0 ? (
                                <Stat
                                    label="Rates & taxes"
                                    value={formatZAR(liveProceeds!.ratesAndTaxesOwed)}
                                />
                            ) : null}
                        </div>
                    </div>

                    {liveProceeds && (
                        <div className="mt-6 rounded-xl border border-charcoal/[0.08] overflow-hidden bg-white/60">
                            <div className="px-4 py-3 border-b border-charcoal/[0.06]">
                                <p className="text-sm font-semibold pvo-heading">Where the sale money goes</p>
                                <p className="text-xs pvo-muted mt-0.5">
                                    Purchase basis {formatZAR(liveProceeds.costBasis)}
                                    {snapshot.sellSuggestion.renovationSpend > 0
                                        ? ` (incl. ${formatZAR(snapshot.sellSuggestion.renovationSpend)} renovations)`
                                        : ''}
                                </p>
                            </div>
                            <ul className="divide-y divide-charcoal/[0.05]">
                                {liveProceeds.lines.map((line) => {
                                    const negative = line.amount < 0;
                                    const isNet = line.id === 'net';
                                    return (
                                        <li
                                            key={line.id}
                                            className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
                                                isNet ? 'bg-gold/[0.07] font-semibold' : ''
                                            }`}
                                        >
                                            <span className={isNet ? 'pvo-heading' : 'pvo-muted'}>
                                                {line.label}
                                            </span>
                                            <span
                                                className={`tabular-nums font-semibold shrink-0 ${
                                                    isNet
                                                        ? liveProceeds.netToSeller >= 0
                                                            ? 'text-green-700'
                                                            : 'text-red-700'
                                                        : 'pvo-heading'
                                                }`}
                                            >
                                                {negative
                                                    ? `−${formatZAR(Math.abs(line.amount))}`
                                                    : formatZAR(line.amount)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    <div className="mt-5 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3">
                        <p className="text-xs text-amber-950/80 leading-relaxed flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-800" />
                            <span>
                                <span className="font-semibold text-amber-950">Disclaimer:</span> This is a rough
                                estimation only and should not be used as a final asking or sale price. Always consult
                                seasoned property practitioners or obtain a reliable professional valuation for
                                appropriate pricing. Agent commission and conveyancing costs are illustrative and
                                negotiable.
                            </span>
                        </p>
                    </div>
                </PvoGlassCard>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <PvoSection title="Value forecast" subtitle="Illustrative appreciation over time">
                    <PvoGlassCard className="p-5 sm:p-6">
                        <PvoTabs
                            tabs={[
                                { id: 'conservative' as const, label: 'Conservative' },
                                { id: 'expected' as const, label: 'Expected' },
                                { id: 'optimistic' as const, label: 'Optimistic' },
                            ]}
                            active={forecastScenario}
                            onChange={setForecastScenario}
                        />
                        <div className="h-56 mt-5">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecastData}>
                                    <defs>
                                        <linearGradient id="pvoArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#C9A227" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#C9A227" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="pvo-chart-grid" />
                                    <XAxis dataKey="year" tickFormatter={(y) => `${y}y`} />
                                    <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}m`} width={40} />
                                    <Tooltip formatter={(v: number) => formatZAR(v)} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#C9A227"
                                        fill="url(#pvoArea)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs pvo-muted mt-3">
                            Not a guarantee — based on area trends from your property details.
                        </p>
                    </PvoGlassCard>
                </PvoSection>

                <PvoSection title="Quick advice" subtitle="Ask a practical question about this property">
                    <PvoGlassCard className="p-5 sm:p-6">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {['Should I sell now?', 'What affects my net?', 'Primary residence CGT?'].map(
                                (p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setCoachQuestion(p)}
                                        className="pvo-chip text-xs px-3 py-1.5 rounded-full"
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={coachQuestion}
                                onChange={(e) => setCoachQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && askCoach()}
                                placeholder="e.g. How do agent fees affect cash to me?"
                                className="pvo-input flex-1 px-4 py-3 rounded-2xl text-sm"
                            />
                            <button
                                type="button"
                                onClick={askCoach}
                                className="pvo-primary-btn px-4"
                                aria-label="Ask"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mt-4 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                            {coachHistory.length === 0 && (
                                <p className="text-sm pvo-muted flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                    Tip: complete your property details first, then ask about selling or net
                                    proceeds.
                                </p>
                            )}
                            {coachHistory.map((entry, i) => (
                                <div key={i} className="pvo-coach-bubble p-4 rounded-2xl">
                                    <p className="text-xs font-semibold text-gold mb-1">{entry.q}</p>
                                    <p className="text-sm pvo-heading leading-relaxed">{entry.a.answer}</p>
                                    {entry.a.evidence[0] && (
                                        <p className="text-xs pvo-muted mt-2 flex items-start gap-1">
                                            <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                                            {entry.a.evidence[0]}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </PvoGlassCard>
                </PvoSection>
            </div>

            <aside
                className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-5 py-4"
                role="note"
                aria-label="Valuation disclaimer"
            >
                <p className="text-sm text-amber-950/85 leading-relaxed">
                    <span className="font-semibold text-amber-950">Disclaimer:</span> Figures on this page are a rough
                    estimation only and should not be used as a final asking or sale price. Always consult seasoned
                    property practitioners or obtain a reliable professional valuation for appropriate pricing.
                </p>
            </aside>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="pvo-stat-inner p-3 rounded-xl">
            <p className="text-[10px] uppercase tracking-wider pvo-muted">{label}</p>
            <p className="text-sm font-semibold pvo-heading mt-1 truncate capitalize">{value}</p>
        </div>
    );
}
