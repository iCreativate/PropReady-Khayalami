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

export default function PortfolioDiversificationTracker() {
    const [propertiesByLocation, setPropertiesByLocation] = useState('');
    const [propertyTypes, setPropertyTypes] = useState('');
    const [cashReserves, setCashReserves] = useState('');

    // Calculate diversification score based on inputs
    const calculateDiversificationScore = () => {
        const hasLocations = propertiesByLocation.trim().length > 0;
        const hasTypes = propertyTypes.trim().length > 0;
        const hasReserves = parseNumberInput(cashReserves) > 0;

        // Count locations (lines or commas indicate multiple)
        const locationCount = propertiesByLocation.split(/[,\n]/).filter(loc => loc.trim().length > 0).length;
        const typeCount = propertyTypes.split(/[,\n]/).filter(type => type.trim().length > 0).length;

        let score = 0;
        let feedback = '';

        if (locationCount >= 3) {
            score += 3;
            feedback = 'Excellent location diversification';
        } else if (locationCount >= 2) {
            score += 2;
            feedback = 'Good location diversification';
        } else if (locationCount === 1) {
            score += 1;
            feedback = 'Limited location diversification';
        }

        if (typeCount >= 2) {
            score += 2;
            feedback += score > 2 ? ', good property type mix' : 'Good property type mix';
        } else if (typeCount === 1) {
            score += 1;
            feedback += score > 1 ? ', single property type' : 'Single property type';
        }

        if (hasReserves) {
            score += 2;
            feedback += score > 2 ? ', has cash reserves' : 'Has cash reserves';
        }

        if (score >= 6) {
            return { score: 'Excellent', feedback: 'Well Diversified Portfolio' };
        } else if (score >= 4) {
            return { score: 'Good', feedback: 'Moderately Diversified' };
        } else if (score >= 2) {
            return { score: 'Fair', feedback: 'Needs More Diversification' };
        } else {
            return { score: 'Poor', feedback: 'High Risk - Diversify Now' };
        }
    };

    const diversification = calculateDiversificationScore();

    return (
        <div className="space-y-4">
            <h4 className="font-bold text-charcoal text-lg mb-4">Portfolio Diversification Analysis</h4>
            <div className="space-y-3">
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Properties by Location</label>
                    <textarea
                        value={propertiesByLocation}
                        onChange={(e) => setPropertiesByLocation(e.target.value)}
                        placeholder="List properties and their locations"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                        rows={3}
                    ></textarea>
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Property Types</label>
                    <textarea
                        value={propertyTypes}
                        onChange={(e) => setPropertyTypes(e.target.value)}
                        placeholder="List property types (residential, commercial, etc.)"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                        rows={2}
                    ></textarea>
                </div>
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-1">Cash Reserves</label>
                    <input
                        type="text"
                        value={cashReserves}
                        onChange={(e) => setCashReserves(formatNumberInput(e.target.value))}
                        placeholder="R 0"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>
                <div className="p-3 bg-gold/10 rounded-lg border border-gold/30">
                    <p className="text-sm font-semibold text-charcoal mb-1">Diversification Score</p>
                    <p className="text-xl font-bold text-gold">
                        {diversification.score} - {diversification.feedback}
                    </p>
                </div>
            </div>
        </div>
    );
}
