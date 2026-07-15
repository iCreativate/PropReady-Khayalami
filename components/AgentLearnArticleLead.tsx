import { LEARN_TYPE } from '@/lib/agent-learn-design';

interface AgentLearnArticleLeadProps {
    children: React.ReactNode;
}

export default function AgentLearnArticleLead({ children }: AgentLearnArticleLeadProps) {
    return (
        <h1
            className={`learn-article-lead ${LEARN_TYPE.articleLead}`}
            data-learn-section="Introduction"
        >
            {children}
        </h1>
    );
}
