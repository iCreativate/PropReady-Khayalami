import { CheckCircle, Trophy } from 'lucide-react';
import { formatDurationDisplay, parseWinningHabitContent } from '@/lib/agent-learn-advice-detect';
import { LEARN_MOTION, LEARN_SHADOW, LEARN_TYPE } from '@/lib/agent-learn-design';

interface AgentLearnWinningHabitProps {
    title?: string;
    children: React.ReactNode;
}

function childText(children: React.ReactNode): string {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(childText).join('');
    if (children && typeof children === 'object' && 'props' in children) {
        return childText((children as { props: { children?: React.ReactNode } }).props.children);
    }
    return '';
}

export default function AgentLearnWinningHabit({
    title = 'Winning habit',
    children,
}: AgentLearnWinningHabitProps) {
    const text = childText(children);
    const parsed = parseWinningHabitContent(text);
    const hasStructuredLayout = Boolean(parsed.duration || parsed.checklist.length > 0);

    return (
        <aside
            className={`learn-winning-habit ${LEARN_MOTION.slideIn} overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white ${LEARN_SHADOW.card} ${LEARN_MOTION.card}`}
            role="note"
            aria-label={title}
        >
            <div className="border-b border-[#E5E7EB] bg-gradient-to-r from-red-50/80 to-transparent px-8 py-6 sm:px-10 sm:py-7">
                <div className="flex items-center gap-3">
                    <span className="learn-icon-hover flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EF4444]/10 text-[#EF4444]">
                        <Trophy className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                    </span>
                    <h4 className={`${LEARN_TYPE.label} text-[#EF4444]`}>{title}</h4>
                </div>
            </div>

            <div className="p-8 sm:p-10">
                {hasStructuredLayout ? (
                    <div className="space-y-8">
                        {(parsed.duration || parsed.durationLabel) && (
                            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-6 py-8 text-center sm:px-10 sm:py-9">
                                <p className={`${LEARN_TYPE.label} text-[#6B7280]`}>Winning Habits</p>
                                {parsed.duration && (
                                    <p className={`mt-3 ${LEARN_TYPE.metric}`}>
                                        {formatDurationDisplay(parsed.duration)}
                                    </p>
                                )}
                                {parsed.durationLabel && (
                                    <p className="mt-2 text-base font-medium text-[#6B7280]">
                                        {parsed.durationLabel}
                                    </p>
                                )}
                            </div>
                        )}

                        {parsed.checklist.length > 0 && (
                            <div>
                                <p
                                    className={`mb-5 text-center ${LEARN_TYPE.label} text-[#9CA3AF]`}
                                >
                                    Dedicated only to
                                </p>
                                <ul
                                    className={`grid gap-4 ${
                                        parsed.checklist.length >= 3
                                            ? 'md:grid-cols-3'
                                            : parsed.checklist.length === 2
                                              ? 'sm:grid-cols-2'
                                              : 'grid-cols-1'
                                    }`}
                                >
                                    {parsed.checklist.map((item) => (
                                        <li
                                            key={item}
                                            className={`flex h-full items-start gap-3.5 rounded-xl border border-green-100 bg-gradient-to-br from-green-50/80 to-white p-4 sm:p-5 ${LEARN_MOTION.base} hover:border-green-200 hover:shadow-[0_4px_16px_rgba(34,197,94,0.08)]`}
                                        >
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/10 text-[#22C55E]">
                                                <CheckCircle
                                                    className="h-5 w-5"
                                                    strokeWidth={2.25}
                                                    aria-hidden
                                                />
                                            </span>
                                            <span
                                                className={`pt-1 text-[15px] font-medium leading-snug text-[#1F2937] sm:text-base`}
                                            >
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={LEARN_TYPE.body}>{children}</div>
                )}

                {parsed.footer && (
                    <p
                        className={`mt-8 border-t border-[#E5E7EB] pt-6 text-center font-medium italic text-[#6B7280] ${LEARN_TYPE.bodySm}`}
                    >
                        {parsed.footer}
                    </p>
                )}
            </div>
        </aside>
    );
}
