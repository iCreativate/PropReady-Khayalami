import { NextRequest, NextResponse } from 'next/server';
import {
    completeVerifiedProfile,
    findAccountById,
    setAuthCookies,
} from '@/lib/auth-enterprise';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import {
    parsePostLoginRole,
    resolvePostLoginDestination,
} from '@/lib/post-login-routing';
import { createServiceClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const session = await resolveSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        const account = await findAccountById(session.user.accountId);
        if (!account) {
            return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
        }

        const wasFirstTime = !account.password_hash;
        const body = await request.json();
        const intent =
            body.intent === 'seller'
                ? 'seller'
                : body.intent === 'buyer'
                  ? 'buyer'
                  : body.intent === 'learner'
                    ? 'learner'
                    : undefined;

        const result = await completeVerifiedProfile(account, {
            fullName: String(body.fullName || ''),
            phone: String(body.phone || ''),
            company: body.company ? String(body.company) : undefined,
            organizationId: body.organizationId ? String(body.organizationId) : undefined,
            eaabNumber: body.eaabNumber ? String(body.eaabNumber) : undefined,
            password: body.password ? String(body.password) : undefined,
            intent,
        });

        const supabase = createServiceClient();
        const redirectTo = await resolvePostLoginDestination(supabase, {
            accountType: result.user.accountType,
            profileId: result.user.profileId,
            email: result.user.email,
            onboardingIntent:
                result.intent === 'buyer' || result.intent === 'seller' ? result.intent : null,
            preferredRole: wasFirstTime ? parsePostLoginRole(result.intent) : null,
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: result.user.profileId,
                fullName: result.user.fullName,
                email: result.user.email,
                company: result.user.company,
                organizationId: result.user.organizationId,
                phone: result.user.phone,
                accountType: result.user.accountType,
                profileComplete: true,
                hasPassword: true,
                intent: result.intent,
                onboardingRequired: Boolean(result.user.onboardingRequired),
            },
            redirectTo,
        });
        setAuthCookies(response, result.accessToken, result.refreshToken, true);
        return response;
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not save profile';
        const status =
            /full legal name|phone number|company|organisation|organization|password|buying or selling|just learning/i.test(
                message
            )
                ? 400
                : 500;
        if (status === 500) console.error('auth/complete-profile:', err);
        return NextResponse.json({ success: false, error: message }, { status });
    }
}
