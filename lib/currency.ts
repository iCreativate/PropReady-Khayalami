/**
 * Currency formatting utilities
 * Ensures all currency values are displayed with proper comma formatting
 */

/**
 * Formats a number as South African Rand currency with commas
 * @param amount - The amount to format
 * @param includeSymbol - Whether to include the R symbol (default: true)
 * @returns Formatted currency string (e.g., "R 1,000,000" or "1,000,000")
 */
export function formatCurrency(amount: number, includeSymbol: boolean = true): string {
    const formatted = new Intl.NumberFormat('en-ZA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
    
    return includeSymbol ? `R ${formatted}` : formatted;
}

/**
 * Formats a number with commas (no currency symbol)
 * @param num - The number to format
 * @returns Formatted number string (e.g., "1,000,000")
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-ZA').format(num);
}

/**
 * Formats a number as full currency with R symbol and commas
 * Uses Intl.NumberFormat for consistent formatting
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "R1,000,000")
 */
export function formatCurrencyFull(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
