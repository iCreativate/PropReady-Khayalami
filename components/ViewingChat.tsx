'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';

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
    const msgs = propMessages?.length ? propMessages : (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(STORAGE_KEY(viewingId)) || '[]') : []);
    setMessages(msgs);
  }, [viewingId, propMessages]);

  // Poll for new messages when DB is configured (every 5s)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/viewings/chat?viewingId=${encodeURIComponent(viewingId)}`);
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (Array.isArray(data.messages)) {
            setMessages((prev) => {
              const next = data.messages;
              if (next.length === 0 && prev.length > 0) return prev; // Keep local if DB empty
              if (prev.length === next.length && prev.every((p, i) => p.id === next[i]?.id)) return prev;
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
    <div className={`bg-white rounded-xl border border-charcoal/10 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-charcoal/10 flex items-center gap-2 bg-charcoal/5">
        <MessageCircle className="w-5 h-5 text-gold" />
        <span className="font-semibold text-charcoal">Chat</span>
      </div>
      <div
        ref={scrollRef}
        className="h-48 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-charcoal/50 text-sm text-center py-4">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === currentUserRole ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.sender === currentUserRole
                    ? 'bg-gold text-white'
                    : 'bg-charcoal/10 text-charcoal'
                }`}
              >
                <p className="font-medium text-xs opacity-80 mb-0.5">
                  {msg.sender === 'agent' ? 'Agent' : 'Contact'}
                </p>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t border-charcoal/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-lg border border-charcoal/20 text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-gold"
          disabled={sending}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="px-4 py-2 rounded-lg bg-gold text-white font-semibold hover:bg-gold-600 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
}
