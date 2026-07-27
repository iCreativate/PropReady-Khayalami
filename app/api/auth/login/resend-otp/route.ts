import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginOtpChallenge, signLoginOtpChallenge } from '@/lib/auth-enterprise/login-otp';
import { generateVerificationCode, saveVerificationCode } from '@/lib/verification-store';
import { sendLoginOtpEmail } from '@/lib/send-login-otp-email';
import { createServiceClient } from '@/lib/supabase-admin';
import { profileTableForAccountType } from '@/lib/auth-enterprise/account-profile';

function allowDevOtpFallback(): boolean {
    return (
        process.env.NODE_ENV === 'development' ||
        process.env.ALLOW_LOGIN_OTP_DEV_FALLBACK === 'true'
    );
}

/** Resend login OTP using an existing (still-valid) challenge token. */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const challengeToken = String(body.challengeToken || '').trim();
        if (!challengeToken) {
            return NextResponse.json({ success: false, error: 'Challenge required' }, { status: 400 });
        }

        const challenge = await verifyLoginOtpChallenge(challengeToken);
        if (!challenge) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'This login attempt expired. Please sign in again.',
                    expired: true,
                },
                { status: 401 }
            );
        }

        const code = generateVerificationCode();
        const saved = await saveVerificationCode(challenge.email, challenge.accountType, code);
        if (!saved.ok) {
            return NextResponse.json(
                { success: false, error: saved.error || 'Could not create login code' },
                { status: 503 }
            );
        }

        let fullName: string | undefined;
        const supabase = createServiceClient();
        if (supabase) {
            const table = profileTableForAccountType(challenge.accountType);
            const { data } = await supabase
                .from(table)
                .select('full_name')
                .eq('id', challenge.profileId)
                .maybeSingle();
            fullName = data?.full_name ? String(data.full_name) : undefined;
        }

        const sent = await sendLoginOtpEmail(challenge.email, code, fullName);
        if (!sent.ok && !allowDevOtpFallback()) {
            return NextResponse.json(
                { success: false, error: sent.error || 'Could not send login code' },
                { status: 503 }
            );
        }

        // Refresh challenge expiry
        const newChallenge = await signLoginOtpChallenge({
            email: challenge.email,
            accountType: challenge.accountType,
            profileId: challenge.profileId,
            accountId: challenge.accountId,
            rememberDevice: challenge.rememberDevice,
        });

        return NextResponse.json({
            success: true,
            challengeToken: newChallenge,
            email: challenge.email,
            message: 'A new login code was sent to your email.',
            ...(allowDevOtpFallback() && (!sent.ok || process.env.NODE_ENV === 'development')
                ? { devOtp: code }
                : {}),
        });
    } catch (err) {
        console.error('auth/login/resend-otp:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
