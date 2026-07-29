'use client';

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import {
    ArrowLeft,
    Building2,
    CalendarPlus,
    FileText,
    Filter,
    Image as ImageIcon,
    Mail,
    Megaphone,
    MessageSquare,
    Mic,
    MoreHorizontal,
    Paperclip,
    Phone,
    Pin,
    Plus,
    RefreshCw,
    Search,
    Send,
    Smile,
    StickyNote,
    User,
    Video,
    X,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import AppointmentCalendarCard, {
    toDatetimeLocalValue,
} from '@/components/messages/AppointmentCalendarCard';
import AttachmentMessage from '@/components/messages/AttachmentMessage';
import VoiceNoteRecorder from '@/components/messages/VoiceNoteRecorder';

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
    unreadCount?: number;
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

const PRIMARY = '#E52323';
const BG = '#F8FAFC';
const TEXT = '#111827';

const LS_PINNED = 'propReady_admin_messages_pinned';
const LS_RECENT_SEARCHES = 'propReady_admin_messages_recent_searches';
const LS_BROADCAST_COUNT = 'propReady_admin_messages_broadcast_count';

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

function contactLabel(contact: Contact) {
    const title =
        contact.accountType === 'agent'
            ? 'Agent'
            : contact.accountType === 'originator'
              ? 'Originator'
              : 'Buyer / Seller';
    return `${contact.fullName || contact.email} · ${title}`;
}

function accountTypeLabel(type: string) {
    if (type === 'agent') return 'Agent';
    if (type === 'originator') return 'Originator';
    if (type === 'user') return 'Buyer / Seller';
    if (type === 'admin') return 'PropReady Staff';
    return type;
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
                `${c.id}:${c.lastMessageAt || ''}:${c.lastMessagePreview || ''}:${c.unreadCount || 0}`
        )
        .join('|');
}

function threadTitle(c: Conversation) {
    const names = c.participants
        .filter((p) => p.accountType !== 'admin')
        .map((p) => p.displayName || p.accountType)
        .join(', ');
    return c.subject || names || 'Conversation';
}

function primaryParticipant(participants: Participant[]) {
    return participants.find((p) => p.accountType !== 'admin') || participants[0] || null;
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

function DisabledAction({
    title,
    children,
    className = '',
}: {
    title: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <button
            type="button"
            disabled
            title={title}
            className={`inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#9CA3AF] opacity-60 cursor-not-allowed ${className}`}
        >
            {children}
        </button>
    );
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
    const [reproposingId, setReproposingId] = useState<string | null>(null);
    const [suggestStarts, setSuggestStarts] = useState('');
    const [suggestNotes, setSuggestNotes] = useState('');

    const [filterSubjectOnly, setFilterSubjectOnly] = useState(false);
    const [showRecentSearches, setShowRecentSearches] = useState(false);
    const [pinnedIds, setPinnedIds] = useState<string[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [broadcastCount, setBroadcastCount] = useState(0);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showContactPanel, setShowContactPanel] = useState(true);
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const draftRef = useRef<HTMLTextAreaElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const anyFileRef = useRef<HTMLInputElement>(null);
    const imageFileRef = useRef<HTMLInputElement>(null);
    const docFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPinnedIds(readJson<string[]>(LS_PINNED, []));
        setRecentSearches(readJson<string[]>(LS_RECENT_SEARCHES, []));
        setBroadcastCount(readJson<number>(LS_BROADCAST_COUNT, 0));
    }, []);

    useEffect(() => {
        const onPointer = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowRecentSearches(false);
            }
            if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', onPointer);
        return () => document.removeEventListener('mousedown', onPointer);
    }, []);

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
            setUnreadTotal(
                typeof data.unreadTotal === 'number'
                    ? data.unreadTotal
                    : next.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
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

    const loadThread = useCallback(async (id: string, opts?: { silent?: boolean; skipListRefresh?: boolean }) => {
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
            setMobileShowChat(true);
            setConversations((prev) =>
                prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
            );
            // Opening a thread marks it read server-side; refresh list unread badges.
            if (!opts?.skipListRefresh) {
                await loadList({ silent: true });
            }
        } catch (e) {
            if (!opts?.silent) {
                setError(e instanceof Error ? e.message : 'Failed to open thread');
            }
        } finally {
            if (!opts?.silent) setThreadLoading(false);
        }
    }, [loadList]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        setObjectingId(null);
        setReproposingId(null);
        setSuggestStarts('');
        setSuggestNotes('');
    }, [selectedId]);

    useEffect(() => {
        const el = draftRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [draft]);

    const filteredConversations = useMemo(() => {
        let list = [...conversations];
        if (filterSubjectOnly && q.trim()) {
            const needle = q.trim().toLowerCase();
            list = list.filter((c) => (c.subject || '').toLowerCase().includes(needle));
        }
        list.sort((a, b) => {
            const aPinned = pinnedIds.includes(a.id);
            const bPinned = pinnedIds.includes(b.id);
            if (aPinned !== bPinned) return aPinned ? -1 : 1;
            const aUnread = (a.unreadCount || 0) > 0;
            const bUnread = (b.unreadCount || 0) > 0;
            if (aUnread !== bUnread) return aUnread ? -1 : 1;
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bTime - aTime;
        });
        return list;
    }, [conversations, filterSubjectOnly, q, pinnedIds]);

    const messagesTodayCount = useMemo(
        () => conversations.filter((c) => isToday(c.lastMessageAt)).length,
        [conversations]
    );

    const activeTodayCount = useMemo(
        () => conversations.filter((c) => isToday(c.lastMessageAt)).length,
        [conversations]
    );

    const selectedConversation = useMemo(
        () => conversations.find((c) => c.id === selectedId) || null,
        [conversations, selectedId]
    );

    const contactParticipant = useMemo(
        () => primaryParticipant(participants),
        [participants]
    );

    function saveRecentSearch(term: string) {
        const trimmed = term.trim();
        if (!trimmed) return;
        const next = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 8);
        setRecentSearches(next);
        writeJson(LS_RECENT_SEARCHES, next);
    }

    function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            saveRecentSearch(q);
            setShowRecentSearches(false);
        }
    }

    function togglePin(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        const next = pinnedIds.includes(id)
            ? pinnedIds.filter((pid) => pid !== id)
            : [...pinnedIds, id];
        setPinnedIds(next);
        writeJson(LS_PINNED, next);
    }

    async function refreshInbox() {
        if (refreshing) return;
        setRefreshing(true);
        setError('');
        try {
            await loadList({ silent: true });
            if (selectedId) await loadThread(selectedId, { silent: true, skipListRefresh: true });
        } finally {
            setRefreshing(false);
        }
    }

    async function sendMessage(e: FormEvent) {
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

    async function uploadFile(file: File, opts?: { isVoiceNote?: boolean; durationMs?: number }) {
        if (!selectedId || !file) return;
        setSending(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('file', file);
            if (opts?.isVoiceNote) {
                fd.append('isVoiceNote', '1');
                if (opts.durationMs != null) fd.append('durationMs', String(opts.durationMs));
            }
            const res = await fetch(
                `/api/admin/messages/conversations/${selectedId}/documents`,
                {
                    method: 'POST',
                    credentials: 'include',
                    body: fd,
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            if (data.message) {
                setMessages((prev) =>
                    prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
                );
            }
            await loadList({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setSending(false);
        }
    }

    async function proposeAppointment(e: FormEvent) {
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
            const res = await fetch(`/api/admin/messages/appointments/${appointmentId}`, {
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

    async function sendBroadcast(e: FormEvent) {
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
            const nextCount = broadcastCount + 1;
            setBroadcastCount(nextCount);
            writeJson(LS_BROADCAST_COUNT, nextCount);
            setShowBroadcast(false);
            setBroadcastBody('');
            await loadList({ silent: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Broadcast failed');
        } finally {
            setBroadcasting(false);
        }
    }

    function insertEmoji(emoji: string) {
        setDraft((prev) => prev + emoji);
        setShowEmojiPicker(false);
        draftRef.current?.focus();
    }

    function handleBackToList() {
        setMobileShowChat(false);
    }

    const inputClass =
        'w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-base sm:text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#E52323]/40 focus:ring-2 focus:ring-[#E52323]/10';

    const cardClass =
        'rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]';

    const secondaryBtnClass =
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F8FAFC] disabled:opacity-50';

    const primaryBtnClass =
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition disabled:opacity-50';

    return (
        <AdminShell title="Messages">
            <style>{`
                @keyframes msgFadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .msg-fade-in { animation: msgFadeIn 0.25s ease-out both; }
            `}</style>

            <div className="space-y-6" style={{ color: TEXT }}>
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">
                            Messages
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
                            Communicate with users, agents, originators and staff from one unified
                            inbox.
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
                            onClick={() => setShowBroadcast(true)}
                            className={secondaryBtnClass}
                        >
                            <Megaphone className="h-4 w-4" />
                            Broadcast
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowNew(true)}
                            className={primaryBtnClass}
                            style={{ backgroundColor: PRIMARY }}
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
                        label="Broadcasts Sent"
                        value={broadcastCount}
                        description="Successful broadcasts this session"
                        icon={Megaphone}
                    />
                    <KpiCard
                        label="Messages Today"
                        value={messagesTodayCount}
                        description="Conversations active today"
                        icon={Send}
                    />
                </div>

                {/* Broadcast Modal */}
                {showBroadcast ? (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                        <form
                            onSubmit={sendBroadcast}
                            className={`${cardClass} w-full max-w-lg p-6 shadow-[0_24px_48px_rgba(17,24,39,0.16)]`}
                        >
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-[#111827]">
                                        Broadcast to everyone
                                    </h2>
                                    <p className="mt-1 text-xs text-[#6B7280]">
                                        Creates an inbox conversation for each matching account. For
                                        banners, use{' '}
                                        <a
                                            href="/admin/announcements"
                                            className="font-medium underline"
                                            style={{ color: PRIMARY }}
                                        >
                                            Announcements
                                        </a>
                                        .
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowBroadcast(false)}
                                    className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F8FAFC]"
                                    aria-label="Close broadcast"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <select
                                    value={broadcastAudience}
                                    onChange={(e) => setBroadcastAudience(e.target.value)}
                                    className={`${inputClass} h-11`}
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
                                    className={`${inputClass} h-11`}
                                />
                                <textarea
                                    required
                                    value={broadcastBody}
                                    onChange={(e) => setBroadcastBody(e.target.value)}
                                    placeholder="Message to send to every selected account…"
                                    rows={4}
                                    className={`${inputClass} py-2.5`}
                                />
                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="submit"
                                        disabled={broadcasting}
                                        className={`${primaryBtnClass} flex-1`}
                                        style={{ backgroundColor: PRIMARY }}
                                    >
                                        {broadcasting ? 'Sending…' : 'Send broadcast'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowBroadcast(false)}
                                        className={secondaryBtnClass}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                ) : null}

                {/* New Message Modal */}
                {showNew ? (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                        <div
                            className={`${cardClass} w-full max-w-lg p-6 shadow-[0_24px_48px_rgba(17,24,39,0.16)]`}
                        >
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-[#111827]">
                                        Start conversation
                                    </h2>
                                    <p className="mt-1 text-xs text-[#6B7280]">
                                        Message any account on the platform.
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
                            <div className="space-y-4">
                                <input
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    placeholder="Subject"
                                    className={`${inputClass} h-11`}
                                />
                                <select
                                    value={selectedContactKey}
                                    onChange={(e) => setSelectedContactKey(e.target.value)}
                                    className={`${inputClass} h-11`}
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
                                    <p className="text-xs text-[#6B7280]">
                                        Messaging{' '}
                                        <span className="font-medium text-[#111827]">
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
                                    className={`${inputClass} py-2.5`}
                                />
                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        disabled={sending || !selectedContact}
                                        onClick={() =>
                                            selectedContact && void startConversation(selectedContact)
                                        }
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
                        </div>
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
                            <div ref={searchRef} className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    onFocus={() => setShowRecentSearches(true)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Search conversations…"
                                    className={`${inputClass} h-11 pl-10 pr-20`}
                                />
                                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                                    {q ? (
                                        <button
                                            type="button"
                                            onClick={() => setQ('')}
                                            className="rounded-lg p-1 text-[#6B7280] hover:bg-[#F8FAFC]"
                                            aria-label="Clear search"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => setFilterSubjectOnly((v) => !v)}
                                        title={
                                            filterSubjectOnly
                                                ? 'Filtering by subject only'
                                                : 'Search all fields'
                                        }
                                        className={`rounded-lg p-1.5 transition ${
                                            filterSubjectOnly
                                                ? 'bg-[#E52323]/10 text-[#E52323]'
                                                : 'text-[#6B7280] hover:bg-[#F8FAFC]'
                                        }`}
                                    >
                                        <Filter className="h-4 w-4" />
                                    </button>
                                </div>
                                {showRecentSearches && recentSearches.length > 0 ? (
                                    <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg">
                                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                                            Recent searches
                                        </p>
                                        {recentSearches.map((term) => (
                                            <button
                                                key={term}
                                                type="button"
                                                onClick={() => {
                                                    setQ(term);
                                                    setShowRecentSearches(false);
                                                }}
                                                className="block w-full px-3 py-2 text-left text-sm text-[#111827] hover:bg-[#F8FAFC]"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            {filterSubjectOnly ? (
                                <p className="mt-2 text-[11px] text-[#6B7280]">
                                    Subject-only filter active
                                </p>
                            ) : null}
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[calc(65vh-80px)]">
                            {loading ? (
                                <ConversationSkeleton />
                            ) : filteredConversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
                                    <MessageSquare className="h-8 w-8 text-[#D1D5DB]" />
                                    <p className="text-sm text-[#6B7280]">No conversations yet</p>
                                </div>
                            ) : (
                                filteredConversations.map((c) => {
                                    const title = threadTitle(c);
                                    const isSelected = selectedId === c.id;
                                    const isPinned = pinnedIds.includes(c.id);
                                    const unread = c.unreadCount || 0;
                                    const isUnread = unread > 0;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => void loadThread(c.id)}
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
                            selectedId && mobileShowChat ? 'flex' : 'hidden xl:flex'
                        }`}
                    >
                        {!selectedId ? (
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
                                                    threadTitle(selectedConversation!)
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-[#111827]">
                                                {subject ||
                                                    threadTitle(selectedConversation!) ||
                                                    'Conversation'}
                                            </p>
                                            <p className="truncate text-xs text-[#6B7280]">
                                                {contactParticipant
                                                    ? `${contactParticipant.displayName || 'Unknown'} · ${accountTypeLabel(contactParticipant.accountType)}`
                                                    : participants
                                                          .map(
                                                              (p) =>
                                                                  `${p.displayName || p.accountType} (${p.accountType})`
                                                          )
                                                          .join(' · ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <DisabledAction title="Coming soon" className="h-9 w-9">
                                            <Mic className="h-4 w-4" />
                                        </DisabledAction>
                                        <DisabledAction title="Coming soon" className="h-9 w-9">
                                            <Video className="h-4 w-4" />
                                        </DisabledAction>
                                        <button
                                            type="button"
                                            onClick={() => setShowAppt(true)}
                                            className={`${secondaryBtnClass} !h-9 !px-3 !text-xs`}
                                            title="Schedule appointment"
                                        >
                                            <CalendarPlus className="h-4 w-4" />
                                            <span className="hidden sm:inline">Schedule</span>
                                        </button>
                                        <div ref={moreMenuRef} className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowMoreMenu((v) => !v)}
                                                className={`${secondaryBtnClass} !h-9 !w-9 !px-0`}
                                                aria-label="More actions"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                            {showMoreMenu ? (
                                                <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowMoreMenu(false);
                                                            void refreshInbox();
                                                        }}
                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#111827] hover:bg-[#F8FAFC]"
                                                    >
                                                        <RefreshCw
                                                            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                                                        />
                                                        Refresh
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowMoreMenu(false);
                                                            setShowContactPanel((v) => !v);
                                                        }}
                                                        className="hidden w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#111827] hover:bg-[#F8FAFC] xl:flex"
                                                    >
                                                        <User className="h-4 w-4" />
                                                        {showContactPanel
                                                            ? 'Hide contact panel'
                                                            : 'Show contact panel'}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto px-4 py-4 max-h-[calc(65vh-140px)]">
                                    {threadLoading ? <ThreadSkeleton /> : null}
                                    {!threadLoading
                                        ? messages.map((m) => {
                                              const isAdmin = m.senderAccountType === 'admin';
                                              const meta =
                                                  m.meta && typeof m.meta === 'object' ? m.meta : {};

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
                                                          className={`msg-fade-in mb-3 flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                                      >
                                                          <div className="max-w-[70%]">
                                                              <AppointmentCalendarCard
                                                                  meta={meta}
                                                                  body={m.body}
                                                                  mine={isAdmin}
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
                                                                                    String(
                                                                                        meta.startsAt
                                                                                    )
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
                                                                  onSuggestStartsChange={
                                                                      setSuggestStarts
                                                                  }
                                                                  onSuggestNotesChange={
                                                                      setSuggestNotes
                                                                  }
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
                                                                                    String(
                                                                                        meta.startsAt
                                                                                    )
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
                                                      className={`msg-fade-in mb-3 flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                                  >
                                                      <div
                                                          className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm ${
                                                              isAdmin
                                                                  ? 'text-white shadow-[0_2px_8px_rgba(229,35,35,0.25)]'
                                                                  : 'border border-[#E5E7EB] bg-slate-50 text-[#111827]'
                                                          }`}
                                                          style={
                                                              isAdmin
                                                                  ? { backgroundColor: PRIMARY }
                                                                  : undefined
                                                          }
                                                      >
                                                          <p
                                                              className={`mb-1 text-[10px] font-medium ${
                                                                  isAdmin
                                                                      ? 'text-white/75'
                                                                      : 'text-[#9CA3AF]'
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
                                                  </div>
                                              );
                                          })
                                        : null}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Composer */}
                                <form
                                    onSubmit={sendMessage}
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
                                            ref={anyFileRef}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                e.target.value = '';
                                                if (f) void uploadFile(f);
                                            }}
                                        />
                                        <input
                                            ref={imageFileRef}
                                            type="file"
                                            className="hidden"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                e.target.value = '';
                                                if (f) void uploadFile(f);
                                            }}
                                        />
                                        <input
                                            ref={docFileRef}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                e.target.value = '';
                                                if (f) void uploadFile(f);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            disabled={sending || !selectedId}
                                            onClick={() => anyFileRef.current?.click()}
                                            title="Attach file"
                                            aria-label="Attach file"
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] transition hover:bg-[#F8FAFC] disabled:opacity-50"
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={sending || !selectedId}
                                            onClick={() => imageFileRef.current?.click()}
                                            title="Upload image"
                                            aria-label="Upload image"
                                            className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] transition hover:bg-[#F8FAFC] disabled:opacity-50"
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={sending || !selectedId}
                                            onClick={() => docFileRef.current?.click()}
                                            title="Upload document"
                                            aria-label="Upload document"
                                            className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] transition hover:bg-[#F8FAFC] disabled:opacity-50"
                                        >
                                            <FileText className="h-4 w-4" />
                                        </button>
                                        <VoiceNoteRecorder
                                            disabled={sending || !selectedId}
                                            accentColor={PRIMARY}
                                            onRecorded={(file, durationMs) =>
                                                uploadFile(file, { isVoiceNote: true, durationMs })
                                            }
                                        />
                                        <textarea
                                            ref={draftRef}
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    void sendMessage(e);
                                                }
                                            }}
                                            placeholder="Reply as PropReady staff…"
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
                    {showContactPanel ? (
                        <div
                            className={`${cardClass} hidden flex-col overflow-hidden xl:flex ${
                                selectedId ? '' : 'opacity-60'
                            }`}
                        >
                            <div className="border-b border-[#E5E7EB] px-5 py-4">
                                <h3 className="text-sm font-semibold text-[#111827]">
                                    Contact details
                                </h3>
                            </div>
                            {!selectedId || !contactParticipant ? (
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
                                                    contactParticipant.accountType
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
                                        icon={Phone}
                                        label="Phone"
                                        value="Not available"
                                    />
                                    <ContactField
                                        icon={Mail}
                                        label="Email"
                                        value="Not available"
                                    />
                                    <ContactField
                                        icon={Building2}
                                        label="Properties"
                                        value="Not available"
                                    />
                                    <ContactField
                                        icon={CalendarPlus}
                                        label="Appointments"
                                        value="Not available"
                                    />
                                    <ContactField
                                        icon={StickyNote}
                                        label="Notes"
                                        value="Not available"
                                    />

                                    {participants.length > 1 ? (
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                                                All participants
                                            </p>
                                            <ul className="space-y-2">
                                                {participants.map((p) => (
                                                    <li
                                                        key={`${p.accountType}:${p.profileId}`}
                                                        className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-xs"
                                                    >
                                                        <span className="font-medium text-[#111827]">
                                                            {p.displayName || p.accountType}
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
                    ) : null}
                </div>
            </div>

            {/* Appointment propose modal */}
            {showAppt && selectedId ? (
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
        </AdminShell>
    );
}

function ContactField({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Phone;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#6B7280]">
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    {label}
                </p>
                <p className="mt-0.5 text-sm text-[#6B7280]">{value}</p>
            </div>
        </div>
    );
}
