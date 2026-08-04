'use client';

import { useState } from 'react';
import type { LearnerPersona, StoryDecision } from '@/lib/buyer-learn/types';

function formatZar(n: number): string {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        maximumFractionDigits: 0,
    }).format(n);
}

export default function LearnerStory({
    title,
    persona,
    decisions,
}: {
    title: string;
    persona: LearnerPersona;
    decisions: StoryDecision[];
}) {
    const [choices, setChoices] = useState<Record<string, string>>({});
    const deposit = persona.propertyPrice * (persona.depositPct / 100);
    const bond = persona.propertyPrice - deposit;

    return (
        <div className="space-y-6">
            <div className="rounded-3xl overflow-hidden border border-charcoal/10 bg-white shadow-sm">
                <div className="grid md:grid-cols-[1.1fr_0.9fr]">
                    <div className="p-6 sm:p-8 bg-gradient-to-br from-charcoal to-[#1a1a1a] text-white">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                            Interactive story
                        </p>
                        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
                        <p className="mt-3 text-white/70 leading-relaxed max-w-md">{persona.bio}</p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <Chip>{persona.name}</Chip>
                            <Chip>{persona.city}</Chip>
                            <Chip>{persona.role}</Chip>
                        </div>
                    </div>
                    <div className="p-6 sm:p-8 bg-[#F8FAFC] grid grid-cols-2 gap-3 content-center">
                        <Metric label="Net salary" value={formatZar(persona.netSalary)} />
                        <Metric label="Property" value={formatZar(persona.propertyPrice)} />
                        <Metric label="Deposit" value={`${persona.depositPct}% · ${formatZar(deposit)}`} />
                        <Metric label="Bond" value={formatZar(bond)} />
                        <p className="col-span-2 text-xs text-charcoal/50 mt-1">{persona.propertyLabel}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {decisions.map((d, i) => {
                    const selected = choices[d.id];
                    const chosen = d.options.find((o) => o.id === selected);
                    return (
                        <div
                            key={d.id}
                            className={`rounded-2xl border border-charcoal/10 bg-white p-5 sm:p-6 ${
                                i % 2 === 1 ? 'md:ml-8' : 'md:mr-8'
                            }`}
                        >
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
                                Decision {i + 1}
                            </p>
                            <p className="mt-2 text-base sm:text-lg font-semibold text-charcoal">
                                {d.prompt}
                            </p>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {d.options.map((opt) => {
                                    const active = selected === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() =>
                                                setChoices((prev) => ({ ...prev, [d.id]: opt.id }))
                                            }
                                            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                                                active
                                                    ? 'border-gold bg-gold/10 text-charcoal font-semibold'
                                                    : 'border-charcoal/10 bg-charcoal/[0.02] text-charcoal/75 hover:border-charcoal/20'
                                            }`}
                                            aria-pressed={active}
                                        >
                                            {opt.label}
                                            {opt.recommended ? (
                                                <span className="ml-2 text-[10px] uppercase tracking-wider text-gold font-bold">
                                                    Recommended
                                                </span>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                            {chosen ? (
                                <p
                                    className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-900 leading-relaxed"
                                    role="status"
                                >
                                    {chosen.outcome}
                                </p>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Chip({ children }: { children: React.ReactNode }) {
    return (
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
            {children}
        </span>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-white border border-charcoal/8 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">{label}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-charcoal">{value}</p>
        </div>
    );
}
