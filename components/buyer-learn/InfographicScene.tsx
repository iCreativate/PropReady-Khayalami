'use client';

import type { InfographicStep } from '@/lib/buyer-learn/types';

export default function InfographicScene({
    title,
    subtitle,
    steps,
}: {
    title: string;
    subtitle: string;
    steps: InfographicStep[];
}) {
    return (
        <div className="rounded-3xl border border-charcoal/10 bg-white p-5 sm:p-8 shadow-sm overflow-hidden">
            <div className="max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal">{title}</h2>
                <p className="mt-2 text-charcoal/55">{subtitle}</p>
            </div>

            <div className="mt-8 relative">
                <div
                    className="hidden md:block absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-gold/60 via-charcoal/15 to-transparent"
                    aria-hidden
                />
                <ol className="space-y-4">
                    {steps.map((step, i) => (
                        <li
                            key={step.id}
                            className="relative flex gap-4 md:gap-6 learn-slide-in"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold text-white font-bold shadow-sm">
                                {i + 1}
                            </div>
                            <div className="flex-1 rounded-2xl border border-charcoal/8 bg-[#F8FAFC] px-4 py-4 sm:px-5">
                                <p className="font-semibold text-charcoal">{step.label}</p>
                                <p className="mt-1 text-sm leading-relaxed text-charcoal/60">
                                    {step.detail}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            <svg
                className="mt-8 w-full max-w-xl mx-auto text-gold/80"
                viewBox="0 0 400 80"
                fill="none"
                aria-hidden
            >
                <path
                    d="M20 40 H80 L100 20 H160 L180 40 H240 L260 20 H320 L340 40 H380"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="learn-draw-path"
                />
                {[20, 100, 180, 260, 340].map((x, i) => (
                    <circle key={x} cx={x + (i === 0 ? 0 : 0)} cy={i % 2 === 0 ? 40 : 20} r="6" fill="#DC2626" />
                ))}
            </svg>
        </div>
    );
}
