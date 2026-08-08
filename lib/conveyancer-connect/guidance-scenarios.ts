import type { BrowseFilters, MatchAnswers, Specialty } from '@/lib/conveyancer-connect/types';

export type GuidanceScenarioId =
    | 'buying'
    | 'selling'
    | 'ownership-transfer'
    | 'bond-registration'
    | 'bond-cancellation'
    | 'estate-transfer'
    | 'family-transfer';

export interface GuidanceScenario {
    id: GuidanceScenarioId;
    label: string;
    hint: string;
    conveyancerRole: string;
    guidance: string;
    services: Specialty[];
    filterPatch: Partial<BrowseFilters>;
    matchAnswers: Partial<MatchAnswers>;
}

export const GUIDANCE_SCENARIOS: GuidanceScenario[] = [
    {
        id: 'buying',
        label: 'Buying a property',
        hint: 'Transfer into your name + bond registration',
        conveyancerRole: 'Transfer attorney (buyer side)',
        guidance:
            'You need a conveyancer to register the property in your name and, if you are taking a bond, to register that with the bank. Look for firms strong in residential transfers and bond registration.',
        services: ['residential', 'bond-registration'],
        filterPatch: { specialities: ['residential', 'bond-registration'], acceptingNewClients: true },
        matchAnswers: {
            intent: 'buying',
            propertyType: 'residential',
            specialRequirements: ['bond-registration', 'residential'],
        },
    },
    {
        id: 'selling',
        label: 'Selling a property',
        hint: 'Transfer out of your name',
        conveyancerRole: 'Transfer attorney (seller side)',
        guidance:
            'The seller typically appoints the transferring attorney. They prepare the sale agreement support, handle FICA, and lodge at the deeds office. Prioritise firms with a clear fee schedule and solid transfer turnaround.',
        services: ['residential'],
        filterPatch: { specialities: ['residential'], acceptingNewClients: true },
        matchAnswers: {
            intent: 'selling',
            propertyType: 'residential',
            specialRequirements: ['residential'],
        },
    },
    {
        id: 'ownership-transfer',
        label: 'Transferring ownership',
        hint: 'Change of owner without a typical sale',
        conveyancerRole: 'Transfer attorney',
        guidance:
            'Ownership changes — investment transfers, company to individual, or similar — still go through a conveyancer. Match on transfer experience and the property type involved.',
        services: ['residential', 'investment-property'],
        filterPatch: {
            specialities: ['residential', 'investment-property'],
            acceptingNewClients: true,
        },
        matchAnswers: {
            intent: 'investing',
            propertyType: 'investment',
            specialRequirements: ['investment-property'],
        },
    },
    {
        id: 'bond-registration',
        label: 'Registering a bond',
        hint: 'New home loan over the property',
        conveyancerRole: 'Bond registration attorney',
        guidance:
            'When you finance a purchase, the bank instructs a bond attorney to register the mortgage bond. Choose conveyancers who regularly handle bond registration alongside transfers.',
        services: ['bond-registration', 'residential'],
        filterPatch: { specialities: ['bond-registration', 'residential'], acceptingNewClients: true },
        matchAnswers: {
            intent: 'buying',
            propertyType: 'residential',
            specialRequirements: ['bond-registration'],
        },
    },
    {
        id: 'bond-cancellation',
        label: 'Cancelling a bond',
        hint: 'Clearing an existing home loan',
        conveyancerRole: 'Bond cancellation attorney',
        guidance:
            'When you sell or settle your bond, a conveyancer cancels the existing mortgage at the deeds office. Firms with bond cancellation experience reduce delays on registration day.',
        services: ['bond-cancellation', 'residential'],
        filterPatch: { specialities: ['bond-cancellation', 'residential'], acceptingNewClients: true },
        matchAnswers: {
            intent: 'selling',
            propertyType: 'residential',
            specialRequirements: ['bond-cancellation'],
        },
    },
    {
        id: 'estate-transfer',
        label: 'Estate transfer',
        hint: 'Deceased estate or executor-led transfer',
        conveyancerRole: 'Estate / deceased-estate conveyancer',
        guidance:
            'Transfers from a deceased estate need a conveyancer familiar with executor mandates, SARS clearance, and deceased-estate lodgement. Experience here matters more than generic residential volume.',
        services: ['estate-transfers', 'deceased-estates'],
        filterPatch: { specialities: ['estate-transfers', 'deceased-estates'], acceptingNewClients: true },
        matchAnswers: {
            intent: 'investing',
            propertyType: 'residential',
            specialRequirements: ['estate-transfers', 'deceased-estates'],
        },
    },
    {
        id: 'family-transfer',
        label: 'Family transfer',
        hint: 'Spouse, family or related-party transfer',
        conveyancerRole: 'Family transfer specialist',
        guidance:
            'Transfers between family members or related parties follow specific rules and often different transfer duty treatment. Choose a firm that handles family transfers and can explain costs upfront.',
        services: ['family-transfers', 'residential'],
        filterPatch: { specialities: ['family-transfers', 'residential'], acceptingNewClients: true },
        matchAnswers: {
            intent: 'investing',
            propertyType: 'residential',
            specialRequirements: ['family-transfers'],
        },
    },
];

export function getGuidanceScenario(id: GuidanceScenarioId): GuidanceScenario | undefined {
    return GUIDANCE_SCENARIOS.find((s) => s.id === id);
}

export function buildMatchAnswersFromScenario(
    scenario: GuidanceScenario,
    base: MatchAnswers
): MatchAnswers {
    return {
        ...base,
        ...scenario.matchAnswers,
        specialRequirements:
            scenario.matchAnswers.specialRequirements ?? scenario.services,
    };
}

export function buildFiltersFromScenario(
    scenario: GuidanceScenario,
    current: BrowseFilters
): BrowseFilters {
    return {
        ...current,
        ...scenario.filterPatch,
        specialities: scenario.filterPatch.specialities ?? scenario.services,
    };
}
