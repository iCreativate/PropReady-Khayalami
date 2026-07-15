import {
    buildDemoBuyerLeadRecord,
    buildDemoBuyerQuizResult,
    buildDemoSellerInfo,
    buildDemoSellerLeadRecord,
    getDemoAccountType,
    getDemoViewingsForAccount,
} from '@/lib/demo-users';

function mergeViewingsIntoStorage(viewings: ReturnType<typeof getDemoViewingsForAccount>) {
    const existing = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
    const ids = new Set(existing.map((v: { id: string }) => v.id));
    const merged = [...existing, ...viewings.filter((v) => !ids.has(v.id))];
    localStorage.setItem('propReady_viewingAppointments', JSON.stringify(merged));
}

function mergeLeadIntoStorage(key: 'propReady_leads' | 'propReady_sellers', lead: object) {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const leadId = (lead as { id: string }).id;
    const filtered = existing.filter((l: { id: string }) => l.id !== leadId);
    filtered.push(lead);
    localStorage.setItem(key, JSON.stringify(filtered));
}

/** Populate localStorage so buyer/seller dashboards show pre-filled demo data after login. */
export function hydrateDemoUserSession(email: string): 'buyer' | 'seller' | null {
    if (typeof window === 'undefined') return null;

    const type = getDemoAccountType(email);
    if (!type) return null;

    if (type === 'buyer') {
        localStorage.setItem('propReady_quizResult', JSON.stringify(buildDemoBuyerQuizResult()));
        mergeLeadIntoStorage('propReady_leads', buildDemoBuyerLeadRecord());
    } else {
        localStorage.setItem('propReady_sellerInfo', JSON.stringify(buildDemoSellerInfo()));
        mergeLeadIntoStorage('propReady_sellers', buildDemoSellerLeadRecord());
    }

    mergeViewingsIntoStorage(getDemoViewingsForAccount(type));
    return type;
}
