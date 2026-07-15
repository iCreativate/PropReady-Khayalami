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
                    `Current estimated value: R${s.estimatedMarketValue.toLocaleString('en-ZA')}`,
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
                `Your equity: R${s.equity.toLocaleString('en-ZA')}`,
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
                `Est. rental: R${s.estimatedRentalValue.toLocaleString('en-ZA')}/month`,
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
                evidence: top3.map((i) => `${i.name}: cost R${i.estimatedCost.toLocaleString('en-ZA')}, uplift R${i.estimatedValueIncrease.toLocaleString('en-ZA')}`),
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
                recommendation: cottage ? `Budget ~R${cottage.estimatedCost.toLocaleString('en-ZA')} — expected uplift R${cottage.estimatedValueIncrease.toLocaleString('en-ZA')}.` : 'Consult town planner before proceeding.',
            };
        },
    },
    {
        pattern: /solar/i,
        handler: (s, imps) => {
            const solar = imps.find((i) => i.id === 'solar');
            return {
                answer: `Solar is strongly recommended in Gauteng — load-shedding resilience drives buyer premiums. Modelled ROI: ${solar?.estimatedRoi}%.`,
                evidence: [
                    '94% popularity score among buyers',
                    'Pairs with existing solar geyser',
                    `Energy score currently ${s.categoryScores.find((c) => c.id === 'energy')?.score}/100`,
                ],
                confidence: solar?.confidence ?? 88,
                recommendation: 'Install hybrid inverter + battery for maximum valuation impact.',
            };
        },
    },
    {
        pattern: /wait.*year|another year/i,
        handler: (s) => ({
            answer: `Waiting 12 months could add ~R${s.monthlyAppreciation * 12} in appreciation (${s.avgAnnualAppreciation}% p.a. expected scenario). However, interest rates at ${s.market.primeInterestRate}% and renovation cost inflation at ${s.market.inflationRate}% offset some gains.`,
            evidence: [
                `1yr forecast: R${s.futureValues[1].toLocaleString('en-ZA')}`,
                `${s.market.plannedDevelopments.length} planned developments nearby`,
                'Projections are estimates, not guarantees',
            ],
            confidence: 71,
            recommendation: 'If selling, renovate now and list into spring peak. If investing, holding is reasonable.',
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
        answer: `Based on your ${snapshot.property.suburb} property valued at R${snapshot.estimatedMarketValue.toLocaleString('en-ZA')} with a ${snapshot.overallAiScore}/100 AI score, I recommend reviewing the Improvement Engine for data-backed options. Ask about renovations, selling, renting, solar, or ROI comparisons.`,
        evidence: [
            `Confidence: ${snapshot.confidenceScore}%`,
            `Investment grade: ${snapshot.investmentGrade}`,
            `Market: ${snapshot.marketStatus}`,
        ],
        confidence: 65,
        recommendation: 'Try: "Which renovation has the highest ROI?" or "Should I sell now?"',
    };
}
