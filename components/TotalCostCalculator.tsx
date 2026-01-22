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

export default function TotalCostCalculator() {
    const [purchasePrice, setPurchasePrice] = useState('');
    const [transferCosts, setTransferCosts] = useState('');
    const [monthlyRates, setMonthlyRates] = useState('');
    const [monthlyLevies, setMonthlyLevies] = useState('');
    const [monthlyInsurance, setMonthlyInsurance] = useState('');
    const [annualMaintenance, setAnnualMaintenance] = useState('');
    const [propertyManagement, setPropertyManagement] = useState('');

    // Calculate total monthly costs
    const monthlyMaintenance = parseNumberInput(annualMaintenance) / 12;
    const totalMonthlyCosts = parseNumberInput(monthlyRates) + 
                              parseNumberInput(monthlyLevies) + 
                              parseNumberInput(monthlyInsurance) + 
                              monthlyMaintenance + 
                              parseNumberInput(propertyManagement);

    // Format number with commas for display (using same approach as other calculators)
    const formatDisplayValue = (num: number): string => {
        if (num === 0) return '0';
        // Round to 2 decimal places, then format with commas
        const rounded = Math.round(num * 100) / 100;
        return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const formattedTotal = formatDisplayValue(totalMonthlyCosts);

    return (
        <div className="space-y-4">
            <h4 className="font-bold text-charcoal text-lg mb-4">Property Investment Cost Breakdown</h4>
            <div className="space-y-3">
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Purchase Price</label>
                    <input
                        type="text"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Transfer Costs (8-10%)</label>
                    <input
                        type="text"
                        value={transferCosts}
                        onChange={(e) => setTransferCosts(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Monthly Municipal Rates</label>
                    <input
                        type="text"
                        value={monthlyRates}
                        onChange={(e) => setMonthlyRates(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Monthly Levies (if applicable)</label>
                    <input
                        type="text"
                        value={monthlyLevies}
                        onChange={(e) => setMonthlyLevies(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Monthly Insurance</label>
                    <input
                        type="text"
                        value={monthlyInsurance}
                        onChange={(e) => setMonthlyInsurance(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Annual Maintenance Budget (1-2% of value)</label>
                    <input
                        type="text"
                        value={annualMaintenance}
                        onChange={(e) => setAnnualMaintenance(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Property Management (8-12% of rental)</label>
                    <input
                        type="text"
                        value={propertyManagement}
                        onChange={(e) => setPropertyManagement(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-gold/10 rounded-lg border border-gold/30">
                    <p className="text-sm font-semibold text-charcoal mb-1">Total Monthly Costs</p>
                    <p className="text-xl font-bold text-gold">
                        R {formattedTotal}
                    </p>
                </div>
            </div>
        </div>
    );
}
