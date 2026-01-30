/**
 * Currency formatting utilities
 * Ensures all currency values are displayed with comma thousand separators (e.g. 1,500,000)
 */

/**
 * Formats a number with comma thousand separators (locale-independent).
 * Always produces e.g. "1,500,000" regardless of browser locale.
 */
export function formatPriceWithCommas(num: number): string {
    if (num === 0) return '0';
    const n = Math.round(num);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats a number as South African Rand with commas (e.g. "R 1,500,000")
 * @param amount - The amount to format
 * @param includeSymbol - Whether to include the R symbol (default: true)
 */
export function formatCurrency(amount: number, includeSymbol: boolean = true): string {
    const formatted = formatPriceWithCommas(amount);
    return includeSymbol ? `R ${formatted}` : formatted;
}

/**
 * Formats a number with commas (no currency symbol)
 */
export function formatNumber(num: number): string {
    return formatPriceWithCommas(num);
}

/**
 * Parses a string that may contain commas/spaces into a number for display.
 * Use with formatCurrency for consistent "R 1,500,000" output.
 */
export function parseAmountForDisplay(value: string | number | null | undefined): number {
    if (value == null) return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    const cleaned = String(value).replace(/[,\s]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

/**
 * Formats a number as full currency with R symbol and commas
 */
export function formatCurrencyFull(amount: number): string {
    return `R ${formatPriceWithCommas(amount)}`;
}
