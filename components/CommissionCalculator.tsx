"use client";

import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function CommissionCalculator() {
    const [sellingPrice, setSellingPrice] = useState<string>('');
    const [commissionRate, setCommissionRate] = useState<string>('5');

    // Format number with commas
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-ZA').format(num);
    };

    // Parse input value by removing commas
    const parseInputValue = (value: string) => {
        return value.replace(/,/g, '');
    };

    // Handle selling price input change
    const handleSellingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = parseInputValue(e.target.value);
        // Only allow numbers
        if (rawValue === '' || /^\d+$/.test(rawValue)) {
            const numValue = rawValue === '' ? '' : formatNumber(parseFloat(rawValue));
            setSellingPrice(numValue);
        }
    };

    const price = parseFloat(parseInputValue(sellingPrice)) || 0;
    const rate = parseFloat(commissionRate) || 0;
    
    const commissionAmount = (price * rate) / 100;
    const vatAmount = commissionAmount * 0.15;
    const totalCommission = commissionAmount + vatAmount;
    const netProceeds = price - totalCommission;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-gold" />
                </div>
                <h4 className="font-bold text-charcoal text-lg">Commission Calculator</h4>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">
                        Selling Price (R)
                    </label>
                    <input
                        type="text"
                        value={sellingPrice}
                        onChange={handleSellingPriceChange}
                        placeholder="Enter selling price (e.g., 1,000,000)"
                        className="w-full px-4 py-3 border border-charcoal/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">
                        Commission Rate (%)
                    </label>
                    <input
                        type="number"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="e.g., 5"
                        className="w-full px-4 py-3 border border-charcoal/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition"
                    />
                    <p className="text-xs text-charcoal/50 mt-1">
                        Typical range: 3% - 8% (plus VAT)
                    </p>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-charcoal/80">
                            <strong>Note:</strong> Agents typically share a percentage of their commission with the agency they work with. Not all of the commission goes directly to the individual agent.
                        </p>
                    </div>
                </div>
            </div>

            {price > 0 && rate > 0 && (
                <div className="mt-6 space-y-4">
                    <div className="premium-card p-6 rounded-xl border border-charcoal/20 bg-gradient-to-br from-gold/5 to-gold/10">
                        <h5 className="font-semibold text-charcoal mb-4">Commission Breakdown</h5>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-charcoal/10">
                                <span className="text-charcoal/70">Commission ({rate}%):</span>
                                <span className="font-semibold text-charcoal">{formatCurrency(commissionAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-charcoal/10">
                                <span className="text-charcoal/70">VAT (15%):</span>
                                <span className="font-semibold text-charcoal">{formatCurrency(vatAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-t-2 border-gold/30 pt-3">
                                <span className="font-bold text-charcoal">Total Commission:</span>
                                <span className="font-bold text-gold text-lg">{formatCurrency(totalCommission)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-6 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-white to-gold/5">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-charcoal text-lg">Net Proceeds:</span>
                            <span className="font-bold text-gold text-2xl">{formatCurrency(netProceeds)}</span>
                        </div>
                        <p className="text-xs text-charcoal/50 mt-2">
                            Amount you'll receive after agent commission (excluding other costs)
                        </p>
                    </div>
                </div>
            )}

            {price > 0 && rate > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-charcoal/80">
                        <strong>Note:</strong> This calculation only includes agent commission. Remember to account for other costs such as bond cancellation fees, rates & taxes, and any repairs or staging expenses.
                    </p>
                </div>
            )}
        </div>
    );
}
