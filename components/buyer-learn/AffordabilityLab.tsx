'use client';

import { useMemo, useState } from 'react';

function estimateMonthly(principal: number, annualRatePct: number, years: number): number {
    if (principal <= 0 || years <= 0) return 0;
    const r = annualRatePct / 100 / 12;
    const n = years * 12;
    if (r === 0) return principal / n;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function formatZar(n: number): string {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        maximumFractionDigits: 0,
    }).format(n);
}

export default function AffordabilityLab() {
    const [netIncome, setNetIncome] = useState(28000);
    const [rate, setRate] = useState(11.75);
    const [years, setYears] = useState(20);
    const [depositPct, setDepositPct] = useState(10);

    const result = useMemo(() => {
        // Educational rule-of-thumb: ~30% of net on bond repayment
        const maxMonthly = netIncome * 0.3;
        // Solve approximate principal from payment
        const r = rate / 100 / 12;
        const n = years * 12;
        let maxBond = 0;
        if (r > 0 && n > 0) {
            maxBond = maxMonthly * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
        }
        const purchase = maxBond / (1 - depositPct / 100);
        const deposit = purchase * (depositPct / 100);
        const monthly = estimateMonthly(maxBond, rate, years);
        return { maxBond, purchase, deposit, monthly, maxMonthly };
    }, [netIncome, rate, years, depositPct]);

    return (
        <div className="rounded-3xl border border-charcoal/10 bg-gradient-to-br from-white via-white to-charcoal/[0.03] p-5 sm:p-8 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-5">
                    <SliderField
                        label="Net monthly income"
                        value={netIncome}
                        min={8000}
                        max={80000}
                        step={500}
                        display={formatZar(netIncome)}
                        onChange={setNetIncome}
                    />
                    <SliderField
                        label="Interest rate (p.a.)"
                        value={rate}
                        min={8}
                        max={15}
                        step={0.25}
                        display={`${rate.toFixed(2)}%`}
                        onChange={setRate}
                    />
                    <SliderField
                        label="Loan term"
                        value={years}
                        min={10}
                        max={30}
                        step={1}
                        display={`${years} years`}
                        onChange={setYears}
                    />
                    <SliderField
                        label="Deposit"
                        value={depositPct}
                        min={0}
                        max={40}
                        step={1}
                        display={`${depositPct}%`}
                        onChange={setDepositPct}
                    />
                </div>
                <div className="rounded-2xl brand-dark-panel p-6 flex flex-col justify-between min-h-[260px]">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                            Educational estimate
                        </p>
                        <p className="mt-3 text-sm text-white/65">
                            Using ~30% of net income toward repayments (guideline only — banks use full
                            affordability).
                        </p>
                    </div>
                    <div className="mt-6 space-y-4">
                        <Stat label="Est. purchase price" value={formatZar(result.purchase)} />
                        <Stat label="Est. bond amount" value={formatZar(result.maxBond)} />
                        <Stat label="Est. monthly repayment" value={formatZar(result.monthly)} big />
                        <Stat label="Deposit needed" value={formatZar(result.deposit)} />
                    </div>
                    <p className="mt-5 text-[11px] text-white/40">
                        Not a quote. PropReady soft pre-qualification gives a clearer figure.
                    </p>
                </div>
            </div>
        </div>
    );
}

function SliderField({
    label,
    value,
    min,
    max,
    step,
    display,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    display: string;
    onChange: (n: number) => void;
}) {
    return (
        <label className="block">
            <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-medium text-charcoal/80">{label}</span>
                <span className="text-sm font-semibold tabular-nums text-charcoal">{display}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-gold h-2 cursor-pointer"
                aria-label={label}
            />
        </label>
    );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
    return (
        <div className="flex items-end justify-between gap-3 border-b border-white/10 pb-3 last:border-0">
            <span className="text-xs text-white/50">{label}</span>
            <span
                className={`font-semibold tabular-nums tracking-tight ${
                    big ? 'text-2xl text-white' : 'text-base text-white/90'
                }`}
            >
                {value}
            </span>
        </div>
    );
}
