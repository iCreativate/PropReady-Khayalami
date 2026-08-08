'use client';

import { useEffect, useState } from 'react';
import { Landmark, RefreshCw } from 'lucide-react';

export type RepoRateBannerQuote = {
    repoRate: number;
    primeRate: number;
    source?: string;
    asOf?: string;
    rateName?: string;
    provider?: string;
    error?: string;
};

type Props = {
    /** Visual density — dashboard strip vs Companion hero chip. */
    variant?: 'dashboard' | 'companion';
    className?: string;
};

let quoteCache: { at: number; value: RepoRateBannerQuote | null } | null = null;
const QUOTE_CACHE_MS = 5 * 60 * 1000;

async function loadQuote(): Promise<RepoRateBannerQuote | null> {
    if (quoteCache && Date.now() - quoteCache.at < QUOTE_CACHE_MS) {
        return quoteCache.value;
    }
    try {
        const res = await fetch('/api/market/sa-prime');
        if (!res.ok) {
            quoteCache = { at: Date.now(), value: null };
            return null;
        }
        const data = (await res.json()) as RepoRateBannerQuote;
        if (
            typeof data.repoRate !== 'number' ||
            !Number.isFinite(data.repoRate) ||
            typeof data.primeRate !== 'number' ||
            !Number.isFinite(data.primeRate)
        ) {
            return null;
        }
        quoteCache = { at: Date.now(), value: data };
        return data;
    } catch {
        return null;
    }
}

function formatPct(n: number): string {
    return `${n.toFixed(2)}%`;
}

export default function RepoRateBanner({ variant = 'dashboard', className = '' }: Props) {
    const [quote, setQuote] = useState<RepoRateBannerQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void loadQuote().then((q) => {
            if (cancelled) return;
            if (!q) {
                setFailed(true);
                setLoading(false);
                return;
            }
            setQuote(q);
            setFailed(false);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    if (variant === 'companion') {
        return (
            <aside
                className={`pc-repo-banner pc-repo-banner--companion${className ? ` ${className}` : ''}`}
                aria-label="South African repo and prime rates"
            >
                <div className="pc-repo-banner-icon" aria-hidden>
                    <Landmark />
                </div>
                <div className="pc-repo-banner-copy">
                    <span>SARB repo</span>
                    <strong>
                        {loading ? '…' : quote ? formatPct(quote.repoRate) : failed ? '—' : '…'}
                    </strong>
                </div>
                <div className="pc-repo-banner-copy">
                    <span>Prime</span>
                    <strong>
                        {loading ? '…' : quote ? formatPct(quote.primeRate) : failed ? '—' : '…'}
                    </strong>
                </div>
                <em className="pc-repo-banner-meta">
                    {loading
                        ? 'Updating…'
                        : quote?.asOf
                          ? `As of ${quote.asOf}`
                          : quote?.source === 'fallback' || failed
                            ? 'Indicative fallback'
                            : 'Live market'}
                </em>
            </aside>
        );
    }

    return (
        <aside
            className={`repo-rate-banner${className ? ` ${className}` : ''}`}
            aria-label="South African repo and prime rates"
        >
            <div className="repo-rate-banner-lead">
                <span className="repo-rate-banner-icon" aria-hidden>
                    {loading ? <RefreshCw className="animate-spin" /> : <Landmark />}
                </span>
                <div>
                    <p className="repo-rate-banner-kicker">Market pulse</p>
                    <p className="repo-rate-banner-title">SARB repo &amp; prime</p>
                </div>
            </div>
            <div className="repo-rate-banner-stats">
                <div>
                    <span>Repo rate</span>
                    <strong>
                        {loading ? '…' : quote ? formatPct(quote.repoRate) : failed ? '—' : '…'}
                    </strong>
                </div>
                <div>
                    <span>Prime lending</span>
                    <strong>
                        {loading ? '…' : quote ? formatPct(quote.primeRate) : failed ? '—' : '…'}
                    </strong>
                </div>
            </div>
            <p className="repo-rate-banner-note">
                {loading
                    ? 'Fetching live central-bank rate…'
                    : quote
                      ? `${quote.rateName || 'South African Reserve Bank'}${
                            quote.asOf ? ` · updated ${quote.asOf}` : ''
                        }${
                            quote.source === 'fallback' || quote.provider === 'fallback'
                                ? ' · showing safe fallback while live feed settles'
                                : ' · bonds typically price off prime'
                        }`
                      : 'Live rate unavailable — check back shortly.'}
            </p>
        </aside>
    );
}
