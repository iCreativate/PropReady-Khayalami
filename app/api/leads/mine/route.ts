import { NextRequest, NextResponse } from 'next/server';
import { getBuyerPrequalStatus } from '@/lib/buyer-prequal-status-server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';

/**
 * Returns buyer/seller lead presence and prequal completion for the signed-in consumer.
 */
export async function GET(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    if (session.user.accountType !== 'user') {
        return jsonWithSession(
            {
                authenticated: true,
                hasBuyerLead: true,
                hasSellerLead: true,
                hasAnyLead: true,
                hasBuyerQuiz: true,
                hasPrequalCase: false,
                fullPrequalified: false,
                buyerPrequalComplete: true,
                originatorPrequalComplete: false,
            },
            session
        );
    }

    const supabase = createServiceClient();
    const status = supabase
        ? await getBuyerPrequalStatus(supabase, {
              profileId: session.user.profileId,
              email: session.user.email,
          })
        : {
              hasBuyerLead: false,
              hasSellerLead: false,
              hasBuyerQuiz: false,
              hasPrequalCase: false,
              fullPrequalified: false,
              buyerPrequalComplete: false,
          };

    return jsonWithSession(
        {
            authenticated: true,
            hasBuyerLead: status.hasBuyerLead,
            hasSellerLead: status.hasSellerLead,
            hasAnyLead: status.hasBuyerLead || status.hasSellerLead,
            hasBuyerQuiz: status.hasBuyerQuiz,
            hasPrequalCase: status.hasPrequalCase,
            fullPrequalified: status.fullPrequalified,
            buyerPrequalComplete: status.buyerPrequalComplete,
            originatorPrequalComplete: status.hasPrequalCase || status.fullPrequalified,
        },
        session
    );
}
