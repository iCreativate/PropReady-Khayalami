import type { AgentPpraFields } from '@/lib/ppra';
import { isAgentPpraVerified } from '@/lib/ppra';

/** Map DB / localStorage agent row to app shape with PPRA fields. */
export function mapAgentRecord(a: Record<string, unknown>) {
    const verificationStatus = (a.verification_status ?? a.verificationStatus ?? 'pending') as string;
    const mapped = {
        id: a.id as string,
        fullName: (a.full_name ?? a.fullName) as string,
        email: a.email as string,
        phone: (a.phone ?? '') as string,
        company: (a.company ?? '') as string,
        city: (a.city as string) ?? undefined,
        eaabNumber: (a.eaab_number ?? a.eaabNumber) as string | undefined,
        ppraNumber: (a.ppra_number ?? a.ppraNumber ?? a.eaab_number ?? a.eaabNumber) as string | undefined,
        ffcNumber: (a.ffc_number ?? a.ffcNumber) as string | undefined,
        ffcDocumentUrl: (a.ffc_document_url ?? a.ffcDocumentUrl) as string | undefined,
        verificationStatus,
        verificationDate: a.verification_date ?? a.verificationDate,
        verifiedBy: a.verified_by ?? a.verifiedBy,
        verificationNotes: a.verification_notes ?? a.verificationNotes,
        status: (a.status as string) ?? 'pending',
        plan: (a.plan as string) ?? 'free',
        sellerPlan: (a.seller_plan ?? a.sellerPlan) as string | undefined,
        planStatus: (a.plan_status ?? a.planStatus ?? 'trialing') as string,
        trialStartedAt: (a.trial_started_at ?? a.trialStartedAt) as string | null | undefined,
        trialEndsAt: (a.trial_ends_at ?? a.trialEndsAt) as string | null | undefined,
        planActivatedAt: (a.plan_activated_at ?? a.planActivatedAt) as string | null | undefined,
        emailVerified: a.email_verified ?? a.emailVerified,
    };
    return {
        ...mapped,
        verified: isAgentPpraVerified(mapped as AgentPpraFields),
        ppraVerified: isAgentPpraVerified(mapped as AgentPpraFields),
    };
}

export function filterPublicAgents<T extends AgentPpraFields & { id?: string }>(agents: T[]): T[] {
    return agents.filter((a) => isAgentPpraVerified(a));
}
