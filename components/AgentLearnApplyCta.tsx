import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { LEARN_MOTION, LEARN_SHADOW, LEARN_TYPE } from '@/lib/agent-learn-design';
import { AGENT_PRIMARY_BTN, AGENT_SECONDARY_BTN } from '@/lib/agent-portal-ui';

export default function AgentLearnApplyCta() {
    return (
        <section
            className={`learn-apply-cta ${LEARN_MOTION.fadeIn} rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center sm:p-12 ${LEARN_SHADOW.card} ${LEARN_MOTION.card}`}
            aria-labelledby="learn-apply-heading"
        >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EF4444]/10 text-[#EF4444]">
                <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <h2 id="learn-apply-heading" className="text-xl font-bold tracking-tight text-[#1F2937] sm:text-2xl">
                Ready to Apply This?
            </h2>
            <p className={`mx-auto mt-3 max-w-md ${LEARN_TYPE.bodySm} text-[#6B7280]`}>
                Start using these techniques on your next viewing today.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                    href="/agents/learn"
                    className={`${AGENT_SECONDARY_BTN} ${LEARN_MOTION.btnLift} w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]/30 focus-visible:ring-offset-2`}
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Return to Learning Hub
                </Link>
                <Link
                    href="/agents/dashboard"
                    className={`${AGENT_PRIMARY_BTN} ${LEARN_MOTION.btnLift} w-full bg-[#EF4444] hover:bg-[#DC2626] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]/30 focus-visible:ring-offset-2`}
                >
                    Go to Dashboard
                    <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden />
                </Link>
            </div>
        </section>
    );
}
