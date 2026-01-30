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

export default function TaxDeductionTracker() {
    const [bondInterest, setBondInterest] = useState('');
    const [ratesTaxes, setRatesTaxes] = useState('');
    const [maintenanceRepairs, setMaintenanceRepairs] = useState('');

    // Calculate total deductible expenses
    const totalDeductible = parseNumberInput(bondInterest) + parseNumberInput(ratesTaxes) + parseNumberInput(maintenanceRepairs);

    return (
        <div className="space-y-4">
            <h4 className="font-bold text-charcoal text-lg mb-4">Annual Expense Tracking</h4>
            <div className="space-y-3">
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Bond Interest (not capital)</label>
                    <input
                        type="text"
                        value={bondInterest}
                        onChange={(e) => setBondInterest(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Rates & Taxes</label>
                    <input
                        type="text"
                        value={ratesTaxes}
                        onChange={(e) => setRatesTaxes(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Maintenance & Repairs</label>
                    <input
                        type="text"
                        value={maintenanceRepairs}
                        onChange={(e) => setMaintenanceRepairs(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-gold/10 rounded-lg border border-gold/30">
                    <p className="text-sm font-semibold text-charcoal mb-1">Total Deductible Expenses</p>
                    <p className="text-xl font-bold text-gold">
                        R {totalDeductible.toLocaleString('en-US')}
                    </p>
                </div>
            </div>
        </div>
    );
}
