'use client';

import {
    createContext,
    useCallback,
    useContext,
    useRef,
    Children,
    isValidElement,
    cloneElement,
    createElement,
    type ReactNode,
} from 'react';
import AgentLearnArticleLead from '@/components/AgentLearnArticleLead';
import { LEARN_LAYOUT, LEARN_TYPE } from '@/lib/agent-learn-design';
import { AGENT_LEARN_ARTICLE_BODY } from '@/lib/agent-portal-ui';

interface LearnStepContextValue {
    claimStep: (explicit?: number) => number;
}

const LearnStepContext = createContext<LearnStepContextValue | null>(null);

export function useLearnStep(explicit?: number): number {
    const ctx = useContext(LearnStepContext);
    if (explicit != null) return explicit;
    if (ctx) return ctx.claimStep();
    return 1;
}

interface AgentLearnArticleBodyProps {
    children: React.ReactNode;
}

function isArticleLeadElement(child: React.ReactElement): boolean {
    return (
        child.type === AgentLearnArticleLead ||
        child.type === 'p' ||
        child.type === 'h1' ||
        child.type === 'h2'
    );
}

function markIntroductionParagraph(node: ReactNode): ReactNode {
    let introMarked = false;

    const walk = (child: ReactNode): ReactNode => {
        if (introMarked || !isValidElement(child)) return child;

        if (isArticleLeadElement(child)) {
            introMarked = true;

            if (child.type === AgentLearnArticleLead) {
                return cloneElement(child, {
                    ...child.props,
                    'data-learn-section': 'Introduction',
                    className: `${LEARN_TYPE.articleLead} learn-article-lead learn-animate-in ${child.props.className ?? ''}`.trim(),
                });
            }

            const existing = String(child.props.className ?? '');
            const className = existing.includes('learn-article-lead')
                ? `${existing} learn-animate-in`.trim()
                : `learn-article-lead ${LEARN_TYPE.articleLead} learn-animate-in`.trim();

            return createElement(
                'h1',
                {
                    'data-learn-section': 'Introduction',
                    className,
                },
                child.props.children
            );
        }

        if (child.props?.children) {
            return cloneElement(
                child,
                child.props,
                Children.map(child.props.children as ReactNode, walk)
            );
        }

        return child;
    };

    return Children.map(node, walk);
}

export default function AgentLearnArticleBody({ children }: AgentLearnArticleBodyProps) {
    const counter = useRef(0);
    const claimStep = useCallback((explicit?: number) => {
        if (explicit != null) {
            counter.current = Math.max(counter.current, explicit);
            return explicit;
        }
        counter.current += 1;
        return counter.current;
    }, []);

    return (
        <LearnStepContext.Provider value={{ claimStep }}>
            <div
                className={`learn-article-body ${LEARN_LAYOUT.sectionGap} [&_strong]:font-semibold [&_strong]:text-[#EF4444] ${AGENT_LEARN_ARTICLE_BODY}`}
            >
                {markIntroductionParagraph(children)}
            </div>
        </LearnStepContext.Provider>
    );
}
