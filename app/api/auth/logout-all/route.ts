import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth-enterprise';
import { resolveSessionFromRequest } from '@/lib/auth-enterprise/server-session';
import { revokeAllSessions } from '@/lib/auth-enterprise/sessions';

export async function POST(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (session) {
        await revokeAllSessions(session.user.accountId, session.user.sessionId);
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
}
