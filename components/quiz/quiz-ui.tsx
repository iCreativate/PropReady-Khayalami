'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export function quizChoiceClass(selected: boolean, hasError?: boolean) {
    if (selected) {
        return 'rounded-xl border border-gold/40 bg-gold/[0.08] text-charcoal font-semibold shadow-[0_0_0_1px_rgba(229,57,53,0.08)]';
    }
    if (hasError) {
        return 'rounded-xl border border-red-400/40 bg-red-50/60 text-charcoal font-semibold hover:bg-red-50';
    }
    return 'rounded-xl border border-charcoal/[0.08] bg-white text-charcoal/70 font-semibold hover:border-charcoal/15 hover:bg-charcoal/[0.02]';
}

export function QuizStepHeader({
    title,
    subtitle,
}: {
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="mb-6 text-center sm:text-left">
            <h2 className="biw-sec-title text-[1.5rem] sm:text-[1.75rem] mb-2">{title}</h2>
            {subtitle ? <p className="biw-sec-sub text-sm sm:text-[15px]">{subtitle}</p> : null}
        </div>
    );
}

export function QuizField({
    label,
    required,
    hint,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="quiz-field-card space-y-3">
            <div>
                <label className="form-label text-base font-semibold text-charcoal">
                    {label}
                    {required ? <span className="text-red-600"> *</span> : null}
                </label>
                {hint ? <p className="form-hint mt-1">{hint}</p> : null}
            </div>
            {children}
            {error ? (
                <p className="form-error !mt-0">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </p>
            ) : null}
        </div>
    );
}

export function QuizPublicHeader({
    backHref,
    backLabel,
}: {
    backHref: string;
    backLabel: string;
}) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-charcoal/[0.08] bg-[#F8FAFC]/90 backdrop-blur-md">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                <BrandLogo />
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-3.5 py-2 text-sm font-semibold text-charcoal transition hover:border-charcoal/20 hover:bg-charcoal/[0.03]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{backLabel}</span>
                </Link>
            </nav>
        </header>
    );
}

export function QuizTrustNote() {
    return (
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-charcoal/55">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            Your information is secure and encrypted
        </p>
    );
}
