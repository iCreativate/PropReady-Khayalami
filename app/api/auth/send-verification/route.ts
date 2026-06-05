import { NextRequest, NextResponse } from 'next/server';
import {
    generateVerificationCode,
    saveVerificationCode,
    type AccountType,
} from '@/lib/verification-store';
import { sendVerificationEmail } from '@/lib/send-verification-email';

export async function POST(request: NextRequest) {
    try {
        const { email, accountType = 'user', fullName } = await request.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const type: AccountType = accountType === 'agent' ? 'agent' : 'user';
        const code = generateVerificationCode();
        await saveVerificationCode(email, type, code);

        const sent = await sendVerificationEmail(email, code, fullName);

        if (!sent.ok) {
            if (process.env.NODE_ENV === 'development') {
                return NextResponse.json({
                    success: true,
                    message: 'Verification code generated (email not sent — check server logs)',
                    devCode: code,
                });
            }
            return NextResponse.json(
                { success: false, error: sent.error || 'Failed to send verification email' },
                { status: 500 }
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
