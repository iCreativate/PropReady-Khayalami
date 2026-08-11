import { STORAGE_KEYS } from '@/lib/storage-keys';
import { createDemoTracker } from '@/lib/conveyancer-connect/tracker';
import type {
    CcUserState,
    ConsultationBooking,
    MatchAnswers,
    MessageThreadStub,
    QuoteRequest,
} from '@/lib/conveyancer-connect/types';
import {
    fetchUserWorkspace,
    reconcileWorkspaceState,
    scheduleWorkspacePush,
} from '@/lib/user-workspace-sync';

const MAX_COMPARE = 4;

export function defaultCcState(): CcUserState {
    return {
        savedIds: [],
        compareIds: [],
        notes: {},
        recentSearches: [],
        quotes: [],
        bookings: [],
        threads: [],
        matchAnswers: null,
        tracker: null,
        darkMode: false,
        updatedAt: new Date().toISOString(),
    };
}

function coerceCcState(raw: Partial<CcUserState> | null | undefined): CcUserState {
    return {
        ...defaultCcState(),
        ...(raw || {}),
        savedIds: Array.isArray(raw?.savedIds) ? raw.savedIds : [],
        compareIds: Array.isArray(raw?.compareIds) ? raw.compareIds : [],
        notes: raw?.notes && typeof raw.notes === 'object' ? raw.notes : {},
        recentSearches: Array.isArray(raw?.recentSearches) ? raw.recentSearches : [],
        quotes: Array.isArray(raw?.quotes) ? raw.quotes : [],
        bookings: Array.isArray(raw?.bookings) ? raw.bookings : [],
        threads: Array.isArray(raw?.threads) ? raw.threads : [],
        updatedAt: raw?.updatedAt || new Date().toISOString(),
    };
}

export function loadCcState(): CcUserState {
    if (typeof window === 'undefined') return defaultCcState();
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.conveyancerConnect);
        if (!raw) return defaultCcState();
        return coerceCcState(JSON.parse(raw) as Partial<CcUserState>);
    } catch {
        return defaultCcState();
    }
}

export function saveCcState(state: CcUserState): void {
    if (typeof window === 'undefined') return;
    const next = { ...state, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.conveyancerConnect, JSON.stringify(next));
    scheduleWorkspacePush('conveyancer-connect', next);
}

export async function hydrateCcStateFromCloud(): Promise<CcUserState> {
    const local = loadCcState();
    const cloud = await fetchUserWorkspace<CcUserState>('conveyancer-connect');
    if (!cloud?.state) return local;
    const remote = coerceCcState({
        ...cloud.state,
        updatedAt: cloud.updatedAt || cloud.state.updatedAt,
    });
    const savedIds = [...new Set([...(local.savedIds || []), ...(remote.savedIds || [])])];
    const compareIds = [...new Set([...(local.compareIds || []), ...(remote.compareIds || [])])].slice(
        0,
        MAX_COMPARE
    );
    const notes = { ...(local.notes || {}), ...(remote.notes || {}) };
    const recentSearches = [
        ...new Set([...(local.recentSearches || []), ...(remote.recentSearches || [])]),
    ].slice(0, 8);
    const base = reconcileWorkspaceState('conveyancer-connect', local, remote, {
        mergeArraysById: ['quotes', 'bookings', 'threads'],
    });
    const merged: CcUserState = {
        ...base,
        savedIds,
        compareIds,
        notes,
        recentSearches,
        matchAnswers: base.matchAnswers ?? local.matchAnswers ?? remote.matchAnswers,
        tracker: base.tracker ?? local.tracker ?? remote.tracker,
    };
    localStorage.setItem(STORAGE_KEYS.conveyancerConnect, JSON.stringify(merged));
    scheduleWorkspacePush('conveyancer-connect', merged);
    return merged;
}

export function toggleSaved(id: string): CcUserState {
    const state = loadCcState();
    state.savedIds = state.savedIds.includes(id)
        ? state.savedIds.filter((x) => x !== id)
        : [...state.savedIds, id];
    saveCcState(state);
    return state;
}

export function toggleCompare(id: string): { state: CcUserState; error?: string } {
    const state = loadCcState();
    if (state.compareIds.includes(id)) {
        state.compareIds = state.compareIds.filter((x) => x !== id);
        saveCcState(state);
        return { state };
    }
    if (state.compareIds.length >= MAX_COMPARE) {
        return { state, error: `You can compare up to ${MAX_COMPARE} conveyancers.` };
    }
    state.compareIds = [...state.compareIds, id];
    saveCcState(state);
    return { state };
}

export function pushRecentSearch(query: string): void {
    const q = query.trim();
    if (!q) return;
    const state = loadCcState();
    state.recentSearches = [q, ...state.recentSearches.filter((s) => s !== q)].slice(0, 8);
    saveCcState(state);
}

export function saveMatchAnswers(answers: MatchAnswers): void {
    const state = loadCcState();
    state.matchAnswers = answers;
    saveCcState(state);
}

export function addQuote(quote: Omit<QuoteRequest, 'id' | 'createdAt' | 'status'>): QuoteRequest {
    const state = loadCcState();
    const row: QuoteRequest = {
        ...quote,
        id: `q_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'submitted',
    };
    state.quotes = [row, ...state.quotes];
    saveCcState(state);
    return row;
}

export function addBooking(
    booking: Omit<ConsultationBooking, 'id' | 'createdAt' | 'status'>
): ConsultationBooking {
    const state = loadCcState();
    const row: ConsultationBooking = {
        ...booking,
        id: `b_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'confirmed',
    };
    state.bookings = [row, ...state.bookings];
    saveCcState(state);
    return row;
}

export function upsertThread(firmId: string, body: string): MessageThreadStub {
    const state = loadCcState();
    let thread = state.threads.find((t) => t.firmId === firmId);
    const msg = {
        id: `m_${Date.now()}`,
        from: 'user' as const,
        body,
        at: new Date().toISOString(),
    };
    if (!thread) {
        thread = { id: `t_${firmId}`, firmId, messages: [msg] };
        state.threads = [thread, ...state.threads];
    } else {
        thread.messages = [...thread.messages, msg];
        state.threads = state.threads.map((t) => (t.firmId === firmId ? thread! : t));
    }
    saveCcState(state);
    return thread;
}

export function ensureTracker(firmId: string, label: string) {
    const state = loadCcState();
    if (!state.tracker) {
        state.tracker = createDemoTracker(firmId, label);
        saveCcState(state);
    }
    return state.tracker;
}

export function setDarkMode(dark: boolean) {
    const state = loadCcState();
    state.darkMode = dark;
    saveCcState(state);
    return state;
}

export const COMPARE_LIMIT = MAX_COMPARE;
