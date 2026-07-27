import { NextRequest, NextResponse } from 'next/server';
import {
    generateVerificationCode,
    saveVerificationCode,
} from '@/lib/verification-store';
import { parseAccountType } from '@/lib/auth-enterprise/account-profile';
import { sendVerificationEmail } from '@/lib/send-verification-email';

export async function POST(request: NextRequest) {
    try {
        const { email, accountType = 'user', fullName } = await request.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const type = parseAccountType(accountType);
        const code = generateVerificationCode();
        const saved = await saveVerificationCode(email, type, code);

        if (!saved.ok) {
            console.error('send-verification store failed:', saved.error);
            return NextResponse.json(
                { success: false, error: saved.error || 'Could not save verification code' },
                { status: 503 }
            );
        }

        const sent = await sendVerificationEmail(email, code, fullName);

        if (!sent.ok) {
            console.error('send-verification email failed:', sent.error);
            if (process.env.NODE_ENV === 'development') {
                return NextResponse.json({
                    success: true,
                    message: 'Verification code generated (email not sent — check server logs)',
                    warning: sent.error,
                    devCode: code,
                });
            }
            return NextResponse.json(
                {
                    success: false,
                    error: sent.error || 'Failed to send verification email',
                    codeSaved: true,
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email',
        });
    } catch (err) {
        console.error('send-verification error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
