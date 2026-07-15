'use client';

import { BookOpen, Clock } from 'lucide-react';
import AgentLearnApplyCta from '@/components/AgentLearnApplyCta';
import AgentLearnArticleBody from '@/components/AgentLearnArticleBody';
import AgentLearnReadingProgress from '@/components/AgentLearnReadingProgress';
import { getLearnCategoryBadge } from '@/lib/agent-learn-meta';
import { LEARN_COLORS, LEARN_LAYOUT, LEARN_TYPE } from '@/lib/agent-learn-design';
import { AGENT_BADGE } from '@/lib/agent-portal-ui';

interface AgentLearnArticleContentProps {
    children: React.ReactNode;
    category?: string;
    readMinutes?: number;
    title?: string;
}

export default function AgentLearnArticleContent({
    children,
    category,
    readMinutes,
    title,
}: AgentLearnArticleContentProps) {
    return (
        <article
            className="w-full overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.05)]"
            id="learn-article-root"
            aria-label={title ? `Article: ${title}` : 'Learning article'}
        >
            <header
                className="relative border-b border-[#E5E7EB] bg-white"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 0% 0%, rgba(239,68,68,0.08) 0%, transparent 55%)',
                }}
            >
                <div className={`relative w-full ${LEARN_LAYOUT.bodyPadding}`}>
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                        <span
                            className={`${AGENT_BADGE} border-[#1F2937] bg-[#1F2937] text-white`}
                        >
                            <BookOpen className="h-3.5 w-3.5" aria-hidden />
                            Agent playbook
                        </span>
                        {category && (
                            <span className={`${AGENT_BADGE} ${getLearnCategoryBadge(category)}`}>
                                {category}
                            </span>
                        )}
                        {readMinutes != null && (
                            <span
                                className={`${AGENT_BADGE} border border-[#E5E7EB] bg-white text-[#6B7280]`}
                            >
                                <Clock className="h-3.5 w-3.5" aria-hidden />
                                {readMinutes} min read
                            </span>
                        )}
                    </div>
                    {title && (
                        <h1 className={LEARN_TYPE.heroTitle}>{title}</h1>
                    )}
                </div>
            </header>

            <AgentLearnReadingProgress readMinutes={readMinutes} articleId="learn-article-body" />

            <div
                className="bg-[#FAFAFA]"
                id="learn-article-body"
                style={{ backgroundColor: LEARN_COLORS.background }}
            >
                <div className={`w-full ${LEARN_LAYOUT.bodyPadding}`}>
                    <div className={LEARN_LAYOUT.sectionGap}>
                        <AgentLearnArticleBody>{children}</AgentLearnArticleBody>
                        <AgentLearnApplyCta />
                    </div>
                </div>
            </div>
        </article>
    );
}
