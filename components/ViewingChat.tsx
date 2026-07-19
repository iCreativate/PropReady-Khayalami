'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import {
    AGENT_CARD,
    AGENT_ICON_IN_CARD,
    AGENT_INPUT,
    AGENT_PRIMARY_BTN,
    AGENT_TEXT_TERTIARY,
} from '@/lib/agent-portal-ui';

export interface ChatMessage {
    id: string;
    sender: 'agent' | 'contact';
    text: string;
    timestamp: string;
}

interface ViewingChatProps {
    viewingId: string;
    messages: ChatMessage[];
    currentUserRole: 'agent' | 'contact';
    onMessagesChange?: (messages: ChatMessage[]) => void;
    className?: string;
}

const STORAGE_KEY = (id: string) => `propReady_viewingChat_${id}`;

export default function ViewingChat({
    viewingId,
    messages: propMessages,
    currentUserRole,
    onMessagesChange,
    className = '',
}: ViewingChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(propMessages);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const msgs = propMessages?.length
            ? propMessages
            : typeof window !== 'undefined'
              ? JSON.parse(localStorage.getItem(STORAGE_KEY(viewingId)) || '[]')
              : [];
        setMessages(msgs);
    }, [viewingId, propMessages]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/viewings/chat?viewingId=${encodeURIComponent(viewingId)}`
                );
                if (res.ok) {
                    const data = await res.json().catch(() => ({}));
                    if (Array.isArray(data.messages)) {
                        setMessages((prev) => {
                            const next = data.messages;
                            if (next.length === 0 && prev.length > 0) return prev;
                            if (
                                prev.length === next.length &&
                                prev.every((p, i) => p.id === next[i]?.id)
                            )
                                return prev;
                            onMessagesChange?.(next);
                            return next;
                        });
                    }
                }
            } catch {
                /* ignore */
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [viewingId, onMessagesChange]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || sending) return;

        setSending(true);
        setInput('');

        const newMsg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            sender: currentUserRole,
            text,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => {
            const next = [...prev, newMsg];
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY(viewingId), JSON.stringify(next));
            }
            onMessagesChange?.(next);
            return next;
        });

        try {
            const res = await fetch('/api/viewings/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ viewingId, sender: currentUserRole, text }),
            });
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data.message) {
                    setMessages((prev) => {
                        const idx = prev.findIndex((m) => m.id === newMsg.id);
                        if (idx >= 0) return prev;
                        const next = [...prev.filter((m) => m.id !== newMsg.id), data.message];
                        if (typeof window !== 'undefined') {
                            localStorage.setItem(STORAGE_KEY(viewingId), JSON.stringify(next));
                        }
                        onMessagesChange?.(next);
                        return next;
                    });
                }
            }
        } catch {
            // localStorage already updated
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={`${AGENT_CARD} ${className}`}>
            <div className="px-5 py-4 border-b border-charcoal/[0.06] flex items-center gap-2 bg-charcoal/[0.015]">
                <MessageCircle className={`${AGENT_ICON_IN_CARD} text-gold`} />
                <span className="font-semibold text-charcoal text-sm">Chat</span>
            </div>
            <div ref={scrollRef} className="h-48 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <p className={`${AGENT_TEXT_TERTIARY} text-sm text-center py-4`}>
                        No messages yet. Start the conversation.
                    </p>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${
                                msg.sender === currentUserRole ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                                    msg.sender === currentUserRole
                                        ? 'bg-gold text-white'
                                        : 'bg-charcoal/[0.06] text-charcoal'
                                }`}
                            >
                                <p className="font-medium text-xs opacity-80 mb-0.5">
                                    {msg.sender === 'agent' ? 'Agent' : 'Contact'}
                                </p>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="p-3 border-t border-charcoal/[0.06] flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className={`flex-1 !py-2 ${AGENT_INPUT}`}
                    disabled={sending}
                />
                <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className={AGENT_PRIMARY_BTN}
                >
                    <Send className="w-4 h-4" />
                    Send
                </button>
            </div>
        </div>
    );
}
