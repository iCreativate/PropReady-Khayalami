'use client';

import { useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { BuyerQuizResult } from '@/lib/quiz-result';
import { STORAGE_KEYS } from '@/lib/storage-keys';

interface BuyerPrequalOnboardingFormProps {
    user: { id: string; fullName?: string; email: string; phone?: string };
    onComplete: () => void | Promise<void>;
}

function parseAmount(value: string): number {
    const digits = value.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
}

export default function BuyerPrequalOnboardingForm({
    user,
    onComplete,
}: BuyerPrequalOnboardingFormProps) {
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        city: '',
        inMarketForProperty: null as boolean | null,
        monthlyIncome: '',
        debtRepayments: '',
        hasDebt: null as boolean | null,
        depositSaved: '',
        employmentStatus: '',
        creditScore: '',
    });

    const totalSteps = 4;

    function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError('');
    }

    function validate(): boolean {
        if (step === 1) {
            if (!form.city.trim()) {
                setError('City is required');
                return false;
            }
            if (form.inMarketForProperty === null) {
                setError('Please tell us if you are actively looking');
                return false;
            }
        }
        if (step === 2) {
            if (!form.monthlyIncome.trim()) {
                setError('Monthly income is required');
                return false;
            }
        }
        if (step === 3) {
            if (form.hasDebt === null) {
                setError('Please indicate if you have existing debt');
                return false;
            }
            if (form.hasDebt && !form.debtRepayments.trim()) {
                setError('Enter your total monthly debt repayments');
                return false;
            }
            if (!form.depositSaved.trim()) {
                setError('Deposit amount is required (use 0 if none)');
                return false;
            }
        }
        if (step === 4 && !form.employmentStatus) {
            setError('Employment status is required');
            return false;
        }
        return true;
    }

    function calculateScore() {
        let score = 40;
        const income = parseAmount(form.monthlyIncome);
        const debt = form.hasDebt ? parseAmount(form.debtRepayments) : 0;
        const deposit = parseAmount(form.depositSaved);
        if (income > 0 && debt / income < 0.3) score += 15;
        if (deposit >= income * 3) score += 20;
        else if (deposit > 0) score += 10;
        if (form.hasDebt === false) score += 10;
        if (form.employmentStatus === 'permanent') score += 15;
        else if (form.employmentStatus === 'contract') score += 8;
        const credit = Number(form.creditScore);
        if (credit >= 700) score += 10;
        else if (credit >= 600) score += 5;
        return Math.min(100, Math.max(0, score));
    }

    function calculatePreQual() {
        const income = parseAmount(form.monthlyIncome);
        const debt = form.hasDebt ? parseAmount(form.debtRepayments) : 0;
        const available = Math.max(0, income - debt);
        return Math.round(Math.min(available * 12 * 3.5, income * 12 * 5));
    }

    async function finish() {
        setLoading(true);
        setError('');
        try {
            const score = calculateScore();
            const preQualAmount = calculatePreQual();
            // Quiz/dashboard use `expenses` for monthly debt repayments — never for deposit.
            const debtExpenses = form.hasDebt ? form.debtRepayments : '0';
            const quizResult: BuyerQuizResult = {
                fullName: user.fullName || '',
                email: user.email,
                phone: user.phone || '',
                city: form.city.trim(),
                inMarketForProperty: form.inMarketForProperty,
                monthlyIncome: form.monthlyIncome,
                expenses: debtExpenses,
                hasDebt: form.hasDebt,
                depositSaved: form.depositSaved,
                creditScore: form.creditScore,
                employmentStatus: form.employmentStatus,
                score,
                preQualAmount,
                timestamp: new Date().toISOString(),
                id: user.id,
                user_id: user.id,
            };

            localStorage.setItem(STORAGE_KEYS.quizResult, JSON.stringify(quizResult));

            const lead = {
                id: user.id,
                leadType: 'buyer',
                fullName: quizResult.fullName,
                email: quizResult.email,
                phone: quizResult.phone,
                city: quizResult.city,
                inMarketForProperty: form.inMarketForProperty,
                monthlyIncome: form.monthlyIncome,
                expenses: debtExpenses,
                hasDebt: form.hasDebt,
                depositSaved: form.depositSaved,
                employmentStatus: form.employmentStatus,
                creditScore: form.creditScore,
                score,
                preQualAmount,
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
            setError('Could not save your pre-qualification. Please try again.');
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
                        <label className="auth-label">City / area you want to buy in</label>
                        <input
                            className="auth-input !pl-4"
                            value={form.city}
                            onChange={(e) => update('city', e.target.value)}
                            placeholder="e.g. Johannesburg"
                        />
                    </div>
                    <div>
                        <p className="auth-label">Are you actively looking now?</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[true, false].map((val) => (
                                <button
                                    key={String(val)}
                                    type="button"
                                    onClick={() => update('inMarketForProperty', val)}
                                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                                        form.inMarketForProperty === val
                                            ? 'border-gold bg-gold/5 text-charcoal'
                                            : 'border-charcoal/10 text-charcoal/70'
                                    }`}
                                >
                                    {val ? 'Yes' : 'Not yet'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div>
                        <label className="auth-label">Monthly income (before tax)</label>
                        <input
                            className="auth-input !pl-4"
                            inputMode="numeric"
                            value={form.monthlyIncome}
                            onChange={(e) => update('monthlyIncome', e.target.value)}
                            placeholder="e.g. 35000"
                        />
                    </div>
                    <p className="text-xs text-charcoal/45">
                        Debt repayments are asked separately next — they are not your deposit.
                    </p>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                    <div>
                        <p className="auth-label">Do you have existing debt (excl. mortgage)?</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[true, false].map((val) => (
                                <button
                                    key={String(val)}
                                    type="button"
                                    onClick={() => {
                                        update('hasDebt', val);
                                        if (!val) update('debtRepayments', '');
                                    }}
                                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                                        form.hasDebt === val
                                            ? 'border-gold bg-gold/5 text-charcoal'
                                            : 'border-charcoal/10 text-charcoal/70'
                                    }`}
                                >
                                    {val ? 'Yes' : 'No'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {form.hasDebt === true && (
                        <div>
                            <label className="auth-label">Total monthly debt repayments</label>
                            <input
                                className="auth-input !pl-4"
                                inputMode="numeric"
                                value={form.debtRepayments}
                                onChange={(e) => update('debtRepayments', e.target.value)}
                                placeholder="e.g. 5000"
                            />
                            <p className="mt-1.5 text-xs text-charcoal/45">
                                Car payments, credit cards, personal loans — not your home deposit.
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="auth-label">Deposit saved for a home</label>
                        <input
                            className="auth-input !pl-4"
                            inputMode="numeric"
                            value={form.depositSaved}
                            onChange={(e) => update('depositSaved', e.target.value)}
                            placeholder="e.g. 100000"
                        />
                        {form.depositSaved && (
                            <p className="mt-1.5 text-xs text-charcoal/45">
                                {formatCurrency(parseAmount(form.depositSaved))}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-4">
                    <div>
                        <label className="auth-label">Employment status</label>
                        <select
                            className="auth-input !pl-4"
                            value={form.employmentStatus}
                            onChange={(e) => update('employmentStatus', e.target.value)}
                        >
                            <option value="">Select…</option>
                            <option value="permanent">Permanent</option>
                            <option value="contract">Contract</option>
                            <option value="self-employed">Self-employed</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="auth-label">Credit score (optional)</label>
                        <input
                            className="auth-input !pl-4"
                            inputMode="numeric"
                            value={form.creditScore}
                            onChange={(e) => update('creditScore', e.target.value)}
                            placeholder="e.g. 650"
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
                        'Finish pre-qualification'
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
