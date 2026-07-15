'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Lightbulb } from 'lucide-react';
import { AGENT_CARD } from '@/lib/agent-portal-ui';

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
        <section className={`mb-10 sm:mb-12 ${AGENT_CARD}`}>
            <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-charcoal/[0.06] bg-gradient-to-r from-gold/[0.04] via-white to-white">
                <div className="flex items-start justify-between gap-5">
                    <div className="flex items-start gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gold/[0.08] border border-gold/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-gold" />
                        </div>
                        <div className="min-w-0 pt-0.5">
                            <h3 className="text-lg font-semibold text-charcoal tracking-tight">
                                AI insights
                            </h3>
                            <p className="text-charcoal/45 text-sm mt-1 leading-relaxed">
                                Personalized recommendations for your pipeline
                                {source === 'ai' ? ' · powered by AI' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={load}
                        disabled={loading}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-charcoal/[0.08] bg-white text-charcoal/45 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:text-charcoal hover:border-charcoal/15 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] disabled:opacity-50 transition-all duration-200 shrink-0"
                        title="Refresh suggestions"
                        aria-label="Refresh suggestions"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="px-6 sm:px-8 py-6 sm:py-7">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-[18px] rounded-full bg-charcoal/[0.05] animate-pulse"
                                style={{ width: `${88 - i * 14}%` }}
                            />
                        ))}
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
