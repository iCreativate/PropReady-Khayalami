'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Lightbulb,
    Scale,
    Sparkles,
} from 'lucide-react';
import type { LessonChapter } from '@/lib/buyer-learn/types';
import ChapterIllustrationArt from '@/components/buyer-learn/course/ChapterIllustrationArt';
import SectionReveal from '@/components/buyer-learn/SectionReveal';
import { LEARN_BTN_GHOST, LEARN_BTN_PRIMARY, LEARN_LABEL } from '@/lib/learn-course-ui';

function formatZar(n: number): string {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        maximumFractionDigits: 0,
    }).format(n);
}

function journeyCta(hubBasePath?: string): { href: string; label: string; seller: boolean } {
    if (hubBasePath === '/sellers') {
        return { href: '/sellers/property-quiz', label: 'Book a Free Valuation', seller: true };
    }
    return { href: '/get-started', label: 'Start your journey', seller: false };
}

export default function CourseChapter({
    chapter,
    index,
    total,
    status = 'open',
    isReview = false,
    hubBasePath = '/learn',
    onFinishChapter,
    onReopen,
    onCloseReview,
}: {
    chapter: LessonChapter;
    index: number;
    total: number;
    status?: 'open' | 'completed' | 'locked';
    isReview?: boolean;
    hubBasePath?: string;
    onFinishChapter?: () => void;
    onReopen?: () => void;
    onCloseReview?: () => void;
}) {
    const tinted = chapter.tone === 'dark';
    const [picked, setPicked] = useState<string | null>(null);
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [quizPick, setQuizPick] = useState<string | null>(null);
    const [deepOpen, setDeepOpen] = useState(false);
    const [quizDone, setQuizDone] = useState(false);
    const journey = journeyCta(hubBasePath);

    const shell = tinted
        ? 'bg-gradient-to-br from-[#fffcf8] via-white to-[#f7f4f0] text-charcoal border-[rgba(28,28,28,0.08)] shadow-[0_1px_2px_rgba(28,28,28,0.04),0_12px_40px_rgba(28,28,28,0.05)]'
        : 'bg-[rgba(255,252,248,0.95)] text-charcoal border-[rgba(28,28,28,0.08)] shadow-[0_1px_2px_rgba(28,28,28,0.04),0_12px_40px_rgba(28,28,28,0.05)]';
    const muted = 'text-charcoal/55';
    const card =
        'rounded-[1.25rem] border border-[rgba(28,28,28,0.07)] bg-white shadow-[0_4px_20px_rgba(28,28,28,0.03)]';
    const glass =
        'rounded-[1.25rem] border border-[rgba(28,28,28,0.07)] bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(28,28,28,0.04)]';

    function submitQuiz() {
        if (!quizPick) return;
        setQuizDone(true);
    }

    const journeyLink = (
        <Link href={journey.href} className={`${LEARN_BTN_GHOST} inline-flex`}>
            {journey.seller ? (
                <Calendar className="h-4 w-4" strokeWidth={2} />
            ) : (
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
            )}
            {journey.label}
        </Link>
    );

    if (status === 'completed') {
        return (
            <section
                id={`learn-chapter-${chapter.id}`}
                data-learn-section={chapter.id}
                className="scroll-mt-28"
            >
                <button
                    type="button"
                    onClick={onReopen}
                    className="flex w-full items-center gap-4 rounded-[1.25rem] border border-emerald-200/80 bg-emerald-50/60 px-5 py-4 text-left transition hover:bg-emerald-50"
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                            Chapter {String(index + 1).padStart(2, '0')} complete
                        </span>
                        <span className="mt-0.5 block font-semibold text-charcoal tracking-tight">
                            {chapter.title}
                        </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-emerald-700/80">Review</span>
                </button>
            </section>
        );
    }

    if (status === 'locked') {
        return (
            <section
                id={`learn-chapter-${chapter.id}`}
                data-learn-section={chapter.id}
                className="scroll-mt-28"
            >
                <div className="flex w-full items-center gap-4 rounded-[1.25rem] border border-charcoal/[0.06] bg-charcoal/[0.02] px-5 py-4 text-charcoal/40">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.06] text-[12px] font-bold tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold uppercase tracking-[0.14em]">
                            Locked
                        </span>
                        <span className="mt-0.5 block font-semibold tracking-tight text-charcoal/50">
                            {chapter.title}
                        </span>
                    </span>
                    <span className="shrink-0 text-xs">Finish previous first</span>
                </div>
            </section>
        );
    }

    return (
        <section
            id={`learn-chapter-${chapter.id}`}
            data-learn-section={chapter.id}
            className={`relative overflow-hidden rounded-[1.5rem] border ${shell} scroll-mt-28 w-full`}
        >
            <div className="relative space-y-10 p-6 sm:p-8 lg:p-12 xl:px-14 xl:py-14 w-full max-w-none">
                {isReview ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-charcoal/[0.06] bg-charcoal/[0.02] px-4 py-3">
                        <p className="text-sm text-charcoal/60">Reviewing a completed chapter</p>
                        <button
                            type="button"
                            onClick={onCloseReview}
                            className="rounded-full border border-charcoal/10 bg-white px-4 py-2 text-xs font-semibold text-charcoal hover:border-charcoal/20"
                        >
                            Close review
                        </button>
                    </div>
                ) : null}

                {/* 1. Cinematic header */}
                <SectionReveal>
                    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                                Chapter {String(index + 1).padStart(2, '0')} of{' '}
                                {String(total).padStart(2, '0')}
                                <span className="mx-2 opacity-40">·</span>
                                {chapter.eyebrow}
                            </p>
                            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight leading-[1.08]">
                                {chapter.title}
                            </h2>
                            <p
                                className={`mt-4 text-base sm:text-lg leading-relaxed max-w-2xl whitespace-pre-line ${muted}`}
                            >
                                {chapter.plainEnglish}
                            </p>
                        </div>
                        <div className="flex justify-center lg:justify-end">
                            <ChapterIllustrationArt kind={chapter.illustration} dark={false} />
                        </div>
                    </div>
                </SectionReveal>

                {/* 3. Why this matters */}
                <SectionReveal align="right">
                    <div className={`${glass} p-5 sm:p-6 flex gap-4`}>
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                            <Lightbulb className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                                Why this matters
                            </p>
                            <p className="mt-2 text-sm sm:text-base leading-relaxed text-charcoal/75 whitespace-pre-line">
                                {chapter.whyItMatters}
                            </p>
                        </div>
                    </div>
                </SectionReveal>

                {/* 4. Interactive infographic */}
                <SectionReveal>
                    <div>
                        <h3 className="text-xl font-semibold tracking-tight">See it move</h3>
                        <p className={`mt-1 text-sm ${muted}`}>
                            Expand each step for a full walkthrough — this is where the learning happens.
                        </p>
                        <ol className="mt-5 relative space-y-3">
                            <div
                                className="absolute left-[15px] top-3 bottom-3 w-px bg-gold/40"
                                aria-hidden
                            />
                            {chapter.infographic.map((step, i) => (
                                <details
                                    key={step.id}
                                    className={`group relative ${card} open:ring-1 open:ring-gold/30`}
                                    open={i === 0}
                                >
                                    <summary className="flex cursor-pointer list-none items-start gap-4 p-4 sm:p-5">
                                        <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-white">
                                            {i + 1}
                                        </span>
                                        <span className="pt-1 font-semibold text-charcoal">{step.label}</span>
                                        <ChevronDown className="ml-auto mt-1 h-4 w-4 opacity-40 transition group-open:rotate-180" />
                                    </summary>
                                    <div
                                        className={`space-y-3 px-4 pb-5 sm:px-5 pl-[3.75rem] text-sm sm:text-[15px] leading-relaxed text-charcoal/70 whitespace-pre-line`}
                                    >
                                        {step.detail}
                                    </div>
                                </details>
                            ))}
                        </ol>
                    </div>
                </SectionReveal>

                {/* 5. SA case study */}
                <SectionReveal align="left">
                    <div className={`${card} overflow-hidden`}>
                        <div className="px-5 py-4 sm:px-6 border-b border-charcoal/10">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                                South African case study
                            </p>
                            <h3 className="mt-1 text-xl font-semibold">{chapter.caseStudy.headline}</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-5 sm:p-6">
                                <p className={`text-sm leading-relaxed whitespace-pre-line ${muted}`}>
                                    {chapter.caseStudy.story}
                                </p>
                                <p className={`mt-4 text-xs ${muted}`}>
                                    {chapter.caseStudy.city} · {chapter.caseStudy.propertyLabel}
                                </p>
                            </div>
                            <div className="p-5 sm:p-6 bg-charcoal/[0.03]">
                                {chapter.caseStudy.highlights &&
                                chapter.caseStudy.highlights.length > 0 ? (
                                    <dl className="grid grid-cols-1 gap-4 text-sm">
                                        {chapter.caseStudy.highlights.map((h) => (
                                            <div key={h.label}>
                                                <dt className={muted}>{h.label}</dt>
                                                <dd className="mt-1 font-semibold text-charcoal">
                                                    {h.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                ) : null}
                                {typeof chapter.caseStudy.price === 'number' ? (
                                    <dl
                                        className={`grid grid-cols-2 gap-4 text-sm ${
                                            chapter.caseStudy.highlights?.length ? 'mt-5 pt-5 border-t border-charcoal/10' : ''
                                        }`}
                                    >
                                        <div>
                                            <dt className={muted}>Price</dt>
                                            <dd className="mt-1 font-semibold tabular-nums">
                                                {formatZar(chapter.caseStudy.price)}
                                            </dd>
                                        </div>
                                        {typeof chapter.caseStudy.deposit === 'number' ? (
                                            <div>
                                                <dt className={muted}>Deposit</dt>
                                                <dd className="mt-1 font-semibold tabular-nums">
                                                    {formatZar(chapter.caseStudy.deposit)}
                                                </dd>
                                            </div>
                                        ) : null}
                                        {typeof chapter.caseStudy.bond === 'number' ? (
                                            <div>
                                                <dt className={muted}>Bond</dt>
                                                <dd className="mt-1 font-semibold tabular-nums">
                                                    {formatZar(chapter.caseStudy.bond)}
                                                </dd>
                                            </div>
                                        ) : null}
                                        {typeof chapter.caseStudy.monthly === 'number' ? (
                                            <div>
                                                <dt className={muted}>Est. monthly</dt>
                                                <dd className="mt-1 font-semibold tabular-nums text-gold">
                                                    {formatZar(chapter.caseStudy.monthly)}
                                                </dd>
                                            </div>
                                        ) : null}
                                    </dl>
                                ) : null}
                                <p className={`mt-4 text-xs leading-relaxed ${muted}`}>
                                    {typeof chapter.caseStudy.ratePct === 'number'
                                        ? `Illustrative ${chapter.caseStudy.ratePct}% · `
                                        : ''}
                                    {chapter.caseStudy.note}
                                </p>
                            </div>
                        </div>
                    </div>
                </SectionReveal>

                {/* 6 + 7 Mistakes + Myth vs Fact */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <SectionReveal>
                        <div className={`${card} p-5 sm:p-6 h-full`}>
                            <div className="flex items-center gap-2 text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em]">
                                    Common mistakes
                                </p>
                            </div>
                            <ul className="mt-4 space-y-3">
                                {chapter.mistakes.map((m) => (
                                    <li key={m} className={`flex gap-2.5 text-sm leading-relaxed ${muted}`}>
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                        {m}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </SectionReveal>
                    <SectionReveal align="right">
                        <div className={`${card} p-5 sm:p-6 h-full`}>
                            <div className="flex items-center gap-2 text-gold">
                                <Scale className="h-4 w-4" />
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em]">
                                    Myth vs fact
                                </p>
                            </div>
                            <div className="mt-4 space-y-3">
                                <div className="rounded-xl p-3.5 bg-charcoal/[0.03]">
                                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                                        Myth
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed">{chapter.mythFact.myth}</p>
                                </div>
                                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                        Fact
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-charcoal/80">
                                        {chapter.mythFact.fact}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </SectionReveal>
                </div>

                {/* 8. Try it yourself */}
                <SectionReveal>
                    <div className={`${glass} p-5 sm:p-7`}>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-gold" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                                Try it yourself
                            </p>
                        </div>
                        <p className="mt-3 text-lg font-semibold tracking-tight">{chapter.exercise.prompt}</p>

                        {chapter.exercise.kind === 'choice' && chapter.exercise.options ? (
                            <div className="mt-5 space-y-2.5">
                                {chapter.exercise.options.map((opt) => {
                                    const active = picked === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setPicked(opt.id)}
                                            className={`w-full text-left rounded-xl border px-4 py-3.5 text-sm transition ${
                                                active
                                                    ? opt.correct
                                                        ? 'border-emerald-500/40 bg-emerald-500/10'
                                                        : 'border-amber-500/40 bg-amber-500/10'
                                                    : 'border-charcoal/10 hover:border-gold/30 hover:bg-gold/[0.03]'
                                            }`}
                                        >
                                            <span className="font-medium">{opt.label}</span>
                                            {active ? (
                                                <span className={`mt-1.5 block text-xs leading-relaxed ${muted}`}>
                                                    {opt.feedback}
                                                </span>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}

                        {chapter.exercise.kind === 'checklist' && chapter.exercise.checklist ? (
                            <ul className="mt-5 space-y-2.5">
                                {chapter.exercise.checklist.map((item) => {
                                    const on = checked[item];
                                    return (
                                        <li key={item}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setChecked((prev) => ({ ...prev, [item]: !prev[item] }))
                                                }
                                                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                                                    on
                                                        ? 'border-gold/30 bg-gold/10'
                                                        : 'border-charcoal/10 hover:bg-charcoal/[0.02]'
                                                }`}
                                            >
                                                <CheckCircle2
                                                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                                                        on ? 'text-gold' : 'opacity-30'
                                                    }`}
                                                />
                                                <span className={on ? 'line-through opacity-70' : ''}>
                                                    {item}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                    </div>
                </SectionReveal>

                {/* Deep dive (before assessment) */}
                <SectionReveal>
                    <div className={`${card} overflow-hidden`}>
                        <button
                            type="button"
                            onClick={() => setDeepOpen((v) => !v)}
                            className="flex w-full items-center justify-between gap-3 px-5 py-4 sm:px-6 text-left"
                            aria-expanded={deepOpen}
                        >
                            <span>
                                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                                    Deep dive
                                </span>
                                <span className="mt-1 block font-semibold">{chapter.deepDive.title}</span>
                            </span>
                            <ChevronDown
                                className={`h-5 w-5 shrink-0 opacity-50 transition ${deepOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {deepOpen ? (
                            <div className="px-5 pb-5 sm:px-6 text-sm sm:text-[15px] leading-relaxed border-t border-charcoal/10 text-charcoal/70">
                                <div className="pt-4 space-y-3 whitespace-pre-line">{chapter.deepDive.body}</div>
                            </div>
                        ) : null}
                    </div>
                </SectionReveal>

                {/* Mini assessment — closes the chapter */}
                <SectionReveal>
                    <div className={`${card} p-5 sm:p-7`}>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                            Mini assessment
                        </p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight">{chapter.quiz.prompt}</h3>
                        <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Chapter quiz">
                            {chapter.quiz.options.map((opt) => {
                                const selected = quizPick === opt.id;
                                const show = quizDone && selected;
                                const correct = opt.id === chapter.quiz.correctId;
                                return (
                                    <label
                                        key={opt.id}
                                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 text-sm transition ${
                                            selected
                                                ? show && correct
                                                    ? 'border-emerald-500/40 bg-emerald-500/10'
                                                    : show
                                                      ? 'border-amber-500/40 bg-amber-500/10'
                                                      : 'border-gold/35 bg-gold/5'
                                                : 'border-charcoal/10 hover:border-gold/25'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`quiz-${chapter.id}`}
                                            className="mt-1"
                                            checked={selected}
                                            disabled={quizDone}
                                            onChange={() => setQuizPick(opt.id)}
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {!quizDone ? (
                            <button
                                type="button"
                                disabled={!quizPick}
                                onClick={submitQuiz}
                                className={`${LEARN_BTN_PRIMARY} mt-5 disabled:opacity-40`}
                            >
                                Check answer
                            </button>
                        ) : (
                            <div className="mt-5 space-y-4">
                                <p
                                    className={`text-sm leading-relaxed rounded-xl px-4 py-3 ${
                                        quizPick === chapter.quiz.correctId
                                            ? 'bg-emerald-500/10 text-emerald-800'
                                            : 'bg-charcoal/[0.04] text-charcoal/75'
                                    }`}
                                    role="status"
                                >
                                    {chapter.quiz.explanation}
                                </p>
                                <div className={`${glass} p-5 sm:p-6 text-center`}>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                                        Mini assessment done
                                    </p>
                                    <p className="mt-2 text-lg font-semibold tracking-tight">
                                        {index < total - 1
                                            ? `Up next: ${chapter.bridge.nextLabel}`
                                            : 'You finished the last chapter'}
                                    </p>
                                    <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
                                        {index < total - 1
                                            ? chapter.bridge.teaser
                                            : 'Close this chapter to unlock your course summary.'}
                                    </p>
                                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={isReview ? onCloseReview : onFinishChapter}
                                            className={`${LEARN_BTN_PRIMARY} inline-flex`}
                                        >
                                            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                                            {isReview
                                                ? 'Close review'
                                                : index < total - 1
                                                  ? 'Complete chapter & continue'
                                                  : 'Complete chapter'}
                                        </button>
                                        {journeyLink}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionReveal>
            </div>
        </section>
    );
}
