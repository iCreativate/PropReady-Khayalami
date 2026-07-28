import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest, jsonWithSession } from '@/lib/auth-enterprise/server-session';
import { createViewingFromMessageAppointment } from '@/lib/message-appointment-viewing';
import {
    displayNameForUser,
    messagesDb,
    requireParticipant,
    serializeAppointment,
    serializeMessage,
    touchConversationPreview,
    type AppointmentRow,
    type ConversationRow,
    type MessageItemRow,
    type ParticipantRow,
} from '@/lib/messages';

async function createCounterProposal(opts: {
    conversationId: string;
    startsAt: string;
    location: string | null;
    notes: string | null;
    accountType: string;
    profileId: string;
    displayName: string;
    inReplyToAppointmentId: string;
}) {
    const now = new Date().toISOString();
    const whenLabel = new Date(opts.startsAt).toLocaleString('en-ZA', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
    const preview = `Suggested new time: ${whenLabel}`;

    const { data: message, error: msgErr } = await messagesDb()
        .from('message_items')
        .insert({
            conversation_id: opts.conversationId,
            kind: 'appointment',
            body: preview,
            meta: {
                startsAt: opts.startsAt,
                endsAt: null,
                location: opts.location,
                notes: opts.notes,
                inReplyToAppointmentId: opts.inReplyToAppointmentId,
            },
            sender_account_type: opts.accountType,
            sender_profile_id: opts.profileId,
            sender_name: opts.displayName,
            created_at: now,
        })
        .select('*')
        .single();

    if (msgErr || !message) throw msgErr || new Error('Could not create counter-proposal message');

    const { data: appointment, error: aptErr } = await messagesDb()
        .from('message_appointments')
        .insert({
            conversation_id: opts.conversationId,
            message_id: message.id,
            proposed_by_account_type: opts.accountType,
            proposed_by_profile_id: opts.profileId,
            starts_at: opts.startsAt,
            ends_at: null,
            location: opts.location,
            notes: opts.notes,
            status: 'proposed',
            created_at: now,
            updated_at: now,
        })
        .select('*')
        .single();

    if (aptErr || !appointment) throw aptErr || new Error('Could not create counter-proposal');

    const meta = {
        appointmentId: appointment.id,
        startsAt: opts.startsAt,
        endsAt: null,
        location: opts.location,
        notes: opts.notes,
        status: 'proposed',
        inReplyToAppointmentId: opts.inReplyToAppointmentId,
    };

    await messagesDb().from('message_items').update({ meta }).eq('id', message.id);
    await touchConversationPreview(opts.conversationId, preview, now);

    return {
        message: serializeMessage({
            ...(message as MessageItemRow),
            meta,
        }),
        appointment: serializeAppointment(appointment as AppointmentRow),
    };
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await resolveSessionFromRequest(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: appointmentId } = await params;
        const body = await request.json();
        const status = String(body.status || '').trim();
        if (!['accepted', 'declined', 'cancelled'].includes(status)) {
            return NextResponse.json(
                { error: 'status must be accepted, declined, or cancelled' },
                { status: 400 }
            );
        }

        const suggestedStartsAt = body.suggestedStartsAt
            ? String(body.suggestedStartsAt).trim()
            : '';
        if (
            status === 'declined' &&
            suggestedStartsAt &&
            Number.isNaN(Date.parse(suggestedStartsAt))
        ) {
            return NextResponse.json(
                { error: 'Valid suggestedStartsAt required when objecting with a new time' },
                { status: 400 }
            );
        }

        const { data: appointment, error } = await messagesDb()
            .from('message_appointments')
            .select('*')
            .eq('id', appointmentId)
            .maybeSingle();

        if (error) throw error;
        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        await requireParticipant(appointment.conversation_id, session.user);

        if (appointment.status !== 'proposed' && status !== 'cancelled') {
            return NextResponse.json({ error: 'Appointment already resolved' }, { status: 409 });
        }

        // Proposer cannot approve/object their own open proposal
        if (
            status !== 'cancelled' &&
            appointment.proposed_by_account_type === session.user.accountType &&
            appointment.proposed_by_profile_id === session.user.profileId
        ) {
            return NextResponse.json(
                { error: 'You cannot respond to your own appointment proposal' },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();
        let viewingId: string | null = appointment.viewing_id;
        const objectedWithSuggestion = status === 'declined' && Boolean(suggestedStartsAt);

        if (status === 'accepted') {
            const [{ data: conversation }, { data: participants }] = await Promise.all([
                messagesDb()
                    .from('message_conversations')
                    .select('*')
                    .eq('id', appointment.conversation_id)
                    .maybeSingle(),
                messagesDb()
                    .from('message_participants')
                    .select('*')
                    .eq('conversation_id', appointment.conversation_id),
            ]);

            if (conversation) {
                viewingId =
                    (await createViewingFromMessageAppointment(
                        appointment as AppointmentRow,
                        conversation as ConversationRow,
                        (participants || []) as ParticipantRow[]
                    )) || viewingId;
            }
        }

        const { data: updated, error: updErr } = await messagesDb()
            .from('message_appointments')
            .update({
                status,
                viewing_id: viewingId,
                responded_by_account_type: session.user.accountType,
                responded_by_profile_id: session.user.profileId,
                responded_at: now,
                updated_at: now,
            })
            .eq('id', appointmentId)
            .select('*')
            .single();

        if (updErr || !updated) throw updErr || new Error('Could not update appointment');

        const displayName = displayNameForUser(session.user);
        let messageBody =
            status === 'accepted'
                ? 'Appointment approved'
                : status === 'declined'
                  ? objectedWithSuggestion
                      ? 'Appointment objected — new time suggested'
                      : 'Appointment objected'
                  : 'Appointment cancelled';

        if (appointment.message_id) {
            const { data: msg } = await messagesDb()
                .from('message_items')
                .select('meta')
                .eq('id', appointment.message_id)
                .maybeSingle();
            const meta =
                msg?.meta && typeof msg.meta === 'object'
                    ? { ...(msg.meta as Record<string, unknown>) }
                    : {};
            await messagesDb()
                .from('message_items')
                .update({
                    meta: {
                        ...meta,
                        appointmentId,
                        status,
                        viewingId,
                        suggestedStartsAt: suggestedStartsAt || null,
                    },
                    body: messageBody,
                })
                .eq('id', appointment.message_id);
        }

        const systemBody =
            status === 'accepted'
                ? `${displayName} approved the appointment`
                : status === 'declined'
                  ? objectedWithSuggestion
                      ? `${displayName} objected and suggested a new time`
                      : `${displayName} objected to the appointment`
                  : `${displayName} cancelled the appointment`;

        await messagesDb().from('message_items').insert({
            conversation_id: appointment.conversation_id,
            kind: 'system',
            body: systemBody,
            meta: {
                appointmentId,
                status,
                viewingId,
                suggestedStartsAt: suggestedStartsAt || null,
            },
            sender_account_type: null,
            sender_profile_id: null,
            sender_name: 'System',
            created_at: now,
        });

        let counter: Awaited<ReturnType<typeof createCounterProposal>> | null = null;
        if (objectedWithSuggestion) {
            const suggestedNotes = body.suggestedNotes
                ? String(body.suggestedNotes).trim()
                : null;
            const location =
                body.suggestedLocation != null
                    ? String(body.suggestedLocation).trim() || null
                    : appointment.location;

            counter = await createCounterProposal({
                conversationId: appointment.conversation_id,
                startsAt: new Date(suggestedStartsAt).toISOString(),
                location,
                notes: suggestedNotes || `Counter-proposal to appointment ${appointmentId.slice(0, 8)}`,
                accountType: session.user.accountType,
                profileId: session.user.profileId,
                displayName,
                inReplyToAppointmentId: appointmentId,
            });
        } else {
            await touchConversationPreview(appointment.conversation_id, systemBody, now);
        }

        return jsonWithSession(
            {
                success: true,
                appointment: serializeAppointment(updated as AppointmentRow),
                counterMessage: counter?.message || null,
                counterAppointment: counter?.appointment || null,
            },
            session
        );
    } catch (err) {
        const status = (err as { status?: number })?.status || 500;
        const message = err instanceof Error ? err.message : 'Server error';
        if (status !== 403) console.error('PATCH appointment:', err);
        return NextResponse.json({ error: message }, { status });
    }
}
