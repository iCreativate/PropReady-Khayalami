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

export default function PropertyAnalysisTemplate() {
    const [address, setAddress] = useState('');
    const [askingPrice, setAskingPrice] = useState('');
    const [estimatedRental, setEstimatedRental] = useState('');
    const [comparableSales, setComparableSales] = useState('');

    // Calculate gross rental yield: (Annual Rental Income / Property Value) × 100
    const annualRental = parseNumberInput(estimatedRental) * 12; // Convert monthly to annual
    const propertyValue = parseNumberInput(askingPrice);
    const grossRentalYield = propertyValue > 0 ? (annualRental / propertyValue) * 100 : 0;

    return (
        <div className="space-y-4">
            <h4 className="font-bold text-charcoal text-lg mb-4">Property Evaluation Checklist</h4>
            <div className="space-y-3">
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Property Address</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter address"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Asking Price</label>
                    <input
                        type="text"
                        value={askingPrice}
                        onChange={(e) => setAskingPrice(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Estimated Rental Income</label>
                    <input
                        type="text"
                        value={estimatedRental}
                        onChange={(e) => setEstimatedRental(formatNumberInput(e.target.value))}
                        placeholder="R 0/month"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Comparable Sales in Area</label>
                    <textarea
                        value={comparableSales}
                        onChange={(e) => setComparableSales(e.target.value)}
                        placeholder="List similar properties and their sale prices"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                        rows={3}
                    ></textarea>
                </div>
                <div className="p-3 bg-gold/10 rounded-lg border border-gold/30">
                    <p className="text-sm font-semibold text-charcoal mb-1">Gross Rental Yield</p>
                    <p className="text-xl font-bold text-gold">
                        {grossRentalYield.toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>
    );
}
