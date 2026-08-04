import ImmersiveLessonCanvas from '@/components/buyer-learn/ImmersiveLessonCanvas';
import LearningLandingRoot from '@/components/marketing/learn/LearningLandingRoot';
import { getSellerLesson } from '@/lib/buyer-learn/modules/sellers';
import Link from 'next/link';

export default async function SellersLearningModulePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const lesson = getSellerLesson(slug);

    if (!lesson) {
        return (
            <LearningLandingRoot>
                <div className="min-h-screen flex items-center justify-center px-4 home-landing">
                    <div className="text-center text-charcoal">
                        <h1 className="hl-display text-4xl mb-4">Module not found</h1>
                        <Link href="/sellers" className="hl-link">
                            Back to Sellers hub
                        </Link>
                    </div>
                </div>
            </LearningLandingRoot>
        );
    }

    return (
        <LearningLandingRoot>
            <ImmersiveLessonCanvas lesson={lesson} />
        </LearningLandingRoot>
    );
}
