import { NextRequest, NextResponse } from 'next/server';
import {
    parsePostLoginRole,
    resolvePostLoginDestination,
} from '@/lib/post-login-routing';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { createServiceClient } from '@/lib/supabase-admin';

/** Returns the best post-login path for the signed-in user (respects leads + role). */
export async function GET(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const preferredRole = parsePostLoginRole(request.nextUrl.searchParams.get('role'));
    const supabase = createServiceClient();
    const redirectTo = await resolvePostLoginDestination(supabase, {
        accountType: session.user.accountType,
        profileId: session.user.profileId,
        email: session.user.email,
        onboardingIntent: session.user.onboardingIntent,
        preferredRole,
    });

    return jsonWithSession({ authenticated: true, redirectTo }, session);
}
