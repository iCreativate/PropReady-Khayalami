'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Sparkles, X } from 'lucide-react';
import { LEARN_BTN_PRIMARY, LEARN_CARD } from '@/lib/learn-course-ui';

type Msg = { role: 'user' | 'tutor'; text: string };

const QUICK = [
    'Summarise this lesson',
    'Explain soft vs full prequal',
    'What cash do I need beyond deposit?',
    'How do SA home loans work?',
    'Give a South African example',
    'Common first-time buyer mistakes',
];

export default function AiTutorFab({
    lessonTitle,
    lessonSubtitle = '',
    hubBasePath = '/learn',
    open,
    onOpenChange,
}: {
    lessonTitle: string;
    lessonSubtitle?: string;
    hubBasePath?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([
        {
            role: 'tutor',
            text: `Hi — I’m your PropReady property tutor for “${lessonTitle}”. Ask me anything about buying, selling, bonds, transfer costs, conveyancing, agents, FLISP, or investing in South Africa. Educational guidance only — not formal advice.`,
        },
    ]);
    const endRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

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
                }),
            });

            const data = await res.json().catch(() => ({}));
            const reply =
                typeof data.reply === 'string' && data.reply.trim()
                    ? data.reply.trim()
                    : 'I couldn’t answer just then. Try again, or ask about bonds, transfer costs, OTPs, selling, or investing.';

            setMessages((m) => [...m, { role: 'tutor', text: reply }]);
            if (data.source && data.source !== 'openai') {
                console.warn('AI tutor source:', data.source, data.error || '');
            }
        } catch (err) {
            if ((err as Error)?.name === 'AbortError') return;
            setMessages((m) => [
                ...m,
                {
                    role: 'tutor',
                    text: 'Something went wrong reaching the tutor. Check your connection and ask again — I’m here for any SA property learning question.',
                },
            ]);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            {!open ? (
                <button
                    type="button"
                    onClick={() => onOpenChange(true)}
                    className="fixed bottom-24 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)]"
                    aria-label="Open AI Tutor"
                >
                    <Sparkles className="h-4 w-4 text-gold" />
                    AI Tutor
                </button>
            ) : null}

            {open ? (
                <div
                    className={`fixed bottom-24 right-5 z-50 flex w-[min(100vw-2rem,400px)] flex-col overflow-hidden ${LEARN_CARD} !rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.18)]`}
                    role="dialog"
                    aria-label="AI Tutor"
                >
                    <div className="flex items-center justify-between border-b border-charcoal/[0.06] bg-gradient-to-r from-[#1c1c1c] to-[#2c2c2c] px-4 py-3.5 text-white">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/20 text-gold">
                                <MessageCircle className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold">AI Tutor</p>
                                <p className="text-[11px] text-white/50">
                                    SA property expert · educational only
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                            aria-label="Close AI Tutor"
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
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {QUICK.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => send(q)}
                                    className="rounded-full border border-charcoal/10 bg-white px-2.5 py-1 text-[11px] font-medium text-charcoal/60 hover:border-[#dc2626]/30 hover:text-charcoal disabled:opacity-50"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
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
                                placeholder="Ask any SA property question…"
                                className="h-11 flex-1 rounded-full border border-charcoal/10 bg-white px-4 text-sm outline-none focus:border-[#dc2626]/35 focus:ring-2 focus:ring-[#dc2626]/15 disabled:opacity-60"
                            />
                            <button
                                type="submit"
                                disabled={busy || !input.trim()}
                                className={`${LEARN_BTN_PRIMARY} !h-11 !px-4 disabled:opacity-50`}
                            >
                                Ask
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}
