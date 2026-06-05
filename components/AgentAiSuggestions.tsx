'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Lightbulb } from 'lucide-react';

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
        <div className="mb-8 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/5 to-white p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-gold" />
                    <div>
                        <h3 className="text-lg font-bold text-charcoal">AI suggestions</h3>
                        <p className="text-charcoal/60 text-sm">
                            Personalized tips for your pipeline
                            {source === 'ai' ? ' (powered by AI)' : ''}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    className="p-2 rounded-lg border border-charcoal/20 text-charcoal/70 hover:bg-charcoal/5 disabled:opacity-50"
                    title="Refresh suggestions"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            {loading ? (
                <p className="text-charcoal/50 text-sm">Generating suggestions…</p>
            ) : (
                <ul className="space-y-3">
                    {suggestions.map((tip, i) => (
                        <li key={i} className="flex gap-3 text-sm text-charcoal/90">
                            <Lightbulb className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
