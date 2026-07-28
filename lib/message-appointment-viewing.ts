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
 * When a message appointment is approved and the thread has an agent,
 * create/update a viewing_appointments row so it shows on Viewings calendars.
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
    if (!agent) {
        console.warn('message appointment → viewing: no agent participant, skipping');
        return null;
    }

    const { viewingDate, viewingTime } = appointmentLocalDateTime(appointment.starts_at);
    if (!viewingDate || !viewingTime) return null;

    // Prefer UUID-safe id (appointment.id is a UUID). Fall back if missing.
    const viewingId =
        appointment.viewing_id ||
        (appointment.id ? String(appointment.id) : `viewing-msg-${crypto.randomUUID()}`);

    const propertyId =
        conversation.context_id ||
        `message:${conversation.id}`;
    const propertyTitle =
        conversation.context_type === 'listing' || conversation.context_type === 'viewing'
            ? conversation.subject || 'Property viewing'
            : conversation.subject || 'Appointment from messages';

    let contactName = client?.display_name || 'Client';
    let contactEmail = '';
    let contactPhone: string | null = null;
    let contactType: 'buyer' | 'seller' = 'buyer';

    if (client?.account_type === 'user') {
        const { data: buyerProfile } = await messagesDb()
            .from('users')
            .select('full_name, email, phone')
            .eq('id', client.profile_id)
            .maybeSingle();
        contactName = client.display_name || buyerProfile?.full_name || 'Buyer';
        contactEmail = String(buyerProfile?.email || '').trim();
        contactPhone = buyerProfile?.phone || null;
        contactType = 'buyer';
    } else if (client?.account_type === 'originator') {
        const { data: originatorProfile } = await messagesDb()
            .from('originators')
            .select('full_name, email, phone')
            .eq('id', client.profile_id)
            .maybeSingle();
        contactName = client.display_name || originatorProfile?.full_name || 'Originator';
        contactEmail = String(originatorProfile?.email || '').trim();
        contactPhone = originatorProfile?.phone || null;
    } else if (client) {
        contactName = client.display_name || 'Client';
    }

    // contact_email is NOT NULL — never insert empty if we can avoid it
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
        agent_id: agent.profile_id,
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
