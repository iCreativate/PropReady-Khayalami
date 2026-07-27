import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSessionCookie, getAdminEmailFromRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    const email = await getAdminEmailFromRequest(request);
    if (!email) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, email });
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    clearAdminSessionCookie(response);
    return response;
}
