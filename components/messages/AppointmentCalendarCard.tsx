'use client';

import { Calendar, Check, RotateCcw, Undo2, X } from 'lucide-react';

export function toDatetimeLocalValue(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentCalendarCard({
    meta,
    body,
    mine,
    sending,
    objecting,
    reproposing,
    suggestStarts,
    suggestNotes,
    onApprove,
    onStartObject,
    onCancelObject,
    onSuggestStartsChange,
    onSuggestNotesChange,
    onSubmitObject,
    onRetract,
    onStartRepropose,
    onCancelRepropose,
    onSubmitRepropose,
}: {
    meta: Record<string, unknown>;
    body: string | null;
    mine: boolean;
    sending: boolean;
    objecting: boolean;
    reproposing?: boolean;
    suggestStarts: string;
    suggestNotes: string;
    onApprove: () => void;
    onStartObject: () => void;
    onCancelObject: () => void;
    onSuggestStartsChange: (value: string) => void;
    onSuggestNotesChange: (value: string) => void;
    onSubmitObject: () => void;
    onRetract?: () => void;
    onStartRepropose?: () => void;
    onCancelRepropose?: () => void;
    onSubmitRepropose?: () => void;
}) {
    const startsAt = meta.startsAt ? String(meta.startsAt) : '';
    const starts = startsAt ? new Date(startsAt) : null;
    const validStarts = starts && !Number.isNaN(starts.getTime()) ? starts : null;
    const status = String(meta.status || 'proposed');
    const location = meta.location ? String(meta.location) : '';
    const notes = meta.notes ? String(meta.notes) : '';
    const month = validStarts
        ? validStarts.toLocaleString('en-ZA', { month: 'short' }).toUpperCase()
        : '—';
    const day = validStarts ? String(validStarts.getDate()) : '–';
    const weekday = validStarts
        ? validStarts.toLocaleString('en-ZA', { weekday: 'long' })
        : 'Appointment';
    const timeLabel = validStarts
        ? validStarts.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
        : '';
    const dateLabel = validStarts
        ? validStarts.toLocaleDateString('en-ZA', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : body || 'Proposed appointment';

    const statusLabel =
        status === 'accepted'
            ? 'Approved'
            : status === 'declined'
              ? meta.suggestedStartsAt
                  ? 'Objected · new time suggested'
                  : 'Objected'
              : status === 'cancelled'
                ? 'Retracted'
                : 'Awaiting response';

    const statusTone =
        status === 'accepted'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : status === 'declined'
              ? 'bg-red-50 text-red-700 border-red-200'
              : status === 'cancelled'
                ? 'bg-charcoal/5 text-charcoal/55 border-charcoal/10'
                : 'bg-amber-50 text-amber-800 border-amber-200';

    const canRespond = status === 'proposed' && !mine;
    const canManageApproved = status === 'accepted' && Boolean(onRetract && onStartRepropose);

    return (
        <div className="w-full max-w-sm rounded-2xl border border-charcoal/[0.1] bg-white shadow-[0_2px_14px_rgba(44,44,44,0.06)] overflow-hidden">
            <div className="flex">
                <div className="w-[4.5rem] shrink-0 bg-gold text-white flex flex-col items-center justify-center py-4 px-2">
                    <Calendar className="w-4 h-4 mb-1 opacity-90" />
                    <p className="text-[10px] font-semibold tracking-[0.14em]">{month}</p>
                    <p className="text-2xl font-bold leading-none mt-0.5">{day}</p>
                </div>
                <div className="flex-1 min-w-0 p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-charcoal truncate">{weekday}</p>
                            <p className="text-xs text-charcoal/55 mt-0.5">{dateLabel}</p>
                            {timeLabel ? (
                                <p className="text-sm font-medium text-charcoal mt-1">{timeLabel}</p>
                            ) : null}
                        </div>
                        <span
                            className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusTone}`}
                        >
                            {statusLabel}
                        </span>
                    </div>
                    {location ? (
                        <p className="text-xs text-charcoal/55 truncate">Location: {location}</p>
                    ) : null}
                    {notes ? (
                        <p className="text-xs text-charcoal/50 line-clamp-2">{notes}</p>
                    ) : null}

                    {canRespond && !objecting ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                type="button"
                                disabled={sending}
                                onClick={onApprove}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                            </button>
                            <button
                                type="button"
                                disabled={sending}
                                onClick={onStartObject}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-charcoal/15 text-charcoal hover:bg-charcoal/[0.04] disabled:opacity-60"
                            >
                                <X className="w-3.5 h-3.5" />
                                Object
                            </button>
                        </div>
                    ) : null}

                    {canRespond && objecting ? (
                        <div className="pt-2 space-y-2 border-t border-charcoal/[0.08]">
                            <p className="text-xs font-medium text-charcoal">
                                Suggest a new date & time
                            </p>
                            <input
                                type="datetime-local"
                                required
                                value={suggestStarts}
                                onChange={(e) => onSuggestStartsChange(e.target.value)}
                                className="w-full h-10 rounded-xl border border-charcoal/[0.12] px-3 text-sm text-charcoal"
                            />
                            <textarea
                                value={suggestNotes}
                                onChange={(e) => onSuggestNotesChange(e.target.value)}
                                rows={2}
                                placeholder="Optional note for your suggestion"
                                className="w-full rounded-xl border border-charcoal/[0.12] px-3 py-2 text-sm text-charcoal"
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={sending || !suggestStarts}
                                    onClick={onSubmitObject}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white disabled:opacity-60"
                                >
                                    Send suggestion
                                </button>
                                <button
                                    type="button"
                                    disabled={sending}
                                    onClick={onCancelObject}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal/60 hover:bg-charcoal/[0.04]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {canManageApproved && !reproposing ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                type="button"
                                disabled={sending}
                                onClick={onRetract}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-charcoal/15 text-charcoal hover:bg-charcoal/[0.04] disabled:opacity-60"
                            >
                                <Undo2 className="w-3.5 h-3.5" />
                                Retract
                            </button>
                            <button
                                type="button"
                                disabled={sending}
                                onClick={onStartRepropose}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white disabled:opacity-60"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Re-propose
                            </button>
                        </div>
                    ) : null}

                    {canManageApproved && reproposing ? (
                        <div className="pt-2 space-y-2 border-t border-charcoal/[0.08]">
                            <p className="text-xs font-medium text-charcoal">
                                Propose a new date & time
                            </p>
                            <input
                                type="datetime-local"
                                required
                                value={suggestStarts}
                                onChange={(e) => onSuggestStartsChange(e.target.value)}
                                className="w-full h-10 rounded-xl border border-charcoal/[0.12] px-3 text-sm text-charcoal"
                            />
                            <textarea
                                value={suggestNotes}
                                onChange={(e) => onSuggestNotesChange(e.target.value)}
                                rows={2}
                                placeholder="Optional note"
                                className="w-full rounded-xl border border-charcoal/[0.12] px-3 py-2 text-sm text-charcoal"
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={sending || !suggestStarts}
                                    onClick={onSubmitRepropose}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-white disabled:opacity-60"
                                >
                                    Send new proposal
                                </button>
                                <button
                                    type="button"
                                    disabled={sending}
                                    onClick={onCancelRepropose}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal/60 hover:bg-charcoal/[0.04]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {mine && status === 'proposed' ? (
                        <p className="text-[11px] text-charcoal/45 pt-0.5">
                            Waiting for the other party to approve or object
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
