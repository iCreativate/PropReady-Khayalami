import type { SupabaseClient } from '@supabase/supabase-js';
import { dashboardPathForAccountType } from '@/lib/auth-enterprise/account-profile';
import { getBuyerPrequalStatus } from '@/lib/buyer-prequal-status-server';

export type PostLoginRole = 'buyer' | 'seller' | 'learner';

export type ResolvePostLoginInput = {
    accountType: string;
    profileId?: string | null;
    email?: string | null;
    onboardingIntent?: 'buyer' | 'seller' | null;
    preferredRole?: PostLoginRole | null;
};

export function parsePostLoginRole(value: unknown): PostLoginRole | null {
    if (value === 'buyer' || value === 'seller' || value === 'learner') return value;
    return null;
}

function resolveConsumerRole(input: ResolvePostLoginInput): PostLoginRole {
    if (input.preferredRole === 'learner') return 'learner';
    if (input.preferredRole === 'seller' || input.preferredRole === 'buyer') {
        return input.preferredRole;
    }
    if (input.onboardingIntent === 'seller') return 'seller';
    if (input.onboardingIntent === 'buyer') return 'buyer';
    return 'buyer';
}

/**
 * Server-side post-login destination for consumer and professional accounts.
 * Uses leads / prequal status so returning users are never sent back through a quiz.
 */
export async function resolvePostLoginDestination(
    supabase: SupabaseClient | null,
    input: ResolvePostLoginInput
): Promise<string> {
    const { accountType } = input;
    if (accountType !== 'user') {
        return dashboardPathForAccountType(accountType);
    }

    const role = resolveConsumerRole(input);
    if (role === 'learner') {
        return '/learning-center';
    }

    const status = supabase
        ? await getBuyerPrequalStatus(supabase, {
              profileId: input.profileId,
              email: input.email,
          })
        : {
              hasBuyerLead: false,
              hasSellerLead: false,
              hasBuyerQuiz: false,
              hasPrequalCase: false,
              fullPrequalified: false,
              buyerPrequalComplete: false,
          };

    if (role === 'seller') {
        if (status.hasSellerLead) return '/sellers/dashboard';
        return '/sellers/quiz?resume=1';
    }

    if (status.hasBuyerLead || status.buyerPrequalComplete) {
        return '/dashboard';
    }

    if (status.hasSellerLead && !status.hasBuyerLead && !status.buyerPrequalComplete) {
        return '/sellers/dashboard';
    }

    return '/get-started?resume=1&role=buyer';
}
