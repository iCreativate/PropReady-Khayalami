'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Calculator, TrendingUp, DollarSign, Calendar, Percent } from 'lucide-react';

export default function BondCalculatorPage() {
    const [purchasePrice, setPurchasePrice] = useState<number>(0);
    const [deposit, setDeposit] = useState<number>(0);
    const [interestRate, setInterestRate] = useState<number>(11.75);
    const [loanTerm, setLoanTerm] = useState<number>(20);
    const [monthlyRepayment, setMonthlyRepayment] = useState<number>(0);
    const [totalInterest, setTotalInterest] = useState<number>(0);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [loanAmount, setLoanAmount] = useState<number>(0);

    useEffect(() => {
        calculateBond();
    }, [purchasePrice, deposit, interestRate, loanTerm]);

    const calculateBond = () => {
        const loan = purchasePrice - deposit;
        setLoanAmount(loan);

        if (loan <= 0 || interestRate <= 0 || loanTerm <= 0) {
            setMonthlyRepayment(0);
            setTotalInterest(0);
            setTotalAmount(0);
            return;
        }

        // Convert annual interest rate to monthly
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = loanTerm * 12;

        // Calculate monthly repayment using the standard loan formula
        // M = P [r(1+r)^n] / [(1+r)^n - 1]
        const monthlyPayment = loan * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                              (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

        const totalPaid = monthlyPayment * numberOfPayments;
        const interestPaid = totalPaid - loan;

        setMonthlyRepayment(Math.round(monthlyPayment));
        setTotalInterest(Math.round(interestPaid));
        setTotalAmount(Math.round(totalPaid));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-ZA').format(num);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/10">
                <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-charcoal text-xl font-bold">PropReady</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/learn" className="text-charcoal/90 hover:text-charcoal transition">
                                Learning Center for Buyers
                            </Link>
                            <Link
                                href="/sellers"
                                className="px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition"
                            >
                                For Sellers
                            </Link>
                            <Link href="/search" className="text-charcoal/90 hover:text-charcoal transition">
                                Properties
                            </Link>
                            <Link href="/calculator" className="text-gold font-semibold">
                                Bond Calculator
                            </Link>
                            <Link href="/dashboard" className="text-charcoal/90 hover:text-charcoal transition">
                                Dashboard
                            </Link>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="px-4 py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-all"
                    >
                        Back to Home
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative px-4 pt-24 pb-8">
                <div className="container mx-auto max-w-5xl relative z-10">
                    {/* Page Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gold rounded-full mb-4">
                            <Calculator className="w-8 h-8 text-charcoal" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-2">
                            Bond Calculator
                        </h1>
                        <p className="text-charcoal/80 text-lg">
                            Calculate your monthly bond repayments and total interest
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Input Section */}
                        <div className="lg:col-span-2">
                            <div className="premium-card rounded-2xl p-8">
                                <h2 className="text-2xl font-bold text-charcoal mb-6">Loan Details</h2>

                                <div className="space-y-6">
                                    {/* Purchase Price */}
                                    <div>
                                        <label className="block text-charcoal/70 font-semibold mb-2 text-sm">
                                            Purchase Price
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                            <input
                                                type="text"
                                                value={purchasePrice === 0 ? '' : formatNumber(purchasePrice)}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                                                    setPurchasePrice(val);
                                                }}
                                                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold text-lg font-semibold"
                                                placeholder="e.g. 1,000,000"
                                            />
                                        </div>
                                    </div>

                                    {/* Deposit */}
                                    <div>
                                        <label className="block text-charcoal/70 font-semibold mb-2 text-sm">
                                            Deposit Amount
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                            <input
                                                type="text"
                                                value={deposit === 0 ? '' : formatNumber(deposit)}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                                                    setDeposit(val);
                                                }}
                                                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold text-lg font-semibold"
                                                placeholder="e.g. 100,000"
                                            />
                                        </div>
                                        {purchasePrice > 0 && (
                                            <p className="text-charcoal/50 text-sm mt-2">
                                                Deposit: {((deposit / purchasePrice) * 100).toFixed(1)}% of purchase price
                                            </p>
                                        )}
                                    </div>

                                    {/* Interest Rate */}
                                    <div>
                                        <label className="block text-charcoal/70 font-semibold mb-2 text-sm">
                                            Interest Rate (% per annum)
                                        </label>
                                        <div className="relative">
                                            <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                            <input
                                                type="number"
                                                value={interestRate}
                                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                                min="0"
                                                max="30"
                                                step="0.25"
                                                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold text-lg font-semibold"
                                            />
                                        </div>
                                        <input
                                            type="range"
                                            min="8"
                                            max="18"
                                            step="0.25"
                                            value={interestRate}
                                            onChange={(e) => setInterestRate(Number(e.target.value))}
                                            className="w-full mt-4 accent-gold h-2 bg-charcoal/20 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-charcoal/50 text-sm mt-1">
                                            <span>8%</span>
                                            <span>18%</span>
                                        </div>
                                    </div>

                                    {/* Loan Term */}
                                    <div>
                                        <label className="block text-charcoal/70 font-semibold mb-2 text-sm">
                                            Loan Term (years)
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                                            <input
                                                type="number"
                                                value={loanTerm}
                                                onChange={(e) => setLoanTerm(Number(e.target.value))}
                                                min="5"
                                                max="30"
                                                step="1"
                                                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-charcoal/20 text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold text-lg font-semibold"
                                            />
                                        </div>
                                        <input
                                            type="range"
                                            min="5"
                                            max="30"
                                            step="1"
                                            value={loanTerm}
                                            onChange={(e) => setLoanTerm(Number(e.target.value))}
                                            className="w-full mt-4 accent-gold h-2 bg-charcoal/20 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-charcoal/50 text-sm mt-1">
                                            <span>5 years</span>
                                            <span>30 years</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Section */}
                        <div className="space-y-6">
                            {/* Loan Amount */}
                            <div className="premium-card rounded-2xl p-6">
                                <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Loan Amount</p>
                                <p className="text-3xl font-bold text-charcoal">
                                    {formatCurrency(loanAmount)}
                                </p>
                            </div>

                            {/* Monthly Repayment */}
                            <div className="premium-card rounded-2xl p-6 border-2 border-gold/30 bg-gradient-to-br from-gold/5 to-gold/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-5 h-5 text-gold" />
                                    <p className="text-charcoal/50 text-xs font-medium uppercase tracking-wide">Monthly Repayment</p>
                                </div>
                                <p className="text-4xl font-bold text-gold">
                                    {formatCurrency(monthlyRepayment)}
                                </p>
                                <p className="text-charcoal/50 text-xs mt-2">
                                    {loanTerm * 12} payments over {loanTerm} {loanTerm === 1 ? 'year' : 'years'}
                                </p>
                            </div>

                            {/* Total Interest */}
                            <div className="premium-card rounded-2xl p-6">
                                <p className="text-charcoal/50 text-xs font-medium mb-2 uppercase tracking-wide">Total Interest</p>
                                <p className="text-2xl font-bold text-charcoal">
                                    {formatCurrency(totalInterest)}
                                </p>
                            </div>

                            {/* Total Amount */}
                            <div className="premium-card rounded-2xl p-6 bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20">
                                <p className="text-gold text-xs mb-2 font-semibold uppercase tracking-wide">Total Amount Payable</p>
                                <p className="text-3xl font-bold text-charcoal">
                                    {formatCurrency(totalAmount)}
                                </p>
                                <p className="text-charcoal/50 text-xs mt-2">
                                    Loan amount + Interest
                                </p>
                            </div>

                            {/* Info Box */}
                            <div className="premium-card rounded-xl p-4 bg-blue-50 border border-blue-100">
                                <p className="text-charcoal/70 text-sm leading-relaxed">
                                    <strong className="text-charcoal">Note:</strong> This is an estimate. Actual rates may vary based on your credit profile and the bank&apos;s assessment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
                </div>
            </main>
        </div>
    );
}

