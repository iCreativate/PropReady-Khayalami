export interface QuoteSegment {
    quote: string;
    type: 'double' | 'single' | 'curly';
}

const QUOTE_REGEX =
    /"([^"]+)"|'([^']+)'|“([^”]+)”|‘([^’]+)’|&quot;([^&]+)&quot;/g;

export function extractQuotesFromText(text: string): {
    quotes: string[];
    remainder: string;
} {
    const quotes: string[] = [];
    let remainder = text;

    QUOTE_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = QUOTE_REGEX.exec(text)) !== null) {
        const quote = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5];
        if (quote && quote.trim().length > 8) {
            quotes.push(quote.trim());
            remainder = remainder.replace(match[0], '').trim();
        }
    }

    remainder = remainder
        .replace(/\s{2,}/g, ' ')
        .replace(/:\s*$/, '')
        .replace(/^[—–-]\s*/, '')
        .trim();

    return { quotes, remainder };
}

export function isPrimarilyQuoted(text: string): boolean {
    const { quotes, remainder } = extractQuotesFromText(text);
    return quotes.length > 0 && remainder.length < 20;
}
