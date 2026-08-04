'use client';

import type { LessonSection } from '@/lib/buyer-learn/types';
import AffordabilityLab from '@/components/buyer-learn/AffordabilityLab';
import AchievementPanel from '@/components/buyer-learn/AchievementPanel';
import InfographicScene from '@/components/buyer-learn/InfographicScene';
import KnowledgeCard from '@/components/buyer-learn/KnowledgeCard';
import LearnerStory from '@/components/buyer-learn/LearnerStory';
import LessonQuiz from '@/components/buyer-learn/LessonQuiz';
import NextLessonCard from '@/components/buyer-learn/NextLessonCard';
import SectionReveal from '@/components/buyer-learn/SectionReveal';

function formatZar(n: number): string {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        maximumFractionDigits: 0,
    }).format(n);
}

export default function SectionRenderer({
    section,
    index,
    streakDays,
    totalXp,
    onQuizComplete,
    onContinueNext,
    hubBasePath = '/learn',
}: {
    section: LessonSection;
    index: number;
    streakDays: number;
    totalXp: number;
    onQuizComplete: (scorePct: number) => void;
    onContinueNext: () => void;
    hubBasePath?: string;
}) {
    const align = index % 3 === 0 ? 'left' : index % 3 === 1 ? 'right' : 'center';

    let body: React.ReactNode = null;

    switch (section.type) {
        case 'objectives':
            body = (
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal">
                        {section.title}
                    </h2>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {section.items.map((item, i) => (
                            <article
                                key={item.id}
                                className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm"
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <span className="text-[11px] font-bold text-gold tabular-nums">
                                    0{i + 1}
                                </span>
                                <h3 className="mt-2 font-semibold text-charcoal">{item.title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-charcoal/60">
                                    {item.body}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            );
            break;
        case 'infographic':
            body = (
                <InfographicScene
                    title={section.title}
                    subtitle={section.subtitle}
                    steps={section.steps}
                />
            );
            break;
        case 'story':
            body = (
                <LearnerStory
                    title={section.title}
                    persona={section.persona}
                    decisions={section.decisions}
                />
            );
            break;
        case 'timeline':
            body = (
                <div className="rounded-3xl border border-charcoal/10 bg-[#F8FAFC] p-5 sm:p-8">
                    <h2 className="text-2xl font-bold tracking-tight text-charcoal">{section.title}</h2>
                    <p className="mt-2 text-charcoal/55">{section.subtitle}</p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {section.items.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-2xl border border-charcoal/8 bg-white p-4"
                            >
                                {item.duration ? (
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold">
                                        {item.duration}
                                    </span>
                                ) : null}
                                <h3 className="mt-1 font-semibold text-charcoal">{item.title}</h3>
                                <p className="mt-1 text-sm text-charcoal/60 leading-relaxed">
                                    {item.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            );
            break;
        case 'comparison':
            body = (
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-charcoal">{section.title}</h2>
                    <p className="mt-2 text-charcoal/55">{section.subtitle}</p>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {section.columns.map((col) => (
                            <div
                                key={col.id}
                                className={`rounded-2xl border p-5 sm:p-6 ${
                                    col.highlight
                                        ? 'border-gold/30 bg-gold/[0.05]'
                                        : 'border-charcoal/10 bg-white'
                                }`}
                            >
                                <h3 className="text-lg font-semibold text-charcoal">{col.title}</h3>
                                <ul className="mt-4 space-y-2">
                                    {col.points.map((p) => (
                                        <li
                                            key={p}
                                            className="flex gap-2 text-sm text-charcoal/70 leading-relaxed"
                                        >
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            );
            break;
        case 'tool':
            body = (
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-charcoal">{section.title}</h2>
                    <p className="mt-2 mb-6 text-charcoal/55">{section.subtitle}</p>
                    {section.tool === 'affordability' ? <AffordabilityLab /> : null}
                </div>
            );
            break;
        case 'knowledge':
            body = (
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-charcoal">{section.title}</h2>
                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        {section.blocks.map((b) => (
                            <KnowledgeCard key={b.id} block={b} />
                        ))}
                    </div>
                </div>
            );
            break;
        case 'examples':
            body = (
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-charcoal">{section.title}</h2>
                    <p className="mt-2 text-charcoal/55">{section.subtitle}</p>
                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        {section.items.map((ex) => (
                            <article
                                key={ex.id}
                                className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm"
                            >
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gold">
                                    {ex.city}
                                </p>
                                <h3 className="mt-1 font-semibold text-charcoal">{ex.propertyLabel}</h3>
                                <dl className="mt-4 space-y-2 text-sm">
                                    <Row label="Price" value={formatZar(ex.price)} />
                                    <Row label="Deposit" value={formatZar(ex.deposit)} />
                                    <Row label="Bond" value={formatZar(ex.bond)} />
                                    <Row label="Rate" value={`${ex.ratePct}%`} />
                                    <Row label="~Monthly" value={formatZar(ex.monthly)} emph />
                                </dl>
                                <p className="mt-3 text-xs text-charcoal/50 leading-relaxed">
                                    {ex.note}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            );
            break;
        case 'quiz':
            body = (
                <LessonQuiz
                    title={section.title}
                    questions={section.questions}
                    onComplete={onQuizComplete}
                />
            );
            break;
        case 'achievement':
            body = (
                <AchievementPanel
                    title={section.title}
                    body={section.body}
                    badgeLabel={section.badgeLabel}
                    xp={section.xp}
                    streakDays={streakDays}
                    totalXp={totalXp}
                    onContinue={onContinueNext}
                />
            );
            break;
        case 'next':
            body = (
                <NextLessonCard
                    slug={section.slug}
                    title={section.title}
                    description={section.description}
                    hubBasePath={hubBasePath}
                />
            );
            break;
        default:
            body = null;
    }

    return (
        <SectionReveal align={align as 'left' | 'right' | 'center'}>
            <section id={`learn-section-${section.id}`} data-learn-section={section.id}>
                {body}
            </section>
        </SectionReveal>
    );
}

function Row({
    label,
    value,
    emph,
}: {
    label: string;
    value: string;
    emph?: boolean;
}) {
    return (
        <div className="flex justify-between gap-3 border-b border-charcoal/5 pb-1.5 last:border-0">
            <dt className="text-charcoal/45">{label}</dt>
            <dd
                className={`tabular-nums ${
                    emph ? 'font-semibold text-charcoal' : 'text-charcoal/80'
                }`}
            >
                {value}
            </dd>
        </div>
    );
}
