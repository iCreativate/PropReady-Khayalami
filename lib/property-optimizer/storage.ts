import { STORAGE_KEYS } from '@/lib/storage-keys';
import { DEFAULT_AGENT_COMMISSION_PCT } from '@/lib/property-optimizer/engine';
import {
    fetchUserWorkspace,
    reconcileWorkspaceState,
    scheduleWorkspacePush,
} from '@/lib/user-workspace-sync';

export type PvoWorkspaceState = {
    suburb: string;
    municipality: string;
    province: string;
    streetAddress: string;
    propertyType: string;
    bedrooms: string;
    bathrooms: string;
    parking: string;
    floorSize: string;
    landSize: string;
    purchasePrice: string;
    purchaseDate: string;
    underBond: boolean;
    bondBalance: string;
    completedIds: string[];
    spendById: Record<string, string>;
    agentPct: string;
    costAmounts: Record<string, string>;
    expectedSale: string;
    isPrimaryResidence: boolean;
    forecastScenario: 'conservative' | 'expected' | 'optimistic';
    timelineYear: number;
    activeScenario: string;
    updatedAt: string;
};

export function defaultPvoWorkspace(): PvoWorkspaceState {
    return {
        suburb: '',
        municipality: '',
        province: '',
        streetAddress: '',
        propertyType: '',
        bedrooms: '',
        bathrooms: '',
        parking: '',
        floorSize: '',
        landSize: '',
        purchasePrice: '',
        purchaseDate: '',
        underBond: false,
        bondBalance: '',
        completedIds: [],
        spendById: {},
        agentPct: String(DEFAULT_AGENT_COMMISSION_PCT),
        costAmounts: {},
        expectedSale: '',
        isPrimaryResidence: true,
        forecastScenario: 'expected',
        timelineYear: 0,
        activeScenario: 'today',
        updatedAt: new Date().toISOString(),
    };
}

function coercePvo(raw: Partial<PvoWorkspaceState> | null | undefined): PvoWorkspaceState {
    const base = defaultPvoWorkspace();
    if (!raw || typeof raw !== 'object') return base;
    return {
        ...base,
        ...raw,
        completedIds: Array.isArray(raw.completedIds) ? raw.completedIds.map(String) : [],
        spendById:
            raw.spendById && typeof raw.spendById === 'object'
                ? Object.fromEntries(
                      Object.entries(raw.spendById).map(([k, v]) => [k, String(v ?? '')])
                  )
                : {},
        costAmounts:
            raw.costAmounts && typeof raw.costAmounts === 'object'
                ? Object.fromEntries(
                      Object.entries(raw.costAmounts).map(([k, v]) => [k, String(v ?? '')])
                  )
                : {},
        underBond: Boolean(raw.underBond),
        isPrimaryResidence: raw.isPrimaryResidence !== false,
        forecastScenario:
            raw.forecastScenario === 'conservative' || raw.forecastScenario === 'optimistic'
                ? raw.forecastScenario
                : 'expected',
        timelineYear: Number.isFinite(Number(raw.timelineYear)) ? Number(raw.timelineYear) : 0,
        updatedAt: raw.updatedAt || new Date().toISOString(),
    };
}

export function loadPvoWorkspace(): PvoWorkspaceState {
    if (typeof window === 'undefined') return defaultPvoWorkspace();
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.propertyValueOptimizer);
        if (!raw) return defaultPvoWorkspace();
        return coercePvo(JSON.parse(raw) as Partial<PvoWorkspaceState>);
    } catch {
        return defaultPvoWorkspace();
    }
}

export function savePvoWorkspace(state: PvoWorkspaceState): void {
    if (typeof window === 'undefined') return;
    const next = { ...state, updatedAt: new Date().toISOString() };
    try {
        localStorage.setItem(STORAGE_KEYS.propertyValueOptimizer, JSON.stringify(next));
    } catch {
        /* ignore quota */
    }
    scheduleWorkspacePush('property-value-optimizer', next);
}

export async function hydratePvoWorkspaceFromCloud(): Promise<PvoWorkspaceState> {
    const local = loadPvoWorkspace();
    const cloud = await fetchUserWorkspace<PvoWorkspaceState>('property-value-optimizer');
    if (!cloud?.state) return local;
    const remote = coercePvo({
        ...cloud.state,
        updatedAt: cloud.updatedAt || cloud.state.updatedAt,
    });
    const merged = reconcileWorkspaceState('property-value-optimizer', local, remote);
    try {
        localStorage.setItem(STORAGE_KEYS.propertyValueOptimizer, JSON.stringify(merged));
    } catch {
        /* ignore */
    }
    scheduleWorkspacePush('property-value-optimizer', merged);
    return merged;
}
