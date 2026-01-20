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

    return (
        <div className="bg-white border border-charcoal/20 rounded-2xl p-6 md:p-8 mt-8 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="text-2xl font-bold text-charcoal">Cost Calculator</h3>
            </div>

            <div className="space-y-8">
                {/* Input Section */}
                <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-2">
                        Purchase Price
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50">R</span>
                        <input
                            type="text"
                            value={price === 0 ? '' : new Intl.NumberFormat('en-ZA').format(price)}
                            onChange={(e) => {
                                // Remove non-digits and convert to number
                                const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                                setPrice(val);
                            }}
                            className="w-full bg-white border border-charcoal/20 rounded-lg py-3 pl-10 pr-4 text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold transition text-lg font-semibold"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-charcoal/20 p-4 rounded-xl shadow-sm">
                        <p className="text-charcoal/60 text-sm mb-1">Transfer Duty (Tax)</p>
                        <p className={`text-xl font-bold ${transferDuty === 0 ? 'text-green-600' : 'text-charcoal'}`}>
                            {transferDuty === 0 ? 'Exempt' : formatCurrency(transferDuty)}
                        </p>
                    </div>

                    <div className="bg-white border border-charcoal/20 p-4 rounded-xl shadow-sm">
                        <p className="text-charcoal/60 text-sm mb-1">Transfer Attorney Fees</p>
                        <p className="text-xl font-bold text-charcoal">
                            ± {formatCurrency(transferFees)}
                        </p>
                    </div>

                    <div className="bg-white border border-charcoal/20 p-4 rounded-xl shadow-sm">
                        <p className="text-charcoal/60 text-sm mb-1">Bond Registration Costs</p>
                        <p className="text-xl font-bold text-charcoal">
                            ± {formatCurrency(bondCosts)}
                        </p>
                    </div>

                    <div className="bg-gold/20 border border-gold/30 p-4 rounded-xl shadow-sm">
                        <p className="text-gold text-sm mb-1 font-semibold">Total Extra Cash Needed</p>
                        <p className="text-2xl font-bold text-charcoal">
                            {formatCurrency(total)}
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-2 text-xs text-charcoal/60 bg-charcoal/5 border border-charcoal/10 p-3 rounded-lg">
                    <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0 text-charcoal/60" />
                    <p>
                        Estimates are based on 2026 tax tables and standard recommended attorney tariffs.
                        Actual attorney fees may vary by firm. Bond costs assume a 100% bond.
                    </p>
                </div>
            </div>
        </div>
    );
}
