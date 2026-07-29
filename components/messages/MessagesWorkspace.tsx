'use client';

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type KeyboardEvent,
} from 'react';
import {
    ArrowLeft,
    CalendarPlus,
    MessageSquare,
    Paperclip,
    Pin,
    Plus,
    RefreshCw,
    Search,
    Send,
    Smile,
    User,
    X,
} from 'lucide-react';
import type { AccountType } from '@/lib/auth-enterprise/config';
import { signOutClient } from '@/lib/auth-signout';
import { supabase } from '@/lib/supabase';
import AppointmentCalendarCard, {
    toDatetimeLocalValue,
} from '@/components/messages/AppointmentCalendarCard';
import AttachmentMessage from '@/components/messages/AttachmentMessage';
import MessagesWorkspaceSkeleton from '@/components/messages/MessagesWorkspaceSkeleton';
import VoiceNoteRecorder from '@/components/messages/VoiceNoteRecorder';

export type MessagesPortalRole = 'buyer' | 'seller' | 'agent' | 'originator';

type Participant = {
    id: string;
    accountType: AccountType;
    profileId: string;
    displayName: string | null;
    lastReadAt: string | null;
};

type Conversation = {
    id: string;
    subject: string | null;
    contextType: string;
    contextId: string | null;
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
    participants: Participant[];
    unreadCount: number;
};

type Message = {
    id: string;
    conversationId: string;
    kind: 'text' | 'document' | 'appointment' | 'system';
    body: string | null;
    meta: Record<string, unknown>;
    senderAccountType: AccountType | null;
    senderProfileId: string | null;
    senderName: string | null;
    createdAt: string;
};

type Props = {
    role: MessagesPortalRole;
    profileId: string;
    accountType: AccountType;
    displayName: string;
};

type EligibleContact = {
    accountType: AccountType;
    profileId: string;
    displayName: string;
    email: string;
    reason: string;
    detail?: string;
};

const PRIMARY = '#E52323';
const BG = '#F8FAFC';
const TEXT = '#111827';

const ROLE_LABEL: Record<string, string> = {
    user: 'Buyer / Seller',
    agent: 'Agent',
    originator: 'Bond originator',
    admin: 'PropReady staff',
};

const ROLE_DESCRIPTION: Record<MessagesPortalRole, string> = {
    buyer: 'Chat live with agents and bond originators, share documents, and propose appointments.',
    seller: 'Chat with agents and originators about your listing, documents, and appointments.',
    agent: 'Talk with buyers, sellers, and bond originators — share files and propose viewings.',
    originator: 'Message buyers, sellers, and agents. Share documents and schedule appointments in-thread.',
};

const EMPTY_COPY: Record<MessagesPortalRole, string> = {
    buyer: 'No contacts yet. Agents appear after they contact you (e.g. schedule a viewing). Bond originators appear after you start pre-qualification.',
    seller: 'No contacts yet. Agents appear after they contact you (e.g. schedule a viewing).',
    agent: 'No clients yet. Buyers and sellers appear here after you schedule a viewing with them.',
    originator: 'No buyers yet. They appear after they submit a pre-qualification with your organisation.',
};

const COMMON_EMOJIS = [
    '😀', '😊', '👍', '🙏', '✅', '❤️', '🎉', '🔥',
    '👋', '💬', '📅', '🏠', '📎', '⚠️', '❓', '✨',
];

function readJson<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key: string, value: unknown) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
}

function initials(name: string) {
    const source = (name || '?').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
}

function formatRelativeTime(iso: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24 && d.toDateString() === now.toDateString()) return `${diffHr}h`;
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function isToday(iso: string | null) {
    if (!iso) return false;
    const d = new Date(iso);
    return !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
}

function conversationFingerprint(list: Conversation[]) {
    return list
        .map(
            (c) =>
                `${c.id}:${c.lastMessageAt || ''}:${c.lastMessagePreview || ''}:${c.unreadCount}`
        )
        .join('|');
}

function messageFingerprint(list: Message[]) {
    return list
        .map(
            (m) =>
                `${m.id}:${m.kind}:${m.body || ''}:${m.meta?.status || ''}:${m.meta?.suggestedStartsAt || ''}`
        )
        .join('|');
}

function isSelf(p: Participant, myProfileId: string, myAccountType: AccountType) {
    return p.profileId === myProfileId && p.accountType === myAccountType;
}

function otherParticipants(c: Conversation, myProfileId: string, myAccountType: AccountType) {
    return c.participants.filter((p) => !isSelf(p, myProfileId, myAccountType));
}

function threadTitle(c: Conversation, myProfileId: string, myAccountType: AccountType) {
    const others = otherParticipants(c, myProfileId, myAccountType);
    if (others.length === 0) return c.subject || 'Conversation';
    return c.subject || others.map((p) => p.displayName || ROLE_LABEL[p.accountType]).join(', ');
}

function accountTypeLabel(type: string) {
    return ROLE_LABEL[type] || type;
}

function KpiCard({
    label,
    value,
    description,
    icon: Icon,
}: {
    label: string;
    value: number;
    description: string;
    icon: typeof MessageSquare;
}) {
    return (
        <div className="group rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                        {label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] tabular-nums">
                        {value}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
                </div>
                <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:text-white"
                    style={{ backgroundColor: `${PRIMARY}14`, color: PRIMARY }}
                >
                    <Icon className="h-5 w-5 group-hover:text-white" />
                </div>
            </div>
        </div>
    );
}

function ConversationSkeleton() {
    return (
        <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 rounded-xl p-3 animate-pulse">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-2/3 rounded bg-slate-100" />
                        <div className="h-3 w-full rounded bg-slate-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ThreadSkeleton() {
    return (
        <div className="space-y-4 p-6 animate-pulse">
            <div className="flex justify-start">
                <div className="h-16 w-[55%] rounded-2xl bg-slate-100" />
            </div>
            <div className="flex justify-end">
                <div className="h-12 w-[45%] rounded-2xl bg-slate-100" />
            </div>
            <div className="flex justify-start">
                <div className="h-20 w-[60%] rounded-2xl bg-slate-100" />
            </div>
        </div>
    );
}

function EmptyState({ icon: Icon, message }: { icon: typeof MessageSquare; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <Icon className="h-8 w-8 text-[#D1D5DB]" />
            <p className="text-sm text-[#6B7280]">{message}</p>
        </div>
    );
}

function ContactField({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                {label}
            </p>
            <p className="mt-0.5 text-sm text-[#374151]">{value}</p>
        </div>
    );
}

export default function MessagesWorkspace({ role, profileId, accountType, displayName }: Props) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [contacts, setContacts] = useState<EligibleContact[]>([]);
    const [contactsHint, setContactsHint] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState('');
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showAppt, setShowAppt] = useState(false);
    const [selectedContactKey, setSelectedContactKey] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [apptStarts, setApptStarts] = useState('');
    const [apptLocation, setApptLocation] = useState('');
    const [apptNotes, setApptNotes] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [objectingId, setObjectingId] = useState<string | null>(null);
    const [reproposingId, setReproposingId] = useState<string | null>(null);
    const [suggestStarts, setSuggestStarts] = useState('');
    const [suggestNotes, setSuggestNotes] = useState('');
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [pinnedIds, setPinnedIds] = useState<string[]>([]);
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const draftRef = useRef<HTMLTextAreaElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const messageCountRef = useRef(0);
    const shouldStickToBottomRef = useRef(true);

    const pinKey = `propReady_${role}_messages_pinned`;

    useEffect(() => {
        setPinnedIds(readJson<string[]>(pinKey, []));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pinKey]);

    useEffect(() => {
        const onPointer = (e: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', onPointer);
        return () => document.removeEventListener('mousedown', onPointer);
    }, []);

    const active = useMemo(
        () => conversations.find((c) => c.id === activeId) || null,
        [conversations, activeId]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const base = !q
            ? conversations
            : conversations.filter((c) => {
                  const title = threadTitle(c, profileId, accountType).toLowerCase();
                  return (
                      title.includes(q) ||
                      (c.subject || '').toLowerCase().includes(q) ||
                      (c.lastMessagePreview || '').toLowerCase().includes(q)
                  );
              });
        const list = [...base];
        list.sort((a, b) => {
            const aPinned = pinnedIds.includes(a.id);
            const bPinned = pinnedIds.includes(b.id);
            if (aPinned !== bPinned) return aPinned ? -1 : 1;
            const aUnread = a.unreadCount > 0;
            const bUnread = b.unreadCount > 0;
            if (aUnread !== bUnread) return aUnread ? -1 : 1;
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bTime - aTime;
        });
        return list;
    }, [conversations, search, profileId, accountType, pinnedIds]);

    const messagesTodayCount = useMemo(
        () => conversations.filter((c) => isToday(c.lastMessageAt)).length,
        [conversations]
    );

    const activeTodayCount = messagesTodayCount;

    const contactParticipant = useMemo(
        () => (active ? otherParticipants(active, profileId, accountType)[0] || null : null),
        [active, profileId, accountType]
    );

    function togglePin(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        const next = pinnedIds.includes(id)
            ? pinnedIds.filter((pid) => pid !== id)
            : [...pinnedIds, id];
        setPinnedIds(next);
        writeJson(pinKey, next);
    }

    function handleBackToList() {
        setMobileShowChat(false);
    }

    function insertEmoji(emoji: string) {
        setDraft((prev) => prev + emoji);
        setShowEmojiPicker(false);
        draftRef.current?.focus();
    }

    const authRedirecting = useRef(false);

    async function handleUnauthorized() {
        if (authRedirecting.current) return;
        authRedirecting.current = true;
        await signOutClient({ accountType });
    }

    const loadContacts = useCallback(async () => {
        try {
            const res = await fetch('/api/messages/contacts', { credentials: 'include' });
            if (res.status === 401) {
                await handleUnauthorized();
                return;
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load contacts');
            setContacts(data.contacts || []);
            setContactsHint(data.emptyHint || null);
        } catch {
            setContacts([]);
            setContactsHint(EMPTY_COPY[role]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, accountType]);

    const loadConversations = useCallback(async (opts?: { silent?: boolean }) => {
        try {
            const res = await fetch('/api/messages/conversations', { credentials: 'include' });
            if (res.status === 401) {
                await handleUnauthorized();
                return;
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load conversations');
            const next = (data.conversations || []) as Conversation[];
            setConversations((prev) =>
                conversationFingerprint(prev) === conversationFingerprint(next) ? prev : next
            );
            setUnreadTotal(
                typeof data.unreadTotal === 'number'
                    ? data.unreadTotal
                    : next.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
            );
            setError('');
        } catch (e) {
            if (!opts?.silent) {
                setError(e instanceof Error ? e.message : 'Failed to load');
            }
        } finally {
            setLoadingList(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountType]);

    const loadMessages = useCallback(async (conversationId: string, opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoadingThread(true);
        try {
            const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
                credentials: 'include',
            });
            if (res.status === 401) {
                await handleUnauthorized();
                return;
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load messages');
            const next = (data.messages || []) as Message[];
            setMessages((prev) =>
                messageFingerprint(prev) === messageFingerprint(next) ? prev : next
            );
            await fetch(`/api/messages/conversations/${conversationId}/read`, {
                method: 'POST',
                credentials: 'include',
            });
            let hadUnread = false;
            setConversations((prev) => {
                const target = prev.find((c) => c.id === conversationId);
                if (!target || target.unreadCount === 0) return prev;
                hadUnread = true;
                return prev.map((c) =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                );
            });
            if (hadUnread) {
                void loadConversations({ silent: true });
            }
        } catch (e) {
            if (!opts?.silent) {
                setError(e instanceof Error ? e.message : 'Failed to load thread');
            }
        } finally {
            if (!opts?.silent) setLoadingThread(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountType, loadConversations]);

    useEffect(() => {
        if (!profileId) return;
        void loadConversations();
        void loadContacts();
    }, [profileId, loadConversations, loadContacts]);

    useEffect(() => {
        if (!profileId) return;
        const poll = window.setInterval(() => {
            void loadConversations({ silent: true });
        }, 10000);

        return () => {
            window.clearInterval(poll);
        };
    }, [profileId, loadConversations]);

    useEffect(() => {
        messageCountRef.current = 0;
        shouldStickToBottomRef.current = true;
        setObjectingId(null);
        setReproposingId(null);
        setSuggestStarts('');
        setSuggestNotes('');
        if (!activeId) {
            setMessages([]);
            setLoadingThread(false);
            return;
        }
        void loadMessages(activeId);
        setMobileShowChat(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    useEffect(() => {
        if (messages.length > messageCountRef.current && shouldStickToBottomRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        messageCountRef.current = messages.length;
    }, [messages]);

    useEffect(() => {
        const el = draftRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [draft]);

    // Live updates via Realtime + quiet polling fallback (no loading flicker)
    useEffect(() => {
        if (!activeId) return;

        const channel = supabase
            .channel(`messages:${activeId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'message_items',
                    filter: `conversation_id=eq.${activeId}`,
                },
                (payload) => {
                    const row = payload.new as Record<string, unknown>;
                    const next: Message = {
                        id: String(row.id),
                        conversationId: String(row.conversation_id),
                        kind: row.kind as Message['kind'],
                        body: (row.body as string) || null,
                        meta: (row.meta as Record<string, unknown>) || {},
                        senderAccountType: (row.sender_account_type as AccountType) || null,
                        senderProfileId: (row.sender_profile_id as string) || null,
                        senderName: (row.sender_name as string) || null,
                        createdAt: String(row.created_at),
                    };
                    shouldStickToBottomRef.current = true;
                    setMessages((prev) =>
                        prev.some((m) => m.id === next.id) ? prev : [...prev, next]
                    );
                    void fetch(`/api/messages/conversations/${activeId}/read`, {
                        method: 'POST',
                        credentials: 'include',
                    });
                }
            )
            .subscribe();

        const poll = window.setInterval(() => {
            void loadMessages(activeId, { silent: true });
        }, 20000);

        return () => {
            void supabase.removeChannel(channel);
            window.clearInterval(poll);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    async function sendText(e?: FormEvent) {
        e?.preventDefault();
        if (!activeId || !draft.trim() || sending) return;
        setSending(true);
        setError('');
        try {
            const res = await fetch(`/api/messages/conversations/${activeId}/messages`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: draft.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Send failed');
            setDraft('');
            shouldStickToBottomRef.current = true;
            if (data.message) {
                setMessages((prev) =>
                    prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
                );
            }
            void loadConversations({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Send failed');
        } finally {
            setSending(false);
        }
    }

    async function uploadFile(file: File, opts?: { isVoiceNote?: boolean; durationMs?: number }) {
        if (!activeId) return;
        setSending(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('file', file);
            if (opts?.isVoiceNote) {
                fd.append('isVoiceNote', '1');
                if (opts.durationMs != null) fd.append('durationMs', String(opts.durationMs));
            }
            const res = await fetch(`/api/messages/conversations/${activeId}/documents`, {
                method: 'POST',
                credentials: 'include',
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            if (data.message) {
                shouldStickToBottomRef.current = true;
                setMessages((prev) =>
                    prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
                );
            }
            void loadConversations({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setSending(false);
        }
    }

    async function createConversation(e: FormEvent) {
        e.preventDefault();
        const contact = contacts.find(
            (c) => `${c.accountType}:${c.profileId}` === selectedContactKey
        );
        if (!contact) {
            setError('Choose a contact to message');
            return;
        }
        setSending(true);
        setError('');
        try {
            const res = await fetch('/api/messages/conversations', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: newSubject.trim() || null,
                    initialMessage: newMessage.trim() || undefined,
                    participants: [
                        {
                            accountType: contact.accountType,
                            profileId: contact.profileId,
                            displayName: contact.displayName,
                        },
                    ],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not start conversation');
            setShowNew(false);
            setSelectedContactKey('');
            setNewSubject('');
            setNewMessage('');
            await loadConversations({ silent: true });
            if (data.conversation?.id) setActiveId(data.conversation.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start conversation');
        } finally {
            setSending(false);
        }
    }

    async function proposeAppointment(e: FormEvent) {
        e.preventDefault();
        if (!activeId || !apptStarts) return;
        setSending(true);
        setError('');
        try {
            const res = await fetch(`/api/messages/conversations/${activeId}/appointments`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startsAt: new Date(apptStarts).toISOString(),
                    location: apptLocation.trim() || null,
                    notes: apptNotes.trim() || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not propose appointment');
            setShowAppt(false);
            setApptStarts('');
            setApptLocation('');
            setApptNotes('');
            if (data.message) {
                shouldStickToBottomRef.current = true;
                setMessages((prev) =>
                    prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
                );
            }
            void loadConversations({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not propose appointment');
        } finally {
            setSending(false);
        }
    }

    async function refreshInbox() {
        if (refreshing) return;
        setRefreshing(true);
        setError('');
        try {
            await loadConversations({ silent: true });
            if (activeId) {
                shouldStickToBottomRef.current = false;
                await loadMessages(activeId, { silent: true });
            }
            await loadContacts();
        } finally {
            setRefreshing(false);
        }
    }

    async function respondAppointment(
        appointmentId: string,
        status: 'accepted' | 'declined' | 'cancelled',
        opts?: {
            suggestedStartsAt?: string;
            suggestedNotes?: string;
            reproposeStartsAt?: string;
            reproposeNotes?: string;
        }
    ) {
        setSending(true);
        setError('');
        try {
            const res = await fetch(`/api/messages/appointments/${appointmentId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    suggestedStartsAt: opts?.suggestedStartsAt || undefined,
                    suggestedNotes: opts?.suggestedNotes || undefined,
                    reproposeStartsAt: opts?.reproposeStartsAt || undefined,
                    reproposeNotes: opts?.reproposeNotes || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not update appointment');
            setObjectingId(null);
            setReproposingId(null);
            setSuggestStarts('');
            setSuggestNotes('');
            shouldStickToBottomRef.current = true;
            if (activeId) await loadMessages(activeId, { silent: true });
            void loadConversations({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setSending(false);
        }
    }

    const selectedContact =
        contacts.find((c) => `${c.accountType}:${c.profileId}` === selectedContactKey) || null;

    const inputClass =
        'w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-base sm:text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#E52323]/40 focus:ring-2 focus:ring-[#E52323]/10';

    const cardClass =
        'rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]';

    const secondaryBtnClass =
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] disabled:opacity-50';

    const primaryBtnClass =
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition disabled:opacity-50';

    // If the profile hasn't hydrated yet, show a skeleton and skip fetching —
    // otherwise an empty profileId can wipe out the fingerprinted conversation
    // list on the next render before the real session lands.
    if (!profileId) {
        return <MessagesWorkspaceSkeleton />;
    }

    return (
        <div className="space-y-6" style={{ color: TEXT }}>
            <style>{`
                @keyframes msgFadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .msg-fade-in { animation: msgFadeIn 0.25s ease-out both; }
            `}</style>

            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">
                        Messages
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
                        {ROLE_DESCRIPTION[role]}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void refreshInbox()}
                        className={secondaryBtnClass}
                        title="Refresh messages"
                        aria-label="Refresh messages"
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setError('');
                            setShowNew(true);
                            void loadContacts();
                        }}
                        className={primaryBtnClass}
                        style={{ backgroundColor: PRIMARY }}
                        disabled={contacts.length === 0}
                        title={
                            contacts.length === 0
                                ? contactsHint || EMPTY_COPY[role]
                                : 'Start a conversation'
                        }
                    >
                        <Plus className="h-4 w-4" />
                        New Message
                    </button>
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Unread Conversations"
                    value={unreadTotal}
                    description={
                        unreadTotal === 1
                            ? '1 thread needs a reply'
                            : unreadTotal > 0
                              ? `${unreadTotal} threads need attention`
                              : 'Inbox is caught up'
                    }
                    icon={MessageSquare}
                />
                <KpiCard
                    label="Active Conversations"
                    value={conversations.length}
                    description={
                        activeTodayCount > 0
                            ? `${activeTodayCount} with activity today`
                            : 'Total inbox threads'
                    }
                    icon={User}
                />
                <KpiCard
                    label="Eligible Contacts"
                    value={contacts.length}
                    description={
                        contacts.length > 0
                            ? 'People you can message'
                            : contactsHint || EMPTY_COPY[role]
                    }
                    icon={Plus}
                />
                <KpiCard
                    label="Messages Today"
                    value={messagesTodayCount}
                    description="Conversations active today"
                    icon={Send}
                />
            </div>

            {/* New Message Modal */}
            {showNew ? (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                    <form
                        onSubmit={createConversation}
                        className={`${cardClass} w-full max-w-lg p-6 shadow-[0_24px_48px_rgba(17,24,39,0.16)]`}
                    >
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-[#111827]">
                                    Start conversation
                                </h2>
                                <p className="mt-1 text-xs text-[#6B7280]">
                                    {role === 'buyer' || role === 'seller'
                                        ? 'You can only message agents who have contacted you, and bond originators after pre-qualification.'
                                        : role === 'agent'
                                          ? 'Only buyers and sellers you have contacted via a viewing.'
                                          : 'Only buyers with a pre-qualification case at your organisation.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNew(false)}
                                className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F8FAFC]"
                                aria-label="Close new message"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {contacts.length === 0 ? (
                            <p className="text-sm text-[#6B7280]">
                                {contactsHint || EMPTY_COPY[role]}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <select
                                    required
                                    value={selectedContactKey}
                                    onChange={(e) => setSelectedContactKey(e.target.value)}
                                    className={`${inputClass} h-11`}
                                >
                                    <option value="">Select account to message…</option>
                                    {contacts.map((c) => (
                                        <option
                                            key={`${c.accountType}:${c.profileId}`}
                                            value={`${c.accountType}:${c.profileId}`}
                                        >
                                            {c.displayName} · {accountTypeLabel(c.accountType)}
                                            {c.detail ? ` · ${c.detail}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {selectedContact ? (
                                    <p className="text-xs text-[#6B7280]">
                                        Messaging{' '}
                                        <span className="font-medium text-[#111827]">
                                            {selectedContact.displayName}
                                        </span>{' '}
                                        · {accountTypeLabel(selectedContact.accountType)}
                                    </p>
                                ) : null}
                                <input
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    placeholder="Subject (optional)"
                                    className={`${inputClass} h-11`}
                                />
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="First message (optional)…"
                                    rows={3}
                                    className={`${inputClass} py-2.5`}
                                />
                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="submit"
                                        disabled={sending || !selectedContact}
                                        className={`${primaryBtnClass} flex-1`}
                                        style={{ backgroundColor: PRIMARY }}
                                    >
                                        {sending ? 'Starting…' : 'Start conversation'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(false)}
                                        className="text-sm text-[#6B7280] hover:text-[#111827]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            ) : null}

            {/* Three-column workspace */}
            <div
                className="grid min-h-[65vh] gap-4 xl:grid-cols-[320px_1fr_280px]"
                style={{ backgroundColor: BG }}
            >
                {/* Left: Conversation list */}
                <div
                    className={`${cardClass} flex flex-col overflow-hidden ${
                        mobileShowChat ? 'hidden xl:flex' : 'flex'
                    }`}
                >
                    <div className="border-b border-[#E5E7EB] p-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search conversations…"
                                className={`${inputClass} h-11 pl-10 pr-9`}
                            />
                            {search ? (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#6B7280] hover:bg-[#F8FAFC]"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[calc(65vh-80px)]">
                        {loadingList ? (
                            <ConversationSkeleton />
                        ) : filtered.length === 0 ? (
                            conversations.length === 0 ? (
                                <EmptyState
                                    icon={MessageSquare}
                                    message={
                                        contacts.length === 0
                                            ? contactsHint || EMPTY_COPY[role]
                                            : 'No conversations yet. Start one with New Message.'
                                    }
                                />
                            ) : (
                                <EmptyState icon={Search} message="No matches for your search." />
                            )
                        ) : (
                            filtered.map((c) => {
                                const title = threadTitle(c, profileId, accountType);
                                const isSelected = activeId === c.id;
                                const isPinned = pinnedIds.includes(c.id);
                                const unread = c.unreadCount || 0;
                                const isUnread = unread > 0;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setActiveId(c.id)}
                                        className={`group relative flex w-full gap-3 border-b border-[#F3F4F6] px-4 py-3.5 text-left transition hover:bg-[#F8FAFC] ${
                                            isSelected
                                                ? 'bg-[#E52323]/[0.06] ring-1 ring-inset ring-[#E52323]/20'
                                                : ''
                                        } ${isUnread && !isSelected ? 'border-l-2 border-l-[#E52323] bg-[#E52323]/[0.03]' : ''}`}
                                    >
                                        <div className="relative shrink-0">
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
                                                style={{ backgroundColor: PRIMARY }}
                                            >
                                                {initials(title)}
                                            </div>
                                            {isUnread ? (
                                                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#E52323]" />
                                            ) : null}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p
                                                    className={`truncate text-sm ${
                                                        isUnread
                                                            ? 'font-semibold text-[#111827]'
                                                            : 'font-medium text-[#374151]'
                                                    }`}
                                                >
                                                    {title}
                                                </p>
                                                <div className="flex shrink-0 items-center gap-1.5">
                                                    {isUnread ? (
                                                        <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#E52323] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                            {unread > 99 ? '99+' : unread}
                                                        </span>
                                                    ) : null}
                                                    <span className="text-[11px] text-[#9CA3AF]">
                                                        {formatRelativeTime(c.lastMessageAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p
                                                className={`mt-0.5 truncate text-xs ${
                                                    isUnread
                                                        ? 'font-medium text-[#374151]'
                                                        : 'text-[#6B7280]'
                                                }`}
                                            >
                                                {c.lastMessagePreview || 'No messages'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => togglePin(c.id, e)}
                                            title={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                                            className={`absolute right-2 top-2 rounded-lg p-1 opacity-0 transition group-hover:opacity-100 ${
                                                isPinned
                                                    ? 'opacity-100 text-[#E52323]'
                                                    : 'text-[#9CA3AF] hover:bg-white'
                                            }`}
                                        >
                                            <Pin
                                                className={`h-3.5 w-3.5 ${isPinned ? 'fill-current' : ''}`}
                                            />
                                        </button>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Center: Chat */}
                <div
                    className={`${cardClass} flex min-h-[65vh] flex-col overflow-hidden ${
                        activeId && mobileShowChat ? 'flex' : 'hidden xl:flex'
                    }`}
                >
                    {!active ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
                            <div
                                className="flex h-20 w-20 items-center justify-center rounded-2xl"
                                style={{ backgroundColor: `${PRIMARY}10` }}
                            >
                                <MessageSquare className="h-10 w-10" style={{ color: PRIMARY }} />
                            </div>
                            <div>
                                <p className="text-base font-medium text-[#111827]">
                                    Select a conversation
                                </p>
                                <p className="mt-1 max-w-xs text-sm text-[#6B7280]">
                                    Choose a thread from the inbox or start a new message to begin.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3.5">
                                <div className="flex min-w-0 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleBackToList}
                                        className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F8FAFC] xl:hidden"
                                        aria-label="Back to conversations"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                                        style={{ backgroundColor: PRIMARY }}
                                    >
                                        {initials(
                                            contactParticipant?.displayName ||
                                                threadTitle(active, profileId, accountType)
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-[#111827]">
                                            {active.subject ||
                                                threadTitle(active, profileId, accountType) ||
                                                'Conversation'}
                                        </p>
                                        <p className="truncate text-xs text-[#6B7280]">
                                            {contactParticipant
                                                ? `${contactParticipant.displayName || 'Unknown'} · ${accountTypeLabel(contactParticipant.accountType)}`
                                                : otherParticipants(active, profileId, accountType)
                                                      .map(
                                                          (p) =>
                                                              `${p.displayName || accountTypeLabel(p.accountType)} (${accountTypeLabel(p.accountType)})`
                                                      )
                                                      .join(' · ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowAppt(true)}
                                        className={`${secondaryBtnClass} !h-9 !px-3 !text-xs`}
                                        title="Propose appointment"
                                    >
                                        <CalendarPlus className="h-4 w-4" />
                                        <span className="hidden sm:inline">Schedule</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void refreshInbox()}
                                        className={`${secondaryBtnClass} !h-9 !w-9 !px-0`}
                                        title="Refresh conversation"
                                        aria-label="Refresh conversation"
                                        disabled={refreshing}
                                    >
                                        <RefreshCw
                                            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 max-h-[calc(65vh-140px)]">
                                {loadingThread ? <ThreadSkeleton /> : null}
                                {!loadingThread
                                    ? messages.map((m) => {
                                          const mine =
                                              m.senderProfileId === profileId &&
                                              m.senderAccountType === accountType;
                                          const meta = m.meta || {};

                                          if (m.kind === 'system') {
                                              return (
                                                  <div
                                                      key={m.id}
                                                      className="msg-fade-in my-4 flex justify-center"
                                                  >
                                                      <div className="flex max-w-md items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2 text-xs text-[#6B7280]">
                                                          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                                          {m.body}
                                                      </div>
                                                  </div>
                                              );
                                          }

                                          if (m.kind === 'appointment') {
                                              const appointmentId = String(
                                                  meta.appointmentId || ''
                                              );
                                              return (
                                                  <div
                                                      key={m.id}
                                                      className={`msg-fade-in mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}
                                                  >
                                                      <div className="max-w-[85%] sm:max-w-[70%]">
                                                          <AppointmentCalendarCard
                                                              meta={meta}
                                                              body={m.body}
                                                              mine={mine}
                                                              sending={sending}
                                                              objecting={
                                                                  objectingId === appointmentId
                                                              }
                                                              reproposing={
                                                                  reproposingId === appointmentId
                                                              }
                                                              suggestStarts={suggestStarts}
                                                              suggestNotes={suggestNotes}
                                                              onApprove={() =>
                                                                  void respondAppointment(
                                                                      appointmentId,
                                                                      'accepted'
                                                                  )
                                                              }
                                                              onStartObject={() => {
                                                                  setReproposingId(null);
                                                                  setObjectingId(appointmentId);
                                                                  setSuggestStarts(
                                                                      meta.startsAt
                                                                          ? toDatetimeLocalValue(
                                                                                String(meta.startsAt)
                                                                            )
                                                                          : ''
                                                                  );
                                                                  setSuggestNotes('');
                                                              }}
                                                              onCancelObject={() => {
                                                                  setObjectingId(null);
                                                                  setSuggestStarts('');
                                                                  setSuggestNotes('');
                                                              }}
                                                              onSuggestStartsChange={setSuggestStarts}
                                                              onSuggestNotesChange={setSuggestNotes}
                                                              onSubmitObject={() => {
                                                                  if (!suggestStarts) return;
                                                                  void respondAppointment(
                                                                      appointmentId,
                                                                      'declined',
                                                                      {
                                                                          suggestedStartsAt:
                                                                              new Date(
                                                                                  suggestStarts
                                                                              ).toISOString(),
                                                                          suggestedNotes:
                                                                              suggestNotes.trim() ||
                                                                              undefined,
                                                                      }
                                                                  );
                                                              }}
                                                              onRetract={() => {
                                                                  const ok = window.confirm(
                                                                      'Retract this approved appointment? It will be removed from the viewings calendar.'
                                                                  );
                                                                  if (!ok) return;
                                                                  void respondAppointment(
                                                                      appointmentId,
                                                                      'cancelled'
                                                                  );
                                                              }}
                                                              onStartRepropose={() => {
                                                                  setObjectingId(null);
                                                                  setReproposingId(appointmentId);
                                                                  setSuggestStarts(
                                                                      meta.startsAt
                                                                          ? toDatetimeLocalValue(
                                                                                String(meta.startsAt)
                                                                            )
                                                                          : ''
                                                                  );
                                                                  setSuggestNotes('');
                                                              }}
                                                              onCancelRepropose={() => {
                                                                  setReproposingId(null);
                                                                  setSuggestStarts('');
                                                                  setSuggestNotes('');
                                                              }}
                                                              onSubmitRepropose={() => {
                                                                  if (!suggestStarts) return;
                                                                  void respondAppointment(
                                                                      appointmentId,
                                                                      'cancelled',
                                                                      {
                                                                          reproposeStartsAt:
                                                                              new Date(
                                                                                  suggestStarts
                                                                              ).toISOString(),
                                                                          reproposeNotes:
                                                                              suggestNotes.trim() ||
                                                                              undefined,
                                                                      }
                                                                  );
                                                              }}
                                                          />
                                                      </div>
                                                  </div>
                                              );
                                          }

                                          return (
                                              <div
                                                  key={m.id}
                                                  className={`msg-fade-in mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}
                                              >
                                                  <div
                                                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm ${
                                                          mine
                                                              ? 'text-white shadow-[0_2px_8px_rgba(229,35,35,0.25)]'
                                                              : 'border border-[#E5E7EB] bg-slate-50 text-[#111827]'
                                                      }`}
                                                      style={
                                                          mine
                                                              ? { backgroundColor: PRIMARY }
                                                              : undefined
                                                      }
                                                  >
                                                      <p
                                                          className={`mb-1 text-[10px] font-medium ${
                                                              mine
                                                                  ? 'text-white/75'
                                                                  : 'text-[#9CA3AF]'
                                                          }`}
                                                      >
                                                          {m.senderName ||
                                                              accountTypeLabel(m.senderAccountType || '') ||
                                                              'System'}
                                                      </p>
                                                      {m.kind === 'document' ? (
                                                          <AttachmentMessage
                                                              conversationId={activeId || m.conversationId}
                                                              meta={meta}
                                                              body={m.body}
                                                              mine={mine}
                                                          />
                                                      ) : (
                                                          <p className="whitespace-pre-wrap break-words">
                                                              {m.body}
                                                          </p>
                                                      )}
                                                      <p
                                                          className={`mt-1.5 text-[10px] ${
                                                              mine ? 'text-white/65' : 'text-[#9CA3AF]'
                                                          }`}
                                                      >
                                                          {formatRelativeTime(m.createdAt)}
                                                      </p>
                                                  </div>
                                              </div>
                                          );
                                      })
                                    : null}
                                <div ref={bottomRef} />
                            </div>

                            {/* Composer */}
                            <form
                                onSubmit={sendText}
                                className="border-t border-[#E5E7EB] bg-[#FAFBFC] p-3"
                            >
                                <div className="flex flex-wrap items-end gap-2">
                                    <div ref={emojiRef} className="relative shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker((v) => !v)}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] transition hover:bg-[#F8FAFC]"
                                            aria-label="Insert emoji"
                                        >
                                            <Smile className="h-4 w-4" />
                                        </button>
                                        {showEmojiPicker ? (
                                            <div className="absolute bottom-full left-0 z-30 mb-2 grid w-[220px] grid-cols-8 gap-1 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-lg">
                                                {COMMON_EMOJIS.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => insertEmoji(emoji)}
                                                        className="rounded-lg p-1 text-lg hover:bg-[#F8FAFC]"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) void uploadFile(f);
                                            e.target.value = '';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        disabled={sending || !activeId}
                                        onClick={() => fileRef.current?.click()}
                                        title="Attach file"
                                        aria-label="Attach file"
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] transition hover:bg-[#F8FAFC] disabled:opacity-50"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </button>
                                    <VoiceNoteRecorder
                                        disabled={sending || !activeId}
                                        accentColor={PRIMARY}
                                        onRecorded={(file, durationMs) =>
                                            uploadFile(file, { isVoiceNote: true, durationMs })
                                        }
                                    />
                                    <textarea
                                        ref={draftRef}
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                void sendText();
                                            }
                                        }}
                                        placeholder={`Message as ${displayName}…`}
                                        rows={1}
                                        className={`${inputClass} min-h-[44px] max-h-40 flex-1 resize-none py-2.5`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAppt(true)}
                                        className={`${secondaryBtnClass} !h-10 !w-10 !px-0 shrink-0 hidden sm:inline-flex`}
                                        title="Propose appointment"
                                    >
                                        <CalendarPlus className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sending || !draft.trim()}
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition disabled:opacity-50"
                                        style={{ backgroundColor: PRIMARY }}
                                        aria-label="Send message"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* Right: Contact panel */}
                <div
                    className={`${cardClass} hidden flex-col overflow-hidden xl:flex ${
                        active ? '' : 'opacity-60'
                    }`}
                >
                    <div className="border-b border-[#E5E7EB] px-5 py-4">
                        <h3 className="text-sm font-semibold text-[#111827]">Contact details</h3>
                    </div>
                    {!active || !contactParticipant ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                            <User className="h-8 w-8 text-[#D1D5DB]" />
                            <p className="text-sm text-[#6B7280]">
                                Select a conversation to view contact info
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            <div className="flex flex-col items-center text-center">
                                <div
                                    className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white"
                                    style={{ backgroundColor: PRIMARY }}
                                >
                                    {initials(
                                        contactParticipant.displayName ||
                                            accountTypeLabel(contactParticipant.accountType)
                                    )}
                                </div>
                                <p className="mt-3 font-semibold text-[#111827]">
                                    {contactParticipant.displayName || 'Unknown'}
                                </p>
                                <span className="mt-1 inline-flex rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-semibold text-[#6B7280]">
                                    {accountTypeLabel(contactParticipant.accountType)}
                                </span>
                            </div>

                            <ContactField
                                label="Conversation"
                                value={active.subject || 'No subject'}
                            />
                            <ContactField
                                label="Last activity"
                                value={
                                    active.lastMessageAt
                                        ? formatRelativeTime(active.lastMessageAt)
                                        : 'No messages yet'
                                }
                            />

                            {active.participants.length > 2 ? (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                                        All participants
                                    </p>
                                    <ul className="space-y-2">
                                        {active.participants.map((p) => (
                                            <li
                                                key={`${p.accountType}:${p.profileId}`}
                                                className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-xs"
                                            >
                                                <span className="font-medium text-[#111827]">
                                                    {p.displayName || accountTypeLabel(p.accountType)}
                                                </span>
                                                <span className="text-[#6B7280]">
                                                    {' '}
                                                    · {accountTypeLabel(p.accountType)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            {/* Appointment propose modal */}
            {showAppt && activeId ? (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                    <form
                        onSubmit={proposeAppointment}
                        className={`${cardClass} w-full max-w-md p-6 shadow-[0_24px_48px_rgba(17,24,39,0.16)]`}
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-[#111827]">
                                    Propose appointment
                                </h3>
                                <p className="mt-0.5 text-xs text-[#6B7280]">
                                    Schedule a viewing or meeting with this contact.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAppt(false)}
                                className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F8FAFC]"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                                    Date & time
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={apptStarts}
                                    onChange={(e) => setApptStarts(e.target.value)}
                                    className={`${inputClass} h-11`}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                                    Location (optional)
                                </label>
                                <input
                                    value={apptLocation}
                                    onChange={(e) => setApptLocation(e.target.value)}
                                    placeholder="Property address or meeting place"
                                    className={`${inputClass} h-11`}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={apptNotes}
                                    onChange={(e) => setApptNotes(e.target.value)}
                                    rows={3}
                                    className={`${inputClass} py-2.5`}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sending || !apptStarts}
                                className={`${primaryBtnClass} w-full`}
                                style={{ backgroundColor: PRIMARY }}
                            >
                                {sending ? 'Sending…' : 'Send proposal'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}
        </div>
    );
}