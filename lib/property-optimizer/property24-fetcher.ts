const P24_UA = 'PropReady/1.0 (suburb market; +https://propready.co.za)';

export interface Property24PricePoint {
    year: number;
    avgPropertyPrice: number;
}

function extractAveragePriceRows(html: string): Property24PricePoint | null {
    const marker = 'averagePropertyPriceGraph_Suburb_';
    const idx = html.indexOf(marker);
    if (idx === -1) return null;

    const rowsStart = html.indexOf('"rows":[', idx);
    if (rowsStart === -1) return null;

    let depth = 0;
    let begin = -1;
    for (let i = rowsStart + 7; i < html.length; i++) {
        const ch = html[i];
        if (ch === '[') {
            if (depth === 0) begin = i;
            depth++;
        } else if (ch === ']') {
            depth--;
            if (depth === 0) {
                try {
                    const rows = JSON.parse(html.slice(begin, i + 1)) as {
                        c: { v: number }[];
                    }[];
                    if (!rows.length) return null;
                    const latest = rows[rows.length - 1];
                    const year = latest.c[0]?.v;
                    const avgPropertyPrice = latest.c[1]?.v;
                    if (!year || !avgPropertyPrice) return null;
                    return { year, avgPropertyPrice };
                } catch {
                    return null;
                }
            }
        }
    }

    return null;
}

export function parseProperty24AveragePrice(html: string): Property24PricePoint | null {
    return extractAveragePriceRows(html);
}

export async function fetchProperty24SuburbPrice(p24Path: string): Promise<Property24PricePoint | null> {
    const url = p24Path.startsWith('http') ? p24Path : `https://www.property24.com${p24Path}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': P24_UA },
        next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return parseProperty24AveragePrice(html);
}
