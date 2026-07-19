import { NextRequest, NextResponse } from 'next/server';
import { findAccountById, markOnboardingComplete } from '@/lib/auth-enterprise';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';

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

        await markOnboardingComplete(account.id);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('auth/complete-onboarding:', err);
        return NextResponse.json({ success: false, error: 'Could not complete onboarding' }, { status: 500 });
    }
}
