'use client';

import { useState } from 'react';

// Format number input with commas
const formatNumberInput = (value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, '');
    if (!digitsOnly) return '';
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Parse number from formatted string
const parseNumberInput = (value: string): number => {
    const digitsOnly = value.replace(/[^\d]/g, '');
    return digitsOnly ? Number(digitsOnly) : 0;
};

export default function ROICalculator() {
    const [purchasePrice, setPurchasePrice] = useState('');
    const [annualRental, setAnnualRental] = useState('');
    const [annualExpenses, setAnnualExpenses] = useState('');

    // Calculate net annual profit
    const netProfit = parseNumberInput(annualRental) - parseNumberInput(annualExpenses);

    return (
        <div className="space-y-4">
            <h4 className="font-bold text-charcoal text-lg mb-4">ROI Calculation Worksheet</h4>
            <div className="space-y-3">
                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-2">Property Purchase Price</label>
                    <input
                        type="text"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-2">Annual Rental Income</label>
                    <input
                        type="text"
                        value={annualRental}
                        onChange={(e) => setAnnualRental(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-4 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-2">Annual Expenses (rates, levies, maintenance, etc.)</label>
                    <input
                        type="text"
                        value={annualExpenses}
                        onChange={(e) => setAnnualExpenses(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-4 bg-gold/10 rounded-lg border border-gold/30">
                    <p className="text-sm font-semibold text-charcoal mb-1">Net Annual Profit</p>
                    <p className="text-2xl font-bold text-gold">
                        R {netProfit.toLocaleString('en-US')}
                    </p>
                </div>
            </div>
        </div>
    );
}
