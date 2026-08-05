'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Calculator,
    Download,
    Lightbulb,
    PiggyBank,
    RotateCcw,
    Save,
    Share2,
    Wallet,
    Zap,
} from 'lucide-react';
import {
    DEFAULT_BOND_INPUTS,
    DEPOSIT_PRESETS,
    PRICE_PRESETS,
    TERM_PRESETS,
    acquisitionCashEstimate,
    affordabilityFromBudget,
    buildBondChartSeries,
    buildScenarioComparison,
    classifyAffordability,
    debtToIncomeRatio,
    extraPaymentImpact,
    formatNumber,
    formatZar,
    generateBondInsights,
    parseMoneyInput,
    recommendTerm,
    stressRepayments,
    summariseBondRepayment,
    type BondChartTab,
    type SavedBondCalculation,
} from '@/lib/bond-calculator';
import {
    deleteSavedBondCalculation,
    readSavedBondCalculations,
    saveBondCalculation,
} from '@/lib/bond-calculator-storage';

type Mode = 'repayment' | 'affordability' | 'cash';
type WhatIfTab = 'rate' | 'extra' | 'term' | 'deposit';

type BondCalculatorStudioProps = {
    embedded?: boolean;
};

function useAnimatedNumber(value: number, duration = 420) {
    const [display, setDisplay] = useState(value);
    useEffect(() => {
        const from = display;
        const to = value;
        if (from === to) return;
        const start = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(from + (to - from) * eased));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- animate toward latest target only
    }, [value, duration]);
    return display;
}

function AnimatedZar({ value, className = '' }: { value: number; className?: string }) {
    const n = useAnimatedNumber(value);
    return <span className={className}>{formatZar(n)}</span>;
}

function MoneyField({
    id,
    label,
    value,
    min,
    max,
    step,
    onChange,
    presets,
    formatValue,
}: {
    id: string;
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    presets?: { label: string; value: number }[];
    formatValue?: (v: number) => string;
}) {
    const display = formatValue ? formatValue(value) : formatZar(value);
    return (
        <div className="bc-field">
            <div className="bc-field-head">
                <label className="bc-field-label" htmlFor={id}>
                    {label}
                </label>
                <span className="bc-field-value">{display}</span>
            </div>
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={Math.min(Math.max(value, min), max)}
                onChange={(e) => onChange(Number(e.target.value))}
                className="bc-range"
            />
            {presets && presets.length > 0 ? (
                <div className="bc-chips">
                    {presets.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            className={`bc-chip ${value === p.value ? 'bc-chip--active' : ''}`}
                            onClick={() => onChange(p.value)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            ) : null}
            <div className="bc-input-wrap">
                <span className="bc-input-prefix">R</span>
                <input
                    className="bc-input bc-input--prefix"
                    inputMode="numeric"
                    value={value === 0 ? '' : formatNumber(value)}
                    onChange={(e) => onChange(parseMoneyInput(e.target.value))}
                    aria-label={`${label} exact amount`}
                />
            </div>
        </div>
    );
}

const CHART_TAB_CONFIG: { id: BondChartTab; label: string; key: keyof ReturnType<typeof buildBondChartSeries>[0] }[] = [
    { id: 'balance', label: 'Balance', key: 'balance' },
    { id: 'interest', label: 'Interest', key: 'interestPaid' },
    { id: 'principal', label: 'Principal', key: 'principalPaid' },
    { id: 'equity', label: 'Equity', key: 'equity' },
    { id: 'cashflow', label: 'Cash flow', key: 'cashFlow' },
];

export default function BondCalculatorStudio({ embedded = false }: BondCalculatorStudioProps) {
    const [mode, setMode] = useState<Mode>('repayment');
    const [purchasePrice, setPurchasePrice] = useState(DEFAULT_BOND_INPUTS.purchasePrice);
    const [deposit, setDeposit] = useState(DEFAULT_BOND_INPUTS.deposit);
    const [interestRate, setInterestRate] = useState(DEFAULT_BOND_INPUTS.interestRate);
    const [loanTerm, setLoanTerm] = useState(DEFAULT_BOND_INPUTS.loanTerm);
    const [extraMonthly, setExtraMonthly] = useState(DEFAULT_BOND_INPUTS.extraMonthly);
    const [monthlyIncome, setMonthlyIncome] = useState(DEFAULT_BOND_INPUTS.monthlyIncome);
    const [monthlyExpenses, setMonthlyExpenses] = useState(DEFAULT_BOND_INPUTS.monthlyExpenses);
    const [monthlyBudget, setMonthlyBudget] = useState(DEFAULT_BOND_INPUTS.monthlyBudget);
    const [affordDepositPct, setAffordDepositPct] = useState(DEFAULT_BOND_INPUTS.affordDepositPct);
    const [chartTab, setChartTab] = useState<BondChartTab>('balance');
    const [whatIfTab, setWhatIfTab] = useState<WhatIfTab>('rate');
    const [saved, setSaved] = useState<SavedBondCalculation[]>([]);
    const [showSaved, setShowSaved] = useState(false);
    const [stickyVisible, setStickyVisible] = useState(false);

    useEffect(() => {
        setSaved(readSavedBondCalculations());
    }, []);

    useEffect(() => {
        const onScroll = () => setStickyVisible(window.scrollY > 320);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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

    const stress = useMemo(
        () =>
            stressRepayments({
                loanAmount: repayment.loanAmount,
                interestRate,
                loanTermYears: loanTerm,
            }),
        [repayment.loanAmount, interestRate, loanTerm]
    );

    const scenarios = useMemo(
        () =>
            buildScenarioComparison({
                purchasePrice,
                deposit,
                interestRate,
                loanTermYears: loanTerm,
                extraMonthly,
            }),
        [purchasePrice, deposit, interestRate, loanTerm, extraMonthly]
    );

    const chartSeries = useMemo(
        () =>
            buildBondChartSeries({
                purchasePrice,
                loanAmount: repayment.loanAmount,
                interestRate,
                loanTermYears: loanTerm,
                extraMonthly,
                monthlyRepayment: repayment.monthlyRepayment,
            }),
        [purchasePrice, repayment.loanAmount, interestRate, loanTerm, extraMonthly, repayment.monthlyRepayment]
    );

    const chartKey = CHART_TAB_CONFIG.find((t) => t.id === chartTab)?.key ?? 'balance';
    const chartData = chartSeries.map((p) => ({
        year: `Y${p.year}`,
        value: Math.abs(p[chartKey]),
    }));

    const dti = useMemo(
        () => debtToIncomeRatio(repayment.monthlyRepayment, monthlyIncome, monthlyExpenses),
        [repayment.monthlyRepayment, monthlyIncome, monthlyExpenses]
    );

    const affordStatus = useMemo(
        () =>
            classifyAffordability(
                repayment.monthlyRepayment,
                monthlyIncome > 0 ? monthlyIncome - monthlyExpenses : monthlyBudget
            ),
        [repayment.monthlyRepayment, monthlyIncome, monthlyExpenses, monthlyBudget]
    );

    const interestShare =
        repayment.totalPayable > 0
            ? Math.min(100, (repayment.totalInterest / repayment.totalPayable) * 100)
            : 0;

    const insights = useMemo(
        () =>
            generateBondInsights({
                monthlyRepayment: repayment.monthlyRepayment,
                loanAmount: repayment.loanAmount,
                totalInterest: repayment.totalInterest,
                depositPct: repayment.depositPct,
                ltvPct: repayment.ltvPct,
                interestRate,
                loanTermYears: loanTerm,
                extraMonthly,
                monthsSaved: extras.monthsSaved,
                interestSaved: extras.interestSaved,
                dtiPct: dti,
                monthlyIncome,
                affordBand: affordStatus.band,
            }),
        [
            repayment,
            interestRate,
            loanTerm,
            extraMonthly,
            extras,
            dti,
            monthlyIncome,
            affordStatus.band,
        ]
    );

    const recommended = scenarios.find((s) => s.recommended) ?? scenarios[1];
    const termRec = useMemo(() => {
        const rows = TERM_PRESETS.map((years) => {
            const row = summariseBondRepayment({
                purchasePrice,
                deposit,
                interestRate,
                loanTermYears: years,
            });
            return { years, monthly: row.monthlyRepayment, interest: row.totalInterest };
        });
        return recommendTerm(rows);
    }, [purchasePrice, deposit, interestRate]);

    const setDepositPct = (pct: number) => {
        setDeposit(Math.round((purchasePrice * pct) / 100));
    };

    const resetCalculator = () => {
        setPurchasePrice(DEFAULT_BOND_INPUTS.purchasePrice);
        setDeposit(DEFAULT_BOND_INPUTS.deposit);
        setInterestRate(DEFAULT_BOND_INPUTS.interestRate);
        setLoanTerm(DEFAULT_BOND_INPUTS.loanTerm);
        setExtraMonthly(DEFAULT_BOND_INPUTS.extraMonthly);
        setMonthlyIncome(DEFAULT_BOND_INPUTS.monthlyIncome);
        setMonthlyExpenses(DEFAULT_BOND_INPUTS.monthlyExpenses);
        setMonthlyBudget(DEFAULT_BOND_INPUTS.monthlyBudget);
        setAffordDepositPct(DEFAULT_BOND_INPUTS.affordDepositPct);
        setMode('repayment');
    };

    const snapshot = useCallback(
        () => ({
            purchasePrice,
            deposit,
            interestRate,
            loanTerm,
            extraMonthly,
            monthlyIncome,
            monthlyExpenses,
            monthlyBudget,
        }),
        [
            purchasePrice,
            deposit,
            interestRate,
            loanTerm,
            extraMonthly,
            monthlyIncome,
            monthlyExpenses,
            monthlyBudget,
        ]
    );

    const handleSave = () => {
        const next = saveBondCalculation(snapshot());
        setSaved(next);
        setShowSaved(true);
    };

    const loadSaved = (item: SavedBondCalculation) => {
        setPurchasePrice(item.purchasePrice);
        setDeposit(item.deposit);
        setInterestRate(item.interestRate);
        setLoanTerm(item.loanTerm);
        setExtraMonthly(item.extraMonthly);
        setMonthlyIncome(item.monthlyIncome);
        setMonthlyExpenses(item.monthlyExpenses);
        setMonthlyBudget(item.monthlyBudget);
    };

    const handleShare = async () => {
        const text = `Bond estimate: ${formatZar(repayment.monthlyRepayment)}/mo on ${formatZar(purchasePrice)} at ${interestRate}% over ${loanTerm} years — PropReady`;
        const url = typeof window !== 'undefined' ? window.location.href : 'https://propready.live/calculator';
        try {
            if (navigator.share) {
                await navigator.share({ title: 'PropReady Bond Calculator', text, url });
                return;
            }
        } catch {
            /* user cancelled */
        }
        try {
            await navigator.clipboard.writeText(`${text}\n${url}`);
            alert('Results copied to clipboard.');
        } catch {
            alert(text);
        }
    };

    const handleExportPdf = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        let y = 16;
        const line = (label: string, val: string) => {
            doc.setFontSize(10);
            doc.text(`${label}: ${val}`, 14, y);
            y += 7;
        };
        doc.setFontSize(16);
        doc.text('PropReady Bond Calculator', 14, y);
        y += 10;
        doc.setFontSize(9);
        doc.text(`Generated ${new Date().toLocaleString('en-ZA')}`, 14, y);
        y += 10;
        line('Purchase price', formatZar(purchasePrice));
        line('Deposit', `${formatZar(deposit)} (${repayment.depositPct.toFixed(0)}%)`);
        line('Loan amount', formatZar(repayment.loanAmount));
        line('Interest rate', `${interestRate.toFixed(2)}%`);
        line('Term', `${loanTerm} years`);
        line('Monthly repayment', formatZar(repayment.monthlyRepayment));
        line('Total interest', formatZar(repayment.totalInterest));
        line('Total repayment', formatZar(repayment.totalPayable));
        if (extras.interestSaved > 0) {
            line('Interest saved (extras)', formatZar(extras.interestSaved));
            line('Months saved', String(extras.monthsSaved));
        }
        if (monthlyIncome > 0) line('Debt-to-income', `${dti.toFixed(1)}%`);
        line('Cash to close (est.)', formatZar(cash.cashToClose));
        line('Recommended', recommended.label);
        y += 4;
        doc.setFontSize(8);
        doc.text('Educational estimate only — not financial advice.', 14, y);
        doc.save(`propready-bond-${Date.now()}.pdf`);
    };

    const priceMax = 6_000_000;
    const modes: { id: Mode; label: string; icon: typeof Calculator }[] = [
        { id: 'repayment', label: 'Repayment', icon: Calculator },
        { id: 'affordability', label: 'Affordability', icon: Wallet },
        { id: 'cash', label: 'Cash to close', icon: PiggyBank },
    ];

    const whatIfPresets: Record<WhatIfTab, { label: string; apply: () => void }[]> = {
        rate: [
            { label: 'Base rate', apply: () => setInterestRate(interestRate) },
            { label: '+1% stress', apply: () => setInterestRate(Math.min(18, interestRate + 1)) },
            { label: '+2% stress', apply: () => setInterestRate(Math.min(18, interestRate + 2)) },
        ],
        extra: [
            { label: 'No extra', apply: () => setExtraMonthly(0) },
            { label: '+R500', apply: () => setExtraMonthly(500) },
            { label: '+R1,000', apply: () => setExtraMonthly(1_000) },
            { label: '+R2,500', apply: () => setExtraMonthly(2_500) },
        ],
        term: TERM_PRESETS.map((years) => ({
            label: `${years} years`,
            apply: () => setLoanTerm(years),
        })),
        deposit: DEPOSIT_PRESETS.map((pct) => ({
            label: `${pct}% deposit`,
            apply: () => setDepositPct(pct),
        })),
    };

    return (
        <div
            className={`home-landing bc-dash ${embedded ? 'bc-dash--embedded calc-portal-wrap' : ''}`}
        >
            {/* §1 Hero + summary */}
            <section className="hl-surface-dark calc-hero relative">
                <div className="bc-shell relative z-10">
                    <div className="calc-hero-grid">
                        <div>
                            <p className="hl-eyebrow hl-eyebrow--light">Financial planning</p>
                            <h1 className="hl-display text-[clamp(2.1rem,4.5vw,3.35rem)] text-white tracking-tight leading-[1.08] max-w-[18ch]">
                                Calculate your home loan in seconds.
                            </h1>
                            <p className="hl-lede hl-lede--light !max-w-xl !mt-4">
                                Adjust the values below to instantly understand your repayments,
                                affordability and lifetime borrowing costs.
                            </p>
                            <div className="bc-trust-row">
                                <span className="bc-trust-badge bc-trust-badge--light">
                                    <Zap className="w-3 h-3" /> Live calculations
                                </span>
                                <span className="bc-trust-badge bc-trust-badge--light">
                                    SA lending assumptions
                                </span>
                                <span className="bc-trust-badge bc-trust-badge--light">
                                    Instant updates
                                </span>
                            </div>
                        </div>
                        <div className="calc-panel calc-panel--dark">
                            <div className="calc-panel-body space-y-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                                    Live snapshot
                                </p>
                                <div>
                                    <p className="text-sm text-white/55">Monthly repayment</p>
                                    <p className="text-3xl font-semibold tabular-nums tracking-tight text-white mt-1">
                                        <AnimatedZar value={repayment.monthlyRepayment} />
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
                                        <p className="text-[11px] text-white/40 uppercase tracking-wide">
                                            Loan
                                        </p>
                                        <p className="text-sm font-semibold tabular-nums text-white/90 mt-0.5">
                                            <AnimatedZar value={repayment.loanAmount} />
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-white/40 uppercase tracking-wide">
                                            Deposit
                                        </p>
                                        <p className="text-sm font-semibold tabular-nums text-white/90 mt-0.5">
                                            <AnimatedZar value={deposit} />
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-white/40 uppercase tracking-wide">
                                            Rate · Term
                                        </p>
                                        <p className="text-sm font-semibold tabular-nums text-white/90 mt-0.5">
                                            {interestRate.toFixed(2)}% · {loanTerm} yrs
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-white/40 uppercase tracking-wide">
                                            Affordability
                                        </p>
                                        <p className="text-sm font-semibold tabular-nums text-white/90 mt-0.5">
                                            {affordStatus.label}
                                        </p>
                                    </div>
                                </div>
                                {extras.interestSaved > 0 ? (
                                    <p className="text-xs font-semibold text-emerald-300/90">
                                        Save ~{formatZar(extras.interestSaved)} · {extras.monthsSaved}{' '}
                                        mo sooner
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* §2 Calculator */}
            <section className="bc-spacer-section">
                <div className="bc-shell">
                    <div className="bc-card bc-card-pad">
                        <div className="bc-toolbar">
                            <div>
                                <p className="bc-section-title">Calculator</p>
                                <h2 className="bc-section-heading">Your scenario</h2>
                            </div>
                            <div className="bc-actions">
                                <button type="button" className="bc-btn" onClick={resetCalculator}>
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                                <button type="button" className="bc-btn" onClick={handleShare}>
                                    <Share2 className="w-3.5 h-3.5" />
                                    Share
                                </button>
                                <button type="button" className="bc-btn" onClick={() => void handleExportPdf()}>
                                    <Download className="w-3.5 h-3.5" />
                                    PDF
                                </button>
                                <button type="button" className="bc-btn bc-btn--primary" onClick={handleSave}>
                                    <Save className="w-3.5 h-3.5" />
                                    Save
                                </button>
                            </div>
                        </div>

                        <div className="bc-mode-tabs mb-5" role="tablist">
                            {modes.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === id}
                                    className={`bc-mode-tab ${mode === id ? 'bc-mode-tab--active' : ''}`}
                                    onClick={() => setMode(id)}
                                >
                                    <Icon className="w-3 h-3 inline mr-1 -mt-px" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="bc-grid-12">
                            {mode !== 'affordability' ? (
                                <>
                                    <div className="col-span-12 md:col-span-6">
                                        <MoneyField
                                            id="bc-price"
                                            label="Property price"
                                            value={purchasePrice}
                                            min={500_000}
                                            max={priceMax}
                                            step={25_000}
                                            onChange={(v) => {
                                                setPurchasePrice(v);
                                                if (deposit > v) setDeposit(v);
                                            }}
                                            presets={PRICE_PRESETS.map((p) => ({
                                                label: p.label,
                                                value: p.value,
                                            }))}
                                        />
                                    </div>
                                    <div className="col-span-12 md:col-span-6">
                                        <MoneyField
                                            id="bc-deposit"
                                            label="Deposit"
                                            value={deposit}
                                            min={0}
                                            max={purchasePrice}
                                            step={5_000}
                                            onChange={(v) =>
                                                setDeposit(Math.min(purchasePrice, v))
                                            }
                                            presets={DEPOSIT_PRESETS.map((pct) => ({
                                                label: `${pct}%`,
                                                value: Math.round((purchasePrice * pct) / 100),
                                            }))}
                                            formatValue={(v) =>
                                                `${formatZar(v)} · ${repayment.depositPct.toFixed(0)}%`
                                            }
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="col-span-12 md:col-span-6">
                                        <MoneyField
                                            id="bc-budget"
                                            label="Monthly comfort budget"
                                            value={monthlyBudget}
                                            min={5_000}
                                            max={60_000}
                                            step={500}
                                            onChange={setMonthlyBudget}
                                        />
                                    </div>
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="bc-field">
                                            <div className="bc-field-head">
                                                <label className="bc-field-label" htmlFor="bc-afford-dep">
                                                    Planned deposit %
                                                </label>
                                                <span className="bc-field-value">{affordDepositPct}%</span>
                                            </div>
                                            <input
                                                id="bc-afford-dep"
                                                type="range"
                                                min={5}
                                                max={40}
                                                step={1}
                                                value={affordDepositPct}
                                                onChange={(e) =>
                                                    setAffordDepositPct(Number(e.target.value))
                                                }
                                                className="bc-range"
                                            />
                                            <div className="bc-chips">
                                                {DEPOSIT_PRESETS.filter((p) => p > 0).map((pct) => (
                                                    <button
                                                        key={pct}
                                                        type="button"
                                                        className={`bc-chip ${
                                                            affordDepositPct === pct
                                                                ? 'bc-chip--active'
                                                                : ''
                                                        }`}
                                                        onClick={() => setAffordDepositPct(pct)}
                                                    >
                                                        {pct}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="col-span-12 md:col-span-4">
                                <div className="bc-field">
                                    <div className="bc-field-head">
                                        <label className="bc-field-label" htmlFor="bc-rate">
                                            Interest rate
                                        </label>
                                        <span className="bc-field-value">
                                            {interestRate.toFixed(2)}% p.a.
                                        </span>
                                    </div>
                                    <input
                                        id="bc-rate"
                                        type="range"
                                        min={8}
                                        max={18}
                                        step={0.25}
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        className="bc-range"
                                    />
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <div className="bc-field">
                                    <div className="bc-field-head">
                                        <label className="bc-field-label" htmlFor="bc-term">
                                            Loan term
                                        </label>
                                        <span className="bc-field-value">{loanTerm} years</span>
                                    </div>
                                    <input
                                        id="bc-term"
                                        type="range"
                                        min={5}
                                        max={30}
                                        step={1}
                                        value={loanTerm}
                                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                                        className="bc-range"
                                    />
                                    <div className="bc-chips">
                                        {TERM_PRESETS.map((years) => (
                                            <button
                                                key={years}
                                                type="button"
                                                className={`bc-chip ${
                                                    loanTerm === years ? 'bc-chip--active' : ''
                                                }`}
                                                onClick={() => setLoanTerm(years)}
                                            >
                                                {years}y
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <MoneyField
                                    id="bc-extra"
                                    label="Extra monthly payment"
                                    value={extraMonthly}
                                    min={0}
                                    max={5_000}
                                    step={100}
                                    onChange={setExtraMonthly}
                                    presets={[
                                        { label: 'None', value: 0 },
                                        { label: '+R500', value: 500 },
                                        { label: '+R1k', value: 1_000 },
                                        { label: '+R2.5k', value: 2_500 },
                                    ]}
                                    formatValue={(v) => (v === 0 ? 'None' : `+${formatZar(v)}`)}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <MoneyField
                                    id="bc-income"
                                    label="Monthly income (optional)"
                                    value={monthlyIncome}
                                    min={0}
                                    max={200_000}
                                    step={1_000}
                                    onChange={setMonthlyIncome}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <MoneyField
                                    id="bc-expenses"
                                    label="Monthly expenses (optional)"
                                    value={monthlyExpenses}
                                    min={0}
                                    max={100_000}
                                    step={500}
                                    onChange={setMonthlyExpenses}
                                />
                            </div>
                        </div>

                        {showSaved && saved.length > 0 ? (
                            <div className="mt-5 pt-4 border-t border-charcoal/[0.06]">
                                <p className="bc-section-title mb-2">Saved scenarios</p>
                                <div className="bc-saved-list">
                                    {saved.map((item) => (
                                        <div key={item.id} className="bc-saved-item">
                                            <button
                                                type="button"
                                                className="text-left flex-1 font-semibold hover:text-red-600"
                                                onClick={() => loadSaved(item)}
                                            >
                                                {item.label} · {formatZar(item.purchasePrice)}
                                            </button>
                                            <button
                                                type="button"
                                                className="text-charcoal/40 hover:text-red-600 text-xs"
                                                onClick={() =>
                                                    setSaved(deleteSavedBondCalculation(item.id))
                                                }
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {saved.length >= 2 ? (
                                    <div className="mt-4 overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="text-left text-charcoal/45 border-b border-charcoal/[0.06]">
                                                    <th className="py-2 pr-3 font-semibold">Scenario</th>
                                                    <th className="py-2 pr-3 font-semibold">Price</th>
                                                    <th className="py-2 pr-3 font-semibold">Rate</th>
                                                    <th className="py-2 font-semibold">Monthly (est.)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {saved.slice(0, 4).map((item) => {
                                                    const est = summariseBondRepayment({
                                                        purchasePrice: item.purchasePrice,
                                                        deposit: item.deposit,
                                                        interestRate: item.interestRate,
                                                        loanTermYears: item.loanTerm,
                                                    });
                                                    return (
                                                        <tr
                                                            key={`cmp-${item.id}`}
                                                            className="border-b border-charcoal/[0.04]"
                                                        >
                                                            <td className="py-2 pr-3 font-medium">
                                                                {item.label}
                                                            </td>
                                                            <td className="py-2 pr-3 tabular-nums">
                                                                {formatZar(item.purchasePrice)}
                                                            </td>
                                                            <td className="py-2 pr-3 tabular-nums">
                                                                {item.interestRate}%
                                                            </td>
                                                            <td className="py-2 tabular-nums font-semibold">
                                                                {formatZar(est.monthlyRepayment)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            {/* Mode-specific compact KPI strip */}
            {mode === 'affordability' ? (
                <section className="bc-spacer-section">
                    <div className="bc-shell">
                        <div className="bc-card bc-card-pad">
                            <p className="bc-section-title">Affordability</p>
                            <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1">
                                {formatZar(afford.maxPurchase)}
                            </p>
                            <p className="text-sm text-charcoal/50 mt-1">
                                Indicative ceiling at {formatZar(monthlyBudget)}/mo · {affordDepositPct}%
                                deposit · {loanTerm} years
                            </p>
                            <div className="flex gap-6 mt-3 text-sm">
                                <span>
                                    Max loan <strong>{formatZar(afford.maxLoan)}</strong>
                                </span>
                                <span>
                                    Deposit cash <strong>{formatZar(afford.depositCash)}</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {mode === 'cash' ? (
                <section className="bc-spacer-section">
                    <div className="bc-shell">
                        <div className="bc-card bc-card-pad">
                            <p className="bc-section-title">Cash to close</p>
                            <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1">
                                {formatZar(cash.cashToClose)}
                            </p>
                            <p className="text-sm text-charcoal/50 mt-1">
                                Deposit + transfer duty, attorney &amp; bond fees (estimate)
                            </p>
                        </div>
                    </div>
                </section>
            ) : null}

            {/* §3 Results dashboard */}
            <section className="bc-spacer-section">
                <div className="bc-shell space-y-4">
                    <div>
                        <p className="bc-section-title">Results</p>
                        <h2 className="bc-section-heading">Your bond at a glance</h2>
                    </div>
                    <div className="bc-kpi-grid">
                        {[
                            { label: 'Monthly payment', value: formatZar(repayment.monthlyRepayment) },
                            {
                                label: 'Total interest',
                                value: formatZar(repayment.totalInterest),
                                accent: true,
                            },
                            { label: 'Principal', value: formatZar(repayment.loanAmount) },
                            { label: 'Total repayment', value: formatZar(repayment.totalPayable) },
                            {
                                label: 'Interest saved',
                                value: formatZar(extras.interestSaved),
                                good: extras.interestSaved > 0,
                            },
                            {
                                label: 'Years saved',
                                value:
                                    extras.monthsSaved > 0
                                        ? `${(extras.monthsSaved / 12).toFixed(1)} yrs`
                                        : '—',
                            },
                            {
                                label: 'Debt-to-income',
                                value: monthlyIncome > 0 ? `${dti.toFixed(1)}%` : '—',
                            },
                            {
                                label: 'Loan-to-value',
                                value: `${repayment.ltvPct.toFixed(1)}%`,
                            },
                        ].map((kpi) => (
                            <div key={kpi.label} className="bc-kpi">
                                <p className="bc-kpi-label">{kpi.label}</p>
                                <p
                                    className={`bc-kpi-value ${
                                        kpi.accent ? 'bc-kpi-value--accent' : ''
                                    } ${kpi.good ? 'bc-kpi-value--good' : ''}`}
                                >
                                    {kpi.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="bc-card bc-card-pad">
                        <div className="bc-chart-tabs" role="tablist">
                            {CHART_TAB_CONFIG.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={chartTab === tab.id}
                                    className={`bc-chart-tab ${
                                        chartTab === tab.id ? 'bc-chart-tab--active' : ''
                                    }`}
                                    onClick={() => setChartTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="bc-chart-frame">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="bcChartFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,28,0.06)" />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#888' }} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#888' }}
                                        tickFormatter={(v) =>
                                            v >= 1_000_000
                                                ? `R${(v / 1_000_000).toFixed(1)}m`
                                                : v >= 1000
                                                  ? `R${(v / 1000).toFixed(0)}k`
                                                  : `R${v}`
                                        }
                                        width={52}
                                    />
                                    <Tooltip
                                        formatter={(v: number) => formatZar(v)}
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: '1px solid rgba(28,28,28,0.08)',
                                            fontSize: 12,
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#dc2626"
                                        strokeWidth={2}
                                        fill="url(#bcChartFill)"
                                        animationDuration={400}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`bc-badge bc-badge--${affordStatus.band}`}>
                                {affordStatus.label}
                            </span>
                            <span className="text-xs text-charcoal/45">{affordStatus.hint}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* §4 Smart comparison */}
            <section className="bc-spacer-section">
                <div className="bc-shell">
                    <p className="bc-section-title">Smart comparison</p>
                    <h2 className="bc-section-heading mb-4">Three repayment paths</h2>
                    <div className="bc-compare-grid">
                        {scenarios.map((s) => (
                            <div
                                key={s.id}
                                className={`bc-compare-card ${s.recommended ? 'bc-compare-card--rec' : ''}`}
                            >
                                {s.recommended ? (
                                    <span className="bc-compare-rec">Recommended</span>
                                ) : null}
                                <p className="font-semibold text-sm mb-3">{s.label}</p>
                                {[
                                    ['Monthly payment', formatZar(s.monthly)],
                                    ['Interest paid', formatZar(s.interestPaid)],
                                    [
                                        'Loan duration',
                                        `${s.durationYears} yrs (${s.durationMonths} mo)`,
                                    ],
                                    ['Interest saved', formatZar(s.interestSaved)],
                                    ['Total cost', formatZar(s.totalCost)],
                                ].map(([label, val]) => (
                                    <div key={label} className="bc-compare-metric">
                                        <span className="text-charcoal/50">{label}</span>
                                        <span className="font-semibold tabular-nums">{val}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* §5 What if */}
            <section className="bc-spacer-section">
                <div className="bc-shell">
                    <div className="bc-card bc-card-pad">
                        <p className="bc-section-title">What if?</p>
                        <h2 className="bc-section-heading">Instant scenario simulator</h2>
                        <div className="bc-chart-tabs mt-4" role="tablist">
                            {(
                                [
                                    ['rate', 'Interest rate'],
                                    ['extra', 'Extra payments'],
                                    ['term', 'Loan term'],
                                    ['deposit', 'Deposit'],
                                ] as const
                            ).map(([id, label]) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`bc-chart-tab ${
                                        whatIfTab === id ? 'bc-chart-tab--active' : ''
                                    }`}
                                    onClick={() => setWhatIfTab(id)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="bc-whatif-presets">
                            {whatIfPresets[whatIfTab].map((p) => (
                                <button
                                    key={p.label}
                                    type="button"
                                    className="bc-whatif-preset"
                                    onClick={p.apply}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {whatIfTab === 'rate' ? (
                            <div className="mt-4 grid sm:grid-cols-3 gap-3">
                                {stress.map((row) => (
                                    <div
                                        key={row.bump}
                                        className="bc-kpi"
                                    >
                                        <p className="bc-kpi-label">
                                            {row.bump === 0 ? 'Base' : `+${row.bump}%`}
                                        </p>
                                        <p className="bc-kpi-value">{formatZar(row.monthly)}</p>
                                        <p className="text-[10px] text-charcoal/40 mt-1">
                                            {row.rate.toFixed(2)}% p.a.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-charcoal/50">
                                Tap a preset above — all KPIs and the chart update instantly.
                                {whatIfTab === 'term' ? ` Recommended: ${termRec.reason}` : ''}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* §6 AI insights */}
            <section className="bc-spacer-section">
                <div className="bc-shell">
                    <p className="bc-section-title">AI insights</p>
                    <h2 className="bc-section-heading mb-4">Personalised recommendations</h2>
                    <div className="bc-insight-grid">
                        {insights.map((insight) => (
                            <div key={insight.id} className="bc-insight">
                                <span className="bc-insight-icon">
                                    <Lightbulb className="w-4 h-4" />
                                </span>
                                <div>
                                    <p className="font-semibold text-sm">{insight.title}</p>
                                    <p className="text-xs text-charcoal/55 mt-1 leading-relaxed">
                                        {insight.body}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <p className="bc-shell mt-2 mb-4 text-center text-[11px] text-charcoal/40 max-w-2xl mx-auto">
                Educational estimates only. Actual rates, fees and affordability depend on your
                credit profile and bank assessment.
            </p>

            {/* Sticky summary — desktop */}
            <div className={`bc-sticky hidden lg:block ${stickyVisible ? 'bc-sticky--visible' : ''}`}>
                <div className="bc-sticky-inner">
                    <div className="bc-sticky-metrics">
                        <div className="bc-sticky-metric">
                            <span>Monthly</span>
                            <span>{formatZar(repayment.monthlyRepayment)}</span>
                        </div>
                        <div className="bc-sticky-metric">
                            <span>Interest saved</span>
                            <span>{formatZar(extras.interestSaved)}</span>
                        </div>
                        <div className="bc-sticky-metric">
                            <span>Term</span>
                            <span>{loanTerm} yrs</span>
                        </div>
                        <div className="bc-sticky-metric">
                            <span>Recommended</span>
                            <span>{recommended.label}</span>
                        </div>
                        <div className="bc-sticky-metric">
                            <span>Extra / mo</span>
                            <span>{extraMonthly ? formatZar(extraMonthly) : '—'}</span>
                        </div>
                    </div>
                    <div className="bc-actions">
                        <button type="button" className="bc-btn" onClick={() => void handleExportPdf()}>
                            <Download className="w-3.5 h-3.5" />
                            Export PDF
                        </button>
                        <button type="button" className="bc-btn bc-btn--primary" onClick={handleSave}>
                            <Save className="w-3.5 h-3.5" />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
