'use client';

import { useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage-keys';

interface SellerPropertyOnboardingFormProps {
    user: { id: string; fullName?: string; email: string; phone?: string };
    onComplete: () => void | Promise<void>;
}

export default function SellerPropertyOnboardingForm({
    user,
    onComplete,
}: SellerPropertyOnboardingFormProps) {
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        propertyAddress: '',
        propertySuburb: '',
        propertySize: '',
        propertyCondition: '',
        propertyDescription: '',
        askingPrice: '',
        bedrooms: '',
        bathrooms: '',
    });

    const totalSteps = 3;

    function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError('');
    }

    function validate(): boolean {
        if (step === 1) {
            if (!form.propertyAddress.trim()) {
                setError('Property address is required');
                return false;
            }
            if (!form.propertySuburb.trim()) {
                setError('Suburb / area is required');
                return false;
            }
        }
        if (step === 2) {
            if (!form.propertySize.trim() || Number(form.propertySize) <= 0) {
                setError('Enter a valid property size in m²');
                return false;
            }
            if (!form.propertyCondition) {
                setError('Property condition is required');
                return false;
            }
            if (!form.bedrooms.trim()) {
                setError('Number of bedrooms is required');
                return false;
            }
        }
        if (step === 3 && !form.askingPrice.trim()) {
            setError('Asking price is required (estimate is fine)');
            return false;
        }
        return true;
    }

    async function finish() {
        setLoading(true);
        setError('');
        try {
            const propertyQuiz = {
                ...form,
                timestamp: new Date().toISOString(),
                id: `property-quiz-${Date.now()}`,
                userId: user.id,
                email: user.email,
            };

            const existingQuizzes = JSON.parse(
                localStorage.getItem(STORAGE_KEYS.propertyQuizzes) || '[]'
            );
            existingQuizzes.push(propertyQuiz);
            localStorage.setItem(STORAGE_KEYS.propertyQuizzes, JSON.stringify(existingQuizzes));

            const sellerInfo = {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone || '',
                propertyAddress: form.propertyAddress.trim(),
                suburb: form.propertySuburb.trim(),
                propertySize: form.propertySize,
                propertyCondition: form.propertyCondition,
                propertyDescription: form.propertyDescription,
                askingPrice: form.askingPrice,
                bedrooms: form.bedrooms,
                bathrooms: form.bathrooms,
                isSeller: true,
                timestamp: new Date().toISOString(),
            };

            localStorage.setItem(STORAGE_KEYS.sellerInfo, JSON.stringify(sellerInfo));

            const lead = {
                id: user.id,
                leadType: 'seller',
                fullName: user.fullName,
                email: user.email,
                phone: user.phone || '',
                propertyAddress: form.propertyAddress.trim(),
                suburb: form.propertySuburb.trim(),
                askingPrice: form.askingPrice,
                propertySize: form.propertySize,
                propertyCondition: form.propertyCondition,
                bedrooms: form.bedrooms,
                bathrooms: form.bathrooms,
                status: 'new',
                timestamp: new Date().toISOString(),
                contactedAt: null,
            };

            await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lead),
            }).catch(() => null);

            const existingLeads = JSON.parse(localStorage.getItem(STORAGE_KEYS.leads) || '[]');
            const filtered = existingLeads.filter((l: { id: string }) => l.id !== user.id);
            filtered.push(lead);
            localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(filtered));

            await onComplete();
        } catch {
            setError('Could not save your property details. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleNext() {
        if (!validate()) return;
        if (step < totalSteps) {
            setStep((s) => s + 1);
            return;
        }
        await finish();
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-charcoal/45">
                <span>
                    Step {step} of {totalSteps}
                </span>
                <div className="flex gap-1">
                    {Array.from({ length: totalSteps }, (_, i) => (
                        <span
                            key={i}
                            className={`h-1.5 w-6 rounded-full ${
                                i + 1 <= step ? 'bg-gold' : 'bg-charcoal/10'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {error && (
                <div className="form-error bg-red-50 border border-red-200/80 rounded-xl px-3 py-2.5 !mt-0 mb-1">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {error}
                </div>
            )}

            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="auth-label">Property street address</label>
                        <input
                            className="auth-input !pl-4"
                            value={form.propertyAddress}
                            onChange={(e) => update('propertyAddress', e.target.value)}
                            placeholder="e.g. 12 Oak Avenue"
                        />
                    </div>
                    <div>
                        <label className="auth-label">Suburb / area</label>
                        <input
                            className="auth-input !pl-4"
                            value={form.propertySuburb}
                            onChange={(e) => update('propertySuburb', e.target.value)}
                            placeholder="e.g. Sandton"
                        />
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="auth-label">Size (m²)</label>
                            <input
                                className="auth-input !pl-4"
                                inputMode="numeric"
                                value={form.propertySize}
                                onChange={(e) => update('propertySize', e.target.value)}
                                placeholder="e.g. 180"
                            />
                        </div>
                        <div>
                            <label className="auth-label">Bedrooms</label>
                            <input
                                className="auth-input !pl-4"
                                inputMode="numeric"
                                value={form.bedrooms}
                                onChange={(e) => update('bedrooms', e.target.value)}
                                placeholder="e.g. 3"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="auth-label">Bathrooms</label>
                        <input
                            className="auth-input !pl-4"
                            inputMode="numeric"
                            value={form.bathrooms}
                            onChange={(e) => update('bathrooms', e.target.value)}
                            placeholder="e.g. 2"
                        />
                    </div>
                    <div>
                        <label className="auth-label">Condition</label>
                        <select
                            className="auth-input !pl-4"
                            value={form.propertyCondition}
                            onChange={(e) => update('propertyCondition', e.target.value)}
                        >
                            <option value="">Select…</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair / needs work</option>
                            <option value="renovation">Needs renovation</option>
                        </select>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                    <div>
                        <label className="auth-label">Asking price (ZAR)</label>
                        <input
                            className="auth-input !pl-4"
                            inputMode="numeric"
                            value={form.askingPrice}
                            onChange={(e) => update('askingPrice', e.target.value)}
                            placeholder="e.g. 1850000"
                        />
                    </div>
                    <div>
                        <label className="auth-label">Short description (optional)</label>
                        <textarea
                            className="auth-input !pl-4 min-h-[88px]"
                            value={form.propertyDescription}
                            onChange={(e) => update('propertyDescription', e.target.value)}
                            placeholder="Anything buyers should know"
                        />
                    </div>
                </div>
            )}

            <div className="flex gap-2 pt-2">
                {step > 1 && (
                    <button
                        type="button"
                        onClick={() => setStep((s) => s - 1)}
                        className="flex-1 py-3 rounded-xl border border-charcoal/10 text-sm font-medium text-charcoal/70 hover:bg-charcoal/[0.02]"
                    >
                        <span className="inline-flex items-center justify-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </span>
                    </button>
                )}
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleNext()}
                    className="auth-btn-primary flex-[1.4]"
                >
                    {loading ? (
                        'Saving…'
                    ) : step === totalSteps ? (
                        'Finish & open dashboard'
                    ) : (
                        <span className="inline-flex items-center justify-center gap-1">
                            Next <ArrowRight className="w-4 h-4" />
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
