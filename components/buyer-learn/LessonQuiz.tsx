'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, PartyPopper, XCircle } from 'lucide-react';
import type { QuizQuestion } from '@/lib/buyer-learn/types';
import { PORTAL_PRIMARY_BTN } from '@/lib/portal-ui';

export default function LessonQuiz({
    title,
    questions,
    onComplete,
}: {
    title: string;
    questions: QuizQuestion[];
    onComplete: (scorePct: number) => void;
}) {
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [done, setDone] = useState(false);

    const q = questions[index];
    const scorePct = useMemo(
        () => Math.round((correctCount / Math.max(questions.length, 1)) * 100),
        [correctCount, questions.length]
    );

    function submit() {
        if (!selected || !q) return;
        const ok = selected === q.correctId;
        if (ok) setCorrectCount((c) => c + 1);
        setRevealed(true);
    }

    function next() {
        if (!q) return;
        if (index >= questions.length - 1) {
            setDone(true);
            onComplete(Math.round((correctCount / questions.length) * 100));
            return;
        }
        setIndex((i) => i + 1);
        setSelected(null);
        setRevealed(false);
    }

    if (done) {
        return (
            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 text-center shadow-sm">
                <PartyPopper className="mx-auto h-10 w-10 text-emerald-600" />
                <h2 className="mt-4 text-2xl font-bold text-charcoal">Quiz complete</h2>
                <p className="mt-2 text-charcoal/60">
                    You scored <span className="font-semibold text-charcoal">{scorePct}%</span> (
                    {correctCount}/{questions.length})
                </p>
                <p className="mt-4 text-sm text-emerald-800">
                    {scorePct >= 80
                        ? 'Excellent — Bond Basics is sticking.'
                        : 'Good effort — skim the knowledge blocks once more, then continue.'}
                </p>
            </div>
        );
    }

    if (!q) return null;

    const isCorrect = selected === q.correctId;

    return (
        <div className="rounded-3xl border border-charcoal/10 bg-white p-5 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-charcoal">{title}</h2>
                <span className="text-xs font-semibold tabular-nums text-charcoal/45">
                    {index + 1}/{questions.length}
                </span>
            </div>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
                {q.kind === 'true-false'
                    ? 'True or false'
                    : q.kind === 'scenario'
                      ? 'Scenario'
                      : 'Multiple choice'}
            </p>
            <p className="mt-4 text-base sm:text-lg font-medium text-charcoal leading-relaxed">
                {q.prompt}
            </p>

            <div className="mt-5 space-y-2" role="radiogroup" aria-label="Answer options">
                {q.options.map((opt) => {
                    const active = selected === opt.id;
                    let stateClass = 'border-charcoal/10 hover:border-charcoal/25';
                    if (revealed && opt.id === q.correctId) {
                        stateClass = 'border-emerald-400 bg-emerald-50';
                    } else if (revealed && active && !isCorrect) {
                        stateClass = 'border-rose-300 bg-rose-50';
                    } else if (active) {
                        stateClass = 'border-gold bg-gold/10';
                    }
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={revealed}
                            onClick={() => setSelected(opt.id)}
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${stateClass}`}
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/20 text-[11px] font-bold">
                                {opt.id.slice(0, 1).toUpperCase()}
                            </span>
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {revealed ? (
                <div
                    className={`mt-4 flex gap-2 rounded-xl px-4 py-3 text-sm ${
                        isCorrect
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-100'
                            : 'bg-rose-50 text-rose-900 border border-rose-100'
                    }`}
                    role="status"
                >
                    {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                    ) : (
                        <XCircle className="h-5 w-5 shrink-0" />
                    )}
                    <p>{q.explanation}</p>
                </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
                {!revealed ? (
                    <button
                        type="button"
                        className={PORTAL_PRIMARY_BTN}
                        disabled={!selected}
                        onClick={submit}
                    >
                        Check answer
                    </button>
                ) : (
                    <button type="button" className={PORTAL_PRIMARY_BTN} onClick={next}>
                        {index >= questions.length - 1 ? 'Finish quiz' : 'Next question'}
                    </button>
                )}
            </div>
        </div>
    );
}
