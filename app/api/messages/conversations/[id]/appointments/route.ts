import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import {
    displayNameForUser,
    messagesDb,
    requireParticipant,
    serializeAppointment,
    serializeMessage,
    touchConversationPreview,
    type AppointmentRow,
    type MessageItemRow,
} from '@/lib/messages';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: conversationId } = await params;
        await requireParticipant(conversationId, session.user);

        const body = await request.json();
        const startsAt = String(body.startsAt || '').trim();
        if (!startsAt || Number.isNaN(Date.parse(startsAt))) {
            return NextResponse.json({ error: 'Valid startsAt required' }, { status: 400 });
        }

        const endsAt = body.endsAt ? String(body.endsAt) : null;
        const location = body.location ? String(body.location).trim() : null;
        const notes = body.notes ? String(body.notes).trim() : null;

        const now = new Date().toISOString();
        const whenLabel = new Date(startsAt).toLocaleString('en-ZA', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
        const preview = `Proposed appointment: ${whenLabel}`;

        const { data: message, error: msgErr } = await messagesDb()
            .from('message_items')
            .insert({
                conversation_id: conversationId,
                kind: 'appointment',
                body: preview,
                meta: { startsAt, endsAt, location, notes },
                sender_account_type: session.user.accountType,
                sender_profile_id: session.user.profileId,
                sender_name: displayNameForUser(session.user),
                created_at: now,
            })
            .select('*')
            .single();

        if (msgErr || !message) throw msgErr || new Error('Could not create appointment message');

        const { data: appointment, error: aptErr } = await messagesDb()
            .from('message_appointments')
            .insert({
                conversation_id: conversationId,
                message_id: message.id,
                proposed_by_account_type: session.user.accountType,
                proposed_by_profile_id: session.user.profileId,
                starts_at: startsAt,
                ends_at: endsAt,
                location,
                notes,
                status: 'proposed',
                created_at: now,
                updated_at: now,
            })
            .select('*')
            .single();

        if (aptErr || !appointment) throw aptErr || new Error('Could not create appointment');

        await messagesDb()
            .from('message_items')
            .update({
                meta: {
                    ...(typeof message.meta === 'object' && message.meta ? message.meta : {}),
                    appointmentId: appointment.id,
                    startsAt,
                    endsAt,
                    location,
                    notes,
                    status: 'proposed',
                },
            })
            .eq('id', message.id);

        await touchConversationPreview(conversationId, preview, now);

        return jsonWithSession(
            {
                success: true,
                message: serializeMessage({
                    ...(message as MessageItemRow),
                    meta: {
                        appointmentId: appointment.id,
                        startsAt,
                        endsAt,
                        location,
                        notes,
                        status: 'proposed',
                    },
                }),
                appointment: serializeAppointment(appointment as AppointmentRow),
            },
            session
        );
    } catch (err) {
        const status = (err as { status?: number })?.status || 500;
        const message = err instanceof Error ? err.message : 'Server error';
        if (status !== 403) console.error('POST appointments:', err);
        return NextResponse.json({ error: message }, { status });
    }
}
