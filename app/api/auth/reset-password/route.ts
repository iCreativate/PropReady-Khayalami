import { NextRequest, NextResponse } from 'next/server';
import { validatePassword } from '@/lib/password';
import { resetPasswordWithToken } from '@/lib/auth-enterprise/magic-link';
import type { AccountType } from '@/lib/auth-enterprise';

export async function POST(request: NextRequest) {
    const { token, password, type = 'user' } = await request.json();
    if (!token || !password) {
        return NextResponse.json({ success: false, error: 'Token and password required' }, { status: 400 });
    }

    const pw = validatePassword(String(password));
    if (!pw.valid) {
        return NextResponse.json({ success: false, error: pw.errors.join(', ') }, { status: 400 });
    }

    const accountType: AccountType = type === 'agent' ? 'agent' : 'user';
    const result = await resetPasswordWithToken(String(token), accountType, String(password));

    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Password updated. Please sign in.' });
}
