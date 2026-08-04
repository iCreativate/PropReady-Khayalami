'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowRight,
    BadgeCheck,
    BarChart3,
    BookOpen,
    Brain,
    Building2,
    Calculator,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Coins,
    HandCoins,
    Home,
    Landmark,
    Scale,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import FloatingDashboard from '@/components/marketing/home/FloatingDashboard';
import { LEARNING_HUBS } from '@/lib/learning-hubs';

function Reveal({
    children,
    className = '',
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

const TRUST = [
    { label: 'Major banks', icon: Landmark },
    { label: 'Bond originators', icon: HandCoins },
    { label: 'Conveyancers', icon: Scale },
    { label: 'Estate agencies', icon: Building2 },
    { label: 'PPRA professionals', icon: BadgeCheck },
    { label: 'First-time buyers', icon: Users },
];

const STEPS = [
    {
        n: '01',
        title: 'Learn',
        body: 'Interactive lessons for buyers, sellers and investors — bonds, costs, offers and pitfalls, explained clearly.',
        icon: BookOpen,
        tone: '' as const,
    },
    {
        n: '02',
        title: 'Decide',
        body: 'Use calculators and insights to stress-test affordability, transfer costs, yields and walk-away numbers.',
        icon: Brain,
        tone: 'hl-icon--emerald' as const,
    },
    {
        n: '03',
        title: 'Own',
        body: 'Connect with verified professionals and move through search, offer, finance and transfer with confidence.',
        icon: Home,
        tone: 'hl-icon--gold' as const,
    },
];

const TOOLS = [
    { icon: Calculator, title: 'Bond calculator', body: 'Model repayments, deposits and rate stress.', tone: '' },
    { icon: Coins, title: 'Transfer costs', body: 'Budget duty, attorney fees and buffers early.', tone: 'hl-icon--gold' },
    { icon: Wallet, title: 'Affordability lab', body: 'Separate deposit, fees and monthly capacity.', tone: 'hl-icon--emerald' },
    { icon: TrendingUp, title: 'Rental yield', body: 'Screen gross vs net before you celebrate.', tone: '' },
    { icon: BarChart3, title: 'Market insights', body: 'Read trends without the marketing spin.', tone: 'hl-icon--emerald' },
    { icon: Sparkles, title: 'AI learning companion', body: 'Ask clearer questions as you learn.', tone: 'hl-icon--gold' },
    { icon: Building2, title: 'Property comparison', body: 'Compare stock on numbers, not vibes.', tone: '' },
    { icon: Target, title: 'PropReady Score', body: 'See how listings fit your goals.', tone: 'hl-icon--emerald' },
];

const JOURNEY = [
    'Dream',
    'Learn',
    'Budget',
    'Home loan',
    'Search',
    'Offer',
    'Transfer',
    'Register',
    'Own',
];

const JOURNEY_COPY = [
    'Clarify the life goal behind the property move — home, upgrade, or investment.',
    'Build vocabulary and process knowledge before money and emotion collide.',
    'Separate deposit, fees, reserves and monthly capacity into honest layers.',
    'Understand bonds, prequal and what lenders actually assess.',
    'Filter stock to what you can fund — not what looks good online.',
    'Write offers with conditions, dates and walk-away discipline.',
    'Fund transfer costs and follow conveyancing milestones calmly.',
    'Know what registration means — and when ownership formally transfers.',
    'Own with clarity: rates, levies, insurance and next decisions.',
];

const FEATURES = [
    {
        eyebrow: 'Education',
        title: 'Immersive lessons that respect your intelligence',
        body: 'Chapter-based courses with precise definitions, quizzes and progress — not watered-down blog posts.',
        points: ['Buyer, seller and investor hubs', 'Chapter completion tracking', 'South African process context'],
        icon: BookOpen,
        href: '/learning-center',
        cta: 'Open Learning Center',
    },
    {
        eyebrow: 'Decision tools',
        title: 'Numbers before emotion',
        body: 'Educational calculators help you separate deposit, fees, repayments and buffers before you commit.',
        points: ['Bond & affordability', 'Transfer cost estimates', 'Investor yield framing'],
        icon: Calculator,
        href: '/calculator',
        cta: 'Try the bond calculator',
    },
    {
        eyebrow: 'Professionals',
        title: 'Verified people when you are ready',
        body: 'PropReady connects learning to action — agents, originators and conveyancers when the process requires them.',
        points: ['PPRA-oriented agent access', 'Bond originator pathways', 'Conveyancer Connect'],
        icon: Users,
        href: '/get-started',
        cta: 'Start your journey',
    },
];

const FAQS = [
    {
        q: 'Is PropReady a property listing site?',
        a: 'No. PropReady is an intelligent property platform focused on learning, decision tools and connecting you with verified professionals — so you buy, sell or invest with clarity.',
    },
    {
        q: 'Is it free for buyers and sellers?',
        a: 'Yes. Core learning and buyer/seller journeys are free. You start with a short quiz, then learn and use tools at your own pace.',
    },
    {
        q: 'Who is PropReady for?',
        a: 'First-time buyers, sellers, investors, and the professionals who serve them — agents, bond originators and conveyancers.',
    },
    {
        q: 'Does PropReady replace a bank or conveyancer?',
        a: 'No. PropReady educates and equips you. Formal credit, legal transfer and advice still sit with the appropriate registered professionals.',
    },
    {
        q: 'How do I start?',
        a: 'Tap Start Learning Free to begin Get Started, or open the Learning Center to choose the Buyers, Sellers or Investors hub.',
    },
];

export default function HomeLanding() {
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [activeJourney, setActiveJourney] = useState(1);
    const [activeFeature, setActiveFeature] = useState(0);
    const [featureDir, setFeatureDir] = useState(1);
    const featurePause = useRef(false);

    const goFeature = (next: number, dir: number) => {
        setFeatureDir(dir);
        setActiveFeature((next + FEATURES.length) % FEATURES.length);
    };

    useEffect(() => {
        const id = window.setInterval(() => {
            if (featurePause.current) return;
            setFeatureDir(1);
            setActiveFeature((i) => (i + 1) % FEATURES.length);
        }, 6500);
        return () => window.clearInterval(id);
    }, []);

    return (
        <div className="home-landing">
            {/* HERO */}
            <section className="hl-surface-dark hl-hero relative">
                <div className="hl-shell relative z-10">
                    <div className="hl-hero-grid">
                        <div>
                            <motion.p
                                className="hl-eyebrow hl-eyebrow--light"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                PropReady · iKhayalami
                            </motion.p>
                            <motion.h1
                                className="hl-display hl-hero-title text-white"
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.06 }}
                            >
                                Learn before you buy.
                                <span className="block mt-3 text-white/92">
                                    Decide with clarity.
                                    <span className="text-gold"> Own with confidence.</span>
                                </span>
                            </motion.h1>
                            <motion.p
                                className="hl-lede hl-lede--light !max-w-xl"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.16 }}
                            >
                                PropReady combines expert learning, AI-powered tools, property insights and
                                trusted professionals into one intelligent platform for South Africans.
                            </motion.p>

                            <motion.div
                                className="mt-10 flex flex-col sm:flex-row gap-3"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.26 }}
                            >
                                <Link href="/get-started" className="hl-btn hl-btn--primary">
                                    <span>Start Learning Free</span>
                                    <ArrowRight className="w-5 h-5" strokeWidth={1.75} />
                                </Link>
                                <Link href="/learning-center" className="hl-btn hl-btn--ghost">
                                    Explore the Platform
                                </Link>
                            </motion.div>

                            <motion.div
                                className="mt-11 flex flex-wrap items-center gap-x-6 gap-y-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.42, duration: 0.7 }}
                            >
                                <div className="flex items-center gap-1 text-gold">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-current" strokeWidth={1.5} />
                                    ))}
                                </div>
                                <p className="text-sm text-white/55 leading-relaxed">
                                    Trusted by South Africans learning to buy, sell and invest
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
                                    <span className="inline-flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-gold" strokeWidth={1.75} />
                                        Free for buyers & sellers
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" strokeWidth={1.75} />
                                        SA-focused
                                    </span>
                                </div>
                            </motion.div>
                        </div>

                        <div>
                            <FloatingDashboard />
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUST */}
            <section className="hl-section--tight hl-surface-warm border-b border-charcoal/[0.05]">
                <div className="hl-shell">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal/35 mb-8">
                        Built for the South African property journey
                    </p>
                    <div className="hl-trust-row">
                        {TRUST.map(({ label, icon: Icon }) => (
                            <div key={label} className="hl-trust-item">
                                <span className="hl-trust-icon" aria-hidden>
                                    <Icon className="w-9 h-9 sm:w-10 sm:h-10" strokeWidth={1.5} />
                                </span>
                                <span className="hl-trust-label">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="hl-section hl-surface-warm">
                <div className="hl-shell">
                    <Reveal className="mb-12 sm:mb-16 max-w-3xl">
                        <p className="hl-eyebrow">How PropReady works</p>
                        <h2 className="hl-display hl-section-title">Learn. Decide. Own.</h2>
                        <p className="hl-lede">
                            A simple loop that turns overwhelm into a clear next step — whether you are buying,
                            selling or investing.
                        </p>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
                        {STEPS.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <Reveal key={step.n} delay={i * 0.08}>
                                    <article className="hl-card h-full !pt-8">
                                        <span className="absolute top-5 right-6 text-5xl font-bold tabular-nums text-charcoal/[0.06] select-none">
                                            {step.n}
                                        </span>
                                        <div className={`hl-icon ${step.tone} mb-6`}>
                                            <Icon className="w-5 h-5" strokeWidth={1.75} />
                                        </div>
                                        <h3 className="text-xl font-semibold tracking-tight mb-3">{step.title}</h3>
                                        <p className="text-[0.9375rem] text-charcoal/55 leading-[1.7]">{step.body}</p>
                                    </article>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* LEARNING */}
            <section className="hl-surface-dark hl-section relative">
                <div className="hl-shell relative z-10">
                    <Reveal className="mb-12 sm:mb-14 max-w-3xl">
                        <p className="hl-eyebrow hl-eyebrow--light">Learning experiences</p>
                        <h2 className="hl-display hl-section-title text-white">
                            Immersive courses that make property make sense
                        </h2>
                        <p className="hl-lede hl-lede--light">
                            Progress, quizzes and chapter flow — designed so you leave knowing what to do next.
                        </p>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
                        {LEARNING_HUBS.map((hub, i) => (
                            <Reveal key={hub.href} delay={i * 0.08} className="h-full">
                                <Link
                                    href={hub.href}
                                    prefetch
                                    className="hl-card hl-card--glass group relative z-[1] flex h-full flex-col"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">
                                            {hub.badge}
                                        </span>
                                        <ArrowRight
                                            className="w-4 h-4 text-white/35 group-hover:text-gold transition"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white tracking-tight mb-2">
                                        {hub.title}
                                    </h3>
                                    <p className="text-sm text-white/55 leading-[1.7] mb-8">{hub.blurb}</p>
                                    <div className="mt-auto space-y-5">
                                        <div>
                                            <div className="flex justify-between text-[11px] text-white/40 mb-2">
                                                <span>Sample progress</span>
                                                <span className="tabular-nums text-white/70">
                                                    {hub.progress}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-gold to-[#F87171]"
                                                    style={{ width: `${hub.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#FECACA] group-hover:text-white transition">
                                            {hub.cta}
                                            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                                        </span>
                                    </div>
                                </Link>
                            </Reveal>
                        ))}
                    </div>

                    <Reveal className="mt-12 text-center" delay={0.12}>
                        <Link href="/learning-center" className="hl-link !text-[#FECACA] hover:!text-white">
                            View all learning hubs
                            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                        </Link>
                    </Reveal>
                </div>
            </section>

            {/* TOOLS */}
            <section className="hl-section hl-surface-warm">
                <div className="hl-shell">
                    <Reveal className="mb-12 sm:mb-14 max-w-3xl">
                        <p className="hl-eyebrow">Interactive tools</p>
                        <h2 className="hl-display hl-section-title">Smart tools for calmer decisions</h2>
                        <p className="hl-lede">
                            Educational estimates and frameworks — so you arrive at professionals prepared, not
                            guessing.
                        </p>
                    </Reveal>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                        {TOOLS.map((tool, i) => {
                            const Icon = tool.icon;
                            return (
                                <Reveal key={tool.title} delay={(i % 4) * 0.05}>
                                    <div className="hl-card h-full !p-5 sm:!p-6">
                                        <div className={`hl-icon ${tool.tone} mb-4`}>
                                            <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                                        </div>
                                        <h3 className="font-semibold tracking-tight mb-1.5">{tool.title}</h3>
                                        <p className="text-sm text-charcoal/50 leading-[1.65]">{tool.body}</p>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* JOURNEY */}
            <section className="hl-section border-t border-charcoal/[0.05] bg-[linear-gradient(180deg,#fffcf8,#f7f4f0)]">
                <div className="hl-shell">
                    <Reveal className="mb-10 sm:mb-12 max-w-3xl">
                        <p className="hl-eyebrow">Property journey</p>
                        <h2 className="hl-display hl-section-title">From dream to ownership — mapped</h2>
                        <p className="hl-lede">Hover a stage to see where PropReady supports you along the path.</p>
                    </Reveal>

                    <Reveal>
                        <div className="flex gap-2.5 overflow-x-auto pb-3 -mx-1 px-1">
                            {JOURNEY.map((step, i) => (
                                <button
                                    key={step}
                                    type="button"
                                    onMouseEnter={() => setActiveJourney(i)}
                                    onFocus={() => setActiveJourney(i)}
                                    onClick={() => setActiveJourney(i)}
                                    className={`hl-chip ${activeJourney === i ? 'hl-chip--active' : ''}`}
                                >
                                    <span className="text-[10px] opacity-70 mr-1.5 tabular-nums">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    {step}
                                </button>
                            ))}
                        </div>
                        <div className="hl-card mt-6 !p-8 sm:!p-10">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeJourney}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.28 }}
                                >
                                    <p className="hl-eyebrow !mb-2">
                                        Stage {String(activeJourney + 1).padStart(2, '0')}
                                    </p>
                                    <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
                                        {JOURNEY[activeJourney]}
                                    </h3>
                                    <p className="text-charcoal/55 leading-[1.75] max-w-2xl text-[1.05rem]">
                                        {JOURNEY_COPY[activeJourney]}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* FEATURES */}
            <section
                className="hl-section hl-surface-dark"
                onMouseEnter={() => {
                    featurePause.current = true;
                }}
                onMouseLeave={() => {
                    featurePause.current = false;
                }}
                onFocusCapture={() => {
                    featurePause.current = true;
                }}
                onBlurCapture={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                        featurePause.current = false;
                    }
                }}
            >
                <div className="hl-shell relative z-10">
                    <Reveal className="mb-10 sm:mb-12 max-w-3xl">
                        <p className="hl-eyebrow hl-eyebrow--light">Platform pillars</p>
                        <h2 className="hl-display hl-section-title text-white">
                            What PropReady puts in your hands
                        </h2>
                        <p className="hl-lede hl-lede--light">
                            Education, decision tools and verified professionals — swipe through the pillars.
                        </p>
                    </Reveal>

                    <Reveal>
                        <div className="relative" aria-roledescription="carousel" aria-label="Platform features">
                            <div className="overflow-hidden">
                                <AnimatePresence mode="wait" custom={featureDir}>
                                    {(() => {
                                        const feature = FEATURES[activeFeature];
                                        const Icon = feature.icon;
                                        return (
                                            <motion.div
                                                key={feature.title}
                                                custom={featureDir}
                                                initial={{ opacity: 0, x: featureDir * 48 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: featureDir * -48 }}
                                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center"
                                                aria-roledescription="slide"
                                                aria-label={`${activeFeature + 1} of ${FEATURES.length}: ${feature.eyebrow}`}
                                            >
                                                <div className="lg:col-span-6">
                                                    <div className="hl-media border-white/10 bg-white/[0.06]">
                                                        <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-10">
                                                            <div className="w-full max-w-sm rounded-[1.5rem] border border-white/15 bg-white/10 p-6 shadow-[var(--hl-shadow-md)] backdrop-blur-xl">
                                                                <div className="hl-icon mb-4">
                                                                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                                                                </div>
                                                                <p className="text-lg font-semibold tracking-tight text-white">
                                                                    {feature.eyebrow}
                                                                </p>
                                                                <ul className="mt-4 space-y-2.5">
                                                                    {feature.points.map((p) => (
                                                                        <li
                                                                            key={p}
                                                                            className="flex items-start gap-2 text-sm leading-relaxed text-white/60"
                                                                        >
                                                                            <CheckCircle2
                                                                                className="w-4 h-4 text-gold shrink-0 mt-0.5"
                                                                                strokeWidth={1.75}
                                                                            />
                                                                            {p}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="lg:col-span-6 lg:px-2">
                                                    <p className="hl-eyebrow hl-eyebrow--light">{feature.eyebrow}</p>
                                                    <h2 className="hl-display text-[clamp(2rem,3.5vw,2.75rem)] tracking-tight leading-[1.12] max-w-[16ch] text-white">
                                                        {feature.title}
                                                    </h2>
                                                    <p className="hl-lede hl-lede--light !mt-4">{feature.body}</p>
                                                    <Link
                                                        href={feature.href}
                                                        className="hl-link mt-8 !text-[#FECACA] hover:!text-white"
                                                    >
                                                        {feature.cta}
                                                        <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        );
                                    })()}
                                </AnimatePresence>
                            </div>

                            <div className="mt-10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2" role="tablist" aria-label="Feature slides">
                                    {FEATURES.map((feature, i) => (
                                        <button
                                            key={feature.eyebrow}
                                            type="button"
                                            role="tab"
                                            aria-selected={activeFeature === i}
                                            aria-label={`Show ${feature.eyebrow}`}
                                            onClick={() => {
                                                if (i === activeFeature) return;
                                                goFeature(i, i > activeFeature ? 1 : -1);
                                            }}
                                            className={`hl-carousel-dot hl-carousel-dot--on-dark ${
                                                activeFeature === i ? 'hl-carousel-dot--active' : ''
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Previous feature"
                                        onClick={() => goFeature(activeFeature - 1, -1)}
                                        className="hl-carousel-nav hl-carousel-nav--on-dark"
                                    >
                                        <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Next feature"
                                        onClick={() => goFeature(activeFeature + 1, 1)}
                                        className="hl-carousel-nav hl-carousel-nav--on-dark"
                                    >
                                        <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* WHY */}
            <section className="hl-section hl-surface-warm">
                <div className="hl-shell">
                    <Reveal className="mb-12 max-w-3xl">
                        <p className="hl-eyebrow">Why PropReady</p>
                        <h2 className="hl-display hl-section-title">
                            Property feels complicated. The platform should not.
                        </h2>
                    </Reveal>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                        {[
                            {
                                icon: Scale,
                                title: 'SA process, not generic advice',
                                body: 'OTPs, bonds, transfer duty, conveyancing and registration — framed for South Africa.',
                                tone: '',
                            },
                            {
                                icon: BookOpen,
                                title: 'Education before urgency',
                                body: 'Learn the vocabulary and decision filters before bidding wars and WhatsApp pressure.',
                                tone: 'hl-icon--emerald',
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Trust-oriented design',
                                body: 'Clear disclaimers, verified professional pathways, and no dark patterns to rush you.',
                                tone: 'hl-icon--gold',
                            },
                        ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <Reveal key={item.title} delay={i * 0.07}>
                                    <div className="hl-card h-full">
                                        <div className={`hl-icon ${item.tone} mb-5`}>
                                            <Icon className="w-5 h-5" strokeWidth={1.75} />
                                        </div>
                                        <h3 className="font-semibold text-lg tracking-tight mb-2">{item.title}</h3>
                                        <p className="text-sm text-charcoal/55 leading-[1.7]">{item.body}</p>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="hl-section border-t border-charcoal/[0.05] bg-[#fffcf8]">
                <div className="hl-shell max-w-3xl mx-auto">
                    <Reveal className="text-center mb-12">
                        <p className="hl-eyebrow justify-center">FAQ</p>
                        <h2 className="hl-display text-[clamp(2rem,3.8vw,2.75rem)] tracking-tight">
                            Questions, answered clearly
                        </h2>
                    </Reveal>
                    <div className="space-y-3">
                        {FAQS.map((item, i) => {
                            const open = openFaq === i;
                            return (
                                <Reveal key={item.q} delay={i * 0.04}>
                                    <div className="hl-faq-item" data-open={open}>
                                        <button
                                            type="button"
                                            className="hl-faq-btn"
                                            onClick={() => setOpenFaq(open ? null : i)}
                                            aria-expanded={open}
                                        >
                                            <span>{item.q}</span>
                                            <ChevronDown
                                                className={`w-5 h-5 text-charcoal/35 shrink-0 transition-transform duration-300 ${
                                                    open ? 'rotate-180' : ''
                                                }`}
                                                strokeWidth={1.75}
                                            />
                                        </button>
                                        <AnimatePresence initial={false}>
                                            {open ? (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className="px-5 sm:px-6 pb-5 text-[0.9375rem] text-charcoal/55 leading-[1.75]">
                                                        {item.a}
                                                    </p>
                                                </motion.div>
                                            ) : null}
                                        </AnimatePresence>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="hl-section pt-8 sm:pt-12">
                <div className="hl-shell">
                    <Reveal>
                        <div className="hl-surface-dark relative overflow-hidden rounded-[2.5rem] border border-white/[0.08] shadow-[var(--hl-shadow-lg)]">
                            <div
                                className="pointer-events-none absolute -right-16 top-0 w-96 h-96 rounded-full bg-gold/25 blur-3xl"
                                aria-hidden
                            />
                            <div
                                className="pointer-events-none absolute -left-20 bottom-0 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl"
                                aria-hidden
                            />
                            <div className="relative z-10 px-8 sm:px-16 py-16 sm:py-24 text-center">
                                <p className="hl-eyebrow hl-eyebrow--light justify-center">Begin today</p>
                                <h2 className="hl-display text-[clamp(2.25rem,4.5vw,3.5rem)] text-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
                                    Ready to make smarter property decisions?
                                </h2>
                                <p className="hl-lede hl-lede--light mx-auto mt-5">
                                    Start free. Learn at your pace. Use the tools. Connect with professionals when
                                    you are ready.
                                </p>
                                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link href="/get-started" className="hl-btn hl-btn--primary">
                                        <span>Start Learning Free</span>
                                        <ArrowRight className="w-5 h-5" strokeWidth={1.75} />
                                    </Link>
                                    <Link href="/learning-center" className="hl-btn hl-btn--ghost">
                                        Explore Learning Center
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}
