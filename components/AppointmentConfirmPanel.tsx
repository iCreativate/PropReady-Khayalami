'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export interface ConfirmableViewing {
    id: string;
    propertyTitle: string;
    propertyAddress?: string;
    date: string;
    time: string;
    buyerEmail?: string | null;
    sellerEmail?: string | null;
    buyerName?: string | null;
    sellerName?: string | null;
    buyerConfirmedAt?: string | null;
    sellerConfirmedAt?: string | null;
    contactEmail?: string | null;
    contactType?: 'buyer' | 'seller' | null;
}

interface AppointmentConfirmPanelProps {
    viewings: ConfirmableViewing[];
    userEmail: string;
    party: 'buyer' | 'seller';
    onConfirmed?: () => void;
}

function norm(email?: string | null) {
    return (email || '').trim().toLowerCase();
}

function needsUserConfirmation(v: ConfirmableViewing, party: 'buyer' | 'seller', userEmail: string): boolean {
    const email = norm(userEmail);
    const hasDual = !!(norm(v.buyerEmail) && norm(v.sellerEmail));
    if (!hasDual) return false;

    if (party === 'buyer') {
        if (norm(v.buyerEmail) !== email) return false;
        return !v.buyerConfirmedAt;
    }
    if (norm(v.sellerEmail) !== email) return false;
    return !v.sellerConfirmedAt;
}

export default function AppointmentConfirmPanel({
    viewings,
    userEmail,
    party,
    onConfirmed,
}: AppointmentConfirmPanelProps) {
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const pending = viewings.filter((v) => needsUserConfirmation(v, party, userEmail));

    if (pending.length === 0) return null;

    const handleConfirm = async (viewingId: string) => {
        setConfirmingId(viewingId);
        setMessage(null);
        try {
            const res = await fetch('/api/viewings/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ viewingId, party, email: userEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Confirmation failed');

            const stored = JSON.parse(localStorage.getItem('propReady_viewingAppointments') || '[]');
            const updated = stored.map((v: ConfirmableViewing & Record<string, unknown>) => {
                if (v.id !== viewingId) return v;
                const now = new Date().toISOString();
                if (party === 'buyer') return { ...v, buyerConfirmedAt: now };
                return { ...v, sellerConfirmedAt: now };
            });
            localStorage.setItem('propReady_viewingAppointments', JSON.stringify(updated));

            if (data.fullyVerified) {
                const viewing = pending.find((v) => v.id === viewingId);
                const patchLeads = (key: string) => {
                    const list = JSON.parse(localStorage.getItem(key) || '[]');
                    const ids = [viewing?.buyerEmail, viewing?.sellerEmail].filter(Boolean);
                    const updated = list.map((l: { email?: string; appointmentVerified?: boolean }) =>
                        ids.includes(l.email?.toLowerCase())
                            ? { ...l, appointmentVerified: true }
                            : l
                    );
                    localStorage.setItem(key, JSON.stringify(updated));
                };
                patchLeads('propReady_leads');
                patchLeads('propReady_sellers');
            }

            setMessage({
                type: 'success',
                text: data.fullyVerified
                    ? 'Thank you! Both parties confirmed — this lead is now verified for your agent.'
                    : 'Appointment confirmed. Waiting for the other party to confirm.',
            });
            onConfirmed?.();
        } catch (e) {
            setMessage({
                type: 'error',
                text: e instanceof Error ? e.message : 'Could not confirm appointment',
            });
        } finally {
            setConfirmingId(null);
        }
    };

    return (
        <div className="mb-8 rounded-xl border-2 border-gold/40 bg-gold/10 p-6">
            <h3 className="text-lg font-bold text-charcoal mb-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                Confirm your appointment
            </h3>
            <p className="text-charcoal/70 text-sm mb-4">
                Your agent scheduled a viewing. Please confirm that the appointment has been arranged.
                Both buyer and seller must confirm before the lead counts as verified.
            </p>
            {message && (
                <p
                    className={`text-sm mb-4 flex items-center gap-2 ${
                        message.type === 'success' ? 'text-green-700' : 'text-red-600'
                    }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : (
                        <AlertCircle className="w-4 h-4" />
                    )}
                    {message.text}
                </p>
            )}
            <div className="space-y-3">
                {pending.map((v) => (
                    <div
                        key={v.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-white border border-charcoal/10"
                    >
                        <div>
                            <p className="font-semibold text-charcoal">{v.propertyTitle}</p>
                            <p className="text-sm text-charcoal/60">
                                {v.date} at {v.time}
                                {v.propertyAddress ? ` · ${v.propertyAddress}` : ''}
                            </p>
                            <p className="text-xs text-charcoal/50 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                With: {party === 'buyer' ? v.sellerName || 'Seller' : v.buyerName || 'Buyer'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleConfirm(v.id)}
                            disabled={confirmingId === v.id}
                            className="px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition disabled:opacity-50 whitespace-nowrap"
                        >
                            {confirmingId === v.id ? 'Confirming…' : 'I confirm this appointment'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
