import { buildDemoBuyerQuizResult, DEMO_BUYER } from '@/lib/demo-users';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export interface BuyerQuizResult {
    id?: string;
    user_id?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    city?: string;
    inMarketForProperty?: boolean | null;
    monthlyIncome?: string;
    expenses?: string;
    hasDebt?: boolean | null;
    depositSaved?: string;
    creditScore?: string;
    employmentStatus?: string;
    score?: number;
    preQualAmount?: number;
    timestamp?: string;
}

export interface PortalUser {
    id?: string;
    fullName?: string;
    email?: string;
}

export function getPropReadyScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Very Good';
    if (score >= 50) return 'Good';
    if (score >= 35) return 'Fair';
    return 'Needs Improvement';
}

export function parseStoredAmount(value?: string | null): number {
    if (!value) return 0;
    const digitsOnly = value.replace(/[^\d]/g, '');
    return digitsOnly ? Number(digitsOnly) : 0;
}

export function calculateMonthlyBondBudget(preQualAmount: number): number {
    if (preQualAmount === 0) return 0;
    const annualRate = 0.1;
    const years = 20;
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;
    return Math.round(
        (preQualAmount * (monthlyRate * (1 + monthlyRate) ** numPayments)) /
            ((1 + monthlyRate) ** numPayments - 1)
    );
}

export function quizResultBelongsToUser(result: BuyerQuizResult, user: PortalUser): boolean {
    if (user.id && (result.id === user.id || result.user_id === user.id)) return true;
    if (user.email && result.email?.toLowerCase() === user.email.toLowerCase()) return true;
    return false;
}

function normalizeQuizResult(raw: Record<string, unknown>): BuyerQuizResult {
    return {
        id: raw.id ? String(raw.id) : undefined,
        user_id: raw.user_id ? String(raw.user_id) : undefined,
        fullName: raw.fullName ? String(raw.fullName) : raw.full_name ? String(raw.full_name) : undefined,
        email: raw.email ? String(raw.email) : undefined,
        phone: raw.phone ? String(raw.phone) : undefined,
        city: raw.city ? String(raw.city) : undefined,
        inMarketForProperty:
            typeof raw.inMarketForProperty === 'boolean'
                ? raw.inMarketForProperty
                : typeof raw.in_market_for_property === 'boolean'
                  ? raw.in_market_for_property
                  : null,
        monthlyIncome: raw.monthlyIncome
            ? String(raw.monthlyIncome)
            : raw.monthly_income
              ? String(raw.monthly_income)
              : undefined,
        expenses: raw.expenses ? String(raw.expenses) : undefined,
        hasDebt:
            typeof raw.hasDebt === 'boolean'
                ? raw.hasDebt
                : typeof raw.has_debt === 'boolean'
                  ? raw.has_debt
                  : null,
        depositSaved: (() => {
            const rawDeposit = raw.depositSaved ?? raw.deposit_saved;
            if (rawDeposit == null || rawDeposit === '') return undefined;
            // Never treat booleans / debt flags as a deposit amount
            if (typeof rawDeposit === 'boolean') return undefined;
            const asString = String(rawDeposit).trim();
            if (asString === 'true' || asString === 'false') return undefined;
            return asString;
        })(),
        creditScore: raw.creditScore
            ? String(raw.creditScore)
            : raw.credit_score
              ? String(raw.credit_score)
              : undefined,
        employmentStatus: raw.employmentStatus
            ? String(raw.employmentStatus)
            : raw.employment_status
              ? String(raw.employment_status)
              : undefined,
        score: typeof raw.score === 'number' ? raw.score : raw.score != null ? Number(raw.score) : undefined,
        preQualAmount:
            typeof raw.preQualAmount === 'number'
                ? raw.preQualAmount
                : raw.pre_qual_amount != null
                  ? Number(raw.pre_qual_amount)
                  : undefined,
        timestamp: raw.timestamp
            ? String(raw.timestamp)
            : raw.created_at
              ? String(raw.created_at)
              : undefined,
    };
}

function hasPreQualData(result: BuyerQuizResult | null): result is BuyerQuizResult {
    return Boolean(result && (result.preQualAmount != null || result.score != null));
}

function readLocalQuizResult(): BuyerQuizResult | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.quizResult);
        if (!raw) return null;
        return normalizeQuizResult(JSON.parse(raw) as Record<string, unknown>);
    } catch {
        return null;
    }
}

function readLocalLeadQuizResult(user: PortalUser): BuyerQuizResult | null {
    if (typeof window === 'undefined') return null;
    try {
        const leads = JSON.parse(localStorage.getItem(STORAGE_KEYS.leads) || '[]') as Record<string, unknown>[];
        const lead = leads.find((l) => {
            const id = l.id ? String(l.id) : '';
            const email = l.email ? String(l.email).toLowerCase() : '';
            return (
                (user.id && id === user.id) ||
                (user.email && email === user.email.toLowerCase())
            );
        });
        if (!lead) return null;
        return normalizeQuizResult(lead);
    } catch {
        return null;
    }
}

export function resolveBuyerQuizResultSync(user: PortalUser): BuyerQuizResult | null {
    if (user.id === DEMO_BUYER.id) {
        const demo = buildDemoBuyerQuizResult();
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.quizResult, JSON.stringify(demo));
        }
        return demo;
    }

    const stored = readLocalQuizResult();
    if (stored && quizResultBelongsToUser(stored, user) && hasPreQualData(stored)) {
        return stored;
    }

    const fromLead = readLocalLeadQuizResult(user);
    if (fromLead && hasPreQualData(fromLead)) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.quizResult, JSON.stringify(fromLead));
        }
        return fromLead;
    }

    return null;
}

export async function refreshBuyerQuizResultFromApi(
    user: PortalUser
): Promise<BuyerQuizResult | null> {
    try {
        const res = await fetch('/api/leads', { cache: 'no-store' });
        if (!res.ok) return null;

        const data = await res.json();
        const leads = Array.isArray(data.leads) ? data.leads : [];
        const match = leads.find((lead: Record<string, unknown>) => {
            const leadType = String(lead.leadType ?? lead.lead_type ?? 'buyer');
            if (leadType !== 'buyer') return false;
            const id = lead.id ? String(lead.id) : '';
            const email = lead.email ? String(lead.email).toLowerCase() : '';
            return (
                (user.id && id === user.id) ||
                (user.email && email === user.email.toLowerCase())
            );
        });

        if (!match) return null;

        const normalized = normalizeQuizResult(match);
        if (!hasPreQualData(normalized)) return null;

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.quizResult, JSON.stringify(normalized));
        }
        return normalized;
    } catch {
        return null;
    }
}

export async function resolveBuyerQuizResult(user: PortalUser): Promise<BuyerQuizResult | null> {
    const local = resolveBuyerQuizResultSync(user);
    if (local) return local;
    return refreshBuyerQuizResultFromApi(user);
}

export function prefillQuizFormFromResult(result: BuyerQuizResult) {
    return {
        fullName: result.fullName ?? '',
        email: result.email ?? '',
        phone: result.phone ?? '',
        city: result.city ?? '',
        inMarketForProperty: result.inMarketForProperty ?? null,
        monthlyIncome: result.monthlyIncome ?? '',
        expenses: result.expenses ?? '',
        hasDebt: result.hasDebt ?? null,
        depositSaved: result.depositSaved ?? '',
        creditScore: result.creditScore ?? '',
        employmentStatus: result.employmentStatus ?? '',
        password: '',
        confirmPassword: '',
    };
}
