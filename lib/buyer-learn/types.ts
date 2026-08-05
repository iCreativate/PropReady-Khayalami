export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type KnowledgeVariant =
    | 'takeaway'
    | 'did-you-know'
    | 'tip'
    | 'warning'
    | 'mistake'
    | 'myth-fact'
    | 'definition'
    | 'insight'
    | 'law'
    | 'numbers';

export type QuizKind = 'mcq' | 'true-false' | 'scenario';

export type ChapterTone = 'light' | 'dark';

export type ChapterIllustration =
    | 'bond'
    | 'deposit'
    | 'rates'
    | 'originator'
    | 'fica'
    | 'costs'
    | 'strategy'
    | 'default';

export interface LessonObjective {
    id: string;
    title: string;
    body: string;
}

export interface InfographicStep {
    id: string;
    label: string;
    detail: string;
}

export interface StoryDecision {
    id: string;
    prompt: string;
    options: Array<{ id: string; label: string; outcome: string; recommended?: boolean }>;
}

export interface LearnerPersona {
    name: string;
    city: string;
    role: string;
    netSalary: number;
    propertyPrice: number;
    depositPct: number;
    propertyLabel: string;
    bio: string;
}

export interface TimelineItem {
    id: string;
    title: string;
    detail: string;
    duration?: string;
}

export interface ComparisonColumn {
    id: string;
    title: string;
    points: string[];
    highlight?: boolean;
}

export interface KnowledgeBlock {
    id: string;
    variant: KnowledgeVariant;
    title: string;
    body: string;
    myth?: string;
    fact?: string;
}

export interface ExampleCard {
    id: string;
    city: string;
    propertyLabel: string;
    note: string;
    /** Purchase-style figures — only when the topic is about buying/financing. */
    price?: number;
    deposit?: number;
    bond?: number;
    ratePct?: number;
    monthly?: number;
    /** Topic-specific facts shown instead of (or with) purchase figures. */
    highlights?: Array<{ label: string; value: string }>;
}

export interface QuizQuestion {
    id: string;
    kind: QuizKind;
    prompt: string;
    options: Array<{ id: string; label: string }>;
    correctId: string;
    explanation: string;
}

export interface ChapterCaseStudy extends ExampleCard {
    headline: string;
    story: string;
}

export interface ChapterExercise {
    kind: 'choice' | 'checklist';
    prompt: string;
    options?: Array<{ id: string; label: string; feedback: string; correct?: boolean }>;
    checklist?: string[];
}

export interface LessonChapter {
    id: string;
    title: string;
    eyebrow: string;
    plainEnglish: string;
    whyItMatters: string;
    tone: ChapterTone;
    illustration: ChapterIllustration;
    infographic: InfographicStep[];
    caseStudy: ChapterCaseStudy;
    mistakes: string[];
    mythFact: { myth: string; fact: string };
    exercise: ChapterExercise;
    checklist?: { title: string; items: string[] };
    quiz: QuizQuestion;
    deepDive: { title: string; body: string };
    bridge: { teaser: string; nextLabel: string };
}

export interface LessonMeta {
    slug: string;
    title: string;
    subtitle: string;
    difficulty: LessonDifficulty;
    minutes: number;
    xp: number;
    badgeId: string;
    badgeLabel: string;
    nextSlug: string;
    nextTitle: string;
    nextDescription: string;
    hubBasePath?: string;
    progressId?: string;
    /** Course framing shown in hero breadcrumbs. */
    courseLabel?: string;
    chapterCount?: number;
}

export type LessonSection =
    | { type: 'objectives'; id: string; title: string; items: LessonObjective[] }
    | { type: 'infographic'; id: string; title: string; subtitle: string; steps: InfographicStep[] }
    | {
          type: 'story';
          id: string;
          title: string;
          persona: LearnerPersona;
          decisions: StoryDecision[];
      }
    | { type: 'timeline'; id: string; title: string; subtitle: string; items: TimelineItem[] }
    | {
          type: 'comparison';
          id: string;
          title: string;
          subtitle: string;
          columns: ComparisonColumn[];
      }
    | {
          type: 'tool';
          id: string;
          title: string;
          subtitle: string;
          tool: 'affordability';
      }
    | { type: 'knowledge'; id: string; title: string; blocks: KnowledgeBlock[] }
    | { type: 'examples'; id: string; title: string; subtitle: string; items: ExampleCard[] }
    | { type: 'quiz'; id: string; title: string; questions: QuizQuestion[] }
    | {
          type: 'achievement';
          id: string;
          title: string;
          body: string;
          badgeLabel: string;
          xp: number;
      }
    | {
          type: 'next';
          id: string;
          slug: string;
          title: string;
          description: string;
      };

export interface LessonModule {
    meta: LessonMeta;
    objectives: LessonObjective[];
    /** Legacy flat sections — used when chapters are absent. */
    sections: LessonSection[];
    /** Premium chapter-based course experience. */
    chapters?: LessonChapter[];
}

export interface LessonProgressState {
    percent: number;
    bookmarked: boolean;
    completed: boolean;
    quizScore: number | null;
    xpEarned: number;
    lastSectionId: string | null;
    /** Chapter ids the learner has finished (quiz passed / chapter closed). */
    completedChapterIds?: string[];
    updatedAt: string;
}

export interface BuyerLearnStore {
    lessons: Record<string, LessonProgressState>;
    totalXp: number;
    streakDays: number;
    lastActiveDate: string | null;
}
