/** Shared premium styling tokens for the agent portal. */

export const AGENT_PAGE_CONTAINER = 'max-w-[1400px] w-full mx-auto pb-8 sm:pb-12';

export const AGENT_PAGE_HEADER_BAND =
    'bg-white border-b border-charcoal/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.02)]';

export const AGENT_CARD =
    'rounded-3xl border border-charcoal/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)] overflow-hidden';

export const AGENT_CARD_SOFT =
    'rounded-3xl border border-charcoal/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.04)]';

export const AGENT_STAT_CARD =
    'group flex flex-col justify-between h-full min-h-[148px] rounded-3xl border border-charcoal/[0.07] bg-white p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] hover:border-charcoal/[0.12] transition-all duration-300 text-left';

export const AGENT_STAT_ICON =
    'w-12 h-12 rounded-2xl bg-charcoal/[0.03] border border-charcoal/[0.06] flex items-center justify-center shrink-0 group-hover:bg-gold/[0.06] group-hover:border-gold/10 transition-colors duration-300';

export const AGENT_BADGE =
    'inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium whitespace-nowrap';

export const AGENT_TABLE_HEAD =
    'text-left py-4 px-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal/45';

export const AGENT_TABLE_CELL = 'py-5 px-6 align-middle';

export const AGENT_TABLE_ROW =
    'hover:bg-charcoal/[0.018] transition-colors duration-150 group';

export const AGENT_VIEW_BTN =
    'inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold text-gold bg-gold/[0.06] hover:bg-gold/10 border border-gold/10 hover:border-gold/20 transition-all duration-200';

export const AGENT_CARD_HEADER =
    'px-6 sm:px-8 pt-7 sm:pt-8 pb-5 sm:pb-6 border-b border-charcoal/[0.06]';

export const AGENT_CARD_TOOLBAR =
    'px-6 sm:px-8 py-5 sm:py-6 border-b border-charcoal/[0.06]';

export const AGENT_CARD_BODY = 'px-3 sm:px-5 py-3 sm:py-4';

export const AGENT_CARD_FOOTER =
    'text-charcoal/40 text-xs px-6 sm:px-8 py-5 border-t border-charcoal/[0.06] leading-relaxed';

export const AGENT_SEARCH_INPUT =
    'w-full pl-11 pr-4 py-3 rounded-2xl bg-charcoal/[0.02] border border-charcoal/[0.08] text-charcoal text-sm placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/25 focus:bg-white transition-all duration-200';

export const AGENT_SELECT =
    'w-full sm:w-auto min-w-[140px] px-4 py-3 rounded-2xl bg-charcoal/[0.02] border border-charcoal/[0.08] text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/25 focus:bg-white [&>option]:text-charcoal transition-all duration-200';

export const AGENT_SEGMENT_WRAP =
    'inline-flex p-1 rounded-full bg-charcoal/[0.04] border border-charcoal/[0.06]';

export const agentSegmentBtn = (active: boolean) =>
    `px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        active
            ? 'bg-white text-charcoal shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
            : 'text-charcoal/50 hover:text-charcoal'
    }`;

export const AGENT_REFRESH_BTN =
    'inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full border border-charcoal/[0.08] bg-white text-charcoal/60 text-sm font-medium hover:bg-charcoal/[0.03] hover:border-charcoal/15 hover:text-charcoal transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]';

export const AGENT_PRIMARY_BTN =
    'inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-gold text-white text-sm font-semibold hover:bg-gold-600 transition-all duration-200 shadow-[0_1px_3px_rgba(220,38,38,0.2)]';

export const AGENT_SECONDARY_BTN =
    'inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full border border-charcoal/[0.08] bg-white text-charcoal/70 text-sm font-medium hover:bg-charcoal/[0.03] hover:border-charcoal/15 hover:text-charcoal transition-all duration-200';

export const AGENT_EMPTY_ICON =
    'w-16 h-16 rounded-2xl bg-charcoal/[0.04] border border-charcoal/[0.06] flex items-center justify-center mx-auto mb-4';

export const AGENT_INNER_CARD =
    'rounded-2xl border border-charcoal/[0.07] bg-white p-5 md:p-6 hover:border-charcoal/[0.12] hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200';

export const AGENT_PLAN_CARD =
    'rounded-2xl p-5 border block transition-all duration-200 h-full bg-white border-charcoal/[0.07] hover:border-charcoal/[0.12] hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]';

export const AGENT_PLAN_CARD_CURRENT =
    'rounded-2xl p-5 border block transition-all duration-200 h-full bg-white border-gold/25 shadow-[0_1px_3px_rgba(220,38,38,0.08)] ring-1 ring-gold/10';

export const AGENT_SECTION_LABEL =
    'text-sm font-semibold text-charcoal uppercase tracking-[0.08em]';

export const AGENT_MODULE_CARD =
    'group relative flex flex-col h-full rounded-3xl border border-charcoal/[0.07] bg-white p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] hover:border-charcoal/[0.12] hover:-translate-y-1 transition-all duration-400 overflow-hidden';

export const AGENT_MODULE_CARD_ICON =
    'w-11 h-11 rounded-2xl bg-gradient-to-br from-charcoal/[0.04] to-charcoal/[0.01] border border-charcoal/[0.08] flex items-center justify-center shrink-0 group-hover:from-gold/[0.12] group-hover:to-gold/[0.04] group-hover:border-gold/20 transition-all duration-300';

export const AGENT_LEARN_ARTICLE =
    'overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.05)]';

export const AGENT_LEARN_ARTICLE_HERO =
    'relative border-b border-[#E5E7EB] bg-white';

export const AGENT_LEARN_ARTICLE_PADDING =
    'px-6 sm:px-8';

/** @deprecated Styles live in AgentLearnArticleContent + step card components */
export const AGENT_LEARN_ARTICLE_BODY_WRAP = '';

/** @deprecated Styles live in AgentLearnArticleContent + step card components */
export const AGENT_LEARN_ARTICLE_BODY =
    '[&_.learn-highlight-row]:my-3 [&_.learn-highlight-row]:grid [&_.learn-highlight-row]:grid-cols-1 [&_.learn-highlight-row]:gap-5 [&_.learn-highlight-row]:sm:grid-cols-2 [&_.learn-highlight-row]:sm:gap-6 [&_.learn-highlight-row]:lg:grid-cols-3 ' +
    '[&_.learn-formula-card]:my-2 [&_.learn-formula-card]:learn-animate-in [&_.learn-formula-card]:rounded-2xl [&_.learn-formula-card]:border [&_.learn-formula-card]:border-[#1F2937] [&_.learn-formula-card]:bg-[#1F2937] [&_.learn-formula-card]:p-8 [&_.learn-formula-card]:text-center [&_.learn-formula-card]:shadow-[0_8px_32px_rgba(0,0,0,0.12)] ' +
    '[&_.learn-formula-title]:mb-3 [&_.learn-formula-title]:text-[11px] [&_.learn-formula-title]:font-bold [&_.learn-formula-title]:uppercase [&_.learn-formula-title]:tracking-[0.14em] [&_.learn-formula-title]:text-[#EF4444] ' +
    '[&_.learn-formula-equation]:text-xl [&_.learn-formula-equation]:font-semibold [&_.learn-formula-equation]:leading-snug [&_.learn-formula-equation]:tracking-tight [&_.learn-formula-equation]:text-white sm:[&_.learn-formula-equation]:text-2xl ' +
    '[&_.learn-formula-note]:mx-auto [&_.learn-formula-note]:mt-4 [&_.learn-formula-note]:max-w-lg [&_.learn-formula-note]:text-sm [&_.learn-formula-note]:leading-relaxed [&_.learn-formula-note]:text-white/55 ' +
    '[&_.learn-checklist-text_strong]:font-semibold [&_.learn-checklist-text_strong]:text-[#EF4444]';

export const AGENT_LEARN_CALLOUT = '';

export const AGENT_LEARN_SECTION =
    'mb-10 sm:mb-12 last:mb-0';

export const AGENT_LEARN_SECTION_TITLE =
    'flex items-center gap-3 mb-5 sm:mb-6';

export const AGENT_LEARN_CTA =
    'relative mt-14 sm:mt-16 rounded-3xl overflow-hidden border border-charcoal/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.08)]';

export const AGENT_FORM_SECTION =
    'rounded-3xl border border-charcoal/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)] overflow-hidden mb-6';

export const AGENT_FORM_SECTION_HEADER =
    'px-6 md:px-8 py-5 sm:py-6 border-b border-charcoal/[0.06] bg-charcoal/[0.015]';

export const AGENT_FORM_INPUT =
    'w-full pl-10 pr-4 py-2.5 rounded-2xl bg-charcoal/[0.02] border border-charcoal/[0.08] text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/25 focus:bg-white transition-all duration-200';

export const AGENT_FORM_LABEL =
    'block text-charcoal/70 text-sm font-medium mb-1.5';

export const AGENT_FORM_HINT =
    'text-charcoal/45 text-xs mt-1.5 leading-relaxed';

export const agentFormInput = (hasError?: boolean) =>
    `${AGENT_FORM_INPUT}${hasError ? ' border-red-400 ring-1 ring-red-400/30' : ''}`;

export const AGENT_FORM_FOOTER =
    'pt-6 mt-2 border-t border-charcoal/[0.06]';

export const AGENT_PANEL_HEADER =
    'relative px-6 sm:px-8 py-5 sm:py-6 border-b border-charcoal/[0.06] bg-charcoal/[0.015]';

export const AGENT_PANEL_BODY = 'px-6 sm:px-8 py-6 bg-white';

export const AGENT_CALLOUT =
    'rounded-2xl border border-gold/15 bg-gold/[0.04] p-5 sm:p-6';
