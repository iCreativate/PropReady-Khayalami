import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { SavedBondCalculation } from '@/lib/bond-calculator';

const MAX_SAVES = 8;

export function readSavedBondCalculations(): SavedBondCalculation[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.bondCalculatorSaves);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as SavedBondCalculation[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function writeSavedBondCalculations(items: SavedBondCalculation[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
        STORAGE_KEYS.bondCalculatorSaves,
        JSON.stringify(items.slice(0, MAX_SAVES))
    );
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
