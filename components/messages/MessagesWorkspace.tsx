'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    CalendarPlus,
    FileText,
    Loader2,
    MessageSquare,
    Paperclip,
    Plus,
    Search,
    Send,
    X,
} from 'lucide-react';
import type { AccountType } from '@/lib/auth-enterprise/config';
import { supabase } from '@/lib/supabase';
import {
    PORTAL_PRIMARY_BTN,
    PORTAL_SECONDARY_BTN,
    PORTAL_TEXT_SECONDARY,
} from '@/lib/portal-ui';

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

const ROLE_LABEL: Record<string, string> = {
    user: 'Buyer / Seller',
    agent: 'Agent',
    originator: 'Bond originator',
    admin: 'PropReady staff',
};

const EMPTY_COPY: Record<MessagesPortalRole, string> = {
    buyer: 'No contacts yet. Agents appear after they contact you (e.g. schedule a viewing). Bond originators appear after you start pre-qualification.',
    seller: 'No contacts yet. Agents appear after they contact you (e.g. schedule a viewing).',
    agent: 'No clients yet. Buyers and sellers appear here after you schedule a viewing with them.',
    originator: 'No buyers yet. They appear after they submit a pre-qualification with your organisation.',
};

function formatTime(iso: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function counterpartLabel(c: Conversation, myProfileId: string) {
    const others = c.participants.filter((p) => p.profileId !== myProfileId);
    if (others.length === 0) return c.subject || 'Conversation';
    return others.map((p) => p.displayName || ROLE_LABEL[p.accountType]).join(', ');
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
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const active = useMemo(
        () => conversations.find((c) => c.id === activeId) || null,
        [conversations, activeId]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter((c) => {
            const title = counterpartLabel(c, profileId).toLowerCase();
            return (
                title.includes(q) ||
                (c.subject || '').toLowerCase().includes(q) ||
                (c.lastMessagePreview || '').toLowerCase().includes(q)
            );
        });
    }, [conversations, search, profileId]);

    const loadContacts = useCallback(async () => {
        try {
            const res = await fetch('/api/messages/contacts', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load contacts');
            setContacts(data.contacts || []);
            setContactsHint(data.emptyHint || null);
        } catch {
            setContacts([]);
            setContactsHint(EMPTY_COPY[role]);
        }
    }, [role]);

    const loadConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/messages/conversations', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load conversations');
            setConversations(data.conversations || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoadingList(false);
        }
    }, []);

    const loadMessages = useCallback(async (conversationId: string) => {
        setLoadingThread(true);
        try {
            const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load messages');
            setMessages(data.messages || []);
            await fetch(`/api/messages/conversations/${conversationId}/read`, {
                method: 'POST',
                credentials: 'include',
            });
            setConversations((prev) =>
                prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load thread');
        } finally {
            setLoadingThread(false);
        }
    }, []);

    useEffect(() => {
        void loadConversations();
        void loadContacts();
    }, [loadConversations, loadContacts]);

    useEffect(() => {
        if (!activeId) {
            setMessages([]);
            return;
        }
        void loadMessages(activeId);
    }, [activeId, loadMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Live updates via Realtime + polling fallback
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
            void loadMessages(activeId);
            void loadConversations();
        }, 15000);

        return () => {
            void supabase.removeChannel(channel);
            window.clearInterval(poll);
        };
    }, [activeId, loadMessages, loadConversations]);

    async function sendText(e?: React.FormEvent) {
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
            if (data.message) {
                setMessages((prev) =>
                    prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
                );
            }
            void loadConversations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Send failed');
        } finally {
            setSending(false);
        }
    }

    async function uploadFile(file: File) {
        if (!activeId) return;
        setSending(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch(`/api/messages/conversations/${activeId}/documents`, {
                method: 'POST',
                credentials: 'include',
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            if (data.message) {
                setMessages((prev) =>
                    prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
                );
            }
            void loadConversations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setSending(false);
        }
    }

    async function createConversation(e: React.FormEvent) {
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
            await loadConversations();
            if (data.conversation?.id) setActiveId(data.conversation.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start conversation');
        } finally {
            setSending(false);
        }
    }

    async function proposeAppointment(e: React.FormEvent) {
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
                setMessages((prev) =>
                    prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
                );
            }
            void loadConversations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not propose appointment');
        } finally {
            setSending(false);
        }
    }

    async function respondAppointment(appointmentId: string, status: 'accepted' | 'declined') {
        setSending(true);
        setError('');
        try {
            const res = await fetch(`/api/messages/appointments/${appointmentId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not update appointment');
            if (activeId) await loadMessages(activeId);
            void loadConversations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setSending(false);
        }
    }

    async function openDocument(docId: string) {
        if (!activeId) return;
        const res = await fetch(
            `/api/messages/conversations/${activeId}/documents/${docId}/url`,
            { credentials: 'include' }
        );
        const data = await res.json();
        if (res.ok && data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
        else setError(data.error || 'Could not open file');
    }

    return (
        <div className="rounded-3xl border border-charcoal/[0.08] bg-white shadow-[0_2px_16px_rgba(44,44,44,0.04)] overflow-hidden h-[min(70vh,720px)] flex">
            {/* Conversation list */}
            <aside className="w-full max-w-[320px] border-r border-charcoal/[0.08] flex flex-col shrink-0 bg-[#fafafa]/60">
                <div className="p-4 border-b border-charcoal/[0.07] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-base font-semibold text-charcoal tracking-tight">Messages</h2>
                        <button
                            type="button"
                            onClick={() => {
                                setError('');
                                setShowNew(true);
                                void loadContacts();
                            }}
                            className={`${PORTAL_PRIMARY_BTN} !h-9 !px-3 !text-xs`}
                            disabled={contacts.length === 0}
                            title={
                                contacts.length === 0
                                    ? contactsHint || EMPTY_COPY[role]
                                    : 'Start a conversation'
                            }
                        >
                            <Plus className="w-4 h-4" />
                            New
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search…"
                            className="w-full h-10 pl-9 pr-3 rounded-xl border border-charcoal/[0.1] bg-white text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-gold/30"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingList ? (
                        <div className="flex items-center justify-center py-16 text-charcoal/45">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <MessageSquare className="w-8 h-8 text-charcoal/25 mx-auto mb-3" />
                            <p className={`text-sm ${PORTAL_TEXT_SECONDARY}`}>
                                {conversations.length === 0
                                    ? contacts.length === 0
                                        ? contactsHint || EMPTY_COPY[role]
                                        : 'No conversations yet. Start one with a contact from New.'
                                    : 'No matches for your search.'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((c) => {
                            const selected = c.id === activeId;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setActiveId(c.id)}
                                    className={`w-full text-left px-4 py-3.5 border-b border-charcoal/[0.05] transition ${
                                        selected ? 'bg-gold/[0.07]' : 'hover:bg-charcoal/[0.03]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-0.5">
                                        <p className="text-sm font-semibold text-charcoal truncate">
                                            {counterpartLabel(c, profileId)}
                                        </p>
                                        <span className="text-[11px] text-charcoal/40 shrink-0">
                                            {formatTime(c.lastMessageAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-charcoal/50 truncate">
                                            {c.lastMessagePreview || c.subject || 'No messages yet'}
                                        </p>
                                        {c.unreadCount > 0 ? (
                                            <span className="min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-gold text-white text-[10px] font-bold flex items-center justify-center">
                                                {c.unreadCount > 9 ? '9+' : c.unreadCount}
                                            </span>
                                        ) : null}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* Thread */}
            <section className="flex-1 flex flex-col min-w-0 bg-white">
                {!active ? (
                    <div className="flex-1 flex items-center justify-center px-6 text-center">
                        <div>
                            <MessageSquare className="w-10 h-10 text-charcoal/20 mx-auto mb-3" />
                            <p className="text-sm text-charcoal/50">Select a conversation or start a new one</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <header className="px-5 py-3.5 border-b border-charcoal/[0.07] flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-charcoal truncate">
                                    {counterpartLabel(active, profileId)}
                                </p>
                                <p className="text-xs text-charcoal/45 truncate">
                                    {active.subject ||
                                        active.participants
                                            .map((p) => ROLE_LABEL[p.accountType])
                                            .join(' · ')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAppt(true)}
                                className={`${PORTAL_SECONDARY_BTN} !h-9 !px-3 !text-xs`}
                            >
                                <CalendarPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Propose appointment</span>
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 bg-[#fafafa]/40">
                            {loadingThread ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-5 h-5 animate-spin text-charcoal/40" />
                                </div>
                            ) : (
                                messages.map((m) => {
                                    const mine =
                                        m.senderProfileId === profileId &&
                                        m.senderAccountType === accountType;
                                    if (m.kind === 'system') {
                                        return (
                                            <p
                                                key={m.id}
                                                className="text-center text-xs text-charcoal/45 py-1"
                                            >
                                                {m.body}
                                            </p>
                                        );
                                    }
                                    return (
                                        <div
                                            key={m.id}
                                            className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                                                    mine
                                                        ? 'bg-gold text-white rounded-br-md'
                                                        : 'bg-white border border-charcoal/[0.08] text-charcoal rounded-bl-md'
                                                }`}
                                            >
                                                {!mine && m.senderName ? (
                                                    <p
                                                        className={`text-[11px] font-semibold mb-1 ${
                                                            mine ? 'text-white/80' : 'text-charcoal/45'
                                                        }`}
                                                    >
                                                        {m.senderName}
                                                    </p>
                                                ) : null}
                                                {m.kind === 'document' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const docId = String(m.meta.documentId || '');
                                                            if (docId) void openDocument(docId);
                                                        }}
                                                        className={`inline-flex items-center gap-2 text-sm font-medium ${
                                                            mine ? 'text-white underline' : 'text-gold'
                                                        }`}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        {String(m.meta.fileName || m.body || 'Attachment')}
                                                    </button>
                                                ) : m.kind === 'appointment' ? (
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium">{m.body}</p>
                                                        {m.meta.startsAt ? (
                                                            <p
                                                                className={`text-xs ${
                                                                    mine ? 'text-white/80' : 'text-charcoal/55'
                                                                }`}
                                                            >
                                                                {new Date(
                                                                    String(m.meta.startsAt)
                                                                ).toLocaleString('en-ZA')}
                                                                {m.meta.location
                                                                    ? ` · ${String(m.meta.location)}`
                                                                    : ''}
                                                            </p>
                                                        ) : null}
                                                        {m.meta.status === 'proposed' &&
                                                        m.meta.appointmentId &&
                                                        !mine ? (
                                                            <div className="flex gap-2 pt-1">
                                                                <button
                                                                    type="button"
                                                                    disabled={sending}
                                                                    onClick={() =>
                                                                        void respondAppointment(
                                                                            String(m.meta.appointmentId),
                                                                            'accepted'
                                                                        )
                                                                    }
                                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={sending}
                                                                    onClick={() =>
                                                                        void respondAppointment(
                                                                            String(m.meta.appointmentId),
                                                                            'declined'
                                                                        )
                                                                    }
                                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-charcoal/10 text-charcoal"
                                                                >
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        ) : m.meta.status && m.meta.status !== 'proposed' ? (
                                                            <p
                                                                className={`text-xs capitalize ${
                                                                    mine ? 'text-white/75' : 'text-charcoal/50'
                                                                }`}
                                                            >
                                                                {String(m.meta.status)}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm whitespace-pre-wrap break-words">
                                                        {m.body}
                                                    </p>
                                                )}
                                                <p
                                                    className={`text-[10px] mt-1.5 ${
                                                        mine ? 'text-white/65' : 'text-charcoal/35'
                                                    }`}
                                                >
                                                    {formatTime(m.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {error ? (
                            <p className="px-5 py-2 text-xs text-red-600 border-t border-red-100 bg-red-50">
                                {error}
                            </p>
                        ) : null}

                        <form
                            onSubmit={sendText}
                            className="p-3 sm:p-4 border-t border-charcoal/[0.07] flex items-end gap-2"
                        >
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
                                onClick={() => fileRef.current?.click()}
                                className="w-10 h-10 rounded-xl border border-charcoal/[0.1] text-charcoal/55 hover:bg-charcoal/[0.04] inline-flex items-center justify-center shrink-0"
                                aria-label="Attach file"
                                disabled={sending}
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                rows={1}
                                placeholder={`Message as ${displayName}…`}
                                className="flex-1 min-h-[2.5rem] max-h-28 resize-y rounded-xl border border-charcoal/[0.1] px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/30"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        void sendText();
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={sending || !draft.trim()}
                                className={`${PORTAL_PRIMARY_BTN} !h-10 !w-10 !px-0 shrink-0`}
                                aria-label="Send"
                            >
                                {sending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </form>
                    </>
                )}
            </section>

            {/* New conversation modal — eligible contacts only */}
            {showNew ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={createConversation}
                        className="w-full max-w-md rounded-3xl bg-white border border-charcoal/[0.08] shadow-xl p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-charcoal">New conversation</h3>
                            <button type="button" onClick={() => setShowNew(false)} aria-label="Close">
                                <X className="w-5 h-5 text-charcoal/45" />
                            </button>
                        </div>
                        {contacts.length === 0 ? (
                            <p className={`text-sm ${PORTAL_TEXT_SECONDARY}`}>
                                {contactsHint || EMPTY_COPY[role]}
                            </p>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/45 mb-1.5">
                                        Contact
                                    </label>
                                    <select
                                        required
                                        value={selectedContactKey}
                                        onChange={(e) => setSelectedContactKey(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                                    >
                                        <option value="">Select…</option>
                                        {contacts.map((c) => (
                                            <option
                                                key={`${c.accountType}:${c.profileId}`}
                                                value={`${c.accountType}:${c.profileId}`}
                                            >
                                                {c.displayName} · {ROLE_LABEL[c.accountType]}
                                                {c.detail ? ` · ${c.detail}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-[11px] text-charcoal/45 leading-relaxed">
                                        {role === 'buyer' || role === 'seller'
                                            ? 'You can only message agents who have contacted you, and bond originators after pre-qualification.'
                                            : role === 'agent'
                                              ? 'Only buyers and sellers you have contacted via a viewing.'
                                              : 'Only buyers with a pre-qualification case at your organisation.'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/45 mb-1.5">
                                        Subject (optional)
                                    </label>
                                    <input
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/45 mb-1.5">
                                        First message (optional)
                                    </label>
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-charcoal/[0.1] px-3 py-2 text-sm"
                                    />
                                </div>
                                {error ? <p className="text-xs text-red-600">{error}</p> : null}
                                <button
                                    type="submit"
                                    disabled={sending || !selectedContactKey}
                                    className={`${PORTAL_PRIMARY_BTN} w-full`}
                                >
                                    {sending ? 'Starting…' : 'Start conversation'}
                                </button>
                            </>
                        )}
                    </form>
                </div>
            ) : null}

            {/* Appointment modal */}
            {showAppt ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={proposeAppointment}
                        className="w-full max-w-md rounded-3xl bg-white border border-charcoal/[0.08] shadow-xl p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-charcoal">Propose appointment</h3>
                            <button type="button" onClick={() => setShowAppt(false)} aria-label="Close">
                                <X className="w-5 h-5 text-charcoal/45" />
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/45 mb-1.5">
                                Date & time
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={apptStarts}
                                onChange={(e) => setApptStarts(e.target.value)}
                                className="w-full h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/45 mb-1.5">
                                Location
                            </label>
                            <input
                                value={apptLocation}
                                onChange={(e) => setApptLocation(e.target.value)}
                                className="w-full h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                                placeholder="Property address or meeting place"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/45 mb-1.5">
                                Notes
                            </label>
                            <textarea
                                value={apptNotes}
                                onChange={(e) => setApptNotes(e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-charcoal/[0.1] px-3 py-2 text-sm"
                            />
                        </div>
                        <button type="submit" disabled={sending} className={`${PORTAL_PRIMARY_BTN} w-full`}>
                            {sending ? 'Sending…' : 'Send proposal'}
                        </button>
                    </form>
                </div>
            ) : null}
        </div>
    );
}
