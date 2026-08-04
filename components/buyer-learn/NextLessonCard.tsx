'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LEARN_BTN_PRIMARY, LEARN_CARD, LEARN_LABEL } from '@/lib/learn-course-ui';

export default function NextLessonCard({
    slug,
    title,
    description,
    hubBasePath = '/learn',
}: {
    slug: string;
    title: string;
    description: string;
    hubBasePath?: string;
}) {
    const href = `${hubBasePath.replace(/\/$/, '')}/${slug}`;
    return (
        <div className={`${LEARN_CARD} overflow-hidden grid md:grid-cols-[1.15fr_0.85fr]`}>
            <div className="p-7 sm:p-9">
                <p className={LEARN_LABEL}>Related lesson</p>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-charcoal">
                    {title}
                </h2>
                <p className="mt-3 text-charcoal/55 leading-relaxed max-w-md">{description}</p>
                <Link href={href} className={`${LEARN_BTN_PRIMARY} mt-7 inline-flex`}>
                    Start next lesson
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
            <div
                className="min-h-[180px] bg-gradient-to-br from-charcoal via-[#2a2a2a] to-[#141414] p-7 flex items-end"
                aria-hidden
            >
                <div className="w-full rounded-[18px] border border-white/10 bg-white/[0.06] backdrop-blur-sm p-5">
                    <div className="h-2 w-1/3 rounded-full bg-gold mb-3" />
                    <div className="h-2 w-2/3 rounded-full bg-white/20 mb-2" />
                    <div className="h-2 w-1/2 rounded-full bg-white/10" />
                </div>
            </div>
        </div>
    );
}
