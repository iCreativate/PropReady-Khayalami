import { TRANSFER_STAGE_META } from '@/lib/conveyancer-connect/tracker';
import type { TransferTrackerState } from '@/lib/conveyancer-connect/types';

const STATUS_TO_STAGE: Record<string, number> = {
    inquiry: 0,
    quote_requested: 1,
    quote_sent: 1,
    instructed: 2,
    in_progress: 4,
    lodged: 6,
    registered: 7,
    completed: 9,
    closed: 9,
};

/** Build tracker UI state from a live conveyancer matter row. */
export function trackerFromMatter(matter: {
    conveyancer_id: string;
    property_label?: string | null;
    status?: string | null;
    updated_at?: string | null;
}): TransferTrackerState {
    const idx = STATUS_TO_STAGE[String(matter.status || 'inquiry')] ?? 0;
    const updated = matter.updated_at || new Date().toISOString();
    return {
        firmId: String(matter.conveyancer_id),
        propertyLabel: String(matter.property_label || 'Property transfer'),
        currentStageIndex: idx,
        stages: TRANSFER_STAGE_META.map((s, i) => ({
            id: s.id,
            completed: i < idx,
            completedAt: i < idx ? updated : undefined,
            expectedAt: undefined,
            responsible: s.responsible,
            documents: s.documents,
        })),
        notifications: [
            {
                id: 'live',
                text: `Matter status: ${matter.status || 'inquiry'}`,
                at: updated,
            },
        ],
    };
}
