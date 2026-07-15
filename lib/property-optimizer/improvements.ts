import type { DifficultyLevel, ImprovementRecommendation, PriorityLevel } from './types';

interface ImprovementTemplate {
    id: string;
    name: string;
    category: string;
    baseCost: number;
    baseValueUplift: number;
    timeWeeks: number;
    difficulty: DifficultyLevel;
    popularity: number;
    buyerDemandBoost: number;
    sustainability: number;
    marketImpact: number;
    priority: PriorityLevel;
    security?: boolean;
    energy?: boolean;
    luxury?: boolean;
    rentalBoost?: number;
    explanation: string;
    factors: string[];
}

const TEMPLATES: ImprovementTemplate[] = [
    { id: 'kitchen', name: 'Kitchen Renovation', category: 'Interior', baseCost: 280_000, baseValueUplift: 420_000, timeWeeks: 6, difficulty: 'Complex', popularity: 92, buyerDemandBoost: 88, sustainability: 55, marketImpact: 90, priority: 'High', luxury: true, explanation: 'Modern open-plan kitchens drive premium offers in Bryanston family homes.', factors: ['Buyer preferences', 'Comparable sales uplift', 'Luxury demand'] },
    { id: 'bathroom', name: 'Bathroom Renovation', category: 'Interior', baseCost: 165_000, baseValueUplift: 245_000, timeWeeks: 4, difficulty: 'Moderate', popularity: 88, buyerDemandBoost: 82, sustainability: 50, marketImpact: 78, priority: 'High', explanation: 'Updated en-suites correlate with faster sales in this price band.', factors: ['Condition factor', 'Buyer preferences', 'Local market trends'] },
    { id: 'solar', name: 'Solar System', category: 'Energy', baseCost: 145_000, baseValueUplift: 195_000, timeWeeks: 2, difficulty: 'Moderate', popularity: 94, buyerDemandBoost: 86, sustainability: 95, marketImpact: 72, priority: 'High', energy: true, explanation: 'Load-shedding resilience is a top buyer filter in Gauteng.', factors: ['Energy efficiency', 'Buyer demand', 'Inflation & utility costs'] },
    { id: 'battery', name: 'Battery Backup', category: 'Energy', baseCost: 120_000, baseValueUplift: 155_000, timeWeeks: 1, difficulty: 'Easy', popularity: 91, buyerDemandBoost: 84, sustainability: 88, marketImpact: 68, priority: 'Medium', energy: true, explanation: 'Pairs with solar for uninterrupted power — high perceived value.', factors: ['Smart home readiness', 'Energy efficiency', 'Luxury demand'] },
    { id: 'boundary-wall', name: 'Boundary Wall', category: 'Security', baseCost: 95_000, baseValueUplift: 110_000, timeWeeks: 3, difficulty: 'Moderate', popularity: 76, buyerDemandBoost: 70, sustainability: 40, marketImpact: 55, priority: 'Medium', security: true, explanation: 'Street-facing aesthetics and security compliance in estate-adjacent suburbs.', factors: ['Security features', 'Crime levels', 'Municipal bylaws'] },
    { id: 'electric-fence', name: 'Electric Fence', category: 'Security', baseCost: 45_000, baseValueUplift: 58_000, timeWeeks: 1, difficulty: 'Easy', popularity: 82, buyerDemandBoost: 78, sustainability: 35, marketImpact: 52, priority: 'Medium', security: true, explanation: 'Expected baseline security feature for properties above R3m in northern JHB.', factors: ['Crime statistics', 'Buyer preferences', 'Insurance requirements'] },
    { id: 'cctv', name: 'CCTV', category: 'Security', baseCost: 35_000, baseValueUplift: 48_000, timeWeeks: 1, difficulty: 'Easy', popularity: 85, buyerDemandBoost: 80, sustainability: 30, marketImpact: 48, priority: 'Low', security: true, explanation: 'Remote monitoring appeals to executive buyers and investors.', factors: ['Security premium', 'Smart home', 'Investor demand'] },
    { id: 'smart-home', name: 'Smart Home System', category: 'Technology', baseCost: 75_000, baseValueUplift: 98_000, timeWeeks: 2, difficulty: 'Moderate', popularity: 79, buyerDemandBoost: 76, sustainability: 60, marketImpact: 65, priority: 'Medium', explanation: 'Integrated lighting, climate and security automation lifts luxury appeal.', factors: ['Smart home features', 'Luxury demand', 'Buyer preferences'] },
    { id: 'fibre', name: 'Fibre Installation', category: 'Technology', baseCost: 8_500, baseValueUplift: 22_000, timeWeeks: 1, difficulty: 'Easy', popularity: 90, buyerDemandBoost: 85, sustainability: 45, marketImpact: 42, priority: 'Critical', explanation: 'Work-from-home buyers prioritise guaranteed high-speed connectivity.', factors: ['Transport/accessibility proxy', 'Buyer demand', 'Low cost/high ROI'] },
    { id: 'borehole', name: 'Borehole', category: 'Water', baseCost: 85_000, baseValueUplift: 105_000, timeWeeks: 3, difficulty: 'Complex', popularity: 77, buyerDemandBoost: 72, sustainability: 82, marketImpact: 58, priority: 'Medium', explanation: 'Water security premium in Johannesburg northern suburbs.', factors: ['Municipal services', 'Sustainability', 'Land value'] },
    { id: 'water-backup', name: 'Water Backup', category: 'Water', baseCost: 42_000, baseValueUplift: 55_000, timeWeeks: 1, difficulty: 'Easy', popularity: 80, buyerDemandBoost: 74, sustainability: 75, marketImpact: 50, priority: 'Medium', explanation: 'Jojo tank systems reduce buyer friction during water restrictions.', factors: ['Infrastructure', 'Buyer demand', 'Condition'] },
    { id: 'irrigation', name: 'Irrigation', category: 'Garden', baseCost: 38_000, baseValueUplift: 46_000, timeWeeks: 2, difficulty: 'Moderate', popularity: 68, buyerDemandBoost: 62, sustainability: 70, marketImpact: 44, priority: 'Low', explanation: 'Maintained gardens support curb appeal in family-oriented streets.', factors: ['Land value', 'Lifestyle score', 'Condition'] },
    { id: 'pool', name: 'Swimming Pool', category: 'Lifestyle', baseCost: 320_000, baseValueUplift: 280_000, timeWeeks: 10, difficulty: 'Major Project', popularity: 71, buyerDemandBoost: 68, sustainability: 35, marketImpact: 62, priority: 'Optional', luxury: true, explanation: 'Pool adds lifestyle premium but ROI varies — strong in Bryanston above R4m.', factors: ['Luxury demand', 'Land size', 'Comparable sales'] },
    { id: 'entertainment', name: 'Entertainment Area', category: 'Lifestyle', baseCost: 185_000, baseValueUplift: 240_000, timeWeeks: 5, difficulty: 'Complex', popularity: 83, buyerDemandBoost: 80, sustainability: 45, marketImpact: 74, priority: 'High', luxury: true, explanation: 'Indoor-outdoor flow is a consistent premium driver in Sandton corridor.', factors: ['Buyer preferences', 'Luxury appeal', 'Local trends'] },
    { id: 'garage-ext', name: 'Garage Extension', category: 'Structure', baseCost: 125_000, baseValueUplift: 158_000, timeWeeks: 4, difficulty: 'Complex', popularity: 74, buyerDemandBoost: 70, sustainability: 40, marketImpact: 58, priority: 'Medium', explanation: 'Additional covered parking supports family and investor appeal.', factors: ['Replacement cost', 'Buyer demand', 'Property age'] },
    { id: 'flatlet', name: 'Flatlet', category: 'Income', baseCost: 450_000, baseValueUplift: 620_000, timeWeeks: 14, difficulty: 'Major Project', popularity: 86, buyerDemandBoost: 78, sustainability: 55, marketImpact: 88, priority: 'High', rentalBoost: 8500, explanation: 'Secondary income stream highly valued by investors — check municipal zoning.', factors: ['Rental demand', 'Investor demand', 'Population growth'] },
    { id: 'cottage', name: 'Rental Cottage', category: 'Income', baseCost: 520_000, baseValueUplift: 680_000, timeWeeks: 16, difficulty: 'Major Project', popularity: 84, buyerDemandBoost: 76, sustainability: 50, marketImpact: 85, priority: 'High', rentalBoost: 9800, explanation: 'Detached cottage with separate entrance maximises rental yield potential.', factors: ['Rental demand', 'Land value', 'Supply/demand'] },
    { id: 'home-office', name: 'Home Office', category: 'Interior', baseCost: 95_000, baseValueUplift: 135_000, timeWeeks: 3, difficulty: 'Moderate', popularity: 89, buyerDemandBoost: 87, sustainability: 52, marketImpact: 70, priority: 'High', explanation: 'Dedicated workspace remains a post-pandemic buyer priority.', factors: ['Buyer preferences', 'Walkability/work-from-home', 'Floor size utilisation'] },
    { id: 'cupboards', name: 'Built-in Cupboards', category: 'Interior', baseCost: 68_000, baseValueUplift: 88_000, timeWeeks: 2, difficulty: 'Easy', popularity: 81, buyerDemandBoost: 79, sustainability: 42, marketImpact: 55, priority: 'Medium', explanation: 'Storage upgrades improve perceived floor space efficiency.', factors: ['Condition', 'Replacement cost', 'Buyer preferences'] },
    { id: 'aircon', name: 'Air Conditioning', category: 'Comfort', baseCost: 72_000, baseValueUplift: 92_000, timeWeeks: 2, difficulty: 'Moderate', popularity: 87, buyerDemandBoost: 83, sustainability: 48, marketImpact: 60, priority: 'Medium', energy: true, explanation: 'Ducted or inverter systems expected in premium northern suburbs.', factors: ['Energy efficiency', 'Condition', 'Luxury demand'] },
    { id: 'flooring', name: 'New Flooring', category: 'Interior', baseCost: 115_000, baseValueUplift: 148_000, timeWeeks: 3, difficulty: 'Moderate', popularity: 84, buyerDemandBoost: 81, sustainability: 50, marketImpact: 66, priority: 'Medium', explanation: 'Consistent flooring across living areas improves valuation comparables.', factors: ['Condition factor', 'Renovation quality', 'Buyer preferences'] },
    { id: 'roof', name: 'Roof Restoration', category: 'Structure', baseCost: 88_000, baseValueUplift: 102_000, timeWeeks: 3, difficulty: 'Complex', popularity: 72, buyerDemandBoost: 68, sustainability: 58, marketImpact: 52, priority: 'Critical', explanation: '17-year roof approaching maintenance cycle — prevents valuation discounts.', factors: ['Property age', 'Condition', 'Replacement cost'] },
    { id: 'exterior-paint', name: 'Exterior Painting', category: 'Exterior', baseCost: 55_000, baseValueUplift: 72_000, timeWeeks: 2, difficulty: 'Easy', popularity: 78, buyerDemandBoost: 75, sustainability: 45, marketImpact: 58, priority: 'Medium', explanation: 'Fresh exterior dramatically improves first-impression and days-on-market.', factors: ['Condition', 'Market premium', 'Curb appeal'] },
    { id: 'landscaping', name: 'Landscaping', category: 'Garden', baseCost: 65_000, baseValueUplift: 85_000, timeWeeks: 3, difficulty: 'Moderate', popularity: 80, buyerDemandBoost: 77, sustainability: 72, marketImpact: 62, priority: 'Medium', explanation: 'Professional landscaping supports lifestyle score and photography quality.', factors: ['Land value', 'Lifestyle', 'Luxury appeal'] },
    { id: 'garden', name: 'Garden Upgrade', category: 'Garden', baseCost: 48_000, baseValueUplift: 58_000, timeWeeks: 2, difficulty: 'Easy', popularity: 75, buyerDemandBoost: 70, sustainability: 68, marketImpact: 50, priority: 'Low', explanation: 'Low-maintenance indigenous gardens align with water-conscious buyers.', factors: ['Sustainability', 'Municipal water restrictions', 'Lifestyle'] },
    { id: 'paving', name: 'Paving', category: 'Exterior', baseCost: 78_000, baseValueUplift: 95_000, timeWeeks: 2, difficulty: 'Moderate', popularity: 73, buyerDemandBoost: 69, sustainability: 38, marketImpact: 52, priority: 'Low', explanation: 'Additional parking and clean driveway lines support family buyers.', factors: ['Land value', 'Buyer demand', 'Condition'] },
    { id: 'outdoor-light', name: 'Outdoor Lighting', category: 'Exterior', baseCost: 28_000, baseValueUplift: 38_000, timeWeeks: 1, difficulty: 'Easy', popularity: 70, buyerDemandBoost: 68, sustainability: 55, marketImpact: 42, priority: 'Low', security: true, explanation: 'Security-linked aesthetic lighting improves evening curb appeal.', factors: ['Security', 'Luxury appeal', 'Low cost uplift'] },
    { id: 'ev-charger', name: 'EV Charger', category: 'Energy', baseCost: 32_000, baseValueUplift: 48_000, timeWeeks: 1, difficulty: 'Easy', popularity: 68, buyerDemandBoost: 72, sustainability: 90, marketImpact: 55, priority: 'Optional', energy: true, explanation: 'Forward-looking feature gaining traction with executive buyer segment.', factors: ['Sustainability', 'Infrastructure trends', 'Luxury demand'] },
    { id: 'accessibility', name: 'Accessibility Improvements', category: 'Universal', baseCost: 92_000, baseValueUplift: 88_000, timeWeeks: 4, difficulty: 'Complex', popularity: 58, buyerDemandBoost: 55, sustainability: 60, marketImpact: 45, priority: 'Optional', explanation: 'Growing demand from multi-generational households — niche but meaningful.', factors: ['Demographics', 'Future growth', 'Municipal accessibility guidelines'] },
    { id: 'energy-efficiency', name: 'Energy Efficiency Improvements', category: 'Energy', baseCost: 105_000, baseValueUplift: 142_000, timeWeeks: 3, difficulty: 'Moderate', popularity: 83, buyerDemandBoost: 80, sustainability: 92, marketImpact: 68, priority: 'High', energy: true, explanation: 'Insulation, glazing and geyser blankets compound with solar for maximum rating.', factors: ['Energy efficiency', 'Inflation', 'Green building trends'] },
];

export { TEMPLATES as IMPROVEMENT_TEMPLATES };

export function templateToRecommendation(
    t: ImprovementTemplate,
    multipliers: {
        location: number;
        demand: number;
        condition: number;
        labour: number;
        quality: number;
    }
): ImprovementRecommendation {
    const cost = Math.round(t.baseCost * multipliers.labour * (1 + multipliers.condition * 0.05));
    const valueIncrease = Math.round(
        t.baseValueUplift *
            multipliers.location *
            multipliers.demand *
            multipliers.quality *
            (t.luxury ? 1 + multipliers.demand * 0.08 : 1)
    );
    const profit = valueIncrease - cost;
    const roi = cost > 0 ? (profit / cost) * 100 : 0;
    const confidence = Math.min(
        96,
        Math.round(62 + t.popularity * 0.2 + multipliers.demand * 12 + (roi > 30 ? 8 : 0))
    );

    return {
        id: t.id,
        name: t.name,
        category: t.category,
        estimatedCost: cost,
        estimatedValueIncrease: valueIncrease,
        estimatedRoi: Math.round(roi * 10) / 10,
        expectedProfit: profit,
        timeWeeks: t.timeWeeks,
        difficulty: t.difficulty,
        popularity: t.popularity,
        buyerDemandScore: Math.min(99, Math.round(t.buyerDemandBoost * multipliers.demand)),
        sustainabilityRating: t.sustainability,
        marketImpact: Math.min(99, Math.round(t.marketImpact * multipliers.location)),
        priority: t.priority,
        confidence,
        explanation: t.explanation,
        factors: t.factors,
    };
}
