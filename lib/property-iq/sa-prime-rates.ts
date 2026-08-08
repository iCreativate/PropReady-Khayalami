/**
 * South African prime lending rate history (commercial-bank prime).
 * Sources: FNB published historical prime rates + BetterBond / SARB-aligned MPC dates.
 * Prime is conventionally repo + 3.5pp. Home loans are typically priced as Prime ± margin.
 */

export type PrimeRateChange = {
    /** Inclusive effective date (ISO YYYY-MM-DD). */
    date: string;
    /** Prime lending rate % p.a. */
    prime: number;
};

/**
 * Ascending effective dates. Lookup uses the latest change on or before the query date.
 * Current prime (as of mid-2026 FNB publication): 10.50%.
 */
export const SA_PRIME_RATE_CHANGES: readonly PrimeRateChange[] = [
    { date: '2000-01-21', prime: 14.5 },
    { date: '2001-06-18', prime: 13.75 },
    { date: '2001-07-16', prime: 13.5 },
    { date: '2002-01-16', prime: 14.0 },
    { date: '2002-03-18', prime: 15.0 },
    { date: '2002-06-14', prime: 16.0 },
    { date: '2002-09-13', prime: 17.0 },
    { date: '2003-06-13', prime: 15.5 },
    { date: '2003-08-15', prime: 14.5 },
    { date: '2003-09-15', prime: 13.5 },
    { date: '2003-10-20', prime: 12.0 },
    { date: '2003-12-15', prime: 11.5 },
    { date: '2004-08-16', prime: 11.0 },
    { date: '2005-04-15', prime: 10.5 },
    { date: '2006-06-08', prime: 11.0 },
    { date: '2006-08-03', prime: 11.5 },
    { date: '2006-10-13', prime: 12.0 },
    { date: '2006-12-08', prime: 12.5 },
    { date: '2007-06-08', prime: 13.0 },
    { date: '2007-08-17', prime: 13.5 },
    { date: '2007-10-12', prime: 14.0 },
    { date: '2007-12-07', prime: 14.5 },
    { date: '2008-04-11', prime: 15.0 },
    { date: '2008-06-13', prime: 15.5 },
    { date: '2008-12-12', prime: 15.0 },
    { date: '2009-02-06', prime: 14.0 },
    { date: '2009-03-25', prime: 13.0 },
    { date: '2009-05-04', prime: 12.0 },
    { date: '2009-05-29', prime: 11.0 },
    { date: '2009-08-14', prime: 10.5 },
    { date: '2010-03-26', prime: 10.0 },
    { date: '2010-09-10', prime: 9.5 },
    { date: '2010-11-19', prime: 9.0 },
    { date: '2012-07-20', prime: 8.5 },
    { date: '2014-01-30', prime: 9.0 },
    { date: '2014-07-18', prime: 9.25 },
    { date: '2015-07-24', prime: 9.5 },
    { date: '2015-11-20', prime: 9.75 },
    { date: '2016-01-29', prime: 10.25 },
    { date: '2016-03-18', prime: 10.5 },
    { date: '2017-07-21', prime: 10.25 },
    { date: '2018-03-29', prime: 10.0 },
    { date: '2018-11-23', prime: 10.25 },
    { date: '2019-07-19', prime: 10.0 },
    { date: '2020-01-17', prime: 9.75 },
    { date: '2020-03-20', prime: 8.75 },
    { date: '2020-04-15', prime: 7.75 },
    { date: '2020-05-22', prime: 7.25 },
    { date: '2020-07-24', prime: 7.0 },
    { date: '2021-11-19', prime: 7.25 },
    { date: '2022-01-28', prime: 7.5 },
    { date: '2022-03-25', prime: 7.75 },
    { date: '2022-05-20', prime: 8.25 },
    { date: '2022-07-22', prime: 9.0 },
    { date: '2022-09-23', prime: 9.75 },
    { date: '2022-11-25', prime: 10.5 },
    { date: '2023-01-27', prime: 10.75 },
    { date: '2023-03-31', prime: 11.25 },
    { date: '2023-05-26', prime: 11.75 },
    { date: '2024-09-20', prime: 11.5 },
    { date: '2024-11-22', prime: 11.25 },
    { date: '2025-01-30', prime: 11.0 },
    { date: '2025-05-30', prime: 10.75 },
    { date: '2025-08-01', prime: 10.5 },
    { date: '2025-11-20', prime: 10.25 },
    { date: '2026-05-29', prime: 10.5 },
] as const;

function toDay(d: Date): number {
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseIsoDay(iso: string): number {
    const [y, m, day] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, day);
}

/** Latest published prime rate in the static series (offline fallback). Prefer {@link scrapeSaPrimeLendingRate} / {@link fetchLiveSaPrimeRate} for live SARB data. */
export function currentSaPrimeRate(): number {
    return SA_PRIME_RATE_CHANGES[SA_PRIME_RATE_CHANGES.length - 1].prime;
}

/** Prime rate effective on a calendar date. */
export function saPrimeRateOn(date: Date): number {
    const day = toDay(date);
    let rate = SA_PRIME_RATE_CHANGES[0].prime;
    for (const change of SA_PRIME_RATE_CHANGES) {
        if (parseIsoDay(change.date) <= day) rate = change.prime;
        else break;
    }
    return rate;
}

/**
 * Infer the client's margin vs prime from their quoted bond rate.
 * SA home loans are usually Prime ± margin (e.g. Prime − 1.0%).
 */
export function inferPrimeMargin(quotedBondRatePct: number): number {
    if (!(quotedBondRatePct > 0)) return 0;
    return Math.round((quotedBondRatePct - currentSaPrimeRate()) * 100) / 100;
}

/** Effective home-loan rate on a date: historical prime + client's margin. */
export function saBondRateOn(date: Date, marginPct: number): number {
    return Math.round((saPrimeRateOn(date) + marginPct) * 100) / 100;
}

export function formatPrimeMargin(marginPct: number): string {
    if (Math.abs(marginPct) < 0.005) return 'Prime';
    const sign = marginPct > 0 ? '+' : '−';
    return `Prime ${sign} ${Math.abs(marginPct).toFixed(2)}%`;
}
