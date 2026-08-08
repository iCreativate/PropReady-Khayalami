'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
    GUIDANCE_SCENARIOS,
    buildFiltersFromScenario,
    buildMatchAnswersFromScenario,
    type GuidanceScenario,
    type GuidanceScenarioId,
} from '@/lib/conveyancer-connect/guidance-scenarios';
import { SPECIALTY_LABELS, saveMatchAnswers, type BrowseFilters, type MatchAnswers } from '@/lib/conveyancer-connect';

const DEFAULT_MATCH: MatchAnswers = {
    intent: 'buying',
    province: 'gauteng',
    propertyValue: 2_500_000,
    timelineWeeks: 10,
    propertyType: 'residential',
    budgetBand: 3,
    specialRequirements: [],
};

export default function CcSmartInsight({
    filters,
    onApplyFilters,
    onNotify,
}: {
    filters: BrowseFilters;
    onApplyFilters: (next: BrowseFilters) => void;
    onNotify?: (message: string) => void;
}) {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<GuidanceScenarioId>('buying');

    const selected = useMemo(
        () => GUIDANCE_SCENARIOS.find((s) => s.id === selectedId) ?? GUIDANCE_SCENARIOS[0],
        [selectedId]
    );

    function applyToDirectory(scenario: GuidanceScenario) {
        onApplyFilters(buildFiltersFromScenario(scenario, filters));
        onNotify?.(`Showing conveyancers for ${scenario.label.toLowerCase()}.`);
        document.getElementById('cc-results')?.scrollIntoView({ behavior: 'smooth' });
    }

    function openMatchWizard(scenario: GuidanceScenario) {
        const answers = buildMatchAnswersFromScenario(scenario, {
            ...DEFAULT_MATCH,
            province: filters.province || DEFAULT_MATCH.province,
        });
        saveMatchAnswers(answers);
        const params = new URLSearchParams({
            from: 'guidance',
            scenario: scenario.id,
        });
        router.push(`/conveyancers/match?${params.toString()}`);
    }

    return (
        <section className="cc-mp-insight" aria-labelledby="cc-insight-heading">
            <div className="cc-mp-insight-head">
                <p className="cc-mp-insight-kicker">
                    <Sparkles aria-hidden />
                    PropReady guidance
                </p>
                <h2 id="cc-insight-heading">Not sure who you need?</h2>
                <p>
                    Choose what you&apos;re trying to do. We&apos;ll explain the right type of
                    conveyancer and filter the directory for you.
                </p>
            </div>

            <div className="cc-mp-insight-grid" role="listbox" aria-label="Transfer scenarios">
                {GUIDANCE_SCENARIOS.map((scenario) => (
                    <button
                        key={scenario.id}
                        type="button"
                        role="option"
                        aria-selected={selectedId === scenario.id}
                        className={`cc-mp-insight-option${selectedId === scenario.id ? ' is-active' : ''}`}
                        onClick={() => setSelectedId(scenario.id)}
                    >
                        <span className="cc-mp-insight-option-label">{scenario.label}</span>
                        <span className="cc-mp-insight-option-hint">{scenario.hint}</span>
                    </button>
                ))}
            </div>

            <GuidanceDetail
                scenario={selected}
                onShowMatches={() => applyToDirectory(selected)}
                onOpenWizard={() => openMatchWizard(selected)}
            />
        </section>
    );
}

function GuidanceDetail({
    scenario,
    onShowMatches,
    onOpenWizard,
}: {
    scenario: GuidanceScenario;
    onShowMatches: () => void;
    onOpenWizard: () => void;
}) {
    return (
        <div className="cc-mp-insight-detail" key={scenario.id}>
            <div className="cc-mp-insight-detail-top">
                <div>
                    <p className="cc-mp-insight-detail-role">{scenario.conveyancerRole}</p>
                    <p className="cc-mp-insight-detail-copy">{scenario.guidance}</p>
                </div>
            </div>

            <div className="cc-mp-insight-tags">
                <span className="cc-mp-insight-tags-label">Look for</span>
                {scenario.services.map((s) => (
                    <span key={s} className="cc-mp-insight-tag">
                        {SPECIALTY_LABELS[s]}
                    </span>
                ))}
            </div>

            <div className="cc-mp-insight-actions">
                <button type="button" className="cc-mp-btn-primary" onClick={onShowMatches}>
                    Show matching conveyancers
                </button>
                <button type="button" className="cc-mp-btn-secondary" onClick={onOpenWizard}>
                    Personalise with match wizard
                </button>
                <Link href="/conveyancers/learn" className="cc-mp-insight-learn">
                    How conveyancing works
                    <ArrowRight aria-hidden />
                </Link>
            </div>
        </div>
    );
}
