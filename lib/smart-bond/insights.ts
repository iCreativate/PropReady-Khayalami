import { formatMonthsAsYears, formatPct, formatZar } from '@/lib/smart-bond/format';
import { compareBaselineVsOptimized, equityNow, ltvPct } from '@/lib/smart-bond/engine';
import type { BondProfile, FinancialInsight } from '@/lib/smart-bond/types';

export function buildInsights(profile: BondProfile): FinancialInsight[] {
    const cmp = compareBaselineVsOptimized(profile);
    const p = cmp.profile;
    const equity = equityNow(p.propertyValue, p.outstandingBalance);
    const ltv = ltvPct(p.outstandingBalance, p.propertyValue);
    const insights: FinancialInsight[] = [];

    insights.push({
        id: 'equity-fact',
        kind: 'fact',
        title: 'Estimated equity today',
        body: `Using your inputs, estimated equity is ${formatZar(equity)} (property value minus outstanding balance). This is a calculation from your figures — not a bank valuation.`,
    });

    insights.push({
        id: 'ltv-fact',
        kind: 'fact',
        title: 'Loan-to-value (LTV)',
        body: `Estimated LTV is ${formatPct(ltv, 1)}. Lenders commonly review LTV alongside income, credit history, and valuation when assessing further borrowing.`,
    });

    if (p.extraMonthly > 0 || p.annualLumpSum > 0) {
        insights.push({
            id: 'extra-est',
            kind: 'estimate',
            title: 'Acceleration opportunity',
            body: `With your planned extras, the model estimates about ${formatMonthsAsYears(cmp.monthsSaved)} saved on the term and roughly ${formatZar(cmp.interestSaved)} less interest versus scheduled repayments only. Figures assume constant rates and uninterrupted payments.`,
        });
    } else {
        insights.push({
            id: 'extra-opp',
            kind: 'opportunity',
            title: 'Consider modest extras',
            body: 'Even a small consistent extra repayment can reduce total interest and shorten the term in a standard amortising model. Try the Optimizer sliders to see estimated impact — results are illustrative only.',
        });
    }

    if (ltv > 80) {
        insights.push({
            id: 'ltv-opp',
            kind: 'opportunity',
            title: 'LTV improvement path',
            body: 'Estimated LTV is relatively elevated. Building equity through repayments and (where it occurs) property value growth can improve LTV over time. Accessing equity later depends on lender criteria.',
        });
    }

    if (p.interestType === 'variable') {
        insights.push({
            id: 'rate-assump',
            kind: 'assumption',
            title: 'Variable rate assumption',
            body: 'Projections hold your current rate constant unless you model shocks in the Rates or Scenario tools. South African variable home loans typically move with prime, which is linked to the repo rate set by the SARB — past moves do not predict future rates.',
        });
    } else {
        insights.push({
            id: 'fixed-assump',
            kind: 'assumption',
            title: 'Fixed-rate window',
            body: 'Fixed-rate products usually apply for a defined period and may include break costs. After the fixed term, loans often revert to a variable rate — check your specific loan agreement.',
        });
    }

    insights.push({
        id: 'wealth-edu',
        kind: 'opportunity',
        title: 'Long-term property wealth',
        body: 'A common wealth path is: stabilise the primary bond → reduce interest via extras/access-bond deposits where offered → grow equity → only then explore further property if affordability, buffers, and risk tolerance support it. This is education, not a recommendation to invest.',
    });

    return insights;
}
