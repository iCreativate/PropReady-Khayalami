import { NextRequest, NextResponse } from 'next/server';
import { verifyCode } from '@/lib/verification-store';
import { verifyLoginOtpChallenge } from '@/lib/auth-enterprise/login-otp';
import {
    finalizeLoginFromChallenge,
    loadAuthAccountById,
    setAuthCookies,
    toLegacyUser,
} from '@/lib/auth-login-otp';

/**
 * Step 2 of login: verify email OTP + challenge token, then create session.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const challengeToken = String(body.challengeToken || '').trim();
        const otp = String(body.otp || body.code || '').trim();

        if (!challengeToken || !otp) {
            return NextResponse.json(
                { success: false, error: 'Login code and challenge are required' },
                { status: 400 }
            );
        }

        if (!/^\d{6}$/.test(otp)) {
            return NextResponse.json(
                { success: false, error: 'Enter the 6-digit code from your email' },
                { status: 400 }
            );
        }

        const challenge = await verifyLoginOtpChallenge(challengeToken);
        if (!challenge) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'This login code has expired. Please sign in again.',
                    expired: true,
                },
                { status: 401 }
            );
        }

        const ok = await verifyCode(challenge.email, challenge.accountType, otp);
        if (!ok) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired login code' },
                { status: 401 }
            );
        }

        const account = await loadAuthAccountById(challenge.accountId);
        if (!account) {
            return NextResponse.json(
                { success: false, error: 'Account not found. Please sign in again.' },
                { status: 401 }
            );
        }

        const session = await finalizeLoginFromChallenge(
            account,
            challenge.rememberDevice,
            request
        );

        const response = NextResponse.json({
            success: true,
            user: toLegacyUser(session.user),
            expiresIn: session.expiresIn,
        });
        setAuthCookies(response, session.accessToken, session.refreshToken, challenge.rememberDevice);
        return response;
    } catch (err) {
        console.error('auth/login/verify-otp:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
