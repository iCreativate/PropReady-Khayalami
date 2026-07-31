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
                    contacts.length === 0
                        ? session.user.accountType === 'user'
                            ? 'No contacts yet. Agents appear after they contact you, bond originators after pre-qualification, and conveyancers from Conveyancer Connect.'
                            : session.user.accountType === 'agent'
                              ? 'No clients yet. Buyers and sellers appear after viewings; approved conveyancers are available for referrals.'
                              : session.user.accountType === 'conveyancer'
                                ? 'No clients yet. They appear when buyers or agents request a quote, book a consultation, or message your firm.'
                                : 'No buyers yet. They appear here after they submit a pre-qualification with your organisation.'
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
