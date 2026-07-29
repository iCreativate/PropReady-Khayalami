import { jsPDF } from 'jspdf';
import { formatDate, formatMonthsAsYears, formatPct, formatZar } from '@/lib/smart-bond/format';
import type { BondProfile } from '@/lib/smart-bond/types';
import { DISCLAIMER } from '@/lib/smart-bond/types';
import { compareBaselineVsOptimized, equityNow, ltvPct } from '@/lib/smart-bond/engine';

export function downloadTextFile(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportAmortisationCsv(
    rows: Array<{
        period: number;
        label: string;
        payment: number;
        principal: number;
        interest: number;
        extra: number;
        balance: number;
    }>
) {
    const header = 'Period,Label,Payment,Principal,Interest,Extra,Balance\n';
    const body = rows
        .map(
            (r) =>
                `${r.period},${r.label},${r.payment.toFixed(2)},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${r.extra.toFixed(2)},${r.balance.toFixed(2)}`
        )
        .join('\n');
    downloadTextFile('propready-amortisation.csv', header + body, 'text/csv;charset=utf-8');
}

export function exportFinancialSummaryPdf(profile: BondProfile) {
    const cmp = compareBaselineVsOptimized(profile);
    const p = cmp.profile;
    const equity = equityNow(p.propertyValue, p.outstandingBalance);
    const ltv = ltvPct(p.outstandingBalance, p.propertyValue);
    const doc = new jsPDF();
    let y = 16;
    const line = (t: string, size = 11) => {
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(t, 180);
        doc.text(lines, 14, y);
        y += lines.length * (size * 0.45) + 4;
        if (y > 270) {
            doc.addPage();
            y = 16;
        }
    };
    line('PropReady — Smart Bond Optimizer', 16);
    line('Financial Summary Report (educational estimates)', 12);
    line(`Generated ${formatDate(new Date())}`, 10);
    line('');
    line(`Property value: ${formatZar(p.propertyValue)}`);
    line(`Outstanding balance: ${formatZar(p.outstandingBalance)}`);
    line(`Estimated equity: ${formatZar(equity)}`);
    line(`Estimated LTV: ${formatPct(ltv, 1)}`);
    line(`Interest rate: ${formatPct(p.annualInterestRate, 2)} (${p.interestType})`);
    line(`Monthly repayment: ${formatZar(p.monthlyRepayment)}`);
    line(`Extra monthly: ${formatZar(p.extraMonthly)}`);
    line(`Annual lump sum: ${formatZar(p.annualLumpSum)}`);
    line(`Estimated months to settle (with extras): ${cmp.optimized.monthsToSettle}`);
    line(`Estimated term saved: ${formatMonthsAsYears(cmp.monthsSaved)}`);
    line(`Estimated interest saved: ${formatZar(cmp.interestSaved)}`);
    line('');
    line(DISCLAIMER, 9);
    doc.save('propready-smart-bond-summary.pdf');
}
