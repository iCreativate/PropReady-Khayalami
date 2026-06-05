import {
    getLeadVerificationStatus,
    viewingMatchesLead,
    type LeadVerificationFields,
    type ViewingVerificationData,
} from '@/lib/lead-verification';

export interface AgentLeadRecord extends LeadVerificationFields {
    id: string;
    leadType?: 'buyer' | 'seller' | 'investor';
    fullName: string;
    email: string;
    phone?: string;
    status: 'new' | 'contacted' | 'qualified' | 'not-interested';
    timestamp?: string;
    contactedAt?: string | null;
    score?: number;
    preQualAmount?: number;
    bondOriginator?: string | null;
    prequalifiedWithOriginator?: boolean;
    city?: string | null;
    employmentStatus?: string;
    propertyAddress?: string;
    currentValue?: string;
    timeline?: string;
}

export interface ScheduledViewing extends ViewingVerificationData {
    id: string;
    propertyTitle?: string;
    propertyAddress?: string;
    date?: string;
    time?: string;
    status?: string;
}

export function leadWasContacted(lead: AgentLeadRecord): boolean {
    return lead.status === 'contacted' || lead.status === 'qualified';
}

export function leadHasScheduledAppointment(
    lead: AgentLeadRecord,
    viewings: ScheduledViewing[]
): boolean {
    return viewings.some((v) => {
        if (!viewingMatchesLead(v, lead)) return false;
        const hasSlot = Boolean(v.date && v.time);
        const active =
            !v.status || v.status === 'scheduled' || v.status === 'confirmed' || v.status === 'completed';
        return hasSlot && active;
    });
}

/** Contacted by agent + viewing appointment scheduled */
export function isMyLead(lead: AgentLeadRecord, viewings: ScheduledViewing[]): boolean {
    return leadWasContacted(lead) && leadHasScheduledAppointment(lead, viewings);
}

export function getLeadAppointments(
    lead: AgentLeadRecord,
    viewings: ScheduledViewing[]
): ScheduledViewing[] {
    return viewings.filter(
        (v) =>
            viewingMatchesLead(v, lead) &&
            v.date &&
            v.time &&
            (!v.status || v.status !== 'cancelled')
    );
}

export function filterMyLeads(
    leads: AgentLeadRecord[],
    viewings: ScheduledViewing[]
): AgentLeadRecord[] {
    return leads.filter((l) => isMyLead(l, viewings));
}

export function myLeadVerificationStatus(
    lead: AgentLeadRecord,
    viewings: ScheduledViewing[]
): ReturnType<typeof getLeadVerificationStatus> {
    return getLeadVerificationStatus(lead, viewings);
}
