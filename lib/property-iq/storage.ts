import { STORAGE_KEYS } from '@/lib/storage-keys';
import { createEmptyCompanionState } from './defaults';
import { syncDerivedBondFields, syncDerivedCurrentValue } from './engine';
import type { CompanionState, IqProperty } from './types';
import {
    coerceBuildCostBreakdown,
    coerceBuildFunding,
    coerceCurrentValueMode,
    coercePropertyCondition,
    coercePropertySpecs,
    coercePropertyType,
    coercePurchaseFunding,
    totalBuildCostOf,
} from './types';

const LS_KEY = STORAGE_KEYS.propertyCompanion;
const IDB_NAME = 'propReadyPropertyCompanion';
const IDB_STORE = 'workspace';
const IDB_STATE_KEY = 'companion_v1';
const IDB_VERSION = 1;
/** Fail open if IndexedDB never resolves (private mode / blocked). */
const IDB_TIMEOUT_MS = 4_000;

/** Known demo property IDs from the retired seed portfolio — strip once on migrate. */
const DEMO_PROPERTY_IDS = new Set(['prop-sea-point', 'prop-parkhurst', 'prop-umhlanga']);
const DEMO_GOAL_IDS = new Set(['goal-5', 'goal-income', 'goal-payoff', 'goal-20m']);
const DEMO_ALERT_IDS = new Set(['a1', 'a2', 'a3', 'a4', 'a5']);

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = window.setTimeout(() => {
            reject(new Error(`[Property Companion] ${label} timed out after ${ms}ms`));
        }, ms);
        promise.then(
            (value) => {
                window.clearTimeout(timer);
                resolve(value);
            },
            (err) => {
                window.clearTimeout(timer);
                reject(err);
            }
        );
    });
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_NAME, IDB_VERSION);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE);
            }
        };
    });
}

async function idbGetState(): Promise<CompanionState | null> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return null;
    try {
        const db = await withTimeout(openDb(), IDB_TIMEOUT_MS, 'IndexedDB open');
        const value = await withTimeout(
            new Promise<CompanionState | null>((resolve, reject) => {
                const tx = db.transaction(IDB_STORE, 'readonly');
                const req = tx.objectStore(IDB_STORE).get(IDB_STATE_KEY);
                req.onsuccess = () => resolve((req.result as CompanionState) ?? null);
                req.onerror = () => reject(req.error);
            }),
            IDB_TIMEOUT_MS,
            'IndexedDB read'
        );
        db.close();
        return value;
    } catch (err) {
        console.warn('[Property Companion] IndexedDB read failed — falling back.', err);
        return null;
    }
}

async function idbSetState(state: CompanionState): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        throw new Error('IndexedDB unavailable');
    }
    const db = await withTimeout(openDb(), IDB_TIMEOUT_MS, 'IndexedDB open');
    await withTimeout(
        new Promise<void>((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put({ ...state, version: 1 }, IDB_STATE_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
            tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'));
        }),
        IDB_TIMEOUT_MS * 2,
        'IndexedDB write'
    );
    db.close();
}

/** Coerce stored fields without re-running bond schedules (fast path for first paint). */
function coercePropertyFast(p: IqProperty): IqProperty {
    const buildCostBreakdown = coerceBuildCostBreakdown(p.buildCostBreakdown);
    const stagedTotal = totalBuildCostOf({
        buildCost: p.buildCost,
        buildCostBreakdown,
    });
    const buildCompletionDate =
        typeof p.buildCompletionDate === 'string' && p.buildCompletionDate.trim()
            ? p.buildCompletionDate.trim()
            : null;
    try {
        return syncDerivedCurrentValue({
            ...p,
            ...coercePropertySpecs(p),
            depositPaid:
                typeof p.depositPaid === 'number' && Number.isFinite(p.depositPaid) ? p.depositPaid : 0,
            buildCost: stagedTotal,
            buildCostBreakdown,
            buildFunding: coerceBuildFunding(p.buildFunding),
            buildCompletionDate,
            image: typeof p.image === 'string' ? p.image : '',
            images: Array.isArray(p.images)
                ? p.images.filter((x): x is string => typeof x === 'string')
                : [],
            propertyType: coercePropertyType(p.propertyType),
            purchaseFunding: coercePurchaseFunding(p.purchaseFunding, p),
            propertyCondition: coercePropertyCondition(p.propertyCondition),
            currentValueMode: coerceCurrentValueMode(p.currentValueMode, p),
        });
    } catch (err) {
        console.warn('[Property Companion] Skipping corrupt property during load', p?.id, err);
        return p;
    }
}

function normalizeProperty(p: IqProperty): IqProperty {
    const fast = coercePropertyFast(p);
    try {
        return syncDerivedBondFields(fast);
    } catch (err) {
        console.warn('[Property Companion] Bond sync failed for property', p?.id, err);
        return fast;
    }
}

function coerceState(raw: unknown): CompanionState | null {
    if (!raw || typeof raw !== 'object') return null;
    const parsed = raw as Partial<CompanionState>;
    if (!Array.isArray(parsed.properties)) return null;
    return {
        version: 1,
        properties: parsed.properties as IqProperty[],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
        activePropertyId: parsed.activePropertyId ?? null,
    };
}

/**
 * Strip retired demo seeds once. `fast` skips bond re-schedule for snappy first paint.
 */
function stripDemoData(state: CompanionState, mode: 'fast' | 'full' = 'fast'): CompanionState {
    const mapProp = mode === 'full' ? normalizeProperty : coercePropertyFast;
    const properties = state.properties
        .filter((p) => p?.id && !DEMO_PROPERTY_IDS.has(p.id))
        .map((p) => {
            try {
                return mapProp(p);
            } catch {
                return p;
            }
        });
    const goals = (state.goals ?? []).filter((g) => g?.id && !DEMO_GOAL_IDS.has(g.id));
    const alerts = (state.alerts ?? []).filter((a) => a?.id && !DEMO_ALERT_IDS.has(a.id));
    const activeStillValid =
        state.activePropertyId && properties.some((p) => p.id === state.activePropertyId)
            ? state.activePropertyId
            : properties[0]?.id ?? null;
    return {
        version: 1,
        properties,
        goals,
        alerts,
        activePropertyId: activeStillValid,
    };
}

/** localStorage copy without heavy images — emergency mirror only. */
function slimForLocalStorage(state: CompanionState): CompanionState {
    return {
        ...state,
        version: 1,
        properties: state.properties.map((p) => ({
            ...p,
            image: '',
            images: [],
        })),
    };
}

function readLocalStorageRaw(): CompanionState | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        return coerceState(JSON.parse(raw));
    } catch {
        return null;
    }
}

function writeLocalStorageMirror(state: CompanionState): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(slimForLocalStorage(state)));
    } catch {
        // Quota — IndexedDB remains source of truth; do not wipe anything.
    }
}

/**
 * Load Companion workspace. Prefers IndexedDB; migrates from localStorage once.
 * Never invents an empty wipe over existing data unless nothing is stored.
 * Always resolves — timeouts / corrupt data fall back to empty or localStorage.
 */
export async function loadCompanionStateAsync(): Promise<CompanionState> {
    if (typeof window === 'undefined') return createEmptyCompanionState();

    try {
        const fromIdb = coerceState(await idbGetState());
        if (fromIdb) {
            return stripDemoData(fromIdb, 'fast');
        }

        const fromLs = readLocalStorageRaw();
        if (fromLs) {
            const migrated = stripDemoData(fromLs, 'fast');
            try {
                await idbSetState(migrated);
                writeLocalStorageMirror(migrated);
            } catch {
                /* still return migrated */
            }
            return migrated;
        }
    } catch (err) {
        console.warn('[Property Companion] Load failed — starting empty workspace.', err);
        try {
            const fromLs = readLocalStorageRaw();
            if (fromLs) return stripDemoData(fromLs, 'fast');
        } catch {
            /* ignore */
        }
    }

    return createEmptyCompanionState();
}

/** Re-run bond sync in the background after fast first paint. */
export function refineCompanionState(state: CompanionState): CompanionState {
    return stripDemoData(state, 'full');
}

/**
 * Persist Companion workspace. IndexedDB is durable; localStorage is a slim mirror.
 * Never clears existing storage on failure.
 */
export async function saveCompanionStateAsync(state: CompanionState): Promise<void> {
    if (typeof window === 'undefined') return;
    // Persist as-is — callers keep bond/value fields in sync via withBondFinance / etc.
    // Re-normalising here re-ran full bond schedules and made every edit feel slow.
    const payload: CompanionState = {
        ...state,
        version: 1,
    };

    let idbOk = false;
    try {
        await idbSetState(payload);
        idbOk = true;
    } catch (err) {
        console.warn('[Property Companion] IndexedDB save failed — keeping previous durable copy.', err);
    }

    writeLocalStorageMirror(payload);

    if (!idbOk) {
        // Last resort: try full payload in localStorage (may fail on large images)
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(payload));
        } catch (err) {
            console.warn(
                '[Property Companion] localStorage full save failed. Data remains in memory this session; free space or remove a photo.',
                err
            );
        }
    }
}

/** Sync helpers for non-async call sites — prefer async APIs. */
export function loadCompanionState(): CompanionState {
    if (typeof window === 'undefined') return createEmptyCompanionState();
    const fromLs = readLocalStorageRaw();
    if (fromLs) return stripDemoData(fromLs, 'fast');
    return createEmptyCompanionState();
}

export function saveCompanionState(state: CompanionState) {
    if (typeof window === 'undefined') return;
    void saveCompanionStateAsync(state);
}

/** Explicit delete of one property — the only intentional removal path. */
export function deleteCompanionProperty(state: CompanionState, propertyId: string): CompanionState {
    const properties = state.properties.filter((p) => p.id !== propertyId);
    const activePropertyId =
        state.activePropertyId === propertyId
            ? properties[0]?.id ?? null
            : state.activePropertyId && properties.some((p) => p.id === state.activePropertyId)
              ? state.activePropertyId
              : properties[0]?.id ?? null;
    return {
        ...state,
        version: 1,
        properties,
        activePropertyId,
    };
}
