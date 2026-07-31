'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { CC_INPUT, CC_LABEL } from '@/components/conveyancer-connect/cc-ui';
import { isLiveFirmId, upsertThread } from '@/lib/conveyancer-connect';
import { PORTAL_PRIMARY_BTN, PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

function ModalShell({
    title,
    children,
    onClose,
}: {
    title: string;
    children: ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
            <div
                role="dialog"
                aria-modal
                aria-label={title}
                className="relative z-10 w-full max-w-lg rounded-[1.25rem] border border-charcoal/[0.08] bg-white p-5 shadow-2xl sm:p-6"
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-charcoal">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-charcoal/50 hover:bg-charcoal/[0.04]"
                        aria-label="Close dialog"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export function QuoteModal({
    firmIds,
    firmLabel,
    onClose,
    onDone,
}: {
    firmIds: string[];
    firmLabel: string;
    onClose: () => void;
    onDone?: () => void;
}) {
    const [propertyType, setPropertyType] = useState('Residential');
    const [location, setLocation] = useState('');
    const [purchasePrice, setPurchasePrice] = useState(2_500_000);
    const [bondAmount, setBondAmount] = useState(2_000_000);
    const [timeline, setTimeline] = useState('8–12 weeks');
    const [notes, setNotes] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const liveIds = firmIds.filter(isLiveFirmId);
    const demoOnly = liveIds.length === 0;

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!name.trim() || !email.trim()) {
            setError('Name and email are required so the firm can reply.');
            return;
        }
        if (demoOnly) {
            setError(
                'This listing is sample data. Browse verified PropReady firms to send a live quote request.'
            );
            return;
        }
        setLoading(true);
        try {
            let lastError = '';
            let ok = 0;
            for (const firmId of liveIds) {
                const res = await fetch('/api/conveyancers/quotes', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conveyancerId: firmId,
                        propertyType,
                        location,
                        purchasePrice,
                        bondAmount,
                        timeline,
                        notes,
                        name: name.trim(),
                        email: email.trim(),
                    }),
                });
                if (res.ok) ok += 1;
                else {
                    const data = await res.json().catch(() => ({}));
                    lastError = String(data.error || 'Could not submit quote request');
                }
            }
            if (!ok) {
                setError(lastError || 'Could not submit quote request');
                return;
            }
            setSent(true);
            onDone?.();
        } finally {
            setLoading(false);
        }
    }

    if (sent) {
        return (
            <ModalShell title="Quote requested" onClose={onClose}>
                <p className="text-sm text-charcoal/60">
                    Your request was sent to <strong>{firmLabel}</strong>. They will see it in their
                    conveyancer portal and can follow up by email or PropReady Messages.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                    <Link href="/conveyancers/dashboard" className={PORTAL_PRIMARY_BTN}>
                        Open my dashboard
                    </Link>
                    <button type="button" className={PORTAL_SECONDARY_BTN} onClick={onClose}>
                        Done
                    </button>
                </div>
            </ModalShell>
        );
    }

    return (
        <ModalShell title="Request a quote" onClose={onClose}>
            <form className="space-y-3" onSubmit={submit}>
                <p className="text-sm text-charcoal/55">Sending to {firmLabel}</p>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <div>
                    <label className={CC_LABEL}>Your name</label>
                    <input className={CC_INPUT} required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <label className={CC_LABEL}>Email</label>
                    <input
                        className={CC_INPUT}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className={CC_LABEL}>Property type</label>
                    <select className={CC_INPUT} value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                        <option>Residential</option>
                        <option>Commercial</option>
                        <option>Sectional Title</option>
                        <option>Development</option>
                        <option>Investment</option>
                    </select>
                </div>
                <div>
                    <label className={CC_LABEL}>Location</label>
                    <input
                        className={CC_INPUT}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        placeholder="Suburb, city"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={CC_LABEL}>Purchase price</label>
                        <input
                            className={CC_INPUT}
                            type="number"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className={CC_LABEL}>Bond amount</label>
                        <input
                            className={CC_INPUT}
                            type="number"
                            value={bondAmount}
                            onChange={(e) => setBondAmount(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div>
                    <label className={CC_LABEL}>Timeline</label>
                    <input className={CC_INPUT} value={timeline} onChange={(e) => setTimeline(e.target.value)} />
                </div>
                <div>
                    <label className={CC_LABEL}>Special requests</label>
                    <textarea className={CC_INPUT} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="flex gap-2 pt-2">
                    <button type="submit" className={PORTAL_PRIMARY_BTN} disabled={loading}>
                        {loading ? 'Submitting…' : 'Submit request'}
                    </button>
                    <button type="button" className={PORTAL_SECONDARY_BTN} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

export function BookModal({
    firmId,
    firmLabel,
    onClose,
    onDone,
}: {
    firmId: string;
    firmLabel: string;
    onClose: () => void;
    onDone?: () => void;
}) {
    const [type, setType] = useState<'virtual' | 'office' | 'phone'>('virtual');
    const [slot, setSlot] = useState('Tomorrow 10:00');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!isLiveFirmId(firmId)) {
            setError(
                'This listing is sample data. Book consultations with verified PropReady firms from the directory.'
            );
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/conveyancers/consultations', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conveyancerId: firmId,
                    type,
                    slot,
                    name,
                    email,
                    phone,
                    notes,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(String(data.error || 'Could not book consultation'));
                return;
            }
            setSent(true);
            onDone?.();
        } finally {
            setLoading(false);
        }
    }

    if (sent) {
        return (
            <ModalShell title="Consultation booked" onClose={onClose}>
                <p className="text-sm text-charcoal/60">
                    Request sent to <strong>{firmLabel}</strong> for <strong>{slot}</strong> ({type}). The
                    firm will confirm the appointment from their portal.
                </p>
                <button type="button" className={`${PORTAL_PRIMARY_BTN} mt-5`} onClick={onClose}>
                    Done
                </button>
            </ModalShell>
        );
    }

    return (
        <ModalShell title="Book consultation" onClose={onClose}>
            <form className="space-y-3" onSubmit={submit}>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <div>
                    <label className={CC_LABEL}>Type</label>
                    <select
                        className={CC_INPUT}
                        value={type}
                        onChange={(e) => setType(e.target.value as typeof type)}
                    >
                        <option value="virtual">Virtual</option>
                        <option value="office">Office</option>
                        <option value="phone">Phone</option>
                    </select>
                </div>
                <div>
                    <label className={CC_LABEL}>Preferred time</label>
                    <select className={CC_INPUT} value={slot} onChange={(e) => setSlot(e.target.value)}>
                        <option>Tomorrow 10:00</option>
                        <option>Tomorrow 14:30</option>
                        <option>Friday 09:00</option>
                        <option>Monday 11:00</option>
                        <option>Flexible — firm to propose</option>
                    </select>
                </div>
                <div>
                    <label className={CC_LABEL}>Full name</label>
                    <input className={CC_INPUT} required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={CC_LABEL}>Email</label>
                        <input
                            className={CC_INPUT}
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={CC_LABEL}>Phone</label>
                        <input className={CC_INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className={CC_LABEL}>Notes</label>
                    <textarea className={CC_INPUT} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="flex gap-2 pt-2">
                    <button type="submit" className={PORTAL_PRIMARY_BTN} disabled={loading}>
                        {loading ? 'Booking…' : 'Confirm booking'}
                    </button>
                    <button type="button" className={PORTAL_SECONDARY_BTN} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

export function MessagePanel({
    firmId,
    firmLabel,
    onClose,
}: {
    firmId: string;
    firmLabel: string;
    onClose: () => void;
}) {
    const [body, setBody] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [needLogin, setNeedLogin] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!body.trim()) return;
        setError('');
        if (!isLiveFirmId(firmId)) {
            setError('Sample listings cannot receive live messages. Choose a verified PropReady firm.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/messages/conversations', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: `Enquiry — ${firmLabel}`,
                    contextType: 'conveyancing',
                    contextId: firmId,
                    initialMessage: body.trim(),
                    participants: [
                        {
                            accountType: 'conveyancer',
                            profileId: firmId,
                            displayName: firmLabel,
                        },
                    ],
                }),
            });
            if (res.status === 401) {
                setNeedLogin(true);
                upsertThread(firmId, body.trim());
                return;
            }
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(String(data.error || 'Could not start conversation'));
                return;
            }
            setSent(true);
            setBody('');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ModalShell title={`Message ${firmLabel}`} onClose={onClose}>
            {needLogin ? (
                <div className="space-y-3">
                    <p className="text-sm text-charcoal/70">
                        Sign in as a buyer or seller to open a live inbox thread with this firm.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/auth/login" className={PORTAL_PRIMARY_BTN}>
                            Sign in
                        </Link>
                        <button type="button" className={PORTAL_SECONDARY_BTN} onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            ) : sent ? (
                <div className="space-y-3">
                    <p className="text-sm text-charcoal/70">
                        Message delivered. Continue the conversation from your PropReady Messages inbox.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/dashboard/messages" className={PORTAL_PRIMARY_BTN}>
                            Open messages
                        </Link>
                        <button type="button" className={PORTAL_SECONDARY_BTN} onClick={onClose}>
                            Done
                        </button>
                    </div>
                </div>
            ) : (
                <form className="space-y-3" onSubmit={submit}>
                    <p className="text-xs text-charcoal/50">
                        Opens a live PropReady conversation with this firm (sign-in required).
                    </p>
                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    <textarea
                        className={CC_INPUT}
                        rows={4}
                        required
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Introduce your transfer or ask about fees…"
                    />
                    <div className="flex gap-2">
                        <button type="submit" className={PORTAL_PRIMARY_BTN} disabled={loading}>
                            {loading ? 'Sending…' : 'Send message'}
                        </button>
                        <button type="button" className={PORTAL_SECONDARY_BTN} onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </ModalShell>
    );
}
