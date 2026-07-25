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
    UI_BTN_BASE,
    UI_BTN_FILLED,
    UI_BTN_OUTLINE,
    UI_BTN_SIZE_SM,
    UI_BTN_SIZE_MD,
    UI_BTN_SIZE_LG,
    UI_BTN_SIZE_XL,
    UI_BTN_SIZE_ICON,
    UI_BTN_DISABLED,
    UI_BTN_BUSY,
    UI_CARD_SURFACE,
    UI_CARD_INTERACTIVE,
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

/** Portal chrome — charcoal nav against a light content canvas */
export const AGENT_SHELL_SIDEBAR =
    'bg-charcoal border-r border-white/[0.06] shadow-[4px_0_24px_rgba(0,0,0,0.18)]';
export const AGENT_SHELL_SIDEBAR_MOBILE =
    'bg-charcoal shadow-2xl border-r border-white/[0.06]';
export const AGENT_SHELL_CONTENT = 'bg-[#fafafa]';
export const AGENT_SHELL_TOPBAR =
    'bg-white/95 backdrop-blur-md border-b border-charcoal/[0.07] shadow-[0_1px_0_rgba(44,44,44,0.04)]';
export const AGENT_SHELL_DIVIDER = 'border-white/[0.08]';
export const AGENT_SHELL_BRAND =
    'text-white text-lg font-semibold tracking-tight';
export const AGENT_SHELL_BRAND_SM = 'font-semibold text-white tracking-tight';
export const AGENT_SHELL_SUBTITLE =
    'text-white/40 text-[11px] font-medium uppercase tracking-[0.12em] mt-2.5 pl-0.5';
export const AGENT_SHELL_FOOTER_LINK =
    'text-xs font-medium text-white/45 hover:text-gold transition-colors duration-200';
export const AGENT_SHELL_ICON_BTN =
    'inline-flex items-center justify-center w-10 h-10 rounded-xl text-white/65 hover:text-white hover:bg-white/[0.08] active:scale-[0.97] transition-[color,background-color,transform] duration-200 cursor-pointer';
export const AGENT_SHELL_NAV_SCROLL =
    'flex-1 py-5 overflow-y-auto overflow-x-hidden portal-nav-scroll';
export const AGENT_SHELL_NAV =
    'flex flex-col gap-0.5 px-3';
export const AGENT_SHELL_NAV_GROUP = 'mt-5 pt-5 border-t border-white/[0.07] first:mt-0 first:pt-0 first:border-0';
export const AGENT_SHELL_NAV_GROUP_LABEL =
    'px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30';

export const AGENT_NAV_LINK =
    'portal-nav-link group/nav relative flex items-center gap-3 min-h-[2.75rem] px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer select-none';
export const AGENT_NAV_LINK_IDLE =
    'text-white/60 hover:text-white hover:bg-white/[0.07]';
export const AGENT_NAV_LINK_ACTIVE =
    'portal-nav-link-active bg-white text-gold shadow-[0_1px_3px_rgba(0,0,0,0.14)]';
export const AGENT_NAV_ICON =
    'w-[1.25rem] h-[1.25rem] shrink-0 opacity-80 group-hover/nav:opacity-100 transition-opacity duration-200';
export const AGENT_NAV_ICON_ACTIVE = 'w-[1.25rem] h-[1.25rem] shrink-0 text-gold';
export const AGENT_NAV_LABEL = 'flex-1 truncate leading-none tracking-[-0.01em]';

export const AGENT_PAGE_HEADER_BAND =
    'bg-white border-b border-charcoal/[0.06] shadow-elevation-xs';

export const AGENT_CARD =
    `${UI_CARD_SURFACE} rounded-3xl bg-white overflow-hidden`;

export const AGENT_CARD_SOFT =
    `${UI_CARD_SURFACE} rounded-3xl bg-white`;

export const AGENT_STAT_CARD =
    `group ${UI_CARD_SURFACE} ${UI_CARD_INTERACTIVE} flex flex-col justify-between h-full min-h-[160px] rounded-3xl bg-white p-6 sm:p-7 text-left`;

export const AGENT_STAT_ICON =
    `w-12 h-12 rounded-2xl bg-charcoal/[0.03] border border-charcoal/[0.08] flex items-center justify-center shrink-0 group-hover:bg-gold/[0.06] group-hover:border-gold/10 ${UI_TRANSITION_MODERATE}`;

/** Dashboard rhythm & hierarchy — polish only; widgets stay put */
export const AGENT_DASH_STACK = 'flex flex-col gap-10 sm:gap-12';
export const AGENT_DASH_SECTION = 'mb-10 sm:mb-12';
export const AGENT_DASH_SECTION_TITLE =
    'text-xl sm:text-2xl font-semibold text-charcoal tracking-tight';
export const AGENT_DASH_SECTION_SUB =
    'text-sm text-charcoal/45 mt-1.5 leading-relaxed';
export const AGENT_DASH_WIDGET = `${UI_CARD_SURFACE} rounded-3xl bg-white p-6 sm:p-7`;
export const AGENT_DASH_WIDGET_LG = `${UI_CARD_SURFACE} rounded-3xl bg-white p-6 sm:p-8`;
export const AGENT_DASH_STAT_LABEL =
    'text-[11px] sm:text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/45 mb-2.5';
export const AGENT_DASH_STAT_VALUE =
    'text-charcoal font-bold text-[2rem] sm:text-4xl tabular-nums tracking-tight leading-none';
export const AGENT_DASH_STAT_VALUE_MD =
    'text-charcoal font-bold text-2xl sm:text-3xl tabular-nums tracking-tight leading-none';
export const AGENT_DASH_STAT_HINT =
    'text-charcoal/40 text-xs mt-2.5 leading-snug';
export const AGENT_DASH_EMPTY =
    'text-center py-14 sm:py-16 px-4';
export const AGENT_DASH_EMPTY_ICON =
    'w-14 h-14 rounded-2xl bg-charcoal/[0.04] border border-charcoal/[0.08] flex items-center justify-center mx-auto mb-4';
export const AGENT_DASH_EMPTY_TITLE =
    'text-charcoal font-semibold text-base sm:text-lg tracking-tight';
export const AGENT_DASH_EMPTY_DESC =
    'text-charcoal/45 text-sm mt-2 max-w-sm mx-auto leading-relaxed';
export const AGENT_DASH_QUICK_ACTION =
    `${UI_CARD_SURFACE} ${UI_CARD_INTERACTIVE} rounded-3xl bg-white p-5 sm:p-6 text-center group`;
export const AGENT_DASH_ACTIVITY_ROW =
    'text-sm pb-4 mb-4 border-b border-charcoal/[0.08] last:border-0 last:pb-0 last:mb-0';
export const AGENT_DASH_LINK =
    'link-animated text-sm font-semibold text-gold hover:text-gold-600 transition-colors shrink-0';

export const AGENT_BADGE =
    'badge-interactive inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium whitespace-nowrap';

export const AGENT_TABLE_HEAD =
    'text-left py-4 px-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal/45';

export const AGENT_TABLE_CELL = 'py-5 px-6 align-middle';

export const AGENT_TABLE_ROW =
    `table-row-interactive hover:bg-charcoal/[0.028] ${UI_TRANSITION_FAST} group cursor-pointer`;
export const AGENT_VIEW_BTN =
    `${UI_BTN_BASE} ${UI_BTN_SIZE_SM} ${UI_BTN_DISABLED} ${UI_BTN_BUSY} text-gold bg-gold/[0.06] hover:bg-gold/10 border border-gold/10 hover:border-gold/20 shadow-btn hover:shadow-btn-hover`;

export const AGENT_CARD_HEADER =
    'px-6 sm:px-8 pt-7 sm:pt-8 pb-5 sm:pb-6 border-b border-charcoal/[0.08]';

export const AGENT_CARD_TOOLBAR =
    'px-6 sm:px-8 py-5 sm:py-6 border-b border-charcoal/[0.08]';

export const AGENT_CARD_BODY = 'px-4 sm:px-6 py-4 sm:py-5';

export const AGENT_CARD_FOOTER =
    'text-charcoal/40 text-xs px-6 sm:px-8 py-5 border-t border-charcoal/[0.08] leading-relaxed';

export const AGENT_SEARCH_INPUT =
    `form-control w-full pl-11 pr-4 py-3 rounded-2xl text-charcoal text-sm`;

export const AGENT_SELECT =
    `form-control w-full sm:w-auto min-w-[140px] px-4 py-3 rounded-2xl text-charcoal text-sm`;

export const AGENT_SEGMENT_WRAP =
    'inline-flex p-1 rounded-full bg-charcoal/[0.04] border border-charcoal/[0.06]';

export const agentSegmentBtn = (active: boolean) =>
    `${UI_BTN_BASE} px-5 h-9 min-h-9 rounded-full text-sm font-semibold tracking-[-0.01em] ${
        active
            ? 'bg-white text-charcoal shadow-btn'
            : 'text-charcoal/50 hover:text-charcoal hover:bg-white/70 shadow-none'
    }`;

export const AGENT_REFRESH_BTN =
    `${UI_BTN_OUTLINE} ${UI_BTN_SIZE_MD} border border-charcoal/[0.08] bg-white text-charcoal/60 ${UI_HOVER_SURFACE}`;

export const AGENT_PRIMARY_BTN =
    `${UI_BTN_FILLED} ${UI_BTN_SIZE_MD} bg-gold text-white hover:bg-gold`;

export const AGENT_PRIMARY_BTN_LG =
    `${UI_BTN_FILLED} ${UI_BTN_SIZE_LG} bg-gold text-white hover:bg-gold`;

/** Landing / marketing only — same recipe as primary, larger hit target */
export const AGENT_MARKETING_CTA =
    `${UI_BTN_FILLED} ${UI_BTN_SIZE_XL} bg-gold text-white hover:bg-gold`;

export const AGENT_SECONDARY_BTN =
    `${UI_BTN_OUTLINE} ${UI_BTN_SIZE_MD} border border-charcoal/[0.08] bg-white text-charcoal/70 ${UI_HOVER_SURFACE}`;

export const AGENT_DANGER_BTN =
    `${UI_BTN_BASE} ${UI_BTN_SIZE_MD} ${UI_BTN_DISABLED} ${UI_BTN_BUSY} bg-red-600 text-white hover:bg-red-600 shadow-btn hover:shadow-btn-hover`;

export const AGENT_SUCCESS_BTN =
    `${UI_BTN_BASE} ${UI_BTN_SIZE_MD} ${UI_BTN_DISABLED} ${UI_BTN_BUSY} bg-emerald-600 text-white hover:bg-emerald-600 shadow-btn hover:shadow-btn-hover`;

export const AGENT_ICON_BTN =
    `${UI_BTN_OUTLINE} ${UI_BTN_SIZE_ICON} border border-charcoal/[0.08] bg-white text-charcoal/60 ${UI_HOVER_SURFACE}`;

export const AGENT_MODAL_BACKDROP =
    'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]';

export const AGENT_MODAL_PANEL =
    `relative w-full max-w-lg max-h-[90vh] overflow-y-auto ${UI_CARD_SURFACE} rounded-3xl bg-white shadow-elevation-xl`;

export const AGENT_MODAL_PANEL_LG =
    `relative w-full max-w-2xl max-h-[90vh] overflow-y-auto ${UI_CARD_SURFACE} rounded-3xl bg-white shadow-elevation-xl`;

export const AGENT_EMPTY_ICON =
    'w-16 h-16 rounded-2xl bg-charcoal/[0.04] border border-charcoal/[0.08] flex items-center justify-center mx-auto mb-4';

export const AGENT_INNER_CARD =
    `${UI_CARD_SURFACE} ${UI_CARD_INTERACTIVE} rounded-2xl bg-white p-5 md:p-6`;

export const AGENT_PLAN_CARD =
    `${UI_CARD_SURFACE} ${UI_CARD_INTERACTIVE} rounded-2xl p-5 border block h-full bg-white`;

export const AGENT_PLAN_CARD_CURRENT =
    `${UI_CARD_SURFACE} ${UI_CARD_INTERACTIVE} rounded-2xl p-5 border block h-full bg-white border-gold/25 shadow-elevation-gold ring-1 ring-gold/10`;

export const AGENT_SECTION_LABEL =
    'text-sm font-semibold text-charcoal uppercase tracking-[0.08em]';

export const AGENT_MODULE_CARD =
    `group ${UI_CARD_SURFACE} ${UI_CARD_INTERACTIVE} relative flex flex-col h-full rounded-3xl bg-white p-6 sm:p-7 overflow-hidden`;

export const AGENT_MODULE_CARD_ICON =
    `w-11 h-11 rounded-2xl bg-gradient-to-br from-charcoal/[0.04] to-charcoal/[0.01] border border-charcoal/[0.08] flex items-center justify-center shrink-0 group-hover:from-gold/[0.12] group-hover:to-gold/[0.04] group-hover:border-gold/20 ${UI_TRANSITION_MODERATE}`;

export const AGENT_LEARN_ARTICLE =
    `${UI_CARD_SURFACE} overflow-hidden rounded-2xl bg-white`;

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
    `relative mt-14 sm:mt-16 ${UI_CARD_SURFACE} rounded-3xl overflow-hidden`;

export const AGENT_FORM_SECTION =
    `${UI_CARD_SURFACE} rounded-3xl bg-white overflow-hidden mb-6`;

export const AGENT_FORM_SECTION_HEADER =
    'px-6 md:px-8 py-5 sm:py-6 border-b border-charcoal/[0.08] bg-charcoal/[0.015]';

/** Plain field (no leading icon) — use in modals & selects */
export const AGENT_INPUT =
    `form-control w-full px-4 py-2.5 rounded-2xl text-charcoal text-sm`;

export const AGENT_FORM_INPUT =
    `form-control w-full pl-10 pr-4 py-2.5 rounded-2xl text-charcoal`;

export const AGENT_FORM_LABEL = 'form-label';

export const AGENT_FORM_HINT = 'form-hint';

export const AGENT_FORM_ERROR = 'form-error';

export const agentFormInput = (hasError?: boolean) =>
    `${AGENT_FORM_INPUT}${hasError ? ' form-control-error' : ''}`;

export const agentInput = (hasError?: boolean) =>
    `${AGENT_INPUT}${hasError ? ' form-control-error' : ''}`;

export const AGENT_FORM_FOOTER =
    'pt-6 mt-2 border-t border-charcoal/[0.06]';

export const AGENT_PANEL_HEADER =
    'relative px-6 sm:px-8 py-5 sm:py-6 border-b border-charcoal/[0.06] bg-charcoal/[0.015]';

export const AGENT_PANEL_BODY = 'px-6 sm:px-8 py-6 bg-white';

export const AGENT_CALLOUT =
    'rounded-2xl border border-gold/15 bg-gold/[0.04] p-5 sm:p-6 shadow-card';
