'use client';

import { Clock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { LEARN_MOTION, LEARN_TYPE } from '@/lib/agent-learn-design';

interface AgentLearnReadingProgressProps {
    readMinutes?: number;
    articleId?: string;
}

export default function AgentLearnReadingProgress({
    readMinutes,
    articleId = 'learn-article-body',
}: AgentLearnReadingProgressProps) {
    const [progress, setProgress] = useState(0);
    const [currentSection, setCurrentSection] = useState('Introduction');

    const updateProgress = useCallback(() => {
        const body = document.getElementById(articleId);
        if (!body) return;

        const total = body.offsetHeight - window.innerHeight;
        if (total <= 0) {
            setProgress(100);
            return;
        }

        const scrolled = Math.min(Math.max(window.scrollY - (body.offsetTop - 80), 0), total);
        setProgress(Math.round((scrolled / total) * 100));
    }, [articleId]);

    useEffect(() => {
        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
        return () => {
            window.removeEventListener('scroll', updateProgress);
            window.removeEventListener('resize', updateProgress);
        };
    }, [updateProgress]);

    useEffect(() => {
        const sections = document.querySelectorAll<HTMLElement>('[data-learn-section]');
        if (sections.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible[0]?.target) {
                    const title = visible[0].target.getAttribute('data-learn-section');
                    if (title) setCurrentSection(title);
                }
            },
            { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, [articleId]);

    return (
        <div
            className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80"
            role="region"
            aria-label="Reading progress"
        >
            <div className={`mx-auto w-full px-6 py-3.5 sm:px-8 lg:px-10`}>
                <div className="mb-2 flex items-center justify-between gap-4 text-xs font-medium text-[#6B7280]">
                    <span className="tabular-nums text-[#1F2937]">
                        <span className="font-bold">{progress}%</span> Complete
                    </span>
                    {readMinutes != null && (
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" aria-hidden />
                            {readMinutes} min read
                        </span>
                    )}
                </div>
                <div
                    className="h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Article ${progress}% complete`}
                >
                    <div
                        className={`learn-progress-bar h-full rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] ${LEARN_MOTION.progress}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p
                    className={`mt-2 truncate ${LEARN_TYPE.label} text-[#9CA3AF]`}
                    aria-live="polite"
                >
                    {currentSection}
                </p>
            </div>
        </div>
    );
}
