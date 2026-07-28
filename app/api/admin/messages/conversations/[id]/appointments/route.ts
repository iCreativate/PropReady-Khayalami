import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin-auth';
import { adminDisplayName, adminProfileId, ensureAdminParticipant } from '@/lib/admin-messages';
import {
    messagesDb,
    serializeAppointment,
    serializeMessage,
    touchConversationPreview,
    type AppointmentRow,
    type MessageItemRow,
} from '@/lib/messages';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
    const auth = await assertAdminRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { id: conversationId } = await context.params;
        await ensureAdminParticipant(conversationId, auth.email);

        const body = await request.json();
        const startsAt = String(body.startsAt || '').trim();
        if (!startsAt || Number.isNaN(Date.parse(startsAt))) {
            return NextResponse.json({ error: 'Valid startsAt required' }, { status: 400 });
        }

        const endsAt = body.endsAt ? String(body.endsAt) : null;
        const location = body.location ? String(body.location).trim() : null;
        const notes = body.notes ? String(body.notes).trim() : null;
        const adminId = adminProfileId(auth.email);
        const adminName = adminDisplayName(auth.email);
        const now = new Date().toISOString();
        const whenLabel = new Date(startsAt).toLocaleString('en-ZA', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
        const preview = `Proposed appointment: ${whenLabel}`;
        const db = messagesDb();

        const { data: message, error: msgErr } = await db
            .from('message_items')
            .insert({
                conversation_id: conversationId,
                kind: 'appointment',
                body: preview,
                meta: { startsAt, endsAt, location, notes },
                sender_account_type: 'admin',
                sender_profile_id: adminId,
                sender_name: adminName,
                created_at: now,
            })
            .select('*')
            .single();

        if (msgErr || !message) throw msgErr || new Error('Could not create appointment message');

        const { data: appointment, error: aptErr } = await db
            .from('message_appointments')
            .insert({
                conversation_id: conversationId,
                message_id: message.id,
                proposed_by_account_type: 'admin',
                proposed_by_profile_id: adminId,
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

        const meta = {
            appointmentId: appointment.id,
            startsAt,
            endsAt,
            location,
            notes,
            status: 'proposed',
        };

        await db.from('message_items').update({ meta }).eq('id', message.id);
        await touchConversationPreview(conversationId, preview, now);

        return NextResponse.json({
            success: true,
            message: serializeMessage({
                ...(message as MessageItemRow),
                meta,
            }),
            appointment: serializeAppointment(appointment as AppointmentRow),
        });
    } catch (err) {
        console.error('admin POST appointments:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Server error' },
            { status: 500 }
        );
    }
}
