/** Learning Hub article design tokens — PropReady academy / Stripe Docs aesthetic */

export const LEARN_COLORS = {
    primary: '#EF4444',
    charcoal: '#1F2937',
    background: '#FAFAFA',
    card: '#FFFFFF',
    border: '#E5E7EB',
    body: '#3F3F46',
    muted: '#6B7280',
    heading: '#111827',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
} as const;

export const LEARN_LAYOUT = {
    maxWidth: 'w-full',
    sectionGap: 'space-y-10 sm:space-y-12',
    bodyPadding: 'px-6 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14',
    cardPadding: 'p-8 sm:p-10',
    cardInnerGap: 'space-y-6 sm:space-y-7',
} as const;

export const LEARN_TYPE = {
    heroTitle: 'text-[28px] sm:text-[32px] font-bold leading-[1.15] tracking-tight text-[#1F2937]',
    articleLead:
        'text-[30px] font-bold leading-[1.35] tracking-tight text-[#1F2937] pb-[48px]',
    stepTitle: 'text-lg sm:text-xl font-bold tracking-tight text-[#1F2937]',
    body: 'text-[17px] sm:text-[18px] leading-[1.9] text-[#3F3F46]',
    bodySm: 'text-base leading-[1.85] text-[#3F3F46]',
    label: 'text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em]',
    metric: 'text-[26px] sm:text-[28px] font-bold leading-none tracking-tight text-[#1F2937]',
} as const;

/** 250ms ease-out — respect prefers-reduced-motion via globals.css */
export const LEARN_MOTION = {
    base: 'transition-all duration-[250ms] ease-out',
    icon: 'transition-transform duration-[250ms] ease-out group-hover:scale-110',
    card: 'transition-all duration-[250ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
    progress: 'transition-[width] duration-[250ms] ease-out',
    fadeIn: 'learn-animate-in',
    slideIn: 'learn-slide-in',
    btnLift: 'learn-btn-lift',
} as const;

export const LEARN_SHADOW = {
    card: 'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]',
    cardHover: 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.06)]',
} as const;

export const LEARN_STEP_CARD =
    `learn-step-card group relative rounded-2xl border border-[#E5E7EB] bg-white ${LEARN_SHADOW.card} ${LEARN_MOTION.card} ${LEARN_MOTION.fadeIn} ${LEARN_LAYOUT.cardPadding}`;

export const LEARN_CALLOUT_CARD =
    `rounded-2xl border border-[#E5E7EB] bg-white ${LEARN_SHADOW.card} ${LEARN_MOTION.card} ${LEARN_MOTION.slideIn} ${LEARN_LAYOUT.cardPadding}`;

export const LEARN_QUOTE_CARD =
    'learn-quote-card learn-slide-in flex gap-5 rounded-2xl border border-red-100 border-l-4 border-l-[#EF4444] bg-red-50/70 py-6 pl-6 pr-8 sm:py-7 sm:pl-8 sm:pr-10';

export const LEARN_TIP_CARD =
    'learn-tip-card learn-slide-in rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-yellow-50/40 p-8 sm:p-10';

export const LEARN_SUCCESS_CALLOUT =
    'rounded-2xl border border-green-200/80 bg-green-50/60 p-6 sm:p-7';

export const LEARN_WARNING_CALLOUT =
    'rounded-2xl border border-amber-200/80 bg-amber-50/60 p-6 sm:p-7';

export const LEARN_INFO_CALLOUT =
    'rounded-2xl border border-blue-200/80 bg-blue-50/60 p-6 sm:p-7';
