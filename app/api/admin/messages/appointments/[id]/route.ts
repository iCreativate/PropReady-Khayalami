import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { adminDisplayName, adminProfileId, ensureAdminParticipant } from '@/lib/admin-messages';
import { createViewingFromMessageAppointment } from '@/lib/message-appointment-viewing';
import {
    messagesDb,
    serializeAppointment,
    serializeMessage,
    touchConversationPreview,
    type AppointmentRow,
    type ConversationRow,
    type MessageItemRow,
    type ParticipantRow,
} from '@/lib/messages';

type Ctx = { params: Promise<{ id: string }> };

async function createCounterProposal(opts: {
    conversationId: string;
    startsAt: string;
    location: string | null;
    notes: string | null;
    adminId: string;
    adminName: string;
    inReplyToAppointmentId: string;
}) {
    const now = new Date().toISOString();
    const whenLabel = new Date(opts.startsAt).toLocaleString('en-ZA', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
    const preview = `Suggested new time: ${whenLabel}`;
    const db = messagesDb();

    const { data: message, error: msgErr } = await db
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
            sender_account_type: 'admin',
            sender_profile_id: opts.adminId,
            sender_name: opts.adminName,
            created_at: now,
        })
        .select('*')
        .single();

    if (msgErr || !message) throw msgErr || new Error('Could not create counter-proposal message');

    const { data: appointment, error: aptErr } = await db
        .from('message_appointments')
        .insert({
            conversation_id: opts.conversationId,
            message_id: message.id,
            proposed_by_account_type: 'admin',
            proposed_by_profile_id: opts.adminId,
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

    await db.from('message_items').update({ meta }).eq('id', message.id);
    await touchConversationPreview(opts.conversationId, preview, now);

    return {
        message: serializeMessage({
            ...(message as MessageItemRow),
            meta,
        }),
        appointment: serializeAppointment(appointment as AppointmentRow),
    };
}

export async function PATCH(request: NextRequest, context: Ctx) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { id: appointmentId } = await context.params;
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

        const db = messagesDb();
        const { data: appointment, error } = await db
            .from('message_appointments')
            .select('*')
            .eq('id', appointmentId)
            .maybeSingle();

        if (error) throw error;
        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        await ensureAdminParticipant(appointment.conversation_id, auth.email);

        if (appointment.status !== 'proposed' && status !== 'cancelled') {
            return NextResponse.json({ error: 'Appointment already resolved' }, { status: 409 });
        }

        const adminId = adminProfileId(auth.email);
        const adminName = adminDisplayName(auth.email);

        if (
            status !== 'cancelled' &&
            appointment.proposed_by_account_type === 'admin' &&
            appointment.proposed_by_profile_id === adminId
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
                db
                    .from('message_conversations')
                    .select('*')
                    .eq('id', appointment.conversation_id)
                    .maybeSingle(),
                db
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

        const { data: updated, error: updErr } = await db
            .from('message_appointments')
            .update({
                status,
                viewing_id: viewingId,
                responded_by_account_type: 'admin',
                responded_by_profile_id: adminId,
                responded_at: now,
                updated_at: now,
            })
            .eq('id', appointmentId)
            .select('*')
            .single();

        if (updErr || !updated) throw updErr || new Error('Could not update appointment');

        const messageBody =
            status === 'accepted'
                ? 'Appointment approved'
                : status === 'declined'
                  ? objectedWithSuggestion
                      ? 'Appointment objected — new time suggested'
                      : 'Appointment objected'
                  : 'Appointment cancelled';

        if (appointment.message_id) {
            const { data: msg } = await db
                .from('message_items')
                .select('meta')
                .eq('id', appointment.message_id)
                .maybeSingle();
            const meta =
                msg?.meta && typeof msg.meta === 'object'
                    ? { ...(msg.meta as Record<string, unknown>) }
                    : {};
            await db
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
                ? `${adminName} approved the appointment`
                : status === 'declined'
                  ? objectedWithSuggestion
                      ? `${adminName} objected and suggested a new time`
                      : `${adminName} objected to the appointment`
                  : `${adminName} cancelled the appointment`;

        await db.from('message_items').insert({
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
                notes:
                    suggestedNotes ||
                    `Counter-proposal to appointment ${appointmentId.slice(0, 8)}`,
                adminId,
                adminName,
                inReplyToAppointmentId: appointmentId,
            });
        } else {
            await touchConversationPreview(appointment.conversation_id, systemBody, now);
        }

        return NextResponse.json({
            success: true,
            appointment: serializeAppointment(updated as AppointmentRow),
            counterMessage: counter?.message || null,
            counterAppointment: counter?.appointment || null,
            viewingId,
        });
    } catch (err) {
        console.error('admin PATCH appointment:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Server error' },
            { status: 500 }
        );
    }
}
