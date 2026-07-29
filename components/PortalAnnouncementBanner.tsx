'use client';

import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';

type Announcement = {
    id: string;
    title: string;
    body: string;
    publishedAt?: string;
};

const DISMISS_KEY = 'pr_announcement_dismissed';

export default function PortalAnnouncementBanner() {
    const [items, setItems] = useState<Announcement[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(DISMISS_KEY);
            if (raw) setDismissed(new Set(JSON.parse(raw) as string[]));
        } catch {
            /* ignore */
        }

        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch('/api/announcements', { credentials: 'include' });
                const data = await res.json().catch(() => ({}));
                if (!cancelled && Array.isArray(data.announcements)) {
                    setItems(data.announcements);
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    function dismiss(id: string) {
        setDismissed((prev) => {
            const next = new Set(prev);
            next.add(id);
            try {
                sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...next]));
            } catch {
                /* ignore */
            }
            return next;
        });
    }

    const visible = items.filter((i) => !dismissed.has(i.id)).slice(0, 2);
    if (visible.length === 0) return null;

    return (
        <div className="space-y-2 mb-4">
            {visible.map((item) => (
                <div
                    key={item.id}
                    className="rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-3 flex gap-3"
                >
                    <Megaphone className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-charcoal">{item.title}</p>
                        <p className="text-sm text-charcoal/65 mt-0.5 whitespace-pre-wrap break-words">
                            {item.body}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => dismiss(item.id)}
                        className="text-charcoal/35 hover:text-charcoal shrink-0"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
