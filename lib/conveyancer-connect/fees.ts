import type { FeeEstimate, FeeEstimateInput, PriceBand } from '@/lib/conveyancer-connect/types';

/** Simplified illustrative SA transfer duty bands (not legal advice). */
export function transferDuty(propertyValue: number): number {
    const v = Math.max(0, propertyValue);
    if (v <= 1_100_000) return 0;
    if (v <= 1_512_500) return (v - 1_100_000) * 0.03;
    if (v <= 2_177_500) return 12_375 + (v - 1_512_500) * 0.06;
    if (v <= 2_722_500) return 52_275 + (v - 2_177_500) * 0.08;
    if (v <= 12_100_000) return 95_875 + (v - 2_722_500) * 0.11;
    return 1_127_400 + (v - 12_100_000) * 0.13;
}

function professionalFeeBand(propertyValue: number, band: PriceBand): number {
    const base = Math.min(45_000, Math.max(8_500, propertyValue * 0.012));
    const multipliers: Record<PriceBand, number> = { 1: 0.85, 2: 1, 3: 1.15, 4: 1.35 };
    return Math.round(base * multipliers[band]);
}

function bondRegistrationFee(bondAmount: number, band: PriceBand): number {
    if (bondAmount <= 0) return 0;
    const base = Math.min(28_000, Math.max(6_000, bondAmount * 0.008));
    const multipliers: Record<PriceBand, number> = { 1: 0.9, 2: 1, 3: 1.1, 4: 1.25 };
    return Math.round(base * multipliers[band]);
}

export function estimateFees(input: FeeEstimateInput): FeeEstimate {
    const propertyValue = Math.max(0, input.propertyValue);
    const bondAmount = Math.min(Math.max(0, input.bondAmount), propertyValue);
    const dutyAmount = Math.round(transferDuty(propertyValue));
    const professional = professionalFeeBand(propertyValue, input.priceBand);
    const bondFee = bondRegistrationFee(bondAmount, input.priceBand);
    const deedsOffice = Math.round(Math.min(8_000, Math.max(1_200, propertyValue * 0.0008)));
    const postages = 950;
    const ficaAdmin = 750;
    const ratesClearanceEst = Math.round(Math.min(15_000, Math.max(2_500, propertyValue * 0.0015)));
    const taxable = professional + bondFee + postages + ficaAdmin;
    const vat = Math.round(taxable * 0.15);
    const lines = [
        {
            id: 'transfer-duty',
            label: 'Transfer duty (estimate)',
            amount: dutyAmount,
            explanation:
                'SARS transfer duty estimated from simplified progressive bands on the purchase price. Actual liability depends on exemptions and transaction type.',
        },
        {
            id: 'professional',
            label: 'Conveyancer professional fees',
            amount: professional,
            explanation:
                'Estimated attorney fee band for transfer instruction, based on property value and the firm’s price positioning on PropReady.',
        },
        {
            id: 'bond-reg',
            label: 'Bond registration fees',
            amount: bondFee,
            explanation:
                'Estimated bond attorney fees if a home loan is registered. Zero when no bond amount is entered.',
        },
        {
            id: 'deeds',
            label: 'Deeds Office & lodgement',
            amount: deedsOffice,
            explanation: 'Illustrative Deeds Office and lodgement-related charges for registration.',
        },
        {
            id: 'rates',
            label: 'Rates clearance (estimate)',
            amount: ratesClearanceEst,
            explanation:
                'Placeholder for municipal rates/levy clearance amounts that vary by local authority and outstanding balances.',
        },
        {
            id: 'admin',
            label: 'FICA & administration',
            amount: ficaAdmin + postages,
            explanation: 'Typical FICA onboarding and postage/sundry administration disbursements.',
        },
    ];
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    return {
        lines,
        subtotal,
        vat,
        total: subtotal + vat,
    };
}

export function formatZar(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        maximumFractionDigits: 0,
    }).format(Math.round(amount));
}

export const PRICE_BAND_LABELS: Record<PriceBand, string> = {
    1: 'R',
    2: 'RR',
    3: 'RRR',
    4: 'RRRR',
};
