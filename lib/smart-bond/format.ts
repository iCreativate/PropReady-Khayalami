export function formatZar(amount: number, digits = 0) {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(n: number, digits = 0) {
    return new Intl.NumberFormat('en-ZA', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(Number.isFinite(n) ? n : 0);
}

export function formatPct(n: number, digits = 1) {
    return `${formatNumber(n, digits)}%`;
}

export function formatMonthsAsYears(months: number) {
    const m = Math.max(0, Math.round(months));
    const y = Math.floor(m / 12);
    const r = m % 12;
    if (y <= 0) return `${r} mo`;
    if (r === 0) return `${y} yr${y === 1 ? '' : 's'}`;
    return `${y} yr${y === 1 ? '' : 's'} ${r} mo`;
}

export function addMonths(date: Date, months: number) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

export function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
}

export function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}
