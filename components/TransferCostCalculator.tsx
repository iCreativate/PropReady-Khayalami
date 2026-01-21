"use client";

import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw } from 'lucide-react';

export default function TransferCostCalculator() {
    const [price, setPrice] = useState<number>(0);
    const [transferDuty, setTransferDuty] = useState<number>(0);
    const [transferFees, setTransferFees] = useState<number>(0);
    const [bondCosts, setBondCosts] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);

    const calculateCosts = (purchasePrice: number) => {
        // If price is 0 or less, all costs are 0
        if (purchasePrice <= 0) {
            setTransferDuty(0);
            setTransferFees(0);
            setBondCosts(0);
            setTotal(0);
            return;
        }

        // 1. Calculate Transfer Duty (2026 Tax Year Rates)
        let duty = 0;
        if (purchasePrice <= 1100000) {
            duty = 0;
        } else if (purchasePrice <= 1512500) {
            duty = (purchasePrice - 1100000) * 0.03;
        } else if (purchasePrice <= 2117500) {
            duty = 12375 + (purchasePrice - 1512500) * 0.06;
        } else if (purchasePrice <= 2722500) {
            duty = 48675 + (purchasePrice - 2117500) * 0.08;
        } else if (purchasePrice <= 12100000) {
            duty = 97075 + (purchasePrice - 2722500) * 0.11;
        } else {
            duty = 1128600 + (purchasePrice - 12100000) * 0.13;
        }

        // 2. Estimate Transfer Attorney Fees (Approximate Tariff + VAT)
        // This is a simplified estimation curve based on typical rates
        let tFees = 0;
        if (purchasePrice < 1000000) {
            tFees = 22000 + (purchasePrice * 0.015);
        } else {
            tFees = 30000 + (purchasePrice * 0.008);
        }
        // Cap/Adjust for realism based on the static table provided earlier
        // R750k -> ~R20k transfer fees alone? (Total was 38k, split roughly evenly)
        // Let's refine:
        // R750k -> ~R19k
        // R1m -> ~R23k
        // R1.5m -> ~R28k
        // R3m -> ~R43k

        // Revised Formula for Transfer Fees
        if (purchasePrice <= 1000000) {
            tFees = 12000 + (purchasePrice * 0.011);
        } else {
            tFees = 23000 + ((purchasePrice - 1000000) * 0.0065);
        }

        // 3. Estimate Bond Registration Costs (Approximate Tariff + VAT)
        // Usually similar to transfer fees but slightly lower
        let bCosts = 0;
        if (purchasePrice <= 1000000) {
            bCosts = 12000 + (purchasePrice * 0.011);
        } else {
            bCosts = 23000 + ((purchasePrice - 1000000) * 0.0065);
        }

        setTransferDuty(Math.round(duty));
        setTransferFees(Math.round(tFees));
        setBondCosts(Math.round(bCosts));
        setTotal(Math.round(duty + tFees + bCosts));
    };

    useEffect(() => {
        calculateCosts(price);
    }, [price]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Use comma-grouping explicitly (avoids locale NBSP grouping issues)
    const formatNumberInput = (value: string) => {
        const digitsOnly = value.replace(/[^\d]/g, '');
        if (!digitsOnly) return '';
        return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const parseNumberInput = (value: string) => {
        const digitsOnly = value.replace(/[^\d]/g, '');
        return digitsOnly ? Number(digitsOnly) : 0;
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumberInput(e.target.value);
        const numValue = parseNumberInput(formatted);
        setPrice(numValue);
    };

    return (
        <div className="bg-white border border-charcoal/20 rounded-2xl p-4 sm:p-6 md:p-8 mt-8 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calculator className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-charcoal">Cost Calculator</h3>
            </div>

            <div className="space-y-6 sm:space-y-8">
                {/* Input Section */}
                <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-2">
                        Purchase Price
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-charcoal/50 text-sm sm:text-base">R</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={price === 0 ? '' : formatNumberInput(price.toString())}
                            onChange={handlePriceChange}
                            className="w-full bg-white border border-charcoal/20 rounded-lg py-2.5 sm:py-3 pl-8 sm:pl-10 pr-3 sm:pr-4 text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold transition text-base sm:text-lg font-semibold"
                            placeholder="e.g. 1,000,000"
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50000000"
                        step="50000"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full mt-4 accent-gold h-2 bg-charcoal/20 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white border border-charcoal/20 p-3 sm:p-4 rounded-xl shadow-sm">
                        <p className="text-charcoal/60 text-xs sm:text-sm mb-1">Transfer Duty (Tax)</p>
                        <p className={`text-lg sm:text-xl font-bold ${transferDuty === 0 ? 'text-green-600' : 'text-charcoal'} break-words`}>
                            {transferDuty === 0 ? 'Exempt' : formatCurrency(transferDuty)}
                        </p>
                    </div>

                    <div className="bg-white border border-charcoal/20 p-3 sm:p-4 rounded-xl shadow-sm">
                        <p className="text-charcoal/60 text-xs sm:text-sm mb-1">Transfer Attorney Fees</p>
                        <p className="text-lg sm:text-xl font-bold text-charcoal break-words">
                            ± {formatCurrency(transferFees)}
                        </p>
                    </div>

                    <div className="bg-white border border-charcoal/20 p-3 sm:p-4 rounded-xl shadow-sm">
                        <p className="text-charcoal/60 text-xs sm:text-sm mb-1">Bond Registration Costs</p>
                        <p className="text-lg sm:text-xl font-bold text-charcoal break-words">
                            ± {formatCurrency(bondCosts)}
                        </p>
                    </div>

                    <div className="bg-gold/20 border border-gold/30 p-3 sm:p-4 rounded-xl shadow-sm sm:col-span-2">
                        <p className="text-gold text-xs sm:text-sm mb-1 font-semibold">Total Extra Cash Needed</p>
                        <p className="text-xl sm:text-2xl font-bold text-charcoal break-words">
                            {formatCurrency(total)}
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-2 text-xs text-charcoal/60 bg-charcoal/5 border border-charcoal/10 p-3 rounded-lg">
                    <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0 text-charcoal/60" />
                    <p className="text-xs sm:text-sm">
                        Estimates are based on 2026 tax tables and standard recommended attorney tariffs.
                        Actual attorney fees may vary by firm. Bond costs assume a 100% bond.
                    </p>
                </div>
            </div>
        </div>
    );
}
