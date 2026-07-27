import { NextRequest, NextResponse } from 'next/server';
import {
    isAdminEmail,
    setAdminSessionCookie,
    signAdminSession,
    verifyAdminOtpChallenge,
} from '@/lib/admin-auth';
import { verifyCode } from '@/lib/verification-store';

/** Step 2: verify OTP and set httpOnly admin session cookie. */
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

        const challenge = await verifyAdminOtpChallenge(challengeToken);
        if (!challenge || !isAdminEmail(challenge.email)) {
            return NextResponse.json(
                { success: false, error: 'This login attempt expired. Try again.', expired: true },
                { status: 401 }
            );
        }

        const ok = await verifyCode(challenge.email, 'admin', otp);
        if (!ok) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired login code' },
                { status: 401 }
            );
        }

        const sessionToken = await signAdminSession(challenge.email);
        const response = NextResponse.json({
            success: true,
            email: challenge.email,
        });
        setAdminSessionCookie(response, sessionToken);
        return response;
    } catch (err) {
        console.error('admin auth verify-otp:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
