import type { OptimizerSnapshot, SaleProceedsBreakdown } from './types';
import { formatZAR } from './engine';

const BRAND = {
    red: [229, 57, 53] as [number, number, number],
    redDark: [198, 40, 40] as [number, number, number],
    charcoal: [27, 27, 27] as [number, number, number],
    muted: [100, 100, 100] as [number, number, number],
    light: [247, 248, 250] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    line: [230, 230, 230] as [number, number, number],
};

export type PvoExportPayload = {
    snapshot: OptimizerSnapshot;
    proceeds?: SaleProceedsBreakdown | null;
    appreciationPct?: number;
    yearsOwned?: number;
    preparedFor?: string;
};

function safeName(suburb: string) {
    const base = (suburb || 'property').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    return `propready-pvo-${base || 'report'}-${new Date().toISOString().slice(0, 10)}.pdf`;
}

/**
 * PropReady-branded Property Value Optimizer PDF report.
 * Browser-only (lazy-loads jspdf).
 */
export async function exportPropertyValueReportPdf(payload: PvoExportPayload) {
    if (typeof window === 'undefined') return;

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentW = pageW - margin * 2;
    let y = 0;

    const { snapshot, proceeds, appreciationPct, yearsOwned, preparedFor } = payload;
    const property = snapshot.property;
    const market = snapshot.market;

    const ensureSpace = (need: number) => {
        if (y + need > pageH - 22) {
            drawFooter();
            doc.addPage();
            drawHeader(false);
            y = 36;
        }
    };

    const drawHeader = (cover: boolean) => {
        doc.setFillColor(...BRAND.red);
        doc.rect(0, 0, pageW, cover ? 42 : 28, 'F');
        doc.setFillColor(...BRAND.redDark);
        doc.rect(0, cover ? 42 : 28, pageW, 1.2, 'F');

        doc.setTextColor(...BRAND.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(cover ? 22 : 14);
        doc.text('Prop', margin, cover ? 18 : 12);
        const propW = doc.getTextWidth('Prop');
        doc.setTextColor(255, 220, 220);
        doc.text('Ready', margin + propW, cover ? 18 : 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(cover ? 11 : 8);
        doc.setTextColor(...BRAND.white);
        doc.text(
            cover ? 'Property Value Optimizer · Decision report' : 'Property Value Optimizer',
            margin,
            cover ? 28 : 20
        );

        doc.setFontSize(8);
        doc.text('propready.co.za', pageW - margin, cover ? 18 : 12, { align: 'right' });
        y = cover ? 52 : 36;
    };

    const drawFooter = () => {
        const page = doc.getNumberOfPages();
        doc.setDrawColor(...BRAND.line);
        doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...BRAND.muted);
        doc.text('PropReady · Educational estimate — not a formal valuation', margin, pageH - 8);
        doc.text(`Page ${page}`, pageW - margin, pageH - 8, { align: 'right' });
    };

    const sectionTitle = (title: string) => {
        ensureSpace(14);
        doc.setFillColor(...BRAND.light);
        doc.roundedRect(margin, y - 4, contentW, 9, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...BRAND.red);
        doc.text(title.toUpperCase(), margin + 3, y + 2.5);
        y += 12;
    };

    const kv = (label: string, value: string) => {
        ensureSpace(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...BRAND.muted);
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND.charcoal);
        const lines = doc.splitTextToSize(value, contentW * 0.55);
        doc.text(lines, pageW - margin, y, { align: 'right' });
        y += Math.max(6.5, lines.length * 4.5);
    };

    const para = (text: string, size = 8.5) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(size);
        doc.setTextColor(...BRAND.muted);
        const lines = doc.splitTextToSize(text, contentW);
        ensureSpace(lines.length * 4.2 + 2);
        doc.text(lines, margin, y);
        y += lines.length * 4.2 + 3;
    };

    // ── Cover / intro
    drawHeader(true);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...BRAND.charcoal);
    doc.text('Property Value Report', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.muted);
    doc.text(
        preparedFor ? `Prepared for ${preparedFor}` : 'Prepared for PropReady client',
        margin,
        y
    );
    y += 5;
    doc.text(`Generated ${new Date().toLocaleString('en-ZA')}`, margin, y);
    y += 10;

    // Hero value card
    doc.setFillColor(...BRAND.charcoal);
    doc.roundedRect(margin, y, contentW, 28, 2, 2, 'F');
    doc.setTextColor(...BRAND.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('ESTIMATED MARKET VALUE', margin + 5, y + 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(formatZAR(snapshot.estimatedMarketValue), margin + 5, y + 20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
        market.hasVerifiedSuburbAverage
            ? `Property24 suburb avg ${formatZAR(market.avgPropertyPrice)}${
                  market.priceYear ? ` · ${market.priceYear}` : ''
              }`
            : 'Model estimate from your inputs',
        pageW - margin - 5,
        y + 20,
        { align: 'right' }
    );
    y += 36;

    para(snapshot.valuationDisclaimer || snapshot.marketStatus, 8);

    // ── Property
    sectionTitle('01 · Property profile');
    kv('Address', property.address || '—');
    kv('Suburb', property.suburb || '—');
    kv('Municipality', property.municipality || '—');
    kv('Province', property.province || '—');
    kv('Type', property.propertyType || '—');
    kv('Bedrooms / Bathrooms', `${property.bedrooms || '—'} / ${property.bathrooms || '—'}`);
    kv('Parking', String(property.garages ?? '—'));
    kv('Floor / Land', `${property.floorSizeSqm || '—'} m² / ${property.landSizeSqm || '—'} m²`);
    kv('Purchase price', property.purchasePrice > 0 ? formatZAR(property.purchasePrice) : '—');
    kv('Purchase date', property.purchaseDate || '—');
    kv('Bond balance', property.bondBalance > 0 ? formatZAR(property.bondBalance) : 'None');
    if (yearsOwned != null) kv('Years owned (est.)', yearsOwned.toFixed(1));
    if (appreciationPct != null) kv('Appreciation vs purchase', `${appreciationPct}%`);

    // ── Market
    sectionTitle('02 · Market anchor');
    kv(
        'Data quality',
        market.hasVerifiedSuburbAverage ? 'Property24 verified suburb average' : 'Insufficient suburb match'
    );
    kv('Source', market.dataSource || '—');
    kv(
        'Suburb average',
        market.hasVerifiedSuburbAverage ? formatZAR(market.avgPropertyPrice) : 'Not matched'
    );
    if (market.priceYear) kv('Price year', String(market.priceYear));
    kv('Valuation basis', snapshot.valuationBasis.replace(/-/g, ' '));
    kv('Confidence', `${snapshot.confidenceScore}%`);

    // ── Value builders
    const features = property.existingFeatures || [];
    sectionTitle('03 · Value builders recorded');
    if (features.length === 0) {
        para('No completed improvements recorded for this report.');
    } else {
        features.forEach((f) => {
            ensureSpace(6);
            doc.setFillColor(...BRAND.red);
            doc.circle(margin + 1.5, y - 1.2, 1.1, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...BRAND.charcoal);
            doc.text(f, margin + 6, y);
            y += 5.5;
        });
        y += 2;
    }

    // ── Proceeds
    sectionTitle('04 · Selling economics');
    if (proceeds) {
        kv('Gross sale (model)', formatZAR(proceeds.grossSalePrice));
        kv('Agent commission', formatZAR(proceeds.toAgent));
        kv('Total deductions', formatZAR(proceeds.totalDeductions));
        kv('Net to seller', formatZAR(proceeds.netToSeller));
        kv('Estimated profit', formatZAR(proceeds.estimatedProfit));
    } else {
        para('Complete expected sale / cost inputs to include a proceeds breakdown.');
    }

    kv('Estimated equity', formatZAR(snapshot.equity));
    kv(
        'Model appreciation rate',
        `${snapshot.avgAnnualAppreciation}% p.a. (disclosed model — not suburb YoY fact)`
    );

    // ── Outlook
    sectionTitle('05 · Modelled outlook');
    ([1, 3, 5, 10] as const).forEach((yr) => {
        kv(`${yr}-year modelled value`, formatZAR(snapshot.futureValues[yr] || 0));
    });

    // ── Alerts / notes
    if (snapshot.alerts?.length) {
        sectionTitle('06 · Notes');
        snapshot.alerts.slice(0, 5).forEach((a) => {
            para(`${a.title}: ${a.message}`, 8);
        });
    }

    // ── Closing
    ensureSpace(28);
    y += 4;
    doc.setDrawColor(...BRAND.red);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + 40, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.charcoal);
    doc.text('PropReady', margin, y);
    y += 5;
    para(
        'This document is generated by PropReady for educational decision support. It is not a bank, municipal, deeds office, or professional valuer appraisal. Always verify with licensed advisors before selling or borrowing.',
        8
    );

    drawFooter();
    doc.save(safeName(property.suburb));
}
