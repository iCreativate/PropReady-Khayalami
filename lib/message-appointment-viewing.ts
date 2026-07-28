import {
    messagesDb,
    type AppointmentRow,
    type ConversationRow,
    type ParticipantRow,
} from '@/lib/messages';

const DEFAULT_TZ = process.env.PROPREADY_TZ || 'Africa/Johannesburg';

/** Split an ISO timestamp into local calendar date + HH:mm for viewing rows. */
export function appointmentLocalDateTime(
    startsAt: string,
    timeZone: string = DEFAULT_TZ
): { viewingDate: string; viewingTime: string } {
    const d = new Date(startsAt);
    if (Number.isNaN(d.getTime())) {
        return { viewingDate: '', viewingTime: '' };
    }

    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(d);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((p) => p.type === type)?.value || '';

    let hour = get('hour');
    if (hour === '24') hour = '00';

    const viewingDate = `${get('year')}-${get('month')}-${get('day')}`;
    const viewingTime = `${hour}:${get('minute')}`;
    return { viewingDate, viewingTime };
}

function pickAgent(participants: ParticipantRow[]) {
    return participants.find((p) => p.account_type === 'agent') || null;
}

function pickClient(participants: ParticipantRow[]) {
    return (
        participants.find((p) => p.account_type === 'user') ||
        participants.find((p) => p.account_type === 'originator') ||
        null
    );
}

/**
 * When a message appointment is approved, create/update a viewing_appointments row
 * so it shows on Viewings calendars (agent by agent_id, buyer/seller by email).
 *
 * Agent is preferred but not required — admin↔user / support threads still land
 * on the consumer calendar via contact_email.
 *
 * property_id is NOT NULL in the DB — always provide a stable placeholder when
 * the conversation has no listing context.
 */
export async function createViewingFromMessageAppointment(
    appointment: AppointmentRow,
    conversation: ConversationRow,
    participants: ParticipantRow[]
): Promise<string | null> {
    const agent = pickAgent(participants);
    const client = pickClient(participants);
    const contact =
        client ||
        participants.find((p) => p.account_type !== 'agent') ||
        null;

    if (!agent && !contact) {
        console.warn(
            'message appointment → viewing: no agent or contact participant, skipping'
        );
        return null;
    }

    const { viewingDate, viewingTime } = appointmentLocalDateTime(appointment.starts_at);
    if (!viewingDate || !viewingTime) return null;

    // Prefer UUID-safe id (appointment.id is a UUID). Fall back if missing.
    const viewingId =
        appointment.viewing_id ||
        (appointment.id ? String(appointment.id) : `viewing-msg-${crypto.randomUUID()}`);

    const propertyId = conversation.context_id || `message:${conversation.id}`;
    const propertyTitle =
        conversation.context_type === 'listing' || conversation.context_type === 'viewing'
            ? conversation.subject || 'Property viewing'
            : conversation.subject || 'Appointment from messages';

    let contactName = contact?.display_name || 'Client';
    let contactEmail = '';
    let contactPhone: string | null = null;
    let contactType: 'buyer' | 'seller' = 'buyer';

    if (contact?.account_type === 'user') {
        const { data: buyerProfile } = await messagesDb()
            .from('users')
            .select('full_name, email, phone')
            .eq('id', contact.profile_id)
            .maybeSingle();
        contactName = contact.display_name || buyerProfile?.full_name || 'Buyer';
        contactEmail = String(buyerProfile?.email || '').trim();
        contactPhone = buyerProfile?.phone || null;
        contactType = 'buyer';
    } else if (contact?.account_type === 'originator') {
        const { data: originatorProfile } = await messagesDb()
            .from('originators')
            .select('full_name, email, phone')
            .eq('id', contact.profile_id)
            .maybeSingle();
        contactName = contact.display_name || originatorProfile?.full_name || 'Originator';
        contactEmail = String(originatorProfile?.email || '').trim();
        contactPhone = originatorProfile?.phone || null;
    } else if (contact?.account_type === 'admin') {
        contactName = contact.display_name || 'PropReady';
        contactEmail = `admin+${contact.profile_id.slice(0, 12)}@propready.local`;
    } else if (contact) {
        contactName = contact.display_name || 'Client';
    }

    // contact_email is NOT NULL — never insert empty
    if (!contactEmail) {
        contactEmail = `messages+${appointment.id.slice(0, 8)}@propready.local`;
    }

    const now = new Date().toISOString();
    const row = {
        id: viewingId,
        property_id: propertyId,
        property_title: propertyTitle,
        property_address: appointment.location || null,
        property_price: null,
        agent_id: agent?.profile_id || null,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        contact_type: contactType,
        buyer_name: contactType === 'buyer' ? contactName : null,
        buyer_email: contactType === 'buyer' ? contactEmail : null,
        buyer_phone: contactType === 'buyer' ? contactPhone : null,
        viewing_date: viewingDate,
        viewing_time: viewingTime,
        status: 'scheduled',
        notes: appointment.notes || 'Approved from Messages',
        chat_messages: [],
        created_at: now,
        updated_at: now,
    };

    const { error } = await messagesDb()
        .from('viewing_appointments')
        .upsert(row, { onConflict: 'id' });

    if (error) {
        console.error('message appointment → viewing bridge:', error);
        return null;
    }
    return viewingId;
}

/** Mark the linked viewing cancelled when an appointment is retracted. */
export async function cancelViewingForAppointment(
    appointment: AppointmentRow
): Promise<void> {
    const viewingId = appointment.viewing_id || (appointment.id ? String(appointment.id) : null);
    if (!viewingId) return;

    const now = new Date().toISOString();
    const { error } = await messagesDb()
        .from('viewing_appointments')
        .update({ status: 'cancelled', updated_at: now })
        .eq('id', viewingId);

    if (error) {
        console.error('message appointment → cancel viewing:', error);
    }
}

/**
 * Create viewing rows for accepted message appointments that never got one
 * (e.g. admin↔user threads when the bridge previously required an agent).
 */
export async function backfillMissingMessageViewings(): Promise<{
    checked: number;
    created: number;
    failed: number;
}> {
    const { data: accepted, error } = await messagesDb()
        .from('message_appointments')
        .select('*')
        .eq('status', 'accepted')
        .is('viewing_id', null);

    if (error) {
        console.error('backfill message viewings:', error);
        return { checked: 0, created: 0, failed: 0 };
    }

    let created = 0;
    let failed = 0;
    const rows = (accepted || []) as AppointmentRow[];

    for (const appointment of rows) {
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

        if (!conversation) {
            failed += 1;
            continue;
        }

        const viewingId = await createViewingFromMessageAppointment(
            appointment,
            conversation as ConversationRow,
            (participants || []) as ParticipantRow[]
        );

        if (!viewingId) {
            failed += 1;
            continue;
        }

        const { error: updErr } = await messagesDb()
            .from('message_appointments')
            .update({ viewing_id: viewingId, updated_at: new Date().toISOString() })
            .eq('id', appointment.id);

        if (updErr) {
            console.error('backfill link viewing_id:', updErr);
            failed += 1;
        } else {
            created += 1;
        }
    }

    return { checked: rows.length, created, failed };
}
