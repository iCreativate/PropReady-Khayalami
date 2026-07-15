'use client';

import {
    AlertTriangle,
    CheckCircle,
    Hash,
    HelpCircle,
    Lightbulb,
    Scale,
    ShieldAlert,
    ShieldCheck,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import {
    Children,
    Fragment,
    isValidElement,
    type ReactNode,
} from 'react';
import { AgentLearnMetricCard, AgentLearnMetricRow } from '@/components/AgentLearnMetricRow';
import AgentLearnQuoteCard from '@/components/AgentLearnQuoteCard';
import AgentLearnTipCard from '@/components/AgentLearnTipCard';
import { extractAdviceFromText } from '@/lib/agent-learn-advice-detect';
import { detectMetricsFromText } from '@/lib/agent-learn-metrics';
import { extractQuotesFromText } from '@/lib/agent-learn-quote-detect';
import { resolveLearnSectionIcon } from '@/lib/agent-learn-section-icons';
import { LEARN_LAYOUT, LEARN_MOTION, LEARN_STEP_CARD, LEARN_TYPE } from '@/lib/agent-learn-design';
import { useLearnStep } from '@/components/AgentLearnArticleBody';

const STEP_ICON_TONES = [
    {
        wrap: 'bg-gold/10 text-gold ring-gold/20',
        badge: 'bg-gold/10 text-gold border-gold/20',
    },
    {
        wrap: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
        badge: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    },
    {
        wrap: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
        badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    },
    {
        wrap: 'bg-violet-500/10 text-violet-600 ring-violet-500/20',
        badge: 'bg-violet-500/10 text-violet-700 border-violet-500/20',
    },
    {
        wrap: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
        badge: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
    },
] as const;

function parseSectionTitle(title: string): { heading: string; explicitStep?: number } {
    const match = title.match(/^(\d+)\.\s*(.+)$/);
    if (match) {
        return { heading: match[2], explicitStep: Number(match[1]) };
    }
    return { heading: title };
}

function getTextContent(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(getTextContent).join('');
    if (isValidElement(node)) return getTextContent(node.props.children);
    return '';
}

function hasManualBlocks(children: ReactNode): { metrics: boolean; tips: boolean } {
    let metrics = false;
    let tips = false;
    Children.forEach(children, (child) => {
        if (!isValidElement(child)) return;
        const className = String(child.props?.className ?? '');
        if (className.includes('learn-highlight-row')) metrics = true;
        if (
            className.includes('learn-tip-card') ||
            className.includes('learn-info') ||
            className.includes('learn-winning-habit')
        ) {
            tips = true;
        }
    });
    return { metrics, tips };
}

function enrichStepBody(children: ReactNode): ReactNode {
    const { metrics: skipMetrics, tips: skipTips } = hasManualBlocks(children);

    return Children.map(children, (child, index) => {
        if (!isValidElement(child) || child.type !== 'p') return child;

        const text = getTextContent(child.props.children);
        if (text.length < 12) return child;

        const { quotes, remainder } = extractQuotesFromText(text);
        const { advice, remainder: prose } = skipTips
            ? { advice: [], remainder }
            : extractAdviceFromText(remainder);
        const metrics = skipMetrics ? [] : detectMetricsFromText(text);

        const hasQuotes = quotes.length > 0;
        const hasAdvice = advice.length > 0;
        const hasMetrics = metrics.length > 0;
        const hasProse = prose.length > 12;

        if (!hasQuotes && !hasAdvice && !hasMetrics) return child;

        return (
            <Fragment key={`para-enriched-${index}`}>
                {hasProse && <p>{prose}</p>}
                {quotes.map((quote) => (
                    <AgentLearnQuoteCard key={`q-${quote.slice(0, 24)}`}>{quote}</AgentLearnQuoteCard>
                ))}
                {advice.map((line) => (
                    <AgentLearnTipCard key={`tip-${line.slice(0, 24)}`}>
                        <p>{line}</p>
                    </AgentLearnTipCard>
                ))}
                {hasMetrics && <AgentLearnMetricRow metrics={metrics} />}
            </Fragment>
        );
    });
}

interface AgentLearnSectionProps {
    title: string;
    children: React.ReactNode;
    icon?: LucideIcon;
    step?: number;
}

export default function AgentLearnSection({
    title,
    children,
    icon,
    step: stepProp,
}: AgentLearnSectionProps) {
    const { heading, explicitStep } = parseSectionTitle(title);
    const step = useLearnStep(stepProp ?? explicitStep);
    const tone = STEP_ICON_TONES[(step - 1) % STEP_ICON_TONES.length];
    const SectionIcon = resolveLearnSectionIcon(title, icon);

    return (
        <section
            className={LEARN_STEP_CARD}
            data-learn-section={heading}
            style={{ animationDelay: `${Math.min(step - 1, 8) * 40}ms` }}
        >
            <div className="mb-8 flex items-start justify-between gap-5">
                <div
                    className={`learn-icon-hover flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 sm:h-16 sm:w-16 ${tone.wrap}`}
                    aria-hidden
                >
                    <SectionIcon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
                </div>
                <span
                    className={`inline-flex items-center rounded-full border px-3.5 py-1.5 ${LEARN_TYPE.label} ${tone.badge}`}
                >
                    Step {step}
                </span>
            </div>

            <h3 className={`mb-6 sm:mb-7 ${LEARN_TYPE.stepTitle}`}>{heading}</h3>

            <div className={`learn-step-body ${LEARN_LAYOUT.cardInnerGap} ${LEARN_TYPE.body} [&_p]:mb-0 [&_strong]:font-semibold [&_strong]:text-[#EF4444]`}>
                {enrichStepBody(children)}
            </div>
        </section>
    );
}

interface AgentLearnSubheadProps {
    children: React.ReactNode;
}

export function AgentLearnSubhead({ children }: AgentLearnSubheadProps) {
    return (
        <h4 className={`flex items-center gap-2 ${LEARN_TYPE.label} text-[#6B7280]`}>
            <Hash className="h-3.5 w-3.5 text-[#EF4444]" aria-hidden />
            <span>{children}</span>
        </h4>
    );
}

interface AgentLearnParagraphProps {
    children: string;
    autoMetrics?: boolean;
}

export function AgentLearnParagraph({ children, autoMetrics = true }: AgentLearnParagraphProps) {
    const metrics = autoMetrics ? detectMetricsFromText(children) : [];
    return (
        <>
            <p>{children}</p>
            {metrics.length > 0 && <AgentLearnMetricRow metrics={metrics} />}
        </>
    );
}

interface AgentLearnBulletsProps {
    items: Array<ReactNode | { text: ReactNode; variant?: BulletVariant }>;
    variant?: BulletVariant;
}

type BulletVariant = 'default' | 'check' | 'do' | 'dont' | 'warning' | 'tip' | 'compliance' | 'success' | 'question';

const CHECKLIST_ICON: Record<BulletVariant, LucideIcon> = {
    default: CheckCircle,
    check: CheckCircle,
    do: CheckCircle,
    dont: XCircle,
    warning: AlertTriangle,
    tip: Lightbulb,
    compliance: ShieldCheck,
    success: CheckCircle,
    question: HelpCircle,
};

const CHECKLIST_COLOR: Record<BulletVariant, string> = {
    default: 'text-[#EF4444]',
    check: 'text-[#22C55E]',
    do: 'text-[#22C55E]',
    dont: 'text-[#EF4444]',
    warning: 'text-[#F59E0B]',
    tip: 'text-[#3B82F6]',
    compliance: 'text-[#3B82F6]',
    success: 'text-[#22C55E]',
    question: 'text-violet-600',
};

export function AgentLearnBullets({ items, variant = 'check' }: AgentLearnBulletsProps) {
    return (
        <ul className="learn-checklist mt-2 space-y-4">
            {items.map((item, i) => {
                const isKeyed = typeof item === 'object' && item !== null && 'text' in item;
                const text = isKeyed ? (item as { text: ReactNode }).text : item;
                const textStr = typeof text === 'string' ? text : getTextContent(text);
                const { quotes } = extractQuotesFromText(textStr);
                const itemVariant = isKeyed
                    ? ((item as { variant?: BulletVariant }).variant ?? variant)
                    : variant;
                if (quotes.length === 1 && textStr.trim().startsWith('"')) {
                    return (
                        <li key={i} className="list-none">
                            <AgentLearnQuoteCard>{quotes[0]}</AgentLearnQuoteCard>
                        </li>
                    );
                }

                const Icon = CHECKLIST_ICON[itemVariant];
                return (
                    <li key={i} className="flex items-start gap-3">
                        <Icon
                            className={`mt-1 h-[18px] w-[18px] shrink-0 ${CHECKLIST_COLOR[itemVariant]}`}
                            strokeWidth={2.25}
                            aria-hidden
                        />
                        <span className={`learn-checklist-text ${LEARN_TYPE.body} [&_strong]:text-[#EF4444]`}>
                            {text}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

type InfoVariant = 'tip' | 'warning' | 'important' | 'compliance' | 'eaab' | 'success' | 'question';

const INFO_STYLES: Record<
    InfoVariant,
    { className: string; icon: LucideIcon; defaultTitle: string; iconColor: string }
> = {
    tip: {
        className: 'border-blue-200/80 bg-blue-50/60',
        icon: Lightbulb,
        defaultTitle: 'Pro tip',
        iconColor: 'text-[#3B82F6]',
    },
    warning: {
        className: 'border-amber-200/80 bg-amber-50/60',
        icon: AlertTriangle,
        defaultTitle: 'Watch out',
        iconColor: 'text-[#F59E0B]',
    },
    important: {
        className: 'border-red-200/80 bg-red-50/50',
        icon: ShieldAlert,
        defaultTitle: 'Important',
        iconColor: 'text-[#EF4444]',
    },
    compliance: {
        className: 'border-blue-200/80 bg-blue-50/60',
        icon: Scale,
        defaultTitle: 'Compliance note',
        iconColor: 'text-[#3B82F6]',
    },
    eaab: {
        className: 'border-violet-200/80 bg-violet-50/60',
        icon: ShieldCheck,
        defaultTitle: 'EAAB requirement',
        iconColor: 'text-violet-600',
    },
    success: {
        className: 'border-green-200/80 bg-green-50/60',
        icon: CheckCircle,
        defaultTitle: 'Success',
        iconColor: 'text-[#22C55E]',
    },
    question: {
        className: 'border-violet-200/80 bg-violet-50/60',
        icon: HelpCircle,
        defaultTitle: 'Good to know',
        iconColor: 'text-violet-600',
    },
};

interface AgentLearnInfoProps {
    variant: InfoVariant;
    title?: string;
    children: React.ReactNode;
}

export function AgentLearnInfo({ variant, title, children }: AgentLearnInfoProps) {
    const heading = title ?? INFO_STYLES[variant].defaultTitle;

    if (variant === 'tip') {
        return <AgentLearnTipCard title={heading}>{children}</AgentLearnTipCard>;
    }

    const config = INFO_STYLES[variant];
    const Icon = config.icon;

    return (
        <aside
            className={`learn-info ${LEARN_MOTION.slideIn} rounded-2xl border px-6 py-5 sm:px-7 sm:py-6 ${config.className} ${LEARN_MOTION.card}`}
            role="note"
            aria-label={heading}
        >
            <div className="mb-2 flex items-center gap-2.5">
                <Icon className={`learn-icon-hover h-4 w-4 shrink-0 ${config.iconColor}`} strokeWidth={2.25} aria-hidden />
                <p className={`${LEARN_TYPE.label} text-[#1F2937]`}>
                    {heading}
                </p>
            </div>
            <div className={`learn-info-body ${LEARN_TYPE.bodySm} [&_p]:mb-0 [&_strong]:font-semibold [&_strong]:text-[#EF4444]`}>
                {children}
            </div>
        </aside>
    );
}

interface AgentLearnDoDontProps {
    doItems?: string[];
    dontItems?: string[];
}

export function AgentLearnDoDont({ doItems = [], dontItems = [] }: AgentLearnDoDontProps) {
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {doItems.length > 0 && (
                <div className={`${LEARN_MOTION.slideIn} rounded-2xl border border-green-200/70 bg-green-50/40 p-6 sm:p-8 ${LEARN_MOTION.card}`}>
                    <p className={`mb-3 flex items-center gap-2 ${LEARN_TYPE.label} text-green-700`}>
                        <CheckCircle className="learn-icon-hover h-4 w-4" aria-hidden />
                        Do
                    </p>
                    <AgentLearnBullets items={doItems.map((text) => ({ text, variant: 'do' }))} />
                </div>
            )}
            {dontItems.length > 0 && (
                <div className={`${LEARN_MOTION.slideIn} rounded-2xl border border-red-200/70 bg-red-50/40 p-6 sm:p-8 ${LEARN_MOTION.card}`}>
                    <p className={`mb-3 flex items-center gap-2 ${LEARN_TYPE.label} text-red-700`}>
                        <XCircle className="learn-icon-hover h-4 w-4" aria-hidden />
                        Don&apos;t
                    </p>
                    <AgentLearnBullets items={dontItems.map((text) => ({ text, variant: 'dont' }))} />
                </div>
            )}
        </div>
    );
}

interface AgentLearnStepsProps {
    items: string[];
}

export function AgentLearnSteps({ items }: AgentLearnStepsProps) {
    return <AgentLearnBullets variant="check" items={items} />;
}

interface AgentLearnHighlightProps {
    label: string;
    value: string;
    detail?: string;
    tone?: 'gold' | 'blue' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
}

export function AgentLearnHighlight({ label, value, detail, tone }: AgentLearnHighlightProps) {
    return <AgentLearnMetricCard label={label} value={value} detail={detail} tone={tone} />;
}

export { AgentLearnMetricRow } from '@/components/AgentLearnMetricRow';
