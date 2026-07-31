import { hydrateDemoUserSession } from '@/lib/demo-user-session';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { AccountType } from '@/lib/auth-enterprise/config';

export type BridgedSessionUser = {
    id: string;
    fullName?: string;
    email: string;
    company?: string;
    organizationId?: string;
    plan?: string;
    sellerPlan?: string;
    planStatus?: string;
    trialStartedAt?: string | null;
    trialEndsAt?: string | null;
    planActivatedAt?: string | null;
    accountType?: AccountType;
};

const SESSION_CACHE_TTL_MS = 30_000;

let sessionCache: { value: BridgedSessionUser | null; at: number } | null = null;
let sessionInflight: Promise<BridgedSessionUser | null> | null = null;

export function clearLegacyAuthStorage() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    localStorage.removeItem(STORAGE_KEYS.currentAgent);
    localStorage.removeItem('propReady_currentOriginator');
    localStorage.removeItem('propReady_currentConveyancer');
    sessionCache = null;
    sessionInflight = null;
}

export function invalidateSessionCache() {
    sessionCache = null;
    sessionInflight = null;
}

/** Instant paint from localStorage while cookie session verifies in the background. */
export function readOptimisticSession(
    accountType: AccountType
): BridgedSessionUser | null {
    if (typeof window === 'undefined') return null;
    try {
        if (accountType === 'agent') {
            const raw = localStorage.getItem(STORAGE_KEYS.currentAgent);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            if (!parsed?.id || !parsed?.email) return null;
            return {
                id: String(parsed.id),
                fullName: parsed.fullName ? String(parsed.fullName) : undefined,
                email: String(parsed.email),
                company: parsed.company ? String(parsed.company) : undefined,
                accountType: 'agent',
            };
        }
        if (accountType === 'originator') {
            const raw = localStorage.getItem('propReady_currentOriginator');
            if (!raw) return null;
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            if (!parsed?.id || !parsed?.email) return null;
            return {
                id: String(parsed.id),
                fullName: parsed.fullName ? String(parsed.fullName) : undefined,
                email: String(parsed.email),
                organizationId: parsed.organizationId
                    ? String(parsed.organizationId)
                    : undefined,
                accountType: 'originator',
            };
        }
        if (accountType === 'conveyancer') {
            const raw = localStorage.getItem('propReady_currentConveyancer');
            if (!raw) return null;
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            if (!parsed?.id || !parsed?.email) return null;
            return {
                id: String(parsed.id),
                fullName: parsed.fullName ? String(parsed.fullName) : undefined,
                email: String(parsed.email),
                company: parsed.firmName ? String(parsed.firmName) : undefined,
                accountType: 'conveyancer',
            };
        }
        const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (!parsed?.id || !parsed?.email) return null;
        return {
            id: String(parsed.id),
            fullName: parsed.fullName ? String(parsed.fullName) : undefined,
            email: String(parsed.email),
            accountType: 'user',
        };
    } catch {
        return null;
    }
}

export function syncLegacySession(
    user: BridgedSessionUser,
    accountType: AccountType = user.accountType || 'user'
) {
    if (typeof window === 'undefined') return;
    if (accountType === 'agent') {
        localStorage.setItem(
            STORAGE_KEYS.currentAgent,
            JSON.stringify({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                company: user.company,
                plan: user.plan,
                sellerPlan: user.sellerPlan,
                planStatus: user.planStatus,
                trialStartedAt: user.trialStartedAt ?? null,
                trialEndsAt: user.trialEndsAt ?? null,
                planActivatedAt: user.planActivatedAt ?? null,
            })
        );
    } else if (accountType === 'originator') {
        localStorage.setItem(
            'propReady_currentOriginator',
            JSON.stringify({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                organizationId: user.organizationId || user.company,
            })
        );
    } else if (accountType === 'conveyancer') {
        localStorage.setItem(
            'propReady_currentConveyancer',
            JSON.stringify({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                firmName: user.company,
            })
        );
    } else {
        localStorage.setItem(
            STORAGE_KEYS.currentUser,
            JSON.stringify({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
            })
        );
        hydrateDemoUserSession(user.email);
    }
}

async function fetchSessionFromCookies(): Promise<BridgedSessionUser | null> {
    try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (res.status === 401) {
            clearLegacyAuthStorage();
            return null;
        }
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.authenticated || !data.user) return null;

        const rawType = data.user.accountType;
        const accountType: AccountType =
            rawType === 'agent' || rawType === 'originator' || rawType === 'conveyancer'
                ? rawType
                : 'user';
        const bridged: BridgedSessionUser = {
            id: data.user.profileId || data.user.accountId,
            fullName: data.user.fullName,
            email: data.user.email,
            company: data.user.company,
            organizationId: data.user.organizationId,
            plan: data.user.plan,
            sellerPlan: data.user.sellerPlan,
            planStatus: data.user.planStatus,
            trialStartedAt: data.user.trialStartedAt ?? null,
            trialEndsAt: data.user.trialEndsAt ?? null,
            planActivatedAt: data.user.planActivatedAt ?? null,
            accountType,
        };
        syncLegacySession(bridged, accountType);
        return bridged;
    } catch {
        return null;
    }
}

/** Hydrate localStorage from cookie session API. Dedupes in-flight requests and caches briefly. */
export async function hydrateSessionFromCookies(
    options?: { force?: boolean }
): Promise<BridgedSessionUser | null> {
    const force = options?.force === true;
    const now = Date.now();
    if (!force && sessionCache && now - sessionCache.at < SESSION_CACHE_TTL_MS) {
        return sessionCache.value;
    }
    if (!force && sessionInflight) {
        return sessionInflight;
    }

    sessionInflight = fetchSessionFromCookies()
        .then((value) => {
            sessionCache = { value, at: Date.now() };
            return value;
        })
        .finally(() => {
            sessionInflight = null;
        });

    return sessionInflight;
}
