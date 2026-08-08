/**
 * Live South African repo → prime helper.
 *
 * Commercial-bank prime is conventionally SARB policy/repo rate + 3.5 percentage points.
 * The public SARB site (resbank.co.za) injects headline rates via JS; we:
 *  1. Fetch official HTML and parse common policy/repo rate patterns
 *  2. Fall back to the HomePageRates JSON API the SARB homepage itself calls
 *  3. Fall back to safe defaults so callers never crash
 *
 * Prefer calling from server-side code (Route Handlers / Server Components).
 */

export const SA_PRIME_SPREAD_OVER_REPO = 3.5;

/** Safe defaults aligned with mid-2026 SARB policy (7.00% repo → 10.50% prime). */
export const FALLBACK_SA_REPO_RATE = 7.0;
export const FALLBACK_SA_PRIME_RATE = FALLBACK_SA_REPO_RATE + SA_PRIME_SPREAD_OVER_REPO;

export const SARB_HOME_URL = 'https://www.resbank.co.za';
export const SARB_HOME_EN_URL = 'https://www.resbank.co.za/en/home';
/** Official indicator feed referenced by the SARB homepage (`#kpiUrlId`). */
export const SARB_HOME_RATES_API =
    'https://custom.resbank.co.za/SarbWebApi/WebIndicators/HomePageRates';

export type SaPrimeSource = 'html' | 'api' | 'api-ninjas' | 'fallback';

export type SaPrimeQuote = {
    /** SARB policy / repo rate (% p.a.). */
    repoRate: number;
    /** Prime lending rate = repo + 3.5 (% p.a.). */
    primeRate: number;
    source: SaPrimeSource;
    /** Observation date from SARB when available (ISO-ish). */
    asOf?: string;
    /** Non-fatal scrape/parse notes. */
    error?: string;
};

const DEFAULT_TIMEOUT_MS = 12_000;
const REPO_MIN = 2;
const REPO_MAX = 25;

function roundRate(n: number): number {
    return Math.round(n * 100) / 100;
}

function isPlausibleRepo(n: number): boolean {
    return Number.isFinite(n) && n >= REPO_MIN && n <= REPO_MAX;
}

function toPrime(repoRate: number): number {
    return roundRate(repoRate + SA_PRIME_SPREAD_OVER_REPO);
}

function fallbackQuote(error: string): SaPrimeQuote {
    return {
        repoRate: FALLBACK_SA_REPO_RATE,
        primeRate: FALLBACK_SA_PRIME_RATE,
        source: 'fallback',
        error,
    };
}

/**
 * Pull a numeric percent from HTML near known SARB policy / repo labels.
 * Tolerant of markup changes (SPR rename, spacing, nested tags).
 */
export function parseSaRepoRateFromHtml(html: string): number | null {
    if (!html || typeof html !== 'string') return null;

    const stripped = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#37;/g, '%');

    const patterns: RegExp[] = [
        /Current\s+SARB\s+Policy\s+Rate\s*\(SPR\)[\s\S]{0,200}?(\d+(?:\.\d+)?)\s*%/i,
        /SARB\s+Policy\s+Rate[\s\S]{0,160}?(\d+(?:\.\d+)?)\s*%/i,
        /SARB\s+POLICY\s+RATE[\s\S]{0,160}?(\d+(?:\.\d+)?)\s*%/i,
        /policy\s+rate(?:\s+unchanged)?[^\d%]{0,80}(\d+(?:\.\d+)?)\s*%/i,
        /repo(?:urchase)?\s+rate[^\d%]{0,80}(\d+(?:\.\d+)?)\s*%/i,
        /id=["']ref_repo["'][\s\S]{0,400}?(\d+(?:\.\d+)?)\s*%/i,
    ];

    for (const re of patterns) {
        const m = stripped.match(re);
        if (!m) continue;
        const value = Number(m[1]);
        if (isPlausibleRepo(value)) return roundRate(value);
    }

    return null;
}

type SarbHomeRateRow = {
    Name?: string;
    Value?: number;
    Date?: string;
};

/**
 * Parse the SARB HomePageRates JSON feed (same data the website header uses).
 */
export function parseSaRepoRateFromHomeApi(payload: unknown): { repoRate: number; asOf?: string } | null {
    if (!Array.isArray(payload)) return null;

    const rows = payload as SarbHomeRateRow[];
    const policy = rows.find((r) => /sarb\s+policy\s+rate/i.test(String(r.Name ?? '')));
    const repo = rows.find((r) => /\brepo\b/i.test(String(r.Name ?? '')));
    const hit = policy ?? repo;
    if (!hit || typeof hit.Value !== 'number') return null;

    const value = Number(hit.Value);
    if (!isPlausibleRepo(value)) return null;
    return { repoRate: roundRate(value), asOf: hit.Date };
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'PropReady-Khayalami/1.0 (+https://propready.co.za; rates helper)',
            },
            // Avoid Next fetch cache serving a stale MPC page forever in prod.
            cache: 'no-store',
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} for ${url}`);
        }
        return await res.text();
    } finally {
        clearTimeout(timer);
    }
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                'User-Agent': 'PropReady-Khayalami/1.0 (+https://propready.co.za; rates helper)',
            },
            cache: 'no-store',
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} for ${url}`);
        }
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Scrape the South African repo / SARB policy rate from resbank.co.za,
 * then return Prime = repo + 3.5.
 *
 * Never throws — failures resolve to {@link FALLBACK_SA_REPO_RATE} /
 * {@link FALLBACK_SA_PRIME_RATE}.
 */
export async function scrapeSaPrimeLendingRate(options?: {
    /** Override homepage URL (default https://www.resbank.co.za). */
    url?: string;
    timeoutMs?: number;
    /** Skip the JSON API fallback (HTML only). */
    htmlOnly?: boolean;
}): Promise<SaPrimeQuote> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const htmlUrls = [options?.url ?? SARB_HOME_URL, SARB_HOME_EN_URL].filter(
        (u, i, arr) => arr.indexOf(u) === i
    );

    const errors: string[] = [];

    for (const url of htmlUrls) {
        try {
            const html = await fetchText(url, timeoutMs);
            const repoRate = parseSaRepoRateFromHtml(html);
            if (repoRate != null) {
                return {
                    repoRate,
                    primeRate: toPrime(repoRate),
                    source: 'html',
                };
            }
            errors.push(`No repo/policy rate pattern in HTML from ${url}`);
        } catch (err) {
            errors.push(err instanceof Error ? err.message : `HTML fetch failed for ${url}`);
        }
    }

    if (!options?.htmlOnly) {
        try {
            const payload = await fetchJson(SARB_HOME_RATES_API, timeoutMs);
            const parsed = parseSaRepoRateFromHomeApi(payload);
            if (parsed) {
                return {
                    repoRate: parsed.repoRate,
                    primeRate: toPrime(parsed.repoRate),
                    source: 'api',
                    asOf: parsed.asOf,
                };
            }
            errors.push('HomePageRates API had no usable SARB Policy Rate row');
        } catch (err) {
            errors.push(err instanceof Error ? err.message : 'HomePageRates API fetch failed');
        }
    }

    return fallbackQuote(errors.join('; ') || 'Unable to resolve SARB repo rate');
}

/**
 * Convenience: prime only (% p.a.), always returns a number.
 */
export async function fetchLiveSaPrimeRate(options?: {
    url?: string;
    timeoutMs?: number;
    htmlOnly?: boolean;
}): Promise<number> {
    const quote = await scrapeSaPrimeLendingRate(options);
    return quote.primeRate;
}
