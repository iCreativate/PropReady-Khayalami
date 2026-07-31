'use client';

import { useEffect, useState } from 'react';
import { CC_CARD_FLAT, CC_INPUT, CC_LABEL, CC_MUTED } from '@/components/conveyancer-connect/cc-ui';
import { estimateFees, formatZar, type PriceBand } from '@/lib/conveyancer-connect';

export default function FeeEstimator({
    initialValue = 2_500_000,
    initialBond = 2_000_000,
    priceBand = 2,
}: {
    initialValue?: number;
    initialBond?: number;
    priceBand?: PriceBand;
}) {
    const [propertyValue, setPropertyValue] = useState(initialValue);
    const [bondAmount, setBondAmount] = useState(initialBond);
    const [band, setBand] = useState<PriceBand>(priceBand);
    const estimate = estimateFees({ propertyValue, bondAmount, priceBand: band });

    useEffect(() => {
        setBand(priceBand);
    }, [priceBand]);

    return (
        <div className={`${CC_CARD_FLAT} p-5 sm:p-6`}>
            <h3 className="text-lg font-semibold text-charcoal">Interactive fee estimator</h3>
            <p className={`${CC_MUTED} mt-1`}>
                Illustrative South African transfer cost breakdown. Not a quotation — request a firm
                quote before instructing.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                    <label className={CC_LABEL} htmlFor="fee-value">
                        Property value — {formatZar(propertyValue)}
                    </label>
                    <input
                        id="fee-value"
                        type="range"
                        min={500_000}
                        max={15_000_000}
                        step={50_000}
                        value={propertyValue}
                        onChange={(e) => setPropertyValue(Number(e.target.value))}
                        className="w-full accent-gold"
                    />
                </div>
                <div>
                    <label className={CC_LABEL} htmlFor="fee-bond">
                        Bond amount — {formatZar(bondAmount)}
                    </label>
                    <input
                        id="fee-bond"
                        type="range"
                        min={0}
                        max={propertyValue}
                        step={50_000}
                        value={bondAmount}
                        onChange={(e) => setBondAmount(Number(e.target.value))}
                        className="w-full accent-gold"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className={CC_LABEL} htmlFor="fee-band">
                        Firm fee band
                    </label>
                    <select
                        id="fee-band"
                        className={CC_INPUT}
                        value={band}
                        onChange={(e) => setBand(Number(e.target.value) as PriceBand)}
                    >
                        <option value={1}>R — Value</option>
                        <option value={2}>RR — Standard</option>
                        <option value={3}>RRR — Premium</option>
                        <option value={4}>RRRR — Private client</option>
                    </select>
                </div>
            </div>

            <ul className="mt-6 space-y-3">
                {estimate.lines.map((line) => (
                    <li
                        key={line.id}
                        className="rounded-xl border border-charcoal/[0.06] bg-charcoal/[0.02] px-4 py-3"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-charcoal">{line.label}</p>
                            <p className="shrink-0 text-sm font-semibold tabular-nums text-charcoal">
                                {formatZar(line.amount)}
                            </p>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-charcoal/50">{line.explanation}</p>
                    </li>
                ))}
            </ul>

            <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#020617] via-[#0F172A] to-[#450A0A] p-5 text-white">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                            Estimated total (incl. VAT on taxable lines)
                        </p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums">{formatZar(estimate.total)}</p>
                    </div>
                    <div className="text-right text-sm text-white/60">
                        <p>Subtotal {formatZar(estimate.subtotal)}</p>
                        <p>VAT {formatZar(estimate.vat)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
