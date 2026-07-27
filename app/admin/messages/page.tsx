'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Plus, Send } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import PortalLoading from '@/components/PortalLoading';

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
    const [contactQ, setContactQ] = useState('');
    const [newBody, setNewBody] = useState('');
    const [newSubject, setNewSubject] = useState('PropReady support');
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

    async function searchContacts(term: string) {
        setContactQ(term);
        if (term.trim().length < 2) {
            setContacts([]);
            return;
        }
        const res = await fetch(
            `/api/admin/accounts?type=all&q=${encodeURIComponent(term.trim())}`,
            { credentials: 'include' }
        );
        const data = await res.json();
        if (res.ok) setContacts(data.accounts || []);
    }

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
            setContactQ('');
            await loadList();
            if (data.conversationId) await loadThread(data.conversationId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start conversation');
        } finally {
            setSending(false);
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
            <div className="flex items-center justify-between gap-3 mb-5">
                <p className="text-sm text-charcoal/55">
                    View all portal conversations and message users as PropReady staff.
                </p>
                <button
                    type="button"
                    onClick={() => setShowNew(true)}
                    className="h-10 px-4 rounded-xl bg-gold text-white text-sm font-semibold inline-flex items-center gap-2 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    New message
                </button>
            </div>

            {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

            {showNew ? (
                <div className="mb-5 rounded-2xl border border-charcoal/[0.08] bg-white p-5 space-y-3">
                    <h2 className="font-semibold text-charcoal">Start conversation</h2>
                    <input
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                    />
                    <input
                        value={contactQ}
                        onChange={(e) => void searchContacts(e.target.value)}
                        placeholder="Search account by name or email…"
                        className="w-full h-10 rounded-xl border border-charcoal/[0.1] px-3 text-sm"
                    />
                    {contacts.length > 0 ? (
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-charcoal/[0.08] divide-y">
                            {contacts.slice(0, 8).map((c) => (
                                <button
                                    key={`${c.accountType}:${c.id}`}
                                    type="button"
                                    disabled={sending}
                                    onClick={() => void startConversation(c)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-charcoal/[0.03]"
                                >
                                    <span className="font-medium">{c.fullName || '—'}</span>
                                    <span className="text-charcoal/45"> · {c.email}</span>
                                    <span className="text-charcoal/35"> · {c.accountType}</span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                    <textarea
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        placeholder="Optional first message…"
                        rows={3}
                        className="w-full rounded-xl border border-charcoal/[0.1] px-3 py-2 text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNew(false)}
                        className="text-sm text-charcoal/50 hover:text-charcoal"
                    >
                        Cancel
                    </button>
                </div>
            ) : null}

            <div className="grid lg:grid-cols-[320px_1fr] gap-4 min-h-[60vh]">
                <div className="rounded-2xl border border-charcoal/[0.08] bg-white overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-charcoal/[0.06]">
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

                <div className="rounded-2xl border border-charcoal/[0.08] bg-white flex flex-col min-h-[60vh]">
                    {!selectedId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-charcoal/40 gap-2 p-8">
                            <MessageSquare className="w-8 h-8" />
                            <p className="text-sm">Select a conversation</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-4 py-3 border-b border-charcoal/[0.06]">
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
