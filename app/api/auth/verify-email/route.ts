import { NextRequest, NextResponse } from 'next/server';
import {
    verifyCode,
    markEmailVerified,
    type AccountType,
} from '@/lib/verification-store';

export async function POST(request: NextRequest) {
    try {
        const { email, code, accountType = 'user' } = await request.json();

        if (!email || !code) {
            return NextResponse.json(
                { success: false, error: 'Email and verification code are required' },
                { status: 400 }
            );
        }

        const type: AccountType = accountType === 'agent' ? 'agent' : 'user';
        const valid = await verifyCode(email, type, String(code));

        if (!valid) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired verification code' },
                { status: 400 }
            );
        }

        await markEmailVerified(email, type);

        // Sync enterprise auth account verification
        try {
            const { findAccountByEmail, markEmailVerified: markAuthVerified } = await import(
                '@/lib/auth-enterprise/sessions'
            );
            const account = await findAccountByEmail(email.toLowerCase().trim(), type);
            if (account) await markAuthVerified(account.id);
        } catch {
            /* auth tables may not exist yet */
        }

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully. You can now sign in.',
        });
    } catch (err) {
        console.error('verify-email error:', err);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
