import { mapAgentRecord, filterPublicAgents } from '@/lib/map-agent';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import {
    matchViewingForUser,
    readLocalViewingsForUser,
    type ViewingUserRef,
} from '@/lib/buyer-viewings';

export type WorkingAgent = {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    location: string;
    ppraNumber?: string;
    ffcNumber?: string;
    verificationStatus?: string;
    verified: boolean;
    source: 'appointment' | 'selected';
    latestAppointment?: {
        id: string;
        propertyTitle: string;
        propertyAddress: string;
        date: string;
        time: string;
        status: string;
    };
};

function readLocalAgents() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.agents) || '[]') as Record<
            string,
            unknown
        >[];
        const mapped = raw.map(mapAgentRecord);
        return filterPublicAgents(mapped as Parameters<typeof filterPublicAgents>[0]);
    } catch {
        return [];
    }
}

function findAgentById(agentId: string) {
    const agents = readLocalAgents();
    return agents.find((a) => a.id === agentId) ?? null;
}

function toWorkingAgent(
    mapped: {
        id?: string;
        fullName?: string;
        company?: string;
        email?: string;
        phone?: string;
        city?: string;
        ppraNumber?: string;
        eaabNumber?: string;
        ffcNumber?: string;
        verificationStatus?: string;
        verified?: boolean;
    },
    source: WorkingAgent['source'],
    latestAppointment?: WorkingAgent['latestAppointment']
): WorkingAgent {
    return {
        id: String(mapped.id || ''),
        name: mapped.fullName || 'Agent',
        company: mapped.company || 'Agency',
        email: mapped.email || '',
        phone: mapped.phone || '',
        location: mapped.city || 'South Africa',
        ppraNumber: mapped.ppraNumber || mapped.eaabNumber,
        ffcNumber: mapped.ffcNumber,
        verificationStatus: mapped.verificationStatus,
        verified: Boolean(mapped.verified),
        source,
        latestAppointment,
    };
}

/** Prefer the agent who booked the most recent active viewing for this user. */
export function resolveWorkingAgentFromAppointments(
    user: ViewingUserRef,
    viewings?: Record<string, unknown>[]
): WorkingAgent | null {
    const list = viewings ?? readLocalViewingsForUser(user, { includeSeller: true });
    const relevant = list
        .filter((v) => matchViewingForUser(v, user, { includeSeller: true }))
        .filter((v) => {
            const status = String(v.status || '').toLowerCase();
            return status !== 'cancelled';
        })
        .filter((v) => v.agentId || v.agent_id)
        .sort((a, b) => {
            const da = `${a.date || a.viewing_date || ''} ${a.time || a.viewing_time || ''}`;
            const db = `${b.date || b.viewing_date || ''} ${b.time || b.viewing_time || ''}`;
            return db.localeCompare(da);
        });

    const latest = relevant[0];
    if (!latest) return null;

    const agentId = String(latest.agentId ?? latest.agent_id ?? '');
    if (!agentId) return null;

    const mapped = findAgentById(agentId);
    const appointment = {
        id: String(latest.id),
        propertyTitle: String(latest.propertyTitle ?? latest.property_title ?? 'Property viewing'),
        propertyAddress: String(latest.propertyAddress ?? latest.property_address ?? ''),
        date: String(latest.date ?? latest.viewing_date ?? ''),
        time: String(latest.time ?? latest.viewing_time ?? ''),
        status: String(latest.status ?? 'scheduled'),
    };

    if (mapped) {
        return toWorkingAgent(mapped as Parameters<typeof toWorkingAgent>[0], 'appointment', appointment);
    }

    // Appointment exists but agent profile not in local cache — still show a stub card
    return {
        id: agentId,
        name: 'Your PropReady agent',
        company: 'PropReady network',
        email: '',
        phone: '',
        location: 'South Africa',
        verified: false,
        source: 'appointment',
        latestAppointment: appointment,
    };
}

export function resolveSelectedWorkingAgent(userId?: string): WorkingAgent | null {
    if (typeof window === 'undefined' || !userId) return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.selectedAgent(userId));
        if (!raw) return null;
        const selected = JSON.parse(raw) as Record<string, unknown>;
        const id = String(selected.id || '');
        if (!id) return null;

        const mapped = findAgentById(id);
        if (mapped) return toWorkingAgent(mapped as Parameters<typeof toWorkingAgent>[0], 'selected');

        return {
            id,
            name: String(selected.name || selected.fullName || 'Selected agent'),
            company: String(selected.company || 'Agency'),
            email: String(selected.email || ''),
            phone: String(selected.phone || ''),
            location: String(selected.location || 'South Africa'),
            ppraNumber: selected.ppraNumber ? String(selected.ppraNumber) : undefined,
            verified: Boolean(selected.verified),
            source: 'selected',
        };
    } catch {
        return null;
    }
}

export function resolveWorkingAgent(
    user: ViewingUserRef,
    viewings?: Record<string, unknown>[]
): WorkingAgent | null {
    return (
        resolveWorkingAgentFromAppointments(user, viewings) ||
        resolveSelectedWorkingAgent(user.id)
    );
}
