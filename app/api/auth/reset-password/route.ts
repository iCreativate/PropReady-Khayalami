import { NextRequest, NextResponse } from 'next/server';
import { validatePassword } from '@/lib/password';
import { clearAuthCookies } from '@/lib/auth-enterprise/cookies';
import { resetPasswordWithToken } from '@/lib/auth-enterprise/magic-link';
import { parseAccountType } from '@/lib/auth-enterprise/account-profile';

export async function POST(request: NextRequest) {
    const { token, password, type = 'user' } = await request.json();
    if (!token || !password) {
        return NextResponse.json({ success: false, error: 'Token and password required' }, { status: 400 });
    }

    const pw = validatePassword(String(password));
    if (!pw.valid) {
        return NextResponse.json({ success: false, error: pw.errors.join(', ') }, { status: 400 });
    }

    const accountType = parseAccountType(type);
    const result = await resetPasswordWithToken(String(token), accountType, String(password));

    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Sessions are revoked in the database, but this browser still holds the
    // access JWT. Drop it so the Sign in link is not bounced off the login page.
    const response = NextResponse.json({
        success: true,
        message: 'Password updated. Please sign in.',
    });
    clearAuthCookies(response);
    return response;
}
