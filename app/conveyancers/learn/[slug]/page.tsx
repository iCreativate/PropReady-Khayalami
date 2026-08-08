'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import PortalPageHeader from '@/components/PortalPageHeader';
import { getLearnArticle, LEARN_ARTICLES } from '@/lib/conveyancer-connect';
import '../../cc-content.css';

export default function LearnArticlePage() {
    const params = useParams();
    const slug = String(params.slug || '');
    const article = getLearnArticle(slug);
    if (!article) notFound();

    const index = LEARN_ARTICLES.findIndex((a) => a.slug === article.slug);
    const next = LEARN_ARTICLES[index + 1] ?? LEARN_ARTICLES[0];

    return (
        <CcPageShell
            title={article.title}
            pageHeader={
                <PortalPageHeader
                    variant="premium"
                    eyebrow={`Guide · ${String(index + 1).padStart(2, '0')}`}
                    eyebrowIcon={<BookOpen className="h-3.5 w-3.5 text-gold" />}
                    title={article.title}
                    description={article.summary}
                    glassLabel="Guide pulse"
                    metrics={[
                        { label: 'Read time', value: `${article.minutes} min` },
                        { label: 'Sections', value: article.sections.length },
                    ]}
                    stats={[
                        { label: 'Minutes', value: article.minutes },
                        { label: 'Sections', value: article.sections.length },
                        { label: 'Topic', value: 'Conveyancing' },
                        { label: 'Level', value: 'Practical', tone: 'success' },
                    ]}
                />
            }
        >
            <div className="cc-content">
                <Link href="/conveyancers/learn" className="cc-content-back">
                    <ArrowLeft aria-hidden /> Education Centre
                </Link>

                <article className="cc-content-article">
                    {article.sections.map((s, i) => (
                        <section key={s.heading} className="cc-content-section">
                            <span className="cc-content-section-num">
                                Section {String(i + 1).padStart(2, '0')}
                            </span>
                            <h2>{s.heading}</h2>
                            <p>{s.body}</p>
                        </section>
                    ))}
                </article>

                <div className="cc-content-cta">
                    <div>
                        <strong>Next: {next.title}</strong>
                        <p>Keep going, or return to the Education Centre.</p>
                    </div>
                    <Link href={`/conveyancers/learn/${next.slug}`}>
                        Continue <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                </div>
            </div>
        </CcPageShell>
    );
}
