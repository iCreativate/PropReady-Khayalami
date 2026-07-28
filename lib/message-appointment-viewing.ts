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

    const viewingDate = `${get('year')}-${get('month')}-${get('day')}`;
    const viewingTime = `${get('hour')}:${get('minute')}`;
    return { viewingDate, viewingTime };
}

/**
 * When a message appointment is approved and the thread has an agent + user,
 * create/update a viewing_appointments row so it shows on Viewings calendars.
 */
export async function createViewingFromMessageAppointment(
    appointment: AppointmentRow,
    conversation: ConversationRow,
    participants: ParticipantRow[]
): Promise<string | null> {
    const agent = participants.find((p) => p.account_type === 'agent');
    const buyer = participants.find((p) => p.account_type === 'user');
    if (!agent || !buyer) return null;

    const { viewingDate, viewingTime } = appointmentLocalDateTime(appointment.starts_at);
    if (!viewingDate || !viewingTime) return null;

    // Stable id so re-approving updates the same calendar entry
    const viewingId = `viewing-msg-${appointment.id}`;

    const propertyTitle =
        conversation.context_type === 'listing' || conversation.context_type === 'viewing'
            ? conversation.subject || 'Property viewing'
            : conversation.subject || 'Appointment from messages';

    const { data: buyerProfile } = await messagesDb()
        .from('users')
        .select('full_name, email, phone')
        .eq('id', buyer.profile_id)
        .maybeSingle();

    const now = new Date().toISOString();
    const row = {
        id: viewingId,
        property_id: conversation.context_id || null,
        property_title: propertyTitle,
        property_address: appointment.location || null,
        property_price: null,
        agent_id: agent.profile_id,
        contact_name: buyer.display_name || buyerProfile?.full_name || 'Buyer',
        contact_email: buyerProfile?.email || '',
        contact_phone: buyerProfile?.phone || null,
        contact_type: 'buyer',
        buyer_name: buyer.display_name || buyerProfile?.full_name || null,
        buyer_email: buyerProfile?.email || null,
        buyer_phone: buyerProfile?.phone || null,
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
