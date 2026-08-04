'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AffordabilityLab from '@/components/buyer-learn/AffordabilityLab';
import AiTutorFab from '@/components/buyer-learn/course/AiTutorFab';
import CourseChapter from '@/components/buyer-learn/course/CourseChapter';
import CourseCompletion from '@/components/buyer-learn/course/CourseCompletion';
import CourseHero from '@/components/buyer-learn/course/CourseHero';
import CourseSidebarNav from '@/components/buyer-learn/course/CourseSidebarNav';
import LearningCompanion from '@/components/buyer-learn/course/LearningCompanion';
import LessonHero from '@/components/buyer-learn/LessonHero';
import NextLessonCard from '@/components/buyer-learn/NextLessonCard';
import SectionRenderer from '@/components/buyer-learn/SectionRenderer';
import BuyerPortalShell from '@/components/BuyerPortalShell';
import PortalLoading from '@/components/PortalLoading';
import PortalPageHeader from '@/components/PortalPageHeader';
import LearningLandingShell from '@/components/marketing/learn/LearningLandingShell';
import { useHydratedBuyerPortalUser } from '@/hooks/useHydratedPortalUser';
import {
    completeLessonQuiz,
    getLessonProgress,
    readBuyerLearnStore,
    toggleLessonBookmark,
    updateLessonProgress,
    type LessonModule,
} from '@/lib/buyer-learn';
import {
    LEARN_COURSE_GRID,
    LEARN_COURSE_SHELL,
    LEARN_COMPANION,
    LEARN_LABEL,
    LEARN_MAIN,
    LEARN_SIDEBAR,
} from '@/lib/learn-course-ui';
import '@/app/home-landing.css';
import '@/app/learning-landing.css';
import '@/app/lesson-content.css';

export default function ImmersiveLessonCanvas({ lesson }: { lesson: LessonModule }) {
    const router = useRouter();
    const { user, isHydrated } = useHydratedBuyerPortalUser();
    const hubBasePath = lesson.meta.hubBasePath || '/learn';
    const progressId = lesson.meta.progressId || lesson.meta.slug;
    const chapters = lesson.chapters;
    const useCourse = Boolean(chapters && chapters.length > 0);
    const contentRef = useRef<HTMLDivElement>(null);

    const [progressPct, setProgressPct] = useState(0);
    const [bookmarked, setBookmarked] = useState(false);
    const [streakDays, setStreakDays] = useState(0);
    const [totalXp, setTotalXp] = useState(0);
    const [knowledgeScore, setKnowledgeScore] = useState(72);
    const [activeChapterId, setActiveChapterId] = useState<string | null>('overview');
    const [completedChapterIds, setCompletedChapterIds] = useState<string[]>([]);
    const [openChapterId, setOpenChapterId] = useState<string | null>(null);
    const [aiOpen, setAiOpen] = useState(false);

    const showLab =
        lesson.meta.slug === 'home-loans' ||
        lesson.meta.slug === 'returns' ||
        lesson.meta.slug === 'financing' ||
        lesson.meta.slug === 'transfer-costs';

    const chapterTotal = chapters?.length || 0;
    const courseComplete =
        useCourse && chapterTotal > 0 && completedChapterIds.length >= chapterTotal;

    useEffect(() => {
        const p = getLessonProgress(progressId);
        const store = readBuyerLearnStore();
        setBookmarked(p.bookmarked);
        setStreakDays(store.streakDays);
        setTotalXp(store.totalXp);
        if (p.quizScore != null) setKnowledgeScore(p.quizScore);

        if (useCourse && chapters) {
            const saved = (p.completedChapterIds || []).filter((id) =>
                chapters.some((c) => c.id === id)
            );
            setCompletedChapterIds(saved);
            const nextOpen =
                chapters.find((c) => !saved.includes(c.id))?.id ||
                chapters[chapters.length - 1]?.id ||
                null;
            setOpenChapterId(nextOpen);
            const pct =
                chapters.length === 0
                    ? 0
                    : Math.round((saved.length / chapters.length) * 100);
            setProgressPct(Math.max(p.percent, pct));
            if (nextOpen) setActiveChapterId(nextOpen);
        } else {
            setProgressPct(p.percent);
        }
    }, [progressId, useCourse, chapters]);

    useEffect(() => {
        if (useCourse) return;
        const root = contentRef.current;
        if (!root) return;

        const sections = Array.from(
            root.querySelectorAll<HTMLElement>('[data-learn-section]')
        );
        if (sections.length === 0) return;

        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (!visible) return;
                const id = visible.target.getAttribute('data-learn-section');
                const idx = sections.findIndex((s) => s === visible.target);
                if (idx < 0) return;
                if (id) setActiveChapterId(id);
                const pct = ((idx + 1) / sections.length) * 100;
                setProgressPct((prev) => Math.max(prev, pct));
                if (id) {
                    updateLessonProgress(progressId, {
                        lastSectionId: id,
                        percent: Math.max(getLessonProgress(progressId).percent, Math.round(pct)),
                    });
                }
            },
            { threshold: [0.2, 0.4], rootMargin: '-10% 0px -45% 0px' }
        );

        sections.forEach((s) => io.observe(s));
        return () => io.disconnect();
    }, [progressId, lesson.sections, useCourse]);

    const firstContentId = useMemo(() => {
        if (useCourse && openChapterId) return openChapterId;
        if (useCourse && chapters?.[0]) return chapters[0].id;
        return lesson.sections[0]?.id || 'objectives';
    }, [useCourse, chapters, lesson.sections, openChapterId]);

    function chapterProgressPercent(doneIds: string[]) {
        if (!chapters || chapters.length === 0) return 0;
        return Math.round((doneIds.length / chapters.length) * 100);
    }

    function handleFinishChapter(chapterId: string) {
        if (!chapters) return;
        const nextDone = completedChapterIds.includes(chapterId)
            ? completedChapterIds
            : [...completedChapterIds, chapterId];
        const pct = chapterProgressPercent(nextDone);
        const nextChapter = chapters.find((c) => !nextDone.includes(c.id));
        const allDone = nextDone.length >= chapters.length;

        setCompletedChapterIds(nextDone);
        setProgressPct(pct);
        setKnowledgeScore((s) => Math.min(100, s + 5));
        setOpenChapterId(allDone ? null : nextChapter?.id || null);
        setActiveChapterId(allDone ? 'achievement' : nextChapter?.id || chapterId);

        updateLessonProgress(progressId, {
            completedChapterIds: nextDone,
            lastSectionId: chapterId,
            percent: pct,
            completed: allDone,
            quizScore: allDone ? Math.min(100, knowledgeScore + 5) : undefined,
        });

        if (allDone) {
            completeLessonQuiz(progressId, Math.min(100, knowledgeScore + 5), lesson.meta.xp);
            const store = readBuyerLearnStore();
            setTotalXp(store.totalXp);
            setStreakDays(store.streakDays);
            setProgressPct(100);
            requestAnimationFrame(() => {
                document
                    .getElementById('learn-section-achievement')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            return;
        }

        requestAnimationFrame(() => {
            if (nextChapter) {
                document
                    .getElementById(`learn-chapter-${nextChapter.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    function handleReopenChapter(chapterId: string) {
        setOpenChapterId(chapterId);
        setActiveChapterId(chapterId);
        requestAnimationFrame(() => {
            document
                .getElementById(`learn-chapter-${chapterId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function handleCloseReview() {
        if (!chapters) return;
        const nextOpen =
            chapters.find((c) => !completedChapterIds.includes(c.id))?.id || null;
        setOpenChapterId(nextOpen);
        setActiveChapterId(
            nextOpen || (completedChapterIds.length >= chapters.length ? 'achievement' : 'overview')
        );
        if (nextOpen) {
            requestAnimationFrame(() => {
                document
                    .getElementById(`learn-chapter-${nextOpen}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    function handleContinue() {
        const id = useCourse
            ? `learn-chapter-${firstContentId}`
            : `learn-section-${firstContentId}`;
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function handleBookmark() {
        setBookmarked(toggleLessonBookmark(progressId));
    }

    function handleShare() {
        const url = window.location.href;
        const title = `${lesson.meta.title} | PropReady`;
        if (navigator.share) {
            void navigator.share({ title, text: lesson.meta.subtitle, url }).catch(() => {
                void navigator.clipboard?.writeText(url);
            });
        } else {
            void navigator.clipboard?.writeText(url);
        }
    }

    function handleQuizComplete(scorePct: number) {
        const store = completeLessonQuiz(progressId, scorePct, lesson.meta.xp);
        setProgressPct(100);
        setKnowledgeScore(scorePct);
        setTotalXp(store.totalXp);
        setStreakDays(store.streakDays);
        document
            .getElementById('learn-section-achievement')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function handleContinueNext() {
        router.push(`${hubBasePath.replace(/\/$/, '')}/${lesson.meta.nextSlug}`);
    }

    const hubLabel = hubBasePath.includes('investors')
        ? 'Investors hub'
        : hubBasePath.includes('sellers')
          ? 'Sellers hub'
          : 'Buyers hub';

    function chapterStatus(chapterId: string): 'open' | 'completed' | 'locked' {
        if (openChapterId === chapterId) return 'open';
        if (completedChapterIds.includes(chapterId)) return 'completed';
        return 'locked';
    }

    const landingHero =
        useCourse && chapters ? (
            <div id="learn-overview" data-learn-section="overview" className="scroll-mt-28">
                <CourseHero
                    meta={lesson.meta}
                    progressPct={progressPct}
                    bookmarked={bookmarked}
                    chapterCount={chapters.length}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    onContinue={handleContinue}
                />
            </div>
        ) : (
            <div id="learn-overview" data-learn-section="overview" className="scroll-mt-28">
                <LessonHero
                    meta={lesson.meta}
                    progressPct={progressPct}
                    bookmarked={bookmarked}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    onContinue={handleContinue}
                />
            </div>
        );

    const courseContent =
        useCourse && chapters ? (
            <div className={`${LEARN_COURSE_SHELL} relative py-4 sm:py-6`}>
                <div className="mb-6 flex items-center justify-end">
                    <p className="text-xs font-semibold tabular-nums text-[rgba(28,28,28,0.4)]">
                        {completedChapterIds.length}/{chapters.length} chapters
                    </p>
                </div>

                <div className={LEARN_COURSE_GRID}>
                    <div className={LEARN_SIDEBAR}>
                        <CourseSidebarNav
                            chapters={chapters}
                            activeId={activeChapterId}
                            completedIds={completedChapterIds}
                            openChapterId={openChapterId}
                            showLab={showLab}
                            courseComplete={courseComplete}
                            onSelectChapter={handleReopenChapter}
                        />
                    </div>

                    <div className={LEARN_MAIN} ref={contentRef}>
                        <div className="space-y-3 sm:space-y-4">
                            {chapters.map((chapter, index) => {
                                const status = chapterStatus(chapter.id);
                                if (status === 'locked') {
                                    const nextLocked = chapters.find(
                                        (c) => chapterStatus(c.id) === 'locked'
                                    );
                                    if (nextLocked?.id !== chapter.id) return null;
                                }
                                return (
                                    <CourseChapter
                                        key={chapter.id}
                                        chapter={chapter}
                                        index={index}
                                        total={chapters.length}
                                        status={status}
                                        isReview={
                                            openChapterId === chapter.id &&
                                            completedChapterIds.includes(chapter.id)
                                        }
                                        onFinishChapter={() => handleFinishChapter(chapter.id)}
                                        onReopen={() => handleReopenChapter(chapter.id)}
                                        onCloseReview={handleCloseReview}
                                    />
                                );
                            })}
                        </div>

                        {courseComplete && showLab ? (
                            <section
                                id="learn-section-lab"
                                data-learn-section="lab"
                                className="scroll-mt-28 mt-10 rounded-[1.5rem] border border-[rgba(28,28,28,0.08)] bg-[rgba(255,252,248,0.95)] p-6 sm:p-9 shadow-[0_8px_32px_rgba(28,28,28,0.06)]"
                            >
                                <p className={LEARN_LABEL}>Interactive lab</p>
                                <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1c1c1c]">
                                    Affordability calculator
                                </h2>
                                <p className="mt-2 text-[rgba(28,28,28,0.5)] text-sm sm:text-base max-w-2xl leading-relaxed">
                                    Slide the dials — educational estimate only. Feel the trade-offs
                                    before you speak to a bank.
                                </p>
                                <div className="mt-7">
                                    <AffordabilityLab />
                                </div>
                            </section>
                        ) : null}

                        {courseComplete ? (
                            <div className="mt-10 space-y-10">
                                <CourseCompletion
                                    title={lesson.meta.title}
                                    badgeLabel={lesson.meta.badgeLabel}
                                    xp={lesson.meta.xp}
                                    scorePct={knowledgeScore}
                                    nextSlug={lesson.meta.nextSlug}
                                    nextTitle={lesson.meta.nextTitle}
                                    nextDescription={lesson.meta.nextDescription}
                                    hubBasePath={hubBasePath}
                                    onShare={handleShare}
                                />

                                <section
                                    id="learn-section-next"
                                    data-learn-section="next"
                                    className="scroll-mt-28 pb-10"
                                >
                                    <NextLessonCard
                                        slug={lesson.meta.nextSlug}
                                        title={lesson.meta.nextTitle}
                                        description={lesson.meta.nextDescription}
                                        hubBasePath={hubBasePath}
                                    />
                                </section>
                            </div>
                        ) : null}
                    </div>

                    <div className={LEARN_COMPANION}>
                        <LearningCompanion
                            meta={lesson.meta}
                            progressPct={progressPct}
                            bookmarked={bookmarked}
                            streakDays={streakDays}
                            totalXp={totalXp}
                            hubBasePath={hubBasePath}
                            onOpenAi={() => setAiOpen(true)}
                            onOpenLab={
                                showLab && courseComplete
                                    ? () =>
                                          document
                                              .getElementById('learn-section-lab')
                                              ?.scrollIntoView({ behavior: 'smooth' })
                                    : undefined
                            }
                        />
                    </div>
                </div>
            </div>
        ) : (
            <div className={`${LEARN_COURSE_SHELL} relative py-4 sm:py-6`}>
                <div ref={contentRef} className="space-y-14 sm:space-y-16">
                    {lesson.sections.map((section, index) => (
                        <SectionRenderer
                            key={section.id}
                            section={section}
                            index={index}
                            streakDays={streakDays}
                            totalXp={totalXp}
                            hubBasePath={hubBasePath}
                            onQuizComplete={handleQuizComplete}
                            onContinueNext={handleContinueNext}
                        />
                    ))}
                </div>
            </div>
        );

    const dock = (
        <div className="lesson-dock fixed inset-x-0 bottom-0 z-40 safe-area-pb">
            <div className={`${LEARN_COURSE_SHELL} flex items-center gap-3 py-3`}>
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-[11px] text-[rgba(28,28,28,0.45)]">
                        <span className="truncate font-semibold">{lesson.meta.title}</span>
                        <span className="tabular-nums font-semibold text-[rgba(28,28,28,0.7)]">
                            {Math.round(progressPct)}%
                        </span>
                    </div>
                    <div className="lesson-progress-track">
                        <div
                            className="lesson-progress-fill"
                            style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                    </div>
                </div>
                <button type="button" onClick={handleContinue} className="lesson-dock-btn">
                    Continue
                </button>
            </div>
        </div>
    );

    const tutor = (
        <AiTutorFab
            lessonTitle={lesson.meta.title}
            lessonSubtitle={lesson.meta.subtitle}
            hubBasePath={hubBasePath}
            open={aiOpen}
            onOpenChange={setAiOpen}
        />
    );

    if (!isHydrated) {
        return <PortalLoading message="Loading lesson…" variant="dashboard" />;
    }

    if (user) {
        return (
            <BuyerPortalShell
                activePage="learn"
                title={lesson.meta.title}
                pageHeader={
                    <PortalPageHeader
                        variant="premium"
                        eyebrow={lesson.meta.courseLabel || hubLabel}
                        title={lesson.meta.title}
                        description={lesson.meta.subtitle}
                        actions={
                            <button
                                type="button"
                                onClick={handleContinue}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gold/90"
                            >
                                {progressPct > 5 ? 'Continue' : 'Start lesson'}
                            </button>
                        }
                    />
                }
            >
                <div className="lesson-landing relative min-h-screen pb-28">
                    <div className={`${LEARN_COURSE_SHELL} mb-4 flex justify-end`}>
                        <Link
                            href={hubBasePath}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[rgba(28,28,28,0.5)] hover:text-[#dc2626] transition"
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                            {hubLabel}
                        </Link>
                    </div>
                    {courseContent}
                    {tutor}
                    {dock}
                </div>
            </BuyerPortalShell>
        );
    }

    return (
        <LearningLandingShell
            backHref={hubBasePath}
            backLabel={`Back to ${hubLabel}`}
        >
            <div className="lesson-landing relative pb-28">
                {landingHero}
                <section className="lc-section !pt-2 sm:!pt-4">{courseContent}</section>
                {tutor}
                {dock}
            </div>
        </LearningLandingShell>
    );
}
