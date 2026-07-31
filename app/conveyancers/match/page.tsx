'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import PortalHero from '@/components/PortalHero';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import ConveyancerCard from '@/components/conveyancer-connect/ConveyancerCard';
import { CC_CARD_FLAT, CC_INPUT, CC_LABEL } from '@/components/conveyancer-connect/cc-ui';
import {
    BUCKET_META,
    matchConveyancers,
    PROVINCE_LABELS,
    saveMatchAnswers,
    SPECIALTY_LABELS,
    useConveyancerDirectory,
    type MatchAnswers,
    type ProvinceSlug,
    type Specialty,
} from '@/lib/conveyancer-connect';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

const DEFAULT: MatchAnswers = {
    intent: 'buying',
    province: 'gauteng',
    propertyValue: 2_500_000,
    timelineWeeks: 10,
    propertyType: 'residential',
    budgetBand: 3,
    specialRequirements: [],
};

export default function MatchPage() {
    const { profiles, loading } = useConveyancerDirectory();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<MatchAnswers>(DEFAULT);
    const [submitted, setSubmitted] = useState(false);

    const results = useMemo(
        () => (submitted ? matchConveyancers(profiles, answers) : []),
        [submitted, answers, profiles]
    );

    function toggleSpec(s: Specialty) {
        setAnswers((a) => ({
            ...a,
            specialRequirements: a.specialRequirements.includes(s)
                ? a.specialRequirements.filter((x) => x !== s)
                : [...a.specialRequirements, s],
        }));
    }

    function runMatch() {
        saveMatchAnswers(answers);
        setSubmitted(true);
    }

    return (
        <CcPageShell title="AI Matching">
            <div className="space-y-6">
                <PortalHero
                    size="compact"
                    eyebrow="Smart Matching"
                    eyebrowIcon={<Sparkles className="h-3.5 w-3.5 text-gold" />}
                    title="Get matched to the right conveyancer"
                    description="Answer a few questions. We rank verified PropReady firms by province, timeline, fee comfort and specialisations — and explain why."
                />

                {loading ? (
                    <div className={`${CC_CARD_FLAT} p-6 text-sm text-charcoal/50`}>Loading directory…</div>
                ) : null}

                {!submitted ? (
                    <div className={`${CC_CARD_FLAT} space-y-4 p-6`}>
                        {step === 0 ? (
                            <>
                                <Field label="I am">
                                    <select
                                        className={CC_INPUT}
                                        value={answers.intent}
                                        onChange={(e) =>
                                            setAnswers((a) => ({
                                                ...a,
                                                intent: e.target.value as MatchAnswers['intent'],
                                            }))
                                        }
                                    >
                                        <option value="buying">Buying</option>
                                        <option value="selling">Selling</option>
                                        <option value="investing">Investing</option>
                                        <option value="developing">Developing</option>
                                        <option value="agent">An estate agent</option>
                                    </select>
                                </Field>
                                <Field label="Province">
                                    <select
                                        className={CC_INPUT}
                                        value={answers.province}
                                        onChange={(e) =>
                                            setAnswers((a) => ({
                                                ...a,
                                                province: e.target.value as ProvinceSlug | '',
                                            }))
                                        }
                                    >
                                        {Object.entries(PROVINCE_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </>
                        ) : null}

                        {step === 1 ? (
                            <>
                                <Field label={`Property value — R${answers.propertyValue.toLocaleString('en-ZA')}`}>
                                    <input
                                        type="range"
                                        min={500000}
                                        max={12000000}
                                        step={50000}
                                        value={answers.propertyValue}
                                        onChange={(e) =>
                                            setAnswers((a) => ({
                                                ...a,
                                                propertyValue: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full accent-gold"
                                    />
                                </Field>
                                <Field label={`Timeline — ${answers.timelineWeeks} weeks`}>
                                    <input
                                        type="range"
                                        min={4}
                                        max={24}
                                        value={answers.timelineWeeks}
                                        onChange={(e) =>
                                            setAnswers((a) => ({
                                                ...a,
                                                timelineWeeks: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full accent-gold"
                                    />
                                </Field>
                                <Field label="Property type">
                                    <select
                                        className={CC_INPUT}
                                        value={answers.propertyType}
                                        onChange={(e) =>
                                            setAnswers((a) => ({
                                                ...a,
                                                propertyType: e.target
                                                    .value as MatchAnswers['propertyType'],
                                            }))
                                        }
                                    >
                                        <option value="residential">Residential</option>
                                        <option value="commercial">Commercial</option>
                                        <option value="development">Development</option>
                                        <option value="investment">Investment</option>
                                    </select>
                                </Field>
                            </>
                        ) : null}

                        {step === 2 ? (
                            <>
                                <Field label="Budget / fee comfort">
                                    <select
                                        className={CC_INPUT}
                                        value={answers.budgetBand || ''}
                                        onChange={(e) =>
                                            setAnswers((a) => ({
                                                ...a,
                                                budgetBand: e.target.value
                                                    ? (Number(e.target.value) as 1 | 2 | 3 | 4)
                                                    : 0,
                                            }))
                                        }
                                    >
                                        <option value="1">Value (R)</option>
                                        <option value="2">Standard (RR)</option>
                                        <option value="3">Premium (RRR)</option>
                                        <option value="4">Private client (RRRR)</option>
                                    </select>
                                </Field>
                                <div>
                                    <p className={CC_LABEL}>Special requirements</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(
                                            [
                                                'bond-registration',
                                                'sectional-title',
                                                'estate-transfers',
                                                'developments',
                                                'family-transfers',
                                            ] as Specialty[]
                                        ).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                                                    answers.specialRequirements.includes(s)
                                                        ? 'bg-gold/10 text-gold ring-gold/30'
                                                        : 'bg-white text-charcoal/60 ring-charcoal/10'
                                                }`}
                                                onClick={() => toggleSpec(s)}
                                            >
                                                {SPECIALTY_LABELS[s]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : null}

                        <div className="flex flex-wrap gap-2 pt-2">
                            {step > 0 ? (
                                <button
                                    type="button"
                                    className={PORTAL_SECONDARY_BTN}
                                    onClick={() => setStep((s) => s - 1)}
                                >
                                    Back
                                </button>
                            ) : null}
                            {step < 2 ? (
                                <button
                                    type="button"
                                    className={PORTAL_PRIMARY_BTN}
                                    onClick={() => setStep((s) => s + 1)}
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={PORTAL_PRIMARY_BTN}
                                    onClick={runMatch}
                                    disabled={!profiles.length}
                                >
                                    See recommendations
                                </button>
                            )}
                        </div>
                        {!profiles.length && !loading ? (
                            <p className="text-sm text-charcoal/55">
                                No verified firms yet.{' '}
                                <Link href="/conveyancers/register" className="font-semibold text-gold">
                                    Register a firm
                                </Link>
                            </p>
                        ) : null}
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className={PORTAL_SECONDARY_BTN}
                                onClick={() => setSubmitted(false)}
                            >
                                Edit answers
                            </button>
                            <Link href="/conveyancers/compare" className={PORTAL_SECONDARY_BTN}>
                                Open compare tray
                            </Link>
                        </div>
                        {results.map((r) => (
                            <div key={r.bucket} className="space-y-3">
                                <div className={`${CC_CARD_FLAT} p-4`}>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                                        {BUCKET_META[r.bucket]} · score {r.score}
                                    </p>
                                    <ul className="mt-2 space-y-1 text-sm text-charcoal/60">
                                        {r.reasons.map((reason) => (
                                            <li key={reason}>• {reason}</li>
                                        ))}
                                    </ul>
                                </div>
                                <ConveyancerCard profile={r.profile} compact />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CcPageShell>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className={CC_LABEL}>{label}</label>
            {children}
        </div>
    );
}
