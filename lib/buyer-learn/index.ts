import { HOME_LOANS_LESSON } from '@/lib/buyer-learn/modules/home-loans';
import { CATALOG_LESSONS } from '@/lib/buyer-learn/modules/catalog';
import type { LessonModule } from '@/lib/buyer-learn/types';

const LESSONS: Record<string, LessonModule> = {
    [HOME_LOANS_LESSON.meta.slug]: HOME_LOANS_LESSON,
};

for (const lesson of CATALOG_LESSONS) {
    LESSONS[lesson.meta.slug] = lesson;
}

export function getBuyerLesson(slug: string): LessonModule | null {
    return LESSONS[slug] || null;
}

export function listBuyerLessons(): LessonModule[] {
    return Object.values(LESSONS);
}

export function isImmersiveBuyerLesson(slug: string): boolean {
    return Boolean(LESSONS[slug]);
}

/** Ordered hub slugs for next-lesson chains and progress UI. */
export const BUYER_LEARN_ORDER = [
    'home-loans',
    'prequalification',
    'buying-process',
    'agents',
    'first-time-tips',
    'transfer-costs',
    'flisp-subsidy',
    'buying-deceased-estate',
    'understanding-trusts',
    'first-time-buyer-mistakes',
    'bond-application-avoid',
    'buying-property-as-business',
] as const;

export * from '@/lib/buyer-learn/types';
export * from '@/lib/buyer-learn/progress';
export { getInvestorLesson, INVESTOR_LEARN_ORDER } from '@/lib/buyer-learn/modules/investors';
export { getSellerLesson, SELLER_LEARN_ORDER } from '@/lib/buyer-learn/modules/sellers';
