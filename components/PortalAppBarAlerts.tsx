'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, X } from 'lucide-react';

export type PortalAppBarRole = 'buyer' | 'seller' | 'agent' | 'originator' | 'conveyancer';

type PanelKind = 'messages' | 'notifications' | null;

type PortalAppBarAlertsProps = {
    role: PortalAppBarRole;
    /** Optional unread counts for badges — if omitted, messages load from API */
    messageCount?: number;
    notificationCount?: number;
};

const HREF: Record<PortalAppBarRole, { messages: string; notifications: string }> = {
    buyer: { messages: '/dashboard/messages', notifications: '/dashboard' },
    seller: { messages: '/sellers/messages', notifications: '/sellers/dashboard' },
    agent: { messages: '/agents/messages', notifications: '/agents/dashboard' },
    originator: { messages: '/originators/messages', notifications: '/originators/dashboard' },
    conveyancer: { messages: '/conveyancers/portal/messages', notifications: '/conveyancers/portal' },
};

const COPY: Record<PortalAppBarRole, { messagesEmpty: string; notificationsEmpty: string }> = {
    buyer: {
        messagesEmpty: 'No unread messages. Open your inbox to chat with agents and originators.',
        notificationsEmpty: 'You’re all caught up. We’ll notify you about viewings and document requests.',
    },
    seller: {
        messagesEmpty: 'No unread messages. Open your inbox to chat about your listing.',
        notificationsEmpty: 'You’re all caught up. Listing and valuation updates will show here.',
    },
    agent: {
        messagesEmpty: 'No unread messages. Open your inbox for buyer, seller, and originator chats.',
        notificationsEmpty: 'You’re all caught up. New leads and viewing reminders will show here.',
    },
    originator: {
        messagesEmpty: 'No unread messages. Open your inbox to talk with buyers, sellers, and agents.',
        notificationsEmpty: 'You’re all caught up. New cases and document uploads will show here.',
    },
    conveyancer: {
        messagesEmpty: 'No unread messages. Open your inbox for client and agent transfer chats.',
        notificationsEmpty: 'You’re all caught up. Quote requests and matter updates will show here.',
    },
};

function Badge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-gold text-white text-[10px] font-bold leading-none flex items-center justify-center shadow-sm">
            {count > 9 ? '9+' : count}
        </span>
    );
}

function Panel({
    title,
    empty,
    href,
    hrefLabel,
    onClose,
}: {
    title: string;
    empty: string;
    href: string;
    hrefLabel: string;
    onClose: () => void;
}) {
    return (
        <div
            className="absolute right-0 top-[calc(100%+0.5rem)] w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-charcoal/[0.1] bg-white shadow-[0_16px_48px_rgba(44,44,44,0.16)] overflow-hidden z-50"
            role="dialog"
            aria-label={title}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal/[0.07]">
                <p className="text-sm font-semibold text-charcoal tracking-tight">{title}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl inline-flex items-center justify-center text-charcoal/45 hover:text-charcoal hover:bg-charcoal/[0.05] transition"
                    aria-label={`Close ${title}`}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="px-4 py-8 text-center">
                <p className="text-sm text-charcoal/55 leading-relaxed">{empty}</p>
                <Link
                    href={href}
                    onClick={onClose}
                    className="inline-flex mt-4 text-sm font-medium text-gold hover:underline"
                >
                    {hrefLabel}
                </Link>
            </div>
        </div>
    );
}

/**
 * Messages + notification bell for portal app bars (buyer, seller, agent, originator).
 */
export default function PortalAppBarAlerts({
    role,
    messageCount: messageCountProp,
    notificationCount = 0,
}: PortalAppBarAlertsProps) {
    const router = useRouter();
    const [open, setOpen] = useState<PanelKind>(null);
    const [messageCount, setMessageCount] = useState(messageCountProp ?? 0);
    const rootRef = useRef<HTMLDivElement>(null);
    const messagesId = useId();
    const notificationsId = useId();
    const hrefs = HREF[role];
    const copy = COPY[role];

    useEffect(() => {
        if (typeof messageCountProp === 'number') {
            setMessageCount(messageCountProp);
            return;
        }
        let cancelled = false;
        void fetch('/api/messages/conversations?unread=1', { credentials: 'include' })
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled && typeof data.unreadTotal === 'number') {
                    setMessageCount(data.unreadTotal);
                }
            })
            .catch(() => {
                /* ignore */
            });
        return () => {
            cancelled = true;
        };
    }, [messageCountProp]);

    useEffect(() => {
        if (!open) return;
        const onPointer = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(null);
        };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const btnClass =
        'relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-charcoal/60 hover:text-charcoal hover:bg-charcoal/[0.06] active:scale-[0.97] transition-[color,background-color,transform] duration-200';

    return (
        <div ref={rootRef} className="relative flex items-center gap-0.5 sm:gap-1">
            <button
                type="button"
                className={btnClass}
                aria-label="Messages"
                aria-expanded={open === 'messages'}
                aria-controls={messagesId}
                onClick={() => {
                    // Prefer opening the dedicated inbox on click when unread / desktop
                    if (open !== 'messages' && messageCount > 0) {
                        router.push(hrefs.messages);
                        return;
                    }
                    setOpen((v) => (v === 'messages' ? null : 'messages'));
                }}
            >
                <MessageSquare className="w-5 h-5" />
                <Badge count={messageCount} />
            </button>
            <button
                type="button"
                className={btnClass}
                aria-label="Notifications"
                aria-expanded={open === 'notifications'}
                aria-controls={notificationsId}
                onClick={() => setOpen((v) => (v === 'notifications' ? null : 'notifications'))}
            >
                <Bell className="w-5 h-5" />
                <Badge count={notificationCount} />
            </button>

            {open === 'messages' ? (
                <div id={messagesId}>
                    <Panel
                        title="Messages"
                        empty={copy.messagesEmpty}
                        href={hrefs.messages}
                        hrefLabel="Open inbox"
                        onClose={() => setOpen(null)}
                    />
                </div>
            ) : null}
            {open === 'notifications' ? (
                <div id={notificationsId}>
                    <Panel
                        title="Notifications"
                        empty={copy.notificationsEmpty}
                        href={hrefs.notifications}
                        hrefLabel="View dashboard"
                        onClose={() => setOpen(null)}
                    />
                </div>
            ) : null}
        </div>
    );
}
