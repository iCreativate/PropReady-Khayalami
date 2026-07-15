import AgentLearnTipCard from '@/components/AgentLearnTipCard';
import AgentLearnWinningHabit from '@/components/AgentLearnWinningHabit';
import { LEARN_CALLOUT_CARD, LEARN_TYPE } from '@/lib/agent-learn-design';
import { Sparkles } from 'lucide-react';

interface AgentLearnCalloutProps {
    title: string;
    children: React.ReactNode;
}

function normaliseTitle(title: string): string {
    return title.toLowerCase().trim();
}

export default function AgentLearnCallout({ title, children }: AgentLearnCalloutProps) {
    const key = normaliseTitle(title);

    if (key.includes('winning habit') || key.includes('90-day challenge')) {
        return <AgentLearnWinningHabit title={title}>{children}</AgentLearnWinningHabit>;
    }

    if (
        key.includes('tip') ||
        key.includes('quick win') ||
        key.includes('golden rule') ||
        key.includes('pipeline metric') ||
        key.includes('listing win rate')
    ) {
        return <AgentLearnTipCard title={title}>{children}</AgentLearnTipCard>;
    }

    return (
        <aside
            className={`learn-callout group ${LEARN_CALLOUT_CARD}`}
            role="note"
            aria-label={title}
        >
            <div className="flex gap-6 sm:gap-7">
                <span className="learn-icon-hover flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] shadow-[0_4px_14px_rgba(239,68,68,0.22)]">
                    <Sparkles className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <h4 className={`mb-2 ${LEARN_TYPE.label} text-[#EF4444]`}>
                        {title}
                    </h4>
                    <div className={`learn-callout-body ${LEARN_TYPE.body} [&_p]:mb-0 [&_strong]:font-semibold [&_strong]:text-[#EF4444]`}>
                        {children}
                    </div>
                </div>
            </div>
        </aside>
    );
}
