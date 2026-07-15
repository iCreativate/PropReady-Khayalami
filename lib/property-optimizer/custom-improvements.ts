import type { DifficultyLevel, ImprovementRecommendation, MarketContext, PriorityLevel, PropertyProfile } from './types';
import { IMPROVEMENT_TEMPLATES, templateToRecommendation } from './improvements';

export interface CustomImprovementInput {
    description: string;
    estimatedCost?: number;
    category?: string;
}

const KEYWORD_TEMPLATE_MAP: { pattern: RegExp; templateId: string }[] = [
    { pattern: /kitchen|cupboard|cabinets?/i, templateId: 'kitchen' },
    { pattern: /bathroom|shower|toilet|en-?suite/i, templateId: 'bathroom' },
    { pattern: /solar|pv panel|inverter/i, templateId: 'solar' },
    { pattern: /battery|backup power|load.?shed/i, templateId: 'battery' },
    { pattern: /fence|wall|boundary/i, templateId: 'boundary-wall' },
    { pattern: /cctv|camera|surveillance/i, templateId: 'cctv' },
    { pattern: /smart home|automation/i, templateId: 'smart-home' },
    { pattern: /fibre|fiber|internet/i, templateId: 'fibre' },
    { pattern: /borehole|well/i, templateId: 'borehole' },
    { pattern: /pool|swimming/i, templateId: 'pool' },
    { pattern: /flatlet|granny| cottage|secondary dwelling/i, templateId: 'flatlet' },
    { pattern: /office|work from home|wfh/i, templateId: 'home-office' },
    { pattern: /paint|exterior|facade/i, templateId: 'exterior-paint' },
    { pattern: /roof|thatch|tile/i, templateId: 'roof' },
    { pattern: /garden|landscap|lawn/i, templateId: 'landscaping' },
    { pattern: /floor|tile|laminate|wood/i, templateId: 'flooring' },
    { pattern: /aircon|air con|hvac|cooling/i, templateId: 'aircon' },
    { pattern: /garage|parking/i, templateId: 'garage-ext' },
    { pattern: /entertain|patio|braai|outdoor/i, templateId: 'entertainment' },
    { pattern: /ev charger|electric vehicle/i, templateId: 'ev-charger' },
    { pattern: /insulation|energy eff/i, templateId: 'energy-efficiency' },
];

function locationMultiplier(property: PropertyProfile, market: MarketContext) {
    const schoolBoost = 1 + (market.schoolScore / 100) * 0.08;
    return 1.04 * schoolBoost;
}

function demandMultiplier(market: MarketContext) {
    return 0.85 + (market.buyerDemand / 100) * 0.3;
}

function labourMultiplier(market: MarketContext) {
    return 1 + market.inflationRate / 100 + 0.03;
}

function inferCategory(description: string): string {
    const lower = description.toLowerCase();
    if (/security|fence|cctv|alarm/i.test(lower)) return 'Security';
    if (/solar|energy|battery|insulation|aircon/i.test(lower)) return 'Energy';
    if (/kitchen|bathroom|floor|paint|cupboard|office/i.test(lower)) return 'Interior';
    if (/garden|pool|patio|landscap|paving/i.test(lower)) return 'Exterior';
    if (/flatlet|cottage|rental|income/i.test(lower)) return 'Income';
    return 'Custom';
}

function inferDifficulty(description: string, cost: number): DifficultyLevel {
    if (cost >= 400_000 || /extension|build|structural|flatlet|cottage/i.test(description)) {
        return 'Major Project';
    }
    if (cost >= 150_000 || /renovat|kitchen|bathroom|roof/i.test(description)) return 'Complex';
    if (cost >= 50_000) return 'Moderate';
    return 'Easy';
}

function inferPriority(roi: number, demand: number): PriorityLevel {
    if (roi >= 45 && demand >= 80) return 'High';
    if (roi >= 30) return 'Medium';
    if (roi >= 15) return 'Low';
    return 'Optional';
}

function titleFromDescription(description: string): string {
    const trimmed = description.trim();
    if (trimmed.length <= 48) return trimmed;
    const firstSentence = trimmed.split(/[.!?\n]/)[0]?.trim() ?? trimmed;
    return firstSentence.length <= 56 ? firstSentence : `${firstSentence.slice(0, 53)}…`;
}

export function buildCustomImprovement(
    input: CustomImprovementInput,
    property: PropertyProfile,
    market: MarketContext
): ImprovementRecommendation {
    const description = input.description.trim();
    const multipliers = {
        location: locationMultiplier(property, market),
        demand: demandMultiplier(market),
        condition: 1 + (100 - property.conditionScore) / 200,
        labour: labourMultiplier(market),
        quality: 0.92 + market.buyerDemand / 500,
    };

    let baseRec: ImprovementRecommendation | null = null;
    for (const { pattern, templateId } of KEYWORD_TEMPLATE_MAP) {
        if (pattern.test(description)) {
            const tpl = IMPROVEMENT_TEMPLATES.find((t) => t.id === templateId);
            if (tpl) {
                baseRec = templateToRecommendation(tpl, multipliers);
                break;
            }
        }
    }

    const userCost = input.estimatedCost && input.estimatedCost > 0 ? input.estimatedCost : undefined;
    const estimatedCost = userCost ?? baseRec?.estimatedCost ?? Math.round(75_000 * multipliers.labour);

    let valueIncrease: number;
    if (baseRec && userCost) {
        const ratio = baseRec.estimatedValueIncrease / baseRec.estimatedCost;
        valueIncrease = Math.round(userCost * ratio * multipliers.demand);
    } else if (baseRec) {
        valueIncrease = baseRec.estimatedValueIncrease;
    } else {
        const category = input.category ?? inferCategory(description);
        const roiFactor =
            category === 'Energy' ? 0.42 :
            category === 'Security' ? 0.28 :
            category === 'Income' ? 0.55 :
            category === 'Interior' ? 0.38 :
            0.32;
        valueIncrease = Math.round(estimatedCost * roiFactor * multipliers.location * multipliers.demand);
    }

    const profit = valueIncrease - estimatedCost;
    const roi = estimatedCost > 0 ? (profit / estimatedCost) * 100 : 0;
    const buyerDemand = baseRec?.buyerDemandScore ?? Math.min(90, Math.round(market.buyerDemand * 0.95));
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return {
        id,
        name: titleFromDescription(description),
        category: input.category ?? baseRec?.category ?? inferCategory(description),
        estimatedCost,
        estimatedValueIncrease: valueIncrease,
        estimatedRoi: Math.round(roi * 10) / 10,
        expectedProfit: profit,
        timeWeeks: baseRec?.timeWeeks ?? (estimatedCost > 200_000 ? 8 : estimatedCost > 80_000 ? 4 : 2),
        difficulty: baseRec?.difficulty ?? inferDifficulty(description, estimatedCost),
        popularity: baseRec?.popularity ?? 70,
        buyerDemandScore: buyerDemand,
        sustainabilityRating: baseRec?.sustainabilityRating ?? (/solar|energy|water|borehole/i.test(description) ? 80 : 45),
        marketImpact: Math.min(95, Math.round((valueIncrease / estimatedCost) * 25 + market.buyerDemand * 0.3)),
        priority: inferPriority(roi, buyerDemand),
        confidence: Math.min(88, Math.round(58 + (baseRec ? 20 : 10) + market.buyerDemand * 0.15)),
        explanation: `Your planned improvement: "${description}". Modelled using ${baseRec ? 'matched local renovation benchmarks' : 'hybrid valuation factors'} for ${property.suburb}.`,
        factors: baseRec?.factors ?? [
            'Your description',
            'Local buyer demand',
            'Suburb price per m²',
            'Renovation cost inflation',
        ],
    };
}

export function isCustomImprovementId(id: string) {
    return id.startsWith('custom-');
}
