'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Plus, Send } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import PortalLoading from '@/components/PortalLoading';
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
    senderAccountType: string | null;
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
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadList = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set('q', q.trim());
            const res = await fetch(`/api/admin/messages/conversations?${params}`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setConversations(data.conversations || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [q]);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    const loadThread = useCallback(async (id: string) => {
        setThreadLoading(true);
        setError('');
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
            setError(e instanceof Error ? e.message : 'Failed to open thread');
        } finally {
            setThreadLoading(false);
        }
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
            if (data.message) setMessages((prev) => [...prev, data.message]);
            await loadList();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Send failed');
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
            await loadList();
            if (data.conversationId) await loadThread(data.conversationId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start conversation');
        } finally {
            setSending(false);
        }
    }

    const selectedContact =
        contacts.find((contact) => `${contact.accountType}:${contact.id}` === selectedContactKey) || null;

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
            await loadList();
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
                            Messaging <span className="font-medium text-charcoal">{selectedContact.fullName || selectedContact.email}</span> at {selectedContact.email}
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
                            <p className="p-6 text-sm text-charcoal/45 text-center">No conversations yet</p>
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
                            <div className={`${PORTAL_CARD_HEADER} !px-4 !py-4`}>
                                <p className="font-semibold text-charcoal">{subject || 'Conversation'}</p>
                                <p className="text-xs text-charcoal/45 truncate">
                                    {participants
                                        .map((p) => `${p.displayName || p.accountType} (${p.accountType})`)
                                        .join(' · ')}
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[55vh]">
                                {threadLoading ? (
                                    <PortalLoading variant="inline" message="Loading thread…" />
                                ) : null}
                                {messages.map((m) => {
                                    const isAdmin = m.senderAccountType === 'admin';
                                    return (
                                        <div
                                            key={m.id}
                                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                                                isAdmin
                                                    ? 'ml-auto bg-gold text-white'
                                                    : 'bg-charcoal/[0.05] text-charcoal'
                                            }`}
                                        >
                                            <p className={`text-[10px] mb-1 ${isAdmin ? 'text-white/70' : 'text-charcoal/40'}`}>
                                                {m.senderName || m.senderAccountType || 'System'}
                                            </p>
                                            <p className="whitespace-pre-wrap">{m.body}</p>
                                        </div>
                                    );
                                })}
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
        </AdminShell>
    );
}
