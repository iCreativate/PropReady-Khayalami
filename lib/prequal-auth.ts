import { NextRequest } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';
import type { PrequalCaseRow } from '@/lib/prequal-cases';

export type PrequalActor =
    | {
          role: 'buyer';
          profileId: string;
          email: string;
          fullName?: string;
      }
    | {
          role: 'originator';
          profileId: string;
          email: string;
          fullName?: string;
          organizationId: string;
      };

export async function resolvePrequalActor(request: NextRequest): Promise<PrequalActor | null> {
    const session = await resolveSessionFromRequest(request);
    if (!session?.user) return null;

    const { user } = session;
    if (user.accountType === 'originator') {
        let organizationId = user.organizationId;
        if (!organizationId) {
            const supabase = createServiceClient();
            if (!supabase) return null;
            const { data } = await supabase
                .from('originators')
                .select('organization_id, full_name')
                .eq('id', user.profileId)
                .maybeSingle();
            organizationId = data?.organization_id;
            if (!organizationId) return null;
            return {
                role: 'originator',
                profileId: user.profileId,
                email: user.email,
                fullName: user.fullName || data?.full_name,
                organizationId,
            };
        }
        return {
            role: 'originator',
            profileId: user.profileId,
            email: user.email,
            fullName: user.fullName,
            organizationId,
        };
    }

    if (user.accountType === 'user') {
        return {
            role: 'buyer',
            profileId: user.profileId,
            email: user.email,
            fullName: user.fullName,
        };
    }

    return null;
}

export function canAccessCase(actor: PrequalActor, caseRow: PrequalCaseRow): boolean {
    if (actor.role === 'buyer') return caseRow.buyer_user_id === actor.profileId;
    return caseRow.organization_id === actor.organizationId;
}
