'use client';

import { useEffect, useState } from 'react';
import {
    Calculator,
    Calendar,
    Percent,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PortalPageHeader from '@/components/PortalPageHeader';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import {
    PORTAL_CALLOUT,
    PORTAL_CARD,
    PORTAL_CARD_BODY,
    PORTAL_CARD_HEADER,
    PORTAL_FORM_HINT,
    PORTAL_FORM_INPUT,
    PORTAL_FORM_LABEL,
    PORTAL_PAGE_CONTAINER,
    PORTAL_STAT_ICON,
} from '@/lib/portal-ui';

export default function BondCalculatorPage() {
    const { user } = useHydratedBuyerPortalUser();
    const [purchasePrice, setPurchasePrice] = useState(0);
    const [deposit, setDeposit] = useState(0);
    const [interestRate, setInterestRate] = useState(11.75);
    const [loanTerm, setLoanTerm] = useState(20);
    const [monthlyRepayment, setMonthlyRepayment] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [loanAmount, setLoanAmount] = useState(0);

    useEffect(() => {
        const loan = purchasePrice - deposit;
        setLoanAmount(loan);

        if (loan <= 0 || interestRate <= 0 || loanTerm <= 0) {
            setMonthlyRepayment(0);
            setTotalInterest(0);
            setTotalAmount(0);
            return;
        }

        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = loanTerm * 12;
        const monthlyPayment =
            (loan * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        const totalPaid = monthlyPayment * numberOfPayments;

        setMonthlyRepayment(Math.round(monthlyPayment));
        setTotalInterest(Math.round(totalPaid - loan));
        setTotalAmount(Math.round(totalPaid));
    }, [purchasePrice, deposit, interestRate, loanTerm]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    const formatNumber = (num: number) => new Intl.NumberFormat('en-ZA').format(num);

    const pageHeader = (
        <PortalPageHeader
            variant="premium"
            eyebrow="Home finance"
            title="Bond Calculator"
            description="Estimate monthly repayments, total interest, and what you’ll pay over the life of the loan. Actual bank rates may differ."
        />
    );

    const calculatorPublicHeader = (
        <PublicSiteHeader
            backHref="/"
            backLabel="Back to Home"
            showDesktopNav={false}
            mobileLinks={[]}
        />
    );

    const depositPct =
        purchasePrice > 0 ? ((deposit / purchasePrice) * 100).toFixed(1) : null;

    return (
        <BuyerPortalShell
            activePage="calculator"
            title="Bond Calculator"
            pageHeader={pageHeader}
            publicChrome={calculatorPublicHeader}
        >
            <div className={`${PORTAL_PAGE_CONTAINER} relative z-10 space-y-6 sm:space-y-8`}>
                {!user && <div className="mb-2">{pageHeader}</div>}

                <a
                    href="/calculator/smart-bond"
                    className={`${PORTAL_CALLOUT} flex flex-wrap items-center justify-between gap-3 transition hover:border-gold/30`}
                >
                    <div>
                        <p className="text-sm font-semibold text-charcoal">New · Smart Bond Optimizer</p>
                        <p className="mt-0.5 text-sm text-charcoal/60">
                            Go beyond basic repayments — equity, scenarios, refinance education, and wealth planning.
                        </p>
                    </div>
                    <span className="text-sm font-semibold text-gold">Open flagship tool →</span>
                </a>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                    {/* Inputs */}
                    <section className={`lg:col-span-3 ${PORTAL_CARD}`}>
                        <div className={PORTAL_CARD_HEADER}>
                            <div className="flex items-start gap-3.5">
                                <div className={PORTAL_STAT_ICON}>
                                    <Calculator className="w-5 h-5 text-gold" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-charcoal tracking-tight">
                                        Loan details
                                    </h2>
                                    <p className="text-sm text-charcoal/50 mt-0.5">
                                        Enter price, deposit, rate, and term to see repayments.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={`${PORTAL_CARD_BODY} !px-6 sm:!px-8 !py-6 sm:!py-8 space-y-6`}>
                            <div>
                                <label htmlFor="calc-purchase-price" className={PORTAL_FORM_LABEL}>
                                    Purchase price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gold pointer-events-none">
                                        R
                                    </span>
                                    <input
                                        id="calc-purchase-price"
                                        name="purchasePrice"
                                        type="text"
                                        inputMode="numeric"
                                        value={purchasePrice === 0 ? '' : formatNumber(purchasePrice)}
                                        onChange={(e) => {
                                            setPurchasePrice(
                                                Number(e.target.value.replace(/[^0-9]/g, '')) || 0
                                            );
                                        }}
                                        className={`${PORTAL_FORM_INPUT} !pl-9 !py-3.5 text-base font-semibold tabular-nums`}
                                        placeholder="e.g. 1 850 000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="calc-deposit" className={PORTAL_FORM_LABEL}>
                                    Deposit amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gold pointer-events-none">
                                        R
                                    </span>
                                    <input
                                        id="calc-deposit"
                                        name="deposit"
                                        type="text"
                                        inputMode="numeric"
                                        value={deposit === 0 ? '' : formatNumber(deposit)}
                                        onChange={(e) => {
                                            setDeposit(
                                                Number(e.target.value.replace(/[^0-9]/g, '')) || 0
                                            );
                                        }}
                                        className={`${PORTAL_FORM_INPUT} !pl-9 !py-3.5 text-base font-semibold tabular-nums`}
                                        placeholder="e.g. 185 000"
                                    />
                                </div>
                                {depositPct !== null && (
                                    <p className={PORTAL_FORM_HINT}>
                                        Deposit: {depositPct}% of purchase price
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="calc-interest-rate" className={PORTAL_FORM_LABEL}>
                                    Interest rate (% per annum)
                                </label>
                                <div className="relative">
                                    <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35 pointer-events-none" />
                                    <input
                                        id="calc-interest-rate"
                                        name="interestRate"
                                        type="number"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        min={0}
                                        max={30}
                                        step={0.25}
                                        className={`${PORTAL_FORM_INPUT} !py-3.5 text-base font-semibold tabular-nums`}
                                    />
                                </div>
                                <input
                                    id="calc-interest-rate-slider"
                                    name="interestRateSlider"
                                    type="range"
                                    min={8}
                                    max={18}
                                    step={0.25}
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                    className="w-full mt-4 accent-gold h-2 bg-charcoal/[0.08] rounded-lg appearance-none cursor-pointer"
                                    aria-label="Interest rate slider"
                                />
                                <div className="flex justify-between text-charcoal/40 text-xs mt-1.5">
                                    <span>8%</span>
                                    <span>18%</span>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="calc-loan-term" className={PORTAL_FORM_LABEL}>
                                    Loan term (years)
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35 pointer-events-none" />
                                    <input
                                        id="calc-loan-term"
                                        name="loanTerm"
                                        type="number"
                                        value={loanTerm}
                                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                                        min={5}
                                        max={30}
                                        step={1}
                                        className={`${PORTAL_FORM_INPUT} !py-3.5 text-base font-semibold tabular-nums`}
                                    />
                                </div>
                                <input
                                    id="calc-loan-term-slider"
                                    name="loanTermSlider"
                                    type="range"
                                    min={5}
                                    max={30}
                                    step={1}
                                    value={loanTerm}
                                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                                    className="w-full mt-4 accent-gold h-2 bg-charcoal/[0.08] rounded-lg appearance-none cursor-pointer"
                                    aria-label="Loan term slider"
                                />
                                <div className="flex justify-between text-charcoal/40 text-xs mt-1.5">
                                    <span>5 years</span>
                                    <span>30 years</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Results */}
                    <aside className="lg:col-span-2 space-y-4 sm:space-y-5">
                        <div className={`${PORTAL_CARD} p-5 sm:p-6`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`${PORTAL_STAT_ICON} !w-10 !h-10`}>
                                    <Wallet className="w-4 h-4 text-gold" />
                                </div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal/45">
                                    Loan amount
                                </p>
                            </div>
                            <p className="text-2xl sm:text-3xl font-semibold text-charcoal tabular-nums tracking-tight">
                                {formatCurrency(Math.max(0, loanAmount))}
                            </p>
                            <p className="text-xs text-charcoal/45 mt-1.5">Purchase price − deposit</p>
                        </div>

                        <div
                            className={`${PORTAL_CARD} p-5 sm:p-6 border-gold/20 bg-gradient-to-br from-gold/[0.07] via-white to-white`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-gold" />
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal/45">
                                    Monthly repayment
                                </p>
                            </div>
                            <p className="text-3xl sm:text-4xl font-semibold text-gold tabular-nums tracking-tight">
                                {formatCurrency(monthlyRepayment)}
                            </p>
                            <p className="text-xs text-charcoal/45 mt-2">
                                {loanTerm * 12} payments over {loanTerm}{' '}
                                {loanTerm === 1 ? 'year' : 'years'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
                            <div className={`${PORTAL_CARD} p-5 sm:p-6`}>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal/45 mb-2">
                                    Total interest
                                </p>
                                <p className="text-xl sm:text-2xl font-semibold text-charcoal tabular-nums">
                                    {formatCurrency(totalInterest)}
                                </p>
                            </div>
                            <div className={`${PORTAL_CARD} p-5 sm:p-6`}>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold mb-2">
                                    Total payable
                                </p>
                                <p className="text-xl sm:text-2xl font-semibold text-charcoal tabular-nums">
                                    {formatCurrency(totalAmount)}
                                </p>
                                <p className="text-xs text-charcoal/45 mt-1.5">Loan + interest</p>
                            </div>
                        </div>

                        <div className={PORTAL_CALLOUT}>
                            <p className="text-sm text-charcoal/70 leading-relaxed">
                                <span className="font-semibold text-charcoal">Note:</span> This is an
                                estimate only. Actual rates depend on your credit profile and the
                                bank’s assessment.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </BuyerPortalShell>
    );
}
