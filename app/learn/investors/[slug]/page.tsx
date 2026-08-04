import ImmersiveLessonCanvas from '@/components/buyer-learn/ImmersiveLessonCanvas';
import { getInvestorLesson } from '@/lib/buyer-learn/modules/investors';
import Link from 'next/link';

export default async function InvestorsLearningModulePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const lesson = getInvestorLesson(slug);

    if (!lesson) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="text-center text-charcoal">
                    <h1 className="text-4xl font-bold mb-4">Module Not Found</h1>
                    <Link href="/learn/investors" className="text-gold hover:underline">
                        Back to Property Investors Learning Center
                    </Link>
                </div>
            </div>
        );
    }

    return <ImmersiveLessonCanvas lesson={lesson} />;
}
