/**
 * Currency formatting utilities
 * Ensures all currency values use comma thousand separators (e.g. R 1,500,000)
 */

/**
 * Formats a number with comma thousand separators (locale-independent).
 * Always produces e.g. "1,500,000" regardless of browser locale.
 */
export function formatPriceWithCommas(num: number, digits = 0): string {
    if (!Number.isFinite(num)) return digits > 0 ? `0.${'0'.repeat(digits)}` : '0';
    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);

    if (digits <= 0) {
        const n = Math.round(abs);
        if (n === 0) return '0';
        return sign + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    const fixed = abs.toFixed(digits);
    const [intPart, decPart] = fixed.split('.');
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${sign}${intFormatted}.${decPart}`;
}

/**
 * Formats a number as South African Rand with commas (e.g. "R 1,500,000")
 * @param amount - The amount to format
 * @param includeSymbol - Whether to include the R symbol (default: true)
 * @param digits - Decimal places (default: 0)
 */
export function formatCurrency(amount: number, includeSymbol: boolean = true, digits = 0): string {
    const formatted = formatPriceWithCommas(amount, digits);
    return includeSymbol ? `R ${formatted}` : formatted;
}

/**
 * Formats a number with commas (no currency symbol)
 */
export function formatNumber(num: number, digits = 0): string {
    return formatPriceWithCommas(num, digits);
}

/**
 * Formats a raw money input string with comma thousand separators while typing.
 * Digits only → "1250000" becomes "1,250,000". Empty → "".
 */
export function formatMoneyInput(raw: string): string {
    const digitsOnly = String(raw).replace(/[^\d]/g, '');
    if (!digitsOnly) return '';
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parses a money input that may contain commas into an integer amount.
 */
export function parseMoneyInput(raw: string | number | null | undefined): number {
    if (raw == null) return 0;
    if (typeof raw === 'number') return Number.isFinite(raw) ? Math.round(raw) : 0;
    const digitsOnly = String(raw).replace(/[^\d]/g, '');
    if (!digitsOnly) return 0;
    const n = Number(digitsOnly);
    return Number.isFinite(n) ? n : 0;
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
