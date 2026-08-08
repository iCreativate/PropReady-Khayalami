import type { ReactNode } from 'react';

export type LearnHeroPulseStat = {
    label: string;
    value: ReactNode;
    tone?: 'default' | 'success';
};

type LearnHeroPulseProps = {
    label?: string;
    stats: LearnHeroPulseStat[];
    className?: string;
};

/** Glass stats panel — matches portal hero pulse (e.g. Calculator pulse). */
export default function LearnHeroPulse({
    label = 'Learning pulse',
    stats,
    className = '',
}: LearnHeroPulseProps) {
    if (stats.length === 0) return null;

    return (
        <div className={`biw-hero-glass h-full ${className}`.trim()}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                {label}
            </p>
            <div className="mt-3 space-y-3">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5 last:border-0 last:pb-0"
                    >
                        <span className="text-xs text-white/55">{stat.label}</span>
                        <span
                            className={`text-sm font-semibold tabular-nums ${
                                stat.tone === 'success' ? 'text-emerald-300' : 'text-white'
                            }`}
                        >
                            {stat.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const DEFAULT_LEARN_PULSE_STATS: LearnHeroPulseStat[] = [
    { label: 'Format', value: 'Guide' },
    { label: 'Pace', value: 'Self-paced' },
    { label: 'Market', value: 'South Africa' },
    { label: 'AI Tutor', value: 'Available', tone: 'success' },
];
