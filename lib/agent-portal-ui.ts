/**
 * PropReady portal design system — source of truth for product UI.
 *
 * Roles:
 * - Cards: rounded-3xl · Inputs/inner: rounded-2xl · Nav chips: rounded-xl · CTAs: rounded-full
 * - Accent: Tailwind `gold` (#DC2626 brand red) · Neutrals: charcoal opacity ladder
 * - Auth pages may use `.auth-*` in globals.css; do not invent new radius/shadow recipes elsewhere
 * - Marketing (landing) may use AGENT_MARKETING_CTA; keep scale-105 off product surfaces
 * - Polish tokens: see `lib/ui-foundation.ts` + CSS vars in `app/globals.css`
 */

import {
    UI_FOCUS_RING,
    UI_FOCUS_RING_INPUT,
    UI_HOVER_SURFACE,
    UI_TRANSITION,
    UI_TRANSITION_FAST,
    UI_TRANSITION_MODERATE,
} from '@/lib/ui-foundation';

/** Text opacity ladder — prefer these over ad-hoc /60 /70 /75 mixes */
export const AGENT_TEXT_PRIMARY = 'text-charcoal';
export const AGENT_TEXT_SECONDARY = 'text-charcoal/55';
export const AGENT_TEXT_TERTIARY = 'text-charcoal/45';
export const AGENT_TEXT_MUTED = 'text-charcoal/45';
export const AGENT_LABEL_TRACKING = 'tracking-[0.08em]';

/** Icon glyphs (Lucide class sizes) — aligned with --icon-* tokens */
export const AGENT_ICON_NAV = 'w-icon-md h-icon-md';
export const AGENT_ICON_IN_CARD = 'w-icon-md h-icon-md';
export const AGENT_ICON_BADGE = 'w-icon-xs h-icon-xs';
export const AGENT_ICON_EMPTY = 'w-icon-xl h-icon-xl';
export const AGENT_ICON_LOGO = 'w-icon-lg h-icon-lg';
export const AGENT_ICON_LOGO_SM = 'w-icon-md h-icon-md';
export const AGENT_LOGO_MARK =
    'w-10 h-10 bg-gold rounded-lg flex items-center justify-center shrink-0 shadow-elevation-xs';
export const AGENT_LOGO_MARK_SM =
    'w-9 h-9 bg-gold rounded-lg flex items-center justify-center shrink-0';

export const AGENT_PAGE_CONTAINER = 'max-w-[1400px] w-full mx-auto pb-8 sm:pb-12';

/** Portal chrome — nav sits darker than the content canvas for clear separation */
export const AGENT_SHELL_SIDEBAR =
    'bg-[#ebeae7] border-r border-charcoal/[0.1] shadow-[4px_0_24px_rgba(44,44,44,0.045)]';
export const AGENT_SHELL_SIDEBAR_MOBILE =
    'bg-[#ebeae7] shadow-xl border-r border-charcoal/[0.1]';
export const AGENT_SHELL_CONTENT = 'bg-[#fafafa]';
export const AGENT_SHELL_TOPBAR =
    'bg-white/95 backdrop-blur-md border-b border-charcoal/[0.06] shadow-elevation-xs';
export const AGENT_NAV_LINK =
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200';
export const AGENT_NAV_LINK_IDLE =
    'text-charcoal/70 hover:text-charcoal hover:bg-white/70';
export const AGENT_NAV_LINK_ACTIVE =
    'bg-white text-gold border border-gold/20 shadow-[0_1px_2px_rgba(0,0,0,0.04)]';

export const AGENT_PAGE_HEADER_BAND =
    'bg-white border-b border-charcoal/[0.06] shadow-elevation-xs';

export const AGENT_CARD =
    'rounded-3xl border border-charcoal/[0.07] bg-white shadow-elevation-md overflow-hidden';

export const AGENT_CARD_SOFT =
    'rounded-3xl border border-charcoal/[0.07] bg-white shadow-elevation-sm';

export const AGENT_STAT_CARD =
    `group flex flex-col justify-between h-full min-h-[148px] rounded-3xl border border-charcoal/[0.07] bg-white p-6 sm:p-7 shadow-elevation-sm hover:shadow-elevation-hover hover:border-charcoal/[0.12] ${UI_TRANSITION_MODERATE} text-left`;

export const AGENT_STAT_ICON =
    `w-12 h-12 rounded-2xl bg-charcoal/[0.03] border border-charcoal/[0.06] flex items-center justify-center shrink-0 group-hover:bg-gold/[0.06] group-hover:border-gold/10 ${UI_TRANSITION_MODERATE}`;

export const AGENT_BADGE =
    'inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium whitespace-nowrap';

export const AGENT_TABLE_HEAD =
    'text-left py-4 px-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal/45';

export const AGENT_TABLE_CELL = 'py-5 px-6 align-middle';

export const AGENT_TABLE_ROW =
    `hover:bg-charcoal/[0.018] ${UI_TRANSITION_FAST} group`;

export const AGENT_VIEW_BTN =
    `inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold text-gold bg-gold/[0.06] hover:bg-gold/10 border border-gold/10 hover:border-gold/20 ${UI_TRANSITION} ${UI_FOCUS_RING}`;

export const AGENT_CARD_HEADER =
    'px-6 sm:px-8 pt-7 sm:pt-8 pb-5 sm:pb-6 border-b border-charcoal/[0.06]';

export const AGENT_CARD_TOOLBAR =
    'px-6 sm:px-8 py-5 sm:py-6 border-b border-charcoal/[0.06]';

export const AGENT_CARD_BODY = 'px-3 sm:px-5 py-3 sm:py-4';

export const AGENT_CARD_FOOTER =
    'text-charcoal/40 text-xs px-6 sm:px-8 py-5 border-t border-charcoal/[0.06] leading-relaxed';

export const AGENT_SEARCH_INPUT =
    `w-full pl-11 pr-4 py-3 rounded-2xl bg-charcoal/[0.02] border border-charcoal/[0.08] text-charcoal text-sm placeholder:text-charcoal/35 ${UI_FOCUS_RING_INPUT} ${UI_TRANSITION}`;

export const AGENT_SELECT =
    `w-full sm:w-auto min-w-[140px] px-4 py-3 rounded-2xl bg-charcoal/[0.02] border border-charcoal/[0.08] text-charcoal text-sm ${UI_FOCUS_RING_INPUT} [&>option]:text-charcoal ${UI_TRANSITION}`;

export const AGENT_SEGMENT_WRAP =
    'inline-flex p-1 rounded-full bg-charcoal/[0.04] border border-charcoal/[0.06]';

export const agentSegmentBtn = (active: boolean) =>
    `px-5 py-2 rounded-full text-sm font-medium ${UI_TRANSITION} ${
        active
            ? 'bg-white text-charcoal shadow-elevation-xs'
            : 'text-charcoal/50 hover:text-charcoal'
    }`;

export const AGENT_REFRESH_BTN =
    `inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full border border-charcoal/[0.08] bg-white text-charcoal/60 text-sm font-medium ${UI_HOVER_SURFACE} ${UI_TRANSITION} shadow-elevation-xs ${UI_FOCUS_RING}`;

export const AGENT_PRIMARY_BTN =
    `inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-gold text-white text-sm font-semibold hover:bg-gold-600 ${UI_TRANSITION} shadow-elevation-gold disabled:opacity-50 disabled:pointer-events-none ${UI_FOCUS_RING}`;

export const AGENT_PRIMARY_BTN_LG =
    `inline-flex items-center justify-center gap-2 h-11 px-7 rounded-full bg-gold text-white text-sm font-semibold hover:bg-gold-600 ${UI_TRANSITION} shadow-elevation-gold disabled:opacity-50 disabled:pointer-events-none ${UI_FOCUS_RING}`;

/** Landing / marketing only — same recipe as primary, larger hit target */
export const AGENT_MARKETING_CTA =
    `inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-gold text-white text-base font-semibold hover:bg-gold-600 ${UI_TRANSITION} shadow-elevation-gold ${UI_FOCUS_RING}`;

export const AGENT_SECONDARY_BTN =
    `inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full border border-charcoal/[0.08] bg-white text-charcoal/70 text-sm font-medium ${UI_HOVER_SURFACE} ${UI_TRANSITION} disabled:opacity-50 disabled:pointer-events-none ${UI_FOCUS_RING}`;

export const AGENT_DANGER_BTN =
    `inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 ${UI_TRANSITION} disabled:opacity-50 disabled:pointer-events-none ${UI_FOCUS_RING}`;

export const AGENT_SUCCESS_BTN =
    `inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 ${UI_TRANSITION} disabled:opacity-50 disabled:pointer-events-none ${UI_FOCUS_RING}`;

export const AGENT_ICON_BTN =
    `inline-flex items-center justify-center w-10 h-10 rounded-full border border-charcoal/[0.08] bg-white text-charcoal/60 ${UI_HOVER_SURFACE} ${UI_TRANSITION} ${UI_FOCUS_RING}`;

export const AGENT_MODAL_BACKDROP =
    'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]';

export const AGENT_MODAL_PANEL =
    'relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-charcoal/[0.07] bg-white shadow-elevation-xl';

export const AGENT_MODAL_PANEL_LG =
    'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-charcoal/[0.07] bg-white shadow-elevation-xl';

export const AGENT_EMPTY_ICON =
    'w-16 h-16 rounded-2xl bg-charcoal/[0.04] border border-charcoal/[0.06] flex items-center justify-center mx-auto mb-4';

export const AGENT_INNER_CARD =
    `rounded-2xl border border-charcoal/[0.07] bg-white p-5 md:p-6 hover:border-charcoal/[0.12] hover:shadow-elevation-sm ${UI_TRANSITION}`;

export const AGENT_PLAN_CARD =
    `rounded-2xl p-5 border block ${UI_TRANSITION} h-full bg-white border-charcoal/[0.07] hover:border-charcoal/[0.12] hover:shadow-elevation-sm`;

export const AGENT_PLAN_CARD_CURRENT =
    'rounded-2xl p-5 border block transition-all duration-200 h-full bg-white border-gold/25 shadow-elevation-gold ring-1 ring-gold/10';

export const AGENT_SECTION_LABEL =
    'text-sm font-semibold text-charcoal uppercase tracking-[0.08em]';

export const AGENT_MODULE_CARD =
    `group relative flex flex-col h-full rounded-3xl border border-charcoal/[0.07] bg-white p-6 sm:p-7 shadow-elevation-lg hover:shadow-elevation-lift hover:border-charcoal/[0.12] hover:-translate-y-1 transition-all duration-400 ease-out-soft overflow-hidden`;

export const AGENT_MODULE_CARD_ICON =
    `w-11 h-11 rounded-2xl bg-gradient-to-br from-charcoal/[0.04] to-charcoal/[0.01] border border-charcoal/[0.08] flex items-center justify-center shrink-0 group-hover:from-gold/[0.12] group-hover:to-gold/[0.04] group-hover:border-gold/20 ${UI_TRANSITION_MODERATE}`;

export const AGENT_LEARN_ARTICLE =
    'overflow-hidden rounded-2xl border border-charcoal/[0.08] bg-white shadow-elevation-lg';

export const AGENT_LEARN_ARTICLE_HERO =
    'relative border-b border-charcoal/[0.08] bg-white';

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
    'relative mt-14 sm:mt-16 rounded-3xl overflow-hidden border border-charcoal/[0.08] shadow-elevation-lg';

export const AGENT_FORM_SECTION =
    'rounded-3xl border border-charcoal/[0.07] bg-white shadow-elevation-md overflow-hidden mb-6';

export const AGENT_FORM_SECTION_HEADER =
    'px-6 md:px-8 py-5 sm:py-6 border-b border-charcoal/[0.06] bg-charcoal/[0.015]';

/** Plain field (no leading icon) — use in modals & selects */
export const AGENT_INPUT =
    `w-full px-4 py-2.5 rounded-2xl bg-charcoal/[0.02] border border-charcoal/[0.08] text-charcoal text-sm placeholder:text-charcoal/35 ${UI_FOCUS_RING_INPUT} ${UI_TRANSITION} [&>option]:text-charcoal`;

export const AGENT_FORM_INPUT =
    `w-full pl-10 pr-4 py-2.5 rounded-2xl bg-charcoal/[0.02] border border-charcoal/[0.08] text-charcoal placeholder:text-charcoal/35 ${UI_FOCUS_RING_INPUT} ${UI_TRANSITION}`;

export const AGENT_FORM_LABEL =
    'block text-charcoal/70 text-sm font-medium mb-1.5';

export const AGENT_FORM_HINT =
    'text-charcoal/45 text-xs mt-1.5 leading-relaxed';

export const agentFormInput = (hasError?: boolean) =>
    `${AGENT_FORM_INPUT}${hasError ? ' border-red-400 ring-1 ring-red-400/30' : ''}`;

export const agentInput = (hasError?: boolean) =>
    `${AGENT_INPUT}${hasError ? ' border-red-400 ring-1 ring-red-400/30' : ''}`;

export const AGENT_FORM_FOOTER =
    'pt-6 mt-2 border-t border-charcoal/[0.06]';

export const AGENT_PANEL_HEADER =
    'relative px-6 sm:px-8 py-5 sm:py-6 border-b border-charcoal/[0.06] bg-charcoal/[0.015]';

export const AGENT_PANEL_BODY = 'px-6 sm:px-8 py-6 bg-white';

export const AGENT_CALLOUT =
    'rounded-2xl border border-gold/15 bg-gold/[0.04] p-5 sm:p-6';
