'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import PortalPageHeader from '@/components/PortalPageHeader';
import { LEARN_ARTICLES } from '@/lib/conveyancer-connect';
import '../cc-content.css';

export default function LearnIndexPage() {
    return (
        <CcPageShell
            title="Education Centre"
            pageHeader={
                <PortalPageHeader
                    variant="premium"
                    eyebrow="Conveyancer Connect · Education"
                    eyebrowIcon={<BookOpen className="h-3.5 w-3.5 text-gold" />}
                    title="Understand conveyancing before you choose"
                    description="Practical guides on the SA transfer process, costs, bond registration, timelines and common mistakes — written for buyers and sellers."
                    glassLabel="Learning pulse"
                    metrics={[
                        { label: 'Guides', value: LEARN_ARTICLES.length },
                        { label: 'Format', value: 'Self-paced' },
                    ]}
                    stats={[
                        { label: 'Articles', value: LEARN_ARTICLES.length },
                        { label: 'Audience', value: 'Buyers & sellers' },
                        { label: 'Focus', value: 'SA transfer' },
                        { label: 'Status', value: 'Ready to read', tone: 'success' },
                    ]}
                />
            }
        >
            <div className="cc-content">
                <Link href="/conveyancers" className="cc-content-back">
                    <ArrowLeft aria-hidden /> Conveyancer Connect
                </Link>

                <div className="cc-content-grid">
                    {LEARN_ARTICLES.map((a, i) => (
                        <Link
                            key={a.slug}
                            href={`/conveyancers/learn/${a.slug}`}
                            className="cc-content-card"
                            style={{ animationDelay: `${i * 0.04}s` }}
                        >
                            <span className="cc-content-card-index">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <h3>{a.title}</h3>
                            <p>{a.summary}</p>
                            <div className="cc-content-card-foot">
                                <span>{a.minutes} min read</span>
                                <em>
                                    Read <ArrowRight className="inline h-3.5 w-3.5" aria-hidden />
                                </em>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="cc-content-cta">
                    <div>
                        <strong>Ready to instruct?</strong>
                        <p>Compare verified firms near you when you understand the process.</p>
                    </div>
                    <Link href="/conveyancers">
                        Find a conveyancer <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                </div>
            </div>
        </CcPageShell>
    );
}
