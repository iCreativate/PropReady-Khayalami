import { Lightbulb } from 'lucide-react';
import { LEARN_MOTION, LEARN_TIP_CARD, LEARN_TYPE } from '@/lib/agent-learn-design';

interface AgentLearnTipCardProps {
    title?: string;
    children: React.ReactNode;
}

export default function AgentLearnTipCard({ title = 'Pro tip', children }: AgentLearnTipCardProps) {
    return (
        <aside
            className={`${LEARN_TIP_CARD} ${LEARN_MOTION.card} group`}
            role="note"
            aria-label={title}
        >
            <div className="mb-4 flex items-center gap-3 sm:mb-5">
                <span className="learn-icon-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[#F59E0B]">
                    <Lightbulb className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <h4 className={`${LEARN_TYPE.label} text-amber-800`}>{title}</h4>
            </div>
            <div className={`${LEARN_TYPE.bodySm} [&_p]:mb-0 [&_strong]:font-semibold [&_strong]:text-[#EF4444]`}>
                {children}
            </div>
        </aside>
    );
}
