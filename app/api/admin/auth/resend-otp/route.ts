import { NextRequest, NextResponse } from 'next/server';
import {
    isAdminEmail,
    signAdminOtpChallenge,
    verifyAdminOtpChallenge,
} from '@/lib/admin-auth';
import { generateVerificationCode, saveVerificationCode } from '@/lib/verification-store';
import { sendLoginOtpEmail } from '@/lib/send-login-otp-email';

function allowDevFallback() {
    return process.env.NODE_ENV === 'development' || process.env.ALLOW_LOGIN_OTP_DEV_FALLBACK === 'true';
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const challengeToken = String(body.challengeToken || '').trim();
        if (!challengeToken) {
            return NextResponse.json({ success: false, error: 'Challenge required' }, { status: 400 });
        }

        const challenge = await verifyAdminOtpChallenge(challengeToken);
        if (!challenge || !isAdminEmail(challenge.email)) {
            return NextResponse.json(
                { success: false, error: 'This login attempt expired. Try again.', expired: true },
                { status: 401 }
            );
        }

        const code = generateVerificationCode();
        const saved = await saveVerificationCode(challenge.email, 'admin', code);
        if (!saved.ok) {
            return NextResponse.json(
                { success: false, error: saved.error || 'Could not create login code' },
                { status: 503 }
            );
        }

        const sent = await sendLoginOtpEmail(challenge.email, code, 'PropReady staff');
        if (!sent.ok && !allowDevFallback()) {
            return NextResponse.json(
                { success: false, error: sent.error || 'Could not send login code' },
                { status: 503 }
            );
        }

        const newChallenge = await signAdminOtpChallenge(challenge.email);
        return NextResponse.json({
            success: true,
            challengeToken: newChallenge,
            email: challenge.email,
            message: 'A new login code was sent.',
            ...(allowDevFallback() && (!sent.ok || process.env.NODE_ENV === 'development')
                ? { devOtp: code }
                : {}),
        });
    } catch (err) {
        console.error('admin auth resend-otp:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
