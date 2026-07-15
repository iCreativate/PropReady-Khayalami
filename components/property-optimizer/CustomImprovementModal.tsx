'use client';

import { useState } from 'react';
import { Hammer, X } from 'lucide-react';
import { PvoGlassCard } from './pvo-ui';

interface CustomImprovementModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (description: string, estimatedCost?: number, category?: string) => void;
}

const CATEGORIES = ['Interior', 'Exterior', 'Energy', 'Security', 'Garden', 'Income', 'Technology', 'Custom'];

export default function CustomImprovementModal({
    open,
    onClose,
    onAdd,
}: CustomImprovementModalProps) {
    const [description, setDescription] = useState('');
    const [cost, setCost] = useState('');
    const [category, setCategory] = useState('Custom');

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;
        const parsedCost = cost ? Number(cost.replace(/\D/g, '')) : undefined;
        onAdd(description.trim(), parsedCost && parsedCost > 0 ? parsedCost : undefined, category);
        setDescription('');
        setCost('');
        setCategory('Custom');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
            <PvoGlassCard className="w-full max-w-lg p-6 sm:p-8 relative">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full pvo-stat-inner hover:bg-charcoal/5"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="pvo-icon-hero">
                        <Hammer className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="pvo-heading text-lg font-semibold">Describe your improvement</h3>
                        <p className="pvo-muted text-sm">Tell us what you plan to do — we&apos;ll estimate cost, value uplift and ROI for your area.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium pvo-muted uppercase tracking-wider">
                            What will you be improving? *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            required
                            placeholder="e.g. Full kitchen renovation with quartz counters and SMEG appliances; repainting exterior walls; adding a flatlet with separate entrance…"
                            className="pvo-input w-full mt-1 px-4 py-3 rounded-2xl text-sm resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium pvo-muted uppercase tracking-wider">
                                Estimated budget (optional)
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                placeholder="e.g. 250000"
                                className="pvo-input w-full mt-1 px-4 py-3 rounded-2xl text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium pvo-muted uppercase tracking-wider">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="pvo-input w-full mt-1 px-4 py-3 rounded-2xl text-sm"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border pvo-border pvo-muted text-sm font-medium">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 pvo-primary-btn py-3 rounded-2xl text-sm">
                            Add to simulator
                        </button>
                    </div>
                </form>
            </PvoGlassCard>
        </div>
    );
}
