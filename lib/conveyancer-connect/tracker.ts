import type { TransferStageId, TransferTrackerState } from '@/lib/conveyancer-connect/types';

export const TRANSFER_STAGE_META: Array<{
    id: TransferStageId;
    label: string;
    responsible: string;
    documents: string[];
}> = [
    {
        id: 'offer-accepted',
        label: 'Offer Accepted',
        responsible: 'Buyer / Seller',
        documents: ['Signed offer to purchase'],
    },
    {
        id: 'instruction-received',
        label: 'Instruction Received',
        responsible: 'Conveyancer',
        documents: ['Letter of instruction', 'FICA pack request'],
    },
    {
        id: 'fica-submitted',
        label: 'FICA Submitted',
        responsible: 'Client',
        documents: ['ID', 'Proof of address', 'Source of funds'],
    },
    {
        id: 'documents-prepared',
        label: 'Documents Prepared',
        responsible: 'Conveyancer',
        documents: ['Transfer documents', 'Power of attorney'],
    },
    {
        id: 'bond-approved',
        label: 'Bond Approved',
        responsible: 'Bank / Originator',
        documents: ['Bond grant', 'Quotation'],
    },
    {
        id: 'guarantees-issued',
        label: 'Guarantees Issued',
        responsible: 'Bond attorney / Bank',
        documents: ['Guarantees'],
    },
    {
        id: 'lodgement',
        label: 'Lodgement',
        responsible: 'Conveyancer',
        documents: ['Lodgement cover', 'Deeds pack'],
    },
    {
        id: 'registration',
        label: 'Registration',
        responsible: 'Deeds Office',
        documents: ['Registration confirmation'],
    },
    {
        id: 'funds-released',
        label: 'Funds Released',
        responsible: 'Conveyancer / Bank',
        documents: ['Payment advice'],
    },
    {
        id: 'transfer-complete',
        label: 'Transfer Complete',
        responsible: 'All parties',
        documents: ['Title deed copy', 'Final statement'],
    },
];

export function createDemoTracker(firmId: string, propertyLabel: string): TransferTrackerState {
    const now = Date.now();
    const day = 86_400_000;
    return {
        firmId,
        propertyLabel,
        currentStageIndex: 4,
        stages: TRANSFER_STAGE_META.map((s, i) => ({
            id: s.id,
            completed: i < 4,
            completedAt: i < 4 ? new Date(now - (4 - i) * 5 * day).toISOString() : undefined,
            expectedAt: new Date(now + (i - 3) * 7 * day).toISOString(),
            responsible: s.responsible,
            documents: s.documents,
        })),
        notifications: [
            {
                id: 'n1',
                text: 'Bond approval received — guarantees requested.',
                at: new Date(now - day).toISOString(),
            },
            {
                id: 'n2',
                text: 'FICA pack verified for all parties.',
                at: new Date(now - 8 * day).toISOString(),
            },
        ],
    };
}

export function trackerProgressPct(state: TransferTrackerState): number {
    const done = state.stages.filter((s) => s.completed).length;
    return Math.round((done / state.stages.length) * 100);
}
