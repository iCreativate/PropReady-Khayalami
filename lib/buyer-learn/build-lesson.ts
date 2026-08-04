import type {
    LearnerPersona,
    LessonChapter,
    LessonDifficulty,
    LessonModule,
    LessonSection,
    QuizQuestion,
} from '@/lib/buyer-learn/types';

const PERSONAS: LearnerPersona[] = [
    {
        name: 'Sipho',
        city: 'Johannesburg',
        role: 'Operations manager',
        netSalary: 28000,
        propertyPrice: 1350000,
        depositPct: 10,
        propertyLabel: '2-bed sectional title in Randburg',
        bio: 'Sipho has rented for six years and wants a first home without stretching every rand of take-home pay.',
    },
    {
        name: 'Nomsa',
        city: 'Pretoria',
        role: 'Nurse',
        netSalary: 24000,
        propertyPrice: 1180000,
        depositPct: 10,
        propertyLabel: '2-bed unit in Centurion',
        bio: 'Nomsa is buying her first place and needs clear numbers before she signs anything.',
    },
    {
        name: 'Thabo',
        city: 'Durban',
        role: 'Sales lead',
        netSalary: 32000,
        propertyPrice: 1750000,
        depositPct: 15,
        propertyLabel: '3-bed freestanding near Westville',
        bio: 'Thabo can stretch a little further on deposit, but he refuses to guess at transfer costs.',
    },
    {
        name: 'Lerato',
        city: 'Cape Town',
        role: 'Marketing specialist',
        netSalary: 30000,
        propertyPrice: 1650000,
        depositPct: 10,
        propertyLabel: '1-bed apartment, Southern Suburbs fringe',
        bio: 'Lerato loves Cape Town prices and hates surprises — she learns before she offers.',
    },
    {
        name: 'Ayanda',
        city: 'Johannesburg',
        role: 'Software engineer · first-time investor',
        netSalary: 45000,
        propertyPrice: 1450000,
        depositPct: 20,
        propertyLabel: '2-bed buy-to-let in Roodepoort',
        bio: 'Ayanda wants rental income without guessing at yields, vacancies, or transfer costs.',
    },
    {
        name: 'Kyle',
        city: 'Durban',
        role: 'Portfolio builder',
        netSalary: 55000,
        propertyPrice: 2100000,
        depositPct: 25,
        propertyLabel: '3-bed freestanding near Umhlanga fringe',
        bio: 'Kyle already owns one unit and is learning how to scale without over-leveraging.',
    },
];

export type LessonBlueprint = {
    slug: string;
    title: string;
    subtitle: string;
    difficulty: LessonDifficulty;
    minutes: number;
    xp: number;
    badgeLabel: string;
    nextSlug: string;
    nextTitle: string;
    nextDescription: string;
    hubBasePath?: string;
    progressId?: string;
    includeAffordabilityTool?: boolean;
    objectives: Array<{
        title: string;
        body: string;
        whyItMatters?: string;
        /** Chapter-specific “See it move” cards. Falls back to lesson steps. */
        steps?: Array<{ label: string; detail: string }>;
        /** Chapter deep dive. Falls back to timeline entry. */
        deepDive?: { title: string; body: string };
    }>;
    steps: Array<{ label: string; detail: string }>;
    timeline: Array<{ title: string; detail: string; duration: string }>;
    knowledge: Array<{
        variant:
            | 'takeaway'
            | 'tip'
            | 'warning'
            | 'mistake'
            | 'myth-fact'
            | 'law'
            | 'numbers'
            | 'definition';
        title: string;
        body?: string;
        myth?: string;
        fact?: string;
    }>;
    quiz: Array<{
        kind: 'mcq' | 'true-false' | 'scenario';
        prompt: string;
        options: Array<{ id: string; label: string }>;
        correctId: string;
        explanation: string;
    }>;
    personaIndex?: number;
};

export function buildLessonFromBlueprint(bp: LessonBlueprint): LessonModule {
    const persona = PERSONAS[(bp.personaIndex ?? 0) % PERSONAS.length];
    const objectives = bp.objectives.map((o, i) => ({
        id: `obj-${bp.slug}-${i}`,
        title: o.title,
        body: o.body,
    }));

    const chapters = buildChaptersFromBlueprint(bp, persona);

    const sections: LessonSection[] = [
        {
            type: 'objectives',
            id: 'objectives',
            title: 'What you will master',
            items: objectives,
        },
        {
            type: 'infographic',
            id: 'flow',
            title: 'How this works in practice',
            subtitle: 'A clear path — no walls of text.',
            steps: bp.steps.map((s, i) => ({
                id: `step-${i}`,
                label: s.label,
                detail: s.detail,
            })),
        },
        {
            type: 'story',
            id: 'story',
            title: `Meet ${persona.name}`,
            persona,
            decisions: [
                {
                    id: 'd1',
                    prompt: `${persona.name} is about to make a money decision on this topic. What should come first?`,
                    options: [
                        {
                            id: 'learn',
                            label: 'Learn the rules and numbers first',
                            outcome: `Smart. ${persona.name} avoids expensive mistakes by understanding the process before committing.`,
                            recommended: true,
                        },
                        {
                            id: 'rush',
                            label: 'Rush ahead and figure it out later',
                            outcome:
                                'That is how deposits get spent twice and approvals stall. Slow is smooth here.',
                        },
                    ],
                },
                {
                    id: 'd2',
                    prompt: `On a ${persona.propertyLabel} at roughly R${(persona.propertyPrice / 1000).toFixed(0)}k, what matters most right now?`,
                    options: [
                        {
                            id: 'budget',
                            label: 'True monthly cost including fees',
                            outcome:
                                'Yes — purchase price is only the headline. Fees, rates, and buffers decide affordability.',
                            recommended: true,
                        },
                        {
                            id: 'looks',
                            label: 'Whether the finishes look Instagram-ready',
                            outcome:
                                'Nice-to-have, not decisive. Banks and conveyancers care about documents and numbers first.',
                        },
                    ],
                },
            ],
        },
        {
            type: 'timeline',
            id: 'timeline',
            title: 'Realistic timeline',
            subtitle: 'South African timing — ranges, not promises.',
            items: bp.timeline.map((t, i) => ({
                id: `t-${i}`,
                title: t.title,
                detail: t.detail,
                duration: t.duration,
            })),
        },
        {
            type: 'knowledge',
            id: 'knowledge',
            title: 'Knowledge blocks',
            blocks: bp.knowledge.map((k, i) => ({
                id: `k-${i}`,
                variant: k.variant,
                title: k.title,
                body: k.body || '',
                myth: k.myth,
                fact: k.fact,
            })),
        },
        {
            type: 'examples',
            id: 'examples',
            title: 'South African snapshots',
            subtitle: 'Educational figures using mid-market bands — not quotes.',
            items: [
                {
                    id: 'ex-1',
                    city: persona.city,
                    propertyLabel: persona.propertyLabel,
                    price: persona.propertyPrice,
                    deposit: Math.round(persona.propertyPrice * (persona.depositPct / 100)),
                    bond: Math.round(persona.propertyPrice * (1 - persona.depositPct / 100)),
                    ratePct: 11.75,
                    monthly: Math.round(persona.netSalary * 0.32),
                    note: `${persona.name}'s ballpark — keep transfer and bond costs separate from the deposit.`,
                },
                {
                    id: 'ex-2',
                    city: 'Cape Town',
                    propertyLabel: 'Compact sectional · Metro fringe',
                    price: 1550000,
                    deposit: 155000,
                    bond: 1395000,
                    ratePct: 11.75,
                    monthly: 15000,
                    note: 'Coastal entry prices run hotter — income and deposit must stretch further.',
                },
                {
                    id: 'ex-3',
                    city: 'Johannesburg',
                    propertyLabel: 'Family home · Northern suburbs edge',
                    price: 2200000,
                    deposit: 440000,
                    bond: 1760000,
                    ratePct: 11.5,
                    monthly: 18600,
                    note: 'Larger deposits can improve pricing odds on bigger tickets.',
                },
            ],
        },
        {
            type: 'quiz',
            id: 'quiz',
            title: 'Check your understanding',
            questions: bp.quiz.map(
                (q, i): QuizQuestion => ({
                    id: `q-${i}`,
                    kind: q.kind,
                    prompt: q.prompt,
                    options: q.options,
                    correctId: q.correctId,
                    explanation: q.explanation,
                })
            ),
        },
        {
            type: 'achievement',
            id: 'achievement',
            title: `${bp.badgeLabel} unlocked`,
            body: `You finished “${bp.title}”. Keep the streak going — the next lesson builds on this.`,
            badgeLabel: bp.badgeLabel,
            xp: bp.xp,
        },
        {
            type: 'next',
            id: 'next',
            slug: bp.nextSlug,
            title: bp.nextTitle,
            description: bp.nextDescription,
        },
    ];

    // Insert tool on cost-related lessons
    if (
        bp.includeAffordabilityTool ||
        bp.slug === 'transfer-costs' ||
        bp.slug === 'home-loans' ||
        bp.slug === 'financing' ||
        bp.slug === 'returns'
    ) {
        sections.splice(4, 0, {
            type: 'tool',
            id: 'tool',
            title: 'Try the numbers',
            subtitle: 'Slide the dials — educational estimate only.',
            tool: 'affordability',
        });
    }

    return {
        meta: {
            slug: bp.slug,
            title: bp.title,
            subtitle: bp.subtitle,
            difficulty: bp.difficulty,
            minutes: Math.max(bp.minutes, objectives.length * 5),
            xp: bp.xp,
            badgeId: bp.progressId || bp.slug,
            badgeLabel: bp.badgeLabel,
            nextSlug: bp.nextSlug,
            nextTitle: bp.nextTitle,
            nextDescription: bp.nextDescription,
            hubBasePath: bp.hubBasePath,
            progressId: bp.progressId,
            courseLabel: bp.title,
            chapterCount: chapters.length,
        },
        objectives,
        sections,
        chapters,
    };
}

function buildChaptersFromBlueprint(
    bp: LessonBlueprint,
    persona: LearnerPersona
): LessonChapter[] {
    const myth = bp.knowledge.find((k) => k.variant === 'myth-fact');
    const mistakes = bp.knowledge
        .filter((k) => k.variant === 'mistake' || k.variant === 'warning')
        .map((k) => k.body || k.title);
    const tips = bp.knowledge.filter((k) => k.variant === 'tip' || k.variant === 'takeaway');

    return bp.objectives.map((obj, i) => {
        const quiz = bp.quiz[i % Math.max(bp.quiz.length, 1)] || {
            kind: 'true-false' as const,
            prompt: `True or false: understanding “${obj.title}” before you commit reduces expensive surprises.`,
            options: [
                { id: 'true', label: 'True' },
                { id: 'false', label: 'False' },
            ],
            correctId: 'true',
            explanation: 'Clear concepts before commitment protect your deposit and timeline.',
        };
        const stepSlice =
            obj.steps && obj.steps.length > 0
                ? obj.steps
                : bp.steps.length
                  ? bp.steps
                  : [{ label: obj.title, detail: obj.body }];
        const tone = i % 2 === 0 ? 'dark' : 'light';
        const deposit = Math.round(persona.propertyPrice * (persona.depositPct / 100));
        const bond = persona.propertyPrice - deposit;
        const timelineEntry = bp.timeline[i % Math.max(bp.timeline.length, 1)];

        return {
            id: `ch-${bp.slug}-${i}`,
            title: obj.title,
            eyebrow: `Chapter idea ${i + 1}`,
            plainEnglish: obj.body,
            whyItMatters:
                obj.whyItMatters ||
                tips[i % Math.max(tips.length, 1)]?.body ||
                `${persona.name} in ${persona.city} uses this before signing anything expensive.`,
            tone,
            illustration: (['strategy', 'costs', 'deposit', 'rates', 'bond', 'default'] as const)[
                i % 6
            ],
            infographic: stepSlice.map((s, si) => ({
                id: `inf-${i}-${si}`,
                label: s.label,
                detail: s.detail,
            })),
            caseStudy: {
                id: `cs-${bp.slug}-${i}`,
                headline: `${persona.name}'s ${persona.city} snapshot`,
                story: `${persona.bio} This chapter applies directly to a ${persona.propertyLabel}.`,
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                price: persona.propertyPrice,
                deposit,
                bond,
                ratePct: 11.75,
                monthly: Math.round(persona.netSalary * 0.3),
                note: 'Educational figures — confirm with your lender.',
            },
            mistakes:
                mistakes.length > 0
                    ? mistakes.slice(0, 3)
                    : [
                          'Rushing without numbers',
                          'Ignoring fees and buffers',
                          'Copying someone else’s deal blindly',
                      ],
            mythFact: {
                myth: myth?.myth || 'You can skip learning and “figure it out later”.',
                fact:
                    myth?.fact ||
                    'Clear concepts before commitment save deposits, time, and stress.',
            },
            exercise: {
                kind: 'choice' as const,
                prompt: `Quick judgement call for ${persona.name}:`,
                options: [
                    {
                        id: 'good',
                        label: 'Learn the numbers and process first',
                        feedback: 'Yes — curiosity before commitment.',
                        correct: true,
                    },
                    {
                        id: 'bad',
                        label: 'Sign now and research afterwards',
                        feedback: 'That is how expensive surprises happen.',
                    },
                ],
            },
            checklist:
                i === bp.objectives.length - 1
                    ? {
                          title: `${bp.badgeLabel} checklist`,
                          items: bp.objectives.map((o) => o.title),
                      }
                    : undefined,
            quiz: {
                id: `q-${bp.slug}-${i}`,
                kind: quiz.kind,
                prompt: quiz.prompt,
                options: quiz.options,
                correctId: quiz.correctId,
                explanation: quiz.explanation,
            },
            deepDive: {
                title: obj.deepDive?.title || timelineEntry?.title || 'Go deeper',
                body:
                    obj.deepDive?.body ||
                    timelineEntry?.detail ||
                    bp.knowledge.find((k) => k.variant === 'law' || k.variant === 'definition')
                        ?.body ||
                    'Advanced detail varies by bank, suburb, and structure — verify with professionals.',
            },
            bridge: {
                nextLabel:
                    i < bp.objectives.length - 1
                        ? bp.objectives[i + 1].title
                        : bp.nextTitle,
                teaser:
                    i < bp.objectives.length - 1
                        ? `Next up: ${bp.objectives[i + 1].body}`
                        : bp.nextDescription,
            },
        };
    });
}
