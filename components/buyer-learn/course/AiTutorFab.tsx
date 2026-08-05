'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Sparkles, X } from 'lucide-react';
import { LEARN_BTN_PRIMARY, LEARN_CARD } from '@/lib/learn-course-ui';

type Msg = { role: 'user' | 'tutor'; text: string };

const NAME_STORAGE_KEY = 'propReady_tutorUserName';

function readStoredName(): string {
    if (typeof window === 'undefined') return '';
    try {
        return (localStorage.getItem(NAME_STORAGE_KEY) || '').trim();
    } catch {
        return '';
    }
}

function persistName(name: string) {
    try {
        localStorage.setItem(NAME_STORAGE_KEY, name);
    } catch {
        /* ignore */
    }
}

/** Pull a first name from “John”, “I’m John”, “My name is John”, etc. */
export function parseUserName(raw: string): string | null {
    const text = raw.trim();
    if (!text || text.length > 60) return null;
    if (/[?]/.test(text)) return null;
    if (text.split(/\s+/).length > 5) return null;

    const patterns = [
        /^(?:i(?:'|’)m|i am|my name is|this is|it(?:'|’)s|call me)\s+([a-zA-Z][a-zA-Z'\-]{1,24})(?:\s+[a-zA-Z][a-zA-Z'\-]{1,24})?\.?$/i,
        /^([a-zA-Z][a-zA-Z'\-]{1,24})(?:\s+[a-zA-Z][a-zA-Z'\-]{1,24})?\.?$/,
    ];

    for (const re of patterns) {
        const m = text.match(re);
        if (!m?.[1]) continue;
        const first = m[1];
        const blocked = /^(hi|hey|hello|yes|no|ok|okay|thanks|thank|what|how|why|when|where|who|help)$/i;
        if (blocked.test(first)) continue;
        return first.charAt(0).toUpperCase() + first.slice(1);
    }
    return null;
}

export default function AiTutorFab({
    lessonTitle,
    lessonSubtitle = '',
    hubBasePath = '/learn',
    open,
    onOpenChange,
    variant = 'tutor',
    fabClassName,
}: {
    lessonTitle: string;
    lessonSubtitle?: string;
    hubBasePath?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Landing page uses assistant branding */
    variant?: 'tutor' | 'assistant';
    fabClassName?: string;
}) {
    const isAssistant = variant === 'assistant';
    const productName = isAssistant ? 'PropReady AI Assistant' : 'AI Tutor';
    const shortName = isAssistant ? 'PropReady AI Assistant' : 'AI Tutor';

    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [userName, setUserName] = useState('');
    const [awaitingName, setAwaitingName] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([]);
    const endRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const bootstrapped = useRef(false);

    useEffect(() => {
        if (bootstrapped.current) return;
        bootstrapped.current = true;
        const stored = readStoredName();
        if (stored) {
            setUserName(stored);
            setAwaitingName(false);
            setMessages([
                {
                    role: 'tutor',
                    text: isAssistant
                        ? `Hi ${stored} — I’m the PropReady AI Assistant. Ask anything about PropReady, buying, selling, bonds, valuations, insurance, or investing in South Africa. Educational only — not formal advice.`
                        : `Hi ${stored} — I’m your PropReady tutor for “${lessonTitle}”. Ask anything property-related — valuations, bonds, OTPs, transfer costs, insurance, selling, investing, or what PropReady is. Educational only — not formal advice.`,
                },
            ]);
        } else {
            setAwaitingName(true);
            setMessages([
                {
                    role: 'tutor',
                    text: isAssistant
                        ? `Hi — I’m the PropReady AI Assistant. Before we dive in, what should I call you?`
                        : `Hi — I’m your PropReady tutor for “${lessonTitle}”. Before we dive in, what should I call you?`,
                },
            ]);
        }
    }, [isAssistant, lessonTitle]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open, busy]);

    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    async function send(text: string) {
        const trimmed = text.trim();
        if (!trimmed || busy) return;

        const nextMessages: Msg[] = [...messages, { role: 'user', text: trimmed }];
        setMessages(nextMessages);
        setInput('');

        // Capture name before answering property questions
        if (awaitingName || !userName) {
            const parsed = parseUserName(trimmed);
            if (parsed) {
                setUserName(parsed);
                persistName(parsed);
                setAwaitingName(false);
                setMessages((m) => [
                    ...m,
                    {
                        role: 'tutor',
                        text: isAssistant
                            ? `Great to meet you, ${parsed}. I’m the PropReady AI Assistant — ask me about PropReady, valuations, bonds, OTPs, transfer costs, insurance, selling, or investing.\n\nWhat would you like to know first?`
                            : `Great to meet you, ${parsed}. I’m your PropReady tutor for “${lessonTitle}”. Ask me anything property-related whenever you’re ready.\n\nWhat would you like to clear up first?`,
                    },
                ]);
                return;
            }
            setMessages((m) => [
                ...m,
                {
                    role: 'tutor',
                    text: `I didn’t quite catch your name — could you reply with just your first name (for example, “Sipho”)?`,
                },
            ]);
            setAwaitingName(true);
            return;
        }

        setBusy(true);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const history = nextMessages
                .filter((m) => m.role === 'user' || m.role === 'tutor')
                .slice(0, -1)
                .slice(-16)
                .map((m) => ({
                    role: m.role === 'tutor' ? ('assistant' as const) : ('user' as const),
                    content: m.text,
                }));

            const res = await fetch('/api/learn/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    message: trimmed,
                    lessonTitle,
                    lessonSubtitle,
                    hubBasePath,
                    history,
                    userName,
                    assistantMode: isAssistant,
                }),
            });

            const data = await res.json().catch(() => ({}));
            const reply =
                typeof data.reply === 'string' && data.reply.trim()
                    ? data.reply.trim()
                    : `${userName}, I couldn’t answer just then. Try asking what PropReady is, or about bonds, valuations, transfer costs, or insurance.`;

            setMessages((m) => [...m, { role: 'tutor', text: reply }]);
        } catch (err) {
            if ((err as Error)?.name === 'AbortError') return;
            setMessages((m) => [
                ...m,
                {
                    role: 'tutor',
                    text: `${userName}, something went wrong reaching me. Check your connection and ask again.`,
                },
            ]);
        } finally {
            setBusy(false);
        }
    }

    const fabPosition = fabClassName || (isAssistant ? 'bottom-6 right-5' : 'bottom-24 right-5');

    return (
        <>
            {!open ? (
                <button
                    type="button"
                    onClick={() => onOpenChange(true)}
                    className={`fixed ${fabPosition} z-50 inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)]`}
                    aria-label={`Open ${shortName}`}
                >
                    <Sparkles className="h-4 w-4 text-gold" />
                    {shortName}
                </button>
            ) : null}

            {open ? (
                <div
                    className={`fixed ${fabPosition} z-50 flex w-[min(100vw-2rem,400px)] flex-col overflow-hidden ${LEARN_CARD} !rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.18)]`}
                    role="dialog"
                    aria-label={productName}
                >
                    <div className="flex items-center justify-between border-b border-charcoal/[0.06] bg-gradient-to-r from-[#1c1c1c] to-[#2c2c2c] px-4 py-3.5 text-white">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold">
                                <MessageCircle className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{productName}</p>
                                <p className="text-[11px] text-white/50 truncate">
                                    {userName
                                        ? `Chatting with ${userName} · educational only`
                                        : 'SA property help · educational only'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white shrink-0"
                            aria-label={`Close ${shortName}`}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex max-h-[380px] flex-col gap-3 overflow-y-auto bg-[#f7f4f0] p-4">
                        {messages.map((m, i) => (
                            <div
                                key={`${m.role}-${i}`}
                                className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                    m.role === 'user'
                                        ? 'ml-auto bg-[#dc2626] text-white'
                                        : 'bg-[#fffcf8] text-charcoal/80 shadow-sm border border-charcoal/[0.06]'
                                }`}
                            >
                                {m.text}
                            </div>
                        ))}
                        {busy ? (
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-charcoal/[0.06] bg-[#fffcf8] px-3.5 py-2.5 text-sm text-charcoal/50">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#dc2626]" />
                                Thinking…
                            </div>
                        ) : null}
                        <div ref={endRef} />
                    </div>

                    <div className="border-t border-charcoal/[0.06] bg-[#fffcf8] p-3">
                        <form
                            className="flex gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void send(input);
                            }}
                        >
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={busy}
                                placeholder={
                                    awaitingName || !userName
                                        ? 'Type your first name…'
                                        : 'Ask any SA property question…'
                                }
                                className="h-11 flex-1 rounded-full border border-charcoal/10 bg-white px-4 text-sm outline-none focus:border-[#dc2626]/35 focus:ring-2 focus:ring-[#dc2626]/15 disabled:opacity-60"
                            />
                            <button
                                type="submit"
                                disabled={busy || !input.trim()}
                                className={`${LEARN_BTN_PRIMARY} !h-11 !px-4 disabled:opacity-50`}
                            >
                                {awaitingName || !userName ? 'Save' : 'Ask'}
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}
