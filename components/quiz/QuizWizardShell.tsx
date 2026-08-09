'use client';

import { ArrowRight } from 'lucide-react';
import {
    PORTAL_CARD,
    PORTAL_PAGE_CONTAINER,
    PORTAL_PRIMARY_BTN,
    PORTAL_SECONDARY_BTN,
} from '@/lib/portal-ui';
import { QuizTrustNote } from '@/components/quiz/quiz-ui';
import '@/components/quiz/quiz-wizard.css';

type QuizWizardShellProps = {
    title: string;
    subtitle?: string;
    currentStep: number;
    totalSteps: number;
    onPrevious: () => void;
    onNext: () => void;
    previousDisabled?: boolean;
    nextLabel: string;
    children: React.ReactNode;
    className?: string;
};

export default function QuizWizardShell({
    title,
    subtitle,
    currentStep,
    totalSteps,
    onPrevious,
    onNext,
    previousDisabled = false,
    nextLabel,
    children,
    className = '',
}: QuizWizardShellProps) {
    const progressPct = Math.round((currentStep / totalSteps) * 100);

    return (
        <div className={`quiz-wizard relative min-h-[calc(100vh-4.25rem)] bg-[#F8FAFC] py-8 sm:py-10 ${className}`}>
            <div className={`${PORTAL_PAGE_CONTAINER} relative z-10 mx-auto w-full max-w-3xl`}>
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/45">
                        <span>
                            Step {currentStep} of {totalSteps}
                        </span>
                        <span className="tabular-nums text-charcoal/55">{progressPct}%</span>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                        {Array.from({ length: totalSteps }, (_, i) => (
                            <span
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                    i + 1 <= currentStep ? 'bg-gold' : 'bg-charcoal/10'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                <div className={`${PORTAL_CARD} flex min-h-[520px] flex-col p-6 sm:p-8 md:p-10`}>
                    <header className="mb-8 text-center">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/40">
                            PropReady assessment
                        </p>
                        <h1 className="biw-sec-title text-[1.75rem] sm:text-[2rem] md:text-[2.125rem]">
                            {title}
                        </h1>
                        {subtitle ? (
                            <p className="biw-sec-sub mx-auto mt-3 max-w-xl text-[15px]">{subtitle}</p>
                        ) : null}
                    </header>

                    <div className="flex-grow quiz-step-enter">{children}</div>

                    <div className="mt-10 flex flex-col-reverse gap-3 border-t border-charcoal/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={onPrevious}
                            disabled={previousDisabled}
                            className={`${PORTAL_SECONDARY_BTN} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={onNext}
                            className={`${PORTAL_PRIMARY_BTN} inline-flex w-full items-center justify-center gap-2 sm:w-auto`}
                        >
                            <span>{nextLabel}</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <QuizTrustNote />
            </div>

            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.35]" aria-hidden>
                <div className="absolute -left-16 top-16 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
                <div className="absolute -right-16 bottom-16 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />
            </div>
        </div>
    );
}
