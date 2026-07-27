import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmails, isAdminEmail, signAdminOtpChallenge } from '@/lib/admin-auth';
import { generateVerificationCode, saveVerificationCode } from '@/lib/verification-store';
import { sendLoginOtpEmail } from '@/lib/send-login-otp-email';

function allowDevFallback() {
    return process.env.NODE_ENV === 'development' || process.env.ALLOW_LOGIN_OTP_DEV_FALLBACK === 'true';
}

/** Step 1: request OTP — only ADMIN_EMAILS receive a code. */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = String(body.email || '')
            .trim()
            .toLowerCase();

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
        }

        if (!getAdminEmails().length) {
            return NextResponse.json(
                { success: false, error: 'Admin access not configured' },
                { status: 503 }
            );
        }

        // Same response shape for all emails (avoid revealing staff allowlist).
        // Only allowlisted addresses get a real OTP stored/sent.
        if (isAdminEmail(email)) {
            const code = generateVerificationCode();
            const saved = await saveVerificationCode(email, 'admin', code);
            if (!saved.ok) {
                return NextResponse.json(
                    { success: false, error: saved.error || 'Could not create login code' },
                    { status: 503 }
                );
            }

            const sent = await sendLoginOtpEmail(email, code, 'PropReady staff');
            if (!sent.ok && !allowDevFallback()) {
                return NextResponse.json(
                    { success: false, error: sent.error || 'Could not send login code' },
                    { status: 503 }
                );
            }

            const challengeToken = await signAdminOtpChallenge(email);
            return NextResponse.json({
                success: true,
                needsOtp: true,
                challengeToken,
                email,
                message: 'If this email is authorised, a login code was sent.',
                ...(allowDevFallback() && (!sent.ok || process.env.NODE_ENV === 'development')
                    ? { devOtp: code }
                    : {}),
            });
        }

        const challengeToken = await signAdminOtpChallenge(email);
        return NextResponse.json({
            success: true,
            needsOtp: true,
            challengeToken,
            email,
            message: 'If this email is authorised, a login code was sent.',
        });
    } catch (err) {
        console.error('admin auth request-otp:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
