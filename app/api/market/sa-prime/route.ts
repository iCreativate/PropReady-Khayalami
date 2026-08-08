import { NextResponse } from 'next/server';
import { fetchApiNinjasInterestRate } from '@/lib/api-ninjas/interest-rate';
import {
    FALLBACK_SA_PRIME_RATE,
    FALLBACK_SA_REPO_RATE,
    scrapeSaPrimeLendingRate,
    type SaPrimeQuote,
} from '@/lib/property-iq/fetch-sa-prime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Cap serverless / route work so portal pages never wait on slow upstreams. */
export const maxDuration = 15;

const OVERALL_BUDGET_MS = 8_000;

function withBudget<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), ms);
        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch(() => {
                clearTimeout(timer);
                resolve(null);
            });
    });
}

/**
 * Live SA repo → prime.
 * 1) API Ninjas Interest Rate (central bank / policy)
 * 2) SARB scrape / homepage rates API
 * 3) Structured fallback rates (never fails hard)
 */
export async function GET() {
    const started = Date.now();

    const ninjas = await withBudget(fetchApiNinjasInterestRate(), 4_000);

    if (ninjas?.source === 'api-ninjas') {
        const quote: SaPrimeQuote = {
            repoRate: ninjas.ratePct,
            primeRate: ninjas.primeRate,
            source: 'api-ninjas',
            asOf: ninjas.lastUpdated,
        };
        return NextResponse.json(
            {
                ...quote,
                rateName: ninjas.rateName,
                provider: 'api-ninjas',
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                },
            }
        );
    }

    const remaining = Math.max(2_000, OVERALL_BUDGET_MS - (Date.now() - started));
    const scraped = await withBudget(
        scrapeSaPrimeLendingRate({ timeoutMs: Math.min(5_000, remaining) }),
        remaining
    );

    const quote: SaPrimeQuote = scraped ?? {
        repoRate: FALLBACK_SA_REPO_RATE,
        primeRate: FALLBACK_SA_PRIME_RATE,
        source: 'fallback',
        error: 'Upstream rate providers timed out',
    };

    return NextResponse.json(
        {
            ...quote,
            rateName:
                quote.source === 'fallback'
                    ? 'South African Reserve Bank (fallback)'
                    : 'South African Reserve Bank',
            provider: quote.source === 'fallback' ? 'fallback' : 'sarb',
            ninjasNote: ninjas?.error,
        },
        {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        }
    );
}
