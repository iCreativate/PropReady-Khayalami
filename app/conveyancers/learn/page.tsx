'use client';

import Link from 'next/link';
import PortalHero from '@/components/PortalHero';
import CcPageShell from '@/components/conveyancer-connect/CcPageShell';
import { CC_CARD, CC_MUTED } from '@/components/conveyancer-connect/cc-ui';
import { LEARN_ARTICLES } from '@/lib/conveyancer-connect';

export default function LearnIndexPage() {
    return (
        <CcPageShell title="Education Centre">
            <div className="space-y-6">
                <PortalHero
                    size="compact"
                    eyebrow="Education Centre"
                    title="Understand conveyancing before you choose"
                    description="Guides on the transfer process, costs, bond registration, timelines and common mistakes — written for South African buyers and sellers."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    {LEARN_ARTICLES.map((a) => (
                        <Link key={a.slug} href={`/conveyancers/learn/${a.slug}`} className={`${CC_CARD} block p-5`}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                                {a.minutes} min read
                            </p>
                            <h2 className="mt-2 text-lg font-semibold text-charcoal">{a.title}</h2>
                            <p className={`${CC_MUTED} mt-2`}>{a.summary}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </CcPageShell>
    );
}
