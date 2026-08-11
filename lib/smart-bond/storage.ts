import { STORAGE_KEYS } from '@/lib/storage-keys';
import {
    DEFAULT_BOND_PROFILE,
    DEFAULT_SCENARIO,
    type BondProfile,
    type PortfolioProperty,
    type ScenarioOverrides,
    type SboTab,
} from '@/lib/smart-bond/types';
import {
    fetchUserWorkspace,
    reconcileWorkspaceState,
    scheduleWorkspacePush,
} from '@/lib/user-workspace-sync';

const KEY = STORAGE_KEYS.smartBondOptimizer;

export type SmartBondState = {
    profile: BondProfile;
    scenario: ScenarioOverrides;
    portfolio: PortfolioProperty[];
    activeTab: SboTab;
    bookmarks: string[];
    updatedAt: string;
};

export function defaultPortfolio(): PortfolioProperty[] {
    return [
        {
            id: 'primary',
            name: 'Primary residence',
            kind: 'residential',
            value: DEFAULT_BOND_PROFILE.propertyValue,
            loanBalance: DEFAULT_BOND_PROFILE.outstandingBalance,
            monthlyRent: 0,
            monthlyExpenses: 2_800,
            rate: DEFAULT_BOND_PROFILE.annualInterestRate,
            remainingMonths: DEFAULT_BOND_PROFILE.remainingTermMonths,
        },
    ];
}

function freshDefault(): SmartBondState {
    return {
        profile: { ...DEFAULT_BOND_PROFILE },
        scenario: { ...DEFAULT_SCENARIO },
        portfolio: defaultPortfolio(),
        activeTab: 'overview',
        bookmarks: [],
        updatedAt: new Date().toISOString(),
    };
}

function coerceState(parsed: Partial<SmartBondState> | null | undefined): SmartBondState {
    return {
        profile: { ...DEFAULT_BOND_PROFILE, ...(parsed?.profile || {}) },
        scenario: { ...DEFAULT_SCENARIO, ...(parsed?.scenario || {}) },
        portfolio:
            Array.isArray(parsed?.portfolio) && parsed.portfolio.length
                ? parsed.portfolio
                : defaultPortfolio(),
        activeTab: parsed?.activeTab || 'overview',
        bookmarks: parsed?.bookmarks || [],
        updatedAt: parsed?.updatedAt || new Date().toISOString(),
    };
}

export function loadSmartBondState(): SmartBondState {
    if (typeof window === 'undefined') return freshDefault();
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return freshDefault();
        return coerceState(JSON.parse(raw) as Partial<SmartBondState>);
    } catch {
        return freshDefault();
    }
}

export function saveSmartBondState(state: SmartBondState) {
    if (typeof window === 'undefined') return;
    const next = { ...state, updatedAt: new Date().toISOString() };
    try {
        localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
        /* ignore quota */
    }
    scheduleWorkspacePush('smart-bond', next);
}

/** Merge cloud copy into local Smart Bond workspace on mount. */
export async function hydrateSmartBondStateFromCloud(): Promise<SmartBondState> {
    const local = loadSmartBondState();
    const cloud = await fetchUserWorkspace<SmartBondState>('smart-bond');
    if (!cloud?.state) return local;
    const remote = coerceState(cloud.state);
    if (cloud.updatedAt) remote.updatedAt = cloud.updatedAt;
    const merged = reconcileWorkspaceState('smart-bond', local, remote, {
        mergeArraysById: ['portfolio'],
    });
    try {
        localStorage.setItem(KEY, JSON.stringify(merged));
    } catch {
        /* ignore */
    }
    scheduleWorkspacePush('smart-bond', merged);
    return merged;
}
