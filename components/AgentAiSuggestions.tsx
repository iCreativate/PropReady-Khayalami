'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Lightbulb } from 'lucide-react';
import {
    AGENT_CARD,
    AGENT_DASH_EMPTY,
    AGENT_DASH_EMPTY_ICON,
    AGENT_DASH_EMPTY_TITLE,
    AGENT_DASH_EMPTY_DESC,
    AGENT_ICON_BTN,
} from '@/lib/agent-portal-ui';

export interface AiSuggestionsContext {
    newBuyers?: number;
    newSellers?: number;
    pendingVerifications?: number;
    verifiedBuyers?: number;
    verifiedSellers?: number;
    upcomingViewings?: number;
    uncontactedLeads?: number;
    planName?: string;
    buyerLimit?: number;
}

interface AgentAiSuggestionsProps {
    context: AiSuggestionsContext;
}

export default function AgentAiSuggestions({ context }: AgentAiSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState<'ai' | 'rules'>('rules');

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/agents/ai-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(context),
            });
            const data = await res.json();
            setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
            setSource(data.source === 'ai' ? 'ai' : 'rules');
        } catch {
            setSuggestions([
                'Contact new leads within 2 hours and book viewings with both buyer and seller on the appointment.',
            ]);
            setSource('rules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        context.newBuyers,
        context.newSellers,
        context.pendingVerifications,
        context.verifiedBuyers,
        context.upcomingViewings,
        context.uncontactedLeads,
    ]);

    return (
        <section className={AGENT_CARD}>
            <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-charcoal/[0.08] bg-gradient-to-r from-gold/[0.04] via-white to-white">
                <div className="flex items-start justify-between gap-5">
                    <div className="flex items-start gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gold/[0.08] border border-gold/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-gold" />
                        </div>
                        <div className="min-w-0 pt-0.5">
                            <h3 className="text-lg font-semibold text-charcoal tracking-tight">
                                AI insights
                            </h3>
                            <p className="text-charcoal/45 text-sm mt-1.5 leading-relaxed">
                                Personalized recommendations for your pipeline
                                {source === 'ai' ? ' · powered by AI' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={load}
                        disabled={loading}
                        className={AGENT_ICON_BTN}
                        title="Refresh suggestions"
                        aria-label="Refresh suggestions"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="px-6 sm:px-8 py-6 sm:py-7">
                {loading ? (
                    <div className="space-y-3.5" aria-busy="true" aria-label="Loading insights">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-4 rounded-full bg-charcoal/[0.05] animate-pulse"
                                style={{ width: `${88 - i * 14}%` }}
                            />
                        ))}
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className={AGENT_DASH_EMPTY}>
                        <div className={AGENT_DASH_EMPTY_ICON}>
                            <Lightbulb className="w-6 h-6 text-charcoal/30" />
                        </div>
                        <p className={AGENT_DASH_EMPTY_TITLE}>No insights yet</p>
                        <p className={AGENT_DASH_EMPTY_DESC}>
                            Refresh to generate recommendations for your current pipeline.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-5">
                        {suggestions.map((tip, i) => (
                            <li key={i} className="flex gap-4 items-start">
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/[0.07] border border-gold/10">
                                    <Lightbulb className="w-3.5 h-3.5 text-gold" />
                                </span>
                                <span className="text-[15px] text-charcoal/75 leading-[1.65] pt-1">{tip}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
