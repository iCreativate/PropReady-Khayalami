import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { getImpersonatorFromRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { user } = session;
    const impersonatedBy = user.impersonatedBy || getImpersonatorFromRequest(request) || null;
    return jsonWithSession(
        {
            authenticated: true,
            user: {
                accountId: user.accountId,
                profileId: user.profileId,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                accountType: user.accountType,
                company: user.company,
                plan: user.plan,
                sellerPlan: user.sellerPlan,
                verificationStatus: user.verificationStatus,
                profileComplete: Boolean(user.profileComplete),
                hasPassword: Boolean(user.hasPassword),
                passwordOk: user.passwordOk !== false,
                onboardingIntent: user.onboardingIntent ?? null,
                onboardingRequired: Boolean(user.onboardingRequired),
                impersonatedBy,
            },
        },
        session
    );
}

export async function POST(request: NextRequest) {
    return GET(request);
}
