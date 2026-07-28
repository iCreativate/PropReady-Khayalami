'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Calendar,
    CalendarPlus,
    Check,
    FileText,
    Loader2,
    MessageSquare,
    Paperclip,
    Plus,
    RefreshCw,
    Search,
    Send,
    X,
} from 'lucide-react';
import type { AccountType } from '@/lib/auth-enterprise/config';
import { signOutClient } from '@/lib/auth-signout';
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

function isImageMime(mime: string) {
    return mime.startsWith('image/');
}

function toDatetimeLocalValue(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AppointmentCalendarCard({
    meta,
    body,
    mine,
    sending,
    objecting,
    suggestStarts,
    suggestNotes,
    onApprove,
    onStartObject,
    onCancelObject,
    onSuggestStartsChange,
    onSuggestNotesChange,
    onSubmitObject,
}: {
    meta: Record<string, unknown>;
    body: string | null;
    mine: boolean;
    sending: boolean;
    objecting: boolean;
    suggestStarts: string;
    suggestNotes: string;
    onApprove: () => void;
    onStartObject: () => void;
    onCancelObject: () => void;
    onSuggestStartsChange: (value: string) => void;
    onSuggestNotesChange: (value: string) => void;
    onSubmitObject: () => void;
}) {
    const startsAt = meta.startsAt ? String(meta.startsAt) : '';
    const starts = startsAt ? new Date(startsAt) : null;
    const validStarts = starts && !Number.isNaN(starts.getTime()) ? starts : null;
    const status = String(meta.status || 'proposed');
    const location = meta.location ? String(meta.location) : '';
    const notes = meta.notes ? String(meta.notes) : '';
    const month = validStarts
        ? validStarts.toLocaleString('en-ZA', { month: 'short' }).toUpperCase()
        : '—';
    const day = validStarts ? String(validStarts.getDate()) : '–';
    const weekday = validStarts
        ? validStarts.toLocaleString('en-ZA', { weekday: 'long' })
        : 'Appointment';
    const timeLabel = validStarts
        ? validStarts.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
        : '';
    const dateLabel = validStarts
        ? validStarts.toLocaleDateString('en-ZA', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : body || 'Proposed appointment';

    const statusLabel =
        status === 'accepted'
            ? 'Approved'
            : status === 'declined'
              ? meta.suggestedStartsAt
                  ? 'Objected · new time suggested'
                  : 'Objected'
              : status === 'cancelled'
                ? 'Cancelled'
                : 'Awaiting response';

    const statusTone =
        status === 'accepted'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : status === 'declined'
              ? 'bg-red-50 text-red-700 border-red-200'
              : status === 'cancelled'
                ? 'bg-charcoal/5 text-charcoal/55 border-charcoal/10'
                : 'bg-amber-50 text-amber-800 border-amber-200';

    const canRespond = status === 'proposed' && !mine;

    return (
        <div className="w-full max-w-sm rounded-2xl border border-charcoal/[0.1] bg-white shadow-[0_2px_14px_rgba(44,44,44,0.06)] overflow-hidden">
            <div className="flex">
                <div className="w-[4.5rem] shrink-0 bg-gold text-white flex flex-col items-center justify-center py-4 px-2">
                    <Calendar className="w-4 h-4 mb-1 opacity-90" />
                    <p className="text-[10px] font-semibold tracking-[0.14em]">{month}</p>
                    <p className="text-2xl font-bold leading-none mt-0.5">{day}</p>
                </div>
                <div className="flex-1 min-w-0 p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-charcoal truncate">{weekday}</p>
                            <p className="text-xs text-charcoal/55 mt-0.5">{dateLabel}</p>
                            {timeLabel ? (
                                <p className="text-sm font-medium text-charcoal mt-1">{timeLabel}</p>
                            ) : null}
                        </div>
                        <span
                            className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusTone}`}
                        >
                            {statusLabel}
                        </span>
                    </div>
                    {location ? (
                        <p className="text-xs text-charcoal/55 truncate">Location: {location}</p>
                    ) : null}
                    {notes ? (
                        <p className="text-xs text-charcoal/50 line-clamp-2">{notes}</p>
                    ) : null}

                    {canRespond && !objecting ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                type="button"
                                disabled={sending}
                                onClick={onApprove}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                            </button>
                            <button
                                type="button"
                                disabled={sending}
                                onClick={onStartObject}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-charcoal/15 text-charcoal hover:bg-charcoal/[0.04] disabled:opacity-60"
                            >
                                <X className="w-3.5 h-3.5" />
                                Object
                            </button>
                        </div>
                    ) : null}

                    {canRespond && objecting ? (
                        <div className="pt-2 space-y-2 border-t border-charcoal/[0.08]">
                            <p className="text-xs font-medium text-charcoal">
                                Suggest a new date & time
                            </p>
                            <input
                                type="datetime-local"
                                required
                                value={suggestStarts}
                                onChange={(e) => onSuggestStartsChange(e.target.value)}
                                className="w-full h-10 rounded-xl border border-charcoal/[0.12] px-3 text-sm text-charcoal"
                            />
                            <textarea
                                value={suggestNotes}
                                onChange={(e) => onSuggestNotesChange(e.target.value)}
                                rows={2}
                                placeholder="Optional note for your suggestion"
                                className="w-full rounded-xl border border-charcoal/[0.12] px-3 py-2 text-sm text-charcoal"
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={sending || !suggestStarts}
                                    onClick={onSubmitObject}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white disabled:opacity-60"
                                >
                                    Send suggestion
                                </button>
                                <button
                                    type="button"
                                    disabled={sending}
                                    onClick={onCancelObject}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal/60 hover:bg-charcoal/[0.04]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {mine && status === 'proposed' ? (
                        <p className="text-[11px] text-charcoal/45 pt-0.5">
                            Waiting for the other party to approve or object
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function AttachmentMessage({
    conversationId,
    meta,
    body,
    mine,
    onOpen,
}: {
    conversationId: string;
    meta: Record<string, unknown>;
    body: string | null;
    mine: boolean;
    onOpen: (docId: string) => void;
}) {
    const docId = String(meta.documentId || '');
    const fileName = String(meta.fileName || body || 'Attachment');
    const mime = String(meta.mimeType || '');
    const showImage = isImageMime(mime) && Boolean(docId);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFailed, setPreviewFailed] = useState(false);

    useEffect(() => {
        if (!showImage) return;
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch(
                    `/api/messages/conversations/${conversationId}/documents/${docId}/url`,
                    { credentials: 'include' }
                );
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (res.ok && data.url) setPreviewUrl(String(data.url));
                else setPreviewFailed(true);
            } catch {
                if (!cancelled) setPreviewFailed(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [showImage, conversationId, docId]);

    return (
        <div className="space-y-2">
            {showImage && previewUrl ? (
                <button
                    type="button"
                    onClick={() => {
                        if (docId) onOpen(docId);
                    }}
                    className="block overflow-hidden rounded-xl max-w-full"
                >
                    {/* Signed storage URL — opened in-thread as a preview */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewUrl}
                        alt={fileName}
                        className="max-w-full max-h-64 object-contain bg-black/5"
                    />
                </button>
            ) : null}
            <button
                type="button"
                onClick={() => {
                    if (docId) onOpen(docId);
                }}
                className={`inline-flex items-center gap-2 text-sm font-medium ${
                    mine ? 'text-white underline' : 'text-gold'
                }`}
            >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[14rem]">
                    {fileName}
                    {showImage && !previewUrl && !previewFailed ? ' · loading…' : ''}
                </span>
            </button>
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
    const [suggestStarts, setSuggestStarts] = useState('');
    const [suggestNotes, setSuggestNotes] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const messageCountRef = useRef(0);
    const shouldStickToBottomRef = useRef(true);

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
            setError('');
        } catch (e) {
            if (!opts?.silent) {
                setError(e instanceof Error ? e.message : 'Failed to load');
            }
        } finally {
            setLoadingList(false);
        }
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
            setConversations((prev) => {
                const target = prev.find((c) => c.id === conversationId);
                if (!target || target.unreadCount === 0) return prev;
                return prev.map((c) =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                );
            });
        } catch (e) {
            if (!opts?.silent) {
                setError(e instanceof Error ? e.message : 'Failed to load thread');
            }
        } finally {
            if (!opts?.silent) setLoadingThread(false);
        }
    }, [accountType]);

    useEffect(() => {
        void loadConversations();
        void loadContacts();
    }, [loadConversations, loadContacts]);

    useEffect(() => {
        const poll = window.setInterval(() => {
            void loadConversations({ silent: true });
        }, 10000);

        return () => {
            window.clearInterval(poll);
        };
    }, [loadConversations]);

    useEffect(() => {
        messageCountRef.current = 0;
        shouldStickToBottomRef.current = true;
        setObjectingId(null);
        setSuggestStarts('');
        setSuggestNotes('');
        if (!activeId) {
            setMessages([]);
            setLoadingThread(false);
            return;
        }
        void loadMessages(activeId);
    }, [activeId, loadMessages]);

    useEffect(() => {
        if (messages.length > messageCountRef.current && shouldStickToBottomRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        messageCountRef.current = messages.length;
    }, [messages]);

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
    }, [activeId, loadMessages]);

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
            await loadConversations({ silent: true });
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
        status: 'accepted' | 'declined',
        opts?: { suggestedStartsAt?: string; suggestedNotes?: string }
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
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not update appointment');
            setObjectingId(null);
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

    async function openDocument(docId: string) {
        if (!activeId || !docId) return;
        try {
            const res = await fetch(
                `/api/messages/conversations/${activeId}/documents/${docId}/url`,
                { credentials: 'include' }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.url) {
                setError(data.error || 'Could not open file');
                return;
            }
            const opened = window.open(String(data.url), '_blank', 'noopener,noreferrer');
            if (!opened) {
                // Popup blocked — navigate current tab as fallback
                window.location.assign(String(data.url));
            }
        } catch {
            setError('Could not open file');
        }
    }

    return (
        <div className="rounded-3xl border border-charcoal/[0.08] bg-white shadow-[0_2px_16px_rgba(44,44,44,0.04)] overflow-hidden h-[min(70vh,720px)] flex">
            {/* Conversation list */}
            <aside className="w-full max-w-[320px] border-r border-charcoal/[0.08] flex flex-col shrink-0 bg-[#fafafa]/60">
                <div className="p-4 border-b border-charcoal/[0.07] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-base font-semibold text-charcoal tracking-tight">Messages</h2>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => void refreshInbox()}
                                className={`${PORTAL_SECONDARY_BTN} !h-9 !w-9 !px-0`}
                                title="Refresh messages"
                                aria-label="Refresh messages"
                                disabled={refreshing}
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                                />
                            </button>
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
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => void refreshInbox()}
                                    className={`${PORTAL_SECONDARY_BTN} !h-9 !w-9 !px-0`}
                                    title="Refresh conversation"
                                    aria-label="Refresh conversation"
                                    disabled={refreshing}
                                >
                                    <RefreshCw
                                        className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                                    />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAppt(true)}
                                    className={`${PORTAL_SECONDARY_BTN} !h-9 !px-3 !text-xs`}
                                >
                                    <CalendarPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Propose appointment</span>
                                </button>
                            </div>
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
                                    if (m.kind === 'appointment') {
                                        const appointmentId = String(m.meta.appointmentId || '');
                                        return (
                                            <div
                                                key={m.id}
                                                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <AppointmentCalendarCard
                                                    meta={m.meta}
                                                    body={m.body}
                                                    mine={mine}
                                                    sending={sending}
                                                    objecting={objectingId === appointmentId}
                                                    suggestStarts={suggestStarts}
                                                    suggestNotes={suggestNotes}
                                                    onApprove={() =>
                                                        void respondAppointment(appointmentId, 'accepted')
                                                    }
                                                    onStartObject={() => {
                                                        setObjectingId(appointmentId);
                                                        setSuggestStarts(
                                                            m.meta.startsAt
                                                                ? toDatetimeLocalValue(
                                                                      String(m.meta.startsAt)
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
                                                                suggestedStartsAt: new Date(
                                                                    suggestStarts
                                                                ).toISOString(),
                                                                suggestedNotes:
                                                                    suggestNotes.trim() || undefined,
                                                            }
                                                        );
                                                    }}
                                                />
                                            </div>
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
                                                    <AttachmentMessage
                                                        conversationId={activeId || m.conversationId}
                                                        meta={m.meta}
                                                        body={m.body}
                                                        mine={mine}
                                                        onOpen={openDocument}
                                                    />
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
