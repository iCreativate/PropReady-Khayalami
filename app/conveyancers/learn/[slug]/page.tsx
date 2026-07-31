'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PortalHero from '@/components/PortalHero';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import { CC_CARD_FLAT, CC_MUTED } from '@/components/conveyancer-connect/cc-ui';
import { getLearnArticle } from '@/lib/conveyancer-connect';
import { PORTAL_SECONDARY_BTN } from '@/lib/portal-ui';

export default function LearnArticlePage() {
    const params = useParams();
    const slug = String(params.slug || '');
    const article = getLearnArticle(slug);
    if (!article) notFound();

    return (
        <CcPageShell title={article.title}>
            <div className="mx-auto max-w-3xl space-y-6">
                <Link href="/conveyancers/learn" className={PORTAL_SECONDARY_BTN}>
                    <ArrowLeft className="h-4 w-4" />
                    Education Centre
                </Link>
                <PortalHero
                    size="compact"
                    eyebrow={`${article.minutes} min read`}
                    title={article.title}
                    description={article.summary}
                />
                <div className="space-y-4">
                    {article.sections.map((s) => (
                        <section key={s.heading} className={`${CC_CARD_FLAT} p-6`}>
                            <h2 className="text-lg font-semibold text-charcoal">{s.heading}</h2>
                            <p className={`${CC_MUTED} mt-3`}>{s.body}</p>
                        </section>
                    ))}
                </div>
            </div>
        </CcPageShell>
    );
}
