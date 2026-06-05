/**
 * Lead verification requires a booked viewing where both buyer and seller
 * confirm the appointment was arranged.
 */

export type LeadVerificationStatus = 'unverified' | 'pending_confirmation' | 'verified';

export interface ViewingVerificationData {
    id?: string;
    buyerLeadId?: string | null;
    sellerLeadId?: string | null;
    buyerEmail?: string | null;
    sellerEmail?: string | null;
    buyerName?: string | null;
    sellerName?: string | null;
    buyerPhone?: string | null;
    sellerPhone?: string | null;
    buyerConfirmedAt?: string | null;
    sellerConfirmedAt?: string | null;
    /** Legacy single-contact viewings */
    contactEmail?: string | null;
    contactType?: 'buyer' | 'seller' | null;
    contactName?: string | null;
    date?: string;
    time?: string;
}

export interface LeadVerificationFields {
    id: string;
    email?: string;
    leadType?: 'buyer' | 'seller' | 'investor';
    appointmentVerified?: boolean;
}

function normEmail(email?: string | null): string {
    return (email || '').trim().toLowerCase();
}

export function hasDualPartyViewing(v: ViewingVerificationData): boolean {
    return !!(normEmail(v.buyerEmail) && normEmail(v.sellerEmail));
}

export function isBuyerConfirmed(v: ViewingVerificationData): boolean {
    return !!v.buyerConfirmedAt;
}

export function isSellerConfirmed(v: ViewingVerificationData): boolean {
    return !!v.sellerConfirmedAt;
}

export function getViewingVerificationStatus(v: ViewingVerificationData): LeadVerificationStatus {
    if (!hasDualPartyViewing(v)) return 'unverified';
    if (isBuyerConfirmed(v) && isSellerConfirmed(v)) return 'verified';
    if (isBuyerConfirmed(v) || isSellerConfirmed(v)) return 'pending_confirmation';
    return 'pending_confirmation';
}

export function viewingMatchesLead(v: ViewingVerificationData, lead: LeadVerificationFields): boolean {
    const type = lead.leadType === 'seller' || lead.leadType === 'investor' ? 'seller' : 'buyer';
    const email = normEmail(lead.email);

    if (type === 'buyer') {
        if (v.buyerLeadId && v.buyerLeadId === lead.id) return true;
        if (normEmail(v.buyerEmail) === email) return true;
        if (!hasDualPartyViewing(v) && v.contactType === 'buyer' && normEmail(v.contactEmail) === email) {
            return true;
        }
    } else {
        if (v.sellerLeadId && v.sellerLeadId === lead.id) return true;
        if (normEmail(v.sellerEmail) === email) return true;
        if (!hasDualPartyViewing(v) && v.contactType === 'seller' && normEmail(v.contactEmail) === email) {
            return true;
        }
    }
    return false;
}

export function getLeadVerificationStatus(
    lead: LeadVerificationFields,
    viewings: ViewingVerificationData[]
): LeadVerificationStatus {
    if (lead.appointmentVerified) return 'verified';

    const related = viewings.filter((v) => viewingMatchesLead(v, lead));
    if (related.length === 0) return 'unverified';

    let best: LeadVerificationStatus = 'unverified';
    for (const v of related) {
        const status = getViewingVerificationStatus(v);
        if (status === 'verified') return 'verified';
        if (status === 'pending_confirmation') best = 'pending_confirmation';
    }
    return best;
}

export function countVerifiedLeads(
    leads: LeadVerificationFields[],
    viewings: ViewingVerificationData[]
): number {
    return leads.filter((l) => getLeadVerificationStatus(l, viewings) === 'verified').length;
}

export function verificationStatusLabel(status: LeadVerificationStatus): string {
    switch (status) {
        case 'verified':
            return 'Verified';
        case 'pending_confirmation':
            return 'Awaiting confirmation';
        default:
            return 'Unverified';
    }
}

export function verificationStatusClasses(status: LeadVerificationStatus): string {
    switch (status) {
        case 'verified':
            return 'bg-green-500/20 text-green-700 border-green-500/30';
        case 'pending_confirmation':
            return 'bg-amber-500/20 text-amber-800 border-amber-500/30';
        default:
            return 'bg-charcoal/10 text-charcoal/60 border-charcoal/20';
    }
}
