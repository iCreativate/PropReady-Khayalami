import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { listEligibleContacts } from '@/lib/messages-eligibility';

export async function GET(request: NextRequest) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const contacts = await listEligibleContacts(session.user);
        return jsonWithSession(
            {
                contacts,
                emptyHint:
                    session.user.accountType === 'user'
                        ? contacts.length === 0
                            ? 'No contacts yet. An agent will appear here after they contact you, and a bond originator after you start pre-qualification.'
                            : null
                        : session.user.accountType === 'agent'
                          ? contacts.length === 0
                              ? 'No clients yet. Buyers and sellers appear here after you schedule a viewing with them.'
                              : null
                          : contacts.length === 0
                            ? 'No buyers yet. They appear here after they submit a pre-qualification with your organisation.'
                            : null,
            },
            session
        );
    } catch (err) {
        console.error('GET /api/messages/contacts:', err);
        const message = err instanceof Error ? err.message : 'Server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
