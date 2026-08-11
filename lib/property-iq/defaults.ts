import type {
    CompanionState,
    IqProperty,
    IqRenovation,
    RenovationStatus,
} from './types';
import { emptyBuildCostBreakdown } from './types';

/** Empty companion workspace — user-owned data only. */
export function createEmptyCompanionState(): CompanionState {
    return {
        version: 1,
        properties: [],
        goals: [],
        alerts: [],
        activePropertyId: null,
        updatedAt: new Date().toISOString(),
    };
}

/** Blank renovation / improvement entry for Property Companion™. */
export function createEmptyRenovation(partial?: Partial<IqRenovation>): IqRenovation {
    const today = new Date().toISOString().slice(0, 10);
    const status: RenovationStatus = partial?.status ?? 'completed';
    const category = partial?.category ?? 'Other';
    const base: IqRenovation = {
        id: `reno-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        room: '',
        category,
        contractor: '',
        cost: 0,
        date: today,
        status,
        progress: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0,
        estimatedValueAdd: 0,
        actualValueAdd: 0,
        warranty: '',
        photos: [],
        beforeImage: '',
        afterImage: '',
        notes: '',
    };
    const merged = { ...base, ...partial };
    const finalStatus = merged.status ?? status;
    return {
        ...merged,
        id: partial?.id ?? base.id,
        category: merged.category || category,
        status: finalStatus,
        progress:
            partial?.progress ??
            (finalStatus === 'completed' ? 100 : finalStatus === 'in_progress' ? 50 : 0),
    };
}

/** Blank property shell for Add Property — no invented financials. */
export function createEmptyProperty(partial?: Partial<IqProperty>): IqProperty {
    const id = `prop-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    return {
        name: 'New Property',
        address: '',
        suburb: '',
        city: '',
        image: '',
        images: [],
        use: 'investment',
        propertyType: 'house',
        purchaseFunding: 'bond',
        propertyCondition: 'average',
        currentValueMode: 'auto',
        bedrooms: 0,
        bathrooms: 0,
        ensuites: 0,
        lounges: 0,
        diningRooms: 0,
        studies: 0,
        domesticRooms: 0,
        storeRooms: 0,
        garages: 0,
        openParking: 0,
        floorSizeSqm: 0,
        landSizeSqm: 0,
        amenities: [],
        notes: '',
        purchasePrice: 0,
        purchaseDate: today,
        transferDate: null,
        buildCost: 0,
        buildCostBreakdown: emptyBuildCostBreakdown(),
        buildFunding: 'self',
        buildCompletionDate: null,
        depositPaid: 0,
        currentValue: 0,
        previousMonthValue: 0,
        bank: '',
        bondNumber: '',
        interestRate: 0,
        bondTermMonths: 240,
        originalBondAmount: 0,
        outstandingBond: 0,
        previousMonthBond: 0,
        monthlyBond: 0,
        remainingTermMonths: 240,
        extraMonthlyPayment: 0,
        oneOffPayments: [],
        homeInsurance: 0,
        municipalRates: 0,
        levies: 0,
        maintenanceBudget: 0,
        propertyTaxes: 0,
        utilities: 0,
        propertyManager: '',
        rentalIncome: 0,
        previousMonthRental: 0,
        monthlyExpenses: 0,
        occupancyRate: 100,
        vacancyDaysYtd: 0,
        latePaymentsYtd: 0,
        expectedAnnualIncreasePct: 0,
        leaseExpiry: null,
        leaseStart: null,
        rentalEscalationPct: 0,
        depositHeld: 0,
        tenantStatus: 'vacant',
        tenants: [],
        leaseAgreementName: null,
        healthScore: 0,
        aiScore: 0,
        expenses: [],
        renovations: [],
        timeline: [
            {
                id: `tl-${Date.now()}`,
                date: today,
                kind: 'purchase',
                title: 'Property added',
                detail: 'Added to Property Companion™',
            },
        ],
        documents: [],
        history: [],
        ...partial,
        id: partial?.id ?? id,
    };
}
