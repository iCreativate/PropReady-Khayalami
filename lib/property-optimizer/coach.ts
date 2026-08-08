import { formatPriceWithCommas } from '@/lib/currency';
import type { ImprovementRecommendation, OptimizerSnapshot } from './types';

export interface CoachResponse {
    answer: string;
    evidence: string[];
    confidence: number;
    recommendation: string;
}

const QUESTION_PATTERNS: { pattern: RegExp; handler: (s: OptimizerSnapshot, imps: ImprovementRecommendation[]) => CoachResponse }[] = [
    {
        pattern: /renovat/i,
        handler: (s, imps) => {
            const top = imps[0];
            return {
                answer: `Yes — targeted renovations make sense for your ${s.property.suburb} property. With buyer demand at ${s.market.buyerDemand}/100 and ${s.market.avgDaysOnMarket} avg days on market, quality upgrades should improve both value and saleability.`,
                evidence: [
                    `Current estimated value: R ${formatPriceWithCommas(s.estimatedMarketValue)}`,
                    `Top ROI improvement: ${top?.name} at ${top?.estimatedRoi}% ROI`,
                    `Market temperature: ${s.marketStatus}`,
                ],
                confidence: 84,
                recommendation: `Prioritise ${top?.name ?? 'kitchen refresh'} before listing — highest modelled return in your suburb profile.`,
            };
        },
    },
    {
        pattern: /sell now|sell\?/i,
        handler: (s) => ({
            answer: s.market.buyerDemand >= 75
                ? `Market conditions favour sellers now — demand is ${s.market.buyerDemand}/100 with ${s.market.priceGrowthYoY}% YoY growth. Waiting 12 months could yield ~${s.avgAnnualAppreciation}% appreciation but carries rate and inventory risk.`
                : `Consider holding unless you need liquidity — demand is moderate at ${s.market.buyerDemand}/100.`,
            evidence: [
                `${s.market.propertiesSold90d} sales in 90 days locally`,
                `Inventory: ${s.market.inventoryMonths} months`,
                `Your equity: R ${formatPriceWithCommas(s.equity)}`,
            ],
            confidence: 79,
            recommendation: s.market.buyerDemand >= 75 ? 'List within 90 days if renovations complete.' : 'Complete high-ROI upgrades first, then reassess in Q3.',
        }),
    },
    {
        pattern: /rent instead/i,
        handler: (s) => ({
            answer: `Rental yield estimate is ~${((s.estimatedRentalValue * 12) / s.estimatedMarketValue * 100).toFixed(1)}% gross. With rental demand at ${s.market.rentalDemand}/100, letting could work if you don't need sale proceeds immediately.`,
            evidence: [
                `Est. rental: R ${formatPriceWithCommas(s.estimatedRentalValue)}/month`,
                `Investor demand: ${s.market.investorDemand}/100`,
                `Flatlet could add R8,500+/month`,
            ],
            confidence: 76,
            recommendation: 'Model net yield after rates, levies and maintenance before choosing rent vs sell.',
        }),
    },
    {
        pattern: /highest roi|best roi|which renovation/i,
        handler: (_s, imps) => {
            const top3 = imps.slice(0, 3);
            return {
                answer: `Based on hybrid valuation modelling for your location, the highest ROI improvements are: ${top3.map((i) => `${i.name} (${i.estimatedRoi}%)`).join(', ')}.`,
                evidence: top3.map((i) => `${i.name}: cost R ${formatPriceWithCommas(i.estimatedCost)}, uplift R ${formatPriceWithCommas(i.estimatedValueIncrease)}`),
                confidence: top3[0]?.confidence ?? 80,
                recommendation: `Start with ${top3[0]?.name} — ${top3[0]?.timeWeeks} weeks, ${top3[0]?.difficulty} difficulty.`,
            };
        },
    },
    {
        pattern: /cottage|flatlet|granny/i,
        handler: (s, imps) => {
            const cottage = imps.find((i) => i.id === 'cottage' || i.id === 'flatlet');
            return {
                answer: cottage
                    ? `${cottage.name} shows ${cottage.estimatedRoi}% ROI with strong rental demand (${s.market.rentalDemand}/100). Verify municipal zoning for secondary dwelling first.`
                    : 'Secondary dwelling conversions require zoning confirmation with City of Johannesburg.',
                evidence: cottage
                    ? cottage.factors
                    : ['Check SG diagram', 'Confirm coverage ratio', 'Investor demand index'],
                confidence: cottage?.confidence ?? 72,
                recommendation: cottage ? `Budget ~R ${formatPriceWithCommas(cottage.estimatedCost)} — expected uplift R ${formatPriceWithCommas(cottage.estimatedValueIncrease)}.` : 'Consult town planner before proceeding.',
            };
        },
    },
    {
        pattern: /solar/i,
        handler: (s, imps) => {
            const solar = imps.find((i) => i.id === 'solar');
            return {
                answer: `Solar is often a strong buyer filter in South Africa because of load-shedding. Modelled illustrative ROI: ${solar?.estimatedRoi ?? 'n/a'}%. Confirm quotes locally — this is not a registered valuation.`,
                evidence: [
                    s.market.hasVerifiedSuburbAverage
                        ? `Property24 suburb average: R ${formatPriceWithCommas(s.market.avgPropertyPrice)}`
                        : 'No Property24 suburb average matched yet',
                    `Energy features score ${s.categoryScores.find((c) => c.id === 'energy')?.score ?? '—'}/100 from your recorded upgrades`,
                    s.valuationDisclaimer,
                ],
                confidence: Math.min(
                    solar?.confidence ?? 70,
                    s.market.hasVerifiedSuburbAverage ? 78 : 55
                ),
                recommendation: 'Get local installer quotes and compare against your purchase-growth estimate.',
            };
        },
    },
    {
        pattern: /wait.*year|another year/i,
        handler: (s) => ({
            answer: `Waiting 12 months could add ~R${s.monthlyAppreciation * 12} under the disclosed model rate of ${s.avgAnnualAppreciation}% p.a. This is a scenario tool, not a suburb YoY fact.`,
            evidence: [
                `1yr model forecast: R ${formatPriceWithCommas(s.futureValues[1])}`,
                s.market.hasVerifiedSuburbAverage
                    ? `Property24 suburb average: R ${formatPriceWithCommas(s.market.avgPropertyPrice)}`
                    : 'No Property24 suburb average matched',
                s.valuationDisclaimer,
            ],
            confidence: s.market.hasVerifiedSuburbAverage ? 62 : 45,
            recommendation: 'Use your own risk appetite — confirm with a local agent and formal valuation if needed.',
        }),
    },
];

export function answerCoachQuestion(
    question: string,
    snapshot: OptimizerSnapshot,
    improvements: ImprovementRecommendation[]
): CoachResponse {
    for (const { pattern, handler } of QUESTION_PATTERNS) {
        if (pattern.test(question)) {
            return handler(snapshot, improvements);
        }
    }

    return {
        answer: `Based on your ${snapshot.property.suburb} property valued at R ${formatPriceWithCommas(snapshot.estimatedMarketValue)} with a ${snapshot.overallAiScore}/100 AI score, I recommend reviewing the Improvement Engine for data-backed options. Ask about renovations, selling, renting, solar, or ROI comparisons.`,
        evidence: [
            `Confidence: ${snapshot.confidenceScore}%`,
            `Investment grade: ${snapshot.investmentGrade}`,
            `Market: ${snapshot.marketStatus}`,
        ],
        confidence: 65,
        recommendation: 'Try: "Which renovation has the highest ROI?" or "Should I sell now?"',
    };
}
