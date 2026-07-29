import { STORAGE_KEYS } from '@/lib/storage-keys';
import {
    DEFAULT_BOND_PROFILE,
    DEFAULT_SCENARIO,
    type BondProfile,
    type PortfolioProperty,
    type ScenarioOverrides,
    type SboTab,
} from '@/lib/smart-bond/types';

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

export function loadSmartBondState(): SmartBondState {
    if (typeof window === 'undefined') {
        return {
            profile: DEFAULT_BOND_PROFILE,
            scenario: DEFAULT_SCENARIO,
            portfolio: defaultPortfolio(),
            activeTab: 'overview',
            bookmarks: [],
            updatedAt: new Date().toISOString(),
        };
    }
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) {
            return {
                profile: { ...DEFAULT_BOND_PROFILE },
                scenario: { ...DEFAULT_SCENARIO },
                portfolio: defaultPortfolio(),
                activeTab: 'overview',
                bookmarks: [],
                updatedAt: new Date().toISOString(),
            };
        }
        const parsed = JSON.parse(raw) as Partial<SmartBondState>;
        return {
            profile: { ...DEFAULT_BOND_PROFILE, ...(parsed.profile || {}) },
            scenario: { ...DEFAULT_SCENARIO, ...(parsed.scenario || {}) },
            portfolio: Array.isArray(parsed.portfolio) && parsed.portfolio.length
                ? parsed.portfolio
                : defaultPortfolio(),
            activeTab: parsed.activeTab || 'overview',
            bookmarks: parsed.bookmarks || [],
            updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
    } catch {
        return {
            profile: { ...DEFAULT_BOND_PROFILE },
            scenario: { ...DEFAULT_SCENARIO },
            portfolio: defaultPortfolio(),
            activeTab: 'overview',
            bookmarks: [],
            updatedAt: new Date().toISOString(),
        };
    }
}

export function saveSmartBondState(state: SmartBondState) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(
            KEY,
            JSON.stringify({ ...state, updatedAt: new Date().toISOString() })
        );
    } catch {
        /* ignore quota */
    }
}
