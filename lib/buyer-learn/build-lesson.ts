import type {
    ChapterCaseStudy,
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

/** Educational illustration only — not a live bank quote. Confirm current prime with lenders. */
const ILLUSTRATIVE_RATE_PCT = 10.5;

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
        /** Chapter-specific “See it move” cards. Falls back to expanded lesson steps. */
        steps?: Array<{ label: string; detail: string }>;
        /** Chapter deep dive. Falls back to timeline entry. */
        deepDive?: { title: string; body: string };
        /** Optional topic-aligned case study override. */
        caseStudy?: Partial<ChapterCaseStudy> & { headline?: string; story?: string };
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

type TopicKind =
    | 'finance'
    | 'insurance'
    | 'process'
    | 'legal'
    | 'costs'
    | 'agents'
    | 'investing'
    | 'selling'
    | 'general';

function detectTopicKind(slug: string, chapterTitle: string, lessonTitle: string): TopicKind {
    const hay = `${slug} ${chapterTitle} ${lessonTitle}`.toLowerCase();
    if (/insurance|insurer|uninsured|cover|landlord cover|sum insured/.test(hay)) return 'insurance';
    if (/bond|loan|prequal|afford|deposit|rate|financing|credit|nca|surety|home-loans/.test(hay))
        return 'finance';
    if (/trust|deceased|estate|otp|conveyanc|deed|resolution|company|cc\b|legal|fica|flisp/.test(hay))
        return 'legal';
    if (/\bagents?\b|mandate|ppra|estate agent/.test(hay)) return 'agents';
    if (/yield|roi|rental|portfolio|investor|landlord|buy-to-let|gearing|returns|strategies/.test(hay))
        return 'investing';
    if (/sell|pricing|cma|marketing|staging|viewing|seller/.test(hay)) return 'selling';
    if (/transfer.?cost|transfer duty|attorney fee|levy|selling cost|net proceed|costs/.test(hay))
        return 'costs';
    if (/process|timeline|step|offer|registration|transfer|buying-process/.test(hay)) return 'process';
    return 'general';
}

function firstSentences(text: string, max = 2): string {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    const parts = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
    return parts.slice(0, max).join(' ');
}

function expandStepDetail(label: string, detail: string, chapterBody: string, chapterTitle: string): string {
    const trimmed = detail.trim();
    if (trimmed.length >= 160) return trimmed;

    const context = firstSentences(chapterBody, 2);
    const extras = [
        `In South African practice, “${label}” sits inside the broader lesson on ${chapterTitle.toLowerCase()}.`,
        context,
        'Treat this as an educational walkthrough — confirm bank, insurer, conveyancer, or tax details with licensed professionals before you act.',
    ]
        .filter(Boolean)
        .join('\n\n');

    if (trimmed.length === 0) return extras;
    return `${trimmed}\n\n${extras}`;
}

function buildSeeItMoveSteps(
    obj: LessonBlueprint['objectives'][number],
    bp: LessonBlueprint
): Array<{ label: string; detail: string }> {
    if (obj.steps && obj.steps.length > 0) {
        return obj.steps.map((s) => ({
            label: s.label,
            detail: expandStepDetail(s.label, s.detail, obj.body, obj.title),
        }));
    }

    // Prefer curated lesson walkthroughs, tied back to this chapter’s topic.
    if (bp.steps.length > 0) {
        return bp.steps.map((s) => ({
            label: s.label,
            detail: expandStepDetail(
                s.label,
                `${s.detail}\n\nHow this connects to “${obj.title}”: ${firstSentences(obj.body, 2)}`,
                obj.body,
                obj.title
            ),
        }));
    }

    const paragraphs = obj.body
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 40);

    if (paragraphs.length >= 2) {
        return paragraphs.slice(0, 4).map((p, i) => ({
            label: i === 0 ? `Understand ${obj.title}` : `Apply step ${i + 1}`,
            detail: expandStepDetail(
                i === 0 ? obj.title : `Step ${i + 1}`,
                p,
                obj.body,
                obj.title
            ),
        }));
    }

    return [
        {
            label: `Frame ${obj.title}`,
            detail: expandStepDetail(obj.title, obj.body, obj.body, obj.title),
        },
        {
            label: 'Check South African process touchpoints',
            detail: expandStepDetail(
                'Process touchpoints',
                'Identify who must act next — lender, insurer, conveyancer, agent, body corporate, or accountant — and what document or proof they need.',
                obj.body,
                obj.title
            ),
        },
        {
            label: 'Verify before you commit',
            detail: expandStepDetail(
                'Verify',
                'Write down open questions and confirm answers in writing. Educational modules explain frameworks; live quotes, policies, and OTPs are deal-specific.',
                obj.body,
                obj.title
            ),
        },
    ];
}

function formatZarShort(n: number): string {
    return `R${Math.round(n).toLocaleString('en-ZA')}`;
}

function buildTopicCaseStudy(
    bp: LessonBlueprint,
    obj: LessonBlueprint['objectives'][number],
    persona: LearnerPersona,
    index: number
): ChapterCaseStudy {
    if (obj.caseStudy?.headline && obj.caseStudy?.story) {
        return {
            id: `cs-${bp.slug}-${index}`,
            headline: obj.caseStudy.headline,
            story: obj.caseStudy.story,
            city: obj.caseStudy.city || persona.city,
            propertyLabel: obj.caseStudy.propertyLabel || persona.propertyLabel,
            note:
                obj.caseStudy.note ||
                'Educational illustration — not a live quote, policy schedule, or legal opinion.',
            price: obj.caseStudy.price,
            deposit: obj.caseStudy.deposit,
            bond: obj.caseStudy.bond,
            ratePct: obj.caseStudy.ratePct,
            monthly: obj.caseStudy.monthly,
            highlights: obj.caseStudy.highlights,
        };
    }

    const topic = detectTopicKind(bp.slug, obj.title, bp.title);
    const deposit = Math.round(persona.propertyPrice * (persona.depositPct / 100));
    const bond = persona.propertyPrice - deposit;
    const focus = firstSentences(obj.body, 2);
    const baseNote =
        'Educational illustration using a realistic South African scenario — confirm live figures with licensed professionals.';

    switch (topic) {
        case 'insurance': {
            const rebuildBand = Math.round(persona.propertyPrice * 0.85);
            return {
                id: `cs-${bp.slug}-${index}`,
                headline: `${persona.name} checks cover before transfer`,
                story: `${persona.name} is looking at a ${persona.propertyLabel} in ${persona.city}. For “${obj.title}”, the decision is not the purchase price alone — it is whether building and contents risks are scheduled correctly, whether the bank is noted as interested party if a bond is registered, and whether the sum insured tracks rebuild cost.\n\n${focus}\n\n${persona.name} asks the insurer/intermediary for a written schedule that matches this chapter’s checklist before registration.`,
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                note: baseNote,
                highlights: [
                    { label: 'Focus', value: obj.title },
                    { label: 'Property type', value: persona.propertyLabel },
                    {
                        label: 'Rebuild check',
                        value: `Ask whether sum insured ≈ rebuild (illustrative band near ${formatZarShort(rebuildBand)})`,
                    },
                    { label: 'Bond link', value: 'Bank usually requires continuous building cover' },
                ],
            };
        }
        case 'finance':
            return {
                id: `cs-${bp.slug}-${index}`,
                headline: `${persona.name} applies “${obj.title}” to a ${persona.city} purchase`,
                story: `${persona.bio} On a ${persona.propertyLabel} around ${formatZarShort(persona.propertyPrice)}, this chapter’s topic — ${obj.title} — is the filter before OTP or bond submission.\n\n${focus}\n\n${persona.name} separates deposit cash from transfer/bond costs and treats any repayment figure as educational until a lender issues a formal quote.`,
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                price: persona.propertyPrice,
                deposit,
                bond,
                ratePct: ILLUSTRATIVE_RATE_PCT,
                note: `${baseNote} Illustrative rate near recent prime bands (${ILLUSTRATIVE_RATE_PCT}% shown) — not your offered rate.`,
                highlights: [
                    { label: 'Chapter focus', value: obj.title },
                    { label: 'Deposit planning', value: `${persona.depositPct}% · ${formatZarShort(deposit)}` },
                    { label: 'Loan planning', value: formatZarShort(bond) },
                    { label: 'Next proof', value: 'Soft/full assessment docs — not Instagram finishes' },
                ],
            };
        case 'costs':
            return {
                id: `cs-${bp.slug}-${index}`,
                headline: `${persona.name} budgets beyond the headline price`,
                story: `${persona.name} in ${persona.city} is working through “${obj.title}” on a ${persona.propertyLabel}. Purchase price is only the headline — transfer duty (where applicable), attorney fees, bond registration costs, and moving buffers sit beside it.\n\n${focus}\n\n${persona.name} builds a written cost sheet before making an offer, then verifies each line with a conveyancer or originator.`,
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                price: persona.propertyPrice,
                deposit,
                note: baseNote,
                highlights: [
                    { label: 'Chapter focus', value: obj.title },
                    { label: 'Headline price', value: formatZarShort(persona.propertyPrice) },
                    { label: 'Cash besides deposit', value: 'Transfer + bond costs + buffer' },
                    { label: 'Verify with', value: 'Conveyancer cost estimate / duty tables' },
                ],
            };
        case 'legal':
            return {
                id: `cs-${bp.slug}-${index}`,
                headline: `${persona.name} verifies authority before signing`,
                story: `For “${obj.title}”, ${persona.name} treats paperwork and legal capacity as deal-breakers — not admin. On a ${persona.propertyLabel} in ${persona.city}, the wrong seller, missing resolution, or unread OTP clause can stall transfer or finance.\n\n${focus}\n\n${persona.name} refuses to sign until the conveyancer confirms the parties and annexures match this chapter’s checks.`,
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                note: baseNote,
                highlights: [
                    { label: 'Chapter focus', value: obj.title },
                    { label: 'Property', value: persona.propertyLabel },
                    { label: 'Gate', value: 'Authority + FICA + OTP clauses in writing' },
                    { label: 'Professional', value: 'Conveyancer / attorney review' },
                ],
            };
        case 'agents':
            return {
                id: `cs-${bp.slug}-${index}`,
                headline: `${persona.name} chooses professional help on purpose`,
                story: `${persona.name} applies “${obj.title}” while searching around ${persona.city}. Commission, mandate type, and verification status change incentives — so ${persona.name} asks clear questions before sharing finances or signing a mandate.\n\n${focus}`,
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                note: baseNote,
                highlights: [
                    { label: 'Chapter focus', value: obj.title },
                    { label: 'Ask for', value: 'PPRA status / mandate terms in writing' },
                    { label: 'Money rule', value: 'Never pay deposits into personal accounts' },
                    { label: 'Property context', value: persona.propertyLabel },
                ],
            };
        case 'investing':
            return {
                id: `cs-${bp.slug}-${index}`,
                headline: `${persona.name} underwrites “${obj.title}” like a deal memo`,
                story: `${persona.bio} Before committing near ${persona.city}, ${persona.name} tests this chapter’s idea against rent, vacancy, rates/levies, insurance, and debt service — not against excitement.\n\n${focus}`,
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                price: persona.propertyPrice,
                deposit,
                bond,
                note: baseNote,
                highlights: [
                    { label: 'Chapter focus', value: obj.title },
                    { label: 'Asset', value: persona.propertyLabel },
                    { label: 'Underwrite', value: 'Rent − costs − vacancy − debt service' },
                    { label: 'Deposit plan', value: `${persona.depositPct}% · ${formatZarShort(deposit)}` },
                ],
            };
        case 'selling':
            return {
                id: `cs-${bp.slug}-${index}`,
                headline: `${persona.name} sells with process, not panic`,
                story: `While preparing a ${persona.city} sale, ${persona.name} uses “${obj.title}” as the decision filter — pricing evidence, mandate clarity, or risk handover — instead of social-media anecdotes.\n\n${focus}`,
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                note: baseNote,
                highlights: [
                    { label: 'Chapter focus', value: obj.title },
                    { label: 'Evidence', value: 'Comps / CMA before emotion' },
                    { label: 'Risk', value: 'Insurance live until registration' },
                    { label: 'Net sheet', value: 'Price − commission − bond settle − costs' },
                ],
            };
        case 'process':
            return {
                id: `cs-${bp.slug}-${index}`,
                headline: `${persona.name} sequences the journey correctly`,
                story: `${persona.name} maps “${obj.title}” onto a ${persona.propertyLabel} path in ${persona.city}: what must happen before OTP, before bond grant, and before registration.\n\n${focus}\n\nSkipping sequence is how deposits and timelines get burned.`,
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                note: baseNote,
                highlights: [
                    { label: 'Chapter focus', value: obj.title },
                    { label: 'City', value: persona.city },
                    { label: 'Sequence', value: 'Learn → documents → offer → finance → transfer' },
                    { label: 'Owner of next step', value: 'Name the professional responsible' },
                ],
            };
        default:
            return {
                id: `cs-${bp.slug}-${index}`,
                headline: `${persona.name} applies “${obj.title}” in ${persona.city}`,
                story: `${persona.bio} This chapter is about ${obj.title.toLowerCase()} on a ${persona.propertyLabel}.\n\n${focus}\n\n${persona.name} writes one action from this chapter before moving to the next module.`,
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                note: baseNote,
                highlights: [
                    { label: 'Chapter focus', value: obj.title },
                    { label: 'Context', value: persona.propertyLabel },
                    { label: 'City', value: persona.city },
                    { label: 'Action', value: 'One written check before committing money' },
                ],
            };
    }
}

function buildTopicMistakes(
    bp: LessonBlueprint,
    obj: LessonBlueprint['objectives'][number],
    fallback: string[]
): string[] {
    const fromKnowledge = bp.knowledge
        .filter((k) => k.variant === 'mistake' || k.variant === 'warning')
        .map((k) => k.body || k.title)
        .filter(Boolean);

    const topic = detectTopicKind(bp.slug, obj.title, bp.title);
    const topical: Record<TopicKind, string[]> = {
        insurance: [
            `Treating “${obj.title}” as optional while a bond still requires building cover.`,
            'Insuring for purchase price instead of rebuild / replacement cost.',
            'Assuming body-corporate or seller cover automatically protects you after occupation.',
        ],
        finance: [
            `Skipping “${obj.title}” and discovering the gap after OTP.`,
            'Taking new credit during assessment without checking impact on affordability.',
            'Confusing a soft estimate with a formal grant.',
        ],
        costs: [
            'Budgeting only the purchase price and forgetting transfer/bond cash.',
            'Using informal WhatsApp figures instead of conveyancer estimates.',
            `Ignoring how “${obj.title}” changes net cash needed at transfer.`,
        ],
        legal: [
            'Signing before authority, FICA, or OTP annexures are clear.',
            'Paying funds into personal accounts outside the conveyancer trust channel.',
            `Treating “${obj.title}” as paperwork instead of a deal gate.`,
        ],
        agents: [
            'Appointing on personality alone without mandate terms in writing.',
            'Sharing bank statements before verifying the professional channel.',
            'Ignoring walk-away signs once excitement builds.',
        ],
        investing: [
            'Underwriting with best-case rent and zero vacancy.',
            'Ignoring insurance, levies, and rates in net yield.',
            `Buying before “${obj.title}” is written into the deal memo.`,
        ],
        selling: [
            'Pricing from need or emotion instead of comparable evidence.',
            'Letting cover lapse between acceptance and registration.',
            'Hiding known defects that later derail the OTP.',
        ],
        process: [
            'Jumping steps because a WhatsApp group said it was “fine”.',
            'Losing days because nobody owns the next document.',
            `Starting the next stage before “${obj.title}” is complete.`,
        ],
        general: fallback,
    };

    const merged = [...fromKnowledge.slice(0, 2), ...topical[topic]];
    return Array.from(new Set(merged)).slice(0, 3);
}

function buildTopicExercise(
    obj: LessonBlueprint['objectives'][number],
    persona: LearnerPersona
): LessonChapter['exercise'] {
    return {
        kind: 'choice',
        prompt: `Quick judgement call for ${persona.name} on “${obj.title}”:`,
        options: [
            {
                id: 'good',
                label: `Apply this chapter’s checks before committing money or signing`,
                feedback: `Yes — “${obj.title}” is a decision filter, not trivia.`,
                correct: true,
            },
            {
                id: 'bad',
                label: 'Skip it and hope the agent or bank catches everything later',
                feedback: 'That is how expensive surprises and stalled transfers happen.',
            },
        ],
    };
}

export function buildLessonFromBlueprint(bp: LessonBlueprint): LessonModule {
    const persona = PERSONAS[(bp.personaIndex ?? 0) % PERSONAS.length];
    const objectives = bp.objectives.map((o, i) => ({
        id: `obj-${bp.slug}-${i}`,
        title: o.title,
        body: o.body,
    }));

    const chapters = buildChaptersFromBlueprint(bp, persona);
    const topic = detectTopicKind(bp.slug, bp.title, bp.title);

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
                detail: expandStepDetail(s.label, s.detail, bp.subtitle, bp.title),
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
                    prompt: `${persona.name} is studying “${bp.title}”. What should come first?`,
                    options: [
                        {
                            id: 'learn',
                            label: 'Learn this module’s rules and checks first',
                            outcome: `Smart. ${persona.name} avoids expensive mistakes by understanding “${bp.title}” before committing.`,
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
                    prompt: `On a ${persona.propertyLabel} in ${persona.city}, what matters most for this lesson?`,
                    options: [
                        {
                            id: 'budget',
                            label: 'The specific checks taught in this module',
                            outcome: `Yes — apply “${bp.title}” to the real deal, then confirm with professionals.`,
                            recommended: true,
                        },
                        {
                            id: 'looks',
                            label: 'Whether the finishes look Instagram-ready',
                            outcome:
                                'Nice-to-have, not decisive. Process, documents, and verified numbers come first.',
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
            subtitle:
                topic === 'finance' || topic === 'costs' || topic === 'investing'
                    ? 'Educational planning bands — not bank quotes or valuations.'
                    : 'Scenario cards tied to this lesson — not live quotes.',
            items: buildLessonSnapshots(bp, persona, topic),
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

function buildLessonSnapshots(
    bp: LessonBlueprint,
    persona: LearnerPersona,
    topic: TopicKind
) {
    const deposit = Math.round(persona.propertyPrice * (persona.depositPct / 100));
    const bond = persona.propertyPrice - deposit;

    if (topic === 'insurance') {
        return [
            {
                id: 'ex-1',
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                note: 'Educational scenario for this insurance lesson — not a policy quote.',
                highlights: [
                    { label: 'Lesson', value: bp.title },
                    { label: 'Ask', value: 'Building vs contents vs bond requirement' },
                    { label: 'Sum insured', value: 'Rebuild / replacement — not purchase price' },
                ],
            },
            {
                id: 'ex-2',
                city: 'Cape Town',
                propertyLabel: 'Sectional title · body corporate building policy',
                note: 'Confirm what the body corporate covers before you skip owners’ contents.',
                highlights: [
                    { label: 'Often covered', value: 'Building (via body corporate)' },
                    { label: 'Usually yours', value: 'Contents + improvements' },
                    { label: 'Proof', value: 'Written schedule / levy statement extract' },
                ],
            },
            {
                id: 'ex-3',
                city: 'Johannesburg',
                propertyLabel: 'Freestanding home · bonded',
                note: 'Lenders typically require continuous building cover with the bank noted.',
                highlights: [
                    { label: 'Bank need', value: 'Building cover in force' },
                    { label: 'Owner choice', value: 'Contents + liability extras' },
                    { label: 'Risk', value: 'Lapse can breach bond conditions' },
                ],
            },
        ];
    }

    if (topic === 'legal' || topic === 'process' || topic === 'agents' || topic === 'selling') {
        return [
            {
                id: 'ex-1',
                city: persona.city,
                propertyLabel: persona.propertyLabel,
                note: 'Scenario tied to this lesson — not a valuation or quote.',
                highlights: [
                    { label: 'Lesson', value: bp.title },
                    { label: 'Persona', value: `${persona.name} · ${persona.role}` },
                    { label: 'Gate', value: firstSentences(bp.subtitle, 1) },
                ],
            },
            {
                id: 'ex-2',
                city: 'Pretoria',
                propertyLabel: 'Document-first purchase / sale',
                note: 'Process discipline beats speed when OTPs and FICA are involved.',
                highlights: [
                    { label: 'Order', value: 'Authority → documents → signatures' },
                    { label: 'Money', value: 'Conveyancer trust account only' },
                    { label: 'Advice', value: 'Licensed professionals for deal-specific calls' },
                ],
            },
            {
                id: 'ex-3',
                city: 'Durban',
                propertyLabel: 'Transfer timeline awareness',
                note: 'Ranges vary by bank, municipality, and completeness of packs.',
                highlights: [
                    { label: 'Expect', value: 'Weeks to months — not overnight' },
                    { label: 'Delays', value: 'Missing docs, rates clearances, bond conditions' },
                    { label: 'Owner', value: 'Know who chases each dependency' },
                ],
            },
        ];
    }

    return [
        {
            id: 'ex-1',
            city: persona.city,
            propertyLabel: persona.propertyLabel,
            price: persona.propertyPrice,
            deposit,
            bond,
            ratePct: ILLUSTRATIVE_RATE_PCT,
            note: `${persona.name}'s planning band for “${bp.title}” — educational only; confirm with lenders.`,
            highlights: [
                { label: 'Lesson', value: bp.title },
                { label: 'Deposit plan', value: `${persona.depositPct}%` },
            ],
        },
        {
            id: 'ex-2',
            city: 'Cape Town',
            propertyLabel: 'Compact sectional · Metro fringe',
            price: 1550000,
            deposit: 155000,
            bond: 1395000,
            ratePct: ILLUSTRATIVE_RATE_PCT,
            note: 'Coastal entry prices often run hotter — income and deposit must stretch further. Educational band only.',
        },
        {
            id: 'ex-3',
            city: 'Johannesburg',
            propertyLabel: 'Family home · Northern suburbs edge',
            price: 2200000,
            deposit: 440000,
            bond: 1760000,
            ratePct: ILLUSTRATIVE_RATE_PCT,
            note: 'Larger deposits can improve pricing odds on bigger tickets — still not a bank quote.',
        },
    ];
}

function buildChaptersFromBlueprint(
    bp: LessonBlueprint,
    persona: LearnerPersona
): LessonChapter[] {
    const myth = bp.knowledge.find((k) => k.variant === 'myth-fact');
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
            explanation: `Clear concepts on “${obj.title}” before commitment protect your deposit and timeline.`,
        };
        const stepSlice = buildSeeItMoveSteps(obj, bp);
        const tone = i % 2 === 0 ? 'dark' : 'light';
        const timelineEntry = bp.timeline[i % Math.max(bp.timeline.length, 1)];

        return {
            id: `ch-${bp.slug}-${i}`,
            title: obj.title,
            eyebrow: `Chapter ${i + 1}`,
            plainEnglish: obj.body,
            whyItMatters:
                obj.whyItMatters ||
                tips[i % Math.max(tips.length, 1)]?.body ||
                `${persona.name} in ${persona.city} uses “${obj.title}” before signing anything expensive.`,
            tone,
            illustration: (['strategy', 'costs', 'deposit', 'rates', 'bond', 'default'] as const)[
                i % 6
            ],
            infographic: stepSlice.map((s, si) => ({
                id: `inf-${i}-${si}`,
                label: s.label,
                detail: s.detail,
            })),
            caseStudy: buildTopicCaseStudy(bp, obj, persona, i),
            mistakes: buildTopicMistakes(bp, obj, [
                `Rushing past “${obj.title}” without a written check`,
                'Ignoring fees, buffers, or professional confirmations',
                'Copying someone else’s deal blindly',
            ]),
            mythFact: {
                myth: myth?.myth || `You can skip “${obj.title}” and figure it out after you sign.`,
                fact:
                    myth?.fact ||
                    `Clear understanding of “${obj.title}” before commitment saves deposits, time, and stress.`,
            },
            exercise: buildTopicExercise(obj, persona),
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
                title: obj.deepDive?.title || timelineEntry?.title || `Go deeper on ${obj.title}`,
                body:
                    obj.deepDive?.body ||
                    (timelineEntry
                        ? `${timelineEntry.detail}${timelineEntry.duration ? ` Typical timing: ${timelineEntry.duration}.` : ''}\n\n${firstSentences(obj.body, 2)}`
                        : undefined) ||
                    bp.knowledge.find((k) => k.variant === 'law' || k.variant === 'definition')
                        ?.body ||
                    `Advanced detail on “${obj.title}” varies by bank, suburb, insurer, and legal structure — verify with licensed professionals. ${firstSentences(obj.body, 2)}`,
            },
            bridge: {
                nextLabel:
                    i < bp.objectives.length - 1 ? bp.objectives[i + 1].title : bp.nextTitle,
                teaser:
                    i < bp.objectives.length - 1
                        ? `Next up: ${firstSentences(bp.objectives[i + 1].body, 2)}`
                        : bp.nextDescription,
            },
        };
    });
}
