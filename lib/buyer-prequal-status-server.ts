import type { SupabaseClient } from '@supabase/supabase-js';

export type BuyerPrequalStatus = {
    hasBuyerLead: boolean;
    hasSellerLead: boolean;
    /** Soft PropReady quiz / lead with score or pre-qual amount */
    hasBuyerQuiz: boolean;
    /** Open originator prequal case (not closed) */
    hasPrequalCase: boolean;
    /** Originator posted a result or case is result_ready */
    fullPrequalified: boolean;
    /** User should not be forced through quiz / onboarding prequal again */
    buyerPrequalComplete: boolean;
};

function hasQuizMetrics(row: {
    pre_qual_amount?: number | null;
    score?: number | null;
} | null): boolean {
    if (!row) return false;
    return row.pre_qual_amount != null || row.score != null;
}

export async function getBuyerPrequalStatus(
    supabase: SupabaseClient,
    input: { profileId?: string | null; email?: string | null }
): Promise<BuyerPrequalStatus> {
    const profileId = input.profileId?.trim() || '';
    const email = input.email?.trim().toLowerCase() || '';

    let hasBuyerLead = false;
    let hasSellerLead = false;
    let hasBuyerQuiz = false;
    let hasPrequalCase = false;
    let fullPrequalified = false;

    if (email) {
        const { data: leads } = await supabase
            .from('leads')
            .select('lead_type, pre_qual_amount, score')
            .eq('email', email)
            .limit(20);

        for (const row of leads || []) {
            const leadType = String(row.lead_type || 'buyer');
            if (leadType === 'buyer') {
                hasBuyerLead = true;
                if (hasQuizMetrics(row)) hasBuyerQuiz = true;
            }
            if (leadType === 'seller' || leadType === 'investor') {
                hasSellerLead = true;
            }
        }
    }

    if (profileId) {
        const { data: quizRow } = await supabase
            .from('quiz_results')
            .select('pre_qual_amount, score')
            .eq('user_id', profileId)
            .maybeSingle();
        if (hasQuizMetrics(quizRow)) {
            hasBuyerQuiz = true;
        }

        const { data: cases } = await supabase
            .from('prequal_cases')
            .select('status, official_amount')
            .eq('buyer_user_id', profileId)
            .neq('status', 'closed');

        if (cases?.length) {
            hasPrequalCase = true;
            fullPrequalified = cases.some(
                (c) =>
                    c.status === 'result_ready' ||
                    (c.official_amount != null && Number(c.official_amount) > 0)
            );
        }
    }

    const buyerPrequalComplete =
        hasBuyerQuiz || hasBuyerLead || hasPrequalCase || fullPrequalified;

    return {
        hasBuyerLead,
        hasSellerLead,
        hasBuyerQuiz,
        hasPrequalCase,
        fullPrequalified,
        buyerPrequalComplete,
    };
}
