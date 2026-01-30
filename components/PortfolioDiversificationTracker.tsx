'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';

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
    const [property1Location, setProperty1Location] = useState('');
    const [property1Value, setProperty1Value] = useState('');
    const [property1Type, setProperty1Type] = useState('');
    
    const [property2Location, setProperty2Location] = useState('');
    const [property2Value, setProperty2Value] = useState('');
    const [property2Type, setProperty2Type] = useState('');
    
    const [property3Location, setProperty3Location] = useState('');
    const [property3Value, setProperty3Value] = useState('');
    const [property3Type, setProperty3Type] = useState('');
    
    const [cashReserves, setCashReserves] = useState('');

    // Calculate portfolio metrics
    const calculatePortfolioMetrics = () => {
        const properties = [
            { location: property1Location.trim(), value: parseNumberInput(property1Value), type: property1Type.trim() },
            { location: property2Location.trim(), value: parseNumberInput(property2Value), type: property2Type.trim() },
            { location: property3Location.trim(), value: parseNumberInput(property3Value), type: property3Type.trim() },
        ].filter(p => p.location && p.value > 0);

        if (properties.length === 0) {
            return {
                totalValue: 0,
                locationCount: 0,
                typeCount: 0,
                locationDiversity: 'N/A',
                typeDiversity: 'N/A',
                recommendation: 'Add properties to analyze your portfolio',
                riskLevel: 'Unknown'
            };
        }

        const totalValue = properties.reduce((sum, p) => sum + p.value, 0);
        const uniqueLocations = new Set(properties.map(p => p.location.toLowerCase())).size;
        const uniqueTypes = new Set(properties.map(p => p.type.toLowerCase())).size;

        // Calculate location concentration (risk if one location has >50% of value)
        const locationGroups: Record<string, number> = {};
        properties.forEach(p => {
            const loc = p.location.toLowerCase();
            locationGroups[loc] = (locationGroups[loc] || 0) + p.value;
        });
        const maxLocationPercentage = Math.max(...Object.values(locationGroups)) / totalValue * 100;

        // Calculate type concentration
        const typeGroups: Record<string, number> = {};
        properties.forEach(p => {
            const type = p.type.toLowerCase();
            typeGroups[type] = (typeGroups[type] || 0) + p.value;
        });
        const maxTypePercentage = Math.max(...Object.values(typeGroups)) / totalValue * 100;

        // Assess diversification
        let locationDiversity = '';
        let typeDiversity = '';
        let recommendation = '';
        let riskLevel = '';

        if (uniqueLocations >= 3) {
            locationDiversity = 'Excellent - Spread across multiple areas';
        } else if (uniqueLocations === 2) {
            locationDiversity = 'Good - Two different locations';
        } else {
            locationDiversity = 'High Risk - All properties in one area';
        }

        if (maxLocationPercentage > 70) {
            locationDiversity = 'High Risk - Over 70% in one location';
        }

        if (uniqueTypes >= 2) {
            typeDiversity = 'Good - Mixed property types';
        } else {
            typeDiversity = 'Limited - Single property type';
        }

        if (maxTypePercentage > 80) {
            typeDiversity = 'High Risk - Over 80% in one type';
        }

        // Overall assessment
        const hasMultipleLocations = uniqueLocations >= 2;
        const hasMultipleTypes = uniqueTypes >= 2;
        const hasReserves = parseNumberInput(cashReserves) > 0;
        const notConcentrated = maxLocationPercentage < 60 && maxTypePercentage < 70;

        if (hasMultipleLocations && hasMultipleTypes && hasReserves && notConcentrated) {
            riskLevel = 'Low Risk';
            recommendation = 'Well diversified portfolio. Consider maintaining this balance.';
        } else if (hasMultipleLocations && hasReserves) {
            riskLevel = 'Moderate Risk';
            recommendation = 'Good location diversity. Consider diversifying property types or adding cash reserves.';
        } else if (hasMultipleTypes && hasReserves) {
            riskLevel = 'Moderate Risk';
            recommendation = 'Good type diversity. Consider spreading properties across different locations.';
        } else if (hasMultipleLocations || hasMultipleTypes) {
            riskLevel = 'Moderate-High Risk';
            recommendation = 'Some diversification present. Spread across more locations/types and build cash reserves.';
        } else {
            riskLevel = 'High Risk';
            recommendation = 'Portfolio is highly concentrated. Diversify across locations, property types, and build cash reserves.';
        }

        return {
            totalValue,
            locationCount: uniqueLocations,
            typeCount: uniqueTypes,
            locationDiversity,
            typeDiversity,
            recommendation,
            riskLevel,
            maxLocationPercentage: maxLocationPercentage.toFixed(1),
            maxTypePercentage: maxTypePercentage.toFixed(1)
        };
    };

    const metrics = calculatePortfolioMetrics();

    return (
        <div className="space-y-4">
            <h4 className="font-bold text-charcoal text-lg mb-4">Portfolio Diversification Analysis</h4>
            <div className="space-y-3">
                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-2">Property 1</label>
                    <input
                        type="text"
                        value={property1Location}
                        onChange={(e) => setProperty1Location(e.target.value)}
                        placeholder="Location (e.g., Sandton)"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg mb-2"
                    />
                    <input
                        type="text"
                        value={property1Value}
                        onChange={(e) => setProperty1Value(formatNumberInput(e.target.value))}
                        placeholder="Property Value (R 0)"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg mb-2"
                    />
                    <input
                        type="text"
                        value={property1Type}
                        onChange={(e) => setProperty1Type(e.target.value)}
                        placeholder="Type (e.g., Residential, Commercial)"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>

                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-2">Property 2</label>
                    <input
                        type="text"
                        value={property2Location}
                        onChange={(e) => setProperty2Location(e.target.value)}
                        placeholder="Location (e.g., Cape Town)"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg mb-2"
                    />
                    <input
                        type="text"
                        value={property2Value}
                        onChange={(e) => setProperty2Value(formatNumberInput(e.target.value))}
                        placeholder="Property Value (R 0)"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg mb-2"
                    />
                    <input
                        type="text"
                        value={property2Type}
                        onChange={(e) => setProperty2Type(e.target.value)}
                        placeholder="Type (e.g., Residential, Commercial)"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
                </div>

                <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                    <label className="block text-sm font-semibold text-charcoal mb-2">Property 3 (Optional)</label>
                    <input
                        type="text"
                        value={property3Location}
                        onChange={(e) => setProperty3Location(e.target.value)}
                        placeholder="Location"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg mb-2"
                    />
                    <input
                        type="text"
                        value={property3Value}
                        onChange={(e) => setProperty3Value(formatNumberInput(e.target.value))}
                        placeholder="Property Value (R 0)"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg mb-2"
                    />
                    <input
                        type="text"
                        value={property3Type}
                        onChange={(e) => setProperty3Type(e.target.value)}
                        placeholder="Type"
                        className="w-full px-3 py-2 border border-charcoal/20 rounded-lg"
                    />
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

                {metrics.totalValue > 0 && (
                    <>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-charcoal mb-2">Portfolio Summary</p>
                            <div className="space-y-1 text-sm">
                                <p className="text-charcoal/70">Total Portfolio Value: <span className="font-semibold text-charcoal">{formatCurrency(metrics.totalValue)}</span></p>
                                <p className="text-charcoal/70">Locations: <span className="font-semibold text-charcoal">{metrics.locationCount}</span></p>
                                <p className="text-charcoal/70">Property Types: <span className="font-semibold text-charcoal">{metrics.typeCount}</span></p>
                            </div>
                        </div>

                        <div className="p-3 bg-charcoal/5 rounded-lg border border-charcoal/10">
                            <p className="text-sm font-semibold text-charcoal mb-2">Diversification Analysis</p>
                            <div className="space-y-1 text-sm">
                                <p className="text-charcoal/70"><strong>Location:</strong> {metrics.locationDiversity}</p>
                                {metrics.maxLocationPercentage && parseFloat(metrics.maxLocationPercentage) > 50 && (
                                    <p className="text-red-600 text-xs">⚠️ {metrics.maxLocationPercentage}% of portfolio in one location</p>
                                )}
                                <p className="text-charcoal/70"><strong>Type:</strong> {metrics.typeDiversity}</p>
                                {metrics.maxTypePercentage && parseFloat(metrics.maxTypePercentage) > 60 && (
                                    <p className="text-red-600 text-xs">⚠️ {metrics.maxTypePercentage}% of portfolio in one type</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <div className={`p-3 rounded-lg border ${
                    metrics.riskLevel === 'Low Risk' ? 'bg-green-50 border-green-200' :
                    metrics.riskLevel === 'Moderate Risk' ? 'bg-yellow-50 border-yellow-200' :
                    metrics.riskLevel === 'High Risk' ? 'bg-red-50 border-red-200' :
                    'bg-gold/10 border-gold/30'
                }`}>
                    <p className="text-sm font-semibold text-charcoal mb-1">Risk Assessment</p>
                    <p className={`text-lg font-bold mb-2 ${
                        metrics.riskLevel === 'Low Risk' ? 'text-green-700' :
                        metrics.riskLevel === 'Moderate Risk' ? 'text-yellow-700' :
                        metrics.riskLevel === 'High Risk' ? 'text-red-700' :
                        'text-gold'
                    }`}>
                        {metrics.riskLevel}
                    </p>
                    <p className="text-sm text-charcoal/80">{metrics.recommendation}</p>
                </div>
            </div>
        </div>
    );
}
