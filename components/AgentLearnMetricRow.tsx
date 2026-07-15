'use client';

import {
    BadgeDollarSign,
    Clock3,
    Hash,
    Percent,
    TrendingUp,
    type LucideIcon,
} from 'lucide-react';
import {
    type DetectedLearnMetric,
    type LearnMetricTone,
    type LearnMetricType,
    detectMetricsFromText,
    inferMetricTypeFromLabel,
    metricTypeToTone,
} from '@/lib/agent-learn-metrics';
import { LEARN_MOTION, LEARN_TYPE } from '@/lib/agent-learn-design';

const METRIC_TYPE_ICON: Record<LearnMetricType, LucideIcon> = {
    time: Clock3,
    money: BadgeDollarSign,
    percent: Percent,
    stat: TrendingUp,
    number: Hash,
};

const METRIC_TONE_CLASS: Record<LearnMetricTone, string> = {
    gold: 'border-gold/20 bg-gradient-to-br from-gold/[0.08] to-white',
    blue: 'border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] to-white',
    emerald: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-white',
    amber: 'border-amber-500/20 bg-gradient-to-br from-amber-500/[0.1] to-white',
    rose: 'border-rose-500/20 bg-gradient-to-br from-rose-500/[0.08] to-white',
    sky: 'border-sky-500/20 bg-gradient-to-br from-sky-500/[0.08] to-white',
    violet: 'border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-white',
};

const METRIC_ICON_CLASS: Record<LearnMetricTone, string> = {
    gold: 'bg-gold/10 text-gold',
    blue: 'bg-blue-500/10 text-blue-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-700',
    rose: 'bg-rose-500/10 text-rose-600',
    sky: 'bg-sky-500/10 text-sky-700',
    violet: 'bg-violet-500/10 text-violet-600',
};

export interface AgentLearnMetricCardProps {
    label: string;
    value: string;
    detail?: string;
    type?: LearnMetricType;
    tone?: LearnMetricTone;
}

export function AgentLearnMetricCard({
    label,
    value,
    detail,
    type,
    tone,
}: AgentLearnMetricCardProps) {
    const metricType = type ?? inferMetricTypeFromLabel(label, value);
    const metricTone = tone ?? metricTypeToTone(metricType);
    const Icon = METRIC_TYPE_ICON[metricType];

    return (
        <div
            className={`learn-metric-card ${LEARN_MOTION.fadeIn} group rounded-2xl border p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${LEARN_MOTION.card} ${METRIC_TONE_CLASS[metricTone]}`}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <p className={`${LEARN_TYPE.label} text-[#6B7280]`}>
                    {label}
                </p>
                <span
                    className={`learn-icon-hover flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${METRIC_ICON_CLASS[metricTone]}`}
                    aria-hidden
                >
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                </span>
            </div>
            <p className={LEARN_TYPE.metric}>{value}</p>
            {detail && (
                <p className="mt-2.5 text-sm leading-relaxed text-[#6B7280]">{detail}</p>
            )}
        </div>
    );
}

interface AgentLearnMetricRowProps {
    metrics?: DetectedLearnMetric[];
    fromText?: string;
    className?: string;
}

export function AgentLearnMetricRow({ metrics, fromText, className = '' }: AgentLearnMetricRowProps) {
    const items = metrics ?? (fromText ? detectMetricsFromText(fromText) : []);
    if (items.length === 0) return null;

    return (
        <div
            className={`learn-highlight-row grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 ${className}`}
        >
            {items.map((metric) => (
                <AgentLearnMetricCard
                    key={`${metric.label}-${metric.value}`}
                    label={metric.label}
                    value={metric.value}
                    detail={metric.detail}
                    type={metric.type}
                />
            ))}
        </div>
    );
}
