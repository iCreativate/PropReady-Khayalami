'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Calculator,
    ChevronDown,
    Lightbulb,
    PiggyBank,
    Scale,
    Sparkles,
    Wallet,
} from 'lucide-react';
import {
    PRICE_PRESETS,
    DEPOSIT_PRESETS,
    TERM_PRESETS,
    acquisitionCashEstimate,
    affordabilityFromBudget,
    buildCoachInsight,
    classifyAffordability,
    extraPaymentImpact,
    formatNumber,
    formatZar,
    parseMoneyInput,
    recommendTerm,
    stressRepayments,
    summariseBondRepayment,
    yearlyBalanceCurve,
} from '@/lib/bond-calculator';

type Mode = 'repayment' | 'affordability' | 'cash';

type BondCalculatorStudioProps = {
    embedded?: boolean;
};

function BalanceCurveChart({
    points,
    dark = false,
}: {
    points: { year: number; balance: number }[];
    dark?: boolean;
}) {
    const w = 560;
    const h = 200;
    const pad = { t: 16, r: 12, b: 28, l: 12 };
    const maxBal = Math.max(...points.map((p) => p.balance), 1);
    const maxYear = Math.max(...points.map((p) => p.year), 1);
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;

    const coords = points.map((p) => ({
        x: pad.l + (p.year / maxYear) * innerW,
        y: pad.t + (1 - p.balance / maxBal) * innerH,
    }));

    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const area = `${line} L ${coords[coords.length - 1]?.x ?? pad.l} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`;
    const stroke = dark ? '#FECACA' : '#dc2626';
    const fill = dark ? 'url(#calcBalDark)' : 'url(#calcBalLight)';
    const axis = dark ? 'rgba(255,255,255,0.2)' : 'rgba(28,28,28,0.12)';
    const label = dark ? 'rgba(255,255,255,0.4)' : 'rgba(28,28,28,0.4)';

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="calc-chart-svg" role="img" aria-label="Loan balance over time">
            <defs>
                <linearGradient id="calcBalLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="calcBalDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FECACA" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FECACA" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75, 1].map((t) => (
                <line
                    key={t}
                    x1={pad.l}
                    x2={w - pad.r}
                    y1={pad.t + innerH * t}
                    y2={pad.t + innerH * t}
                    stroke={axis}
                    strokeWidth="1"
                />
            ))}
            <path d={area} fill={fill} />
            <path
                d={line}
                fill="none"
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {coords.map((c, i) =>
                i === 0 || i === coords.length - 1 || i % Math.ceil(coords.length / 4) === 0 ? (
                    <circle key={i} cx={c.x} cy={c.y} r="3.5" fill={stroke} />
                ) : null
            )}
            <text x={pad.l} y={h - 6} fill={label} fontSize="11">
                Year 0
            </text>
            <text x={w - pad.r} y={h - 6} fill={label} fontSize="11" textAnchor="end">
                Year {maxYear}
            </text>
        </svg>
    );
}

function PrincipalInterestRing({
    principal,
    interest,
    dark = false,
}: {
    principal: number;
    interest: number;
    dark?: boolean;
}) {
    const total = Math.max(1, principal + interest);
    const principalPct = (principal / total) * 100;
    const r = 54;
    const c = 2 * Math.PI * r;
    const principalLen = (principalPct / 100) * c;
    const track = dark ? 'rgba(255,255,255,0.12)' : 'rgba(28,28,28,0.08)';

    return (
        <div className="calc-ring-wrap">
            <svg viewBox="0 0 140 140" className="calc-chart-svg" aria-hidden>
                <circle cx="70" cy="70" r={r} fill="none" stroke={track} strokeWidth="14" />
                <circle
                    cx="70"
                    cy="70"
                    r={r}
                    fill="none"
                    stroke={dark ? '#fff' : '#1c1c1c'}
                    strokeWidth="14"
                    strokeDasharray={`${principalLen} ${c - principalLen}`}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.22,1,0.36,1)' }}
                />
                <circle
                    cx="70"
                    cy="70"
                    r={r}
                    fill="none"
                    stroke={dark ? '#F87171' : '#dc2626'}
                    strokeWidth="14"
                    strokeDasharray={`${c - principalLen} ${principalLen}`}
                    strokeDashoffset={-principalLen}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.22,1,0.36,1)' }}
                />
            </svg>
            <div className="calc-ring-center">
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-charcoal/40'}`}>
                    Total payable
                </p>
                <p className={`text-lg font-semibold tabular-nums tracking-tight ${dark ? 'text-white' : 'text-charcoal'}`}>
                    {formatZar(principal + interest)}
                </p>
            </div>
        </div>
    );
}

export default function BondCalculatorStudio({ embedded = false }: BondCalculatorStudioProps) {
    const [mode, setMode] = useState<Mode>('repayment');
    const [purchasePrice, setPurchasePrice] = useState(1_800_000);
    const [deposit, setDeposit] = useState(180_000);
    const [interestRate, setInterestRate] = useState(11.75);
    const [loanTerm, setLoanTerm] = useState(20);
    const [extraMonthly, setExtraMonthly] = useState(0);
    const [monthlyBudget, setMonthlyBudget] = useState(18_000);
    const [affordDepositPct, setAffordDepositPct] = useState(10);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const repayment = useMemo(
        () =>
            summariseBondRepayment({
                purchasePrice,
                deposit,
                interestRate,
                loanTermYears: loanTerm,
            }),
        [purchasePrice, deposit, interestRate, loanTerm]
    );

    const stress = useMemo(
        () =>
            stressRepayments({
                loanAmount: repayment.loanAmount,
                interestRate,
                loanTermYears: loanTerm,
            }),
        [repayment.loanAmount, interestRate, loanTerm]
    );

    const extras = useMemo(
        () =>
            extraPaymentImpact({
                loanAmount: repayment.loanAmount,
                interestRate,
                loanTermYears: loanTerm,
                extraMonthly,
            }),
        [repayment.loanAmount, interestRate, loanTerm, extraMonthly]
    );

    const afford = useMemo(
        () =>
            affordabilityFromBudget({
                monthlyBudget,
                interestRate,
                loanTermYears: loanTerm,
                depositPct: affordDepositPct,
            }),
        [monthlyBudget, interestRate, loanTerm, affordDepositPct]
    );

    const cash = useMemo(
        () => acquisitionCashEstimate({ purchasePrice, deposit }),
        [purchasePrice, deposit]
    );

    const termCompare = useMemo(
        () =>
            TERM_PRESETS.map((years) => {
                const row = summariseBondRepayment({
                    purchasePrice,
                    deposit,
                    interestRate,
                    loanTermYears: years,
                });
                return { years, monthly: row.monthlyRepayment, interest: row.totalInterest };
            }),
        [purchasePrice, deposit, interestRate]
    );

    const termRec = useMemo(() => recommendTerm(termCompare), [termCompare]);

    const curve = useMemo(
        () =>
            yearlyBalanceCurve({
                loanAmount: repayment.loanAmount,
                interestRate,
                loanTermYears: loanTerm,
                extraMonthly,
            }),
        [repayment.loanAmount, interestRate, loanTerm, extraMonthly]
    );

    const affordStatus = useMemo(
        () => classifyAffordability(repayment.monthlyRepayment, monthlyBudget),
        [repayment.monthlyRepayment, monthlyBudget]
    );

    const interestShare =
        repayment.totalPayable > 0
            ? Math.min(100, (repayment.totalInterest / repayment.totalPayable) * 100)
            : 0;

    const maxTermInterest = Math.max(...termCompare.map((t) => t.interest), 1);

    const coach = useMemo(
        () =>
            buildCoachInsight({
                mode,
                monthly: mode === 'affordability' ? monthlyBudget : repayment.monthlyRepayment,
                loanAmount: repayment.loanAmount,
                totalInterest: repayment.totalInterest,
                depositPct: repayment.depositPct,
                ltvPct: repayment.ltvPct,
                interestRate,
                loanTermYears: loanTerm,
                extraMonthly,
                monthsSaved: extras.monthsSaved,
                interestSaved: extras.interestSaved,
                affordBand: affordStatus.band,
                maxPurchase: afford.maxPurchase,
                cashToClose: cash.cashToClose,
                purchasePrice,
            }),
        [
            mode,
            monthlyBudget,
            repayment,
            interestRate,
            loanTerm,
            extraMonthly,
            extras,
            affordStatus.band,
            afford.maxPurchase,
            cash.cashToClose,
            purchasePrice,
        ]
    );

    const setDepositPct = (pct: number) => {
        setDeposit(Math.round((purchasePrice * pct) / 100));
    };

    const modes: { id: Mode; label: string; icon: typeof Calculator }[] = [
        { id: 'repayment', label: 'Repayment', icon: Calculator },
        { id: 'affordability', label: 'Affordability', icon: Wallet },
        { id: 'cash', label: 'Cash to close', icon: PiggyBank },
    ];

    const priceMax = 6_000_000;
    const depositMax = Math.max(purchasePrice, 1);

    return (
        <div className={`home-landing calc-landing ${embedded ? 'calc-portal-wrap' : ''}`}>
            {/* Hero */}
            <section className="hl-surface-dark calc-hero relative">
                <div className="hl-shell relative z-10">
                    <div className="calc-hero-grid">
                        <div>
                            <p className="hl-eyebrow hl-eyebrow--light">Financial planning</p>
                            <h1 className="hl-display text-[clamp(2.1rem,4.5vw,3.35rem)] text-white tracking-tight leading-[1.08] max-w-[18ch]">
                                Your bond, told as a story — not a spreadsheet
                            </h1>
                            <p className="hl-lede hl-lede--light !max-w-xl !mt-4">
                                Shape price, deposit, rate and term. Watch repayments, stress, and cash-to-close
                                respond like a coach walking you through the decision.
                            </p>
                        </div>
                        <div className="calc-panel calc-panel--dark">
                            <div className="calc-panel-body space-y-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                                    Live snapshot
                                </p>
                                <div>
                                    <p className="text-sm text-white/55">Monthly repayment</p>
                                    <p className="text-3xl font-semibold tabular-nums tracking-tight text-white mt-1">
                                        {formatZar(repayment.monthlyRepayment)}
                                    </p>
                                </div>
                                <div className="calc-split-track" aria-hidden>
                                    <span
                                        className="bg-white"
                                        style={{ width: `${100 - interestShare}%` }}
                                    />
                                    <span
                                        className="bg-[#F87171]"
                                        style={{ width: `${interestShare}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[11px] text-white/40 uppercase tracking-wide">Loan</p>
                                        <p className="text-sm font-semibold tabular-nums text-white/90 mt-0.5">
                                            {formatZar(repayment.loanAmount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-white/40 uppercase tracking-wide">LTV</p>
                                        <p className="text-sm font-semibold tabular-nums text-white/90 mt-0.5">
                                            {repayment.ltvPct.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Input console */}
            <section className="calc-story calc-story--tight calc-story--warm">
                <div className="hl-shell">
                    <div className="calc-console">
                        <div className="calc-console-body space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="calc-story-question !mb-1">Scenario builder</p>
                                    <h2 className="text-xl font-semibold tracking-tight text-charcoal">
                                        Dial in your numbers
                                    </h2>
                                </div>
                                <div className="calc-tabs" role="tablist" aria-label="Calculator modes">
                                    {modes.map(({ id, label, icon: Icon }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            role="tab"
                                            aria-selected={mode === id}
                                            className={`calc-tab ${mode === id ? 'calc-tab--active' : ''}`}
                                            onClick={() => setMode(id)}
                                        >
                                            <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                                {mode !== 'affordability' ? (
                                    <>
                                        <div className="calc-field">
                                            <div className="calc-label-row">
                                                <label className="calc-label" htmlFor="bc-price">
                                                    Purchase price
                                                </label>
                                                <span className="calc-label-value">
                                                    {formatZar(purchasePrice)}
                                                </span>
                                            </div>
                                            <input
                                                id="bc-price"
                                                type="range"
                                                min={500_000}
                                                max={priceMax}
                                                step={25_000}
                                                value={Math.min(purchasePrice, priceMax)}
                                                onChange={(e) => {
                                                    const next = Number(e.target.value);
                                                    setPurchasePrice(next);
                                                    if (deposit > next) setDeposit(next);
                                                }}
                                                className="calc-range"
                                            />
                                            <div className="calc-chip-row">
                                                {PRICE_PRESETS.map((p) => (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        className={`calc-chip ${
                                                            purchasePrice === p.value ? 'calc-chip--active' : ''
                                                        }`}
                                                        onClick={() => {
                                                            setPurchasePrice(p.value);
                                                            setDeposit(Math.round(p.value * 0.1));
                                                        }}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="calc-tip">
                                                Typical mid-market bands for first-time and upgrading buyers.
                                            </p>
                                        </div>

                                        <div className="calc-field">
                                            <div className="calc-label-row">
                                                <label className="calc-label" htmlFor="bc-deposit">
                                                    Deposit
                                                </label>
                                                <span className="calc-label-value">
                                                    {formatZar(deposit)} · {repayment.depositPct.toFixed(0)}%
                                                </span>
                                            </div>
                                            <input
                                                id="bc-deposit"
                                                type="range"
                                                min={0}
                                                max={depositMax}
                                                step={5_000}
                                                value={Math.min(deposit, depositMax)}
                                                onChange={(e) =>
                                                    setDeposit(Math.min(purchasePrice, Number(e.target.value)))
                                                }
                                                className="calc-range"
                                            />
                                            <div className="calc-chip-row">
                                                {DEPOSIT_PRESETS.map((pct) => (
                                                    <button
                                                        key={pct}
                                                        type="button"
                                                        className={`calc-chip ${
                                                            Math.round(repayment.depositPct) === pct
                                                                ? 'calc-chip--active'
                                                                : ''
                                                        }`}
                                                        onClick={() => setDepositPct(pct)}
                                                    >
                                                        {pct}%
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="calc-tip">
                                                10%+ often improves LTV optics; 20% can unlock better pricing.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="calc-field">
                                            <div className="calc-label-row">
                                                <label className="calc-label" htmlFor="bc-budget">
                                                    Monthly comfort budget
                                                </label>
                                                <span className="calc-label-value">
                                                    {formatZar(monthlyBudget)}
                                                </span>
                                            </div>
                                            <input
                                                id="bc-budget"
                                                type="range"
                                                min={5_000}
                                                max={60_000}
                                                step={500}
                                                value={monthlyBudget}
                                                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                                                className="calc-range"
                                            />
                                            <p className="calc-tip">
                                                What you can sustainably pay — not the maximum a bank might quote.
                                            </p>
                                        </div>
                                        <div className="calc-field">
                                            <div className="calc-label-row">
                                                <label className="calc-label" htmlFor="bc-afford-deposit">
                                                    Planned deposit
                                                </label>
                                                <span className="calc-label-value">{affordDepositPct}%</span>
                                            </div>
                                            <input
                                                id="bc-afford-deposit"
                                                type="range"
                                                min={5}
                                                max={40}
                                                step={1}
                                                value={affordDepositPct}
                                                onChange={(e) => setAffordDepositPct(Number(e.target.value))}
                                                className="calc-range"
                                            />
                                            <div className="calc-chip-row">
                                                {DEPOSIT_PRESETS.filter((p) => p > 0).map((pct) => (
                                                    <button
                                                        key={pct}
                                                        type="button"
                                                        className={`calc-chip ${
                                                            affordDepositPct === pct ? 'calc-chip--active' : ''
                                                        }`}
                                                        onClick={() => setAffordDepositPct(pct)}
                                                    >
                                                        {pct}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="calc-field">
                                    <div className="calc-label-row">
                                        <label className="calc-label" htmlFor="bc-rate">
                                            Interest rate
                                        </label>
                                        <span className="calc-label-value">{interestRate.toFixed(2)}% p.a.</span>
                                    </div>
                                    <input
                                        id="bc-rate"
                                        type="range"
                                        min={8}
                                        max={18}
                                        step={0.25}
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        className="calc-range"
                                    />
                                    <p className="calc-tip">
                                        Educational prime + margin proxy — your bank quote will differ.
                                    </p>
                                </div>

                                <div className="calc-field">
                                    <div className="calc-label-row">
                                        <label className="calc-label" htmlFor="bc-term">
                                            Loan term
                                        </label>
                                        <span className="calc-label-value">{loanTerm} years</span>
                                    </div>
                                    <input
                                        id="bc-term"
                                        type="range"
                                        min={5}
                                        max={30}
                                        step={1}
                                        value={loanTerm}
                                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                                        className="calc-range"
                                    />
                                    <div className="calc-chip-row">
                                        {TERM_PRESETS.map((years) => (
                                            <button
                                                key={years}
                                                type="button"
                                                className={`calc-chip ${
                                                    loanTerm === years ? 'calc-chip--active' : ''
                                                }`}
                                                onClick={() => setLoanTerm(years)}
                                            >
                                                {years} yrs
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {mode === 'repayment' ? (
                                <div className="calc-field max-w-xl">
                                    <div className="calc-label-row">
                                        <label className="calc-label" htmlFor="bc-extra">
                                            Extra monthly payment
                                        </label>
                                        <span className="calc-label-value">
                                            {extraMonthly === 0 ? 'None' : `+${formatZar(extraMonthly)}`}
                                        </span>
                                    </div>
                                    <input
                                        id="bc-extra"
                                        type="range"
                                        min={0}
                                        max={5_000}
                                        step={100}
                                        value={extraMonthly}
                                        onChange={(e) => setExtraMonthly(Number(e.target.value))}
                                        className="calc-range"
                                    />
                                    <div className="calc-chip-row">
                                        {[0, 500, 1000, 2500].map((v) => (
                                            <button
                                                key={v}
                                                type="button"
                                                className={`calc-chip ${
                                                    extraMonthly === v ? 'calc-chip--active' : ''
                                                }`}
                                                onClick={() => setExtraMonthly(v)}
                                            >
                                                {v === 0 ? 'None' : `+${formatZar(v)}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            <details
                                className="calc-disclose"
                                open={showAdvanced}
                                onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
                            >
                                <summary>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    Exact amounts &amp; comfort budget
                                </summary>
                                <div className="mt-4 grid sm:grid-cols-3 gap-4">
                                    {mode !== 'affordability' ? (
                                        <>
                                            <div className="calc-field">
                                                <label className="calc-label" htmlFor="bc-price-exact">
                                                    Exact price
                                                </label>
                                                <div className="calc-input-wrap">
                                                    <span className="calc-input-prefix">R</span>
                                                    <input
                                                        id="bc-price-exact"
                                                        className="calc-input calc-input--prefix"
                                                        inputMode="numeric"
                                                        value={
                                                            purchasePrice === 0
                                                                ? ''
                                                                : formatNumber(purchasePrice)
                                                        }
                                                        onChange={(e) => {
                                                            const next = parseMoneyInput(e.target.value);
                                                            setPurchasePrice(next);
                                                            if (deposit > next) setDeposit(next);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="calc-field">
                                                <label className="calc-label" htmlFor="bc-deposit-exact">
                                                    Exact deposit
                                                </label>
                                                <div className="calc-input-wrap">
                                                    <span className="calc-input-prefix">R</span>
                                                    <input
                                                        id="bc-deposit-exact"
                                                        className="calc-input calc-input--prefix"
                                                        inputMode="numeric"
                                                        value={deposit === 0 ? '' : formatNumber(deposit)}
                                                        onChange={(e) =>
                                                            setDeposit(
                                                                Math.min(
                                                                    purchasePrice,
                                                                    parseMoneyInput(e.target.value)
                                                                )
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : null}
                                    <div className="calc-field">
                                        <label className="calc-label" htmlFor="bc-budget-exact">
                                            Comfort budget / month
                                        </label>
                                        <div className="calc-input-wrap">
                                            <span className="calc-input-prefix">R</span>
                                            <input
                                                id="bc-budget-exact"
                                                className="calc-input calc-input--prefix"
                                                inputMode="numeric"
                                                value={monthlyBudget === 0 ? '' : formatNumber(monthlyBudget)}
                                                onChange={(e) =>
                                                    setMonthlyBudget(parseMoneyInput(e.target.value))
                                                }
                                            />
                                        </div>
                                        <p className="calc-tip">Used to colour-code affordability status.</p>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </section>

            {mode === 'repayment' ? (
                <>
                    {/* Monthly payment story */}
                    <section className="calc-story">
                        <div className="hl-shell">
                            <p className="calc-story-question">Monthly payment</p>
                            <h2 className="calc-story-title">What will leave your account each month?</h2>
                            <p className="calc-story-lede">
                                This is the instalment story — then how comfortable it feels against your budget,
                                and what a little extra could buy you.
                            </p>

                            <div className="calc-metric-hero mt-10">
                                <div>
                                    <p className="calc-metric-amount">
                                        {formatZar(repayment.monthlyRepayment)}
                                    </p>
                                    <p className="calc-metric-sub">
                                        {repayment.payments} payments · {loanTerm} years · educational estimate
                                    </p>
                                    <div className="mt-5 flex flex-wrap items-center gap-2">
                                        <span className={`calc-badge calc-badge--${affordStatus.band}`}>
                                            {affordStatus.label}
                                        </span>
                                        <span className="text-sm text-charcoal/50 max-w-sm">
                                            {affordStatus.hint}
                                        </span>
                                    </div>
                                    {extraMonthly > 0 && extras.interestSaved > 0 ? (
                                        <div className="mt-5 inline-flex items-center gap-2">
                                            <span className="calc-badge calc-badge--save">
                                                Save ~{formatZar(extras.interestSaved)}
                                            </span>
                                            <span className="text-sm text-charcoal/50">
                                                · settle ~{extras.monthsSaved} months sooner
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="mt-5 text-sm text-charcoal/50 max-w-md leading-relaxed">
                                            <strong className="text-charcoal/70">Insight:</strong> early years are
                                            interest-heavy — even small extras cut the tail of the loan.
                                        </p>
                                    )}
                                </div>
                                <div className="calc-chart-frame">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal/40 mb-2 px-1">
                                        Outstanding balance over time
                                    </p>
                                    <BalanceCurveChart points={curve} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Loan summary — dark */}
                    <section className="calc-story calc-story--dark">
                        <div className="hl-shell">
                            <p className="calc-story-question">Loan summary</p>
                            <h2 className="calc-story-title text-white">What are you actually financing?</h2>
                            <p className="calc-story-lede">
                                Price minus deposit becomes the bond. Over the full term, interest often rivals —
                                or exceeds — the principal.
                            </p>

                            <div className="mt-10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                                <div className="lg:col-span-4">
                                    <PrincipalInterestRing
                                        principal={repayment.loanAmount}
                                        interest={repayment.totalInterest}
                                        dark
                                    />
                                    <div className="mt-5 flex justify-center gap-5 text-sm">
                                        <span className="inline-flex items-center gap-2 text-white/70">
                                            <span className="h-2.5 w-2.5 rounded-full bg-white" /> Principal
                                        </span>
                                        <span className="inline-flex items-center gap-2 text-white/70">
                                            <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" /> Interest
                                        </span>
                                    </div>
                                </div>
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="grid sm:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                                                Loan amount
                                            </p>
                                            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                                                {formatZar(repayment.loanAmount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                                                Total interest
                                            </p>
                                            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-[#FECACA]">
                                                {formatZar(repayment.totalInterest)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                                                Deposit / LTV
                                            </p>
                                            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                                                {repayment.depositPct.toFixed(0)}% · {repayment.ltvPct.toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3">
                                            Repayment timeline
                                        </p>
                                        <div className="calc-timeline">
                                            {[
                                                {
                                                    label: 'Year 1',
                                                    value: extras.yearOneInterest + extras.yearOnePrincipal,
                                                    hint: `${formatZar(extras.yearOneInterest)} interest`,
                                                },
                                                {
                                                    label: 'Year 5',
                                                    value: Math.max(
                                                        0,
                                                        repayment.loanAmount -
                                                            (curve.find((p) => p.year === 5)?.balance ??
                                                                repayment.loanAmount)
                                                    ),
                                                    hint: `Balance ~${formatZar(
                                                        curve.find((p) => p.year === 5)?.balance ??
                                                            repayment.loanAmount
                                                    )}`,
                                                },
                                                {
                                                    label: `Year ${loanTerm}`,
                                                    value: repayment.loanAmount,
                                                    hint: 'Bond settled (estimate)',
                                                },
                                            ].map((row) => (
                                                <div key={row.label} className="calc-timeline-row">
                                                    <span className="text-xs font-semibold text-white/55">
                                                        {row.label}
                                                    </span>
                                                    <div className="calc-timeline-bar">
                                                        <span
                                                            style={{
                                                                width: `${Math.min(
                                                                    100,
                                                                    (row.value /
                                                                        Math.max(repayment.loanAmount, 1)) *
                                                                        100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-white/45 text-right">
                                                        {row.hint}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Interest analysis */}
                    <section className="calc-story calc-story--warm">
                        <div className="hl-shell">
                            <p className="calc-story-question">Interest analysis</p>
                            <h2 className="calc-story-title">Where does every rand go?</h2>
                            <p className="calc-story-lede">
                                See principal versus interest across the full journey — and how extras rewrite the
                                ending.
                            </p>

                            <div className="mt-10 grid lg:grid-cols-2 gap-8 items-start">
                                <div className="space-y-5">
                                    <div className="calc-split-track !h-3" aria-hidden>
                                        <span
                                            className="bg-charcoal"
                                            style={{ width: `${100 - interestShare}%` }}
                                        />
                                        <span
                                            className="bg-[#dc2626]"
                                            style={{ width: `${interestShare}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>
                                            Principal{' '}
                                            <strong className="tabular-nums">
                                                {formatZar(repayment.loanAmount)}
                                            </strong>
                                        </span>
                                        <span>
                                            Interest{' '}
                                            <strong className="tabular-nums text-[#dc2626]">
                                                {formatZar(repayment.totalInterest)}
                                            </strong>
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
                                                Total repayment
                                            </p>
                                            <p className="mt-1 text-xl font-semibold tabular-nums">
                                                {formatZar(repayment.totalPayable)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
                                                Interest share
                                            </p>
                                            <p className="mt-1 text-xl font-semibold tabular-nums">
                                                {interestShare.toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="calc-chart-frame !bg-white/90">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal/40 mb-3">
                                        Impact of extra repayments
                                    </p>
                                    {extraMonthly > 0 ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <p className="text-xs text-charcoal/45">Months saved</p>
                                                <p className="text-2xl font-semibold tabular-nums mt-1">
                                                    {extras.monthsSaved}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-charcoal/45">Interest saved</p>
                                                <p className="text-2xl font-semibold tabular-nums mt-1 text-[#0f766e]">
                                                    {formatZar(extras.interestSaved)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-charcoal/45">Settle in</p>
                                                <p className="text-2xl font-semibold tabular-nums mt-1">
                                                    {(extras.optimizedMonths / 12).toFixed(1)}y
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-charcoal/55 leading-relaxed">
                                            Nudge the “Extra monthly” slider. Paying a little more than the
                                            instalment attacks principal early — when interest bites hardest.
                                        </p>
                                    )}
                                    <div className="mt-5 calc-chart-frame !p-0 !border-0 !bg-transparent !shadow-none">
                                        <BalanceCurveChart points={curve} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Stress test — dark */}
                    <section className="calc-story calc-story--dark">
                        <div className="hl-shell">
                            <p className="calc-story-question">Stress test</p>
                            <h2 className="calc-story-title text-white">Can you survive a rate rise?</h2>
                            <p className="calc-story-lede">
                                Rates move. Colour-coded scenarios show how your monthly instalment changes if the
                                cost of money climbs.
                            </p>

                            <div className="calc-compare mt-10">
                                {stress.map((row) => {
                                    const delta = row.monthly - stress[0].monthly;
                                    const status = classifyAffordability(row.monthly, monthlyBudget);
                                    return (
                                        <div
                                            key={row.bump}
                                            className={`calc-compare-card ${
                                                row.bump === 0
                                                    ? 'calc-compare-card--base'
                                                    : row.bump >= 2
                                                      ? 'calc-compare-card--warn'
                                                      : ''
                                            }`}
                                        >
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                                                {row.bump === 0 ? 'Base rate' : `Rate +${row.bump}%`}
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
                                                {formatZar(row.monthly)}
                                            </p>
                                            <p className="mt-1 text-xs text-white/45">
                                                {row.rate.toFixed(2)}% p.a.
                                            </p>
                                            <div className="mt-3">
                                                <span className={`calc-badge calc-badge--${status.band}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            {row.bump > 0 ? (
                                                <p className="calc-compare-delta">
                                                    +{formatZar(delta)} / month vs base
                                                </p>
                                            ) : (
                                                <p className="mt-3 text-xs text-white/45 leading-relaxed">
                                                    Your planning anchor — still verify with a bank quote.
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="mt-8 text-sm text-white/55 max-w-2xl leading-relaxed">
                                <strong className="text-white/80">Recommendation:</strong>{' '}
                                {affordStatus.band === 'tight'
                                    ? 'At current inputs you are already tight — do not rely on today’s rate holding. Soften price or deposit before you offer.'
                                    : 'If +2% still feels comfortable, you have a healthier buffer. If it tips into stretch or tight, renegotiate the purchase band.'}
                            </p>
                        </div>
                    </section>

                    {/* Term comparison */}
                    <section className="calc-story">
                        <div className="hl-shell">
                            <p className="calc-story-question">Term comparison</p>
                            <h2 className="calc-story-title">Which term matches your goal?</h2>
                            <p className="calc-story-lede">
                                Shorter terms cost more each month and less overall. Longer terms ease cash flow
                                and grow the interest bill.
                            </p>

                            <div className="calc-term-grid mt-10">
                                {termCompare.map((row) => {
                                    const isActive = row.years === loanTerm;
                                    const isRec = row.years === termRec.years;
                                    const saveVsLong =
                                        termCompare[termCompare.length - 1].interest - row.interest;
                                    return (
                                        <button
                                            key={row.years}
                                            type="button"
                                            onClick={() => setLoanTerm(row.years)}
                                            className={`calc-term-card ${isActive ? 'calc-term-card--active' : ''} ${
                                                isRec ? 'calc-term-card--recommend' : ''
                                            }`}
                                        >
                                            <p className="text-sm font-semibold">{row.years} years</p>
                                            <p className="mt-2 text-lg font-semibold tabular-nums tracking-tight">
                                                {formatZar(row.monthly)}
                                            </p>
                                            <p className="mt-1 text-[11px] text-charcoal/45">/ month</p>
                                            {saveVsLong > 0 && row.years < 30 ? (
                                                <span className="mt-3 inline-flex calc-badge calc-badge--save !h-6 !text-[10px]">
                                                    −{formatZar(saveVsLong)} interest
                                                </span>
                                            ) : (
                                                <span className="mt-3 block text-[11px] text-charcoal/40">
                                                    Lowest monthly
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="calc-interest-bars">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/40 mb-1">
                                    Total interest by term
                                </p>
                                {termCompare.map((row) => (
                                    <div key={`bar-${row.years}`} className="calc-interest-row">
                                        <span className="font-semibold text-charcoal/60">{row.years}y</span>
                                        <div className="calc-interest-fill">
                                            <span
                                                style={{
                                                    width: `${(row.interest / maxTermInterest) * 100}%`,
                                                    opacity: row.years === loanTerm ? 1 : 0.55,
                                                }}
                                            />
                                        </div>
                                        <span className="text-right tabular-nums text-charcoal/55">
                                            {formatZar(row.interest)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-8 text-sm text-charcoal/55 max-w-2xl leading-relaxed">
                                <strong className="text-charcoal">Recommended:</strong> {termRec.reason}
                            </p>
                        </div>
                    </section>
                </>
            ) : null}

            {mode === 'affordability' ? (
                <section className="calc-story">
                    <div className="hl-shell">
                        <p className="calc-story-question">Affordability</p>
                        <h2 className="calc-story-title">What can this budget unlock?</h2>
                        <p className="calc-story-lede">
                            Reverse the calculator: start from the instalment you can live with, then see an
                            indicative purchase ceiling.
                        </p>

                        <div className="calc-metric-hero mt-10">
                            <div>
                                <p className="calc-metric-amount">{formatZar(afford.maxPurchase)}</p>
                                <p className="calc-metric-sub">
                                    Indicative purchase ceiling at {formatZar(monthlyBudget)}/month ·{' '}
                                    {affordDepositPct}% deposit · {interestRate}% · {loanTerm} years
                                </p>
                                <div className="mt-6 grid grid-cols-2 gap-4 max-w-md">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
                                            Max loan
                                        </p>
                                        <p className="mt-1 text-xl font-semibold tabular-nums">
                                            {formatZar(afford.maxLoan)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
                                            Deposit cash
                                        </p>
                                        <p className="mt-1 text-xl font-semibold tabular-nums">
                                            {formatZar(afford.depositCash)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Link href="/get-started" className="hl-btn hl-btn--primary !h-11">
                                        <span>Start free</span>
                                        <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                                    </Link>
                                    <Link href="/quiz" className="hl-btn hl-btn--secondary !h-11">
                                        Soft prequal quiz
                                    </Link>
                                </div>
                            </div>
                            <div className="calc-chart-frame space-y-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal/40">
                                    Budget composition
                                </p>
                                <div className="calc-stack">
                                    {[
                                        {
                                            label: 'Bond instalment (budget)',
                                            amount: monthlyBudget,
                                            pct: 100,
                                        },
                                        {
                                            label: 'Suggested buffer (15%)',
                                            amount: Math.round(monthlyBudget * 0.15),
                                            pct: 15,
                                        },
                                    ].map((item) => (
                                        <div key={item.label} className="calc-stack-item">
                                            <div>
                                                <p className="text-sm font-semibold">{item.label}</p>
                                                <div className="calc-stack-bar">
                                                    <span style={{ width: `${item.pct}%` }} />
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold tabular-nums">
                                                {formatZar(item.amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-charcoal/50 leading-relaxed">
                                    Banks also assess income, existing debt and credit. Use this as a planning
                                    band — then prequalify before you offer.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {mode === 'cash' ? (
                <section className="calc-story calc-story--warm">
                    <div className="hl-shell">
                        <p className="calc-story-question">Cash to close</p>
                        <h2 className="calc-story-title">What cash do you need beyond the bond?</h2>
                        <p className="calc-story-lede">
                            Deposit is only part of the story. Transfer duty, attorneys and bond registration
                            stack on top.
                        </p>

                        <div className="calc-metric-hero mt-10">
                            <div>
                                <p className="calc-metric-amount">{formatZar(cash.cashToClose)}</p>
                                <p className="calc-metric-sub">
                                    Estimated cash to close on {formatZar(purchasePrice)} — not a conveyancer
                                    quote.
                                </p>
                            </div>
                            <div className="calc-stack">
                                {[
                                    { label: 'Deposit', amount: cash.deposit },
                                    ...cash.lines.map((l) => ({ label: l.label, amount: l.amount })),
                                    { label: 'VAT on taxable fees', amount: cash.vat },
                                ].map((item) => (
                                    <div key={item.label} className="calc-stack-item">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{item.label}</p>
                                            <div className="calc-stack-bar">
                                                <span
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            (item.amount / Math.max(cash.cashToClose, 1)) * 100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold tabular-nums shrink-0">
                                            {formatZar(item.amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="mt-6 text-sm text-charcoal/50 max-w-2xl leading-relaxed">
                            Duty bands and tariffs change. Confirm with your conveyancer and read the{' '}
                            <Link href="/learn/transfer-costs" className="text-gold underline">
                                transfer costs lesson
                            </Link>
                            .
                        </p>
                    </div>
                </section>
            ) : null}

            {/* AI / coach insight */}
            <section className="calc-story calc-story--tight">
                <div className="hl-shell">
                    <div className="calc-coach">
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white shadow-[0_8px_24px_rgba(220,38,38,0.25)]">
                                <Lightbulb className="w-4 h-4" strokeWidth={1.75} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#dc2626]">
                                    PropReady coach
                                </p>
                                <h3 className="mt-1 text-lg font-semibold tracking-tight text-charcoal">
                                    {coach.headline}
                                </h3>
                                <p className="mt-2 text-sm text-charcoal/60 leading-relaxed">{coach.body}</p>
                                <div className="calc-coach-actions">
                                    {coach.actions.map((action) => (
                                        <span key={action} className="calc-coach-pill">
                                            <Sparkles className="w-3 h-3 text-[#dc2626]" strokeWidth={2} />
                                            {action}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Next steps */}
            <section className="calc-story calc-story--tight">
                <div className="hl-shell">
                    <p className="calc-story-question">Keep going</p>
                    <h2 className="calc-story-title !max-w-none">Turn insight into a plan</h2>
                    <div className="calc-next mt-8">
                        <Link href="/calculator/smart-bond" className="calc-next-link">
                            <span className="hl-icon !w-10 !h-10 !rounded-xl shrink-0">
                                <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                            </span>
                            <span>
                                <span className="block font-semibold tracking-tight">Smart Bond Optimizer</span>
                                <span className="block text-sm text-charcoal/50 mt-1 leading-relaxed">
                                    Equity scenarios and refinance education beyond basic repayments.
                                </span>
                            </span>
                        </Link>
                        <Link href="/learn/home-loans" className="calc-next-link">
                            <span className="hl-icon !w-10 !h-10 !rounded-xl shrink-0">
                                <Scale className="w-4 h-4" strokeWidth={1.75} />
                            </span>
                            <span>
                                <span className="block font-semibold tracking-tight">Home loans lessons</span>
                                <span className="block text-sm text-charcoal/50 mt-1 leading-relaxed">
                                    Prime, LTV and deposits — explained for South African buyers.
                                </span>
                            </span>
                        </Link>
                        <Link href="/get-started" className="calc-next-link">
                            <span className="hl-icon !w-10 !h-10 !rounded-xl shrink-0">
                                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                            </span>
                            <span>
                                <span className="block font-semibold tracking-tight">Get started free</span>
                                <span className="block text-sm text-charcoal/50 mt-1 leading-relaxed">
                                    Soft prequal and learning hubs so you arrive prepared.
                                </span>
                            </span>
                        </Link>
                    </div>
                    <p className="mt-10 text-center text-xs text-charcoal/40 max-w-2xl mx-auto leading-relaxed">
                        Educational estimates only. Actual rates, fees and affordability depend on your credit
                        profile, the bank’s assessment, and current SARS / conveyancing tariffs.
                    </p>
                </div>
            </section>
        </div>
    );
}
