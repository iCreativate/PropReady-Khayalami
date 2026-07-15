import { Quote } from 'lucide-react';
import { LEARN_MOTION, LEARN_QUOTE_CARD, LEARN_TYPE } from '@/lib/agent-learn-design';

interface AgentLearnQuoteCardProps {
    children: string;
}

export default function AgentLearnQuoteCard({ children }: AgentLearnQuoteCardProps) {
    return (
        <blockquote className={`${LEARN_QUOTE_CARD} ${LEARN_MOTION.base}`}>
            <span
                className="learn-icon-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100/80 text-[#EF4444]"
                aria-hidden
            >
                <Quote className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className={`${LEARN_TYPE.body} font-medium italic text-[#3F3F46]`}>
                &ldquo;{children}&rdquo;
            </p>
        </blockquote>
    );
}
