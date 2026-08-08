/**
 * API Ninjas Interest Rate client.
 * Docs: https://api-ninjas.com/api/interestrate
 *
 * Prefers v2 `?rate=` for a single central-bank / prime quote, then falls back to
 * the older v1 catalogue response and finally to a structured local fallback.
 */

import {
    API_NINJAS_SA_RATE_IDS,
    getApiNinjasConfig,
    type ApiNinjasConfig,
} from './config';
import {
    FALLBACK_SA_PRIME_RATE,
    FALLBACK_SA_REPO_RATE,
    SA_PRIME_SPREAD_OVER_REPO,
} from '@/lib/property-iq/fetch-sa-prime';

export type ApiNinjasInterestRateQuote = {
    /** Human-readable rate name from the API when available. */
    rateName: string;
    /** Central bank / policy / repo rate (% p.a.). */
    ratePct: number;
    /** Derived commercial prime (repo + 3.5) for SA context. */
    primeRate: number;
    /** MM-DD-YYYY or ISO date when the provider last refreshed the rate. */
    lastUpdated?: string;
    /** Which identifier / path produced the quote. */
    rateId: string;
    source: 'api-ninjas' | 'fallback';
    /** Non-fatal notes when falling back or partially succeeding. */
    error?: string;
};

type V2InterestRateResponse = {
    rate_name?: string;
    rate_pct?: number | string;
    last_updated?: string;
};

type V1CentralBankRow = {
    country?: string;
    central_bank?: string;
    rate_pct?: number | string;
    last_updated?: string;
};

type V1InterestRateResponse = {
    central_bank_rates?: V1CentralBankRow[];
    non_central_bank_rates?: Array<{ name?: string; rate_pct?: number | string }>;
};

function roundRate(n: number): number {
    return Math.round(n * 100) / 100;
}

function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const n = Number(value.replace(/%/g, '').trim());
        if (Number.isFinite(n)) return n;
    }
    return null;
}

function isPlausiblePolicyRate(n: number): boolean {
    return n >= 0.1 && n <= 30;
}

function elegantFallback(error: string): ApiNinjasInterestRateQuote {
    return {
        rateName: 'South African Reserve Bank (fallback)',
        ratePct: FALLBACK_SA_REPO_RATE,
        primeRate: FALLBACK_SA_PRIME_RATE,
        rateId: 'fallback',
        source: 'fallback',
        lastUpdated: undefined,
        error,
    };
}

async function getJson(
    url: string,
    config: ApiNinjasConfig
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
    if (!config.apiKey) {
        return { ok: false, error: 'API_NINJAS_API_KEY is not configured' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Api-Key': config.apiKey,
                Accept: 'application/json',
            },
            signal: controller.signal,
            cache: 'no-store',
        });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            return {
                ok: false,
                error: `API Ninjas ${res.status}${body ? `: ${body.slice(0, 180)}` : ''}`,
            };
        }

        const data: unknown = await res.json();
        return { ok: true, data };
    } catch (err) {
        if (
            err instanceof Error &&
            (err.name === 'AbortError' || err.name === 'TimeoutError')
        ) {
            return { ok: false, error: 'API Ninjas request timed out' };
        }
        return {
            ok: false,
            error: err instanceof Error ? err.message : 'API Ninjas request failed',
        };
    } finally {
        clearTimeout(timer);
    }
}

function quoteFromV2(
    data: V2InterestRateResponse,
    rateId: string
): ApiNinjasInterestRateQuote | null {
    const ratePct = toNumber(data.rate_pct);
    if (ratePct == null || !isPlausiblePolicyRate(ratePct)) return null;
    return {
        rateName: data.rate_name?.trim() || rateId,
        ratePct: roundRate(ratePct),
        primeRate: roundRate(ratePct + SA_PRIME_SPREAD_OVER_REPO),
        lastUpdated: data.last_updated,
        rateId,
        source: 'api-ninjas',
    };
}

function findSouthAfricaRow(rows: V1CentralBankRow[] | undefined): V1CentralBankRow | null {
    if (!Array.isArray(rows)) return null;
    const match = rows.find((row) => {
        const hay = `${row.country ?? ''} ${row.central_bank ?? ''}`.toLowerCase();
        return (
            hay.includes('south africa') ||
            hay.includes('sarb') ||
            hay.includes('reserve bank of south')
        );
    });
    return match ?? null;
}

function quoteFromV1Catalogue(data: V1InterestRateResponse): ApiNinjasInterestRateQuote | null {
    const row = findSouthAfricaRow(data.central_bank_rates);
    if (!row) return null;
    const ratePct = toNumber(row.rate_pct);
    if (ratePct == null || !isPlausiblePolicyRate(ratePct)) return null;
    return {
        rateName: row.central_bank?.trim() || row.country?.trim() || 'South Africa',
        ratePct: roundRate(ratePct),
        primeRate: roundRate(ratePct + SA_PRIME_SPREAD_OVER_REPO),
        lastUpdated: row.last_updated,
        rateId: 'v1:south_africa',
        source: 'api-ninjas',
    };
}

/**
 * Asynchronous GET against API Ninjas Interest Rate.
 * Extracts the SA central-bank / repo rate (and derived prime) with an elegant fallback.
 *
 * Free-tier keys support the v1 catalogue; v2 single-rate is premium-only.
 * We try v1 first for South Africa, then v2 identifiers if needed.
 */
export async function fetchApiNinjasInterestRate(options?: {
    /** Override rate id(s); defaults to SA central-bank candidates. */
    rateIds?: string[];
    config?: ApiNinjasConfig;
}): Promise<ApiNinjasInterestRateQuote> {
    const config = options?.config ?? getApiNinjasConfig();
    if (!config.configured || !config.apiKey) {
        return elegantFallback(
            'API Ninjas key missing — using SARB-aligned fallback repo and prime.'
        );
    }

    const errors: string[] = [];

    // Free tier: full catalogue (includes South_Africa).
    const v1 = await getJson(`${config.baseUrl}/v1/interestrate`, config);
    if (v1.ok) {
        const quote = quoteFromV1Catalogue(v1.data as V1InterestRateResponse);
        if (quote) return quote;
        errors.push('v1: South Africa row not found');
    } else {
        errors.push(`v1: ${v1.error}`);
    }

    // Premium: single-rate v2 identifiers.
    const rateIds = options?.rateIds?.length
        ? options.rateIds
        : [...API_NINJAS_SA_RATE_IDS];

    for (const rateId of rateIds) {
        const url = `${config.baseUrl}/v2/interestrate?rate=${encodeURIComponent(rateId)}`;
        const result = await getJson(url, config);
        if (!result.ok) {
            errors.push(`${rateId}: ${result.error}`);
            // Skip further premium attempts when the plan blocks v2.
            if (/premium subscribers only/i.test(result.error)) break;
            continue;
        }
        const quote = quoteFromV2(result.data as V2InterestRateResponse, rateId);
        if (quote) return quote;
        errors.push(`${rateId}: unexpected JSON shape`);
    }

    return elegantFallback(
        errors.join(' · ') || 'Unable to resolve SA central bank rate from API Ninjas'
    );
}

/** Convenience: repo (policy) rate only — always returns a number. */
export async function fetchApiNinjasSaRepoRate(): Promise<number> {
    const quote = await fetchApiNinjasInterestRate();
    return quote.ratePct;
}
