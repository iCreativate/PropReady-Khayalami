import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { SavedBondCalculation } from '@/lib/bond-calculator';
import {
    fetchUserWorkspace,
    reconcileWorkspaceState,
    scheduleWorkspacePush,
} from '@/lib/user-workspace-sync';

const MAX_SAVES = 8;

export type BondCalculatorWorkspace = {
    saves: SavedBondCalculation[];
    updatedAt: string;
};

function readLocal(): BondCalculatorWorkspace {
    if (typeof window === 'undefined') {
        return { saves: [], updatedAt: new Date().toISOString() };
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.bondCalculatorSaves);
        if (!raw) return { saves: [], updatedAt: new Date().toISOString() };
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return { saves: parsed, updatedAt: new Date().toISOString() };
        }
        return {
            saves: Array.isArray(parsed?.saves) ? parsed.saves : [],
            updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
        };
    } catch {
        return { saves: [], updatedAt: new Date().toISOString() };
    }
}

function writeLocal(workspace: BondCalculatorWorkspace) {
    if (typeof window === 'undefined') return;
    const next = {
        saves: workspace.saves.slice(0, MAX_SAVES),
        updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.bondCalculatorSaves, JSON.stringify(next));
    scheduleWorkspacePush('bond-calculator', next);
}

export function readSavedBondCalculations(): SavedBondCalculation[] {
    return readLocal().saves;
}

export function writeSavedBondCalculations(items: SavedBondCalculation[]) {
    writeLocal({ saves: items.slice(0, MAX_SAVES), updatedAt: new Date().toISOString() });
}

export function saveBondCalculation(
    input: Omit<SavedBondCalculation, 'id' | 'savedAt' | 'label'> & { label?: string }
): SavedBondCalculation[] {
    const existing = readSavedBondCalculations();
    const entry: SavedBondCalculation = {
        ...input,
        id: `bc-${Date.now()}`,
        savedAt: new Date().toISOString(),
        label: input.label || `Scenario · ${new Date().toLocaleDateString('en-ZA')}`,
    };
    const next = [entry, ...existing.filter((s) => s.id !== entry.id)].slice(0, MAX_SAVES);
    writeSavedBondCalculations(next);
    return next;
}

export function deleteSavedBondCalculation(id: string): SavedBondCalculation[] {
    const next = readSavedBondCalculations().filter((s) => s.id !== id);
    writeSavedBondCalculations(next);
    return next;
}

export async function hydrateBondCalculatorFromCloud(): Promise<SavedBondCalculation[]> {
    const local = readLocal();
    const cloud = await fetchUserWorkspace<BondCalculatorWorkspace>('bond-calculator');
    if (!cloud?.state) return local.saves;
    const remote: BondCalculatorWorkspace = {
        saves: Array.isArray(cloud.state.saves) ? cloud.state.saves : [],
        updatedAt: cloud.updatedAt || cloud.state.updatedAt || new Date().toISOString(),
    };
    const merged = reconcileWorkspaceState('bond-calculator', local, remote, {
        mergeArraysById: ['saves'],
    });
    writeLocal(merged);
    return merged.saves;
}
