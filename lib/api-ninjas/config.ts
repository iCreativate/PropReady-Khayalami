/**
 * API Ninjas configuration — server-side only.
 * Never expose the API key to the browser.
 */

export const API_NINJAS_BASE_URL = 'https://api.api-ninjas.com';

/** Preferred SARB / South Africa policy rate identifiers (v2). */
export const API_NINJAS_SA_RATE_IDS = [
    'central_bank_za',
    'central_bank_south_africa',
] as const;

export type ApiNinjasConfig = {
    apiKey: string | null;
    baseUrl: string;
    timeoutMs: number;
    configured: boolean;
};

/**
 * Read API Ninjas credentials from the environment.
 * Supports `API_NINJAS_API_KEY` (preferred) and `API_NINJAS_KEY`.
 */
export function getApiNinjasConfig(): ApiNinjasConfig {
    const apiKey =
        process.env.API_NINJAS_API_KEY?.trim() ||
        process.env.API_NINJAS_KEY?.trim() ||
        null;

    const timeoutRaw = Number(process.env.API_NINJAS_TIMEOUT_MS);
    const timeoutMs =
        Number.isFinite(timeoutRaw) && timeoutRaw >= 2_000 && timeoutRaw <= 30_000
            ? timeoutRaw
            : 10_000;

    return {
        apiKey,
        baseUrl: (process.env.API_NINJAS_BASE_URL?.trim() || API_NINJAS_BASE_URL).replace(
            /\/$/,
            ''
        ),
        timeoutMs,
        configured: Boolean(apiKey),
    };
}
