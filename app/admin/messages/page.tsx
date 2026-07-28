'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    CalendarPlus,
    MessageSquare,
    Plus,
    RefreshCw,
    Send,
    X,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import PortalLoading from '@/components/PortalLoading';
import AppointmentCalendarCard, {
    toDatetimeLocalValue,
} from '@/components/messages/AppointmentCalendarCard';
import AttachmentMessage from '@/components/messages/AttachmentMessage';
import {
    PORTAL_CARD,
    PORTAL_CARD_HEADER,
    PORTAL_PRIMARY_BTN,
    PORTAL_SECONDARY_BTN,
} from '@/lib/portal-ui';

type Participant = {
    accountType: string;
    profileId: string;
    displayName: string | null;
};

type Conversation = {
    id: string;
    subject: string | null;
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
    participants: Participant[];
};

type Message = {
    id: string;
    kind: string;
    body: string | null;
    meta?: Record<string, unknown> | null;
    senderAccountType: string | null;
    senderProfileId?: string | null;
    senderName: string | null;
    createdAt: string;
};

type Contact = {
    id: string;
    accountType: 'user' | 'agent' | 'originator';
    fullName: string;
    email: string;
};

function contactLabel(contact: Contact) {
    const title =
        contact.accountType === 'agent'
            ? 'Agent'
            : contact.accountType === 'originator'
              ? 'Originator'
              : 'Buyer / Seller';
    return `${contact.fullName || contact.email} · ${title}`;
}

function conversationFingerprint(list: Conversation[]) {
    return list
        .map((c) => `${c.id}:${c.lastMessageAt || ''}:${c.lastMessagePreview || ''}`)
        .join('|');
}

export default function AdminMessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [subject, setSubject] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [threadLoading, setThreadLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContactKey, setSelectedContactKey] = useState('');
    const [newBody, setNewBody] = useState('');
    const [newSubject, setNewSubject] = useState('PropReady support');
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [broadcastAudience, setBroadcastAudience] = useState('all');
    const [broadcastSubject, setBroadcastSubject] = useState('PropReady update');
    const [broadcastBody, setBroadcastBody] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);
    const [showAppt, setShowAppt] = useState(false);
    const [apptStarts, setApptStarts] = useState('');
    const [apptLocation, setApptLocation] = useState('');
    const [apptNotes, setApptNotes] = useState('');
    const [objectingId, setObjectingId] = useState<string | null>(null);
    const [suggestStarts, setSuggestStarts] = useState('');
    const [suggestNotes, setSuggestNotes] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadList = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        if (!opts?.silent) setError('');
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set('q', q.trim());
            const res = await fetch(`/api/admin/messages/conversations?${params}`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            const next = (data.conversations || []) as Conversation[];
            setConversations((prev) =>
                conversationFingerprint(prev) === conversationFingerprint(next) ? prev : next
            );
        } catch (e) {
            if (!opts?.silent) {
                setError(e instanceof Error ? e.message : 'Failed to load');
            }
        } finally {
            setLoading(false);
        }
    }, [q]);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    const loadThread = useCallback(async (id: string, opts?: { silent?: boolean }) => {
        if (!opts?.silent) setThreadLoading(true);
        if (!opts?.silent) setError('');
        try {
            const res = await fetch(`/api/admin/messages/conversations/${id}`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to open thread');
            setMessages(data.messages || []);
            setParticipants(data.participants || []);
            setSubject(data.conversation?.subject || null);
            setSelectedId(id);
        } catch (e) {
            if (!opts?.silent) {
                setError(e instanceof Error ? e.message : 'Failed to open thread');
            }
        } finally {
            if (!opts?.silent) setThreadLoading(false);
        }
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        setObjectingId(null);
        setSuggestStarts('');
        setSuggestNotes('');
    }, [selectedId]);

    async function refreshInbox() {
        if (refreshing) return;
        setRefreshing(true);
        setError('');
        try {
            await loadList({ silent: true });
            if (selectedId) await loadThread(selectedId, { silent: true });
        } finally {
            setRefreshing(false);
        }
    }

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedId || !draft.trim()) return;
        setSending(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/messages/conversations/${selectedId}/messages`, {
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
            await loadList({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Send failed');
        } finally {
            setSending(false);
        }
    }

    async function proposeAppointment(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedId || !apptStarts) return;
        setSending(true);
        setError('');
        try {
            const res = await fetch(
                `/api/admin/messages/conversations/${selectedId}/appointments`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startsAt: new Date(apptStarts).toISOString(),
                        location: apptLocation.trim() || null,
                        notes: apptNotes.trim() || null,
                    }),
                }
            );
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
            await loadList({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not propose appointment');
        } finally {
            setSending(false);
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
            const res = await fetch(`/api/admin/messages/appointments/${appointmentId}`, {
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
            if (selectedId) await loadThread(selectedId, { silent: true });
            await loadList({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setSending(false);
        }
    }

    const loadContacts = useCallback(async () => {
        const res = await fetch('/api/admin/accounts?type=all', {
            credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            setContacts(
                (data.accounts || []).map((account: Contact) => ({
                    id: account.id,
                    accountType: account.accountType,
                    fullName: account.fullName,
                    email: account.email,
                }))
            );
        }
    }, []);

    useEffect(() => {
        if (!showNew) return;
        void loadContacts();
    }, [showNew, loadContacts]);

    async function startConversation(contact: Contact) {
        setSending(true);
        setError('');
        try {
            const res = await fetch('/api/admin/messages/conversations', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountType: contact.accountType,
                    profileId: contact.id,
                    displayName: contact.fullName || contact.email,
                    subject: newSubject.trim() || 'PropReady support',
                    body: newBody.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not start conversation');
            setShowNew(false);
            setNewBody('');
            setContacts([]);
            setSelectedContactKey('');
            await loadList({ silent: true });
            if (data.conversationId) await loadThread(data.conversationId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start conversation');
        } finally {
            setSending(false);
        }
    }

    const selectedContact =
        contacts.find((contact) => `${contact.accountType}:${contact.id}` === selectedContactKey) ||
        null;

    async function sendBroadcast(e: React.FormEvent) {
        e.preventDefault();
        if (!broadcastBody.trim()) return;
        const ok = window.confirm(
            `Send this message to every ${broadcastAudience === 'all' ? 'account' : broadcastAudience} on the platform?`
        );
        if (!ok) return;
        setBroadcasting(true);
        setError('');
        try {
            const res = await fetch('/api/admin/messages/broadcast', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audience: broadcastAudience,
                    subject: broadcastSubject,
                    body: broadcastBody.trim(),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Broadcast failed');
            alert(`Sent to ${data.sent}/${data.recipientCount} accounts.`);
            setShowBroadcast(false);
            setBroadcastBody('');
            await loadList({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Broadcast failed');
        } finally {
            setBroadcasting(false);
        }
    }

    function threadTitle(c: Conversation) {
        const names = c.participants
            .filter((p) => p.accountType !== 'admin')
            .map((p) => p.displayName || p.accountType)
            .join(', ');
        return c.subject || names || 'Conversation';
    }

    return (
        <AdminShell title="Messages">
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <p className="text-sm text-charcoal/55">
                    Message anyone on the platform, broadcast updates, and reply in any thread.
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => void refreshInbox()}
                        className={`${PORTAL_SECONDARY_BTN} !h-10 !px-3`}
                        title="Refresh messages"
                        aria-label="Refresh messages"
                        disabled={refreshing}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowBroadcast(true)}
                        className="h-10 px-4 rounded-xl border border-charcoal/[0.12] text-sm font-medium"
                    >
                        Broadcast
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowNew(true)}
                        className="h-10 px-4 rounded-xl bg-gold text-white text-sm font-semibold inline-flex items-center gap-2 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        New message
                    </button>
                </div>
            </div>

            {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

            {showBroadcast ? (
                <form
                    onSubmit={sendBroadcast}
                    className={`${PORTAL_CARD} mb-5 p-6 sm:p-7 space-y-4`}
                >
                    <h2 className="font-semibold text-charcoal">Broadcast to everyone</h2>
                    <p className="text-xs text-charcoal/50">
                        Creates an inbox conversation for each matching account. For banners, use{' '}
                        <a href="/admin/announcements" className="text-gold underline">
                            Announcements
                        </a>
                        .
                    </p>
                    <select
                        value={broadcastAudience}
                        onChange={(e) => setBroadcastAudience(e.target.value)}
                        className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                    >
                        <option value="all">Everyone</option>
                        <option value="user">Buyers / sellers</option>
                        <option value="agent">Agents</option>
                        <option value="originator">Originators</option>
                    </select>
                    <input
                        value={broadcastSubject}
                        onChange={(e) => setBroadcastSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                    />
                    <textarea
                        required
                        value={broadcastBody}
                        onChange={(e) => setBroadcastBody(e.target.value)}
                        placeholder="Message to send to every selected account…"
                        rows={4}
                        className="w-full rounded-xl border border-charcoal/[0.1] px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={broadcasting}
                            className={`${PORTAL_PRIMARY_BTN} disabled:opacity-60`}
                        >
                            {broadcasting ? 'Sending…' : 'Send broadcast'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowBroadcast(false)}
                            className={PORTAL_SECONDARY_BTN}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : null}

            {showNew ? (
                <div className={`${PORTAL_CARD} mb-5 p-6 sm:p-7 space-y-4`}>
                    <h2 className="font-semibold text-charcoal">Start conversation</h2>
                    <input
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                    />
                    <select
                        value={selectedContactKey}
                        onChange={(e) => setSelectedContactKey(e.target.value)}
                        className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3 text-sm bg-white"
                    >
                        <option value="">Select account to message…</option>
                        {contacts.map((contact) => (
                            <option
                                key={`${contact.accountType}:${contact.id}`}
                                value={`${contact.accountType}:${contact.id}`}
                            >
                                {contactLabel(contact)}
                            </option>
                        ))}
                    </select>
                    {selectedContact ? (
                        <p className="text-xs text-charcoal/45">
                            Messaging{' '}
                            <span className="font-medium text-charcoal">
                                {selectedContact.fullName || selectedContact.email}
                            </span>{' '}
                            at {selectedContact.email}
                        </p>
                    ) : null}
                    <textarea
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        placeholder="Optional first message…"
                        rows={3}
                        className="w-full rounded-xl border border-charcoal/[0.1] px-3 py-2 text-sm"
                    />
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            disabled={sending || !selectedContact}
                            onClick={() => selectedContact && void startConversation(selectedContact)}
                            className={`${PORTAL_PRIMARY_BTN} disabled:opacity-60`}
                        >
                            {sending ? 'Starting…' : 'Start conversation'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowNew(false)}
                            className="text-sm text-charcoal/50 hover:text-charcoal"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="grid lg:grid-cols-[320px_1fr] gap-4 min-h-[60vh]">
                <div className={`${PORTAL_CARD} flex flex-col`}>
                    <div className={`${PORTAL_CARD_HEADER} !px-4 !py-4`}>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Filter conversations…"
                            className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[70vh]">
                        {loading ? (
                            <PortalLoading variant="inline" message="Loading…" />
                        ) : conversations.length === 0 ? (
                            <p className="p-6 text-sm text-charcoal/45 text-center">
                                No conversations yet
                            </p>
                        ) : (
                            conversations.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => void loadThread(c.id)}
                                    className={`w-full text-left px-4 py-3 border-b border-charcoal/[0.05] hover:bg-charcoal/[0.02] ${
                                        selectedId === c.id ? 'bg-gold/[0.06]' : ''
                                    }`}
                                >
                                    <p className="text-sm font-medium text-charcoal truncate">
                                        {threadTitle(c)}
                                    </p>
                                    <p className="text-xs text-charcoal/45 truncate mt-0.5">
                                        {c.lastMessagePreview || 'No messages'}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className={`${PORTAL_CARD} flex flex-col min-h-[60vh]`}>
                    {!selectedId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-charcoal/40 gap-2 p-8">
                            <MessageSquare className="w-8 h-8" />
                            <p className="text-sm">Select a conversation</p>
                        </div>
                    ) : (
                        <>
                            <div
                                className={`${PORTAL_CARD_HEADER} !px-4 !py-4 flex items-start justify-between gap-3`}
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-charcoal">
                                        {subject || 'Conversation'}
                                    </p>
                                    <p className="text-xs text-charcoal/45 truncate">
                                        {participants
                                            .map(
                                                (p) =>
                                                    `${p.displayName || p.accountType} (${p.accountType})`
                                            )
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
                                        <span className="hidden sm:inline">Propose</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[55vh]">
                                {threadLoading ? (
                                    <PortalLoading variant="inline" message="Loading thread…" />
                                ) : null}
                                {!threadLoading
                                    ? messages.map((m) => {
                                          const isAdmin = m.senderAccountType === 'admin';
                                          const meta =
                                              m.meta && typeof m.meta === 'object' ? m.meta : {};

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
                                              const appointmentId = String(
                                                  meta.appointmentId || ''
                                              );
                                              return (
                                                  <div
                                                      key={m.id}
                                                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                                  >
                                                      <AppointmentCalendarCard
                                                          meta={meta}
                                                          body={m.body}
                                                          mine={isAdmin}
                                                          sending={sending}
                                                          objecting={objectingId === appointmentId}
                                                          suggestStarts={suggestStarts}
                                                          suggestNotes={suggestNotes}
                                                          onApprove={() =>
                                                              void respondAppointment(
                                                                  appointmentId,
                                                                  'accepted'
                                                              )
                                                          }
                                                          onStartObject={() => {
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
                                                                      suggestedStartsAt: new Date(
                                                                          suggestStarts
                                                                      ).toISOString(),
                                                                      suggestedNotes:
                                                                          suggestNotes.trim() ||
                                                                          undefined,
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
                                                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                                                      isAdmin
                                                          ? 'ml-auto bg-gold text-white'
                                                          : 'bg-charcoal/[0.05] text-charcoal'
                                                  }`}
                                              >
                                                  <p
                                                      className={`text-[10px] mb-1 ${
                                                          isAdmin
                                                              ? 'text-white/70'
                                                              : 'text-charcoal/40'
                                                      }`}
                                                  >
                                                      {m.senderName ||
                                                          m.senderAccountType ||
                                                          'System'}
                                                  </p>
                                                  {m.kind === 'document' ? (
                                                      <AttachmentMessage
                                                          conversationId={selectedId}
                                                          meta={meta}
                                                          body={m.body}
                                                          mine={isAdmin}
                                                          urlBase="/api/admin/messages/conversations"
                                                      />
                                                  ) : (
                                                      <p className="whitespace-pre-wrap">
                                                          {m.body}
                                                      </p>
                                                  )}
                                              </div>
                                          );
                                      })
                                    : null}
                                <div ref={bottomRef} />
                            </div>
                            <form
                                onSubmit={sendMessage}
                                className="p-3 border-t border-charcoal/[0.06] flex gap-2"
                            >
                                <input
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    placeholder="Reply as PropReady staff…"
                                    className="flex-1 h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !draft.trim()}
                                    className="h-11 w-11 rounded-xl bg-gold text-white inline-flex items-center justify-center disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {showAppt && selectedId ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={proposeAppointment}
                        className="w-full max-w-md rounded-3xl bg-white border border-charcoal/[0.08] shadow-xl p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-charcoal">
                                Propose appointment
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAppt(false)}
                                aria-label="Close"
                            >
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
                                Location (optional)
                            </label>
                            <input
                                value={apptLocation}
                                onChange={(e) => setApptLocation(e.target.value)}
                                className="w-full h-11 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/45 mb-1.5">
                                Notes (optional)
                            </label>
                            <textarea
                                value={apptNotes}
                                onChange={(e) => setApptNotes(e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-charcoal/[0.1] px-3 py-2 text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={sending || !apptStarts}
                            className={`${PORTAL_PRIMARY_BTN} w-full disabled:opacity-60`}
                        >
                            {sending ? 'Sending…' : 'Send proposal'}
                        </button>
                    </form>
                </div>
            ) : null}
        </AdminShell>
    );
}
