import { NextRequest, NextResponse } from 'next/server';
import { createPasswordReset } from '@/lib/auth-enterprise';
import type { AccountType } from '@/lib/auth-enterprise';

export async function POST(request: NextRequest) {
    const { email, type = 'user' } = await request.json();
    if (!email) {
        return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    const accountType: AccountType = type === 'agent' ? 'agent' : 'user';
    await createPasswordReset(String(email).trim(), accountType);

    return NextResponse.json({
        success: true,
        message: 'If an account exists, password reset instructions have been sent.',
    });
}
